# DB tools

## Overview

Cross schema database checks for the whole repo (spec [0010](../../docs/specs/0010-data-model/index.md)): the schema convention check (AC-1), the schema isolation test (AC-2), the additive only migration guard (AC-7), and the shared baseline drift test (AC-3). It owns no schema and ships no runtime code.

## Commands

```bash
pnpm db:check                              # convention check against every service schema
pnpm db:guard [files...]                   # guard the given migrations, else every one changed since GUARD_BASE (default origin/main)
pnpm --filter @collabo/db-tools test       # vitest, against the compose Postgres
pnpm --filter @collabo/db-tools typecheck
pnpm --filter @collabo/db-tools lint
```

## Key files

| File | Owns |
|---|---|
| `src/conventions.ts`, `src/conventions.sql` | The convention rules (uuid ids, bigint kobo, timestamptz, geography, no enums, snake_case) and the schema list |
| `src/check.ts` | `pnpm db:check` entry |
| `src/migration-guard.ts` | The guard rules; `isMigration` knows each tool's migration folder (Drizzle, goose, Alembic) |
| `src/guard.ts` | `pnpm db:guard` entry; lefthook passes staged files, CI compares with main |
| `src/db.test-helpers.ts` | Test env loading, admin and per role connection URLs |

## Conventions

- Tests need `pnpm infra:up`, `pnpm db:bootstrap`, and `pnpm db:migrate` first. They read `DB_ADMIN_URL` from this package's `.env` and each role's password from `infra/compose/.env`.
- A table keyed by another table's id (no `id` column) must be listed in `KEYED_ELSEWHERE`, or the convention check fails it.
- Widening a CHECK is the one allowed drop: DROP and ADD the same constraint name in a migration marked `-- guard: widen-check`.
- A new service schema goes in `SERVICE_SCHEMAS` so the check and the isolation test cover it.

_Drafted by /sync from the introducing change, worth a quick human pass._
