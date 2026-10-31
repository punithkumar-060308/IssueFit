from __future__ import annotations
import base64
import logging
import httpx
from app.config import GITHUB_TOKEN

logger = logging.getLogger("issuefit.github")
GITHUB_API = "https://api.github.com"


class GitHubAPIError(Exception):
    def __init__(self, status_code: int, message: str, code: str = "GITHUB_UNAVAILABLE"):
        self.status_code = status_code
        self.message = message
        self.code = code
        super().__init__(message)


def _get_headers() -> dict[str, str]:
    headers: dict[str, str] = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if GITHUB_TOKEN:
        headers["Authorization"] = f"Bearer {GITHUB_TOKEN}"
    return headers


def _map_status_to_code(status_code: int) -> str:
    if status_code == 404:
        return "NOT_FOUND"
    if status_code in (403, 429):
        return "GITHUB_RATE_LIMIT"
    if status_code >= 500:
        return "GITHUB_UNAVAILABLE"
    return "GITHUB_UNAVAILABLE"


async def _github_get(path: str, params: dict | None = None) -> dict | list:
    try:
        async with httpx.AsyncClient(
            base_url=GITHUB_API,
            headers=_get_headers(),
            timeout=20.0,
        ) as client:
            response = await client.get(path, params=params)

        if response.status_code >= 400:
            try:
                message = response.json().get("message", "GitHub request failed")
            except Exception:
                message = "GitHub request failed"
            raise GitHubAPIError(
                response.status_code,
                message,
                code=_map_status_to_code(response.status_code),
            )

        return response.json()
    except httpx.TimeoutException:
        raise GitHubAPIError(504, "GitHub request timed out", code="GITHUB_UNAVAILABLE")
    except httpx.RequestError as exc:
        raise GitHubAPIError(502, f"Network error: {exc}", code="GITHUB_UNAVAILABLE")


async def fetch_user(username: str) -> dict:
    result = await _github_get(f"/users/{username}")
    return result  # type: ignore[return-value]


async def fetch_repository(owner: str, repo: str) -> dict:
    result = await _github_get(f"/repos/{owner}/{repo}")
    return result  # type: ignore[return-value]


async def fetch_user_repos(username: str, limit: int = 30) -> list[dict]:
    result = await _github_get(
        f"/users/{username}/repos",
        params={"per_page": min(limit, 100), "sort": "pushed", "direction": "desc", "type": "owner"},
    )
    return result[:limit]  # type: ignore[index]


async def fetch_open_issues(owner: str, repo: str, limit: int = 300) -> list[dict]:
    results: list[dict] = []
    pages = (limit + 99) // 100
    for page in range(1, pages + 1):
        batch = await _github_get(
            f"/repos/{owner}/{repo}/issues",
            params={
                "state": "open",
                "per_page": 100,
                "page": page,
                "sort": "updated",
                "direction": "desc",
            },
        )
        if not batch:
            break
        results.extend(batch)  # type: ignore[arg-type]
        if len(batch) < 100:  # type: ignore[arg-type]
            break
        if len(results) >= limit:
            break
    return results[:limit]


async def fetch_single_issue(owner: str, repo: str, issue_number: int) -> dict:
    """Fetch details for a specific issue from GitHub."""
    result = await _github_get(f"/repos/{owner}/{repo}/issues/{issue_number}")
    if isinstance(result, dict) and result.get("pull_request") is not None:
        raise GitHubAPIError(404, f"Item #{issue_number} is a pull request, not an issue.", code="NOT_FOUND")
    return result  # type: ignore[return-value]


async def fetch_issue_comments(owner: str, repo: str, issue_number: int, limit: int = 10) -> list[dict]:
    """Fetch comments for a specific issue (best-effort, returns empty list on error)."""
    try:
        result = await _github_get(
            f"/repos/{owner}/{repo}/issues/{issue_number}/comments",
            params={"per_page": min(limit, 30), "direction": "asc"},
        )
        if isinstance(result, list):
            return result
        return []
    except Exception as e:
        logger.warning(f"Could not fetch comments for {owner}/{repo}#{issue_number}: {e}")
        return []


async def fetch_repository_readme(owner: str, repo: str) -> str | None:
    """Fetch repository README content decoded as string (best-effort, returns None if not found)."""
    try:
        result = await _github_get(f"/repos/{owner}/{repo}/readme")
        if isinstance(result, dict) and "content" in result:
            encoding = result.get("encoding", "base64")
            if encoding == "base64":
                raw_bytes = base64.b64decode(result["content"])
                return raw_bytes.decode("utf-8", errors="replace")
            return str(result.get("content"))
        return None
    except Exception as e:
        logger.warning(f"Could not fetch README for {owner}/{repo}: {e}")
        return None


async def fetch_repository_tree(owner: str, repo: str, branch: str = "main", max_files: int = 150) -> list[str]:
    """Fetch repository tree to get verified file paths for hallucination prevention."""
    try:
        result = await _github_get(
            f"/repos/{owner}/{repo}/git/trees/{branch}",
            params={"recursive": "1"},
        )
        if isinstance(result, dict) and "tree" in result:
            paths: list[str] = []
            for item in result.get("tree", []):
                p = item.get("path")
                if p:
                    paths.append(p)
                    if len(paths) >= max_files:
                        break
            return paths
        return []
    except Exception as e:
        logger.warning(f"Could not fetch git tree for {owner}/{repo} on branch {branch}: {e}")
        return []
