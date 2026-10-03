import type { Dashboard } from '@home-page/types'
import { queryOptions } from '@tanstack/react-query'

const getJson = async <T>(path: string): Promise<T> => {
    const response = await fetch(path)

    if (!response.ok) throw new Error(`${path}: ${response.status}`)

    return response.json()
}

export const dashboardQuery = queryOptions({
    queryKey: ['dashboard'],
    queryFn: () => getJson<Dashboard>('/api/dashboard'),
    // The server reads its config once at boot, so it never goes stale.
    staleTime: Infinity,
})
