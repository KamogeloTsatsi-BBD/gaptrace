import './lib/loadEnv.js'
import { assertRequiredEnv } from './lib/requireEnv.js'

try {
  assertRequiredEnv()
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}

const { app } = await import('./app.js')

const port = Number(process.env.PORT ?? 3000)

app.listen(port, () => {
  console.log(`gaptrace server listening on http://localhost:${port}`)
})
