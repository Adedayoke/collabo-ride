# payments service

## Overview

Express 5 service on port 8084, schema `payments`: cards, wallet, ledger, commission and cash settlement, payouts, promo codes, referral rewards, Collabo fare split. Root `AGENTS.md` rules apply; deeper conventions get added when you run `/audit services/payments` or first build here.

## Stack

- TypeScript (ESM, strict) on Node 26, Express 5, Zod
- Shared bootstrap from `@collabo/service-kit`
- Planned per spec 0009: Drizzle (`pg` driver), BullMQ for payout retries, payment provider behind one module (sandbox now)
- `tsx watch` in dev, `tsup` build, `vitest` tests

## Commands

```bash
pnpm --filter @collabo/payments dev        # tsx watch, reads .env if present
pnpm --filter @collabo/payments build      # tsup to dist/
pnpm --filter @collabo/payments test       # vitest
pnpm --filter @collabo/payments typecheck  # tsc
pnpm --filter @collabo/payments lint       # oxlint + oxfmt --check
```

## Key files

| File | Owns |
|---|---|
| `src/index.ts` | Service entry: builds the app from service-kit and listens |
| `src/env.ts` | Env schema, validated at boot; keep `.env.example` in step |

## Gotchas

- Money never leaves this service mid flight: every charge, ledger entry, and balance change commits in one transaction with an idempotency key unique at the database level.
- A Collabo rider's fare share is kept apart from the driver's earnings; one rider must never be able to read another's fare.

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
