import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Injected by vite.config.ts from the root .env — the same two variables the
// server reads, not a browser-only copy.
const url = import.meta.env.SUPABASE_URL
const publishableKey = import.meta.env.SUPABASE_PUBLISHABLE_KEY

/** Null when unconfigured — a supported state (demo mode), so the type says so. */
export const supabase: SupabaseClient | null =
  url && publishableKey ? createClient(url, publishableKey) : null
