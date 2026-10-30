import os
from dotenv import load_dotenv

load_dotenv()

GITHUB_TOKEN: str | None = os.getenv("GITHUB_TOKEN")
FRONTEND_ORIGIN: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
CACHE_TTL_SECONDS: int = int(os.getenv("CACHE_TTL_SECONDS", "300"))
MAX_GITHUB_ITEMS: int = min(int(os.getenv("MAX_GITHUB_ITEMS", "300")), 300)
