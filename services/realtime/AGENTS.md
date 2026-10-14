# realtime service

## Overview

Express 5 service on port 8086 (no schema): Socket.IO connections, JWT check on connect, per trip rooms, fan out from Valkey Streams to the apps. On reconnect it fetches current trip state from Trip `/internal`. Root `AGENTS.md` rules apply; deeper conventions get added when you run `/audit services/realtime` or first build here.

## Stack

- TypeScript (ESM, strict) on Node 26, Express 5, Zod
- Shared bootstrap from `@collabo/service-kit`
- Planned per spec 0009: Socket.IO with the Valkey adapter (`ioredis`)
- `tsx watch` in dev, `tsup` build, `vitest` tests

## Commands

```bash
pnpm --filter @collabo/realtime dev        # tsx watch, reads .env if present
pnpm --filter @collabo/realtime build      # tsup to dist/
pnpm --filter @collabo/realtime test       # vitest
pnpm --filter @collabo/realtime typecheck  # tsc
pnpm --filter @collabo/realtime lint       # oxlint + oxfmt --check
```

## Key files

| File | Owns |
|---|---|
| `src/index.ts` | Service entry: builds the app from service-kit and listens |
| `src/env.ts` | Env schema, validated at boot; keep `.env.example` in step |

## Gotchas

- Checks the JWT itself on connect (same JWKS and denylist as the gateway); it never receives gateway context headers.

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
