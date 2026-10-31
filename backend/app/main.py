from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.config import FRONTEND_ORIGIN, FRONTEND_URL
from app.api.routes import router
from app.auth.router import auth_router
from app.database.mongodb import db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB connection on startup
    await db.init_db()
    yield


app = FastAPI(
    title="IssueFit API",
    version="1.0.0",
    description="Find open-source issues that fit a contributor's public GitHub skills.",
)

# Defensively sanitize CORS origins to ensure no trailing slashes break browser Origin matching
allowed_origins = [
    origin.strip().rstrip("/")
    for origin in f"{FRONTEND_ORIGIN},{FRONTEND_URL}".split(",")
    if origin.strip()
]
for default_origin in [
    "https://issue-fit.vercel.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]:
    cleaned = default_origin.rstrip("/")
    if cleaned not in allowed_origins:
        allowed_origins.append(cleaned)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth router mounted at root (/auth)
app.include_router(auth_router)
# Core API router mounted at /api
app.include_router(router, prefix="/api")


@app.get("/")
async def root():
    return {
        "message": "IssueFit API is running",
        "docs": "/docs",
        "health": "/api/health",
        "auth": "/auth/me",
    }


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {"code": "HTTP_ERROR", "message": str(exc.detail)},
            "recommendations": [],
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {"code": "INTERNAL_SERVER_ERROR", "message": str(exc)},
            "recommendations": [],
        },
    )
