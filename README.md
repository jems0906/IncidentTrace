# IncidentTrace

A human-reviewed incident investigation and safety-learning platform. Record injuries, vehicle incidents, property damage, near misses, and environmental events; build evidence timelines; document contributing factors and root-cause reasoning; track preventive actions through independent effectiveness review; and turn findings into toolbox talks with attendance records.

IncidentTrace supports learning and prevention, not fault-finding. The software stores investigator judgments and does not infer causes. Toolbox attendance records presence, not demonstrated competency.

## Included workflows

- No-fault incident intake with immediate scene-safety actions.
- Chronological timeline and evidence register for photos, documents, interviews, and procedures.
- Investigator-selected and justified task, equipment/material, environment, supervision, training, and procedures factors.
- Human-reviewed four-question RCA, five-whys worksheet, and investigator-authored SVG fishbone diagram with structured category prompts.
- Preventive actions with SafeGrid-compatible source, owner, due date, priority, status, and verification notes, plus interim controls and enforced distinct-reviewer effectiveness closeout.
- Markdown and PDF investigation report exports.
- Componentized React workflows for incident intake, timeline/evidence, RCA, preventive actions, toolbox talks, and case overview.
- Finding-based toolbox talk builder with delivery, attendance, and understanding-check records.
- Fully worked fictional near-miss seed case from report through independent effectiveness review and crew briefing.

## Stack

- Backend: Python 3.11, FastAPI, Pydantic, SQLAlchemy, Alembic.
- Database: PostgreSQL in deployment; SQLite is the local default.
- Frontend: React, Vite, Recharts, Lucide.
- Tests: pytest and FastAPI TestClient.
- Deployment: Docker, Railway dashboard configuration, GitHub Actions.

## Local development

Prerequisites: Python 3.11+, Node.js 20+, npm.

Backend (from `backend/`):

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements-dev.txt
alembic upgrade head
python ..\scripts\seed_database.py
uvicorn app.main:app --reload
```

The API is available at `http://localhost:8000`; interactive API docs are at `/docs` and health is at `/health`. SQLite data is stored in `backend/incidenttrace.db` by default. Set `DATABASE_URL` to a PostgreSQL SQLAlchemy URL to use PostgreSQL locally. `CORS_ORIGINS` accepts a comma-separated list of exact origins.

Frontend (from `frontend/`, in a second terminal):

```powershell
npm ci
npm run dev
```

Open the Vite URL printed in the terminal (normally `http://localhost:5173`). Vite proxies `/api` and `/health` to the local backend. For a production build, set `VITE_API_URL` to the backend origin before `npm run build`.

Run backend checks from `backend/`:

```powershell
python -m pytest -q
```

## Seed data

From the repository root, run `python scripts/seed_database.py` after migrations. The seed is idempotent by demo case title and creates a fictional near miss with five evidence-supported timeline entries, six evidence records, investigator-selected factors, a reviewed RCA, a preventive action closed only after an independent effectiveness review, and a delivered toolbox talk with attendance. It does not overwrite an existing case.

The scenario is documented in [docs/sample_investigation.md](docs/sample_investigation.md). Procedure and method references are in [docs/investigation_procedure.md](docs/investigation_procedure.md), [docs/rca_method_guide.md](docs/rca_method_guide.md), and [docs/toolbox_talk_library.md](docs/toolbox_talk_library.md).

## Railway deployment

Create three Railway services from the connected GitHub repository: a PostgreSQL service, a FastAPI backend, and a React frontend. **This project intentionally does not include `railway.json` or `railway.toml`.** Configure services in the Railway dashboard; new projects should not depend on the deprecated config-as-code pattern.

1. Add a Railway-managed PostgreSQL database.
2. Create the backend service with Root Directory `/backend` and Dockerfile builder. The Dockerfile is at `backend/Dockerfile`.
3. Create the frontend service with Root Directory `/frontend` and Dockerfile builder. The Dockerfile is at `frontend/Dockerfile`.
4. Set backend `DATABASE_URL` to a reference to the PostgreSQL service's `DATABASE_URL`, such as `${{Postgres.DATABASE_URL}}`. Set `CORS_ORIGINS` to the frontend's exact public HTTPS origin (scheme and host only).
5. Set frontend build variable `VITE_API_URL` to the backend's full public HTTPS origin. Vite embeds this value at build time; rebuild the frontend after changing it.
6. Generate a public domain for each web service. The frontend Nginx server listens on port 80 and serves `index.html` for SPA routes. Set the frontend public networking target port to 80.
7. After the backend is connected to PostgreSQL, run migrations from the backend service context with `alembic upgrade head`. Seed the demo with `python scripts/seed_database.py` from the repository root (or run the seed through a one-off command with the backend source available). For a monorepo deployment where only `/backend` is available, run the seed script from a separate repository checkout or one-off job that includes `scripts/`.
8. Confirm `/health`, open `/docs`, and load the frontend domain. Check browser network requests and CORS origin if the UI cannot reach the API.

The app creates missing tables at startup for local convenience; production schema changes should be made through Alembic migrations. Keep database credentials in Railway variables, not in source control. The application does not store uploaded media; evidence is recorded as metadata and optional links.

## API overview

- `GET /health`
- `GET /api/incidents`, `POST /api/incidents`, `GET /api/incidents/{id}`
- `POST /api/incidents/{id}/timeline`, `POST /api/incidents/{id}/evidence`
- `PUT /api/incidents/{id}/rca`
- `POST /api/incidents/{id}/actions`, `PATCH /api/incidents/{id}/actions/{action_id}`
- `POST /api/incidents/{id}/toolbox`, `PATCH /api/incidents/{id}/toolbox/{talk_id}/attendance`
- `GET /api/incidents/{id}/report.md`
- `GET /api/incidents/{id}/report.pdf`

## Safety and privacy note

This starter application is not legal, medical, regulatory, or emergency-response advice. Apply applicable reporting, privacy, retention, evidence-preservation, and worker-consultation requirements for the operating jurisdiction. Store sensitive records and evidence links only in approved systems with appropriate access controls.
