import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { AuthContext, type AuthContextValue, type AuthResult, type AuthUser } from './AuthContext'
import type { Session } from '@supabase/supabase-js'

/** Returned when a credential call is made with no Supabase client configured. */
const NOT_CONFIGURED: AuthResult = {
  error: { message: 'Authentication is not configured in this workspace.' },
}

function toUser(session: Session | null): AuthUser | null {
  if (!session) return null
  return { id: session.user.id, email: session.user.email ?? null }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  // With no client there is nothing to wait for, so the app is ready at once.
  const [ready, setReady] = useState(!supabase)

  useEffect(() => {
    const client = supabase
    if (!client) return undefined

    // The subscription is attached before the initial lookup resolves, so a
    // sign-in that lands mid-lookup is not lost. `onAuthStateChange` fires
    // last and wins, which is the ordering we want.
    const { data: listener } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setReady(true)
    })

    client.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      // A failed lookup means signed out, not broken — the sign-in form is the
      // correct destination either way, and hanging on the splash is not.
      .catch(() => setSession(null))
      .finally(() => setReady(true))

    return () => listener.subscription.unsubscribe()
  }, [])

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!supabase) return NOT_CONFIGURED
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error ? { message: error.message } : null }
  }, [])

  const signUp = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!supabase) return NOT_CONFIGURED
    const { error } = await supabase.auth.signUp({ email, password })
    return { error: error ? { message: error.message } : null }
  }, [])

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut()
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user: toUser(session),
      accessToken: session?.access_token,
      ready,
      configured: Boolean(supabase),
      signIn,
      signUp,
      signOut,
    }),
    [session, ready, signIn, signUp, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
