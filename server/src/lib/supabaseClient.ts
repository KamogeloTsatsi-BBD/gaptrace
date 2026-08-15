/**
 * No service_role client, deliberately. The server holds only the publishable
 * key and forwards the caller's token, so RLS is what enforces isolation.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is not set. Copy .env.example to .env at the repo root and fill it in.`)
  }
  return value
}

/** Per request, and cheap: supabase-js is HTTP, so there is no connection pool. */
export function createUserClient(accessToken: string): SupabaseClient {
  return createClient(required('SUPABASE_URL'), required('SUPABASE_PUBLISHABLE_KEY'), {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}

/** Lazy, so importing this doesn't throw before `index.ts` reports missing env. */
let verifier: SupabaseClient | null = null

export function getVerifierClient(): SupabaseClient {
  verifier ??= createClient(required('SUPABASE_URL'), required('SUPABASE_PUBLISHABLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
  return verifier
}
