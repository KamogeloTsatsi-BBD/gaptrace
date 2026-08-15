/** Dependency-free, so repositories can name it without importing an HTTP concern. */
export interface AuthContext {
  /** Already verified; nothing downstream re-checks it. */
  userId: string
  /** Forwarded to Postgres so RLS can resolve `auth.uid()`. */
  accessToken: string
}
