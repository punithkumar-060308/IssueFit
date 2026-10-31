from datetime import datetime, timezone
from typing import Optional, Dict, Any
from fastapi import Request, HTTPException, status
from app.config import SESSION_COOKIE_NAME
from app.database.mongodb import db


async def get_current_user_optional(request: Request) -> Optional[Dict[str, Any]]:
    # 1. Check HTTP-only cookie
    session_id = request.cookies.get(SESSION_COOKIE_NAME)

    # 2. Check Authorization Bearer header (for seamless cross-domain Vercel <-> Render auth)
    if not session_id:
        auth_header = request.headers.get("Authorization") or request.headers.get("authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_id = auth_header.split(" ", 1)[1].strip()

    if not session_id:
        return None

    session = await db.sessions.find_one({"session_id": session_id})
    if not session:
        return None

    # Check expiry
    expires_at = session.get("expires_at")
    if expires_at:
        if isinstance(expires_at, str):
            try:
                expires_at = datetime.fromisoformat(expires_at)
            except Exception:
                pass
        now = datetime.now(timezone.utc)
        if isinstance(expires_at, datetime):
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if now > expires_at:
                await db.sessions.delete_one({"session_id": session_id})
                return None

    user = await db.users.find_one({"_id": session.get("user_id")})
    return user


async def require_authenticated_user(request: Request) -> Dict[str, Any]:
    user = await get_current_user_optional(request)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in.",
        )
    return user


async def require_github_connected_user(request: Request) -> Dict[str, Any]:
    # Allow any authenticated user (Google or GitHub)
    return await require_authenticated_user(request)
