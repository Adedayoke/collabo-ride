# syntax=docker/dockerfile:1
# Multi stage build with turbo prune (spec 0009, Containers).
FROM node:26-slim AS base
RUN npm install -g pnpm@10.25.0

FROM base AS prune
RUN npm install -g turbo@2.11.8
WORKDIR /repo
COPY . .
RUN turbo prune @collabo/gateway --docker --out-dir /pruned

FROM base AS build
WORKDIR /repo
COPY --from=prune /pruned/json/ .
ENV npm_config_network_concurrency=4 npm_config_fetch_retries=8 npm_config_fetch_retry_mintimeout=5000 npm_config_fetch_timeout=120000 npm_config_store_dir=/pnpm-store
RUN --mount=type=cache,id=pnpm-store,target=/pnpm-store pnpm install --frozen-lockfile
COPY --from=prune /pruned/full/ .
RUN --mount=type=cache,id=pnpm-store,target=/pnpm-store pnpm turbo run build --filter=@collabo/gateway  && pnpm --filter @collabo/gateway deploy --prod --legacy /out

FROM node:26-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /out/node_modules ./node_modules
COPY --from=build --chown=node:node /repo/services/gateway/dist ./dist
COPY --from=build --chown=node:node /repo/services/gateway/package.json ./package.json
USER node
EXPOSE 8080
CMD ["node", "dist/index.js"]
