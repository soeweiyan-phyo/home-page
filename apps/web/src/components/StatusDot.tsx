import type { ContainerStatus, ServiceStatus } from '@home-page/types'
import { useQuery } from '@tanstack/react-query'
import { statusQuery } from '../api.ts'

// Only trouble pulses. With every dot moving, movement means nothing; with a
// steady field, the one ring catches the eye. --ring feeds the keyframes,
// which cannot read the background colour.
const LOOK: Record<ServiceStatus, string> = {
    up: 'bg-emerald-500',
    degraded:
        'bg-orange-400 [--ring:251_146_60] motion-safe:animate-pulse-ring',
    down: 'bg-rose-500 [--ring:244_63_94] motion-safe:animate-pulse-ring',
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
            role="img"
            title={state.detail ?? state.status}
            aria-label={state.status}
            className={`block size-3 rounded-full ${LOOK[state.status]}`}
        />
    )
}
