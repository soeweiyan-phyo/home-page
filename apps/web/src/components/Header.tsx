import Clock from './Clock.tsx'
import Resources from './Resources.tsx'

export default function Header({ greeting }: { greeting: string }) {
    return (
        <header className="mb-8 flex flex-col gap-2">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
                <h1 className="text-2xl font-semibold">{greeting}</h1>
                <Clock />
            </div>
            <Resources />
        </header>
    )
}
