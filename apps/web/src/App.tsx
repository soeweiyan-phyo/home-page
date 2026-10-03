import { useQuery } from '@tanstack/react-query'
import { dashboardQuery } from './api.ts'
import Header from './components/Header.tsx'
import ServiceGroup from './components/ServiceGroup.tsx'

export default function App() {
    const { data, error } = useQuery(dashboardQuery)

    return (
        <main className="min-h-screen bg-slate-950 p-8 text-slate-100">
            {data && <Header greeting={data.greeting} />}
            {error && <p className="text-red-400">{error.message}</p>}
            <div className="flex flex-col gap-8">
                {data?.groups.map((group) => (
                    <ServiceGroup key={group.name} group={group} />
                ))}
            </div>
        </main>
    )
}
