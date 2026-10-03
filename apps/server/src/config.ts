import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Dashboard, Icon } from '@home-page/types'
import { parse } from 'yaml'
import { z } from 'zod'

// Both gitignored. Compose bind-mounts the host's copies to these same paths.
const CONFIG_DIR = join(import.meta.dirname, '../../../config')
export const DASHBOARD_PATH = join(CONFIG_DIR, 'dashboard.yaml')
export const ICONS_DIR = join(CONFIG_DIR, 'icons')

// Strict, so a misspelt key fails instead of being dropped.
const ConfigSchema = z.strictObject({
    groups: z.array(
        z.strictObject({
            name: z.string(),
            collapsed: z.boolean().default(false),
            services: z.array(
                z.strictObject({
                    name: z.string(),
                    icon: z.string().optional(),
                    href: z.url().optional(),
                    description: z.string().optional(),
                    container: z.string().optional(),
                }),
            ),
        }),
    ),
})

export const parseDashboard = (source: string): Dashboard => {
    const config = ConfigSchema.parse(parse(source))

    return {
        groups: config.groups.map((group) => ({
            ...group,
            services: group.services.map((service) => ({
                name: service.name,
                icon: resolveIcon(service.icon),
                href: service.href ?? null,
                description: service.description ?? null,
                container: service.container ?? null,
            })),
        })),
    }
}

/** Throws on an invalid config, so a bad file stops the server booting. */
export const loadDashboard = (path: string): Dashboard =>
    parseDashboard(readFileSync(path, 'utf8'))

const DASHBOARD_ICONS =
    'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons'

// Pinned: a new release could rename a glyph and silently blank a card.
const MDI = 'https://cdn.jsdelivr.net/npm/@mdi/svg@7.4.47/svg'

/** Follows Homepage's icon naming, so its services.yaml ports across as is. */
export const resolveIcon = (name: string | undefined): Icon | null => {
    if (!name) return null

    // Material Design glyphs are black and need tinting on the dark theme.
    if (name.startsWith('mdi-')) {
        return { src: `${MDI}/${name.slice('mdi-'.length)}.svg`, mono: true }
    }

    if (name.startsWith('/')) return { src: name, mono: false }

    const extension = name.split('.').pop()

    return { src: `${DASHBOARD_ICONS}/${extension}/${name}`, mono: false }
}
