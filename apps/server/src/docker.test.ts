import { describe, expect, it } from 'vitest'
import { statusMap, toStatus } from './docker.ts'
import type { DockerContainer } from './docker.ts'

const container = (State: string, health?: string): DockerContainer => ({
    Names: ['/jellyfin'],
    State,
    Status: 'Docker text',
    Health: health ? { Status: health } : undefined,
})

describe('toStatus', () => {
    it.each([
        ['running with no healthcheck', 'up', container('running', 'none')],
        ['running and healthy', 'up', container('running', 'healthy')],
        // Older daemons leave Health out of the list entirely.
        ['running with Health absent', 'up', container('running')],
        [
            'running but unhealthy',
            'degraded',
            container('running', 'unhealthy'),
        ],
        [
            'running and still starting',
            'degraded',
            container('running', 'starting'),
        ],
        // A crash loop spends most of its time here, serving nothing.
        ['restarting', 'down', container('restarting')],
        ['exited', 'down', container('exited')],
        ['dead', 'down', container('dead')],
        ['created but never started', 'down', container('created')],
        ['paused', 'down', container('paused')],
        ['being removed', 'down', container('removing')],
        [
            'in a state Docker has not had before',
            'unknown',
            container('hibernating'),
        ],
    ])('a container %s is %s', (_, status, input) => {
        expect(toStatus(input)).toEqual({ status, detail: 'Docker text' })
    })

    it('a container missing from Docker is unknown with no detail', () => {
        expect(toStatus(undefined)).toEqual({ status: 'unknown', detail: null })
    })
})

describe('statusMap', () => {
    // Other containers stay out of the browser: the page shows only its own.
    it('answers for each configured container and nothing else', () => {
        const containers: DockerContainer[] = [
            { Names: ['/jellyfin'], State: 'running', Status: 'Up 2 months' },
            { Names: ['/portainer'], State: 'exited', Status: 'Exited (0)' },
        ]

        expect(statusMap(containers, ['jellyfin', 'navidrome'])).toEqual({
            jellyfin: { status: 'up', detail: 'Up 2 months' },
            navidrome: { status: 'unknown', detail: null },
        })
    })
})
