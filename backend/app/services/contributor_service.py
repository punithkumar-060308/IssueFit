from __future__ import annotations
from app.services.github_client import fetch_user, fetch_user_repos


async def build_contributor_profile(username: str) -> dict:
    """
    Fetch public GitHub user data and infer languages and topics from their
    public repositories. Returns a normalized profile dict.
    """
    user_data = await fetch_user(username)
    repos = await fetch_user_repos(username, limit=30)

    language_counts: dict[str, int] = {}
    topics: set[str] = set()

    for repo in repos:
        lang = repo.get("language")
        if lang:
            language_counts[lang] = language_counts.get(lang, 0) + 1
        for topic in repo.get("topics", []):
            topics.add(topic.lower())
        # Extract topics from repo name/description as lightweight signals
        name = (repo.get("name") or "").lower().replace("-", " ").replace("_", " ")
        description = (repo.get("description") or "").lower()
        for word in (name + " " + description).split():
            if len(word) > 3:
                topics.add(word)

    # Sort languages by usage count
    sorted_languages = sorted(language_counts, key=lambda l: language_counts[l], reverse=True)

    if not sorted_languages and not topics:
        confidence = "low"
    elif len(sorted_languages) >= 3 or len(repos) >= 10:
        confidence = "high"
    else:
        confidence = "medium"

    return {
        "username": user_data.get("login", username),
        "languages": sorted_languages,
        "topics": list(topics),
        "repositories_analyzed": len(repos),
        "profile_confidence": confidence,
        "bio": user_data.get("bio") or "",
    }
