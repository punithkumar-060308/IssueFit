"""
Tests for AI-Powered Issue Breakdown.
Validates:
- Successful breakdown generation
- Authentication requirement
- Invalid repository / issue (404)
- Missing issue description (handles gracefully)
- Insufficient repository context (handles gracefully)
- Missing AI configuration (503)
- AI provider timeout (504)
- AI provider failure (502)
- Malformed AI response (502)
- Cache hit and cache invalidation on updated_at change
- Hallucination-prevention validation (file verification)
"""
import pytest
import pytest_asyncio
from unittest.mock import AsyncMock, patch
import httpx
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.storage.cache import clear as clear_cache, get as cache_get
from app.auth.dependencies import require_github_connected_user
from app.services.github_client import GitHubAPIError
from app.services.ai_service import (
    MockProvider,
    AIConfigurationError,
    AITimeoutError,
    AIServiceError,
    extract_json_object,
    AIResponseValidationError,
)

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
    "number": 42,
    "title": "Fix memory leak in websocket stream connection",
    "body": "When clients disconnect abruptly, the websocket connection cleanup is skipped, leading to leaks.",
    "state": "open",
    "pull_request": None,
    "labels": [{"name": "bug"}, {"name": "good first issue"}],
    "html_url": "https://github.com/fastapi/fastapi/issues/42",
    "updated_at": "2026-10-31T05:00:00Z",
}

MOCK_REPO = {
    "full_name": "fastapi/fastapi",
    "language": "Python",
    "default_branch": "main",
    "description": "FastAPI framework, high performance, easy to learn",
}

MOCK_COMMENTS = [
    {
        "id": 101,
        "user": {"login": "maintainer_bob"},
        "body": "I suspect the issue is in `app/websocket.py` inside the exception handler.",
    }
]

MOCK_TREE = [
    "README.md",
    "pyproject.toml",
    "app/main.py",
    "app/websocket.py",
    "tests/test_websocket.py",
]


@pytest_asyncio.fixture
async def ac():
    """Async client with authenticated user dependency override."""
    clear_cache()
    app.dependency_overrides[require_github_connected_user] = lambda: MOCK_AUTH_USER
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def unauth_ac():
    """Async client without authentication overrides."""
    clear_cache()
    app.dependency_overrides.clear()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client


# -------------------------------------------------------------
# 1. Successful Issue Breakdown Generation
# -------------------------------------------------------------

@pytest.mark.asyncio
@patch("app.services.breakdown_service.fetch_single_issue", new_callable=AsyncMock, return_value=MOCK_ISSUE)
@patch("app.services.breakdown_service.fetch_repository", new_callable=AsyncMock, return_value=MOCK_REPO)
@patch("app.services.breakdown_service.fetch_issue_comments", new_callable=AsyncMock, return_value=MOCK_COMMENTS)
@patch("app.services.breakdown_service.fetch_repository_readme", new_callable=AsyncMock, return_value="# FastAPI\nWebSocket guidelines...")
@patch("app.services.breakdown_service.fetch_repository_tree", new_callable=AsyncMock, return_value=MOCK_TREE)
@patch("app.services.breakdown_service.get_ai_provider", return_value=MockProvider())
async def test_breakdown_success(
    mock_ai, mock_tree, mock_readme, mock_comments, mock_repo, mock_issue, ac
):
    payload = {"owner": "fastapi", "repo": "fastapi", "issue_number": 42}
    response = await ac.post("/api/issues/breakdown", json=payload)

    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert data["owner"] == "fastapi"
    assert data["repo"] == "fastapi"
    assert data["issue_number"] == 42
    assert data["cached"] is False

    breakdown = data["breakdown"]
    assert "problem_explanation" in breakdown
    assert "expected_outcome" in breakdown
    assert "technical_context" in breakdown
    assert "implementation_approach" in breakdown
    assert "edge_cases_and_testing" in breakdown
    assert "prerequisite_knowledge" in breakdown
    assert "difficulty_assessment" in breakdown

    # Verify difficulty level is valid
    assert breakdown["difficulty_assessment"]["level"] in ("Beginner", "Intermediate", "Advanced")
    assert len(breakdown["implementation_approach"]["steps"]) > 0


# -------------------------------------------------------------
# 2. Authentication & Authorization Check
# -------------------------------------------------------------

@pytest.mark.asyncio
async def test_breakdown_requires_authentication(unauth_ac):
    payload = {"owner": "fastapi", "repo": "fastapi", "issue_number": 42}
    response = await unauth_ac.post("/api/issues/breakdown", json=payload)
    assert response.status_code == 401


