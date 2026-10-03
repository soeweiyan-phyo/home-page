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
