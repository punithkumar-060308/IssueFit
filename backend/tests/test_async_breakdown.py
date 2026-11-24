"""
Unit and Integration tests for Asynchronous AI Issue Breakdown and Fallback.
Tests:
- Start async job returns immediately with 200 and initial stage
- Polling status endpoint reflects progression to completed
- Polling status returns cached result instantly on re-request
- Duplicate simultaneous requests share the same in-flight job (deduplication)
- Job cancellation halts job execution cleanly
- Graceful fallback produces valid grounded breakdown when AI provider fails
- Fallback preserves required schema fields (potential_challenges, learning_resources, etc.)
- Cache key incorporates ANALYSIS_VERSION
"""
import asyncio
import pytest
import pytest_asyncio
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.config import ANALYSIS_VERSION
from app.storage.cache import clear as clear_cache, get as cache_get
from app.auth.dependencies import require_github_connected_user
from app.services.ai_service import MockProvider, AIServiceUnavailableError
from app.services.breakdown_service import (
    get_breakdown_cache_key,
    generate_fallback_breakdown,
)
from app.services.job_manager import job_manager

MOCK_AUTH_USER = {
    "_id": "test_contributor_123",
    "name": "Alex Contributor",
    "email": "alex@example.com",
    "avatar_url": "https://avatars.githubusercontent.com/u/12345",
    "identities": {
        "github": {
            "id": 12345,
            "username": "alexdev",
            "profile_url": "https://github.com/alexdev",
        }
    },
    "github_connection": {
        "connected": True,
        "token_encrypted": "mock_encrypted_token",
        "scopes": ["read:user"],
    },
}

MOCK_ISSUE = {
    "number": 99,
    "title": "Optimize database query pool timeout in worker service",
    "body": "Under peak traffic, database queries in worker service time out prematurely. We need connection retry and exponential backoff.",
    "state": "open",
    "pull_request": None,
    "labels": [{"name": "performance"}, {"name": "good first issue"}],
    "html_url": "https://github.com/sample/sample-repo/issues/99",
    "updated_at": "2026-11-01T12:00:00Z",
}

MOCK_REPO = {
    "full_name": "sample/sample-repo",
    "language": "Python",
    "default_branch": "main",
    "description": "Sample worker service repository for testing",
}

MOCK_TREE = [
    "README.md",
    "requirements.txt",
    "sample/worker.py",
    "sample/database.py",
    "tests/test_worker.py",
]


@pytest_asyncio.fixture
async def ac():
    clear_cache()
    job_manager.clear()
    app.dependency_overrides[require_github_connected_user] = lambda: MOCK_AUTH_USER
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client
    app.dependency_overrides.clear()
    job_manager.clear()


def test_cache_key_includes_analysis_version():
    """Ensure cache key incorporates ANALYSIS_VERSION for clean cache busting."""
    key = get_breakdown_cache_key("sample", "repo", 99, "2026-11-01T12:00:00Z")
    assert f"v{ANALYSIS_VERSION}" in key
    assert "sample:repo:99" in key


def test_fallback_breakdown_structure():
    """Ensure deterministic fallback produces compliant breakdown with all schema fields."""
    breakdown = generate_fallback_breakdown(
        issue=MOCK_ISSUE,
        repo_data=MOCK_REPO,
        verified_files=MOCK_TREE,
        readme_excerpt="# Sample\nWorker documentation",
        reason="AI service offline",
    )
    assert breakdown.is_fallback is True
    assert breakdown.fallback_reason == "AI service offline"
    assert breakdown.simple_explanation != ""
    assert breakdown.actual_problem != ""
    assert len(breakdown.required_skills) > 0
    assert len(breakdown.prerequisites) > 0
    assert len(breakdown.implementation_steps) > 0
    assert breakdown.expected_outcome != ""
    assert breakdown.difficulty_level in ["easy", "medium", "hard", "Beginner", "Intermediate", "Advanced"]
    assert breakdown.difficulty_reasoning != ""
    assert len(breakdown.potential_challenges) > 0
    assert len(breakdown.learning_resources) > 0
    # Relevant files should be verified against tree
    for rf in breakdown.technical_context.relevant_files:
        assert rf.evidence_level == "verified"


