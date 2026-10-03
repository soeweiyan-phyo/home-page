import type { Group } from '@home-page/types'
import ServiceCard from './ServiceCard.tsx'

// Bayer-style catalogue index: groups are ordered by how often they are
// opened, the way Bayer letters order stars by brightness.
const BAYER = 'αβγδεζηθικλμνξοπρστυφχψω'

export default function ServiceGroup({
    group,
    index,
}: {
    group: Group
    index: number
}) {
    return (
        <details open={!group.collapsed} className="group">
            {/* The plate label: index, tracked name, hairline to the edge. */}
            <summary className="mb-3 flex cursor-pointer list-none items-baseline gap-[0.7rem] rounded-sm font-cond text-plate font-semibold tracking-[0.22em] text-star uppercase text-shadow-lift focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sirius max-sm:tracking-[0.16em] [&::-webkit-details-marker]:hidden">
                {/* Plex Sans, not Mono: Mono has no Greek. */}
                <span className="font-sans text-[0.95rem] leading-none font-medium tracking-normal text-sirius/90 normal-case">
                    {BAYER[index] ?? index + 1}
                </span>
                {group.name}
                <span
                    aria-hidden="true"
                    className="h-px flex-1 self-center bg-linear-to-r from-rule-bright to-transparent"
                />
                <svg
                    viewBox="0 0 10 10"
                    aria-hidden="true"
                    className="size-2.5 self-center stroke-dim transition-transform group-open:rotate-90 motion-reduce:transition-none"
                    fill="none"
                    strokeWidth="1.2"
                >
                    <path d="M3.5 2 6.5 5 3.5 8" />
                </svg>
            </summary>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.services.map((service) => (
                    <li key={service.name}>
                        <ServiceCard service={service} />
                    </li>
                ))}
            </ul>
        </details>
    )
}
