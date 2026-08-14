// Domain types for the analysis pipeline, per docs/superpowers/specs.

export const GAP_CATEGORIES = [
  'error_handling',
  'edge_cases',
  'permissions',
  'validation',
  'data_integrity',
  'performance',
  'ui_ux',
  'other',
] as const

export type GapCategory = (typeof GAP_CATEGORIES)[number]

export const CRITERION_STATUSES = ['full', 'partial', 'missing', 'needs_review'] as const

export type CriterionStatus = (typeof CRITERION_STATUSES)[number]

/** The two statuses that represent a gap, and so carry a taxonomy category. */
export type GapStatus = Extract<CriterionStatus, 'partial' | 'missing'>

/** A discrete, independently-checkable assertion pulled out of the requirement text. */
export interface ParsedCriterion {
  id: string
  text: string
  /** False for criteria that can't be judged from code ("should be fast", "intuitive UX"). */
  verifiable: boolean
}

/** A cited diff hunk backing a verdict. */
export interface EvidenceHunk {
  file: string
  lines: string
}

interface VerdictBase {
  reason: string
  /** Cited hunks, or 'none' when nothing in the diff addresses the criterion. */
  evidence: readonly EvidenceHunk[] | 'none'
  confidence: number
}

/** A partial/missing verdict. Always categorised — this is what feeds the aggregation. */
export interface GapVerdict extends VerdictBase {
  status: GapStatus
  category: GapCategory
}

/** A full/needs_review verdict. Not a gap, so there is no category to assign. */
export interface NonGapVerdict extends VerdictBase {
  status: Exclude<CriterionStatus, GapStatus>
  category: null
}

/**
 * Discriminated on `status`, so "a gap has a category" and "a non-gap has
 * none" are enforced by the type rather than by convention.
 */
export type CriterionVerdict = GapVerdict | NonGapVerdict

/** A criterion plus its verdict — one card in the report. */
export type EvaluatedCriterion = ParsedCriterion & CriterionVerdict

/**
 * Narrows to the categorised half of the union, so aggregation code reads
 * `.category` as a non-nullable GapCategory.
 *
 * Generic in the input so it also narrows an `EvaluatedCriterion` — the type
 * that actually flows through the pipeline — without dropping the criterion's
 * own `id`/`text`. A non-generic `(v: CriterionVerdict) => v is GapVerdict`
 * would silently fail to narrow in `evaluated.filter(isGap)`, because
 * `GapVerdict` is not a subtype of `EvaluatedCriterion`.
 */
export function isGap<T extends CriterionVerdict>(verdict: T): verdict is T & GapVerdict {
  return verdict.status === 'partial' || verdict.status === 'missing'
}

/** A category and how many gaps fell into it. The unit of the gaps dashboard. */
export interface CategoryCount {
  category: GapCategory
  count: number
}

/**
 * Precomputed counts for the report header, so the client renders the summary
 * from the payload instead of re-deriving it and drifting from the server.
 */
export interface AnalysisSummary {
  total: number
  /** Every status is present, zero included — the UI can render a fixed row. */
  byStatus: Record<CriterionStatus, number>
  /** Only categories that actually occurred, highest count first. */
  gapsByCategory: CategoryCount[]
}

/**
 * How much of the diff no criterion accounted for — the scope-creep proxy.
 *
 * Derived from evidence citations, not from a model call, so it costs nothing.
 * It is a **proxy, not a measurement**: a file cited for one hunk may contain
 * plenty besides, and refactors or generated files go uncited for innocent
 * reasons. Useful in aggregate across many analyses, not as a verdict on one.
 */
export interface ScopeSignal {
  changedFiles: number
  citedFiles: number
  /** Changed files that no verdict cited. Capped for payload size. */
  uncitedFiles: string[]
  /** uncited / changed, 0-1. Zero when the diff had no recognisable files. */
  uncitedRatio: number
}

/** One completed analysis — exactly what `POST /api/analyses` returns. */
export interface AnalysisReport {
  id: string
  createdAt: string
  requirementText: string
  /** The PR/MR URL when the diff was link-ingested, else null. */
  prReference: string | null
  summary: AnalysisSummary
  scope: ScopeSignal
  criteria: EvaluatedCriterion[]
}

/** A gap category with the numbers that distinguish "recurring" from "one bad PR". */
export interface CategoryStat {
  category: GapCategory
  /** Total gap occurrences. */
  count: number
  /** Distinct analyses it appeared in — recurrence, not volume. */
  analyses: number
  /** count / criterionCount, 0-1. */
  rate: number
}

/** A real gap, carrying the wording behind it so the narrator can cite it. */
export interface GapExample {
  category: GapCategory
  status: GapStatus
  criterionText: string
  reason: string
  requirementPreview: string
}

/**
 * A criterion the pipeline couldn't settle. The BA-facing signal: these are
 * the ones whose wording, not whose code, is the problem.
 */
export interface UnsettledCriterion {
  criterionText: string
  reason: string
  /** `not_verifiable` never reached the model; `needs_review` did and couldn't tell. */
  kind: 'not_verifiable' | 'needs_review'
  requirementPreview: string
}

/**
 * The factual substrate the dashboard renders and the narrator reads. Pure
 * counting over stored reports — no AI, no cost, numbers true by construction.
 *
 * Every field is built in a fixed order and every list is sorted with a stable
 * tie-break, so the same reports always serialise identically. The narrative
 * cache is keyed on a hash of this value, so that determinism is load-bearing:
 * a field whose order wobbles would silently bill for a fresh call on every
 * fetch.
 */
export interface InsightSubstrate {
  analysisCount: number
  criterionCount: number
  meanCriteriaPerAnalysis: number

  gapCount: number
  /** Share of criteria that came back partial or missing, 0-1. */
  gapRate: number
  /** Persistently partial (rather than missing) suggests criteria that bundle assertions. */
  partialCount: number
  missingCount: number

  /** Reached the model and couldn't be settled — the vague-wording signal. */
  needsReviewCount: number
  needsReviewRate: number
  /** Flagged unverifiable at parse time — subjective wording, never cost a call. */
  notVerifiableCount: number
  notVerifiableRate: number

  meanConfidence: number

  categories: CategoryStat[]

  /** Aggregate scope-creep proxy. See ScopeSignal for what it does and does not mean. */
  scope: {
    meanUncitedRatio: number
    /** Analyses where over half the changed files went uncited. */
    analysesOverHalfUncited: number
  }

  /** Sampled and capped, so one generation costs the same at 500 analyses as at 10. */
  gapExamples: GapExample[]
  unsettledCriteria: UnsettledCriterion[]
}

/**
 * One narrative card. `groundingStat` must quote a number that appears in the
 * substrate; `hypothesis` is explicitly a guess about cause. Split by audience
 * because "your criteria are unverifiable" and "you ship beyond scope" are
 * different conversations with different people.
 */
export interface NarrativeCard {
  audience: 'dev' | 'ba' | 'both'
  finding: string
  groundingStat: string
  hypothesis: string
  suggestedAction: string
  severity: 'low' | 'medium' | 'high'
}

/**
 * A generated narrative plus the substrate hash it was generated from. Serving
 * it back while the hash still matches is the whole cost-control mechanism.
 */
export interface InsightSnapshot {
  key: string
  cards: NarrativeCard[]
  generatedAt: string
  /** How many analyses the narrative covered, for display. */
  analysisCount: number
}
