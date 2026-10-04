# Architecture

How the dashboard is put together, and the decisions a change is most likely
to undo by accident. The history of how each decision was reached is in
[`MVP.md`](MVP.md).

## Shape

```
browser ── :3000 ──▶ home-page (Hono, Node 24, uid 1000)
                       ├─ /            built SPA (apps/web/dist)
                       ├─ /icons/*     config/icons, mounted :ro
                       ├─ /api/*       JSON, see below
                       │    ├─ reads   /proc, /sys/class/hwmon, statfs(each disk)
                       │    ├─ reads   /deploy-state/<repo>.json, mounted :ro
                       │    ├─ GET  ─▶ socket-proxy  :2375 ─▶ docker.sock :ro
                       │    └─ POST ─▶ restart-proxy :2375 ─▶ docker.sock :ro
                       └─ config/dashboard.yaml, mounted :ro, read once at boot
```

Three containers from one [`docker-compose.yaml`](../docker-compose.yaml). In
dev, Vite (7053) serves the page and proxies `/api` and `/icons` to Hono (7051),
which reaches the proxies on their loopback ports, 7052 and 7054.

## Workspace

| Path                        | Owns                                                                                  |
| :-------------------------- | :------------------------------------------------------------------------------------ |
| `apps/server/src/index.ts`  | Environment, config load, `serve`. Nothing else.                                      |
| `apps/server/src/app.ts`    | `createApp`: every route, the allowlist, error handling. The test seam for HTTP.      |
| `apps/server/src/config.ts` | The `dashboard.yaml` schema and its mapping to the `Dashboard` type, icon resolution. |
| `apps/server/src/docker.ts` | The only module that knows Docker's JSON: container state, stats, restart.            |
| `apps/server/src/system.ts` | Host readings: CPU, memory, temperature, uptime, disks.                               |
| `apps/server/src/deploy.ts` | Reads auto-deploy's status files; builds GitHub commit links.                         |
| `apps/web/src/api.ts`       | Every fetch and query option. Components never call `fetch`.                          |
| `apps/web/src/format.ts`    | Display rules with tests: bytes, uptime, disk fill.                                   |
| `apps/web/src/components/`  | One component per file.                                                               |
| `apps/web/src/index.css`    | The theme: Tailwind `@theme` tokens, the backdrop, the group transition.              |
| `packages/types`            | The API's response types. Type-only, no build.                                        |

## API

| Route                                | Returns                                 | Web polls                               |
| :----------------------------------- | :-------------------------------------- | :-------------------------------------- |
| `GET /api/health`                    | `ok`                                    | healthcheck only                        |
| `GET /api/dashboard`                 | `Dashboard`: greeting, disks, groups    | once (`staleTime: Infinity`)            |
| `GET /api/status`                    | `StatusMap`: configured containers only | every 10 s                              |
| `GET /api/system`                    | `SystemStats`                           | every 5 s                               |
| `GET /api/containers/:name/stats`    | `ContainerStats`                        | every 5 s, only while that card is open |
| `POST /api/containers/:name/restart` | 204                                     | on click                                |
| `GET /api/deploys`                   | `DeployMap`: configured repos only      | every 60 s                              |

Each concern has its own endpoint so one failing source greys only its own
part of the page: Docker down leaves the cards and header intact.

Errors from Docker or the host answer 502 through `app.onError`. The web shows
grey dots, "System readings unavailable" or "Usage unavailable", never stale
numbers: `StatusDot` checks `isError` before data, because React Query keeps
the last good answer after a failure.

## Configuration

`config/dashboard.yaml` and `config/icons/` are gitignored and never copied
into the image (`.dockerignore`). They name internal hosts and ports, and the
repo is public. Compose bind-mounts them read-only with
`create_host_path: false`, so a missing file fails the start instead of
becoming an empty directory.

`loadDashboard` reads the file once at boot and throws on any schema error, so
a bad edit stops the container rather than serving half a page. The schema
uses strict objects: a misspelt key fails instead of being dropped.
`config/dashboard.example.yaml` is committed, documents every field, and a
test parses it.

Icons resolve in `resolveIcon`: a bare file name loads from the dashboard-icons
CDN, `/…` is served by the app, `mdi-*` loads a pinned Material Design glyph
that the UI tints through a CSS mask.

## Docker access — the security boundary

The app never holds `docker.sock`. Anything that can reach it can start a
container with the host's filesystem mounted, which is root on the host; a
`:ro` mount does not change that.

- **`socket-proxy`** passes GET under `/containers` and nothing else. That
  still includes each container's environment, so its port is loopback only.
