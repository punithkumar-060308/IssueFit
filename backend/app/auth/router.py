import logging
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, Request, Response, HTTPException, status
from fastapi.responses import RedirectResponse, JSONResponse

from app.config import (
    FRONTEND_URL,
    COOKIE_SECURE,
    COOKIE_SAMESITE,
    SESSION_COOKIE_NAME,
    GOOGLE_CLIENT_ID,
    GITHUB_CLIENT_ID,
)
from app.core.security import generate_session_id, generate_oauth_state, encrypt_token
from app.database.mongodb import db
from app.auth.google import get_google_auth_url, exchange_google_code, fetch_google_user_info
from app.auth.github import get_github_auth_url, exchange_github_code, fetch_github_user_info
from app.auth.dependencies import get_current_user_optional

logger = logging.getLogger("issuefit.auth")
auth_router = APIRouter(prefix="/auth", tags=["Authentication"])


def _set_session_cookie(response: Response, session_id: str):
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=session_id,
        max_age=7 * 24 * 3600,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        path="/",
    )


def _clear_session_cookie(response: Response):
    response.delete_cookie(
        key=SESSION_COOKIE_NAME,
        path="/",
    )


# -------------------------------------------------------------
# Google OAuth
# -------------------------------------------------------------
@auth_router.get("/google/login")
async def google_login():
    if not GOOGLE_CLIENT_ID:
        return RedirectResponse(f"{FRONTEND_URL}/login?error=google_not_configured")

    state = generate_oauth_state()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    await db.oauth_states.insert_one({
        "state": state,
        "action": "google_login",
        "expires_at": expires_at.isoformat(),
    })
    return RedirectResponse(get_google_auth_url(state))


@auth_router.get("/google/callback")
async def google_callback(
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None,
):
    if error or not code or not state:
        return RedirectResponse(f"{FRONTEND_URL}/login?error=cancelled")

    state_record = await db.oauth_states.find_one({"state": state, "action": "google_login"})
    if not state_record:
        return RedirectResponse(f"{FRONTEND_URL}/login?error=invalid_state")

    await db.oauth_states.delete_one({"state": state})

    try:
        token_data = await exchange_google_code(code)
        google_user = await fetch_google_user_info(token_data.get("access_token"))
    except Exception as exc:
        logger.error(f"Google OAuth exchange error: {exc}")
        return RedirectResponse(f"{FRONTEND_URL}/login?error=auth_failed")

    sub = str(google_user.get("sub"))
    email = google_user.get("email")
    name = google_user.get("name") or "Google User"
    picture = google_user.get("picture")

    # Look up user by Google sub
    user = await db.users.find_one({"identities.google.subject": sub})
    now_iso = datetime.now(timezone.utc).isoformat()

    if not user:
        user_id = str(uuid.uuid4())
        new_user = {
            "_id": user_id,
            "name": name,
            "email": email,
            "avatar_url": picture,
            "identities": {
                "google": {"subject": sub}
            },
            "github_connection": {
                "connected": False,
                "token_encrypted": None,
                "scopes": ["read:user"],
            },
            "created_at": now_iso,
            "updated_at": now_iso,
        }
        await db.users.insert_one(new_user)
        is_github_connected = False
    else:
        user_id = str(user["_id"])
        is_github_connected = bool(user.get("github_connection", {}).get("connected"))
        await db.users.update_one(
            {"_id": user_id},
            {
                "$set": {
                    "name": name or user.get("name"),
                    "email": email or user.get("email"),
                    "avatar_url": picture or user.get("avatar_url"),
                    "updated_at": now_iso,
                }
            },
        )

    # Issue session
    session_id = generate_session_id()
    session_expires = datetime.now(timezone.utc) + timedelta(days=7)
    await db.sessions.insert_one({
        "session_id": session_id,
        "user_id": user_id,
        "created_at": now_iso,
        "expires_at": session_expires.isoformat(),
    })

    dest_url = f"{FRONTEND_URL}/"
    redirect_resp = RedirectResponse(url=dest_url, status_code=status.HTTP_302_FOUND)
    _set_session_cookie(redirect_resp, session_id)
    return redirect_resp


# -------------------------------------------------------------
# GitHub OAuth
# -------------------------------------------------------------
@auth_router.get("/github/login")
async def github_login():
    if not GITHUB_CLIENT_ID:
        return RedirectResponse(f"{FRONTEND_URL}/login?error=github_not_configured")

    state = generate_oauth_state()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    await db.oauth_states.insert_one({
        "state": state,
        "action": "github_login",
        "expires_at": expires_at.isoformat(),
    })
    return RedirectResponse(get_github_auth_url(state, is_connect=False))


