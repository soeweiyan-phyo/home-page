import { useEffect, useState } from 'react'

/** The current time, re-read every intervalMs, so time-relative text ticks
 * without reading the clock during render. */
export const useNow = (intervalMs: number): Date => {
    const [now, setNow] = useState(() => new Date())

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), intervalMs)

        return () => clearInterval(timer)
    }, [intervalMs])

    return now
}
