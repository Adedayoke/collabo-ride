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
```

## Key files

| File | Owns |
|---|---|
| `src/index.ts` | Service entry: builds the app from service-kit and listens |
| `src/env.ts` | Env schema, validated at boot; keep `.env.example` in step |

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
