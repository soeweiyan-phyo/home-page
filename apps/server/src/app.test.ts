import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import { createApp } from './app.ts'

describe('/icons', () => {
    let app: ReturnType<typeof createApp>

    // Mirrors config/: the icons folder sits beside the private dashboard.yaml.
    beforeAll(() => {
        const config = mkdtempSync(join(tmpdir(), 'home-page-'))
        mkdirSync(join(config, 'icons'))
        writeFileSync(join(config, 'icons', 'film.png'), 'film-bytes')
        writeFileSync(join(config, 'dashboard.yaml'), 'secret-hosts')

        app = createApp({
            dashboard: { greeting: '', disks: [], groups: [] },
            iconsDir: join(config, 'icons'),
            dockerUrl: 'http://127.0.0.1:1',
            restartUrl: 'http://127.0.0.1:1',
        })
    })

    it('serves a file from the icons folder', async () => {
        const response = await app.request('/icons/film.png')

        expect(response.status).toBe(200)
        expect(await response.text()).toBe('film-bytes')
    })

    it.each([
        '/icons/../dashboard.yaml',
        '/icons/..%2Fdashboard.yaml',
        '/icons/%2e%2e/dashboard.yaml',
        '/icons/..%5Cdashboard.yaml',
    ])('never serves the dashboard config through %s', async (path) => {
        const response = await app.request(path)

        expect(response.status).toBe(404)
        expect(await response.text()).not.toContain('secret-hosts')
    })
})
