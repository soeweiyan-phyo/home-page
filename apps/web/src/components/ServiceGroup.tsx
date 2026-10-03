import type { Group } from '@home-page/types'
import ServiceCard from './ServiceCard.tsx'

export default function ServiceGroup({ group }: { group: Group }) {
    return (
        <details open={!group.collapsed}>
            <summary className="mb-3 cursor-pointer text-sm font-semibold tracking-wide text-slate-300 uppercase">
                {group.name}
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
