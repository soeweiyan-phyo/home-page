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
