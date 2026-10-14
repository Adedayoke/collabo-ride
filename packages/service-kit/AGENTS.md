# Service kit

## Overview

The shared Express bootstrap every TS service builds on: env validation, health route, signed context signing and checking, JWT verify, outbox writer and relay, event consumer helper, and the one error shape.

## Stack

- TypeScript (ESM, strict), Express 5, Zod, vitest

## Commands

```bash
pnpm --filter @collabo/service-kit test
pnpm --filter @collabo/service-kit typecheck
pnpm --filter @collabo/service-kit lint
```

## Key files

| File | Owns |
|---|---|
| `src/index.ts` | Public exports |
| `src/service.ts` | Builds a service app (middleware, health route) |
| `src/env.ts` | Zod env validation helpers |
| `src/context.ts` | Signed context (`x-ctx-sig`), matching the shared vectors |
| `src/errors.ts` | The error shape every TS service returns |

## Conventions

- Every export is public API for six services: give it a doc comment and change it with care.
- Context signing must stay byte for byte compatible with the Go and Python checks; run the shared vectors on every change.

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
