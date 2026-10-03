import type { Icon, Service } from '@home-page/types'
import StatusDot from './StatusDot.tsx'

function ServiceIcon({ icon }: { icon: Icon }) {
    // A single-colour glyph is painted through as a mask, so it takes the
    // theme's colour instead of arriving black.
    if (icon.mono) {
        return (
            <span
                aria-hidden="true"
                className="size-8 shrink-0 bg-dim mask-contain mask-center mask-no-repeat"
                style={{ maskImage: `url(${icon.src})` }}
            />
        )
    }

    return (
        <img
            src={icon.src}
            alt=""
            loading="lazy"
            className="size-8 shrink-0 object-contain"
        />
    )
}

const FRAME =
    'flex h-full items-center gap-3 rounded border border-rule bg-panel px-3 py-2.5 backdrop-blur-md backdrop-saturate-140'

export default function ServiceCard({ service }: { service: Service }) {
    const body = (
        <>
            {service.icon && <ServiceIcon icon={service.icon} />}
            <div className="min-w-0">
                <p className="truncate text-name font-medium tracking-[0.01em] text-star">
                    {service.name}
                </p>
                {service.description && (
                    <p className="truncate font-mono text-data tracking-[0.01em] text-dim">
                        {service.description}
                    </p>
                )}
            </div>
            {service.container && (
                <span className="ml-auto self-start pt-1">
                    <StatusDot container={service.container} />
                </span>
            )}
        </>
    )

    // A card without an href, like a CLI tool, is information only.
    if (!service.href) return <div className={FRAME}>{body}</div>

    return (
        <a
            href={service.href}
            target="_blank"
            rel="noreferrer"
            // Inset focus ring: an outward one on the last card in a row is
            // clipped by the container edge.
            className={`${FRAME} transition hover:border-rule-bright hover:bg-panel-hover hover:shadow-lift focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-sirius motion-safe:hover:-translate-y-px motion-reduce:transition-none`}
        >
            {body}
        </a>
    )
}