# -------------------------------------------------------------
# 3. Invalid Repository or Issue (404)
# -------------------------------------------------------------

@pytest.mark.asyncio
@patch(
    "app.services.breakdown_service.fetch_single_issue",
    new_callable=AsyncMock,
    side_effect=GitHubAPIError(404, "Not Found", code="NOT_FOUND"),
)
@patch("app.services.breakdown_service.get_ai_provider", return_value=MockProvider())
async def test_breakdown_not_found(mock_ai, mock_issue, ac):
    payload = {"owner": "fastapi", "repo": "fastapi", "issue_number": 999999}
    response = await ac.post("/api/issues/breakdown", json=payload)

    assert response.status_code == 404
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "NOT_FOUND"


# -------------------------------------------------------------
# 4. Missing Issue Description (Handles Gracefully)
# -------------------------------------------------------------

@pytest.mark.asyncio
@patch(
    "app.services.breakdown_service.fetch_single_issue",
    new_callable=AsyncMock,
    return_value={**MOCK_ISSUE, "body": None},
)
@patch("app.services.breakdown_service.fetch_repository", new_callable=AsyncMock, return_value=MOCK_REPO)
@patch("app.services.breakdown_service.fetch_issue_comments", new_callable=AsyncMock, return_value=[])
@patch("app.services.breakdown_service.fetch_repository_readme", new_callable=AsyncMock, return_value=None)
@patch("app.services.breakdown_service.fetch_repository_tree", new_callable=AsyncMock, return_value=[])
@patch("app.services.breakdown_service.get_ai_provider", return_value=MockProvider())
async def test_breakdown_missing_description(
    mock_ai, mock_tree, mock_readme, mock_comments, mock_repo, mock_issue, ac
):
    payload = {"owner": "fastapi", "repo": "fastapi", "issue_number": 42}
    response = await ac.post("/api/issues/breakdown", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["breakdown"] is not None


# -------------------------------------------------------------
# 5. Insufficient Repository Context (README / Tree unavailable)
# -------------------------------------------------------------

@pytest.mark.asyncio
@patch("app.services.breakdown_service.fetch_single_issue", new_callable=AsyncMock, return_value=MOCK_ISSUE)
@patch("app.services.breakdown_service.fetch_repository", new_callable=AsyncMock, return_value=MOCK_REPO)
@patch("app.services.breakdown_service.fetch_issue_comments", new_callable=AsyncMock, return_value=[])
@patch("app.services.breakdown_service.fetch_repository_readme", new_callable=AsyncMock, return_value=None)
@patch("app.services.breakdown_service.fetch_repository_tree", new_callable=AsyncMock, return_value=[])
@patch("app.services.breakdown_service.get_ai_provider", return_value=MockProvider())
async def test_breakdown_insufficient_repo_context(
    mock_ai, mock_tree, mock_readme, mock_comments, mock_repo, mock_issue, ac
):
    payload = {"owner": "fastapi", "repo": "fastapi", "issue_number": 42}
    response = await ac.post("/api/issues/breakdown", json=payload)

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["breakdown"] is not None


# -------------------------------------------------------------
# 6. Missing AI Configuration (503)
# -------------------------------------------------------------

@pytest.mark.asyncio
@patch("app.services.breakdown_service.fetch_single_issue", new_callable=AsyncMock, return_value=MOCK_ISSUE)
@patch("app.services.breakdown_service.fetch_repository", new_callable=AsyncMock, return_value=MOCK_REPO)
@patch("app.services.breakdown_service.fetch_issue_comments", new_callable=AsyncMock, return_value=[])
@patch("app.services.breakdown_service.fetch_repository_readme", new_callable=AsyncMock, return_value=None)
@patch("app.services.breakdown_service.fetch_repository_tree", new_callable=AsyncMock, return_value=[])
@patch(
    "app.services.breakdown_service.get_ai_provider",
    side_effect=AIConfigurationError("No AI provider configured"),
)
async def test_breakdown_missing_ai_config(
    mock_ai, mock_tree, mock_readme, mock_comments, mock_repo, mock_issue, ac
):
    payload = {"owner": "fastapi", "repo": "fastapi", "issue_number": 42}
    response = await ac.post("/api/issues/breakdown", json=payload)

    assert response.status_code == 503
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "AI_CONFIG_ERROR"


# -------------------------------------------------------------
# 7. AI Provider Timeout (504)
# -------------------------------------------------------------

@pytest.mark.asyncio
@patch("app.services.breakdown_service.fetch_single_issue", new_callable=AsyncMock, return_value=MOCK_ISSUE)
@patch("app.services.breakdown_service.fetch_repository", new_callable=AsyncMock, return_value=MOCK_REPO)
@patch("app.services.breakdown_service.fetch_issue_comments", new_callable=AsyncMock, return_value=[])
@patch("app.services.breakdown_service.fetch_repository_readme", new_callable=AsyncMock, return_value=None)
@patch("app.services.breakdown_service.fetch_repository_tree", new_callable=AsyncMock, return_value=[])
@patch("app.services.breakdown_service.get_ai_provider", return_value=MockProvider(fail_mode="timeout"))
async def test_breakdown_provider_timeout(
    mock_ai, mock_tree, mock_readme, mock_comments, mock_repo, mock_issue, ac
):
    payload = {"owner": "fastapi", "repo": "fastapi", "issue_number": 42}
    response = await ac.post("/api/issues/breakdown", json=payload)

    assert response.status_code == 504
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "AI_TIMEOUT"


# -------------------------------------------------------------
# 8. AI Provider Service Failure (502)
# -------------------------------------------------------------

@pytest.mark.asyncio
@patch("app.services.breakdown_service.fetch_single_issue", new_callable=AsyncMock, return_value=MOCK_ISSUE)
@patch("app.services.breakdown_service.fetch_repository", new_callable=AsyncMock, return_value=MOCK_REPO)
@patch("app.services.breakdown_service.fetch_issue_comments", new_callable=AsyncMock, return_value=[])
@patch("app.services.breakdown_service.fetch_repository_readme", new_callable=AsyncMock, return_value=None)
@patch("app.services.breakdown_service.fetch_repository_tree", new_callable=AsyncMock, return_value=[])
@patch("app.services.breakdown_service.get_ai_provider", return_value=MockProvider(fail_mode="server_error"))
async def test_breakdown_provider_failure(
    mock_ai, mock_tree, mock_readme, mock_comments, mock_repo, mock_issue, ac
):
    payload = {"owner": "fastapi", "repo": "fastapi", "issue_number": 42}
    response = await ac.post("/api/issues/breakdown", json=payload)

    assert response.status_code == 502
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "AI_SERVICE_ERROR"


# -------------------------------------------------------------
# 9. Malformed AI Response (502)
# -------------------------------------------------------------

@pytest.mark.asyncio
@patch("app.services.breakdown_service.fetch_single_issue", new_callable=AsyncMock, return_value=MOCK_ISSUE)
@patch("app.services.breakdown_service.fetch_repository", new_callable=AsyncMock, return_value=MOCK_REPO)
@patch("app.services.breakdown_service.fetch_issue_comments", new_callable=AsyncMock, return_value=[])
@patch("app.services.breakdown_service.fetch_repository_readme", new_callable=AsyncMock, return_value=None)
@patch("app.services.breakdown_service.fetch_repository_tree", new_callable=AsyncMock, return_value=[])
@patch("app.services.breakdown_service.get_ai_provider", return_value=MockProvider(fail_mode="malformed"))
async def test_breakdown_malformed_response(
    mock_ai, mock_tree, mock_readme, mock_comments, mock_repo, mock_issue, ac
):
    payload = {"owner": "fastapi", "repo": "fastapi", "issue_number": 42}
    response = await ac.post("/api/issues/breakdown", json=payload)

    assert response.status_code == 502
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "AI_MALFORMED_RESPONSE"


# -------------------------------------------------------------
# 10. Cache Hit and Cache Invalidation
# -------------------------------------------------------------

@pytest.mark.asyncio
@patch("app.services.breakdown_service.fetch_repository", new_callable=AsyncMock, return_value=MOCK_REPO)
@patch("app.services.breakdown_service.fetch_issue_comments", new_callable=AsyncMock, return_value=MOCK_COMMENTS)
@patch("app.services.breakdown_service.fetch_repository_readme", new_callable=AsyncMock, return_value=None)
@patch("app.services.breakdown_service.fetch_repository_tree", new_callable=AsyncMock, return_value=MOCK_TREE)
async def test_cache_hit_and_invalidation(mock_tree, mock_readme, mock_comments, mock_repo, ac):
    payload = {"owner": "fastapi", "repo": "fastapi", "issue_number": 42}

    # Call 1: initial request
    with patch(
        "app.services.breakdown_service.fetch_single_issue",
        new_callable=AsyncMock,
        return_value=MOCK_ISSUE,
    ), patch(
        "app.services.breakdown_service.get_ai_provider",
        return_value=MockProvider(),
    ) as mock_provider:
        resp1 = await ac.post("/api/issues/breakdown", json=payload)
        assert resp1.status_code == 200
        assert resp1.json()["cached"] is False

    # Call 2: repeated request with same updated_at -> should be cached
    with patch(
        "app.services.breakdown_service.fetch_single_issue",
        new_callable=AsyncMock,
        return_value=MOCK_ISSUE,
    ), patch(
        "app.services.breakdown_service.get_ai_provider",
        return_value=MockProvider(),
    ) as mock_provider2:
        resp2 = await ac.post("/api/issues/breakdown", json=payload)
        assert resp2.status_code == 200
        assert resp2.json()["cached"] is True

    # Call 3: issue has been updated on GitHub -> cache should invalidate
    updated_issue = {**MOCK_ISSUE, "updated_at": "2026-10-31T06:30:00Z"}
    with patch(
        "app.services.breakdown_service.fetch_single_issue",
        new_callable=AsyncMock,
        return_value=updated_issue,
    ), patch(
        "app.services.breakdown_service.get_ai_provider",
        return_value=MockProvider(),
    ):
        resp3 = await ac.post("/api/issues/breakdown", json=payload)
        assert resp3.status_code == 200
        assert resp3.json()["cached"] is False


# -------------------------------------------------------------
# 11. Hallucination Prevention & Evidence Classification
# -------------------------------------------------------------

@pytest.mark.asyncio
@patch("app.services.breakdown_service.fetch_single_issue", new_callable=AsyncMock, return_value=MOCK_ISSUE)
@patch("app.services.breakdown_service.fetch_repository", new_callable=AsyncMock, return_value=MOCK_REPO)
@patch("app.services.breakdown_service.fetch_issue_comments", new_callable=AsyncMock, return_value=[])
@patch("app.services.breakdown_service.fetch_repository_readme", new_callable=AsyncMock, return_value=None)
@patch("app.services.breakdown_service.fetch_repository_tree", new_callable=AsyncMock, return_value=MOCK_TREE)
async def test_hallucination_prevention_file_verification(
    mock_tree, mock_readme, mock_comments, mock_repo, mock_issue, ac
):
    # Create a custom mock that returns both an existing file and a made-up file
    class CustomFileMock(MockProvider):
        async def generate_json(self, prompt: str, system_prompt: str):
            data = await super().generate_json(prompt, system_prompt)
            data["technical_context"]["relevant_files"] = [
                {
                    "file_path": "app/websocket.py",  # In MOCK_TREE -> should be verified
                    "relevance_reason": "WebSocket cleanup handler",
                    "investigation_guidance": "Check disconnect callback",
                    "evidence_level": "verified",
                },
                {
                    "file_path": "nonexistent/invented/module.py",  # NOT in MOCK_TREE -> must become hypothesis
                    "relevance_reason": "Hypothetical file",
                    "investigation_guidance": "Look here maybe",
                    "evidence_level": "verified",  # AI claimed it was verified, system must correct it!
                },
            ]
            return data

    with patch("app.services.breakdown_service.get_ai_provider", return_value=CustomFileMock()):
        payload = {"owner": "fastapi", "repo": "fastapi", "issue_number": 42}
        response = await ac.post("/api/issues/breakdown", json=payload)

        assert response.status_code == 200
        files = response.json()["breakdown"]["technical_context"]["relevant_files"]

        # First file is in tree -> verified
        assert files[0]["file_path"] == "app/websocket.py"
        assert files[0]["evidence_level"] == "verified"

        # Second file is NOT in tree -> post-processing MUST enforce hypothesis
        assert files[1]["file_path"] == "nonexistent/invented/module.py"
        assert files[1]["evidence_level"] == "hypothesis"


# -------------------------------------------------------------
# 12. Unit tests for JSON extraction helper
# -------------------------------------------------------------

def test_extract_json_object_markdown_fence():
    text = "Here is the breakdown:\n```json\n{\"test\": 123}\n```\nHope this helps!"
    res = extract_json_object(text)
    assert res == {"test": 123}


def test_extract_json_object_raw_braces():
    text = "Sure, here is your answer: {\"key\": \"value\"} let me know if you need anything."
    res = extract_json_object(text)
    assert res == {"key": "value"}


def test_extract_json_object_invalid():
    with pytest.raises(AIResponseValidationError):
        extract_json_object("Just plain text with no json whatsoever")

