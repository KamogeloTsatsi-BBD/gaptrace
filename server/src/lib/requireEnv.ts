const REQUIRED_ENV = ['ANTHROPIC_API_KEY', 'SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY']

/** Throws rather than exits, so it serves a long-lived process and a function alike. */
export function assertRequiredEnv(): void {
  const missing = REQUIRED_ENV.filter((name) => !process.env[name])
  if (missing.length === 0) return

  throw new Error(
    `${missing.join(', ')} ${missing.length === 1 ? 'is' : 'are'} not set. ` +
      'Set them in .env at the repo root, or in the project settings of the host.',
  )
}
