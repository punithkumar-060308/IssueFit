"""
Route integration tests using httpx.AsyncClient + ASGITransport.
This avoids TestClient/anyio event-loop conflicts.
"""
import pytest
import pytest_asyncio
from unittest.mock import AsyncMock, patch
import httpx
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.storage.cache import clear as clear_cache
from app.auth.dependencies import require_github_connected_user

MOCK_AUTH_USER = {
    "_id": "test_user_123",
    "name": "Octo Cat",
    "email": "octocat@github.com",
    "avatar_url": "https://github.com/octocat.png",
    "identities": {
        "github": {
            "id": 583231,
            "username": "octocat",
            "profile_url": "https://github.com/octocat",
        }
    },
    "github_connection": {
        "connected": True,
        "token_encrypted": "test_token",
        "scopes": ["read:user"],
    },
}


# ---------------------------------------------------------------------------
# Shared fixture
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture
async def ac():
    """Async HTTP client wired to the FastAPI ASGI app."""
    clear_cache()
    app.dependency_overrides[require_github_connected_user] = lambda: MOCK_AUTH_USER
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client


# ---------------------------------------------------------------------------
# Mock data
# ---------------------------------------------------------------------------

MOCK_USER = {"login": "octocat", "bio": "Test user"}
MOCK_REPO = {
    "full_name": "fastapi/fastapi",
    "language": "Python",
    "default_branch": "main",
    "description": "FastAPI",
    "stargazers_count": 100,
    "visibility": "public",
}
MOCK_REPOS = [
    {
        "name": "myproject",
        "language": "Python",
        "topics": ["web"],
        "description": "A Python web project",
    }
]
MOCK_ISSUES = [
    {
        "number": 1,
        "title": "Fix the navigation bar on mobile devices",
        "body": (
            "Steps to reproduce: open on phone. "
            "Expected: bar shows. Actual: bar collapses. " + "x" * 50
        ),
        "state": "open",
        "pull_request": None,
        "assignee": None,
        "assignees": [],
        "labels": [{"name": "good first issue"}],
        "html_url": "https://github.com/fastapi/fastapi/issues/1",
        "updated_at": "2026-10-28T10:00:00Z",
    }
]


# ---------------------------------------------------------------------------
# Health / root
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_health(ac):
    response = await ac.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_root(ac):
    response = await ac.get("/")
    assert response.status_code == 200
    assert "message" in response.json()


# ---------------------------------------------------------------------------
# /api/recommend — success path
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
@patch("app.api.routes.fetch_user", new_callable=AsyncMock, return_value=MOCK_USER)
@patch("app.api.routes.fetch_repository", new_callable=AsyncMock, return_value=MOCK_REPO)
@patch(
    "app.services.contributor_service.fetch_user",
    new_callable=AsyncMock,
    return_value=MOCK_USER,
)
@patch(
    "app.services.contributor_service.fetch_user_repos",
    new_callable=AsyncMock,
    return_value=MOCK_REPOS,
)
@patch(
    "app.services.issue_service.fetch_open_issues",
    new_callable=AsyncMock,
    return_value=MOCK_ISSUES,
)
async def test_recommend_success(
    mock_issues, mock_user_repos, mock_profile_user, mock_repo, mock_user, ac
):
    response = await ac.post(
        "/api/recommend",
        json={"username": "octocat", "owner": "fastapi", "repo": "fastapi"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "recommendations" in data
    assert len(data["recommendations"]) <= 5
    if data["recommendations"]:
        rec = data["recommendations"][0]
        for field in (
            "number", "title", "quality_score", "skill_match",
            "final_score", "difficulty", "reason", "url",
        ):
            assert field in rec, f"Missing field: {field}"


# ---------------------------------------------------------------------------
# /api/recommend — validation errors
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_recommend_invalid_input_empty_username(ac):
    response = await ac.post(
        "/api/recommend",
        json={"username": "", "owner": "fastapi", "repo": "fastapi"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_recommend_missing_fields(ac):
    response = await ac.post("/api/recommend", json={"username": "octocat"})
    assert response.status_code == 422


# ---------------------------------------------------------------------------
# /api/trending and /api/leaderboard
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_trending(ac):
    response = await ac.get("/api/trending")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "items" in data


@pytest.mark.asyncio
async def test_leaderboard(ac):
    response = await ac.get("/api/leaderboard")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "items" in data


# ---------------------------------------------------------------------------
# /api/repository/validate
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
@patch("app.api.routes.fetch_repository", new_callable=AsyncMock, return_value=MOCK_REPO)
async def test_repository_validate_success(mock_repo, ac):
    response = await ac.post(
        "/api/repository/validate",
        json={"url": "https://github.com/fastapi/fastapi"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["repository"]["full_name"] == "fastapi/fastapi"


@pytest.mark.asyncio
async def test_repository_validate_bad_url(ac):
    response = await ac.post(
        "/api/repository/validate",
        json={"url": "https://gitlab.com/owner/repo"},
    )
    assert response.status_code == 422
    data = response.json()
    assert data["success"] is False
