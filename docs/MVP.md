# MVP

## Why

Homepage (`~/docker/homepage`, `ghcr.io/gethomepage/homepage` on :3000) has
become hard to work with. Its look is a 391-line `custom.css` of `!important`
overrides against its internal class names, so any `:latest` pull can break it.
It also cannot show custom card content, add interactivity, or integrate with
my own apps.

The MVP replaces it with this app, **matches what Homepage does today**, and adds
one thing it cannot:

- grouped service cards with links
- live container status dots
- a header with the greeting, date, CPU, memory, temperature, uptime and disks
- a restart button on each container's card

Porting the ORION styling comes after the MVP. Both dashboards run side by side
until this one does everything, then Homepage is removed.

## Decisions

### Config

`config/dashboard.yaml` holds the greeting, the disks and the service groups. It
names every internal host, port and container, so it is gitignored and never
built into the image. Compose bind-mounts the host's copy read-only, and the
server validates it with zod at boot.

Custom icons live beside it in `config/icons/`, gitignored and mounted the same
way. They belong to this dashboard, not to the app. Hono serves them at
`/icons/*` from that folder as its root, so `dashboard.yaml` next door is out of
reach; a test pins that.

`config/dashboard.example.yaml` is committed instead, with made-up hosts, to
document the format. A test parses it so it cannot fall behind the schema.

The cost: a broken edit is no longer caught by the build. The container fails
at boot instead, and an edit needs a container restart to take effect.

### Ports (block 7050–7059)

| Port | Use                         |
| :--- | :-------------------------- |
| 7050 | the app (web and API)       |
| 7051 | Hono in dev                 |
| 7052 | socket proxy, loopback only |
| 7053 | Vite in dev                 |

### One image

Hono serves the built SPA and `/api`. `/api` is mounted inside Hono
(`app.route('/api', api)`), so the Vite proxy does not rewrite paths and dev and
prod use the same ones.

### Docker status through a socket proxy

The app never mounts `docker.sock`. Mounting it `:ro` only stops the file being
replaced; anything that can reach the socket can still start, stop or create
containers, which is root on the host.

Instead, a `tecnativa/docker-socket-proxy` sidecar runs with `CONTAINERS=1`. POST
is denied by default, so the app can only read. `CONTAINERS=1` still allows GET
on `/containers/{id}/json`, which includes other containers' environment
variables, so the proxy is reachable only from the app and from host loopback.

### Restarts through a second, restart-only proxy

The read proxy cannot also restart. Its rules deny every POST unless `POST=1`,
and with `POST=1` the `CONTAINERS=1` rule passes any POST under `/containers`:
`/containers/create` and `/containers/{id}/exec` included, which is root on the
host.

So a second proxy runs with `POST=1`, `ALLOW_RESTARTS=1` and `CONTAINERS=0`. It
passes only `/containers/{name}/restart` (and the `stop` and `kill` that
`ALLOW_RESTARTS` brings with it), and publishes no port: only the app reaches
it.

The app has no login, so anyone who can open the dashboard can restart a
configured container. Accepted for a single-user LAN. Three guards narrow it:

- The server restarts only containers named in `dashboard.yaml`.
- The endpoint requires a custom header, so another website cannot fire the
  POST from a browser on the LAN; a cross-site request with a custom header
  needs a CORS preflight this server never grants.
- The button asks for confirmation.

### System stats from the Node standard library

These were checked on orion inside the running Homepage container, where
`/proc/meminfo`, `/proc/stat` and uptime all show host values.

- **Memory:** used = MemTotal − MemAvailable. Not `os.freemem()`, which counts
  page cache as used.
- **CPU:** percentage from two `os.cpus()` samples taken 500 ms apart.
- **Temperature:** the hwmon sensor whose `name` file reads `coretemp`, using
  `temp1_input`. Find it by name, because the `hwmonN` index can change between
  boots.
- **Disks:** `fs.promises.statfs`. `/` needs no mount, because the container
  overlay reports the host root disk.

### Three endpoints

Split so that Docker being down never blanks the page.

| Endpoint             | Returns                  | Fetched                          |
| :------------------- | :----------------------- | :------------------------------- |
| `GET /api/dashboard` | the config               | once (`staleTime: Infinity`)     |
| `GET /api/status`    | container name → status  | every 10 s; 502 if proxy is down |
| `GET /api/system`    | CPU, memory, temp, disks | every 5 s                        |

