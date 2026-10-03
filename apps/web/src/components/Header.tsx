import Clock from './Clock.tsx'
import Resources from './Resources.tsx'
import SystemMark from './SystemMark.tsx'

/** Wordmark and clock share the top line; resources sit beneath at a smaller
 * scale, since they are reference data rather than the page's title. On a
 * narrow screen the clock drops under the wordmark, still above the readings. */
export default function Header({
    greeting,
    usageShown,
    onToggleUsage,
}: {
    greeting: string
    /** Whether every container card has its usage open. */
    usageShown: boolean
    onToggleUsage: () => void
}) {
    return (
        <header className="mb-14 grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-3 max-md:grid-cols-1">
            <title>{greeting}</title>
            <h1 className="flex items-center gap-[0.6em] font-cond text-2xl font-semibold tracking-[0.34em] text-star uppercase text-shadow-lift">
                <SystemMark className="size-[1.05em] text-sirius motion-safe:animate-core" />
                {greeting}
            </h1>
            <div className="flex items-center gap-5 justify-self-end max-md:justify-self-start">
                <button
                    type="button"
                    onClick={onToggleUsage}
                    aria-pressed={usageShown}
                    className={`cursor-pointer rounded-sm border bg-panel px-2.5 py-1 font-mono text-data tracking-[0.14em] uppercase backdrop-blur-md transition-colors focus-visible:outline-2 focus-visible:outline-sirius motion-reduce:transition-none ${
                        usageShown
                            ? 'border-sirius/60 text-sirius'
                            : 'border-rule text-dim hover:border-rule-bright hover:text-star'
                    }`}
                >
                    {usageShown ? 'Hide all usage' : 'Show all usage'}
                </button>
                <Clock className="text-lg max-md:text-sm" />
            </div>
            <Resources className="col-span-full mt-4 md:row-start-2" />
        </header>
    )
}
