import '../server/dist/lib/loadEnv.js'
import { assertRequiredEnv } from '../server/dist/lib/requireEnv.js'

assertRequiredEnv()

const { app } = await import('../server/dist/app.js')

export default app
