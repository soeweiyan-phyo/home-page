import type { Disk } from '@home-page/types'
import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { systemQuery } from '../api.ts'
import { diskFill, formatBytes, formatUptime } from '../format.ts'

/** A label over a value, read like the data on an atlas plate. */
function Reading({
    label,
    className,
    children,
}: {
    label: string
    className?: string
    children: ReactNode
}) {
    return (
        <li className={`flex min-w-16 flex-col gap-0.5 ${className ?? ''}`}>
            <span className="text-data tracking-[0.14em] text-dim uppercase">
                {label}
            </span>
            <span className="text-sm text-star">{children}</span>
        </li>
    )
}

const diskLabel = (mount: string) =>
    mount === '/' ? 'root' : (mount.split('/').pop() ?? mount)

function DiskReading({ disk }: { disk: Disk }) {
    if (!disk.usage) {
        return <Reading label={diskLabel(disk.mount)}>unreadable</Reading>
    }

    const { share, nearlyFull } = diskFill(disk.usage)

    // Fixed width, so the gauge measures the disk rather than underlining
    // however long the text happens to be.
    return (
        <Reading label={diskLabel(disk.mount)} className="w-28">
            <span
                title={`${formatBytes(disk.usage.used)} of ${formatBytes(disk.usage.total)} used`}
                className={nearlyFull ? 'text-betelgeuse' : undefined}
            >
                {formatBytes(disk.usage.free)} free
            </span>
            <span
                aria-hidden="true"
                className="mt-1.5 block h-0.5 overflow-hidden rounded-full bg-white/15"
            >
                <span
                    className={`block h-full ${nearlyFull ? 'bg-betelgeuse' : 'bg-sirius/80'}`}
                    style={{ width: `${share * 100}%` }}
                />
            </span>
        </Reading>
    )
}

export default function Resources({ className }: { className?: string }) {
    const { data, isError } = useQuery(systemQuery)

    if (isError) {
        return (
            <p className={`font-mono text-data text-dim ${className ?? ''}`}>
                System readings unavailable
            </p>
        )
    }

    if (!data) return null

    return (
        <ul
            className={`flex flex-wrap gap-x-7 gap-y-3 font-mono text-shadow-lift max-sm:grid max-sm:grid-cols-2 ${className ?? ''}`}
        >
            <Reading label="CPU">{Math.round(data.cpuPercent)}%</Reading>
            <Reading label="RAM">
                {formatBytes(data.memory.used)} /{' '}
                {formatBytes(data.memory.total)}
            </Reading>
            {data.cpuTempC !== null && (
                <Reading label="Temp">{Math.round(data.cpuTempC)} °C</Reading>
            )}
            <Reading label="Up">{formatUptime(data.uptimeSeconds)}</Reading>
            {data.disks.map((disk) => (
                <DiskReading key={disk.mount} disk={disk} />
            ))}
        </ul>
    )
}
