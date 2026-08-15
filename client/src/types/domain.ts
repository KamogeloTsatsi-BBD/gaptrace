/** Mirrors `server/src/types.ts` field for field. Every rename is a silent drift. */

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

/** The two statuses that represent a gap, and so carry a category. */
export type GapStatus = Extract<CriterionStatus, 'partial' | 'missing'>

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
  evidence: readonly EvidenceHunk[] | 'none'
  confidence: number
}

export interface GapCriterion extends VerdictBase {
  status: GapStatus
  category: GapCategory
}

export interface NonGapCriterion extends VerdictBase {
  status: Exclude<CriterionStatus, GapStatus>
  category: null
}

/** Discriminated on `status`, so `.category` needs no `?.` at render sites. */
export type EvaluatedCriterion = GapCriterion | NonGapCriterion

/** Narrows to the categorised half of the union. */
export function isGap(criterion: EvaluatedCriterion): criterion is GapCriterion {
  return criterion.status === 'partial' || criterion.status === 'missing'
}

export interface CategoryCount {
  category: GapCategory
  count: number
}

/** Computed by the server. The client renders these rather than recounting. */
export interface AnalysisSummary {
  total: number
  /** Every status present, zero included. */
  byStatus: Record<CriterionStatus, number>
  /** Only categories that occurred, highest count first. */
  gapsByCategory: CategoryCount[]
}

/** How much of the diff no criterion accounted for — a proxy, not a verdict. */
export interface ScopeSignal {
  changedFiles: number
  citedFiles: number
  uncitedFiles: string[]
  uncitedRatio: number
}

/** One completed analysis — exactly what `POST /api/analyses` returns. */
export interface AnalysisReport {
  /** The database identity column, unlike `EvaluatedCriterion.id` (a string). */
  id: number
  createdAt: string
  requirementText: string
  prReference: string | null
  summary: AnalysisSummary
  scope: ScopeSignal
  criteria: EvaluatedCriterion[]
}

export interface CategoryStat {
  category: GapCategory
  count: number
  /** Distinct analyses it appeared in — recurrence, not volume. */
  analyses: number
  rate: number
}

export interface GapExample {
  category: GapCategory
  status: GapStatus
  criterionText: string
  reason: string
  requirementPreview: string
}

/** A criterion the pipeline couldn't settle — a wording problem, not a code one. */
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
  /** Quotes a real substrate number. */
  groundingStat: string
  /** A guess about cause, rendered as such. */
  hypothesis: string
  suggestedAction: string
  severity: NarrativeSeverity
}
