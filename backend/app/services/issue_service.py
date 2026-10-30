from __future__ import annotations
from app.services.github_client import fetch_open_issues
from app.config import MAX_GITHUB_ITEMS


async def get_open_issues(owner: str, repo: str) -> list[dict]:
    """Fetch up to MAX_GITHUB_ITEMS open issues from a repository."""
    return await fetch_open_issues(owner, repo, limit=MAX_GITHUB_ITEMS)
