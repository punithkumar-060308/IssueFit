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
    default_branch: str = "main"
    language: str | None = None
    stargazers_count: int = 0
    forks_count: int = 0
    open_issues_count: int = 0
    visibility: str = "public"
    owner: str | None = None
    repo: str | None = None


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


# -------------------------------------------------------------
# AI Issue Breakdown Schemas
# -------------------------------------------------------------

class IssueBreakdownRequest(BaseModel):
    owner: str = Field(min_length=1, max_length=100)
    repo: str = Field(min_length=1, max_length=100)
    issue_number: int = Field(gt=0)

    def clean(self) -> "IssueBreakdownRequest":
        return IssueBreakdownRequest(
            owner=self.owner.strip(),
            repo=self.repo.strip(),
            issue_number=self.issue_number,
        )


class ProblemExplanation(BaseModel):
    summary: str
    what_is_wrong: str
    expected_behavior: str
    why_it_matters: str
    impact: str


class RequirementItem(BaseModel):
    text: str
    evidence_level: Literal["verified", "inferred", "unknown"] = "verified"


class ExpectedOutcome(BaseModel):
    expected_behavior: str
    explicit_requirements: list[RequirementItem] = []
    inferred_requirements: list[RequirementItem] = []
    acceptance_criteria: list[RequirementItem] = []


class FileReference(BaseModel):
    file_path: str
    relevance_reason: str
    investigation_guidance: str
    evidence_level: Literal["verified", "hypothesis"] = "hypothesis"


class TechnicalContext(BaseModel):
    languages: list[str] = []
    frameworks_and_libraries: list[str] = []
    architectural_concepts: list[str] = []
    components_involved: list[str] = []
    dependencies_to_investigate: list[str] = []
    relevant_files: list[FileReference] = []


class ImplementationStep(BaseModel):
    step_number: int
    title: str
    description: str
    details: list[str] = []


class ImplementationApproach(BaseModel):
    overview: str
    steps: list[ImplementationStep] = []
    things_to_avoid: list[str] = []


class TestScenario(BaseModel):
    name: str
    description: str
    test_type: Literal["unit", "integration", "e2e", "manual"] = "unit"


class EdgeCasesAndTesting(BaseModel):
    edge_cases: list[str] = []
    failure_scenarios: list[str] = []
    input_validation: list[str] = []
    compatibility_considerations: list[str] = []
    regression_risks: list[str] = []
    suggested_tests: list[TestScenario] = []


class PrerequisiteItem(BaseModel):
    concept: str
    why_it_matters: str


class PrerequisiteKnowledge(BaseModel):
    essential: list[PrerequisiteItem] = []
    helpful: list[PrerequisiteItem] = []


class DifficultyAssessment(BaseModel):
    level: Literal["Beginner", "Intermediate", "Advanced"]
    reasoning: str
    complexity_factors: list[str] = []


class BreakdownMeta(BaseModel):
    breakdown_version: str = "1.0"
    generated_at: str
    model: str
    grounded_evidence: dict[str, Any] = {}


class IssueBreakdownData(BaseModel):
    problem_explanation: ProblemExplanation
    expected_outcome: ExpectedOutcome
    technical_context: TechnicalContext
    implementation_approach: ImplementationApproach
    edge_cases_and_testing: EdgeCasesAndTesting
    prerequisite_knowledge: PrerequisiteKnowledge
    difficulty_assessment: DifficultyAssessment
    meta: BreakdownMeta | None = None


class IssueBreakdownResponse(BaseModel):
    success: bool
    owner: str
    repo: str
    issue_number: int
    cached: bool = False
    breakdown: IssueBreakdownData | None = None
    error: ErrorDetail | None = None
