import urllib.parse
import httpx
from typing import Dict, Any, Optional
from app.config import (
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
)

GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v3/userinfo"


def get_google_auth_url(state: str, redirect_uri: Optional[str] = None) -> str:
    uri = redirect_uri or GOOGLE_REDIRECT_URI
    params = {
        "client_id": GOOGLE_CLIENT_ID or "",
        "redirect_uri": uri,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "access_type": "offline",
        "prompt": "consent",
    }
    return f"{GOOGLE_AUTH_ENDPOINT}?{urllib.parse.urlencode(params)}"


async def exchange_google_code(code: str, redirect_uri: Optional[str] = None) -> Dict[str, Any]:
    uri = redirect_uri or GOOGLE_REDIRECT_URI
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(
            GOOGLE_TOKEN_ENDPOINT,
            data={
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": uri,
            },
            headers={"Accept": "application/json"},
        )
        if response.status_code != 200:
            raise ValueError(f"Google token exchange failed: {response.text}")
        return response.json()


async def fetch_google_user_info(access_token: str) -> Dict[str, Any]:
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(
            GOOGLE_USERINFO_ENDPOINT,
            headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json"},
        )
        if response.status_code != 200:
            raise ValueError(f"Failed to fetch Google user info: {response.text}")
        return response.json()

