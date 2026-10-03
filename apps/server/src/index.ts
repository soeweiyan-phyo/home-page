import { join } from 'node:path'
import { serve } from '@hono/node-server'
import { createApp } from './app.ts'
import { DASHBOARD_PATH, ICONS_DIR, loadDashboard } from './config.ts'

// Dev sets 7051 so it can run beside the deployed container on 7050.
const PORT = Number(process.env.PORT ?? 7050)

const WEB_DIST = join(import.meta.dirname, '../../web/dist')

// Read once at boot, so an edit to the mounted file needs a restart.
const app = createApp(
    loadDashboard(DASHBOARD_PATH),
    ICONS_DIR,
    process.env.NODE_ENV === 'production' ? WEB_DIST : undefined,
)

serve({ fetch: app.fetch, port: PORT }, (info) => {
    console.log(`server listening on http://localhost:${info.port}`)
})
