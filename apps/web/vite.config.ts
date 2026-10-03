import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        host: true,
        port: 7053,
        strictPort: true,
        allowedHosts: ['orion.local'],
        proxy: {
            // No rewrite: Hono serves its routes under /api.
            '/api': 'http://127.0.0.1:7051',
        },
    },
})