- **`restart-proxy`** has `POST=1` and `ALLOW_RESTARTS=1` with `CONTAINERS=0`,
  so the only writes that match are restart, stop and kill of one container.
  The read proxy cannot do this job: with `POST=1`, its `CONTAINERS=1` rule
  would pass `/containers/create` and `/containers/{id}/exec`.
- **The allowlist** in `createApp` runs before every `/containers/:name/*`
  route: a name not in `dashboard.yaml` gets 404 and Docker is never asked.
- **The restart header**: `POST /restart` requires
  `X-Requested-With: home-page`. A cross-site page cannot set it without a
  CORS preflight, which this server never grants.

There is no login. Anyone who can open the page can restart its containers;
that is accepted for a single-user LAN.

## Deploy status

`~/docker/auto-deploy/deploy.sh`, outside this repo, rebuilds own projects every
5 min. Each run it replaces `state/<repo>.json` with that cycle's outcome:
`up-to-date`, `deploying`, `skipped-dirty`, `skipped-ahead` or `failed`, the
commit running, and on failure the last 10 lines of build output. Compose
mounts that folder read-only at `/deploy-state`, so the app can show a deploy
but never affect one. Nothing parses logs.

A card opts in with `repo:` in `dashboard.yaml`; two cards may share one repo.
`readDeploys` reads only configured repos, and a missing or corrupt file reads
`null` without hiding the others. Its schema is not strict, so a field
`deploy.sh` adds later cannot blank an older dashboard.

The card face shows a line only when something needs a look; healthy projects
look as before. A status older than 15 min (`isStale`, three missed timer runs)
overrides the rest: a stopped timer would otherwise leave a healthy status
frozen forever. The full detail, with a commit link built by `commitUrl` from
an SSH or HTTPS GitHub origin, is in the card's usage strip.

## Host readings

The container reads host values directly: `/proc` and `/sys/class/hwmon` are
not namespaced, and each disk is bind-mounted at its host path.

- **CPU**: two `os.cpus()` samples 500 ms apart, busy share across all cores.
- **Memory**: `MemTotal − MemAvailable` from `/proc/meminfo`. `os.freemem()`
  would count page cache as used.
- **Temperature**: the hwmon sensor whose `name` is `coretemp`, found by name
  because the `hwmonN` index can change between boots. `null` without one.
- **Disks**: `statfs` per mount, in parallel; one unreadable mount reads `null`
  without hiding the rest. `/` needs no mount, since the container overlay
  sits on the host's root disk. A disk whose drive is unplugged is still a
  folder on `/` and silently reports `/`.

Container stats copy the `docker stats` arithmetic in `toContainerStats`: CPU
as a share of one core, memory without `inactive_file`, network summed across
interfaces. qbittorrent and prowlarr share gluetun's network, so their figures
are the whole VPN tunnel's.

## Front end

- Group open state is native `<details>`; the collapse animates with
  `::details-content` and `interpolate-size`, which Firefox and Safari skip.
- Which cards show usage is held in `App`, not per card, so the header's
  "Show all usage" can open every one. A card's status dot is a button; the
  card's link is stretched over it with `after:absolute`, since a button
  cannot sit inside a link.
- The theme is ORION: IBM Plex in three roles (Sans, Condensed for labels,
  Mono for data), self-hosted through `@fontsource`. Group indices are Greek
  (α β γ…, ordered by how often a group is opened) and set in Plex Sans,
  because Plex Mono has no Greek.
- Only degraded and down dots pulse. Disk gauges turn betelgeuse at
  `NEARLY_FULL`.

## Build and run

The server runs as `node src/index.ts` on Node's type stripping, so server code
follows its rules: relative imports end in `.ts`, type imports use
`import type`, and there are no `enum`s or `namespace`s. `@home-page/types` is
imported as types only and so never loads at runtime; the production image
does not copy its source.

Node does not type-check, so the [`Dockerfile`](../Dockerfile)'s build stage
runs `pnpm typecheck` and `pnpm test` before building the page. A type error
or failing test fails the build and leaves the running container serving.

`pnpm deploy` is `git pull --ff-only && pnpm prod`. On the host, a systemd
timer runs it when `development` moves on GitHub.

## Testing

Vitest, co-located `*.test.ts`. Tests sit at seams a user would notice:

- **`createApp`** through `app.request`, with a real `node:http` server
  standing in for Docker, so a test can assert Docker was never asked.
- **Pure transforms**: `toStatus`, `statusMap`, `toContainerStats`,
  `cpuPercent`, `parseMeminfo`, `resolveIcon`, `diskFill`, the formatters.
- **The filesystem**: `readCpuTemp` against a fake hwmon tree, `readDisks`
  against a temp folder and a missing path.

Components have no tests; the logic they would exercise lives in the modules
above.
