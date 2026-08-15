import './lib/loadEnv.js'

// Checked before app.js is imported, so a missing key fails legibly rather than
// as an SDK stack trace. Supabase is not optional: a server that booted without
// a database would accept analyses, pay for them and drop them.
const REQUIRED_ENV = ['ANTHROPIC_API_KEY', 'SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY']

const missing = REQUIRED_ENV.filter((name) => !process.env[name])
if (missing.length > 0) {
  console.error(
    `${missing.join(', ')} ${missing.length === 1 ? 'is' : 'are'} not set. ` +
      'Copy .env.example to .env at the repo root and fill it in.',
  )
  process.exit(1)
}

const { app } = await import('./app.js')

const port = Number(process.env.PORT ?? 3000)

app.listen(port, () => {
  console.log(`gaptrace server listening on http://localhost:${port}`)
})
