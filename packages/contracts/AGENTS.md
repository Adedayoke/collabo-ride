# Contracts

## Overview

The single source of truth for every API: a hand written OpenAPI 3.1 document, plus generated clients and types for TS, Go, and Python, the shared outbox SQL, and the context signature test vectors.

## Stack

- OpenAPI 3.1: `openapi.yaml` root, `paths/<service>.yaml` per service, shared `components/`
- Codegen through `scripts/gen.mjs`: orval (TS clients, TanStack Query hooks, Zod), oapi-codegen (Go), datamodel-code-generator (Python)

## Commands

```bash
pnpm contracts:gen                          # regenerate TS, Go, and Python output
pnpm --filter @collabo/contracts typecheck
pnpm --filter @collabo/contracts lint
```

## Conventions

- Edit the YAML, then run `pnpm contracts:gen`. Never hand edit `generated/`, `services/dispatch/internal/contract`, or `services/fraud/app/contract`.
- Tag every operation with its service and its audience (`public`, `internal`, `admin`). Public routes live under `/v1/<service>`.
- CI fails when generated output drifts from the YAML.

## Gotchas

- Codegen guarantees matching types, not matching handlers: services wire the generated Zod schemas into routes by hand.

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
