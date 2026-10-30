import pytest
from app.core.quality_scoring import calculate_quality_score
from app.core.difficulty import estimate_difficulty
from app.core.skill_matching import calculate_skill_match
from app.core.recommender import calculate_final_score


def make_issue(**kwargs):
    base = {
        "state": "open",
        "assignee": None,
        "assignees": [],
        "labels": [],
        "title": "Fix the navigation bar on mobile",
        "body": "The navigation bar breaks on mobile. Steps to reproduce: open the app on a phone. Expected: bar shows. Actual: bar collapses.",
        "updated_at": "2026-10-25T10:00:00Z",
    }
    base.update(kwargs)
    return base


def test_quality_score_in_range():
    issue = make_issue()
    score = calculate_quality_score(issue)
    assert 0 <= score <= 100


def test_quality_score_with_good_issue():
    issue = make_issue(
        labels=[{"name": "good first issue"}],
        body="Steps to reproduce: do X. Expected behavior: Y. Actual behavior: Z. " + "a" * 200,
    )
    score = calculate_quality_score(issue)
    assert score >= 50


def test_quality_score_is_always_int():
    issue = make_issue()
    assert isinstance(calculate_quality_score(issue), int)


def test_difficulty_easy_with_label():
    issue = make_issue(labels=[{"name": "good first issue"}])
    assert estimate_difficulty(issue) == "Easy"


def test_difficulty_hard_with_term():
    issue = make_issue(body="This is a major architecture migration with concurrency concerns. " * 5)
    assert estimate_difficulty(issue) == "Hard"


def test_difficulty_medium_default():
    issue = make_issue()
    assert estimate_difficulty(issue) in ("Easy", "Medium", "Hard")


def test_skill_match_no_profile():
    issue = make_issue()
    score = calculate_skill_match(
        {"languages": [], "topics": [], "profile_confidence": "low"},
        issue,
        None,
    )
    assert 0 <= score <= 100


def test_skill_match_python_repo():
    issue = make_issue(body="Fix the Python type hints in this fastapi endpoint. " * 3)
    profile = {"languages": ["Python"], "topics": ["fastapi", "web"], "profile_confidence": "high"}
    score = calculate_skill_match(profile, issue, "Python")
    assert score >= 50


def test_final_score_formula():
    assert calculate_final_score(80, 60) == round(0.6 * 80 + 0.4 * 60)


def test_final_score_in_range():
    for q in range(0, 101, 10):
        for s in range(0, 101, 10):
            result = calculate_final_score(q, s)
            assert 0 <= result <= 100


def test_no_more_than_five_recommendations():
    from app.core.recommender import rank_issues
    issues = []
    for i in range(20):
        issues.append(make_issue(
            number=i,
            title=f"Fix bug number {i} in the navigation",
            html_url=f"https://github.com/owner/repo/issues/{i}",
        ))
    profile = {"languages": ["Python"], "topics": [], "profile_confidence": "medium"}
    ranked = rank_issues(issues, profile, "Python")
    assert len(ranked) <= 5


def test_recommendations_sorted_by_score():
    from app.core.recommender import rank_issues
    issues = []
    for i in range(10):
        issues.append(make_issue(
            number=i,
            title=f"Fix bug number {i} in the navigation bar component",
            html_url=f"https://github.com/owner/repo/issues/{i}",
        ))
    profile = {"languages": ["Python"], "topics": [], "profile_confidence": "medium"}
    ranked = rank_issues(issues, profile, "Python")
    scores = [r["final_score"] for r in ranked]
    assert scores == sorted(scores, reverse=True)
