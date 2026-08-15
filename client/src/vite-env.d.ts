/// <reference types="vite/client" />

/** All optional: absence is a supported state, and it is what makes demo mode work. */
interface ImportMetaEnv {
  /** Overrides the same-origin `/api` default. Only for split deploys. */
  readonly VITE_API_BASE_URL?: string

  /** Unprefixed because `vite.config.ts` injects these from the root `.env`. */
  readonly SUPABASE_URL?: string
  readonly SUPABASE_PUBLISHABLE_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
