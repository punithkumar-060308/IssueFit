from __future__ import annotations
import httpx
from app.config import GITHUB_TOKEN

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
