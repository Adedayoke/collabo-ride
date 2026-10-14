# accounts service

## Overview

Express 5 service on port 8081, schema `accounts`: users, phone and Google identities (Better Auth), profiles, emergency contacts, staff roles, suspensions, driver documents, vehicles, approvals, ID verification. Root `AGENTS.md` rules apply; deeper conventions get added when you run `/audit services/accounts` or first build here.

## Stack

- TypeScript (ESM, strict) on Node 26, Express 5, Zod
- Shared bootstrap from `@collabo/service-kit`
- Planned per spec 0009: Better Auth (phone OTP, Google, JWT plugin with JWKS, Expo client) on the Drizzle adapter; S3 storage module (MinIO now, R2 later)
- `tsx watch` in dev, `tsup` build, `vitest` tests

## Commands

```bash
pnpm --filter @collabo/accounts dev        # tsx watch, reads .env if present
pnpm --filter @collabo/accounts build      # tsup to dist/
pnpm --filter @collabo/accounts test       # vitest
pnpm --filter @collabo/accounts typecheck  # tsc
pnpm --filter @collabo/accounts lint       # oxlint + oxfmt --check
```

## Key files

| File | Owns |
|---|---|
| `src/index.ts` | Service entry: builds the app from service-kit and listens |
| `src/env.ts` | Env schema, validated at boot; keep `.env.example` in step |

## Gotchas

- Port 8081 is also Expo's default bundler port; that is why the apps run on 8100 and 8101.
- Suspending a user or revoking sessions must also write `deny:user:<id>` to valkey-live with a 10 minute TTL.

## Agent skills

- [better-auth-best-practices](../../.agents/skills/better-auth-best-practices/): `better-auth/skills`, server and client setup, adapters, plugins, env
- [better-auth-security-best-practices](../../.agents/skills/better-auth-security-best-practices/): `better-auth/skills`, rate limits, secrets, cookies, trusted origins
- [create-auth](../../.agents/skills/create-auth/): `better-auth/skills`, scaffolding auth routes and providers
- [two-factor-authentication-best-practices](../../.agents/skills/two-factor-authentication-best-practices/): `better-auth/skills`, OTP and second factor flows
- [email-and-password-best-practices](../../.agents/skills/email-and-password-best-practices/): `better-auth/skills`, only if email sign in is ever added (none planned)
- [organization-best-practices](../../.agents/skills/organization-best-practices/): `better-auth/skills`, org and role plugin, if staff roles move onto it

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
