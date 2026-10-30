from __future__ import annotations
from datetime import datetime
from typing import Literal, Any
from pydantic import BaseModel, Field


class RecommendRequest(BaseModel):
    username: str = Field(min_length=1, max_length=39)
    owner: str = Field(min_length=1, max_length=100)
    repo: str = Field(min_length=1, max_length=100)

    def clean(self) -> "RecommendRequest":
        return RecommendRequest(
            username=self.username.strip(),
            owner=self.owner.strip(),
            repo=self.repo.strip(),
        )


class IssueRecommendation(BaseModel):
    number: int
    title: str
    quality_score: int = Field(ge=0, le=100)
    skill_match: int = Field(ge=0, le=100)
    final_score: int = Field(ge=0, le=100)
    difficulty: Literal["Easy", "Medium", "Hard"]
    reason: str
    url: str
    labels: list[str]
    state: str = "open"
    assignee: str | None = None
    updated_at: datetime | None = None
    language: str | None = None


class RecommendMeta(BaseModel):
    scanned_count: int
    eligible_count: int
    returned_count: int
    scoring_version: str = "1.0"


class RecommendResponse(BaseModel):
    success: bool
    username: str
    repository: str
    recommendations: list[IssueRecommendation]
    meta: RecommendMeta | None = None


class ErrorDetail(BaseModel):
    code: str
    message: str


class ErrorResponse(BaseModel):
    success: bool = False
    error: ErrorDetail
    recommendations: list = []


class RepositoryValidateRequest(BaseModel):
    url: str = Field(min_length=1, max_length=500)


class RepositoryInfo(BaseModel):
    full_name: str
    description: str | None = None
    default_branch: str
    language: str | None = None
    stargazers_count: int
    visibility: str


class RepositoryValidateResponse(BaseModel):
    success: bool
    repository: RepositoryInfo | None = None


class TrendingResponse(BaseModel):
    success: bool
    items: list[dict[str, Any]] = []
    message: str | None = None


class LeaderboardResponse(BaseModel):
    success: bool
    items: list[dict[str, Any]] = []
    message: str | None = None
