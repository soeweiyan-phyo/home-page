import type { DiskUsage } from '@home-page/types'

// s-power sat at 83% when this was set: close enough to watch, not yet alarming.
const NEARLY_FULL = 0.85

/** Fill as df's Use% measures it: root-reserved blocks are neither side. */
export const diskFill = ({
    used,
    free,
}: DiskUsage): { share: number; nearlyFull: boolean } => {
    const usable = used + free
    const share = usable === 0 ? 0 : used / usable

    return { share, nearlyFull: share >= NEARLY_FULL }
}

const UNITS = ['B', 'KB', 'MB', 'GB', 'TB']

/**
 * Powers of 1024 under the familiar labels, as df -h and Windows show them, so
 * a 1 TB drive reads 931 GB here as it does everywhere else on this host.
 */
export const formatBytes = (bytes: number): string => {
    const exponent = Math.min(
        Math.floor(Math.log(Math.max(bytes, 1)) / Math.log(1024)),
        UNITS.length - 1,
    )
    const value = bytes / 1024 ** exponent

    if (exponent === 0) return `${bytes} B`

    return `${value.toFixed(value < 10 ? 1 : 0)} ${UNITS[exponent]}`
}

/** The two largest units only: 63d 8h, never 63d 8h 5m. */
export const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86_400)
    const hours = Math.floor((seconds % 86_400) / 3_600)
    const minutes = Math.floor((seconds % 3_600) / 60)

    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`

    return `${minutes}m`
}
