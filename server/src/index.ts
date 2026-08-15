import './lib/loadEnv.js'

// Checked before app.js is imported: constructing the Anthropic client throws
// on a missing key, and that failure surfaces as an SDK-internal stack trace
// with no hint about the .env file. Fail here instead, legibly.
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('ANTHROPIC_API_KEY is not set. Copy .env.example to .env at the repo root and fill it in.')
  process.exit(1)
}

const { app } = await import('./app.js')

const port = Number(process.env.PORT ?? 3000)

app.listen(port, () => {
  console.log(`gaptrace server listening on http://localhost:${port}`)
})
