# money-board

Advanced investment portfolio management platform — analyze, compare, simulate, and optimize investments using financial, statistical, and economic models. See [CLAUDE.md](CLAUDE.md) for product vision/goals, [ARCHITECTURE.md](ARCHITECTURE.md) for binding technical decisions, and [ROADMAP.md](ROADMAP.md) for the phased build plan.

## Stack

- **Backend / calculation engine**: Python (FastAPI), dependency management via [uv](https://docs.astral.sh/uv/)
- **Database**: PostgreSQL
- **Async jobs**: Celery + Redis
- **Frontend**: React + TypeScript (Vite)
- Everything runs in Docker via `docker-compose.yml` — no local Python/Node install required to run the project.

## Prerequisites

- Docker and Docker Compose (`docker compose version`)

That's it. Backend and frontend dependencies are installed inside their respective container images at build time, not on the host.

## Initial setup

```bash
git clone <repo-url>
cd money-board
cp .env.example .env
docker compose build
docker compose up -d
```

Services and ports:

| Service    | Purpose                     | Host port                     |
|------------|------------------------------|--------------------------------|
| `frontend` | React/Vite dev server        | http://localhost:5173          |
| `backend`  | FastAPI app                  | http://localhost:8000 (docs at `/docs`) |
| `worker`   | Celery worker (background jobs) | — (no HTTP port)            |
| `db`       | PostgreSQL                   | localhost:5433 (see note below) |
| `redis`    | Redis (Celery broker/backend) | localhost:6379                |

Check everything is up:

```bash
docker compose ps
curl http://localhost:8000/health   # {"status": "ok"}
open http://localhost:5173          # or just visit it in a browser
```

Stop the stack:

```bash
docker compose down          # stops containers, keeps data (db volume persists)
docker compose down -v       # also wipes the Postgres volume — destructive
```

## How the Docker config affects the dev workflow

- **Hot reload via bind mounts**: `docker-compose.yml` mounts `./backend:/app` and `./frontend:/app` into their containers. Backend runs `uvicorn --reload` and frontend runs `vite --host`, so editing code on the host is reflected live in the running containers — no rebuild needed for code changes.
- **Dependencies are baked into the image, not the bind mount**: `uv sync` (backend) and `npm ci` (frontend) run during `docker build`, using `backend/uv.lock` and `frontend/package-lock.json` for reproducible installs. If you add/change a dependency, you must rebuild the image — a bind-mounted code change alone won't install it:
  ```bash
  docker compose build backend    # or: docker compose build (rebuilds all)
  docker compose up -d
  ```
- **`frontend_node_modules` named volume**: the frontend bind-mounts the whole `./frontend` directory, which would otherwise shadow the container's `node_modules` with the host's (or an empty host directory). A separate named volume is mounted over `/app/node_modules` specifically so the container keeps its own install.
- **Container-to-container networking uses service names, not `localhost`**: inside the Docker network, the backend/worker reach Postgres and Redis at `db:5432` and `redis:6379` (the service names in `docker-compose.yml`), which is why `DATABASE_URL`/`REDIS_URL` are set explicitly under each service's `environment:` block rather than relying solely on `.env`'s `localhost`-oriented defaults.
- **Postgres host port is remapped to 5433**: mapped as `5433:5432` because port 5432 was already bound by something else on this machine. Internally, containers still talk to Postgres on port 5432 (`db:5432`) — only the host-facing port changed. If you connect to the DB from a host tool (e.g. `psql`, a GUI client), use `localhost:5433`.
- **`db_data` named volume**: persists Postgres data across `docker compose down`/`up` cycles and image rebuilds. Only `docker compose down -v` removes it.
- **`.env`**: used both for `docker-compose.yml` variable interpolation (`${POSTGRES_USER}`, etc.) and loaded into the backend/worker containers via `env_file`. Copy `.env.example` to `.env` before first run; `.env` itself is gitignored.

## Running tests

```bash
# Backend (pytest, run inside the backend container so it uses the same env/deps as prod)
docker compose exec backend pytest

# Frontend lint
docker compose exec frontend npm run lint

# Frontend build (type-checks + production bundle)
docker compose exec frontend npm run build
```

Per [ARCHITECTURE.md](ARCHITECTURE.md): calculation-layer tests must not hit the network or database (pure input/output on domain types), and data-acquisition-layer tests must use mocked/fixture HTTP responses rather than live external calls.

## Auth

Trivial single-tenant-today, pluggable-later auth (see ARCHITECTURE.md's "Open / Not Yet Decided" — a
real auth provider isn't chosen yet): email/password registration, JWT bearer tokens.

```
POST /auth/register  {"email": "...", "password": "..."}  -> {"access_token": "...", "token_type": "bearer"}
POST /auth/login     {"email": "...", "password": "..."}  -> {"access_token": "...", "token_type": "bearer"}
GET  /auth/me         Authorization: Bearer <token>        -> {"id": "...", "email": "..."}
```

The frontend stores the token in `localStorage` and attaches it as an `Authorization` header on
every API request; unauthenticated visitors are redirected to `/login`. `SECRET_KEY` (in `.env`)
signs the tokens — the committed default is dev-only, generate a real random value for any
shared/deployed environment.

## Editor setup (VS Code)

The backend's dependencies are installed inside the Docker image at build time, not on your host — so a plain VS Code window has no interpreter to resolve `import`s against (e.g. `Import "pydantic_settings" could not be resolved`). Docker remains the only thing needed to *run* the project; this venv exists purely so the editor can see the packages.

Create a local venv from the committed lockfile (requires [uv](https://docs.astral.sh/uv/) — `pip install uv` or your preferred install method):

```bash
cd backend
uv sync --frozen
```

Then point VS Code at it: **Command Palette → "Python: Select Interpreter" → `backend/.venv/bin/python`** (already set as the workspace default in `.vscode/settings.json`, so this is usually automatic — reload the window if it doesn't pick it up).

Re-run `uv sync --frozen` whenever `backend/uv.lock` changes, same as rebuilding the Docker image (`docker compose build backend`) — both need to happen after a dependency change.

## Database migrations

Migrations are managed with Alembic. The `backend` service's command runs `alembic upgrade head`
before starting `uvicorn`, so every `docker compose up` (including a fresh clone or after
`docker compose down -v` wipes `db_data`) applies any pending migrations automatically — you don't
need to run `upgrade` by hand for normal startup.

You do still run Alembic manually to *create* a migration after changing/adding models, and it's
useful for checking state:

```bash
docker compose exec backend alembic revision --autogenerate -m "describe the change"

# Check current revision
docker compose exec backend alembic current
```

## Project structure

```
backend/
  app/
    api/          # FastAPI routers — thin, no calculation logic inline
    domain/        # Pure calculation layer (no HTTP/DB/provider knowledge)
    acquisition/    # External data fetching/normalization (market data, BCB, etc.)
    services/       # Orchestration between acquisition and domain layers
    models/         # SQLAlchemy ORM entities (persisted state: User, Portfolio, ...)
    schemas/        # Pydantic request/response schemas
    tasks/          # Celery app and background jobs
    core/           # Config, DB session, security, shared mixins (e.g. user-scoping)
  alembic/          # DB migrations
  tests/            # Mirrors app/ structure
frontend/
  src/
    api/            # Typed fetch client for the backend
    auth/           # Auth context/provider, login/register pages, protected routes
    layout/         # App shell (nav, authenticated layout)
    pages/          # Route-level pages
docker-compose.yml  # Orchestrates db, redis, backend, worker, frontend
```

`app/models/` (persisted SQLAlchemy entities) is kept separate from `app/domain/` (pure
calculation functions) — see [ARCHITECTURE.md](ARCHITECTURE.md) §1: the domain layer must not
know about storage, so ORM models live in their own layer rather than blurring that boundary.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the reasoning behind these boundaries (especially the acquisition/calculation split and multi-tenancy requirements) before adding new modules.
