import { describe, expect, it } from 'vitest'
import { diskFill, formatBytes, formatUptime } from './format.ts'

describe('formatBytes', () => {
    it.each([
        [0, '0 B'],
        [1536, '1.5 KB'],
        // The 1 TB s-power drive, as df -h and Windows both show it.
        [1_000_170_586_112, '931 GB'],
        [2_199_023_255_552, '2.0 TB'],
    ])('%d bytes reads as %s', (bytes, text) => {
        expect(formatBytes(bytes)).toBe(text)
    })
})

describe('formatUptime', () => {
    it.each([
        [5_472_323, '63d 8h'],
        [15_120, '4h 12m'],
        [720, '12m'],
        [30, '0m'],
    ])('%d seconds reads as %s', (seconds, text) => {
        expect(formatUptime(seconds)).toBe(text)
    })
})

describe('diskFill', () => {
    // df's Use%: root-reserved blocks count as neither used nor free.
    it('measures fill against usable space, as df does', () => {
        const sPower = {
            total: 1_000_170_586_112,
            used: 831_898_255_360,
            free: 168_272_330_752,
        }

        const fill = diskFill(sPower)

        expect(fill.share).toBeCloseTo(0.832, 3)
        expect(fill.nearlyFull).toBe(false)
    })

    it('is nearly full from 85% used', () => {
        expect(diskFill({ total: 100, used: 85, free: 15 }).nearlyFull).toBe(
            true,
        )
    })

    // A freshly formatted or unreadable-size disk must not draw NaN% wide.
    it('is empty when the disk reports no space at all', () => {
        expect(diskFill({ total: 0, used: 0, free: 0 })).toEqual({
            share: 0,
            nearlyFull: false,
        })
    })
})
