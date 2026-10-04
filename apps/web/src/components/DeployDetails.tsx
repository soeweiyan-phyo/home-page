import { useQuery } from '@tanstack/react-query'
import { deploysQuery } from '../api.ts'
import { formatAge, isStale } from '../format.ts'
import { useNow } from '../useNow.ts'

/** The deploy row in a card's details: what is running, and on a failure,
 * the end of the build's output so the cause shows without a terminal. */
export default function DeployDetails({ repo }: { repo: string }) {
    const { data } = useQuery(deploysQuery)
    const now = useNow(60_000)
    const deploy = data?.[repo]

    if (!deploy) {
        return <p className="text-data text-dim">No deploy status yet</p>
    }

    const age = Math.max(
        0,
        (now.getTime() - Date.parse(deploy.checkedAt)) / 1000,
    )
    const sha = deploy.running?.slice(0, 7)

    return (
        <div className="flex flex-col gap-1.5 text-data">
            <p className="flex min-w-0 gap-2">
                <span className="tracking-[0.14em] text-dim uppercase">
                    Deploy
                </span>
                <span className="text-dim">{deploy.branch}</span>
                {sha && deploy.commitUrl ? (
                    <a
                        href={deploy.commitUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sirius hover:underline focus-visible:outline-2 focus-visible:outline-sirius"
                    >
                        {sha}
                    </a>
                ) : (
                    <span className="text-star">{sha ?? 'nothing built'}</span>
                )}
                <span className="truncate text-star">
                    {deploy.runningMessage}
                </span>
                <span className="ml-auto shrink-0 text-dim">
                    {formatAge(age)}
                </span>
            </p>
            {isStale(deploy.checkedAt, now) && (
                <p className="text-dim">
                    Not checked for {formatAge(age).replace(' ago', '')}: is
                    auto-deploy.timer running?
                </p>
            )}
            {deploy.status === 'failed' && (
                <>
                    <p className="text-betelgeuse">
                        Failed at {deploy.stage}
                        {deploy.stage === 'fetch' && ': GitHub unreachable?'}
                    </p>
                    {deploy.error && (
                        <pre className="max-h-32 overflow-auto rounded-sm border border-rule bg-black/30 p-2 text-[0.6rem] whitespace-pre-wrap text-dim select-text">
                            {deploy.error}
                        </pre>
                    )}
                </>
            )}
        </div>
    )
}
