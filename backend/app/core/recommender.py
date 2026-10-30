from __future__ import annotations
from app.core.quality_scoring import calculate_quality_score
from app.core.difficulty import estimate_difficulty
from app.core.skill_matching import calculate_skill_match


SCORING_VERSION = "1.0"


def calculate_final_score(quality_score: int, skill_match: int) -> int:
    return round(0.60 * quality_score + 0.40 * skill_match)


def _generate_reason(
    issue: dict,
    quality_score: int,
    skill_match: int,
    difficulty: str,
    contributor_profile: dict,
    repo_language: str | None,
) -> str:
    parts: list[str] = []

    body = (issue.get("body") or "").lower()
    title = (issue.get("title") or "").lower()
    labels = {l.get("name", "").lower() for l in issue.get("labels", [])}

    # Quality signals
    if quality_score >= 75:
        parts.append("Well-described issue with clear context")
    elif quality_score >= 50:
        parts.append("Reasonably described issue")
    else:
        parts.append("Issue has limited description")

    # Clarity signals
    if any(kw in body for kw in ["steps to reproduce", "expected behavior", "acceptance criteria"]):
        parts.append("includes reproduction steps or acceptance criteria")

    # Difficulty
    parts.append(f"estimated difficulty is {difficulty}")

    # Beginner labels
    beginner_labels = labels & {"good first issue", "first-timers-only", "beginner", "help wanted"}
    if beginner_labels:
        parts.append(f"labelled '{next(iter(beginner_labels))}'")

    # Skill match
    profile_langs = contributor_profile.get("languages", [])
    confidence = contributor_profile.get("profile_confidence", "low")
    if skill_match >= 70 and profile_langs:
        parts.append(
            f"matches {profile_langs[0]} activity in the public profile"
        )
    elif skill_match >= 40 and profile_langs:
        parts.append(
            f"partial match with public {', '.join(profile_langs[:2])} repositories"
        )
    elif skill_match < 40:
        if confidence == "low":
            parts.append("limited public profile data for precise matching")
        else:
            parts.append("technology overlap is limited")

    # Documentation boost
    if "documentation" in labels or "docs" in labels:
        parts.append("documentation tasks are accessible to most contributors")

    return ". ".join(p.capitalize() for p in parts) + "."


def rank_issues(
    eligible_issues: list[dict],
    contributor_profile: dict,
    repo_language: str | None,
    top_n: int = 5,
) -> list[dict]:
    """
    Score and rank eligible issues, returning at most top_n.
    Each item in the returned list is an enriched dict ready for serialization.
    """
    scored: list[dict] = []

    for issue in eligible_issues:
        quality = calculate_quality_score(issue)
        skill = calculate_skill_match(contributor_profile, issue, repo_language)
        final = calculate_final_score(quality, skill)
        difficulty = estimate_difficulty(issue)
        reason = _generate_reason(
            issue, quality, skill, difficulty, contributor_profile, repo_language
        )

        labels = [l.get("name", "") for l in issue.get("labels", [])]
        assignee_login = None
        if issue.get("assignee"):
            assignee_login = issue["assignee"].get("login")

        scored.append({
            "number": issue["number"],
            "title": issue.get("title", ""),
            "quality_score": quality,
            "skill_match": skill,
            "final_score": final,
            "difficulty": difficulty,
            "reason": reason,
            "url": issue.get("html_url", f"https://github.com/issues/{issue['number']}"),
            "labels": labels,
            "state": issue.get("state", "open"),
            "assignee": assignee_login,
            "updated_at": issue.get("updated_at"),
            "language": repo_language,
        })

    # Sort by final_score desc, then quality_score desc as tiebreaker
    scored.sort(key=lambda x: (x["final_score"], x["quality_score"]), reverse=True)
    return scored[:top_n]
