import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import pluginQuery from '@tanstack/eslint-plugin-query'
import tailwind from 'eslint-plugin-better-tailwindcss'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
    globalIgnores(['dist']),
    {
        files: ['**/*.{ts,tsx}'],
        extends: [
            js.configs.recommended,
            tseslint.configs.recommendedTypeChecked,
            // Includes the React Compiler rules: they flag components the
            // compiler skips silently.
            reactHooks.configs.flat.recommended,
            reactRefresh.configs.vite,
            pluginQuery.configs['flat/recommended-strict'],
            tailwind.configs.recommended,
        ],
        languageOptions: {
            globals: globals.browser,
            parserOptions: {
                projectService: true,
                // The IDE lints from the repo root, where apps/web and
                // apps/server are both candidate roots and neither wins.
                tsconfigRootDir: import.meta.dirname,
            },
        },
        settings: {
            'better-tailwindcss': { entryPoint: 'src/index.css' },
        },
        rules: {
            // Prettier owns line breaks; two owners would undo each other.
            'better-tailwindcss/enforce-consistent-line-wrapping': 'off',
        },
    },
])
