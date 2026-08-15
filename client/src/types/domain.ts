/**
 * The domain vocabulary, mirroring `server/src/types.ts` field for field.
 *
 * This file is the contract. It is deliberately a straight mirror rather than a
 * convenient reshaping: every rename between the wire and the UI is a place the
 * two can drift silently, and the server already ships the shape the report
 * needs. Anything the client wants that the server does not send belongs in a
 * selector, not in a divergent type.
 */

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

/** A cited diff hunk backing a verdict — the audit trail behind a verdict. */
export interface EvidenceHunk {
  file: string
  lines: string
}

interface VerdictBase {
  id: string
  text: string
  /** False for criteria that can't be judged from code ("should be fast"). */
  verifiable: boolean
  reason: string
  /** Cited hunks, or the literal 'none' when nothing in the diff applies. */
  evidence: readonly EvidenceHunk[] | 'none'
  confidence: number
}

/** A partial/missing verdict. Always categorised — this is what feeds aggregation. */
export interface GapCriterion extends VerdictBase {
  status: GapStatus
  category: GapCategory
}

/** A full/needs_review verdict. Not a gap, so there is no category to assign. */
export interface NonGapCriterion extends VerdictBase {
  status: Exclude<CriterionStatus, GapStatus>
  category: null
}

/**
 * Discriminated on `status`, exactly as on the server, so "a gap has a
 * category" is enforced by the type rather than by a `?.` at every render site.
 */
export type EvaluatedCriterion = GapCriterion | NonGapCriterion

/** Narrows to the categorised half of the union. See the server's `isGap`. */
export function isGap(criterion: EvaluatedCriterion): criterion is GapCriterion {
  return criterion.status === 'partial' || criterion.status === 'missing'
}

export interface CategoryCount {
  category: GapCategory
  count: number
}

/**
 * Counts computed by the server. The client renders these rather than
 * recomputing them: two implementations of the same arithmetic is two chances
 * to disagree, and the header would be the one that looks wrong.
 */
export interface AnalysisSummary {
  total: number
  /** Every status present, zero included — the UI renders a fixed row. */
  byStatus: Record<CriterionStatus, number>
  /** Only categories that occurred, highest count first. */
  gapsByCategory: CategoryCount[]
}

/** How much of the diff no criterion accounted for — a proxy, not a verdict. */
export interface ScopeSignal {
  changedFiles: number
  citedFiles: number
  uncitedFiles: string[]
  /** uncited / changed, 0-1. */
  uncitedRatio: number
}

/** One completed analysis — exactly what `POST /api/analyses` returns. */
export interface AnalysisReport {
  id: string
  createdAt: string
  requirementText: string
  prReference: string | null
  summary: AnalysisSummary
  scope: ScopeSignal
  criteria: EvaluatedCriterion[]
}

export interface CategoryStat {
  category: GapCategory
  /** Total gap occurrences. */
  count: number
  /** Distinct analyses it appeared in — recurrence, not volume. */
  analyses: number
  /** count / criterionCount, 0-1. */
  rate: number
}

export interface GapExample {
  category: GapCategory
  status: GapStatus
  criterionText: string
  reason: string
  requirementPreview: string
}

/** A criterion the pipeline couldn't settle — the wording, not the code, is the problem. */
export interface UnsettledCriterion {
  criterionText: string
  reason: string
  kind: 'not_verifiable' | 'needs_review'
  requirementPreview: string
}

/** Pure counting over stored reports. Free to fetch, true by construction. */
export interface InsightSubstrate {
  analysisCount: number
  criterionCount: number
  meanCriteriaPerAnalysis: number

  gapCount: number
  /** Share of criteria that came back partial or missing, 0-1. */
  gapRate: number
  partialCount: number
  missingCount: number

  needsReviewCount: number
  needsReviewRate: number
  notVerifiableCount: number
  notVerifiableRate: number

  meanConfidence: number

  categories: CategoryStat[]

  scope: {
    meanUncitedRatio: number
    analysesOverHalfUncited: number
  }

  gapExamples: GapExample[]
  unsettledCriteria: UnsettledCriterion[]
}

export type NarrativeAudience = 'dev' | 'ba' | 'both'
export type NarrativeSeverity = 'low' | 'medium' | 'high'

export interface NarrativeCard {
  audience: NarrativeAudience
  finding: string
  /** Quotes a number that appears in the substrate. */
  groundingStat: string
  /** Explicitly a guess about cause. Rendered as such. */
  hypothesis: string
  suggestedAction: string
  severity: NarrativeSeverity
}
