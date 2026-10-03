import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { cpuPercent, parseMeminfo, readCpuTemp, readDisks } from './system.ts'

const times = (busy: number, idle: number) => ({
    user: busy,
    nice: 0,
    sys: 0,
    idle,
    irq: 0,
})

describe('cpuPercent', () => {
    it('is the busy share of the time that passed, across every core', () => {
        const before = [times(100, 800), times(100, 800)]
        const after = [times(200, 900), times(100, 1000)]

        expect(cpuPercent(before, after)).toBe(25)
    })

    // Two samples in the same clock tick would otherwise divide by zero and
    // show NaN%.
    it('is 0 when no time passed between samples', () => {
        const sample = [times(100, 800)]

        expect(cpuPercent(sample, sample)).toBe(0)
    })
})

describe('parseMeminfo', () => {
    // MemFree would count the page cache as used and read near-full all day.
    it('counts used memory as total minus available, in bytes', () => {
        const meminfo = [
            'MemTotal:       16174460 kB',
            'MemFree:         1791548 kB',
            'MemAvailable:    6932692 kB',
            'Buffers:          402116 kB',
        ].join('\n')

        expect(parseMeminfo(meminfo)).toEqual({
            total: 16_562_647_040,
            used: 9_463_570_432,
        })
    })
})

/** A /sys/class/hwmon with one sensor folder per [name, millidegrees]. */
const hwmon = (sensors: [string, number][]) => {
    const root = mkdtempSync(join(tmpdir(), 'hwmon-'))

    sensors.forEach(([name, milli], index) => {
        const dir = join(root, `hwmon${index}`)
        mkdirSync(dir)
        writeFileSync(join(dir, 'name'), `${name}\n`)
        writeFileSync(join(dir, 'temp1_input'), `${milli}\n`)
    })

    return root
}

describe('readCpuTemp', () => {
    // hwmon numbering follows driver load order and can change between boots.
    it('finds the coretemp sensor by name, wherever it is numbered', async () => {
        const root = hwmon([
            ['acpitz', 27800],
            ['nvme', 20850],
            ['coretemp', 28000],
        ])

        expect(await readCpuTemp(root)).toBe(28)
    })

    it('is null on a host without a coretemp sensor', async () => {
        const root = hwmon([['acpitz', 27800]])

        expect(await readCpuTemp(root)).toBeNull()
    })
})

describe('readDisks', () => {
    it('reads an unreadable mount as null and still reports the rest', async () => {
        const readable = mkdtempSync(join(tmpdir(), 'disk-'))
        const missing = join(readable, 'unmounted')

        expect(await readDisks([readable, missing])).toEqual([
            {
                mount: readable,
                usage: {
                    total: expect.any(Number),
                    used: expect.any(Number),
                    free: expect.any(Number),
                },
            },
            { mount: missing, usage: null },
        ])
    })
})
