# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

A self-hosted homelab dashboard: service cards with live Docker status, host
readings, per-container usage and restarts. pnpm workspace, TypeScript
throughout. Read [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) before
changing how anything talks to Docker or reads the host.

## Commands

```sh
pnpm dev                     # Hono on 7051 + Vite on 7053; open :7053
pnpm test                    # Vitest, server and web
pnpm typecheck
pnpm lint                    # ESLint, web only
pnpm format                  # Prettier
pnpm prod                    # docker compose up -d --build, serves :3000

# one file, or one test by name
pnpm --filter server exec vitest run src/docker-stats.test.ts
pnpm --filter web exec vitest run -t 'nearly full'
```

Check `ss -ltn` before `pnpm dev`: the deployed container holds 3000 and the
proxies 7052 and 7054. Dev reaches Docker only through those proxies, so they
must be running (`pnpm prod` starts them).

## Things that bite

- **The server runs TypeScript directly** (`node src/index.ts`, Node's type
  stripping). Relative imports need the `.ts` extension, type imports need
  `import type`, and `enum`/`namespace` are out. Never import a runtime value
  from `@home-page/types`: the production image ships its `package.json`
  only.
- **`config/dashboard.yaml` and `config/icons/` are gitignored and must stay
  out of git and the image.** They name internal hosts and the repo is public.
  `config/dashboard.example.yaml` is the committed copy; a test parses it, so
  update it with any schema change.
- **The restart endpoint restarts real containers** on this host, as does the
  restart proxy on 7054. To try a restart by hand, use `recyclarr`, which has
  no UI. Most containers on the host, Portainer included, are on the
  dashboard, so the allowlist will not stop a mistake.
- **Docker access goes only through the two proxies.** Never mount
  `docker.sock` into the app, never give `socket-proxy` `POST=1`, and never
  publish either proxy beyond `127.0.0.1`.
- **The config is read once at boot.** After editing `dashboard.yaml` or
  `config/icons/`, run `docker restart home-page`. An invalid file stops the
  container with a zod error.
- **Each disk in `dashboard.yaml`, other than `/`, needs a matching `:ro`
  mount in `docker-compose.yaml`**, or it silently reports the root disk.

## Conventions

- Prettier: 4-space indent, no semicolons, single quotes, Tailwind classes
  sorted. ESLint enforces the same class order, so the two never disagree.
- Conventional Commits, enforced by commitlint. The pre-commit hook runs
  ESLint and Prettier on staged files, then `pnpm typecheck`.
- Tests are co-located `*.test.ts`, split by behaviour (`docker.test.ts`,
  `docker-stats.test.ts`). HTTP behaviour is tested through `createApp` and
  `app.request`, with a real `node:http` server standing in for Docker.
- Styling lives in Tailwind `@theme` tokens in `apps/web/src/index.css` (the
  ORION theme: `star`, `dim`, `sirius`, `betelgeuse`, `panel`, `rule`).
  Use the tokens, not raw colours.
- `development` is the deploy branch; a timer on the host runs `pnpm deploy`
  when it moves on GitHub. `master` holds only an empty initial commit.