When `/api/status` fails, every dot shows grey.

### TypeScript without a build step

The server runs as `node src/index.ts` using Node 24's type stripping, with no
build step and no tsx. Node does not type-check, so the Dockerfile runs
`pnpm -r typecheck` and `pnpm -r test`.

### Left out of the MVP

TanStack Router, shadcn and ESLint. React Compiler is in, wired through
`@rolldown/plugin-babel` as in book-library. Prettier, husky and
commitlint stay, configured like book-library (4-space tabs, no semicolons,
single quotes).

## Sources to reuse

- **Workspace layout, tsconfigs, Prettier, husky and commitlint:**
  `~/src/github.com/soeweiyan-phyo/book-library` (`apps/web`, `apps/server`,
  `packages/types`).
- **Deploy scripts** (`prod`, `deploy`) and compose header style:
  `~/src/github.com/soeweiyan-phyo/movies-to-watch`.
- **Data to port:**
    - `~/docker/homepage/config/services.yaml` and `widgets.yaml` go into
      `config/dashboard.yaml`. Drop `server:` and flatten to
      `groups[].services[]`.
    - `~/docker/homepage/icons/*` go into `config/icons/`.

## Repo shape

```
package.json  pnpm-workspace.yaml  Dockerfile  docker-compose.yaml  CLAUDE.md
config/dashboard.example.yaml         # committed; the real dashboard.yaml is gitignored
packages/types/src/index.ts           # Dashboard, Group, Service, Icon, StatusMap, SystemStats
apps/server/src/index.ts              # load config, serve
apps/server/src/app.ts (+ .test)      # createApp: routes, /icons, onError → 502, SPA
apps/server/src/config.ts (+ .test)   # zod schema, loadConfig, resolveIcon, toDashboard
apps/server/src/docker.ts (+ .test)   # toStatus, statusMap — only module that knows Docker's JSON
apps/server/src/system.ts (+ .test)   # cpuPercent, parseMeminfo, pickCpuTemp, readDisks
apps/web/src/{main,App}.tsx  api.ts  format.ts (+ .test)
apps/web/src/components/{Header,Clock,Resources,ServiceGroup,ServiceCard,StatusDot}.tsx
```

## Slices

Each slice goes test red → green, then `pnpm -r typecheck`.

### 0. Scaffold

- Set up the workspace and tooling, and add `GET /api/health`. Root `pnpm dev`
  runs both apps.
- No tests. The types package and Vitest wait for slice 1: TypeScript fails on
  an empty package, and Vitest fails when there are no test files.
- Verify: `curl localhost:7053/api/health` returns `ok` through the Vite proxy.

### 1. Cards from config

Seam: `config.ts`.

- Add the `packages/types` package and Vitest.
- Tests:
    - `resolveIcon`, covering only the forms the config uses:
        - none → `null`
        - `name.png` → dashboard-icons CDN URL
        - `/icons/…` → passed through
        - `mdi-*` → pinned `@mdi/svg` URL with `mono: true`
    - The strict schema rejects an unknown key.
    - `config/dashboard.example.yaml` parses.
    - `/icons/*` serves a file from the icons folder, and no traversal path
      (`..%2F`, `%2e%2e`, `..%5C`) reaches `dashboard.yaml` beside it.
- Then `/api/dashboard`, with groups rendered as `<details open={!collapsed}>`.

### 2. Ship it

- Dockerfile: multi-stage on `node:24-slim`, `USER node`, `HEALTHCHECK` on
  `/api/health`.
- Hono serves the built SPA only when `NODE_ENV=production`; in dev, Vite does.
- Compose: app only, with `./config/dashboard.yaml` and `./config/icons`
  bind-mounted `:ro` and `create_host_path: false`, so a missing file fails the
  start instead of becoming an empty directory. `.dockerignore` excludes both
  config paths so they never land in an image layer.
- Then do the deploy registration below.
- Verify:
    - `orion.local:7050` loads.
    - The container reports healthy.
    - `docker run --rm --entrypoint ls home-page /app/config` finds nothing:
      the image has no config of its own.
    - The image run with a broken YAML mounted exits 1 with the zod error.

