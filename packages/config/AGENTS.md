# Config

## Overview

Shared TypeScript and oxlint config for every TS workspace. Formatting config lives in the root `.oxfmtrc.json` (oxfmt has no `extends`).

## Stack

- `tsconfig.node.json`: ES2024, ESNext modules, Bundler resolution, `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `verbatimModuleSyntax`
- `oxlint.json`: base rules for every TS workspace (named exports only, no `any`, no non null assertions outside tests, type only imports)
- `oxlint.react.json`: extends the base, adds React hooks and jsx a11y rules for the three apps

## Conventions

- Loosening a compiler or lint rule here loosens it everywhere. Tighten freely; loosen only with a reason in the commit message.
- Each TS workspace has a small `.oxlintrc.json` that extends one of these files by relative path; put framework exceptions (Expo Router screens, TanStack routes) there, not in the shared files.

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
