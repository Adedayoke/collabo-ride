# gateway service

## Overview

The only public HTTP entry, on port 8080 (no schema): JWT check against cached JWKS, denylist check, rate limit, request id, and routing `/v1/<service>` to services through a static route map. Root `AGENTS.md` rules apply; deeper conventions get added when you run `/audit services/gateway` or first build here.

## Stack

- TypeScript (ESM, strict) on Node 26, Express 5, Zod
- Shared bootstrap from `@collabo/service-kit` (env validation, health route, signed context, error shape)
- `tsx watch` in dev, `tsup` build, `vitest` tests

## Commands

```bash
pnpm --filter @collabo/gateway dev        # tsx watch, reads .env if present
pnpm --filter @collabo/gateway build      # tsup to dist/
pnpm --filter @collabo/gateway test       # vitest
pnpm --filter @collabo/gateway typecheck  # tsc
pnpm --filter @collabo/gateway lint       # oxlint + oxfmt --check
```

## Key files

| File | Owns |
|---|---|
| `src/index.ts` | Service entry: builds the app from service-kit and listens |
| `src/env.ts` | Env schema, validated at boot; keep `.env.example` in step |

## Conventions

- Signs the forwarded context (`x-ctx-sig`) with `GATEWAY_CONTEXT_KEY`; every other service trusts only that signature.
- Generates `x-request-id` when missing and passes it on.

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