@auth_router.get("/github/callback")
async def github_callback(
    request: Request,
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None,
):
    if error or not code or not state:
        return RedirectResponse(f"{FRONTEND_URL}/login?error=cancelled")

    # Match state for either login or connect action
    state_record = await db.oauth_states.find_one({"state": state})
    if not state_record:
        return RedirectResponse(f"{FRONTEND_URL}/login?error=invalid_state")

    action = state_record.get("action")
    bound_user_id = state_record.get("user_id")
    await db.oauth_states.delete_one({"state": state})

    try:
        token_data = await exchange_github_code(code, is_connect=(action == "github_connect"))
        gh_user = await fetch_github_user_info(token_data.get("access_token"))
    except Exception as exc:
        logger.error(f"GitHub OAuth error: {exc}")
        target = f"{FRONTEND_URL}/connect-github?error=auth_failed" if action == "github_connect" else f"{FRONTEND_URL}/login?error=auth_failed"
        return RedirectResponse(target)

    gh_id = int(gh_user["id"])
    gh_login = gh_user.get("login")
    gh_name = gh_user.get("name") or gh_login
    gh_avatar = gh_user.get("avatar_url")
    gh_url = gh_user.get("html_url")
    gh_email = gh_user.get("email")
    encrypted_token = encrypt_token(token_data.get("access_token", ""))
    now_iso = datetime.now(timezone.utc).isoformat()

    # Flow 1: Account Linking (action == "github_connect")
    if action == "github_connect":
        if not bound_user_id:
            return RedirectResponse(f"{FRONTEND_URL}/login?error=session_required")

        # Conflict check: Check if this GitHub ID is linked to another user
        conflict_user = await db.users.find_one({"identities.github.id": gh_id})
        if conflict_user and str(conflict_user.get("_id")) != str(bound_user_id):
            logger.warning(f"GitHub linking conflict: GitHub ID {gh_id} is already linked to user {conflict_user.get('_id')}")
            return RedirectResponse(
                f"{FRONTEND_URL}/connect-github?error=conflict&message=This+GitHub+account+is+already+linked+to+another+IssueFit+user."
            )

        # Link to current user
        await db.users.update_one(
            {"_id": bound_user_id},
            {
                "$set": {
                    "identities.github": {
                        "id": gh_id,
                        "username": gh_login,
                        "profile_url": gh_url,
                    },
                    "github_connection": {
                        "connected": True,
                        "token_encrypted": encrypted_token,
                        "scopes": ["read:user"],
                    },
                    "updated_at": now_iso,
                }
            },
        )

        # Rotate session
        current_session_id = request.cookies.get(SESSION_COOKIE_NAME)
        if current_session_id:
            await db.sessions.delete_one({"session_id": current_session_id})

        new_session_id = generate_session_id()
        new_expires = datetime.now(timezone.utc) + timedelta(days=7)
        await db.sessions.insert_one({
            "session_id": new_session_id,
            "user_id": bound_user_id,
            "created_at": now_iso,
            "expires_at": new_expires.isoformat(),
        })

        redirect_resp = RedirectResponse(url=f"{FRONTEND_URL}/", status_code=status.HTTP_302_FOUND)
        _set_session_cookie(redirect_resp, new_session_id)
        return redirect_resp

    # Flow 2: GitHub Sign In (action == "github_login")
    user = await db.users.find_one({"identities.github.id": gh_id})
    if not user:
        user_id = str(uuid.uuid4())
        new_user = {
            "_id": user_id,
            "name": gh_name,
            "email": gh_email,
            "avatar_url": gh_avatar,
            "identities": {
                "github": {
                    "id": gh_id,
                    "username": gh_login,
                    "profile_url": gh_url,
                }
            },
            "github_connection": {
                "connected": True,
                "token_encrypted": encrypted_token,
                "scopes": ["read:user"],
            },
            "created_at": now_iso,
            "updated_at": now_iso,
        }
        await db.users.insert_one(new_user)
    else:
        user_id = str(user["_id"])
        await db.users.update_one(
            {"_id": user_id},
            {
                "$set": {
                    "name": gh_name or user.get("name"),
                    "avatar_url": gh_avatar or user.get("avatar_url"),
                    "identities.github.username": gh_login,
                    "identities.github.profile_url": gh_url,
                    "github_connection.connected": True,
                    "github_connection.token_encrypted": encrypted_token,
                    "updated_at": now_iso,
                }
            },
        )

    session_id = generate_session_id()
    session_expires = datetime.now(timezone.utc) + timedelta(days=7)
    await db.sessions.insert_one({
        "session_id": session_id,
        "user_id": user_id,
        "created_at": now_iso,
        "expires_at": session_expires.isoformat(),
    })

    redirect_resp = RedirectResponse(url=f"{FRONTEND_URL}/", status_code=status.HTTP_302_FOUND)
    _set_session_cookie(redirect_resp, session_id)
    return redirect_resp


