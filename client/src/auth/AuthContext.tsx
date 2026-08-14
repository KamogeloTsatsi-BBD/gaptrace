import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextValue {
  session: Session | null;
  ready: boolean;
  configured: boolean;
  signIn: (email: string, password: string) => ReturnType<NonNullable<typeof supabase>['auth']['signInWithPassword']>;
  signUp: (email: string, password: string) => ReturnType<NonNullable<typeof supabase>['auth']['signUp']>;
  signOut: () => Promise<unknown>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(!supabase);

  useEffect(() => {
    if (!supabase) return undefined;
    void supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => listener.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    session, ready, configured: Boolean(supabase),
    signIn: (email, password) => supabase!.auth.signInWithPassword({ email, password }),
    signUp: (email, password) => supabase!.auth.signUp({ email, password }),
    signOut: () => supabase?.auth.signOut() ?? Promise.resolve(),
  }), [ready, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider.');
  return context;
}
