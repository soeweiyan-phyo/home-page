import Clock from './Clock.tsx'
import Resources from './Resources.tsx'
import SystemMark from './SystemMark.tsx'

/** Wordmark and clock share the top line; resources sit beneath at a smaller
 * scale, since they are reference data rather than the page's title. On a
 * narrow screen the clock drops under the wordmark, still above the readings. */
export default function Header({ greeting }: { greeting: string }) {
    return (
        <header className="mb-14 grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-3 max-md:grid-cols-1">
            <title>{greeting}</title>
            <h1 className="flex items-center gap-[0.6em] font-cond text-2xl font-semibold tracking-[0.34em] text-star uppercase text-shadow-lift">
                <SystemMark className="size-[1.05em] text-sirius motion-safe:animate-core" />
                {greeting}
            </h1>
            <Clock className="justify-self-end text-lg max-md:justify-self-start max-md:text-sm" />
            <Resources className="col-span-full mt-4 md:row-start-2" />
        </header>
    )
}