@pytest.mark.asyncio
@patch("app.services.breakdown_service.fetch_single_issue", new_callable=AsyncMock, return_value=MOCK_ISSUE)
@patch("app.services.breakdown_service.fetch_repository", new_callable=AsyncMock, return_value=MOCK_REPO)
@patch("app.services.breakdown_service.fetch_issue_comments", new_callable=AsyncMock, return_value=[])
@patch("app.services.breakdown_service.fetch_repository_readme", new_callable=AsyncMock, return_value=None)
@patch("app.services.breakdown_service.fetch_repository_tree", new_callable=AsyncMock, return_value=MOCK_TREE)
@patch("app.services.breakdown_service.get_ai_provider", return_value=MockProvider())
async def test_async_breakdown_lifecycle(
    mock_ai, mock_tree, mock_readme, mock_comments, mock_repo, mock_issue, ac
):
    """Test start_job -> poll until completed -> verify structured results."""
    payload = {"owner": "sample", "repo": "sample-repo", "issue_number": 99}
    resp = await ac.post("/api/issues/breakdown/start", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    job_id = data["job_id"]
    assert bool(job_id)
    assert data["status"] in ["pending", "running", "completed"]

    # Poll status
    status_data = {}
    for _ in range(25):
        await asyncio.sleep(0.05)
        status_resp = await ac.get(f"/api/issues/breakdown/status/{job_id}")
        assert status_resp.status_code == 200
        status_data = status_resp.json()
        if status_data["status"] == "completed":
            break

    assert status_data["status"] == "completed"
    assert status_data["stage"] == "completed"
    assert status_data["breakdown"] is not None
    breakdown = status_data["breakdown"]
    assert "potential_challenges" in breakdown
    assert "learning_resources" in breakdown
    assert len(breakdown["learning_resources"]) > 0


@pytest.mark.asyncio
@patch("app.services.breakdown_service.fetch_single_issue", new_callable=AsyncMock, return_value=MOCK_ISSUE)
@patch("app.services.breakdown_service.fetch_repository", new_callable=AsyncMock, return_value=MOCK_REPO)
@patch("app.services.breakdown_service.fetch_issue_comments", new_callable=AsyncMock, return_value=[])
@patch("app.services.breakdown_service.fetch_repository_readme", new_callable=AsyncMock, return_value=None)
@patch("app.services.breakdown_service.fetch_repository_tree", new_callable=AsyncMock, return_value=MOCK_TREE)
@patch("app.services.breakdown_service.get_ai_provider", return_value=MockProvider())
async def test_duplicate_request_deduplication(
    mock_ai, mock_tree, mock_readme, mock_comments, mock_repo, mock_issue, ac
):
    """Ensure two simultaneous requests for the same issue return the exact same job ID."""
    payload = {"owner": "sample", "repo": "sample-repo", "issue_number": 99}
    resp1 = await ac.post("/api/issues/breakdown/start", json=payload)
    resp2 = await ac.post("/api/issues/breakdown/start", json=payload)

    assert resp1.status_code == 200
    assert resp2.status_code == 200
    assert resp1.json()["job_id"] == resp2.json()["job_id"]


@pytest.mark.asyncio
async def test_job_cancellation(ac):
    """Ensure cancelling an unknown or existing job works as expected."""
    # Unknown job -> 404
    resp = await ac.post("/api/issues/breakdown/cancel/nonexistent_job")
    assert resp.status_code == 404

    # Create dummy in-flight job and cancel
    job = await job_manager.start_job("sample", "sample-repo", 123)
    resp_cancel = await ac.post(f"/api/issues/breakdown/cancel/{job.job_id}")
    assert resp_cancel.status_code == 200
    assert resp_cancel.json()["status"] == "cancelled"


@pytest.mark.asyncio
@patch("app.services.breakdown_service.fetch_single_issue", new_callable=AsyncMock, return_value=MOCK_ISSUE)
@patch("app.services.breakdown_service.fetch_repository", new_callable=AsyncMock, return_value=MOCK_REPO)
@patch("app.services.breakdown_service.fetch_issue_comments", new_callable=AsyncMock, return_value=[])
@patch("app.services.breakdown_service.fetch_repository_readme", new_callable=AsyncMock, return_value=None)
@patch("app.services.breakdown_service.fetch_repository_tree", new_callable=AsyncMock, return_value=MOCK_TREE)
@patch("app.services.breakdown_service.get_ai_provider", return_value=MockProvider(fail_mode="unavailable"))
async def test_async_graceful_fallback_when_ai_down(
    mock_ai, mock_tree, mock_readme, mock_comments, mock_repo, mock_issue, ac
):
    """Ensure async processing produces a valid fallback breakdown when AI is unavailable."""
    payload = {"owner": "sample", "repo": "sample-repo", "issue_number": 99}
    resp = await ac.post("/api/issues/breakdown/start", json=payload)
    assert resp.status_code == 200
    job_id = resp.json()["job_id"]

    status_data = {}
    for _ in range(30):
        await asyncio.sleep(0.05)
        status_resp = await ac.get(f"/api/issues/breakdown/status/{job_id}")
        status_data = status_resp.json()
        if status_data["status"] in ["completed", "failed"]:
            break

    assert status_data["status"] == "completed"
    assert status_data["is_fallback"] is True
    assert status_data["breakdown"]["is_fallback"] is True
    assert "potential_challenges" in status_data["breakdown"]
