# fraud service

## Overview

Python service on port 8087, schema `fraud`: Collabo match scoring and fraud flags. It scores in the background from events and is never a synchronous call on the rider's path. Root `AGENTS.md` rules apply; deeper conventions get added when you run `/audit services/fraud` or first build here.

## Stack

- Python 3.14 with uv, FastAPI, pydantic-settings, uvicorn
- Planned per spec 0009: SQLAlchemy Core with async psycopg, Alembic migrations
- Generated Pydantic v2 contract models in `app/contract` (datamodel-code-generator, through `pnpm contracts:gen`)

## Commands

```bash
pnpm --filter @collabo/fraud dev        # uvicorn with reload on 8087
pnpm --filter @collabo/fraud test       # pytest
pnpm --filter @collabo/fraud typecheck  # compileall today; no type checker is chosen yet
pnpm --filter @collabo/fraud lint       # ruff check + ruff format --check
pnpm --filter @collabo/fraud format     # ruff check --fix + ruff format
pnpm --filter @collabo/fraud db:migrate # alembic upgrade head (DATABASE_URL)
uv add <package>                        # add a dependency (run inside services/fraud)
```

## Key files

| File | Owns |
|---|---|
| `app/main.py` | FastAPI app |
| `app/config.py` | pydantic-settings env, validated at boot |
| `app/ctxsig.py` | Signed context check, tested against the shared vectors |
| `alembic/` | Alembic env and versions; migrations are additive only, so `downgrade()` raises |

## Conventions

- Tests live in `tests/` as `test_*.py`. Lint and format with Ruff (config in `pyproject.toml`, `ANN` rules enforce full type hints, generated `app/contract` is excluded).
- Run everything through `uv run --frozen`; never pip install into the venv by hand.
- Raise typed exceptions and map them to the shared error shape in one FastAPI exception handler.

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
