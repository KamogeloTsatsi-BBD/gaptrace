import express from 'express'
import { createErrorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { createInMemoryAnalysisStore } from './repositories/analysisStore.js'
import { createAnalysesRouter } from './routes/analyses.js'
import { createInsightsRouter } from './routes/insights.js'
import { createInMemoryInsightSnapshotStore } from './repositories/insightSnapshotStore.js'
import type { AnalysisStore } from './repositories/analysisStore.js'
import type { InsightSnapshotStore } from './repositories/insightSnapshotStore.js'

/**
 * A diff and a requirement in one JSON body; the diff is the big half and the
 * comparator caps it at 300k characters, so this only has to be comfortably
 * above that.
 */
const BODY_LIMIT = '5mb'

/**
 * Composition root: the one place that picks concrete implementations. The
 * store is injected so tests can pass a fake, and so pointing gaptrace at
 * Supabase later is a change here and nowhere else.
 *
 * No CORS layer — the Vite dev server proxies /api to this process, so the
 * browser only ever sees one origin.
 */
export function createApp(
  store: AnalysisStore = createInMemoryAnalysisStore(),
  snapshots: InsightSnapshotStore = createInMemoryInsightSnapshotStore(),
) {
  const app = express()

  app.use(express.json({ limit: BODY_LIMIT }))

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true })
  })

  app.use('/api/analyses', createAnalysesRouter(store))
  app.use('/api/insights', createInsightsRouter({ analyses: store, snapshots }))

  app.use(notFoundHandler)
  app.use(createErrorHandler())

  return app
}

export const app = createApp()
