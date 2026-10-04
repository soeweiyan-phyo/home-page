import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { deploysQuery } from '../api.ts'
import { formatAge, isStale } from '../format.ts'
import { useNow } from '../useNow.ts'

/** One line on the card face, only when the last deploy needs a look. A
 * healthy project's card stays as it was. */
export default function DeployNote({ repo }: { repo: string }) {
    const { data } = useQuery(deploysQuery)
    const now = useNow(60_000)
    const deploy = data?.[repo]

    if (!deploy) return null

    const age = Math.max(
        0,
        (now.getTime() - Date.parse(deploy.checkedAt)) / 1000,
    )

    // Before any status: a stopped timer leaves every other status frozen.
    if (isStale(deploy.checkedAt, now)) {
        return <Note>last deploy check {formatAge(age)}</Note>
    }

    switch (deploy.status) {
        case 'failed':
            return (
                <Note failed>
                    deploy failed · running{' '}
                    {deploy.running?.slice(0, 7) ?? 'nothing'}
                </Note>
            )
        case 'deploying':
            return <Note>deploying {deploy.remote?.slice(0, 7)}…</Note>
        case 'skipped-dirty':
            return <Note>deploy skipped · local changes</Note>
        case 'skipped-ahead':
            return <Note>deploy skipped · ahead of GitHub</Note>
        case 'up-to-date':
            return null
    }
}

function Note({
    failed = false,
    children,
}: {
    failed?: boolean
    children: ReactNode
}) {
    return (
        <p
            className={`flex items-center gap-1 font-mono text-data tracking-[0.01em] ${failed ? 'text-betelgeuse' : 'text-dim'}`}
        >
            {/* An SVG, not "▲": Plex Mono has no such glyph, and the fallback
                font's triangle sits off the text's centre. */}
            {failed && (
                <svg
                    viewBox="0 0 10 10"
                    aria-hidden="true"
                    className="size-2 shrink-0 fill-current"
                >
                    <path d="M5 1 9.5 9h-9z" />
                </svg>
            )}
            <span className="truncate">{children}</span>
        </p>
    )
}
