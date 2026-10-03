import type { Dashboard, StatusMap } from '@home-page/types'
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
