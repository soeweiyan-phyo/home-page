import { serveStatic } from '@hono/node-server/serve-static'
import type { Dashboard } from '@home-page/types'
import { Hono } from 'hono'

/** webDir: the built SPA. Omitted in dev, where Vite serves it. */
export const createApp = (
    dashboard: Dashboard,
    iconsDir: string,
    webDir?: string,
) => {
    const api = new Hono()

    api.get('/health', (c) => c.text('ok'))

    api.get('/dashboard', (c) => c.json(dashboard))

    const app = new Hono()

    // Mounted here rather than stripped by the Vite proxy, so dev and prod
    // share paths.
    app.route('/api', api)

    // Rooted at the icons folder, not config/, so dashboard.yaml beside it is
    // out of reach even if the traversal check in serveStatic ever lapses.
    app.use(
        '/icons/*',
        serveStatic({
            root: iconsDir,
            rewriteRequestPath: (path) => path.slice('/icons'.length),
        }),
    )

    // Last, so /api and /icons win. One page and no client routes, so no
    // fallback to index.html is needed.
    if (webDir) app.use('*', serveStatic({ root: webDir }))

    return app
}
