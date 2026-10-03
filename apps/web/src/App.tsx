import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { dashboardQuery } from './api.ts'
import Header from './components/Header.tsx'
import ServiceGroup from './components/ServiceGroup.tsx'

export default function App() {
    const { data, error } = useQuery(dashboardQuery)

    // Held here, not per card, so one header button can open every card.
    // Each open card polls its own stats; closing it stops the polling.
    const [openCards, setOpenCards] = useState<ReadonlySet<string>>(
        () => new Set(),
    )

    const containers =
        data?.groups.flatMap((group) =>
            group.services.flatMap((service) =>
                service.container ? [service.container] : [],
            ),
        ) ?? []
    const allOpen =
        containers.length > 0 && containers.every((name) => openCards.has(name))

    const toggleCard = (container: string) =>
        setOpenCards((previous) => {
            const next = new Set(previous)

            if (!next.delete(container)) next.add(container)

            return next
        })

    // Opens every card unless all are already open, so one click after a
    // few singles still opens the rest.
    const toggleAll = () =>
        setOpenCards(allOpen ? new Set() : new Set(containers))

    return (
        <main className="mx-auto max-w-screen-2xl px-6 py-10 sm:px-12 sm:py-16 lg:px-24">
            {data && (
                <Header
                    greeting={data.greeting}
                    usageShown={allOpen}
                    onToggleUsage={toggleAll}
                />
            )}
            {error && (
                <p role="alert" className="font-mono text-sm text-betelgeuse">
                    Dashboard unavailable: {error.message}
                </p>
            )}
            <div className="flex flex-col gap-10">
                {data?.groups.map((group, index) => (
                    <ServiceGroup
                        key={group.name}
                        group={group}
                        index={index}
                        openCards={openCards}
                        onToggleCard={toggleCard}
                    />
                ))}
            </div>
        </main>
    )
}
