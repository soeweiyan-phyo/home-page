import { useQuery } from '@tanstack/react-query'
import { systemQuery } from '../api.ts'
import { formatBytes, formatUptime } from '../format.ts'

export default function Resources() {
    const { data, isError } = useQuery(systemQuery)

    if (isError) {
        return (
            <p className="text-sm text-slate-500">System stats unavailable</p>
        )
    }

    if (!data) return null

    return (
        <ul className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-400">
            <li>CPU {Math.round(data.cpuPercent)}%</li>
            <li>
                RAM {formatBytes(data.memory.used)} /{' '}
                {formatBytes(data.memory.total)}
            </li>
            {data.cpuTempC !== null && <li>{Math.round(data.cpuTempC)} °C</li>}
            <li>Up {formatUptime(data.uptimeSeconds)}</li>
            {data.disks.map((disk) => (
                <li key={disk.mount}>
                    {disk.mount}{' '}
                    {disk.usage
                        ? `${formatBytes(disk.usage.free)} free of ${formatBytes(disk.usage.total)}`
                        : 'unreadable'}
                </li>
            ))}
        </ul>
    )
}
