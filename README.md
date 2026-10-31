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

1. Clone the repository
git clone https://github.com/punithkumar-060308/IssueFit.git
cd IssueFit
### Backend

2. Start the backend
cd backend

Create a virtual environment:
python -m venv venv

Activate it:
.\venv\Scripts\Activate.ps1


Install dependencies:
pip install -r requirements.txt


Create your .env file using .env.example:
Copy-Item .env.example .env


Add the required environment variables to backend/.env (especially MongoDB and any OAuth/AI credentials needed for the features you're testing).

Start the server:
uvicorn app.main:app --reload --port 8000


Backend should be available at:
- API: http://localhost:8000
- Swagger docs: http://localhost:8000/docs
### Frontend
3. Start the frontend
Open a second PowerShell terminal:
cd IssueFit\frontend


Install dependencies:
npm install


Create the frontend environment file:
Copy-Item .env.example .env


Set the API URL in frontend/.env:
VITE_API_BASE_URL=http://localhost:8000


Start the frontend:
npm run dev


Open the local URL Vite prints, usually:

http://localhost:5173
4. Your terminal setup
Terminal	Running process
PowerShell 1	FastAPI backend — port 8000
PowerShell 2	Vite frontend — port 5173

Important: MongoDB must also be accessible using the MONGODB_URI in your backend .env. If you use MongoDB Atlas, put its connection string there.

If PowerShell blocks virtual-environment activation, run this once in that terminal:
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass


Then activate the environment again.

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
