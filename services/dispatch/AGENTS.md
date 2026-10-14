# dispatch service

## Overview

Go service on port 8083, schema `dispatch`: online drivers, live locations (Valkey GEO), radius fan out of ride requests, Collabo route overlap via OSRM. Root `AGENTS.md` rules apply; deeper conventions get added when you run `/audit services/dispatch` or first build here.

## Stack

- Go 1.27 (module `collaboride/dispatch`), envconfig
- Planned per spec 0009: go-redis, sqlc, goose migrations
- Generated contract types in `internal/contract` (oapi-codegen, through `pnpm contracts:gen`)

## Commands

```bash
pnpm --filter @collabo/dispatch dev        # go run ./cmd/dispatch
pnpm --filter @collabo/dispatch build      # go build -o bin/dispatch
pnpm --filter @collabo/dispatch test       # go test ./...
pnpm --filter @collabo/dispatch typecheck  # go vet ./...
pnpm --filter @collabo/dispatch lint       # golangci-lint run (includes gofmt, goimports)
pnpm --filter @collabo/dispatch format     # golangci-lint fmt
```

## Key files

| File | Owns |
|---|---|
| `cmd/dispatch/` | Entry point |
| `internal/config/` | envconfig settings, validated at boot |
| `internal/ctxsig/` | Signed context check, tested against the shared vectors in `packages/contracts` |
| `internal/server/` | HTTP server and routes |

## Conventions

- Tests sit beside the source as `*_test.go`. Format with gofmt, lint with golangci-lint (`.golangci.yml`; run it as `go tool -modfile=tools/golangci-lint.mod golangci-lint`, the first build is slow).
- Wrap errors with `fmt.Errorf("...: %w", err)`; never return internals to callers.
- Drivers silent for 30 seconds are removed from the GEO set.

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
