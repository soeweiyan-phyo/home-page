/** mono: a single-colour glyph the UI tints to show on a dark background. */
export interface Icon {
    src: string
    mono: boolean
}

export interface Service {
    name: string
    icon: Icon | null
    href: string | null
    description: string | null
    /** The Docker container behind the card. null draws no status dot. */
    container: string | null
    /** The auto-deployed repo behind the card. null shows no deploy status. */
    repo: string | null
}

export interface Group {
    name: string
    collapsed: boolean
    services: Service[]
}

export interface Dashboard {
    greeting: string
    /** Mount points whose usage the header shows. */
    disks: string[]
    groups: Group[]
}

export type ServiceStatus = 'up' | 'degraded' | 'down' | 'unknown'

export interface ContainerStatus {
    status: ServiceStatus
    /** Docker's own words, like "Up 2 months (healthy)". null if absent. */
    detail: string | null
}

/** Keyed by container name. Only containers named in the config. */
export type StatusMap = Record<string, ContainerStatus>

/** auto-deploy's last cycle for one repo. deploying is written as a build
 * starts; the skips mean local changes or local commits blocked the deploy. */
export interface DeployStatus {
    status:
        | 'up-to-date'
        | 'deploying'
        | 'skipped-dirty'
        | 'skipped-ahead'
        | 'failed'
    /** Where a failure happened. null unless failed. */
    stage: 'fetch' | 'build' | null
    branch: string | null
    /** The last commit that built, so the one running. */
    running: string | null
    runningMessage: string | null
    /** The branch's commit on GitHub. */
    remote: string | null
    /** The running commit on GitHub. null for an origin elsewhere. */
    commitUrl: string | null
    /** ISO time of the cycle that wrote this. */
    checkedAt: string
    /** The last lines of the build's output, on failure only. */
    error: string | null
}

/** Keyed by repo. null when the repo has no readable status yet. */
export type DeployMap = Record<string, DeployStatus | null>

/** One container's live usage, as docker stats reports it. */
export interface ContainerStats {
    /** Of one core, so a busy container on six cores can read up to 600. */
    cpuPercent: number
    /** Bytes, excluding reclaimable page cache. */
    memory: number
    /** Bytes since the container started. null when it has no network of its
     * own to count. */
    received: number | null
    sent: number | null
}

/** Bytes. used counts root-reserved blocks; free is what a user can write. */
export interface DiskUsage {
    total: number
    used: number
    free: number
}

export interface Disk {
    mount: string
    /** null when the mount could not be read. */
    usage: DiskUsage | null
}

export interface SystemStats {
    cpuPercent: number
    /** Bytes. used excludes reclaimable cache: MemTotal − MemAvailable. */
    memory: { total: number; used: number }
    /** null when the host has no coretemp sensor. */
    cpuTempC: number | null
    uptimeSeconds: number
    disks: Disk[]
}
