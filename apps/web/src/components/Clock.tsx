import { useEffect, useState } from 'react'

const FORMAT = new Intl.DateTimeFormat('en-AU', {
    dateStyle: 'long',
    timeStyle: 'short',
})

export default function Clock() {
    const [now, setNow] = useState(() => new Date())

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1_000)

        return () => clearInterval(timer)
    }, [])

    return (
        <time dateTime={now.toISOString()} className="text-slate-300">
            {FORMAT.format(now)}
        </time>
    )
}
