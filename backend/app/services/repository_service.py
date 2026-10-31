from __future__ import annotations
import re
from urllib.parse import urlparse
from app.services.github_client import fetch_repository, GitHubAPIError


def parse_github_url(url: str) -> tuple[str, str]:
    """
    Parse a GitHub repository URL or owner/repo string and return (owner, repo).
    Accepts:
      - https://github.com/owner/repo
      - http://github.com/owner/repo
      - github.com/owner/repo
      - git@github.com:owner/repo.git
      - owner/repo
      - URLs with trailing /issues, /pulls, etc.
    """
    raw = url.strip()
    if not raw:
        raise ValueError("URL cannot be empty.")

    if "://" in raw:
        parsed = urlparse(raw)
        if parsed.netloc.lower() not in ("github.com", "www.github.com"):
            raise ValueError("Only GitHub URLs are supported.")

    # Strip SSH prefix git@github.com:
    if raw.startswith("git@github.com:"):
        raw = raw.replace("git@github.com:", "")

    # Strip protocols and domain if present
    raw = re.sub(r"^(?:https?:\/\/)?(?:www\.)?github\.com\/", "", raw, flags=re.IGNORECASE)

    # Strip query parameters and hash anchors
    raw = raw.split("?")[0].split("#")[0].rstrip("/")

    # Strip .git suffix
    if raw.endswith(".git"):
        raw = raw[:-4]

    parts = [p for p in raw.split("/") if p]
    if len(parts) < 2:
        raise ValueError("Please provide a valid GitHub repository URL (e.g. github.com/owner/repo or owner/repo).")

    owner = parts[0]
    repo = parts[1]
    return owner, repo


async def validate_and_fetch_repository(url: str) -> dict:
    """
    Validate a GitHub URL, fetch its metadata, and return a normalized dict.
    """
    owner, repo = parse_github_url(url)
    data = await fetch_repository(owner, repo)
    return {
        "full_name": data.get("full_name", f"{owner}/{repo}"),
        "description": data.get("description"),
        "default_branch": data.get("default_branch", "main"),
        "language": data.get("language"),
        "stargazers_count": data.get("stargazers_count", 0),
        "forks_count": data.get("forks_count", 0),
        "open_issues_count": data.get("open_issues_count", 0),
        "visibility": data.get("visibility", "public"),
        "owner": owner,
        "repo": repo,
    }
