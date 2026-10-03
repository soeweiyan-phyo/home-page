import { describe, expect, it } from 'vitest'
import { toContainerStats } from './docker.ts'
import type { DockerStats } from './docker.ts'

/** Docker's stats shape: two CPU samples a second apart, cgroup v2 memory. */
const stats = (overrides: Partial<DockerStats> = {}): DockerStats => ({
    cpu_stats: {
        cpu_usage: { total_usage: 4_500_000_000 },
        system_cpu_usage: 66_000_000_000,
        online_cpus: 6,
    },
    precpu_stats: {
        cpu_usage: { total_usage: 3_000_000_000 },
        system_cpu_usage: 60_000_000_000,
    },
    memory_stats: { usage: 700_000_000, stats: { inactive_file: 50_000_000 } },
    networks: {
        eth0: { rx_bytes: 1_000, tx_bytes: 200 },
        eth1: { rx_bytes: 30, tx_bytes: 4 },
    },
    ...overrides,
})

describe('toContainerStats', () => {
    // 1.5 s of CPU across 6 s of all six cores' time: one and a half cores.
    it('reads CPU as a share of one core, the way docker stats does', () => {
        expect(toContainerStats(stats()).cpuPercent).toBe(150)
    })

    // The first sample after a start has nothing to compare against.
    it('reads CPU as 0 rather than NaN when the system counter has not moved', () => {
        const first = stats({
            precpu_stats: {
                cpu_usage: { total_usage: 4_500_000_000 },
                system_cpu_usage: 66_000_000_000,
            },
        })

        expect(toContainerStats(first).cpuPercent).toBe(0)
    })

    // Page cache the kernel can drop on demand is not memory the app holds.
    it('leaves reclaimable page cache out of memory', () => {
        expect(toContainerStats(stats()).memory).toBe(650_000_000)
    })

    it('sums received and sent across every interface', () => {
        const { received, sent } = toContainerStats(stats())

        expect({ received, sent }).toEqual({ received: 1_030, sent: 204 })
    })

    it('reports no traffic, not zero, for a container without a network', () => {
        const { received, sent } = toContainerStats(
            stats({ networks: undefined }),
        )

        expect({ received, sent }).toEqual({ received: null, sent: null })
    })
})
