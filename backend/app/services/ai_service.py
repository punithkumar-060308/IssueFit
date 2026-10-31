from __future__ import annotations
import json
import logging
import re
from abc import ABC, abstractmethod
from typing import Any

import httpx

from app.config import (
    GEMINI_API_KEY,
    GEMINI_MODEL,
    OPENAI_API_KEY,
    OPENAI_MODEL,
    OPENAI_BASE_URL,
    LLM_PROVIDER,
    AI_REQUEST_TIMEOUT_SECONDS,
)

logger = logging.getLogger("issuefit.ai")


# -------------------------------------------------------------
# AI Exceptions
# -------------------------------------------------------------

class AIError(Exception):
    """Base exception for AI provider errors."""
    def __init__(self, message: str, status_code: int = 502, code: str = "AI_SERVICE_ERROR"):
        self.message = message
        self.status_code = status_code
        self.code = code
        super().__init__(message)


class AIConfigurationError(AIError):
    def __init__(self, message: str = "AI service is not configured. Please provide an API key."):
        super().__init__(message, status_code=503, code="AI_CONFIG_ERROR")


class AIRateLimitError(AIError):
    def __init__(self, message: str = "AI provider rate limit exceeded. Please try again shortly."):
        super().__init__(message, status_code=429, code="AI_RATE_LIMIT")


class AITimeoutError(AIError):
    def __init__(self, message: str = "AI breakdown generation timed out. Please try again."):
        super().__init__(message, status_code=504, code="AI_TIMEOUT")


class AIServiceError(AIError):
    def __init__(self, message: str = "AI service failed to generate a response."):
        super().__init__(message, status_code=502, code="AI_SERVICE_ERROR")


class AIResponseValidationError(AIError):
    def __init__(self, message: str = "AI returned an invalid or malformed response."):
        super().__init__(message, status_code=502, code="AI_MALFORMED_RESPONSE")


# -------------------------------------------------------------
# JSON Extraction Helper
# -------------------------------------------------------------

def extract_json_object(raw_text: str) -> dict[str, Any]:
    """
    Robustly extract and parse a JSON object from raw LLM text.
    Handles:
    - Pure JSON
    - Markdown fenced code blocks: ```json ... ``` or ``` ... ```
    - Extra conversational text preceding or following the JSON
    """
    cleaned = raw_text.strip()
    if not cleaned:
        raise AIResponseValidationError("AI response was empty.")

    # 1. Direct parse attempt
    try:
        data = json.loads(cleaned)
        if isinstance(data, dict):
            return data
    except Exception:
        pass

    # 2. Extract from markdown code fence
    fence_match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned, re.IGNORECASE)
    if fence_match:
        fence_content = fence_match.group(1).strip()
        try:
            data = json.loads(fence_content)
            if isinstance(data, dict):
                return data
        except Exception:
            pass

    # 3. Locate outer-most JSON object braces { ... }
    start_idx = cleaned.find("{")
    end_idx = cleaned.rfind("}")
    if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
        candidate = cleaned[start_idx : end_idx + 1]
        try:
            data = json.loads(candidate)
            if isinstance(data, dict):
                return data
        except Exception:
            pass

    raise AIResponseValidationError(
        f"Could not parse valid JSON object from model response. Preview: {cleaned[:120]}..."
    )


# -------------------------------------------------------------
# Base LLM Provider
# -------------------------------------------------------------

class BaseLLMProvider(ABC):
    @property
    @abstractmethod
    def provider_name(self) -> str:
        pass

    @property
    @abstractmethod
    def model_name(self) -> str:
        pass

    @abstractmethod
    async def generate_json(self, prompt: str, system_prompt: str) -> dict[str, Any]:
        """Generate structured JSON response given user prompt and system prompt."""
        pass


# -------------------------------------------------------------
# Google Gemini Provider
# -------------------------------------------------------------

