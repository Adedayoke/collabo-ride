# notifications service

## Overview

Express 5 service on port 8085, schema `notifications`: push, SMS, in trip chat, masked calls, user alert preferences. It reacts to events and is never called synchronously on the rider's path. Root `AGENTS.md` rules apply; deeper conventions get added when you run `/audit services/notifications` or first build here.

## Stack

- TypeScript (ESM, strict) on Node 26, Express 5, Zod
- Shared bootstrap from `@collabo/service-kit`
- Planned per spec 0009: SMS and push providers each behind one module, swapped by env vars
- `tsx watch` in dev, `tsup` build, `vitest` tests

## Commands

```bash
pnpm --filter @collabo/notifications dev        # tsx watch, reads .env if present
pnpm --filter @collabo/notifications build      # tsup to dist/
pnpm --filter @collabo/notifications test       # vitest
pnpm --filter @collabo/notifications typecheck  # tsc
pnpm --filter @collabo/notifications lint       # oxlint + oxfmt --check
```

## Key files

| File | Owns |
|---|---|
| `src/index.ts` | Service entry: builds the app from service-kit and listens |
| `src/env.ts` | Env schema, validated at boot; keep `.env.example` in step |

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
