import type {
    ContainerStats,
    Dashboard,
    StatusMap,
    SystemStats,
} from '@home-page/types'
import { queryOptions } from '@tanstack/react-query'

const getJson = async <T>(path: string): Promise<T> => {
    const response = await fetch(path)

    if (!response.ok) throw new Error(`${path}: ${response.status}`)

    // Trusted: the server builds these from the types in @home-page/types.
    return response.json() as Promise<T>
}

export const dashboardQuery = queryOptions({
    queryKey: ['dashboard'],
    queryFn: () => getJson<Dashboard>('/api/dashboard'),
    // The server reads its config once at boot, so it never goes stale.
    staleTime: Infinity,
})

export const statusQuery = queryOptions({
    queryKey: ['status'],
    queryFn: () => getJson<StatusMap>('/api/status'),
    refetchInterval: 10_000,
})

export const systemQuery = queryOptions({
    queryKey: ['system'],
    queryFn: () => getJson<SystemStats>('/api/system'),
    refetchInterval: 5_000,
})

/** Polled only while a card's details are open: Docker takes a second or two
 * per container to answer. */
export const containerStatsQuery = (container: string) =>
    queryOptions({
        queryKey: ['stats', container],
        queryFn: () =>
            getJson<ContainerStats>(
                `/api/containers/${encodeURIComponent(container)}/stats`,
            ),
        refetchInterval: 5_000,
    })

export const restartContainer = async (container: string): Promise<void> => {
    const response = await fetch(
        `/api/containers/${encodeURIComponent(container)}/restart`,
        {
            method: 'POST',
            // The server refuses a restart without it; another site cannot set
            // it without a CORS preflight this server never grants.
            headers: { 'X-Requested-With': 'home-page' },
        },
    )

    if (!response.ok) throw new Error(`Restart answered ${response.status}`)
}
