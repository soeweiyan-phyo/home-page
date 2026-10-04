import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { commitUrl, readDeploys } from './deploy.ts'

const SHA = 'b5a0aa6f0e2d8c1a7b3e9f4d6c2a8e1b0f3d5c7a'

describe('commitUrl', () => {
    it.each([
        ['an SSH origin', 'git@github.com:soeweiyan-phyo/movies-to-watch.git'],
        [
            'an HTTPS origin',
            'https://github.com/soeweiyan-phyo/movies-to-watch.git',
        ],
        [
            'an HTTPS origin without .git',
            'https://github.com/soeweiyan-phyo/movies-to-watch',
        ],
    ])('links the commit on GitHub from %s', (_, origin) => {
        expect(commitUrl(origin, SHA)).toBe(
            `https://github.com/soeweiyan-phyo/movies-to-watch/commit/${SHA}`,
        )
    })

    // A link that guesses would send you to the wrong place or a 404.
    it('gives no link for an origin outside GitHub', () => {
        expect(commitUrl('/srv/git/scratch.git', SHA)).toBeNull()
    })
})

/** What deploy.sh writes for a failed build. */
const written = {
    status: 'failed',
    stage: 'build',
    branch: 'experimental',
    running: SHA,
    runningMessage: 'feat: watchlist sorting',
    remote: '4f2a1c9e',
    origin: 'git@github.com:soeweiyan-phyo/movies-to-watch.git',
    checkedAt: '2026-10-04T23:40:00+11:00',
    error: 'pnpm install exited 1',
}

describe('readDeploys', () => {
    // A half-written or hand-edited file must not blank every card's status.
    it('reads each configured repo, and a missing or corrupt file as null without hiding the rest', async () => {
        const dir = mkdtempSync(join(tmpdir(), 'deploy-state-'))
        writeFileSync(join(dir, 'movies.json'), JSON.stringify(written))
        writeFileSync(join(dir, 'corrupt.json'), '{"status": "fail')
        writeFileSync(join(dir, 'unlisted.json'), JSON.stringify(written))

        const deploys = await readDeploys(dir, ['movies', 'corrupt', 'absent'])

        expect(deploys).toEqual({
            movies: {
                status: 'failed',
                stage: 'build',
                branch: 'experimental',
                running: SHA,
                runningMessage: 'feat: watchlist sorting',
                remote: '4f2a1c9e',
                commitUrl: `https://github.com/soeweiyan-phyo/movies-to-watch/commit/${SHA}`,
                checkedAt: '2026-10-04T23:40:00+11:00',
                error: 'pnpm install exited 1',
            },
            corrupt: null,
            absent: null,
        })
    })
})
