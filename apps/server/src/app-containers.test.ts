import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from './app.ts'

/** Stands in for both socket proxies and records every request it gets. */
const docker = createServer((request, response) => {
    calls.push(`${request.method} ${request.url}`)
    response.writeHead(204).end()
})
let calls: string[] = []
let app: ReturnType<typeof createApp>

beforeAll(async () => {
    await new Promise<void>((resolve) => docker.listen(0, '127.0.0.1', resolve))
    const { port } = docker.address() as AddressInfo
    const url = `http://127.0.0.1:${port}`

    app = createApp({
        dashboard: {
            greeting: '',
            disks: [],
            groups: [
                {
                    name: 'Media',
                    collapsed: false,
                    services: [
                        {
                            name: 'Jellyfin',
                            icon: null,
                            href: null,
                            description: null,
                            container: 'jellyfin',
                            repo: null,
                        },
                    ],
                },
            ],
        },
        iconsDir: '/nonexistent',
        dockerUrl: url,
        restartUrl: url,
        deployDir: '/nonexistent',
    })
})

afterAll(() => {
    docker.close()
})

beforeEach(() => {
    calls = []
})

const restart = (name: string, headers: Record<string, string> = {}) =>
    app.request(`/api/containers/${name}/restart`, { method: 'POST', headers })

const FROM_THE_PAGE = { 'X-Requested-With': 'home-page' }

describe('container stats', () => {
    // The page shows only its own containers; the rest stay out of reach.
    it('refuses a container the dashboard does not show, without asking Docker', async () => {
        const response = await app.request('/api/containers/portainer/stats')

        expect(response.status).toBe(404)
        expect(calls).toEqual([])
    })
})

describe('container restart', () => {
    it('refuses a container the dashboard does not show, without asking Docker', async () => {
        const response = await restart('portainer', FROM_THE_PAGE)

        expect(response.status).toBe(404)
        expect(calls).toEqual([])
    })

    // A plain cross-site form or fetch cannot set this header, so another
    // website open on the LAN cannot restart anything.
    it('refuses a request without the page header, without asking Docker', async () => {
        const response = await restart('jellyfin')

        expect(response.status).toBe(403)
        expect(calls).toEqual([])
    })

    it('restarts a configured container asked for by the page', async () => {
        const response = await restart('jellyfin', FROM_THE_PAGE)

        expect(response.status).toBe(204)
        expect(calls).toEqual(['POST /containers/jellyfin/restart'])
    })
})
