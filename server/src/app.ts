import express from 'express'
import { createErrorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { createRequireAuth } from './middleware/requireAuth.js'
import { createSupabaseAnalysisStore } from './repositories/supabaseAnalysisStore.js'
import { createSupabaseInsightSnapshotStore } from './repositories/supabaseInsightSnapshotStore.js'
import { createAnalysesRouter } from './routes/analyses.js'
import { createInsightsRouter } from './routes/insights.js'
import type { AnalysisStoreFactory } from './repositories/analysisStore.js'
import type { InsightSnapshotStoreFactory } from './repositories/insightSnapshotStore.js'

/** Comfortably above the comparator's 300k-character diff cap. */
const BODY_LIMIT = '5mb'

/** Stores are required, so the server can't boot appearing to work and storing nothing. */
export function createApp(
  stores: AnalysisStoreFactory,
  snapshots: InsightSnapshotStoreFactory,
) {
  const app = express()

  app.use(express.json({ limit: BODY_LIMIT }))

  // The only open route: whether the process is up needs no credential.
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true })
  })

  // Mounted before the routers, not inside them, so a route added later is
  // behind the gate by default.
  const requireAuth = createRequireAuth()

  app.use('/api/analyses', requireAuth, createAnalysesRouter(stores))
  app.use('/api/insights', requireAuth, createInsightsRouter({ analyses: stores, snapshots }))

  app.use(notFoundHandler)
  app.use(createErrorHandler())

  return app
}

export const app = createApp(createSupabaseAnalysisStore, createSupabaseInsightSnapshotStore)
