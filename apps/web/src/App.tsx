import { useQuery } from '@tanstack/react-query'
import { dashboardQuery } from './api.ts'
import ServiceGroup from './components/ServiceGroup.tsx'

export default function App() {
    const { data, error } = useQuery(dashboardQuery)

    return (
        <main className="min-h-screen bg-slate-950 p-8 text-slate-100">
            <h1 className="mb-8 text-2xl font-semibold">Orion</h1>
            {error && <p className="text-red-400">{error.message}</p>}
            <div className="flex flex-col gap-8">
                {data?.groups.map((group) => (
                    <ServiceGroup key={group.name} group={group} />
                ))}
            </div>
        </main>
    )
}
