import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { containerStatsQuery, restartContainer, statusQuery } from '../api.ts'
import { formatBytes } from '../format.ts'
import DeployDetails from './DeployDetails.tsx'

// How long "Confirm restart" waits for the second click before backing off.
const CONFIRM_MS = 4_000

function Tile({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-col items-center gap-0.5 rounded-sm border border-rule bg-white/3 px-1 py-1.5">
            <span className="text-data text-star">{value}</span>
            <span className="text-[0.6rem] tracking-[0.14em] text-dim uppercase">
                {label}
            </span>
        </div>
    )
}

const percent = (value: number) =>
    `${value < 10 ? value.toFixed(1) : Math.round(value)}%`

// Unknown, not zero: a container without a network of its own sent nothing
// we can count.
const bytes = (value: number | null) =>
    value === null ? '—' : formatBytes(value)

export default function ContainerDetails({
    id,
    open,
    container,
    repo,
}: {
    id: string
    /** Stays mounted while closed, for the card's transition, but stops
     * polling Docker. */
    open: boolean
    container: string
    /** The card's auto-deployed repo, if any, for the deploy row. */
    repo: string | null
}) {
    const queryClient = useQueryClient()
    const { data, isError } = useQuery({
        ...containerStatsQuery(container),
        enabled: open,
    })
    const [confirming, setConfirming] = useState(false)

    const restart = useMutation({
        mutationFn: () => restartContainer(container),
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: statusQuery.queryKey }),
    })

    useEffect(() => {
        if (!confirming) return

        const timer = setTimeout(() => setConfirming(false), CONFIRM_MS)

        return () => clearTimeout(timer)
    }, [confirming])

    const onRestart = () => {
        if (!confirming) return setConfirming(true)

        setConfirming(false)
        restart.mutate()
    }

    return (
        <div id={id} className="relative mt-3 flex flex-col gap-2 font-mono">
            {isError ? (
                <p className="text-data text-dim">Usage unavailable</p>
            ) : (
                <div className="grid grid-cols-4 gap-1.5">
                    <Tile
                        label="CPU"
                        value={data ? percent(data.cpuPercent) : '…'}
                    />
                    <Tile
                        label="Mem"
                        value={data ? formatBytes(data.memory) : '…'}
                    />
                    <Tile
                        label="RX"
                        value={data ? bytes(data.received) : '…'}
                    />
                    <Tile label="TX" value={data ? bytes(data.sent) : '…'} />
                </div>
            )}
            {repo && <DeployDetails repo={repo} />}
            <div className="flex items-center justify-end gap-3 text-data">
                {restart.isError && (
                    <span role="alert" className="text-betelgeuse">
                        Restart failed
                    </span>
                )}
                <button
                    type="button"
                    onClick={onRestart}
                    disabled={restart.isPending}
                    className={`rounded-sm border px-2.5 py-1 tracking-[0.14em] uppercase transition-colors focus-visible:outline-2 focus-visible:outline-sirius disabled:opacity-60 motion-reduce:transition-none ${
                        confirming
                            ? 'border-betelgeuse text-betelgeuse'
                            : 'border-rule text-dim hover:border-rule-bright hover:text-star'
                    }`}
                >
                    {restart.isPending
                        ? 'Restarting…'
                        : confirming
                          ? 'Confirm restart'
                          : 'Restart'}
                </button>
            </div>
        </div>
    )
}
