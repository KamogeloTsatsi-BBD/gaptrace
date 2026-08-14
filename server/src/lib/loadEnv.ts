/**
 * Side-effect import that loads .env — `import './lib/loadEnv.js'`.
 *
 * Paths are resolved from this module rather than from cwd, because cwd varies
 * with how the process was started: `npm run dev` at the repo root launches the
 * server with cwd=server/, a scratch script may not. Both the workspace-local
 * and the root .env are accepted; the local one wins, so a per-service
 * override stays possible.
 *
 * The layout under src/ mirrors the layout under dist/, so one pair of
 * relative paths is correct for both tsx and the built output.
 */
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from 'dotenv'

const here = fileURLToPath(new URL('.', import.meta.url))

config({ path: [resolve(here, '../../.env'), resolve(here, '../../../.env')] })
