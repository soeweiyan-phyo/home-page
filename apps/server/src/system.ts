import { readdir, readFile, statfs } from 'node:fs/promises'
import { cpus, uptime } from 'node:os'
import type { CpuInfo } from 'node:os'
import { join } from 'node:path'
import { setTimeout } from 'node:timers/promises'
import type { Disk, SystemStats } from '@home-page/types'

type CpuTimes = CpuInfo['times']

const sum = (samples: CpuTimes[]) =>
    samples.reduce(
        (total, { user, nice, sys, idle, irq }) => ({
            busy: total.busy + user + nice + sys + irq,
            all: total.all + user + nice + sys + idle + irq,
        }),
        { busy: 0, all: 0 },
    )

/** The counters only ever grow, so usage is the change between two samples. */
export const cpuPercent = (before: CpuTimes[], after: CpuTimes[]): number => {
    const start = sum(before)
    const end = sum(after)
    const elapsed = end.all - start.all

    return elapsed === 0 ? 0 : ((end.busy - start.busy) / elapsed) * 100
}

/** /proc/meminfo reports kB, meaning KiB. */
export const parseMeminfo = (
    meminfo: string,
): { total: number; used: number } => {
    const kib = (field: string) =>
        Number(meminfo.match(new RegExp(`^${field}:\\s+(\\d+)`, 'm'))?.[1]) *
        1024

    const total = kib('MemTotal')

    return { total, used: total - kib('MemAvailable') }
}

/**
 * The Intel package temperature, in °C. Found by the sensor's name because
 * hwmon numbering follows driver load order and can change between boots.
 */
export const readCpuTemp = async (hwmonDir: string): Promise<number | null> => {
    for (const sensor of await readdir(hwmonDir)) {
        const name = await readFile(join(hwmonDir, sensor, 'name'), 'utf8')

        if (name.trim() === 'coretemp') {
            const milli = await readFile(
                join(hwmonDir, sensor, 'temp1_input'),
                'utf8',
            )

            return Number(milli) / 1000
        }
    }

    return null
}

/**
 * One unreadable mount reads as null without hiding the others. A mount point
 * whose drive is unplugged is still a folder on /, though, and reports /.
 */
export const readDisks = async (mounts: string[]): Promise<Disk[]> => {
    const results = await Promise.allSettled(
        mounts.map((mount) => statfs(mount)),
    )

    return results.map((result, index) => {
        const mount = mounts[index]

        if (result.status === 'rejected') return { mount, usage: null }

        const { blocks, bfree, bavail, bsize } = result.value

        // Same arithmetic as df: used includes root-reserved blocks, free
        // does not, so used + free falls short of total.
        return {
            mount,
            usage: {
                total: blocks * bsize,
                used: (blocks - bfree) * bsize,
                free: bavail * bsize,
            },
        }
    })
}

// Long enough for the counters to move, short enough to answer a 5 s poll.
const CPU_SAMPLE_MS = 500

/**
 * Host-wide, even from inside the container: /proc and /sys/class/hwmon are
 * not namespaced, and the disks are bind-mounted at their host paths.
 */
export const readSystem = async (disks: string[]): Promise<SystemStats> => {
    const before = cpus().map((cpu) => cpu.times)
    await setTimeout(CPU_SAMPLE_MS)
    const after = cpus().map((cpu) => cpu.times)

    return {
        cpuPercent: cpuPercent(before, after),
        memory: parseMeminfo(await readFile('/proc/meminfo', 'utf8')),
        // A host without hwmon, like a VM, shows no temperature instead of
        // failing the whole header.
        cpuTempC: await readCpuTemp('/sys/class/hwmon').catch(() => null),
        uptimeSeconds: uptime(),
        disks: await readDisks(disks),
    }
}
