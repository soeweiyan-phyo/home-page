import type {
    ContainerStats,
    ContainerStatus,
    ServiceStatus,
    StatusMap,
} from '@home-page/types'

/** The fields used from one entry of Docker's GET /containers/json. */
export interface DockerContainer {
    Names: string[]
    State: string
    Status: string
    Health?: { Status: string }
}

// restarting is down, not degraded: a crash loop spends most of its time
// there, serving nothing.
const BY_STATE: Record<string, ServiceStatus> = {
    restarting: 'down',
    exited: 'down',
    dead: 'down',
    created: 'down',
    paused: 'down',
    removing: 'down',
}

// Read from Health, never parsed out of the human-readable Status text.
const whileRunning = (health: string | undefined): ServiceStatus =>
    health === 'unhealthy' || health === 'starting' ? 'degraded' : 'up'

export const toStatus = (
    container: DockerContainer | undefined,
): ContainerStatus => {
    if (!container) return { status: 'unknown', detail: null }

    const status =
        container.State === 'running'
            ? whileRunning(container.Health?.Status)
            : (BY_STATE[container.State] ?? 'unknown')

    return { status, detail: container.Status }
}

/**
 * Reads every container through the socket proxy. Throws when the proxy is
 * unreachable or slow, which the route answers with a 502.
 */
export const fetchContainers = async (
    dockerUrl: string,
): Promise<DockerContainer[]> => {
    // all=true, or a stopped container would read as missing, not down.
    const response = await fetch(`${dockerUrl}/containers/json?all=true`, {
        signal: AbortSignal.timeout(2000),
    })

    if (!response.ok) throw new Error(`Docker answered ${response.status}`)

    return response.json() as Promise<DockerContainer[]>
}

/** Only the named containers, so the browser learns nothing about the rest. */
export const statusMap = (
    containers: DockerContainer[],
    names: string[],
): StatusMap => {
    // Docker prefixes every name with a slash.
    const byName = new Map(
        containers.flatMap((container) =>
            container.Names.map((name) => [name.replace(/^\//, ''), container]),
        ),
    )

    return Object.fromEntries(
        names.map((name) => [name, toStatus(byName.get(name))]),
    )
}

interface CpuSample {
    cpu_usage: { total_usage: number }
    system_cpu_usage: number
}

/** The fields used from Docker's GET /containers/{name}/stats. */
export interface DockerStats {
    cpu_stats: CpuSample & { online_cpus: number }
    precpu_stats: CpuSample
    memory_stats: { usage: number; stats?: { inactive_file?: number } }
    networks?: Record<string, { rx_bytes: number; tx_bytes: number }>
}

/** One sample, which Docker takes a second or two to answer: it measures CPU
 * across two readings. */
export const fetchStats = async (
    dockerUrl: string,
    name: string,
): Promise<ContainerStats> => {
    const response = await fetch(
        `${dockerUrl}/containers/${encodeURIComponent(name)}/stats?stream=false`,
        { signal: AbortSignal.timeout(5000) },
    )

    if (!response.ok) throw new Error(`Docker answered ${response.status}`)

    return toContainerStats((await response.json()) as DockerStats)
}

/** Through the restart-only proxy. Docker waits up to 10 s for the container
 * to stop before killing it, hence the long timeout. */
export const restartContainer = async (
    restartUrl: string,
    name: string,
): Promise<void> => {
    const response = await fetch(
        `${restartUrl}/containers/${encodeURIComponent(name)}/restart`,
        { method: 'POST', signal: AbortSignal.timeout(30_000) },
    )

    if (!response.ok) throw new Error(`Docker answered ${response.status}`)
}

/** The same arithmetic as the docker stats command. */
export const toContainerStats = ({
    cpu_stats,
    precpu_stats,
    memory_stats,
    networks,
}: DockerStats): ContainerStats => {
    const used =
        cpu_stats.cpu_usage.total_usage - precpu_stats.cpu_usage.total_usage
    const elapsed = cpu_stats.system_cpu_usage - precpu_stats.system_cpu_usage
    const interfaces = networks ? Object.values(networks) : null
    const sum = (key: 'rx_bytes' | 'tx_bytes') =>
        interfaces?.reduce((total, nic) => total + nic[key], 0) ?? null

    return {
        // elapsed counts every core's time, so scale back up to one core.
        cpuPercent:
            elapsed > 0 ? (used / elapsed) * cpu_stats.online_cpus * 100 : 0,
        // cgroup v2 names it inactive_file: cache the kernel can reclaim.
        memory: memory_stats.usage - (memory_stats.stats?.inactive_file ?? 0),
        received: sum('rx_bytes'),
        sent: sum('tx_bytes'),
    }
}
