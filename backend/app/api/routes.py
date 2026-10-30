from __future__ import annotations
import json
from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.schemas import (
    RecommendRequest,
    RecommendResponse,
    RecommendMeta,
    IssueRecommendation,
    RepositoryValidateRequest,
    RepositoryValidateResponse,
    RepositoryInfo,
    TrendingResponse,
    LeaderboardResponse,
)
from app.services.github_client import (
    fetch_user,
    fetch_repository,
    GitHubAPIError,
)
from app.services.contributor_service import build_contributor_profile
from app.services.issue_service import get_open_issues
from app.services.repository_service import validate_and_fetch_repository, parse_github_url
from app.core.filters import filter_issues
from app.core.recommender import rank_issues, SCORING_VERSION
from app.storage.cache import get as cache_get, set as cache_set
from app.config import CACHE_TTL_SECONDS

router = APIRouter()


def _error_response(status_code: int, code: str, message: str) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "error": {"code": code, "message": message},
            "recommendations": [],
        },
    )


def _map_github_error(exc: GitHubAPIError, context: str = "") -> JSONResponse:
    if exc.code == "GITHUB_RATE_LIMIT" or exc.status_code in (403, 429):
        return _error_response(429, "GITHUB_RATE_LIMIT", "GitHub rate limit reached. Please try again later.")
    if exc.code == "NOT_FOUND" or exc.status_code == 404:
        code = "USER_NOT_FOUND" if "user" in context else "REPOSITORY_NOT_FOUND"
        msg = "The user could not be found." if "user" in context else "The repository could not be found or accessed."
        return _error_response(404, code, msg)
    if exc.status_code >= 500:
        return _error_response(502, "GITHUB_UNAVAILABLE", "GitHub is temporarily unavailable. Please try again.")
    return _error_response(502, "GITHUB_UNAVAILABLE", exc.message)


@router.post("/recommend")
async def recommend(request: RecommendRequest):
    req = request.clean()

    # ---- Validate user ----
    user_cache_key = f"user:{req.username}"
    user_data = cache_get(user_cache_key)
    if user_data is None:
        try:
            user_data = await fetch_user(req.username)
            cache_set(user_cache_key, user_data, ttl_seconds=CACHE_TTL_SECONDS * 2)
        except GitHubAPIError as exc:
            return _map_github_error(exc, context="user")

    # ---- Validate repository ----
    repo_cache_key = f"repo:{req.owner}/{req.repo}"
    repo_data = cache_get(repo_cache_key)
    if repo_data is None:
        try:
            repo_data = await fetch_repository(req.owner, req.repo)
            cache_set(repo_cache_key, repo_data, ttl_seconds=CACHE_TTL_SECONDS * 2)
        except GitHubAPIError as exc:
            return _map_github_error(exc, context="repo")

    repo_language: str | None = repo_data.get("language")

    # ---- Build contributor profile ----
    profile_cache_key = f"profile:{req.username}"
    contributor_profile = cache_get(profile_cache_key)
    if contributor_profile is None:
        try:
            contributor_profile = await build_contributor_profile(req.username)
            cache_set(profile_cache_key, contributor_profile, ttl_seconds=CACHE_TTL_SECONDS * 2)
        except GitHubAPIError as exc:
            return _map_github_error(exc, context="user")

    # ---- Fetch open issues ----
    issues_cache_key = f"issues:{req.owner}/{req.repo}"
    raw_issues = cache_get(issues_cache_key)
    if raw_issues is None:
        try:
            raw_issues = await get_open_issues(req.owner, req.repo)
            cache_set(issues_cache_key, raw_issues, ttl_seconds=CACHE_TTL_SECONDS)
        except GitHubAPIError as exc:
            return _map_github_error(exc, context="repo")

    scanned_count = len(raw_issues)

    # ---- Filter ----
    eligible = filter_issues(raw_issues)
    eligible_count = len(eligible)

    if eligible_count == 0:
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "username": req.username,
                "repository": f"{req.owner}/{req.repo}",
                "recommendations": [],
                "meta": {
                    "scanned_count": scanned_count,
                    "eligible_count": 0,
                    "returned_count": 0,
                    "scoring_version": SCORING_VERSION,
                },
                "error": {
                    "code": "NO_SUITABLE_ISSUES",
                    "message": "No suitable open issues found after filtering.",
                },
            },
        )

    # ---- Score and rank ----
    ranked = rank_issues(eligible, contributor_profile, repo_language, top_n=5)

    # ---- Build response ----
    recommendations = []
    for item in ranked:
        recommendations.append(
            IssueRecommendation(
                number=item["number"],
                title=item["title"],
                quality_score=item["quality_score"],
                skill_match=item["skill_match"],
                final_score=item["final_score"],
                difficulty=item["difficulty"],
                reason=item["reason"],
                url=item["url"],
                labels=item["labels"],
                state=item["state"],
                assignee=item["assignee"],
                updated_at=item["updated_at"],
                language=item["language"],
            )
        )

    response = RecommendResponse(
        success=True,
        username=req.username,
        repository=f"{req.owner}/{req.repo}",
        recommendations=recommendations,
        meta=RecommendMeta(
            scanned_count=scanned_count,
            eligible_count=eligible_count,
            returned_count=len(recommendations),
            scoring_version=SCORING_VERSION,
        ),
    )
    return response


@router.get("/repository/{owner}/{repo}")
async def get_repository(owner: str, repo: str):
    cache_key = f"repo:{owner}/{repo}"
    data = cache_get(cache_key)
    if data is None:
        try:
            data = await fetch_repository(owner, repo)
            cache_set(cache_key, data, ttl_seconds=CACHE_TTL_SECONDS * 2)
        except GitHubAPIError as exc:
            return _map_github_error(exc, context="repo")

    return {
        "success": True,
        "repository": {
            "full_name": data.get("full_name", f"{owner}/{repo}"),
            "description": data.get("description"),
            "default_branch": data.get("default_branch", "main"),
            "language": data.get("language"),
            "stargazers_count": data.get("stargazers_count", 0),
            "forks_count": data.get("forks_count", 0),
            "open_issues_count": data.get("open_issues_count", 0),
            "visibility": data.get("visibility", "public"),
            "owner": owner,
            "repo": repo,
        },
    }


@router.post("/repository/validate")
async def validate_repository(request: RepositoryValidateRequest):
    try:
        owner, repo = parse_github_url(request.url)
    except ValueError as exc:
        return _error_response(422, "INVALID_INPUT", str(exc))

    cache_key = f"repo:{owner}/{repo}"
    data = cache_get(cache_key)
    if data is None:
        try:
            data = await fetch_repository(owner, repo)
            cache_set(cache_key, data, ttl_seconds=CACHE_TTL_SECONDS * 2)
        except GitHubAPIError as exc:
            return _map_github_error(exc, context="repo")

    return RepositoryValidateResponse(
        success=True,
        repository=RepositoryInfo(
            full_name=data.get("full_name", f"{owner}/{repo}"),
            description=data.get("description"),
            default_branch=data.get("default_branch", "main"),
            language=data.get("language"),
            stargazers_count=data.get("stargazers_count", 0),
            forks_count=data.get("forks_count", 0),
            open_issues_count=data.get("open_issues_count", 0),
            visibility=data.get("visibility", "public"),
            owner=owner,
            repo=repo,
        ),
    )


@router.get("/trending")
async def trending():
    return TrendingResponse(
        success=True,
        items=[],
        message="Trending data is not yet available.",
    )


@router.get("/leaderboard")
async def leaderboard():
    return LeaderboardResponse(
        success=True,
        items=[],
        message="Leaderboard is coming soon.",
    )
