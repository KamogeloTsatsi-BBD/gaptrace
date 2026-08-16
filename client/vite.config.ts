import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

/** Resolved from this file rather than cwd, which differs by how Vite was started. */
const repoRoot = fileURLToPath(new URL('..', import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Empty prefix, so unprefixed variables are visible here.
  const env = loadEnv(mode, repoRoot, '')

  return {
    plugins: [react()],

    // Config is one .env at the repo root; otherwise Vite looks in client/.
    envDir: repoRoot,

    // Injected unprefixed so the Supabase values don't need a second, VITE_-named
    // copy. Absent becomes `''`, which `lib/supabase.ts` reads as unconfigured.
    define: {
      'import.meta.env.SUPABASE_URL': JSON.stringify(env.SUPABASE_URL ?? ''),
      'import.meta.env.SUPABASE_PUBLISHABLE_KEY': JSON.stringify(
        env.SUPABASE_PUBLISHABLE_KEY ?? '',
      ),
    },

    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
  }
})
