import { Router } from 'express'
import { buildSubstrate } from '../lib/reportStats.js'
import { createSingleFlight } from '../lib/singleFlight.js'
import { stableHash } from '../lib/stableHash.js'
import { requireAuthContext } from '../middleware/requireAuth.js'
import { NARRATOR_VERSION, narrateInsights } from '../services/insightNarrator.js'
import type { AuthContext } from '../lib/authContext.js'
import type { AnalysisStoreFactory } from '../repositories/analysisStore.js'
import type { InsightSnapshotStoreFactory } from '../repositories/insightSnapshotStore.js'
import type { InsightSnapshot } from '../types.js'

const INSIGHT_WINDOW = 100

export interface InsightsDeps {
  analyses: AnalysisStoreFactory
  snapshots: InsightSnapshotStoreFactory
  /** Injected so a test can supply a stand-in instead of calling the model. */
  narrate?: typeof narrateInsights
}

/**
 * Split along the line that costs money: `GET` never generates, and
 * `POST /narrative` pays only when the substrate hash has moved.
 */
export function createInsightsRouter(deps: InsightsDeps): Router {
  const narrate = deps.narrate ?? narrateInsights
  const singleFlight = createSingleFlight<InsightSnapshot>()

  const currentSubstrate = async (auth: AuthContext) => {
    // Scoped by RLS, not by a filter here — `list` can only return this
    // caller's analyses, so the substrate and its hash are theirs.
    const reports = await deps.analyses(auth).list(INSIGHT_WINDOW)
    const substrate = buildSubstrate(reports)
    // Versioned, so changing how a narrative is written retires the old ones.
    return { substrate, key: stableHash({ substrate, narrator: NARRATOR_VERSION }) }
  }

  /** The snapshot minus its cache key. */
  const asNarrative = (snapshot: InsightSnapshot | null) =>
    snapshot === null
      ? null
      : {
          cards: snapshot.cards,
          generatedAt: snapshot.generatedAt,
          analysisCount: snapshot.analysisCount,
        }

  const router = Router()

  router.get('/', async (req, res) => {
    const auth = requireAuthContext(req.auth)
    const { substrate, key } = await currentSubstrate(auth)
    const snapshot = await deps.snapshots(auth).get(key)

    res.json({
      substrate,
      narrative: asNarrative(snapshot),
      // True when the numbers have moved since the last narration.
      stale: snapshot === null,
      canNarrate: substrate.criterionCount > 0,
    })
  })

  router.post('/narrative', async (req, res) => {
    const auth = requireAuthContext(req.auth)
    const snapshots = deps.snapshots(auth)
    const { substrate, key } = await currentSubstrate(auth)

    const cached = await snapshots.get(key)
    if (cached) {
      res.json({ narrative: asNarrative(cached), cached: true })
      return
    }

    // Concurrent regenerations collapse into one call. Namespaced by user
    // because two empty accounts hash identically.
    const snapshot = await singleFlight(`${auth.userId}:${key}`, async () => {
      // Re-checked inside the flight so a queued request doesn't pay again.
      const fresh = await snapshots.get(key)
      if (fresh) return fresh

      const cards = await narrate(substrate)
      const generated: InsightSnapshot = {
        key,
        cards,
        generatedAt: new Date().toISOString(),
        analysisCount: substrate.analysisCount,
      }
      await snapshots.save(generated)
      return generated
    })

    res.status(201).json({ narrative: asNarrative(snapshot), cached: false })
  })

  return router
}
