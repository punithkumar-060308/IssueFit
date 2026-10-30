from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.config import FRONTEND_ORIGIN
from app.api.routes import router

app = FastAPI(
    title="IssueFit API",
    version="1.0.0",
    description="Find open-source issues that fit a contributor's public GitHub skills.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")


@app.get("/")
async def root():
    return {"message": "IssueFit API is running", "docs": "/docs", "health": "/api/health"}


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
