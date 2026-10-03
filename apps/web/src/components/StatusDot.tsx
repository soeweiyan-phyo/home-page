import type { ContainerStatus, ServiceStatus } from '@home-page/types'
import { useQuery } from '@tanstack/react-query'
import { statusQuery } from '../api.ts'

const COLOUR: Record<ServiceStatus, string> = {
    up: 'bg-emerald-500',
    degraded: 'bg-amber-400',
    down: 'bg-red-500',
    unknown: 'bg-slate-500',
}

const UNREACHABLE: ContainerStatus = {
    status: 'unknown',
    detail: 'Docker unreachable',
}

const PENDING: ContainerStatus = { status: 'unknown', detail: null }

export default function StatusDot({ container }: { container: string }) {
    const { data, isError } = useQuery(statusQuery)

    // On error, grey rather than the last answer: React Query keeps stale
    // data, which would show a stopped container as still up.
    const state = isError ? UNREACHABLE : (data?.[container] ?? PENDING)

    return (
        <span
            title={state.detail ?? state.status}
            aria-label={state.status}
            className={`block size-2.5 rounded-full ${COLOUR[state.status]}`}
        />
    )
}
