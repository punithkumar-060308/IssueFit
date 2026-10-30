from __future__ import annotations
from datetime import datetime, timezone


POSITIVE_LABELS: set[str] = {
    "good first issue", "help wanted", "documentation",
    "first-timers-only", "beginner", "easy", "starter",
}


def _label_names(issue: dict) -> set[str]:
    return {
        label.get("name", "").strip().lower()
        for label in issue.get("labels", [])
    }


def _freshness_score(issue: dict, max_score: int = 20) -> int:
    """
    Score based on how recently the issue was updated.
    - Updated within 7 days: full score
    - Updated within 30 days: 75%
    - Updated within 90 days: 50%
    - Older: 25%
    """
    updated_str = issue.get("updated_at")
    if not updated_str:
        return max_score // 2

    try:
        updated = datetime.fromisoformat(updated_str.replace("Z", "+00:00"))
        age_days = (datetime.now(timezone.utc) - updated).days
    except (ValueError, TypeError):
        return max_score // 2

    if age_days <= 7:
        return max_score
    if age_days <= 30:
        return int(max_score * 0.75)
    if age_days <= 90:
        return int(max_score * 0.50)
    return int(max_score * 0.25)


def calculate_quality_score(issue: dict) -> int:
    """
    Score an issue from 0-100 based on:
      - Clarity & actionability (35 pts)
      - Scope & boundedness    (25 pts)
      - Context & description  (20 pts)
      - Freshness              (20 pts)
    """
    title = (issue.get("title") or "").strip()
    body = (issue.get("body") or "").strip()
    text = body.lower()
    labels = _label_names(issue)

    # --- Clarity (max 35) ---
    clarity = 5  # baseline
    if len(title) >= 15:
        clarity += 10
    if len(title) >= 30:
        clarity += 5
    clarity_keywords = [
        "expected", "actual", "steps to reproduce", "acceptance criteria",
        "expected behavior", "actual behavior", "how to reproduce",
    ]
    matches = sum(1 for kw in clarity_keywords if kw in text)
    clarity += min(matches * 5, 15)
    clarity = min(clarity, 35)

    # --- Scope (max 25) ---
    scope = 5  # baseline
    if labels & POSITIVE_LABELS:
        scope += 15
    # Negative scope signals: very long body without structure (wall of text)
    if len(body) > 3000 and "```" not in body and "\n-" not in body:
        scope -= 5
    broad_terms = ["refactor entire", "rewrite", "major overhaul", "redesign everything"]
    if any(t in text for t in broad_terms):
        scope -= 5
    scope = max(0, min(scope, 25))

    # --- Context (max 20) ---
    context = 3  # baseline
    if len(body) >= 150:
        context += 7
    if "```" in body:
        context += 5
    if "steps to reproduce" in text or "reproduction" in text:
        context += 5
    context = min(context, 20)

    # --- Freshness (max 20) ---
    freshness = _freshness_score(issue, max_score=20)

    total = clarity + scope + context + freshness
    return min(100, max(0, total))
