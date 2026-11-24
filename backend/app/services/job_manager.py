from __future__ import annotations
import asyncio
from datetime import datetime, timezone
import logging
import uuid
from typing import Any, Optional

from app.config import ANALYSIS_VERSION, BREAKDOWN_CACHE_TTL_SECONDS
from app.schemas import IssueBreakdownData, BreakdownJobStatus, ErrorDetail
import app.services.breakdown_service as breakdown_service
from app.services.github_client import GitHubAPIError
from app.services.ai_service import (
    get_ai_provider,
    AIError,
    AIConfigurationError,
    AIRateLimitError,
    AITimeoutError,
    AIServiceUnavailableError,
    AIServerError,
    AIServiceError,
    AIResponseValidationError,
)
from app.storage.cache import get as cache_get, set as cache_set

logger = logging.getLogger("issuefit.job_manager")


class BreakdownJob:
    def __init__(self, job_id: str, owner: str, repo: str, issue_number: int):
        now = datetime.now(timezone.utc).isoformat()
        self.job_id = job_id
        self.owner = owner.strip()
        self.repo = repo.strip()
        self.issue_number = issue_number
        self.status: str = "pending"  # pending, running, completed, failed, cancelled
        self.stage: str = "initializing"
        self.stage_description: str = "Analysis job queued"
        self.created_at: str = now
        self.updated_at: str = now
        self.breakdown: Optional[IssueBreakdownData] = None
        self.error: Optional[ErrorDetail] = None
        self.cached: bool = False
        self.is_fallback: bool = False
        self._task: Optional[asyncio.Task] = None

    def update_stage(self, stage: str, description: str):
        self.stage = stage
        self.stage_description = description
        self.updated_at = datetime.now(timezone.utc).isoformat()

    def to_status(self) -> BreakdownJobStatus:
        return BreakdownJobStatus(
            job_id=self.job_id,
            owner=self.owner,
            repo=self.repo,
            issue_number=self.issue_number,
            status=self.status,
            stage=self.stage,
            stage_description=self.stage_description,
            created_at=self.created_at,
            updated_at=self.updated_at,
            breakdown=self.breakdown,
            error=self.error,
            cached=self.cached,
            is_fallback=self.is_fallback,
        )


