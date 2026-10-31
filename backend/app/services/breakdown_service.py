from __future__ import annotations
import asyncio
from datetime import datetime, timezone
import logging
from typing import Any

from pydantic import ValidationError

from app.config import BREAKDOWN_CACHE_TTL_SECONDS
from app.schemas import (
    IssueBreakdownData,
    BreakdownMeta,
    FileReference,
    RequirementItem,
)
from app.services.github_client import (
    fetch_single_issue,
    fetch_repository,
    fetch_issue_comments,
    fetch_repository_readme,
    fetch_repository_tree,
    GitHubAPIError,
)
from app.services.ai_service import (
    get_ai_provider,
    BaseLLMProvider,
    AIError,
    AIConfigurationError,
    AIRateLimitError,
    AITimeoutError,
    AIServiceError,
    AIResponseValidationError,
)
from app.storage.cache import get as cache_get, set as cache_set

logger = logging.getLogger("issuefit.breakdown")

# Concurrency locks per issue: key -> asyncio.Lock
_in_flight_locks: dict[str, asyncio.Lock] = {}
_global_lock = asyncio.Lock()


async def _get_issue_lock(lock_key: str) -> asyncio.Lock:
    async with _global_lock:
        if lock_key not in _in_flight_locks:
            _in_flight_locks[lock_key] = asyncio.Lock()
        return _in_flight_locks[lock_key]


def _build_system_prompt() -> str:
    return """You are an experienced, empathetic open-source maintainer mentoring a new developer who wants to contribute to a GitHub project.
Your task is to analyze the provided GitHub issue along with verified repository context, and generate a structured, beginner-friendly, and technically rigorous breakdown.

CRITICAL GROUNDING AND HALLUCINATION-PREVENTION RULES:
1. NEVER invent or hallucinate repository file paths, classes, functions, or internal methods.
2. Only reference file paths that appear in the VERIFIED REPOSITORY FILES list below. If you suggest a file not in that list, you MUST set evidence_level to "hypothesis" and explain that it is an educated guess.
3. NEVER invent acceptance criteria and present them as official requirements. Mark explicit requirements as evidence_level: "verified", and inferred requirements as evidence_level: "inferred".
4. Do not provide a complete, copy-paste solution. Instead, provide a step-by-step conceptual and practical approach that teaches the contributor how to solve the problem themselves.
5. If information is missing or context is insufficient, state it clearly (e.g. "Unknown from available context") rather than guessing.
6. The implementation approach must be specific to this exact issue — avoid generic boilerplate that could apply to any issue.

You must respond ONLY with a valid, parseable JSON object matching this schema:
{
  "problem_explanation": {
    "summary": "Short 1-2 sentence beginner-friendly summary of the problem",
    "what_is_wrong": "Clear explanation of what is currently broken, missing, or buggy",
    "expected_behavior": "What should happen instead when working properly",
    "why_it_matters": "Why solving this issue matters to the project or users",
    "impact": "Who is affected (end users, library consumers, developers) and how"
  },
  "expected_outcome": {
    "expected_behavior": "Detailed description of behavior after the fix is merged",
    "explicit_requirements": [
      {"text": "Requirement directly stated in the issue", "evidence_level": "verified"}
    ],
    "inferred_requirements": [
      {"text": "Requirement logically inferred from the context", "evidence_level": "inferred"}
    ],
    "acceptance_criteria": [
      {"text": "Criteria to consider the issue resolved", "evidence_level": "verified or inferred"}
    ]
  },
  "technical_context": {
    "languages": ["Primary language(s) involved"],
    "frameworks_and_libraries": ["Relevant libraries/frameworks"],
    "architectural_concepts": ["Core architectural concepts needed"],
    "components_involved": ["Modules/services/components involved"],
    "dependencies_to_investigate": ["Dependencies that may relate to the bug"],
    "relevant_files": [
      {
        "file_path": "Path from verified files list, or hypothetical path",
        "relevance_reason": "Why this file or directory is relevant",
        "investigation_guidance": "What the contributor should check in this file",
        "evidence_level": "verified"
      }
    ]
  },
  "implementation_approach": {
    "overview": "High-level summary of the recommended approach",
    "steps": [
      {
        "step_number": 1,
        "title": "Clear step title",
        "description": "Actionable explanation of this step",
        "details": ["Specific tips or tasks for this step"]
      }
    ],
    "things_to_avoid": ["Anti-patterns or common pitfalls to avoid"]
  },
  "edge_cases_and_testing": {
    "edge_cases": ["Specific boundary condition or unusual input"],
    "failure_scenarios": ["How it might fail if not handled properly"],
    "input_validation": ["Validation rules to apply"],
    "compatibility_considerations": ["Backwards compatibility considerations"],
    "regression_risks": ["Existing features that could break"],
    "suggested_tests": [
      {
        "name": "test_name_or_scenario",
        "description": "What to test and expected result",
        "test_type": "unit or integration or e2e"
      }
    ]
  },
  "prerequisite_knowledge": {
    "essential": [
      {"concept": "Must-know concept", "why_it_matters": "Why it is strictly required"}
    ],
    "helpful": [
      {"concept": "Helpful concept", "why_it_matters": "Why it makes implementation easier"}
    ]
  },
  "difficulty_assessment": {
    "level": "Beginner, Intermediate, or Advanced",
    "reasoning": "Detailed explanation of why this difficulty was assigned based on complexity, scope, and testing",
    "complexity_factors": ["Key factors influencing difficulty"]
  }
}
"""


