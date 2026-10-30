# IssueFit

**IssueFit** helps contributors discover suitable open-source GitHub issues by matching their skills to repository needs.

## Stack

| Layer    | Technology              |
|----------|------------------------|
| Frontend | React 18 + Vite 5      |
| Styling  | Plain CSS (CSS variables) |
| Icons    | Lucide React            |
| Backend  | Python + FastAPI        |

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
uvicorn main:app --reload --port 8000
```

## API contract

`POST /api/recommend`

```json
{
  "username": "octocat",
  "owner": "fastapi",
  "repo": "fastapi"
}
```

See [`IssueFit_Frontend_Implementation.md`](../IssueFit_Frontend_Implementation.md) for the full request/response contract.

