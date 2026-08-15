/// <reference types="vite/client" />

/**
 * Declared so `import.meta.env` is typed rather than `any`. Every entry is
 * optional: these come from a `.env` file that may not exist, and the code
 * that reads them must handle absence — which is what makes demo mode work.
 */
interface ImportMetaEnv {
  /** Overrides the same-origin `/api` default. Only needed for split deploys. */
  readonly VITE_API_BASE_URL?: string
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
