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

/** The comparator's verdict for one criterion. */
export interface CriterionVerdict {
  status: CriterionStatus
  reason: string
  /** Cited hunks, or 'none' when nothing in the diff addresses the criterion. */
  evidence: EvidenceHunk[] | 'none'
  confidence: number
  /** Only populated for partial/missing; null otherwise. */
  category: GapCategory | null
}

/** A criterion plus its verdict — one card in the report. */
export type EvaluatedCriterion = ParsedCriterion & CriterionVerdict
