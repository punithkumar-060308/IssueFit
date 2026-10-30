import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from app.main import app
from app.database.mongodb import db
from app.config import SESSION_COOKIE_NAME


@pytest.fixture
def client():
    with TestClient(app, base_url="http://testserver") as tc:
        yield tc


def test_auth_me_unauthenticated(client: TestClient):
    response = client.get("/auth/me")
    assert response.status_code == 200
    data = response.json()
    assert data["authenticated"] is False
    assert data["user"] is None
    assert data["requires_github_connection"] is False


@pytest.mark.asyncio
async def test_auth_me_authenticated_without_github(client: TestClient):
    user_id = "test_user_no_gh"
    session_id = "test_session_123"

    await db.users.insert_one({
        "_id": user_id,
        "name": "Google Test User",
        "email": "user@example.com",
        "avatar_url": "https://lh3.googleusercontent.com/photo.jpg",
        "identities": {"google": {"subject": "google_sub_999"}},
        "github_connection": {"connected": False},
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    })

    await db.sessions.insert_one({
        "session_id": session_id,
        "user_id": user_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(),
    })

    client.cookies.set(SESSION_COOKIE_NAME, session_id)
    response = client.get("/auth/me")
    assert response.status_code == 200
    data = response.json()
    assert data["authenticated"] is True
    assert data["requires_github_connection"] is True
    assert data["user"]["email"] == "user@example.com"
    assert data["user"]["github"]["connected"] is False


@pytest.mark.asyncio
async def test_auth_me_authenticated_with_github(client: TestClient):
    user_id = "test_user_with_gh"
    session_id = "test_session_456"

    await db.users.insert_one({
        "_id": user_id,
        "name": "GitHub Test User",
        "email": "ghuser@example.com",
        "avatar_url": "https://github.com/ghuser.png",
        "identities": {
            "github": {
                "id": 12345,
                "username": "ghuser",
                "profile_url": "https://github.com/ghuser",
            }
        },
        "github_connection": {"connected": True},
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    })

    await db.sessions.insert_one({
        "session_id": session_id,
        "user_id": user_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(),
    })

    client.cookies.set(SESSION_COOKIE_NAME, session_id)
    response = client.get("/auth/me")
    assert response.status_code == 200
    data = response.json()
    assert data["authenticated"] is True
    assert data["requires_github_connection"] is False
    assert data["user"]["github"]["connected"] is True
    assert data["user"]["github"]["username"] == "ghuser"


@pytest.mark.asyncio
async def test_logout(client: TestClient):
    session_id = "test_session_to_delete"
    await db.sessions.insert_one({
        "session_id": session_id,
        "user_id": "any_user",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(),
    })

    client.cookies.set(SESSION_COOKIE_NAME, session_id)
    response = client.post("/auth/logout")
    assert response.status_code == 200
    assert response.json()["success"] is True

    # Verify session is deleted in DB
    found = await db.sessions.find_one({"session_id": session_id})
    assert found is None


def test_oauth_callbacks_reject_invalid_state(client: TestClient):
    res_google = client.get("/auth/google/callback?code=mock_code&state=nonexistent_state", follow_redirects=False)
    assert res_google.status_code in (302, 307)
    assert "error=invalid_state" in res_google.headers.get("location", "")

    res_github = client.get("/auth/github/callback?code=mock_code&state=nonexistent_state", follow_redirects=False)
    assert res_github.status_code in (302, 307)
    assert "error=invalid_state" in res_github.headers.get("location", "")


def test_github_connect_requires_authenticated_session(client: TestClient):
    # Without cookie
    response = client.get("/auth/github/connect", follow_redirects=False)
    assert response.status_code in (302, 307)
    assert "error=session_required" in response.headers.get("location", "")


def test_recommend_endpoint_requires_auth(client: TestClient):
    # Calling recommend without session should return 401
    response = client.post("/api/recommend", json={"username": "octocat", "owner": "fastapi", "repo": "fastapi"})
    assert response.status_code == 401
