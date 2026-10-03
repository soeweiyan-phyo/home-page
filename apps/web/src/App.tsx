import { useQuery } from '@tanstack/react-query'
import { dashboardQuery } from './api.ts'
import Header from './components/Header.tsx'
import ServiceGroup from './components/ServiceGroup.tsx'

export default function App() {
    const { data, error } = useQuery(dashboardQuery)

    return (
        <main className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-8 sm:py-10">
            {data && <Header greeting={data.greeting} />}
            {error && (
                <p role="alert" className="font-mono text-sm text-betelgeuse">
                    Dashboard unavailable: {error.message}
                </p>
            )}
            <div className="flex flex-col gap-9">
                {data?.groups.map((group, index) => (
                    <ServiceGroup
                        key={group.name}
                        group={group}
                        index={index}
                    />
                ))}
            </div>
        </main>
    )
}
