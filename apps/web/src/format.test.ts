import { describe, expect, it } from 'vitest'
import { formatBytes, formatUptime } from './format.ts'

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
