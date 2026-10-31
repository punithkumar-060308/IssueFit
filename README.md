# IssueFit

**IssueFit** helps contributors discover suitable open-source GitHub issues by matching their skills to repository needs, and provides maintainer-level AI issue breakdowns to guide them through solving complex issues.

## Stack

| Layer    | Technology                |
|----------|---------------------------|
| Frontend | React 18 + Vite 5         |
| Styling  | Plain CSS (CSS variables) |
| Icons    | Lucide React              |
| Backend  | Python + FastAPI          |
| AI Model | Google Gemini / OpenAI    |

## Quick start

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open <http://localhost:5173>

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## AI Issue Breakdown

IssueFit features an AI-powered issue analysis tool. When viewing recommended issues in either grid or table view, developers can click **"Understand this issue"** to receive an intelligent, grounded technical breakdown structured like guidance from an open-source maintainer:

- **Problem Explanation:** What is wrong, expected behavior, importance, and user impact.
- **Expected Outcome:** Explicit requirements (verified from issue context), inferred requirements, and acceptance criteria.
- **Technical Context:** Core languages, frameworks, architectural concepts, components, and verified candidate files.
- **Implementation Approach:** Tailored step-by-step guidance and common anti-patterns to avoid.
- **Edge Cases & Testing:** Potential boundary cases, failure scenarios, input validation, and suggested test cases (unit/integration).
- **Prerequisite Knowledge:** Essential vs helpful skills and concepts.
- **Difficulty Assessment:** Beginner, Intermediate, or Advanced rating with maintainer reasoning.

### Environment Configuration

Configure the following variables in `backend/.env`:

```env
# AI Issue Breakdown Configuration
LLM_PROVIDER=gemini # "gemini", "openai", or "mock"
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemma-4-26b-a4b-it
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL=https://api.openai.com/v1
AI_REQUEST_TIMEOUT_SECONDS=45
BREAKDOWN_CACHE_TTL_SECONDS=3600
```

## API Contracts

### Recommendations
`POST /api/recommend`

```json
{
  "username": "octocat",
  "owner": "fastapi",
  "repo": "fastapi"
}
```

### AI Issue Breakdown
`POST /api/issues/breakdown`

```json
{
  "owner": "fastapi",
  "repo": "fastapi",
  "issue_number": 42
}
```

Response format:
```json
{
  "success": true,
  "owner": "fastapi",
  "repo": "fastapi",
  "issue_number": 42,
  "cached": false,
  "breakdown": {
    "problem_explanation": { ... },
    "expected_outcome": { ... },
    "technical_context": { ... },
    "implementation_approach": { ... },
    "edge_cases_and_testing": { ... },
    "prerequisite_knowledge": { ... },
    "difficulty_assessment": { ... },
    "meta": { ... }
  }
}
```
