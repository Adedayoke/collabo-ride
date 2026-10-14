# Collabo Ride

Ride hailing for Lagos. Riders name their own price and pick from driver offers, choose a
ride class, and can opt into Collabo: a second rider going the same way is picked up along
the route, so both pay less while the driver earns more.

This monorepo holds three apps and eight backend services:

* **Rider app** and **driver app** (Expo, React Native)
* **Ops console** (web)
* **Backend services** in TypeScript, Go, and Python, behind one gateway

> **Status:** foundation stage. The stack is scaffolded, every app and service boots and
> builds, and the shared request plumbing is tested. Product features land next.

## Stack

| Area | Choice |
|---|---|
| Mobile apps | Expo SDK 57 with Expo Router, running in Expo Go |
| Ops console | Vite, React, TanStack Router |
| Most services | Node 26, Express 5, TypeScript, Zod |
| Dispatch (matching) | Go 1.27 |
| Fraud (scoring) | Python 3.14, FastAPI |
| Database | Postgres with PostGIS, one schema and one login role per service |
| Live data and queues | Valkey (two instances: live location, durable streams and jobs), BullMQ |
| Files | MinIO (S3 compatible) |
| Routing | OSRM |
| Edge | Caddy |
| Contracts | OpenAPI 3.1, with generated TS, Go, and Python types |
| Monorepo | pnpm workspaces, Turborepo |

## What you need

* Node 26 and pnpm 10 (`npm install -g pnpm@10.25.0`; Node 26 no longer ships corepack)
* Go 1.27 (dispatch service)
* Python 3.14 and [uv](https://docs.astral.sh/uv/) (fraud service)
* Docker with Compose
* Expo Go on your phone, for the mobile apps

Go and uv must be on your `PATH`, because `pnpm build`, `pnpm test`, and `pnpm typecheck`
call them for the dispatch and fraud services.

## First run

```sh
pnpm install
cp infra/compose/.env.example infra/compose/.env
pnpm infra:up            # Postgres + PostGIS, both Valkeys, MinIO
pnpm dev                 # every service natively, plus the console on :5173
```

Each service reads its own `.env`. The first time, copy `.env.example` to `.env` in each
`services/*` folder. A service with a missing or invalid variable stops at start and lists
every problem, so a typo never shows up later mid trip.

The mobile apps run in Expo Go (SDK 57). Start one, then scan the QR code with Expo Go:

```sh
pnpm --filter @collabo/rider dev     # bundler on :8100
pnpm --filter @collabo/driver dev    # bundler on :8101
```

An app moves to a dev build only when a feature needs native code that Expo Go lacks.

## Everyday commands

| Command | What it does |
|---|---|
| `pnpm dev` | All services and apps in watch mode (Turborepo) |
| `pnpm build` / `pnpm test` / `pnpm typecheck` | Run that task in every workspace, Go and Python included |
| `pnpm contracts:gen` | Regenerate TS, Go, and Python types from `packages/contracts/openapi.yaml` |
| `pnpm infra:up` / `pnpm infra:down` | Start or stop the data stores |
| `pnpm full:up` / `pnpm full:down` | Build and run everything in containers behind Caddy on http://localhost:8000 |
| `pnpm smoke:bullmq` | Check BullMQ on Valkey: enqueue, delay, and retry |
| `pnpm smoke:contracts` | Check codegen for TS, Go, and Python on a tricky sample schema |

## Testing

`pnpm test` runs every suite:

| Where | Runner | Covers |
|---|---|---|
| `packages/service-kit` | Vitest | Signed context, env validation, error shape, request ids, health |
| `services/*` (TS) | Vitest | Each service's required environment variables |
| `services/dispatch` | `go test` | Signed context, config, HTTP shell |
| `services/fraud` | pytest (via uv) | Signed context, settings, HTTP shell |

The signed context is implemented three times (TS, Go, Python). All three test against the
same vectors in `packages/contracts/test-vectors/context-signature.json`, so they can't
drift apart.

To run one workspace: `pnpm --filter @collabo/service-kit test`, `go test ./...` in
`services/dispatch`, or `uv run pytest` in `services/fraud`.

## Layout

```
apps/        rider, driver (Expo SDK 57, Expo Go), console (Vite + React + TanStack Router)
services/    gateway accounts trip payments notifications realtime (Express 5, TS)
             dispatch (Go), fraud (Python, FastAPI)
packages/    contracts (OpenAPI, codegen, shared test vectors), service-kit, config
infra/       compose (profiles infra, full, routing), caddy, osrm
scripts/     smoke tests
```

| Service | Port | | Service | Port |
|---|---|---|---|---|
| gateway | 8080 | | payments | 8084 |
| accounts | 8081 | | notifications | 8085 |
| trip | 8082 | | realtime | 8086 |
| dispatch | 8083 | | fraud | 8087 |

## How services trust each other

* **One public door.** Only the gateway and realtime face the internet, both through Caddy.
* **Signed context.** The gateway checks the user's token, then forwards `x-user-id`,
  `x-user-role`, `x-phone-verified`, `x-request-id`, `x-ctx-ts`, and `x-ctx-sig` (an HMAC
  SHA256 signature made with `GATEWAY_CONTEXT_KEY`). Every other service rejects a request
  whose signature is wrong or whose timestamp is more than 30 seconds off.
* **Open health checks.** `GET /health` needs no context on any service.
* **One error shape.** Every error is `{ code, message, retryAfter? }`, for example
  `401 BAD_CONTEXT` or `404 NOT_FOUND`.
* **Traceable requests.** Every response carries `x-request-id`, reused from the caller or
  generated fresh.
* **Own your data.** Each service connects with its own database role, which can only read
  and write its own schema.