def _build_user_prompt(
    issue: dict[str, Any],
    repo_data: dict[str, Any],
    readme_excerpt: str | None,
    comments: list[dict[str, Any]],
    verified_files: list[str],
) -> str:
    parts = []
    parts.append(f"Repository: {repo_data.get('full_name', 'Unknown')}")
    parts.append(f"Repository Description: {repo_data.get('description') or 'No description provided.'}")
    parts.append(f"Primary Language: {repo_data.get('language') or 'Unknown'}")
    parts.append(f"Issue Number: #{issue.get('number')}")
    parts.append(f"Issue Title: {issue.get('title')}")
    parts.append(f"Issue State: {issue.get('state', 'open')}")

    labels = [lbl.get("name") for lbl in issue.get("labels", []) if isinstance(lbl, dict)]
    parts.append(f"Issue Labels: {', '.join(labels) if labels else 'None'}")

    body = issue.get("body") or ""
    parts.append("\n--- ISSUE DESCRIPTION ---")
    if body.strip():
        # Limit body to ~4000 characters to keep prompt size reasonable
        parts.append(body[:4000])
    else:
        parts.append("(The author did not provide a description for this issue. Rely on title, labels, and repository context.)")

    if comments:
        parts.append("\n--- RELEVANT ISSUE COMMENTS ---")
        for idx, c in enumerate(comments[:5], 1):
            user = c.get("user", {}).get("login", "unknown")
            c_body = (c.get("body") or "").strip()[:500]
            parts.append(f"Comment {idx} by @{user}:\n{c_body}")

    if readme_excerpt:
        parts.append("\n--- REPOSITORY README EXCERPT ---")
        parts.append(readme_excerpt[:1500])

    parts.append("\n--- VERIFIED REPOSITORY FILES (Candidate Paths) ---")
    if verified_files:
        parts.append("\n".join(verified_files[:80]))
    else:
        parts.append("(Repository tree unavailable. Any file references must be flagged as hypothesis.)")

    return "\n".join(parts)


def _verify_and_post_process(
    raw_data: dict[str, Any],
    verified_files: set[str],
    model_name: str,
) -> IssueBreakdownData:
    """
    Validate raw AI output, cross-verify file paths against actual repo tree,
    and enforce evidence levels to prevent hallucinations.
    """
    # 1. Post-process technical context relevant_files
    tech_ctx = raw_data.get("technical_context", {})
    files = tech_ctx.get("relevant_files", [])
    processed_files = []

    for f in files:
        if isinstance(f, dict):
            path = (f.get("file_path") or "").strip()
            reason = f.get("relevance_reason") or "Identified during issue analysis"
            guidance = f.get("investigation_guidance") or "Investigate implementation details"

            # Cross-reference with verified files
            # Check exact match or basename/normalized match
            norm_path = path.replace("\\", "/").strip("/")
            is_verified = (
                norm_path in verified_files
                or any(vf.endswith(norm_path) for vf in verified_files)
                or (norm_path in ("README.md", "pyproject.toml", "package.json", "setup.py", "requirements.txt"))
            )

            processed_files.append(
                FileReference(
                    file_path=path,
                    relevance_reason=reason,
                    investigation_guidance=guidance,
                    evidence_level="verified" if is_verified else "hypothesis",
                )
            )

    tech_ctx["relevant_files"] = [f.model_dump() for f in processed_files]
    raw_data["technical_context"] = tech_ctx

    # 2. Ensure explicit requirements are marked verified and inferred as inferred
    exp_out = raw_data.get("expected_outcome", {})
    if "explicit_requirements" in exp_out:
        for item in exp_out["explicit_requirements"]:
            if isinstance(item, dict):
                item["evidence_level"] = "verified"
    if "inferred_requirements" in exp_out:
        for item in exp_out["inferred_requirements"]:
            if isinstance(item, dict):
                item["evidence_level"] = "inferred"
    raw_data["expected_outcome"] = exp_out

    # 3. Add metadata
    raw_data["meta"] = BreakdownMeta(
        breakdown_version="1.0",
        generated_at=datetime.now(timezone.utc).isoformat(),
        model=model_name,
        grounded_evidence={
            "verified_files_count": len(verified_files),
            "relevant_files_verified": sum(1 for f in processed_files if f.evidence_level == "verified"),
            "relevant_files_hypotheses": sum(1 for f in processed_files if f.evidence_level == "hypothesis"),
        },
    ).model_dump()

    # 4. Strict Pydantic parsing
    return IssueBreakdownData.model_validate(raw_data)


