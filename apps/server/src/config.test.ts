import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { loadDashboard, parseDashboard, resolveIcon } from './config.ts'

// The example is the only documentation of the format, so a schema change
// that leaves it behind should fail.
it('the committed dashboard.example.yaml parses', () => {
    const example = join(
        import.meta.dirname,
        '../../../config/dashboard.example.yaml',
    )

    expect(() => loadDashboard(example)).not.toThrow()
})

// A misspelt key would otherwise vanish silently, taking the dot with it.
it('a service key the schema does not know is rejected', () => {
    const source = `
groups:
    - name: Media
      services:
          - name: Jellyfin
            contianer: jellyfin
`

    expect(() => parseDashboard(source)).toThrow(/contianer/)
})

describe('resolveIcon', () => {
    it.each([
        ['an absent icon is null', undefined, null],
        [
            'a bare name loads from dashboard-icons',
            'jellyfin.png',
            {
                src: 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/jellyfin.png',
                mono: false,
            },
        ],
        [
            'a root path is served by the web app',
            '/icons/film.png',
            { src: '/icons/film.png', mono: false },
        ],
        [
            'an mdi name loads the pinned Material Design glyph as mono',
            'mdi-robot',
            {
                src: 'https://cdn.jsdelivr.net/npm/@mdi/svg@7.4.47/svg/robot.svg',
                mono: true,
            },
        ],
    ])('%s', (_, name, expected) => {
        expect(resolveIcon(name)).toEqual(expected)
    })
})
