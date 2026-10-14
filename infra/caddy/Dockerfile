# syntax=docker/dockerfile:1
# Builds the ops console and serves it with Caddy alongside the API routes.
FROM node:26-slim AS build
RUN npm install -g pnpm@10.25.0 turbo@2.11.8
WORKDIR /repo
COPY . .
RUN turbo prune @collabo/console --docker --out-dir /pruned

FROM node:26-slim AS console
RUN npm install -g pnpm@10.25.0
WORKDIR /repo
COPY --from=build /pruned/json/ .
ENV npm_config_network_concurrency=4 npm_config_fetch_retries=8 npm_config_fetch_retry_mintimeout=5000 npm_config_fetch_timeout=120000 npm_config_store_dir=/pnpm-store
RUN --mount=type=cache,id=pnpm-store,target=/pnpm-store pnpm install --frozen-lockfile
COPY --from=build /pruned/full/ .
ENV VITE_API_URL=
RUN pnpm --filter @collabo/console build

FROM caddy:2.10
COPY infra/caddy/Caddyfile /etc/caddy/Caddyfile
COPY --from=console /repo/apps/console/dist /srv/console
