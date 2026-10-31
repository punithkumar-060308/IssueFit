import urllib.parse
import httpx
from typing import Dict, Any, Optional
from app.config import (
    GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET,
    GITHUB_REDIRECT_URI,
    GITHUB_CONNECT_REDIRECT_URI,
)

GITHUB_AUTH_ENDPOINT = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_ENDPOINT = "https://github.com/login/oauth/access_token"
GITHUB_USER_ENDPOINT = "https://api.github.com/user"


def get_github_auth_url(state: str, is_connect: bool = False, custom_redirect_uri: Optional[str] = None) -> str:
    # Use custom_redirect_uri or primary GITHUB_REDIRECT_URI
    redirect_uri = custom_redirect_uri or GITHUB_REDIRECT_URI
    params = {
        "client_id": GITHUB_CLIENT_ID or "",
        "redirect_uri": redirect_uri,
        "scope": "read:user",
        "state": state,
    }
    return f"{GITHUB_AUTH_ENDPOINT}?{urllib.parse.urlencode(params)}"


async def exchange_github_code(code: str, is_connect: bool = False, custom_redirect_uri: Optional[str] = None) -> Dict[str, Any]:
    redirect_uri = custom_redirect_uri or GITHUB_REDIRECT_URI
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(
            GITHUB_TOKEN_ENDPOINT,
            data={
                "client_id": GITHUB_CLIENT_ID,
                "client_secret": GITHUB_CLIENT_SECRET,
                "code": code,
                "redirect_uri": redirect_uri,
            },
            headers={"Accept": "application/json"},
        )
        if response.status_code != 200:
            raise ValueError(f"GitHub token exchange failed: {response.text}")
        data = response.json()
        if "error" in data:
            raise ValueError(f"GitHub OAuth error: {data.get('error_description', data.get('error'))}")
        return data


async def fetch_github_user_info(access_token: str) -> Dict[str, Any]:
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(
            GITHUB_USER_ENDPOINT,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/vnd.github.v3+json",
                "User-Agent": "IssueFit-App",
            },
        )
        if response.status_code != 200:
            raise ValueError(f"Failed to fetch GitHub profile: {response.text}")
        return response.json()

