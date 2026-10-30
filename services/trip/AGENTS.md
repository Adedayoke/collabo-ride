# trip service

## Overview

Express 5 service on port 8082, schema `trip`: ride requests, offers and counter offers, the trip state machine, PIN, ratings, SOS, scheduled rides, breadcrumbs. Root `AGENTS.md` rules apply; deeper conventions get added when you run `/audit services/trip` or first build here.

## Stack

- TypeScript (ESM, strict) on Node 26, Express 5, Zod
- Shared bootstrap from `@collabo/service-kit`
- Planned per spec 0009: Drizzle (`pg` driver, PostGIS), BullMQ jobs for offer expiry and scheduled rides
- `tsx watch` in dev, `tsup` build, `vitest` tests

## Commands

```bash
pnpm --filter @collabo/trip dev        # tsx watch, reads .env if present
pnpm --filter @collabo/trip build      # tsup to dist/
pnpm --filter @collabo/trip test       # vitest
pnpm --filter @collabo/trip typecheck  # tsc
pnpm --filter @collabo/trip lint       # oxlint + oxfmt --check
pnpm --filter @collabo/trip db:migrate # apply drizzle/ migrations (MIGRATION_DATABASE_URL, else DATABASE_URL)
pnpm --filter @collabo/trip db:generate # drizzle-kit generate from src/db/schema.ts
```

## Key files

| File | Owns |
|---|---|
| `src/index.ts` | Service entry: builds the app from service-kit and listens |
| `src/env.ts` | Env schema, validated at boot; keep `.env.example` in step |
| `src/db/schema.ts` | Drizzle tables, status lists, CHECKs, and the partial unique indexes behind exclusivity |
| `src/db/views.ts` | The scoped repository: the only place user facing reads of `trip_riders` happen |
| `src/db/accept.ts`, `src/db/requests.ts` | Open a request and accept it (incl. Collabo join) in one transaction |
| `src/db/conflicts.ts` | Unique index name → 409 code map |
| `src/db/events.ts` | Outbox payload builders for every trip event |

## Conventions

- A rider sees only their own `trip_riders` row (fare and PIN); a driver sees every row but never a PIN. Read through `src/db/views.ts`, never query `trip_riders` from a route (spec 0010, AC-4).
- No event payload ever carries a PIN.
- A new partial unique index needs its entry in `UNIQUE_CONFLICTS` so a violation surfaces as its 409.
- DB tests run against the compose Postgres: `pnpm infra:up` and `pnpm db:migrate` first, `DATABASE_URL` in `.env`.

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
