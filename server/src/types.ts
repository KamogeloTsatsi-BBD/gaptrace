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

export interface ParsedCriterion {
  id: string
  text: string
  /** False for criteria that can't be judged from code ("should be fast"). */
  verifiable: boolean
}

export interface EvidenceHunk {
  file: string
  lines: string
}

interface VerdictBase {
  reason: string
  evidence: readonly EvidenceHunk[] | 'none'
  confidence: number
}

export interface GapVerdict extends VerdictBase {
  status: GapStatus
  category: GapCategory
}

export interface NonGapVerdict extends VerdictBase {
  status: Exclude<CriterionStatus, GapStatus>
  category: null
}

/** Discriminated on `status`, so the category pairing is enforced by the type. */
export type CriterionVerdict = GapVerdict | NonGapVerdict

export type EvaluatedCriterion = ParsedCriterion & CriterionVerdict

// Generic so it also narrows an `EvaluatedCriterion`: a non-generic
// `(v: CriterionVerdict) => v is GapVerdict` silently fails in `.filter(isGap)`.
export function isGap<T extends CriterionVerdict>(verdict: T): verdict is T & GapVerdict {
  return verdict.status === 'partial' || verdict.status === 'missing'
}

export interface CategoryCount {
  category: GapCategory
  count: number
}

export interface AnalysisSummary {
  total: number
  /** Every status is present, zero included. */
  byStatus: Record<CriterionStatus, number>
  /** Only categories that occurred, highest count first. */
  gapsByCategory: CategoryCount[]
}

/** A scope-creep proxy, meaningful in aggregate and not as a verdict on one PR. */
export interface ScopeSignal {
  changedFiles: number
  citedFiles: number
  uncitedFiles: string[]
  /** uncited / changed, 0-1. */
  uncitedRatio: number
}

export interface AnalysisReport {
  /** The database identity column, unlike `ParsedCriterion.id` (a string). */
  id: number
  createdAt: string
  requirementText: string
  /** The PR/MR URL when the diff was link-ingested, else null. */
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

/** Carries the wording behind a gap, so the narrator can cite it. */
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
  /** `not_verifiable` never reached the model; `needs_review` did and couldn't tell. */
  kind: 'not_verifiable' | 'needs_review'
  requirementPreview: string
}

/** Stably ordered throughout: the narrative cache is keyed on a hash of it. */
export interface InsightSubstrate {
  analysisCount: number
  criterionCount: number
  meanCriteriaPerAnalysis: number

  gapCount: number
  gapRate: number
  partialCount: number
  missingCount: number

  /** Reached the model and couldn't be settled — the vague-wording signal. */
  needsReviewCount: number
  needsReviewRate: number
  /** Flagged unverifiable at parse time, so never cost a call. */
  notVerifiableCount: number
  notVerifiableRate: number

  meanConfidence: number

  categories: CategoryStat[]

  scope: {
    meanUncitedRatio: number
    analysesOverHalfUncited: number
  }

  /** Sampled and capped, so one generation costs the same at 500 analyses as at 10. */
  gapExamples: GapExample[]
  unsettledCriteria: UnsettledCriterion[]
}

/** `groundingStat` quotes a real substrate number; `hypothesis` is a guess. */
export interface NarrativeCard {
  audience: 'dev' | 'ba' | 'both'
  finding: string
  groundingStat: string
  hypothesis: string
  suggestedAction: string
  severity: 'low' | 'medium' | 'high'
}

/** A narrative plus the substrate hash it came from — the whole cache mechanism. */
export interface InsightSnapshot {
  key: string
  cards: NarrativeCard[]
  generatedAt: string
  analysisCount: number
}