# -------------------------------------------------------------
# GitHub Account Linking (for existing session)
# -------------------------------------------------------------
@auth_router.get("/github/connect")
async def github_connect(request: Request):
    user = await get_current_user_optional(request)
    if not user:
        return RedirectResponse(f"{FRONTEND_URL}/login?error=session_required")

    if not GITHUB_CLIENT_ID:
        return RedirectResponse(f"{FRONTEND_URL}/connect-github?error=github_not_configured")

    state = generate_oauth_state()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    await db.oauth_states.insert_one({
        "state": state,
        "action": "github_connect",
        "user_id": str(user["_id"]),
        "expires_at": expires_at.isoformat(),
    })
    return RedirectResponse(get_github_auth_url(state, is_connect=True))


@auth_router.get("/github/connect/callback")
async def github_connect_callback(
    request: Request,
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None,
):
    if error or not code or not state:
        return RedirectResponse(f"{FRONTEND_URL}/connect-github?error=cancelled")

    state_record = await db.oauth_states.find_one({"state": state, "action": "github_connect"})
    if not state_record:
        return RedirectResponse(f"{FRONTEND_URL}/connect-github?error=invalid_state")

    bound_user_id = state_record.get("user_id")
    await db.oauth_states.delete_one({"state": state})

    try:
        token_data = await exchange_github_code(code, is_connect=True)
        gh_user = await fetch_github_user_info(token_data.get("access_token"))
    except Exception as exc:
        logger.error(f"GitHub connect token error: {exc}")
        return RedirectResponse(f"{FRONTEND_URL}/connect-github?error=auth_failed")

    gh_id = int(gh_user["id"])
    gh_login = gh_user.get("login")
    gh_url = gh_user.get("html_url")
    encrypted_token = encrypt_token(token_data.get("access_token", ""))

    # Safe Account Linking: Check if this GitHub ID is already linked to another IssueFit user
    existing_user_with_gh = await db.users.find_one({"identities.github.id": gh_id})
    if existing_user_with_gh and str(existing_user_with_gh.get("_id")) != str(bound_user_id):
        logger.warning(
            f"GitHub linking conflict: GitHub ID {gh_id} is already linked to user {existing_user_with_gh.get('_id')}"
        )
        return RedirectResponse(
            f"{FRONTEND_URL}/connect-github?error=conflict&message=This+GitHub+account+is+already+linked+to+another+IssueFit+user."
        )

    # Link GitHub identity to current user
    now_iso = datetime.now(timezone.utc).isoformat()
    await db.users.update_one(
        {"_id": bound_user_id},
        {
            "$set": {
                "identities.github": {
                    "id": gh_id,
                    "username": gh_login,
                    "profile_url": gh_url,
                },
                "github_connection": {
                    "connected": True,
                    "token_encrypted": encrypted_token,
                    "scopes": ["read:user"],
                },
                "updated_at": now_iso,
            }
        },
    )

    # Rotate session
    current_session_id = request.cookies.get(SESSION_COOKIE_NAME)
    if current_session_id:
        await db.sessions.delete_one({"session_id": current_session_id})

    new_session_id = generate_session_id()
    new_expires = datetime.now(timezone.utc) + timedelta(days=7)
    await db.sessions.insert_one({
        "session_id": new_session_id,
        "user_id": bound_user_id,
        "created_at": now_iso,
        "expires_at": new_expires.isoformat(),
    })

    redirect_resp = RedirectResponse(url=f"{FRONTEND_URL}/", status_code=status.HTTP_302_FOUND)
    _set_session_cookie(redirect_resp, new_session_id)
    return redirect_resp


# -------------------------------------------------------------
# User & Session State
# -------------------------------------------------------------
@auth_router.get("/me")
async def get_me(request: Request):
    user = await get_current_user_optional(request)
    if not user:
        return {
            "authenticated": False,
            "user": None,
            "requires_github_connection": False,
        }

    is_connected = bool(user.get("github_connection", {}).get("connected"))
    gh_ident = user.get("identities", {}).get("github") or {}

    return {
        "authenticated": True,
        "user": {
            "id": str(user.get("_id")),
            "name": user.get("name"),
            "email": user.get("email"),
            "avatar_url": user.get("avatar_url"),
            "github": {
                "connected": is_connected,
                "username": gh_ident.get("username") if is_connected else None,
                "profile_url": gh_ident.get("profile_url") if is_connected else None,
            },
        },
        "requires_github_connection": not is_connected,
    }


@auth_router.post("/logout")
async def logout(request: Request):
    session_id = request.cookies.get(SESSION_COOKIE_NAME)
    if session_id:
        await db.sessions.delete_one({"session_id": session_id})

    response = JSONResponse(content={"success": True, "message": "Logged out successfully"})
    _clear_session_cookie(response)
    return response

