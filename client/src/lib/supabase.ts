import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Null when the workspace has no Supabase configuration, which is a supported
 * state rather than an error: the app then runs in demo mode. Everything that
 * touches this must handle null, and the type says so instead of leaving it to
 * a `!` at the call site.
 *
 * Only the public anon key ever reaches the browser. The Anthropic key is
 * server-side and has no client-side counterpart.
 */
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null
