from __future__ import annotations


def _label_names(issue: dict) -> set[str]:
    return {
        label.get("name", "").strip().lower()
        for label in issue.get("labels", [])
    }


EASY_LABELS: set[str] = {
    "good first issue", "first-timers-only", "beginner",
    "documentation", "docs", "typo", "starter", "easy",
}

HARD_TERMS: list[str] = [
    "architecture", "migration", "performance overhaul",
    "concurrency", "breaking change", "backwards compatibility",
    "security", "cryptography", "distributed", "kernel",
    "memory leak", "race condition", "deadlock",
]

MEDIUM_TERMS: list[str] = [
    "feature", "enhancement", "improvement", "refactor",
    "integration", "api", "endpoint", "database",
]


def estimate_difficulty(issue: dict) -> str:
    """
    Return 'Easy', 'Medium', or 'Hard'.
    Based on labels, title, and body content.
    """
    labels = _label_names(issue)
    title = (issue.get("title") or "").lower()
    body = (issue.get("body") or "").lower()
    text = f"{title} {body}"

    # Easy: explicit beginner labels or documentation/typo tasks
    if labels & EASY_LABELS:
        return "Easy"

    # Easy: short body, no complex terms, simple description
    if len(body) < 200 and not any(term in text for term in HARD_TERMS):
        # Check for documentation/typo signals in title
        if any(w in title for w in ["typo", "spelling", "readme", "doc", "comment", "example"]):
            return "Easy"

    # Hard: complex terms present
    if any(term in text for term in HARD_TERMS):
        return "Hard"

    # Default: Medium
    return "Medium"
