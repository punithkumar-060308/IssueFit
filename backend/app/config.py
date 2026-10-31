import os
from dotenv import load_dotenv

load_dotenv()

APP_ENV: str = os.getenv("APP_ENV", "development")
is_render: bool = bool(os.getenv("RENDER") or os.getenv("RENDER_EXTERNAL_URL"))
RENDER_URL: str = os.getenv("RENDER_EXTERNAL_URL", "https://issuefit.onrender.com")

BACKEND_URL: str = os.getenv("BACKEND_URL") or (RENDER_URL if is_render else "http://localhost:8000")
FRONTEND_URL: str = os.getenv("FRONTEND_URL") or ("https://issue-fit.vercel.app" if is_render else "http://localhost:5173")
FRONTEND_ORIGIN: str = os.getenv("FRONTEND_ORIGIN", FRONTEND_URL)

GITHUB_TOKEN: str | None = os.getenv("GITHUB_TOKEN")
CACHE_TTL_SECONDS: int = int(os.getenv("CACHE_TTL_SECONDS", "300"))
MAX_GITHUB_ITEMS: int = min(int(os.getenv("MAX_GITHUB_ITEMS", "300")), 300)

MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
MONGODB_DATABASE: str = os.getenv("MONGODB_DATABASE", "issuefit")

GOOGLE_CLIENT_ID: str | None = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET: str | None = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI: str = os.getenv("GOOGLE_REDIRECT_URI") or f"{BACKEND_URL}/auth/google/callback"

GITHUB_CLIENT_ID: str | None = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET: str | None = os.getenv("GITHUB_CLIENT_SECRET")
GITHUB_REDIRECT_URI: str = os.getenv("GITHUB_REDIRECT_URI") or f"{BACKEND_URL}/auth/github/callback"
GITHUB_CONNECT_REDIRECT_URI: str = os.getenv("GITHUB_CONNECT_REDIRECT_URI") or f"{BACKEND_URL}/auth/github/connect/callback"

SESSION_SECRET: str = os.getenv("SESSION_SECRET", "issuefit_insecure_default_secret_for_development_mode")
TOKEN_ENCRYPTION_KEY: str | None = os.getenv("TOKEN_ENCRYPTION_KEY")
COOKIE_SECURE: bool = os.getenv("COOKIE_SECURE", "true" if APP_ENV == "production" else "false").lower() == "true"
COOKIE_SAMESITE: str = os.getenv("COOKIE_SAMESITE", "none" if (COOKIE_SECURE or APP_ENV == "production") else "lax")
SESSION_COOKIE_NAME: str = "issuefit_session"