async def get_or_generate_issue_breakdown(
    owner: str,
    repo: str,
    issue_number: int,
    provider_override: str | None = None,
) -> tuple[IssueBreakdownData, bool]:
    """
    Retrieve or generate an issue breakdown.
    Returns (breakdown_data, is_cached).
    """
    # Step 1: Fetch issue metadata from GitHub to ensure it exists and get updated_at
    issue = await fetch_single_issue(owner, repo, issue_number)

    # Use updated_at to ensure cache invalidates whenever issue is updated
    updated_at = issue.get("updated_at") or "initial"
    cache_key = f"breakdown:{owner.lower()}:{repo.lower()}:{issue_number}:{updated_at}"

    # Step 2: Check cache
    cached_data = cache_get(cache_key)
    if cached_data is not None:
        try:
            return IssueBreakdownData.model_validate(cached_data), True
        except Exception as e:
            logger.warning(f"Cached breakdown invalid ({e}), regenerating...")

    # Step 3: Concurrency deduplication (one generation per issue at a time)
    lock_key = f"{owner.lower()}/{repo.lower()}#{issue_number}"
    lock = await _get_issue_lock(lock_key)

    async with lock:
        # Check cache again inside lock in case another task finished while waiting
        cached_data = cache_get(cache_key)
        if cached_data is not None:
            try:
                return IssueBreakdownData.model_validate(cached_data), True
            except Exception:
                pass

        # Step 4: Gather repository context efficiently
        repo_data = await fetch_repository(owner, repo)
        default_branch = repo_data.get("default_branch", "main")

        # Fetch README, comments, and repo file tree in parallel (all best-effort)
        readme_task = fetch_repository_readme(owner, repo)
        comments_task = fetch_issue_comments(owner, repo, issue_number, limit=8)
        tree_task = fetch_repository_tree(owner, repo, branch=default_branch, max_files=150)

        readme_text, comments, verified_files_list = await asyncio.gather(
            readme_task, comments_task, tree_task, return_exceptions=True
        )

        readme_str = readme_text if isinstance(readme_text, str) else None
        comments_list = comments if isinstance(comments, list) else []
        file_list = verified_files_list if isinstance(verified_files_list, list) else []
        verified_files_set = {f.replace("\\", "/").strip("/") for f in file_list}

        # Step 5: Initialize AI Provider
        provider = get_ai_provider(provider_override)

        # Step 6: Construct prompts
        system_prompt = _build_system_prompt()
        user_prompt = _build_user_prompt(
            issue=issue,
            repo_data=repo_data,
            readme_excerpt=readme_str,
            comments=comments_list,
            verified_files=file_list,
        )

        # Step 7: Call AI provider
        raw_json = await provider.generate_json(
            prompt=user_prompt,
            system_prompt=system_prompt,
        )

        # Step 8: Post-process & validate against schema with grounding checks
        try:
            breakdown = _verify_and_post_process(
                raw_data=raw_json,
                verified_files=verified_files_set,
                model_name=provider.model_name,
            )
        except ValidationError as val_err:
            logger.error(f"Pydantic validation failed for AI breakdown: {val_err}")
            raise AIResponseValidationError(f"Generated breakdown failed schema validation: {val_err}")

        # Step 9: Save to cache
        cache_set(cache_key, breakdown.model_dump(), ttl_seconds=BREAKDOWN_CACHE_TTL_SECONDS)

        return breakdown, False