class JobManager:
    """
    Manages asynchronous issue breakdown analysis jobs with:
    - Genuine analysis stage tracking (no fabricated percentages)
    - Deduplication of simultaneous requests
    - Graceful fallback when AI is unavailable
    - Safe cancellation and retries
    """
    def __init__(self):
        self._jobs: dict[str, BreakdownJob] = {}
        self._key_to_job_id: dict[str, str] = {}
        self._lock = asyncio.Lock()

    def clear(self):
        """Clear all in-memory jobs and keys (used during testing / resets)."""
        self._jobs.clear()
        self._key_to_job_id.clear()

    def _make_key(self, owner: str, repo: str, issue_number: int) -> str:
        return f"{owner.lower()}/{repo.lower()}#{issue_number}"

    async def start_job(
        self,
        owner: str,
        repo: str,
        issue_number: int,
        provider_override: Optional[str] = None,
        force_refresh: bool = False,
    ) -> BreakdownJob:
        key = self._make_key(owner, repo, issue_number)

        async with self._lock:
            # 1. Check if an active running job already exists for this issue
            existing_job_id = self._key_to_job_id.get(key)
            if existing_job_id and existing_job_id in self._jobs:
                existing_job = self._jobs[existing_job_id]
                if existing_job.status in ("pending", "running"):
                    logger.info(f"Re-attaching to existing active analysis job {existing_job_id} for {key}")
                    return existing_job
                if existing_job.status == "completed" and not force_refresh:
                    return existing_job

            # 2. Create new job
            job_id = str(uuid.uuid4())
            job = BreakdownJob(job_id, owner, repo, issue_number)
            self._jobs[job_id] = job
            self._key_to_job_id[key] = job_id

            # 3. Start background runner task
            job._task = asyncio.create_task(
                self._run_job(job, provider_override, force_refresh)
            )
            return job

    async def _run_job(
        self,
        job: BreakdownJob,
        provider_override: Optional[str],
        force_refresh: bool,
    ):
        owner = job.owner
        repo = job.repo
        issue_number = job.issue_number
        job.status = "running"

        try:
            # Stage 1: GitHub context gathering
            job.update_stage("fetching_issue_context", "Fetching issue details and discussions from GitHub...")
            issue = await breakdown_service.fetch_single_issue(owner, repo, issue_number)
            updated_at = issue.get("updated_at") or "initial"

            cache_key = breakdown_service.get_breakdown_cache_key(owner, repo, issue_number, updated_at)

            # Check cache if not forcing refresh
            if not force_refresh:
                cached = cache_get(cache_key)
                if cached:
                    try:
                        job.breakdown = IssueBreakdownData.model_validate(cached)
                        job.cached = True
                        job.is_fallback = getattr(job.breakdown, "is_fallback", False)
                        job.status = "completed"
                        job.update_stage("completed", "Issue analysis loaded from cache.")
                        return
                    except Exception:
                        pass

            # Stage 2: Repository context gathering
            job.update_stage("inspecting_repository", "Inspecting repository structure, documentation, and files...")
            repo_data = await breakdown_service.fetch_repository(owner, repo)
            default_branch = repo_data.get("default_branch", "main")

            # Fetch tree, readme, comments in parallel
            readme_task = breakdown_service.fetch_repository_readme(owner, repo)
            comments_task = breakdown_service.fetch_issue_comments(owner, repo, issue_number, limit=8)
            tree_task = breakdown_service.fetch_repository_tree(owner, repo, branch=default_branch, max_files=150)

            readme_text, comments, verified_files_list = await asyncio.gather(
                readme_task, comments_task, tree_task, return_exceptions=True
            )

            readme_str = readme_text if isinstance(readme_text, str) else None
            comments_list = comments if isinstance(comments, list) else []
            file_list = verified_files_list if isinstance(verified_files_list, list) else []

            # Stage 3: Synthesizing AI breakdown
            job.update_stage("synthesizing_ai_breakdown", "Generating maintainer breakdown and implementation plan...")

            try:
                breakdown, is_cached = await breakdown_service.get_or_generate_issue_breakdown(
                    owner=owner,
                    repo=repo,
                    issue_number=issue_number,
                    provider_override=provider_override,
                    force_refresh=force_refresh,
                    allow_fallback=True,
                    pre_fetched_context={
                        "issue": issue,
                        "repo_data": repo_data,
                        "readme": readme_str,
                        "comments": comments_list,
                        "verified_files": file_list,
                    },
                )
                job.breakdown = breakdown
                job.cached = is_cached
                job.is_fallback = getattr(breakdown, "is_fallback", False)
                job.status = "completed"
                job.update_stage("completed", "Issue analysis completed successfully.")
            except (AIConfigurationError, AIRateLimitError, AITimeoutError, AIServiceUnavailableError, AIServerError, AIServiceError) as ai_err:
                logger.warning(f"AI provider failed ({ai_err.code}): {ai_err.message}. Applying grounded fallback breakdown.")
                job.update_stage("validating_and_grounding", "Applying verified repository heuristic guidance...")

                fallback = breakdown_service.generate_fallback_breakdown(
                    issue=issue,
                    repo_data=repo_data,
                    readme_excerpt=readme_str,
                    comments=comments_list,
                    verified_files=file_list,
                    reason=ai_err.message,
                )
                job.breakdown = fallback
                job.is_fallback = True
                job.status = "completed"
                job.update_stage("completed", "Fallback guidance prepared successfully.")
                cache_set(cache_key, fallback.model_dump(), ttl_seconds=min(BREAKDOWN_CACHE_TTL_SECONDS, 600))

        except asyncio.CancelledError:
            logger.info(f"Analysis job {job.job_id} was cancelled.")
            job.status = "cancelled"
            job.update_stage("cancelled", "Analysis was cancelled by user.")
            job.error = ErrorDetail(code="JOB_CANCELLED", message="Analysis was cancelled by user.")
        except GitHubAPIError as gh_err:
            logger.error(f"GitHub API error in job {job.job_id}: {gh_err.message}")
            job.status = "failed"
            job.update_stage("failed", gh_err.message)
            job.error = ErrorDetail(code=gh_err.code, message=gh_err.message)
        except Exception as exc:
            logger.exception(f"Unexpected error in job {job.job_id}: {exc}")
            job.status = "failed"
            job.update_stage("failed", "An unexpected error occurred during issue analysis.")
            job.error = ErrorDetail(code="INTERNAL_ERROR", message="An unexpected error occurred during issue analysis.")

    def get_job(self, job_id: str) -> Optional[BreakdownJob]:
        return self._jobs.get(job_id)

    async def cancel_job(self, job_id: str) -> bool:
        job = self._jobs.get(job_id)
        if not job:
            return False
        if job.status in ("pending", "running") and job._task and not job._task.done():
            job._task.cancel()
            job.status = "cancelled"
            job.update_stage("cancelled", "Analysis was cancelled by user.")
            return True
        return False


job_manager = JobManager()
