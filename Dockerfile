# Production image: Hono serves the built SPA, /api and /icons on 3000.
# config/dashboard.yaml and config/icons are mounted at run time, never copied.

FROM node:24-slim AS build

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

WORKDIR /app

# Manifests first, so the install layer is cached until a dependency changes.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/server/package.json apps/server/
COPY apps/web/package.json apps/web/
COPY packages/types/package.json packages/types/

# --ignore-scripts: the root `prepare` runs husky, which needs .git.
RUN pnpm install --frozen-lockfile --ignore-scripts

COPY . .

# Node strips types without checking them, so a type error has to fail here.
RUN pnpm typecheck && pnpm test && pnpm --filter web build

FROM node:24-slim

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/server/package.json apps/server/
COPY packages/types/package.json packages/types/

RUN pnpm install --filter server --prod --frozen-lockfile --ignore-scripts

COPY apps/server/src apps/server/src
COPY --from=build /app/apps/web/dist apps/web/dist

ENV NODE_ENV=production
USER node
EXPOSE 3000

HEALTHCHECK CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/health').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"]

CMD ["node", "apps/server/src/index.ts"]
