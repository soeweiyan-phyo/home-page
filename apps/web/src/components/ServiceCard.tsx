import type { Icon, Service } from '@home-page/types'
import { useId } from 'react'
import ContainerDetails from './ContainerDetails.tsx'
import DeployNote from './DeployNote.tsx'
import StatusDot from './StatusDot.tsx'

function ServiceIcon({ icon }: { icon: Icon }) {
    // A single-colour glyph is painted through as a mask, so it takes the
    // theme's colour instead of arriving black.
    if (icon.mono) {
        return (
            <span
                aria-hidden="true"
                className="size-9 shrink-0 bg-dim mask-contain mask-center mask-no-repeat"
                style={{ maskImage: `url(${icon.src})` }}
            />
        )
    }

    return (
        <img
            src={icon.src}
            alt=""
            loading="lazy"
            className="size-9 shrink-0 object-contain"
        />
    )
}

const FRAME =
    'relative rounded select-none border border-rule bg-panel px-3 py-2.5 backdrop-blur-md backdrop-saturate-140'

// Inset focus ring: an outward one on the last card in a row is clipped by
// the container edge.
const LINKED =
    'transition hover:border-rule-bright hover:bg-panel-hover hover:shadow-lift has-[a:focus-visible]:outline-2 has-[a:focus-visible]:-outline-offset-2 has-[a:focus-visible]:outline-sirius motion-safe:hover:-translate-y-px motion-reduce:transition-none'

export default function ServiceCard({
    service,
    open,
    onToggle,
}: {
    service: Service
    /** Whether the usage and restart strip is showing. */
    open: boolean
    onToggle: () => void
}) {
    const detailsId = useId()

    return (
        <div className={service.href ? `${FRAME} ${LINKED}` : FRAME}>
            <div className="flex items-center gap-4">
                {service.icon && <ServiceIcon icon={service.icon} />}
                <div className="min-w-0">
                    <p className="truncate text-name font-medium tracking-[0.01em] text-star">
                        {/* A button cannot sit inside a link, so the link
                            stretches over the card instead of wrapping it,
                            and the dot and details sit above it. A card
                            without an href, like a CLI tool, is information
                            only. */}
                        {service.href ? (
                            <a
                                href={service.href}
                                target="_blank"
                                rel="noreferrer"
                                className="outline-none after:absolute after:inset-0"
                            >
                                {service.name}
                            </a>
                        ) : (
                            service.name
                        )}
                    </p>
                    {service.description && (
                        <p className="truncate font-mono text-data tracking-[0.01em] text-dim">
                            {service.description}
                        </p>
                    )}
                    {service.repo && <DeployNote repo={service.repo} />}
                </div>
                {service.container && (
                    <button
                        type="button"
                        onClick={onToggle}
                        aria-expanded={open}
                        aria-controls={detailsId}
                        className="relative z-10 -mr-1.5 ml-auto cursor-pointer self-start rounded-full p-1.5 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-sirius"
                    >
                        <StatusDot container={service.container} />
                        <span className="sr-only">
                            {open ? 'Hide' : 'Show'} usage and restart for{' '}
                            {service.name}
                        </span>
                    </button>
                )}
            </div>
            {open && service.container && (
                <ContainerDetails
                    id={detailsId}
                    container={service.container}
                    repo={service.repo}
                />
            )}
        </div>
    )
}