### 3. Status dots

Seam: `docker.ts`.

- Tests:
    - `toStatus`:
        - container absent → unknown
        - running with health none or healthy → up
        - running with health unhealthy or starting → degraded
        - restarting, exited, dead, created, paused or removing → down
        - an unrecognised state → unknown
    - `statusMap` strips the leading `/` and keeps only configured names.
- Then add the socket-proxy service, `fetch` with a 2 s timeout, and
  `/api/status`.
- Verify:
    - A POST to the proxy returns 403.
    - `docker stop navidrome` turns its dot red within 10 s.

### 4. Header

Seam: `system.ts` and web `format.ts`.

- Tests:
    - `cpuPercent`, including a zero delta returning 0
    - `parseMeminfo` (kB → bytes)
    - `pickCpuTemp`: coretemp, then k10temp, else `null`
    - `formatBytes`
    - `formatUptime`
- Then `/api/system`, the Resources component, and Clock using `Intl` with
  `en-AU`. Mount `/mnt/adata` and `/mnt/s-power` `:ro` in compose.
- Verify against `df -B1`, `free -b`, the hwmon `temp1_input` and `uptime`.

### 5. Restart button

Seam: the Hono app, `POST /api/containers/:name/restart`.

- Tests:
    - A container not named in the config is refused, and the restart proxy is
      never called.
    - A request without the custom header is refused, and the proxy is never
      called.
    - A configured container with the header reaches the proxy's restart path.
- Then add the `restart-proxy` service to compose, and a button before the
  status dot that confirms, posts, and refetches the status.
- Verify:
    - Restarting recyclarr from the page shows it restarting, then up.
    - `curl -X POST` without the header, or for an unconfigured name, is
      refused.
    - The restart proxy refuses `POST /containers/create`.

### 6. Minimal look

Dark slate, the Unsplash background at 35% brightness, and frosted cards. No
tests. The ORION `custom.css` port comes after the MVP.

### 7. Cutover

Stop Homepage, then update `PORT-REGISTRY.md`, `HOMELAB.md` and
`~/docker/README.md`.

## Deploy registration

Done as part of slice 2.

1. `~/Documents/Home-Lab/PORT-REGISTRY.md`: claim 7050–7059 (record 7050, and
   7052 as loopback-only). Also register book-library's 7042/7043, which it
   already uses.
2. Create the GitHub repo, push, and check out the deploy branch on orion.
3. Pin `packageManager` to pnpm 11.17.0, the host's version. Run `pnpm deploy`
   by hand once to confirm it runs the script and not pnpm's built-in `deploy`
   command.
4. Add the repo to `REPOS=(…)` in `~/docker/auto-deploy/deploy.sh` and to its
   README table.
5. Seed the state file:
   `git -C <repo> rev-parse HEAD > ~/docker/auto-deploy/state/home-page`.
6. Add a Home Page tile to Homepage's `services.yaml` while both run.

## Done when

- `pnpm -r test` and `pnpm -r typecheck` pass, both locally and inside
  `docker build`.
- `orion.local:3000` and `orion.local:7050` side by side show:
    - the same groups, cards, links and icons
    - Planned collapsed on load
    - matching status dots
    - CPU, memory, temperature, uptime and disk numbers that are close
- `docker stop navidrome` turns its dot red, and `docker start navidrome` turns
  it green again.
- With `docker stop home-page-socket-proxy`, the cards and header still render
  and every dot turns grey.
- A pushed commit is rebuilt by auto-deploy within 5 minutes, and
  `~/docker/auto-deploy/state/home-page` updates.

## Known risks

- If `/mnt/adata` is unmounted on the host, the bind mount shows the empty
  folder on the root disk, so the card silently reports root-disk numbers.
  Homepage has the same flaw.
- Icons load from the jsdelivr CDN, so they need internet, as Homepage's do
  today.

## After the MVP

- **ORION styling:** port `custom.css` into Tailwind `@theme` tokens in
  `index.css`.
- **Per-app widgets** (for example a Sonarr queue): an optional `widget` key on
  a service, `/api/widgets/:id`, and one server module per app. API keys go in a
  gitignored `.env` on orion, never in the YAML built into the image.
- **Search and keyboard shortcuts:** filter the already-loaded dashboard on the
  client.
