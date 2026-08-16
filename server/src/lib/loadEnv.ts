/**
 * Loads .env. Paths resolve from this module, not cwd, which varies with how
 * the process was started. `server/.env` wins over the root one.
 */
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from 'dotenv'

const here = fileURLToPath(new URL('.', import.meta.url))

config({ path: [resolve(here, '../../.env'), resolve(here, '../../../.env')] })
