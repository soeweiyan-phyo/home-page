import type {
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
