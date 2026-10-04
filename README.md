# home-page

A self-hosted homelab dashboard. One page shows every service as a card, with:

- a live status dot per Docker container
- the host's CPU, memory, temperature, uptime and disk usage
- per-container CPU, memory and network, opened from the status dot
- a restart button for each container, behind a confirming second click

## Stack

A pnpm workspace in TypeScript:

| Part             | What                                                         |
| :--------------- | :----------------------------------------------------------- |
| `apps/web`       | React 19, Vite 8, Tailwind 4, TanStack Query, React Compiler |
| `apps/server`    | Hono on Node 24, run as `.ts` directly, with no build step   |
| `packages/types` | The API's shared types                                       |

In production, one container serves the built page and the API on port 3000.

## Configuration

The dashboard's content is not in this repo. It lives in two gitignored paths
under `config/`, mounted read-only into the container:

- `config/dashboard.yaml`: the greeting, the disks to show, and the groups of
  service cards. Copy [`config/dashboard.example.yaml`](config/dashboard.example.yaml),
  which documents every field.
- `config/icons/`: your own card icons, referenced as `/icons/<file>`. Icons
  can also be [dashboard-icons](https://github.com/homarr-labs/dashboard-icons)
  names (`jellyfin.png`) or Material Design glyphs (`mdi-robot`).

The server reads both at startup and refuses to start on an invalid config, so
restart the container after editing:

```sh
docker restart home-page
```

Each disk listed in `dashboard.yaml`, other than `/`, also needs a read-only
mount at the same path in [`docker-compose.yaml`](docker-compose.yaml).

## Docker access

The app never mounts `docker.sock`: anything that can reach the socket is root
on the host. Two [docker-socket-proxy](https://github.com/Tecnativa/docker-socket-proxy)
sidecars stand in for it:

| Proxy           | Allows                                  | Used for              |
| :-------------- | :-------------------------------------- | :-------------------- |
| `socket-proxy`  | GET on `/containers` only               | status dots and usage |
| `restart-proxy` | restart, stop and kill of one container | the restart button    |

The server also answers only for containers named in `dashboard.yaml`, and a
restart must carry a header that another website cannot add, so a page open
elsewhere on the network cannot restart anything.

## Running it

Production, on the Docker host:

```sh
cp config/dashboard.example.yaml config/dashboard.yaml   # then edit
mkdir -p config/icons
pnpm prod        # docker compose up -d --build
```

Development, with the proxies running from `pnpm prod`:

```sh
pnpm install
pnpm dev         # Hono on 7051, Vite on 7053
```

| Port | Use                          |
| :--- | :--------------------------- |
| 3000 | the app                      |
| 7051 | Hono in dev                  |
| 7052 | read proxy, loopback only    |
| 7053 | Vite in dev                  |
| 7054 | restart proxy, loopback only |

## Checks

```sh
pnpm test        # Vitest, both apps
pnpm typecheck
pnpm lint        # ESLint on the web app
pnpm format      # Prettier
```

The Docker build runs the type check and the tests too, so a broken commit
fails the build and the running container keeps serving.

## Deployment

`pnpm deploy` pulls and rebuilds. On the author's server a systemd timer runs
it whenever the `development` branch moves on GitHub.

## Docs

[`docs/MVP.md`](docs/MVP.md) records how the first version was planned and
built, and why each decision went the way it did.
