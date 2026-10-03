import type { Service } from '@home-page/types'
import StatusDot from './StatusDot.tsx'

export default function ServiceCard({ service }: { service: Service }) {
    const body = (
        <>
            {service.icon && (
                <img
                    src={service.icon.src}
                    alt=""
                    className={`size-10 shrink-0 object-contain ${service.icon.mono ? 'invert' : ''}`}
                />
            )}
            <div className="min-w-0">
                <p className="truncate font-medium">{service.name}</p>
                {service.description && (
                    <p className="truncate text-sm text-slate-400">
                        {service.description}
                    </p>
                )}
            </div>
            {service.container && (
                <span className="ml-auto self-start">
                    <StatusDot container={service.container} />
                </span>
            )}
        </>
    )

    const className =
        'flex items-center gap-3 rounded-lg bg-slate-900 p-3 ring-1 ring-slate-800'

    // A card without an href, like a CLI tool, is information only.
    if (!service.href) return <div className={className}>{body}</div>

    return (
        <a
            href={service.href}
            target="_blank"
            rel="noreferrer"
            className={`${className} hover:bg-slate-800`}
        >
            {body}
        </a>
    )
}
