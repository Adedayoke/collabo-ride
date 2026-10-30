# Collabo Ride

## Stack

- **Shape**: monorepo of eight services by domain, two Expo apps, one ops console (spec [0009](docs/specs/0009-stack-architecture/index.md))
- **Languages / runtimes**: TypeScript on Node 26 (ESM only); Go 1.27 (dispatch); Python 3.14 with uv (fraud)
- **Frameworks**: Express 5 services; FastAPI (fraud); Expo SDK 57 + Expo Router (rider, driver); Vite + React 19 + TanStack Router (console)
- **Data**: Postgres 18 + PostGIS, one schema and DB role per service; Valkey `live` (GEO, rate limits) and `durable` (Streams events via an outbox, BullMQ)
- **Contract**: hand written OpenAPI 3.1 in `packages/contracts`, codegen to TS (orval), Go (oapi-codegen), Python (datamodel-code-generator)
- **Package manager**: pnpm 10 workspaces + Turborepo (`node-linker=hoisted`); uv and Go modules inside their services

## Build approach

**Tracer Bullet**: prove one thin, real thread through every layer first, then thicken one segment at a time, each end to end.

## Commands

```bash
pnpm install
pnpm infra:up                          # Postgres, both Valkeys, OSRM, MinIO in Docker
pnpm dev                               # every app and service natively, via turbo
pnpm --filter @collabo/<name> dev      # one workspace
pnpm build && pnpm typecheck && pnpm test
pnpm lint                              # every linter and format check, plus the repo root
pnpm format                            # apply lint fixes and formatting everywhere
pnpm contracts:gen                     # regenerate TS, Go, Python from the OpenAPI source
pnpm full:up                           # every service in containers
pnpm db:bootstrap                      # apply the rerunnable postgres-init scripts to a running volume
pnpm db:migrate                        # every service's migrations, each under its own role
pnpm db:check                          # schema convention check across all six schemas (DB_ADMIN_URL)
pnpm db:guard                          # migrations may only add: no drops, renames, or type changes
```

## Specs

Stored in `docs/specs/`, one folder each: `docs/specs/NNNN-title/index.md`. The feature scope lives in `docs/scope/`.

## Rules

- Domain Driven Design: each service is a bounded context that owns its schema, DB role, and model. Never read another service's tables or share domain objects; call `/internal/*` or keep a local copy built from events.
- Aggregates are the consistency boundary, referenced across contexts by ID only. A state change and its domain event (past tense, like `TripCompleted`) commit in one transaction through the outbox.
- Code speaks the domain's language (rider, driver, offer, counter offer, Collabo, fare share). Money, phone numbers, and locations are immutable value objects, validated on construction.
- Repositories own persistence behind an interface the domain defines; application services coordinate use cases and hold no domain logic. External providers (SMS, push, payments, storage, ID checks) sit behind one anti corruption module, swapped by env vars.
- Folder by feature: `src/<feature>/` holds its route, domain, repository, and tests. Framework folders stay as they are (Expo Router `src/app/`, Go `cmd/` + `internal/`, Python `app/`).
- Strict types: no `any`, no unchecked casts, exhaustive switches over unions; Python fully type hinted and checked; Go clean under `go vet` and golangci-lint.
- Named exports only; default exports only where a framework demands them (Expo Router screens, tool config files).
- One error pattern per language: `service-kit` errors in TS, wrapped `%w` errors in Go, typed exceptions mapped by one FastAPI handler. Never leak internals to clients.
- Validate env at boot (Zod via `service-kit`, envconfig, pydantic-settings) and keep each `.env.example` in step. Every request and event carries `x-request-id`.
- Accessibility: WCAG AA on the console; labels, roles, and 44pt touch targets in the mobile apps.
- Testing gate: unit plus integration tests (vitest, go test, pytest; integration against the compose Postgres and Valkey) for anything touching money, events, or data.
- Conventional commits: `type(scope): summary`.

## Tooling

Chosen here, installed by `/develop tooling`: oxlint + oxfmt for every TS workspace (shared oxlint config in `packages/config`, one root `.oxfmtrc.json`), Ruff for Python, gofmt + golangci-lint for Go (pinned as a Go tool in `services/dispatch/tools/golangci-lint.mod`) · lefthook pre commit runs lint, format, and typecheck on staged files · GitHub Actions on push and PR runs lint, typecheck, and test through turbo, plus a contracts drift check (`.github/workflows/ci.yml`) · `.gitattributes` pins LF line endings so formatters agree on every OS.

## Git

- integration: on
- branch prefix: feat/
- commit: per-milestone

## Agent skills

- [turborepo](.agents/skills/turborepo/): `vercel/turborepo`, task pipelines, caching, filters, workspace config
- [docker-compose-patterns](.agents/skills/docker-compose-patterns/): `docker/skills`, the `infra` and `full` compose profiles
- [docker-build-strategies](.agents/skills/docker-build-strategies/): `docker/skills`, multi stage, non root service images
- [docker-destructive-guardrails](.agents/skills/docker-destructive-guardrails/): `docker/skills`, load before any prune, rm, or volume wipe
- [oxlint](.agents/skills/oxlint/): `delexw/claude-code-misc`, running and configuring oxlint rules and plugins
- [lefthook](.agents/skills/lefthook/): `fandhe-ai/agent-reference-skills`, `lefthook.yml` hooks, globs, staged files
- [golang-lint](.agents/skills/golang-lint/): `samber/cc-skills-golang`, golangci-lint config and fixing findings (dispatch)
- [modern-python](.agents/skills/modern-python/): `trailofbits/skills`, uv, Ruff, and typed modern Python (fraud)

## Context files

- [apps/rider/AGENTS.md](apps/rider/AGENTS.md): rider Expo app (Expo authored, Expo Router, EAS)
- [apps/driver/AGENTS.md](apps/driver/AGENTS.md): driver Expo app (Expo authored, Expo Router, EAS)
- [apps/console/AGENTS.md](apps/console/AGENTS.md): ops console, Vite + TanStack Router
- [services/gateway/AGENTS.md](services/gateway/AGENTS.md): public entry, JWT, rate limit, routing
- [services/accounts/AGENTS.md](services/accounts/AGENTS.md): identities and Better Auth
- [services/trip/AGENTS.md](services/trip/AGENTS.md): requests, offers, trip state machine
- [services/dispatch/AGENTS.md](services/dispatch/AGENTS.md): Go, live locations and matching
- [services/payments/AGENTS.md](services/payments/AGENTS.md): wallet, ledger, payouts
- [services/notifications/AGENTS.md](services/notifications/AGENTS.md): push, SMS, chat
- [services/realtime/AGENTS.md](services/realtime/AGENTS.md): Socket.IO fan out
- [services/fraud/AGENTS.md](services/fraud/AGENTS.md): Python, Collabo scoring and fraud flags
- [packages/contracts/AGENTS.md](packages/contracts/AGENTS.md): OpenAPI source and codegen
- [packages/service-kit/AGENTS.md](packages/service-kit/AGENTS.md): shared Express bootstrap
- [packages/config/AGENTS.md](packages/config/AGENTS.md): shared tsconfig and lint config
- [packages/db-tools/AGENTS.md](packages/db-tools/AGENTS.md): schema convention check, isolation test, migration guard

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
