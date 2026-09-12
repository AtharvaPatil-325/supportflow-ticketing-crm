# Datastraw Support CRM

A clean Phase 1 foundation for a Customer Support Ticketing CRM. This phase contains only the frontend and backend project shells; ticket CRUD, authentication, database models, and dashboard features are intentionally not included yet.

## Planned architecture

```text
React Frontend
      |
      v
FastAPI REST API
      |
      v
SQLite Database
```

## Technologies

- Frontend: React, Vite, Tailwind CSS, React Router, Lucide React
- Backend: Python, FastAPI, Uvicorn
- Database: SQLite (planned for a later phase)

## Run the frontend

```bash
cd frontend
npm install
npm run dev
```

The Vite development server runs at `http://localhost:5173` by default.

## Run the backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The FastAPI development server runs at `http://127.0.0.1:8000` by default. The health endpoint is available at `http://127.0.0.1:8000/api/health`.

## Phase 1 scope

- Minimal React application displaying `Support CRM`
- Tailwind CSS configuration
- React Router and Lucide React dependencies
- FastAPI application with `GET /api/health`
- No ticket routes, database code, authentication, or dashboard functionality
