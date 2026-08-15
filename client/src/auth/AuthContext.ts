import { createContext } from 'react'

/** The signed-in user, reduced to what the UI actually renders. */
export interface AuthUser {
  id: string
  email: string | null
}

/**
 * A normalised result rather than Supabase's own response type.
 *
 * The UI should be able to sign a user in without importing an SDK type;
 * swapping the provider then means rewriting one file instead of every form
 * that touches authentication.
 */
export interface AuthResult {
  error: { message: string } | null
}

export interface AuthContextValue {
  user: AuthUser | null
  /** Bearer token for API calls, or undefined when signed out. */
  accessToken: string | undefined
  /** False until the initial session lookup settles — gates the first paint. */
  ready: boolean
  /** False when Supabase credentials are absent; the app runs in demo mode. */
  configured: boolean
  signIn: (email: string, password: string) => Promise<AuthResult>
  signUp: (email: string, password: string) => Promise<AuthResult>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
