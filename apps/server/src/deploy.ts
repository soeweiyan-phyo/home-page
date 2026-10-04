/**
 * auto-deploy's per-repo status files, written by deploy.sh into a folder
 * mounted here read-only. This module only reads them.
 */
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { DeployMap, DeployStatus } from '@home-page/types'
import { z } from 'zod'

// Not strict, unlike dashboard.yaml: a field deploy.sh adds later must not
// blank the status of a dashboard that has not caught up yet.
const StatusFile = z.object({
    status: z.enum([
        'up-to-date',
        'deploying',
        'skipped-dirty',
        'skipped-ahead',
        'failed',
    ]),
    stage: z.enum(['fetch', 'build']).nullable(),
    branch: z.string().nullable(),
    running: z.string().nullable(),
    runningMessage: z.string().nullable(),
    remote: z.string().nullable(),
    origin: z.string().nullable(),
    checkedAt: z.string(),
    error: z.string().nullable(),
})

// owner/repo out of git@github.com:owner/repo.git or https://github.com/owner/repo(.git)
const GITHUB =
    /^(?:git@github\.com:|https:\/\/github\.com\/)([^/]+\/[^/]+?)(?:\.git)?$/

/** null for anything not on GitHub, rather than a guessed link. */
export const commitUrl = (origin: string, sha: string): string | null => {
    const path = GITHUB.exec(origin)?.[1]

    return path ? `https://github.com/${path}/commit/${sha}` : null
}

const readOne = async (
    dir: string,
    repo: string,
): Promise<DeployStatus | null> => {
    try {
        const { origin, ...file } = StatusFile.parse(
            JSON.parse(await readFile(join(dir, `${repo}.json`), 'utf8')),
        )

        return {
            ...file,
            commitUrl:
                origin && file.running ? commitUrl(origin, file.running) : null,
        }
    } catch {
        // Not written yet, or unreadable: the card shows no status, not an error.
        return null
    }
}

/** Only the repos the dashboard names; a file for any other is never read. */
export const readDeploys = async (
    dir: string,
    repos: string[],
): Promise<DeployMap> =>
    Object.fromEntries(
        await Promise.all(
            repos.map(async (repo) => [repo, await readOne(dir, repo)]),
        ),
    )
