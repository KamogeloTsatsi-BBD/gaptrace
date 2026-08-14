import { Router } from 'express'
import { buildSubstrate } from '../lib/reportStats.js'
import { createSingleFlight } from '../lib/singleFlight.js'
import { stableHash } from '../lib/stableHash.js'
import { narrateInsights } from '../services/insightNarrator.js'
import type { AnalysisStore } from '../repositories/analysisStore.js'
import type { InsightSnapshotStore } from '../repositories/insightSnapshotStore.js'
import type { InsightSnapshot } from '../types.js'

/** How far back the dashboard looks. Becomes a real time window with the DB. */
const INSIGHT_WINDOW = 100

export interface InsightsDeps {
  analyses: AnalysisStore
  snapshots: InsightSnapshotStore
  /** Injected so a test can supply a stand-in instead of calling the model. */
  narrate?: typeof narrateInsights
}

/**
 * Two endpoints, split along the line that costs money.
 *
 * `GET` is free and always fresh: it builds the substrate by counting stored
 * reports, and returns a cached narrative only if one exists for this exact
 * substrate. It never generates. That means opening the dashboard, refreshing
 * it, or leaving the tab open costs nothing — the difference between one call
 * per change and one call per page view is the entire cost profile of this
 * feature.
 *
 * `POST /narrative` is the deliberate act of spending. Even then it only pays
 * when the substrate hash has moved; otherwise it hands back the same snapshot
 * `GET` would have.
 */
export function createInsightsRouter(deps: InsightsDeps): Router {
  const narrate = deps.narrate ?? narrateInsights
  const singleFlight = createSingleFlight<InsightSnapshot>()

  const currentSubstrate = async () => {
    const reports = await deps.analyses.list(INSIGHT_WINDOW)
    const substrate = buildSubstrate(reports)
    return { substrate, key: stableHash(substrate) }
  }

  /** The snapshot minus its cache key — that is an implementation detail. */
  const asNarrative = (snapshot: InsightSnapshot | null) =>
    snapshot === null
      ? null
      : {
          cards: snapshot.cards,
          generatedAt: snapshot.generatedAt,
          analysisCount: snapshot.analysisCount,
        }

  const router = Router()

  router.get('/', async (_req, res) => {
    const { substrate, key } = await currentSubstrate()
    const snapshot = await deps.snapshots.get(key)

    res.json({
      substrate,
      narrative: asNarrative(snapshot),
      // True when the numbers have moved since the last narration — the client
      // shows a "regenerate" affordance rather than silently spending.
      stale: snapshot === null,
      canNarrate: substrate.criterionCount > 0,
    })
  })

  router.post('/narrative', async (_req, res) => {
    const { substrate, key } = await currentSubstrate()

    const cached = await deps.snapshots.get(key)
    if (cached) {
      res.json({ narrative: asNarrative(cached), cached: true })
      return
    }

    // Concurrent regenerations of the same substrate collapse into one call.
    const snapshot = await singleFlight(key, async () => {
      // Re-checked inside the flight: a request that queued behind another
      // must not pay again for what that one just produced.
      const fresh = await deps.snapshots.get(key)
      if (fresh) return fresh

      const cards = await narrate(substrate)
      const generated: InsightSnapshot = {
        key,
        cards,
        generatedAt: new Date().toISOString(),
        analysisCount: substrate.analysisCount,
      }
      await deps.snapshots.save(generated)
      return generated
    })

    res.status(201).json({ narrative: asNarrative(snapshot), cached: false })
  })

  return router
}
