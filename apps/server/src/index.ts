import { join } from 'node:path'
import { serve } from '@hono/node-server'
import { createApp } from './app.ts'
import { DASHBOARD_PATH, ICONS_DIR, loadDashboard } from './config.ts'

// 3000, the port Homepage held, so its bookmarks still land here. Dev sets
// 7051 so it can run beside the deployed container.
const PORT = Number(process.env.PORT ?? 3000)

// Compose sets each proxy's service name. The defaults are their loopback
// ports, published for dev only.
const DOCKER_URL = process.env.DOCKER_URL ?? 'http://127.0.0.1:7052'
const RESTART_URL = process.env.RESTART_URL ?? 'http://127.0.0.1:7054'

// Compose mounts auto-deploy's state folder here; the dev script points at it
// on the host directly.
const DEPLOY_STATE_DIR = process.env.DEPLOY_STATE_DIR ?? '/deploy-state'

const WEB_DIST = join(import.meta.dirname, '../../web/dist')

const app = createApp({
    // Read once at boot, so an edit to the mounted file needs a restart.
    dashboard: loadDashboard(DASHBOARD_PATH),
    iconsDir: ICONS_DIR,
    dockerUrl: DOCKER_URL,
    restartUrl: RESTART_URL,
    deployDir: DEPLOY_STATE_DIR,
    webDir: process.env.NODE_ENV === 'production' ? WEB_DIST : undefined,
})

serve({ fetch: app.fetch, port: PORT }, (info) => {
    console.log(`server listening on http://localhost:${info.port}`)
})