class GeminiProvider(BaseLLMProvider):
    def __init__(
        self,
        api_key: str | None = None,
        model: str | None = None,
        timeout_seconds: int | None = None,
    ):
        self.api_key = api_key or GEMINI_API_KEY
        self.model = model or GEMINI_MODEL
        self.timeout = float(timeout_seconds or AI_REQUEST_TIMEOUT_SECONDS)

        if not self.api_key:
            raise AIConfigurationError("GEMINI_API_KEY is not configured.")

    @property
    def provider_name(self) -> str:
        return "gemini"

    @property
    def model_name(self) -> str:
        return self.model

    async def generate_json(self, prompt: str, system_prompt: str) -> dict[str, Any]:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"

        payload: dict[str, Any] = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": f"{system_prompt}\n\nUser Request:\n{prompt}"}],
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 8192,
            },
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(url, json=payload)
        except httpx.TimeoutException:
            raise AITimeoutError(f"Gemini API timed out after {self.timeout} seconds.")
        except httpx.RequestError as exc:
            raise AIServiceError(f"Network error while connecting to Gemini API: {exc}")

        if response.status_code == 429:
            raise AIRateLimitError("Gemini rate limit exceeded. Please try again later.")
        if response.status_code in (401, 403):
            raise AIConfigurationError("Invalid Gemini API key or unauthorized request.")
        if response.status_code >= 500:
            raise AIServiceError(f"Gemini service error ({response.status_code}): {response.text[:200]}")
        if response.status_code != 200:
            raise AIServiceError(f"Gemini request failed ({response.status_code}): {response.text[:200]}")

        try:
            resp_data = response.json()
            candidates = resp_data.get("candidates", [])
            if not candidates:
                raise AIResponseValidationError("Gemini returned no candidates.")
            parts = candidates[0].get("content", {}).get("parts", [])
            if not parts:
                raise AIResponseValidationError("Gemini response contained no content parts.")
            raw_text = parts[0].get("text", "")
            return extract_json_object(raw_text)
        except AIResponseValidationError:
            raise
        except Exception as exc:
            raise AIResponseValidationError(f"Failed to process Gemini response: {exc}")


# -------------------------------------------------------------
# OpenAI Provider
# -------------------------------------------------------------

class OpenAIProvider(BaseLLMProvider):
    def __init__(
        self,
        api_key: str | None = None,
        model: str | None = None,
        base_url: str | None = None,
        timeout_seconds: int | None = None,
    ):
        self.api_key = api_key or OPENAI_API_KEY
        self.model = model or OPENAI_MODEL
        self.base_url = (base_url or OPENAI_BASE_URL).rstrip("/")
        self.timeout = float(timeout_seconds or AI_REQUEST_TIMEOUT_SECONDS)

        if not self.api_key:
            raise AIConfigurationError("OPENAI_API_KEY is not configured.")

    @property
    def provider_name(self) -> str:
        return "openai"

    @property
    def model_name(self) -> str:
        return self.model

    async def generate_json(self, prompt: str, system_prompt: str) -> dict[str, Any]:
        url = f"{self.base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt},
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.2,
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(url, headers=headers, json=payload)
        except httpx.TimeoutException:
            raise AITimeoutError(f"OpenAI API timed out after {self.timeout} seconds.")
        except httpx.RequestError as exc:
            raise AIServiceError(f"Network error while connecting to OpenAI API: {exc}")

        if response.status_code == 429:
            raise AIRateLimitError("OpenAI rate limit reached. Please try again later.")
        if response.status_code in (401, 403):
            raise AIConfigurationError("Invalid OpenAI API credentials.")
        if response.status_code >= 500:
            raise AIServiceError(f"OpenAI service error ({response.status_code}): {response.text[:200]}")
        if response.status_code != 200:
            raise AIServiceError(f"OpenAI request failed ({response.status_code}): {response.text[:200]}")

        try:
            resp_data = response.json()
            content = resp_data["choices"][0]["message"]["content"]
            return extract_json_object(content)
        except AIResponseValidationError:
            raise
        except Exception as exc:
            raise AIResponseValidationError(f"Failed to process OpenAI response: {exc}")


# -------------------------------------------------------------
# Mock Provider (for offline testing & test isolation)
# -------------------------------------------------------------

