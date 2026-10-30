from __future__ import annotations
from datetime import datetime, timezone

NEGATIVE_LABELS: set[str] = {
    "wontfix", "invalid", "duplicate", "not planned",
    "won't fix", "wont fix", "stale",
}


def _label_names(issue: dict) -> set[str]:
    return {
        label.get("name", "").strip().lower()
        for label in issue.get("labels", [])
    }


def is_eligible(issue: dict) -> bool:
    """
    Return True if the issue is a candidate for recommendation.
    Rules:
    - Must be open
    - Must not be a pull request
    - Must not have an assignee
    - Must not carry a negative label
    - Must have a meaningful title (>= 8 chars) and body (>= 30 chars)
    """
    if issue.get("state") != "open":
        return False
    if issue.get("pull_request"):
        return False
    if issue.get("assignee") is not None:
        return False
    if issue.get("assignees"):
        return False

    labels = _label_names(issue)
    if labels & NEGATIVE_LABELS:
        return False

    title = (issue.get("title") or "").strip()
    body = (issue.get("body") or "").strip()
    if len(title) < 8:
        return False
    if len(body) < 30:
        return False

    return True


def filter_issues(issues: list[dict]) -> list[dict]:
    """Return only eligible issues."""
    return [issue for issue in issues if is_eligible(issue)]
