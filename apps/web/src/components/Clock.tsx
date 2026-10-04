import { useNow } from '../useNow.ts'

const FORMAT = new Intl.DateTimeFormat('en-AU', {
    dateStyle: 'long',
    timeStyle: 'short',
})

export default function Clock({ className }: { className?: string }) {
    const now = useNow(1_000)

    return (
        <time
            dateTime={now.toISOString()}
            className={`font-mono tracking-[0.04em] whitespace-nowrap text-star text-shadow-lift ${className ?? ''}`}
        >
            {FORMAT.format(now)}
        </time>
    )
}
