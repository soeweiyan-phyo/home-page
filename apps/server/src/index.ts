import { serve } from '@hono/node-server'
import { Hono } from 'hono'

// Dev sets 7051 so it can run beside the deployed container on 7050.
const PORT = Number(process.env.PORT ?? 7050)

const api = new Hono()

api.get('/health', (c) => c.text('ok'))

const app = new Hono()

// Mounted here rather than stripped by the Vite proxy, so dev and prod
// share paths.
app.route('/api', api)

serve({ fetch: app.fetch, port: PORT }, (info) => {
    console.log(`server listening on http://localhost:${info.port}`)
})
