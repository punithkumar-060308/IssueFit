from __future__ import annotations

SKILL_KEYWORDS: dict[str, list[str]] = {
    "python": ["python", "fastapi", "django", "flask", "pytest", "asyncio", "pydantic", "sqlalchemy", "celery"],
    "javascript": ["javascript", "js", "node", "node.js", "nodejs", "express", "jest"],
    "typescript": ["typescript", "ts", "deno"],
    "react": ["react", "jsx", "tsx", "nextjs", "next.js", "gatsby"],
    "vue": ["vue", "vuex", "nuxt"],
    "angular": ["angular", "rxjs"],
    "java": ["java", "spring", "maven", "gradle", "junit"],
    "go": ["golang", "go", "gin", "goroutine"],
    "rust": ["rust", "cargo", "tokio"],
    "ruby": ["ruby", "rails", "rspec"],
    "php": ["php", "laravel", "symfony"],
    "csharp": ["c#", "csharp", "dotnet", ".net", "asp.net"],
    "cpp": ["c++", "cpp", "cmake"],
    "c": [" c ", "c language", "gcc", "make"],
    "documentation": ["docs", "documentation", "readme", "wiki", "mkdocs", "sphinx"],
    "testing": ["test", "testing", "pytest", "unittest", "jest", "mocha", "coverage"],
    "devops": ["docker", "kubernetes", "k8s", "ci/cd", "github actions", "terraform", "ansible"],
    "database": ["sql", "postgres", "postgresql", "mysql", "mongodb", "redis", "sqlite"],
    "frontend": ["html", "css", "sass", "tailwind", "webpack", "vite"],
    "ml": ["machine learning", "ml", "pytorch", "tensorflow", "keras", "sklearn", "scikit-learn"],
}


def _normalize(text: str) -> str:
    return text.lower().replace("-", " ").replace("_", " ")


def calculate_skill_match(contributor_profile: dict, issue: dict, repo_language: str | None = None) -> int:
    """
    Compare contributor inferred skills against issue signals.
    Returns 0-100.
    """
    languages: list[str] = [l.lower() for l in contributor_profile.get("languages", [])]
    topics: list[str] = [_normalize(t) for t in contributor_profile.get("topics", [])]
    confidence = contributor_profile.get("profile_confidence", "low")

    if not languages and not topics:
        # No public data: return neutral low-confidence score
        return 20

    # Build contributor skill set
    contributor_skills: set[str] = set()
    for lang in languages:
        contributor_skills.add(lang)
        for skill, keywords in SKILL_KEYWORDS.items():
            if any(kw in lang for kw in keywords):
                contributor_skills.add(skill)
    for topic in topics:
        for skill, keywords in SKILL_KEYWORDS.items():
            if any(kw in topic for kw in keywords):
                contributor_skills.add(skill)

    # Build issue signal text
    issue_title = _normalize(issue.get("title") or "")
    issue_body = _normalize(issue.get("body") or "")
    issue_label_text = " ".join(
        _normalize(label.get("name", ""))
        for label in issue.get("labels", [])
    )
    repo_lang_normalized = _normalize(repo_language or "")
    issue_text = f"{issue_title} {issue_body} {issue_label_text} {repo_lang_normalized}"

    # Count matches
    matched: list[str] = []
    for skill in contributor_skills:
        for kw in SKILL_KEYWORDS.get(skill, [skill]):
            if kw in issue_text:
                matched.append(skill)
                break

    # Direct language match (stronger signal)
    exact_lang_match = False
    if repo_language and repo_language.lower() in [l.lower() for l in contributor_profile.get("languages", [])]:
        exact_lang_match = True

    if not contributor_skills:
        return 20

    match_ratio = len(set(matched)) / max(len(contributor_skills), 1)
    base_score = int(match_ratio * 70)

    # Bonus for exact language match
    if exact_lang_match:
        base_score = min(100, base_score + 20)

    # Boost for documentation/testing tasks (universally accessible)
    label_names = {l.get("name", "").lower() for l in issue.get("labels", [])}
    if label_names & {"documentation", "docs", "good first issue", "help wanted"}:
        base_score = min(100, base_score + 10)

    # Confidence adjustment
    if confidence == "low":
        base_score = max(20, int(base_score * 0.75))
    elif confidence == "medium":
        base_score = max(25, int(base_score * 0.90))

    return min(100, max(0, base_score))
