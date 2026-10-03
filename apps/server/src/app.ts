import { serveStatic } from '@hono/node-server/serve-static'
import type { Dashboard } from '@home-page/types'
import { Hono } from 'hono'
import { fetchContainers, statusMap } from './docker.ts'
import { readSystem } from './system.ts'

interface AppOptions {
    dashboard: Dashboard
    iconsDir: string
    /** The Docker socket proxy, read-only. */
    dockerUrl: string
    /** The built SPA. Omitted in dev, where Vite serves it. */
    webDir?: string
}

export const createApp = ({
    dashboard,
    iconsDir,
    dockerUrl,
    webDir,
}: AppOptions) => {
    const containerNames = dashboard.groups.flatMap((group) =>
        group.services.flatMap((service) =>
            service.container ? [service.container] : [],
        ),
    )

    const api = new Hono()

    api.get('/health', (c) => c.text('ok'))

    api.get('/dashboard', (c) => c.json(dashboard))

    // Its own endpoint, so Docker being down greys the dots and nothing else.
    api.get('/status', async (c) =>
        c.json(statusMap(await fetchContainers(dockerUrl), containerNames)),
    )

    api.get('/system', async (c) => c.json(await readSystem(dashboard.disks)))

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

    // What fails here is what the server reads from, the socket proxy or the
    // host, so the answer is 502 rather than 500.
    app.onError((error, c) => {
        console.error(error)
        return c.json({ error: 'Upstream failure' }, 502)
    })

    return app
}
