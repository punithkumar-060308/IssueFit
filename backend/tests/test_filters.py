import pytest
from app.core.filters import is_eligible, filter_issues


def make_issue(**kwargs):
    base = {
        "state": "open",
        "pull_request": None,
        "assignee": None,
        "assignees": [],
        "labels": [],
        "title": "Fix the broken navigation bar",
        "body": "The navigation bar breaks on mobile screens. Steps to reproduce: open on phone.",
    }
    base.update(kwargs)
    return base


def test_eligible_issue():
    issue = make_issue()
    assert is_eligible(issue) is True


def test_closed_issue_excluded():
    issue = make_issue(state="closed")
    assert is_eligible(issue) is False


def test_pull_request_excluded():
    issue = make_issue(pull_request={"url": "https://github.com/..."})
    assert is_eligible(issue) is False


def test_assigned_issue_excluded():
    issue = make_issue(assignee={"login": "someone"})
    assert is_eligible(issue) is False


def test_assignees_list_excluded():
    issue = make_issue(assignees=[{"login": "someone"}])
    assert is_eligible(issue) is False


def test_wontfix_label_excluded():
    issue = make_issue(labels=[{"name": "wontfix"}])
    assert is_eligible(issue) is False


def test_invalid_label_excluded():
    issue = make_issue(labels=[{"name": "invalid"}])
    assert is_eligible(issue) is False


def test_duplicate_label_excluded():
    issue = make_issue(labels=[{"name": "duplicate"}])
    assert is_eligible(issue) is False


def test_short_title_excluded():
    issue = make_issue(title="Bug")
    assert is_eligible(issue) is False


def test_short_body_excluded():
    issue = make_issue(body="Short.")
    assert is_eligible(issue) is False


def test_filter_issues_returns_only_eligible():
    issues = [
        make_issue(),
        make_issue(state="closed"),
        make_issue(assignee={"login": "x"}),
        make_issue(labels=[{"name": "wontfix"}]),
    ]
    result = filter_issues(issues)
    assert len(result) == 1
