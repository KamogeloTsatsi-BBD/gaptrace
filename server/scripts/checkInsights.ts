/**
 * `npm run check:insights`. A counting stand-in replaces the narrator, so every
 * assertion below is about how many times we *would* have paid.
 */
import assert from 'node:assert/strict'
import express from 'express'
import { createInsightsRouter } from '../src/routes/insights.js'
import { computeScopeSignal } from '../src/lib/scopeSignal.js'
import { summariseCriteria } from '../src/lib/reportStats.js'
import type { AnalysisDraft, AnalysisStore } from '../src/repositories/analysisStore.js'
import type { InsightSnapshotStore } from '../src/repositories/insightSnapshotStore.js'
import type {
  AnalysisReport,
  EvaluatedCriterion,
  InsightSnapshot,
  NarrativeCard,
} from '../src/types.js'

const DIFF = `diff --git a/src/pay.ts b/src/pay.ts
--- a/src/pay.ts
+++ b/src/pay.ts
diff --git a/src/refactor-nobody-asked-for.ts b/src/refactor-nobody-asked-for.ts
--- a/src/refactor-nobody-asked-for.ts
+++ b/src/refactor-nobody-asked-for.ts
diff --git a/src/also-unasked.ts b/src/also-unasked.ts
--- a/src/also-unasked.ts
+++ b/src/also-unasked.ts
`

function draft(seed: number): AnalysisDraft {
  const criteria: EvaluatedCriterion[] = [
    {
      id: 'c1',
      text: 'Payments must be validated before capture.',
      verifiable: true,
      status: 'missing',
      reason: 'No validation in the diff.',
      evidence: [{ file: 'src/pay.ts', lines: '1-10' }],
      confidence: 0.8,
      category: 'validation',
    },
    {
      id: 'c2',
      text: 'Failures must be logged.',
      verifiable: true,
      status: seed % 2 === 0 ? 'partial' : 'full',
      reason: 'Partly handled.',
      evidence: [{ file: 'src/pay.ts', lines: '20-30' }],
      confidence: 0.6,
      category: seed % 2 === 0 ? 'error_handling' : null,
    } as EvaluatedCriterion,
    {
      id: 'c3',
      text: 'The flow should feel fast.',
      verifiable: false,
      status: 'needs_review',
      reason: 'Not verifiable from code.',
      evidence: 'none',
      confidence: 1,
      category: null,
    },
  ]

  return {
    requirementText: 'Users must be able to pay by card.',
    prReference: `https://github.com/acme/repo/pull/${seed}`,
    summary: summariseCriteria(criteria),
    scope: computeScopeSignal(DIFF, criteria),
    criteria,
  }
}

let calls = 0
const fakeNarrate = async (): Promise<NarrativeCard[]> => {
  calls += 1
  await new Promise((resolve) => setTimeout(resolve, 30))
  return [
    {
      audience: 'ba',
      finding: 'stub',
      groundingStat: 'stub',
      hypothesis: 'stub',
      suggestedAction: 'stub',
      severity: 'low',
    },
  ]
}

// Stub stores, defined here rather than shipped in `src/` — the behaviour under
// test belongs to the router, not to storage.
let nextId = 1
const saved: AnalysisReport[] = []

const analyses: AnalysisStore = {
  async save(draftReport) {
    const report: AnalysisReport = {
      ...draftReport,
      id: nextId++,
      createdAt: '2026-08-15T10:00:00.000Z',
    }
    saved.push(report)
    return report
  },
  async findById(id) {
    return saved.find((report) => report.id === id) ?? null
  },
  async list(limit) {
    return [...saved].reverse().slice(0, limit)
  },
}

let snapshot: InsightSnapshot | null = null
const snapshots: InsightSnapshotStore = {
  async get(key) {
    return snapshot?.key === key ? snapshot : null
  },
  async save(next) {
    snapshot = next
  },
}

const app = express()
app.use(express.json())
// Stands in for `requireAuth`. One pinned caller, since the cache is per-user.
app.use((req, _res, next) => {
  req.auth = { userId: 'test-user', accessToken: 'test-token' }
  next()
})
app.use(
  '/api/insights',
  createInsightsRouter({ analyses: () => analyses, snapshots: () => snapshots, narrate: fakeNarrate }),
)
const server = app.listen(4599)
const base = 'http://localhost:4599/api/insights'

const get = async () => (await fetch(base)).json()
const post = async () => (await fetch(`${base}/narrative`, { method: 'POST' })).json()

try {
  // --- empty state
  let body = await get()
  assert.equal(body.substrate.analysisCount, 0)
  assert.equal(body.narrative, null)
  assert.equal(body.canNarrate, false)
  console.log('empty state: substrate served, nothing narrated')

  await analyses.save(draft(1))
  await analyses.save(draft(2))

  // --- scope proxy
  body = await get()
  assert.equal(body.substrate.scope.meanUncitedRatio, 0.667)
  assert.equal(body.substrate.scope.analysesOverHalfUncited, 2)
  console.log(
    `scope proxy: 2 of 3 files uncited -> meanUncitedRatio=${body.substrate.scope.meanUncitedRatio}`,
  )

  // --- substrate keeps text, not just counts
  assert.ok(body.substrate.gapExamples.length > 0)
  assert.ok(body.substrate.unsettledCriteria.length > 0)
  assert.equal(body.substrate.unsettledCriteria[0].kind, 'not_verifiable')
  assert.equal(body.substrate.notVerifiableCount, 2)
  console.log('substrate: carries gap examples and unsettled criteria verbatim')

  // --- GET never narrates
  await get()
  await get()
  assert.equal(calls, 0)
  assert.equal(body.stale, true)
  console.log(`three GETs, model calls = ${calls} (page views are free)`)

  // --- first POST pays
  const first = await post()
  assert.equal(first.cached, false)
  assert.equal(calls, 1)
  console.log(`first POST /narrative: paid, model calls = ${calls}`)

  // --- repeat POSTs are free while the substrate is unchanged
  const second = await post()
  assert.equal(second.cached, true)
  assert.equal(calls, 1)
  console.log(`second POST /narrative: cached=true, model calls still ${calls}`)

  // --- GET now serves the cached narrative and reports fresh
  body = await get()
  assert.ok(body.narrative)
  assert.equal(body.stale, false)
  assert.equal(calls, 1)
  console.log('GET now serves the cached narrative, stale=false')

  // --- new analysis invalidates by content hash
  await analyses.save(draft(3))
  body = await get()
  assert.equal(body.stale, true)
  assert.equal(body.narrative, null)
  assert.equal(calls, 1)
  console.log('new analysis -> hash moved -> stale=true, still not billed on GET')

  // --- single flight: concurrent regenerations collapse to one call
  const racers = await Promise.all([post(), post(), post(), post(), post()])
  assert.equal(calls, 2)
  assert.ok(racers.every((r) => r.narrative))
  console.log(`5 concurrent POSTs on a cold key: model calls = ${calls} (single-flight held)`)

  console.log('\nAll insight-cache assertions passed.')
} finally {
  server.close()
}