class MockProvider(BaseLLMProvider):
    def __init__(self, model: str = "mock-model", fail_mode: str | None = None):
        self._model = model
        self.fail_mode = fail_mode  # e.g. "timeout", "rate_limit", "malformed", "server_error"

    @property
    def provider_name(self) -> str:
        return "mock"

    @property
    def model_name(self) -> str:
        return self._model

    async def generate_json(self, prompt: str, system_prompt: str) -> dict[str, Any]:
        if self.fail_mode == "timeout":
            raise AITimeoutError("Mock provider timeout")
        if self.fail_mode == "rate_limit":
            raise AIRateLimitError("Mock provider rate limit")
        if self.fail_mode == "server_error":
            raise AIServiceError("Mock provider 500 error")
        if self.fail_mode == "malformed":
            return {"bad": "structure"}

        return {
            "problem_explanation": {
                "summary": "This issue addresses a bug or missing feature in the repository.",
                "what_is_wrong": "The component does not behave as expected under specific conditions.",
                "expected_behavior": "The component should handle input and state correctly.",
                "why_it_matters": "Improves overall reliability and user experience.",
                "impact": "Prevents downstream bugs and user frustration.",
            },
            "expected_outcome": {
                "expected_behavior": "Input is correctly validated and processed.",
                "explicit_requirements": [
                    {"text": "Fix the issue specified in description", "evidence_level": "verified"}
                ],
                "inferred_requirements": [
                    {"text": "Maintain backwards compatibility", "evidence_level": "inferred"}
                ],
                "acceptance_criteria": [
                    {"text": "Regression test passes", "evidence_level": "verified"}
                ],
            },
            "technical_context": {
                "languages": ["Python"],
                "frameworks_and_libraries": ["FastAPI"],
                "architectural_concepts": ["REST API", "Validation"],
                "components_involved": ["Router", "Service"],
                "dependencies_to_investigate": ["pydantic"],
                "relevant_files": [
                    {
                        "file_path": "README.md",
                        "relevance_reason": "Contains setup instructions",
                        "investigation_guidance": "Verify local development steps",
                        "evidence_level": "verified",
                    }
                ],
            },
            "implementation_approach": {
                "overview": "Implement the fix by updating validation logic and verifying with tests.",
                "steps": [
                    {
                        "step_number": 1,
                        "title": "Analyze existing behavior",
                        "description": "Locate relevant module and reproduce problem.",
                        "details": ["Check test suite", "Trace execution path"],
                    },
                    {
                        "step_number": 2,
                        "title": "Apply fix",
                        "description": "Update target function to handle edge cases.",
                        "details": ["Verify inputs", "Return clean errors"],
                    },
                    {
                        "step_number": 3,
                        "title": "Add test coverage",
                        "description": "Write automated tests matching reproduction steps.",
                        "details": ["Add unit test", "Run full test suite"],
                    },
                ],
                "things_to_avoid": [
                    "Do not make breaking changes to public APIs",
                    "Do not skip test assertions",
                ],
            },
            "edge_cases_and_testing": {
                "edge_cases": ["Empty strings", "None values", "Malformed payloads"],
                "failure_scenarios": ["Upstream service timeout"],
                "input_validation": ["Ensure required fields exist"],
                "compatibility_considerations": ["Support existing client versions"],
                "regression_risks": ["Check that existing routes are unaffected"],
                "suggested_tests": [
                    {
                        "name": "test_boundary_conditions",
                        "description": "Verify function with null and empty inputs",
                        "test_type": "unit",
                    }
                ],
            },
            "prerequisite_knowledge": {
                "essential": [
                    {"concept": "Python typing", "why_it_matters": "Core codebase uses modern Python types"}
                ],
                "helpful": [
                    {"concept": "FastAPI dependencies", "why_it_matters": "Makes reading routes faster"}
                ],
            },
            "difficulty_assessment": {
                "level": "Intermediate",
                "reasoning": "Requires understanding routing and adding tests without breaking contracts.",
                "complexity_factors": ["Input validation", "Testing setup"],
            },
        }


# -------------------------------------------------------------
# Provider Factory
# -------------------------------------------------------------

def get_ai_provider(provider_override: str | None = None) -> BaseLLMProvider:
    provider = (provider_override or LLM_PROVIDER or "none").lower().strip()

    if provider == "gemini":
        return GeminiProvider()
    if provider == "openai":
        return OpenAIProvider()
    if provider == "mock":
        return MockProvider()

    # Fallback to gemini if GEMINI_API_KEY exists
    if GEMINI_API_KEY:
        return GeminiProvider()
    if OPENAI_API_KEY:
        return OpenAIProvider()

    raise AIConfigurationError(
        "No AI provider configured. Set GEMINI_API_KEY or OPENAI_API_KEY in backend/.env"
    )

