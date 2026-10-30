from __future__ import annotations
from urllib.parse import urlparse
from app.services.github_client import fetch_repository, GitHubAPIError


def parse_github_url(url: str) -> tuple[str, str]:
    """
    Parse a GitHub repository URL and return (owner, repo).
    Raises ValueError for invalid URLs.
    """
    parsed = urlparse(url.strip())
    if parsed.scheme not in ("https", "http"):
        raise ValueError("URL must use https scheme.")
    if parsed.hostname != "github.com":
        raise ValueError("URL must be from github.com.")
    parts = [p for p in parsed.path.strip("/").split("/") if p]
    if len(parts) < 2:
        raise ValueError("URL must include owner and repository name.")
    owner = parts[0]
    repo = parts[1].removesuffix(".git")
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
        "visibility": data.get("visibility", "public"),
    }
