# Collabo Ride

Ride hailing for Lagos: a rider app, a driver app, an ops console, and eight backend
services in one monorepo. The stack and the reasons behind it are in
[spec 0009](docs/specs/0009-stack-architecture/index.md); the plan is in [docs/scope](docs/scope/index.md).

## What you need

- Node 26 and pnpm 10 (`npm install -g pnpm@10.25.0`; Node 26 no longer ships corepack)
- Go 1.27 (dispatch service)
- Python 3.14 and uv (fraud service)
- Docker with Compose

## First run

```sh
pnpm install
cp infra/compose/.env.example infra/compose/.env
pnpm infra:up            # Postgres + PostGIS, both Valkeys, MinIO
pnpm dev                 # every service natively, plus the console on :5173
```

Each service reads its own `.env`; copy `.env.example` to `.env` in each `services/*` folder
the first time. The mobile apps run in Expo Go (SDK 57): `pnpm --filter @collabo/rider dev` (bundler on :8100)
or `pnpm --filter @collabo/driver dev` (:8101), then scan the QR code with Expo Go on your phone.
An app moves to a dev build only when a feature needs native code Expo Go lacks (spec 0009).

## Everyday commands

| Command | What it does |
|---|---|
| `pnpm dev` | All services and apps in watch mode (Turborepo) |
| `pnpm build` / `pnpm test` / `pnpm typecheck` | Run that task in every workspace, Go and Python included |
| `pnpm contracts:gen` | Regenerate TS, Go, and Python types from `packages/contracts/openapi.yaml` |
| `pnpm infra:up` / `pnpm infra:down` | Start or stop the data stores |
| `pnpm full:up` / `pnpm full:down` | Build and run everything in containers behind Caddy on http://localhost:8000 |
| `pnpm smoke:bullmq` / `pnpm smoke:contracts` | Scaffold smoke tests 1 and 2 from spec 0009 |

## Layout

```
apps/        rider, driver (Expo SDK 57, Expo Go), console (Vite + React + TanStack Router)
services/    gateway accounts trip payments notifications realtime (Express 5, TS)
             dispatch (Go), fraud (Python, FastAPI)
packages/    contracts (OpenAPI, codegen, shared test vectors), service-kit, config
infra/       compose (profiles infra, full, routing), caddy, osrm
```

| Service | Port | | Service | Port |
|---|---|---|---|---|
| gateway | 8080 | | payments | 8084 |
| accounts | 8081 | | notifications | 8085 |
| trip | 8082 | | realtime | 8086 |
| dispatch | 8083 | | fraud | 8087 |

Every service serves `GET /health` openly. Every other route needs the gateway's signed
context headers (`x-ctx-sig`), and returns errors as `{ code, message, retryAfter? }`.
