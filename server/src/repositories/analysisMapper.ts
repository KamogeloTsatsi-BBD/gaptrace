/** Row shapes ⇄ domain types. The only file that knows the database is snake_case. */
import { summariseCriteria } from '../lib/reportStats.js'
import type {
  AnalysisReport,
  CriterionStatus,
  EvaluatedCriterion,
  EvidenceHunk,
  GapCategory,
  ScopeSignal,
} from '../types.js'

export interface CriterionRow {
  analysis_id: number
  criterion_key: string
  position: number
  text: string
  verifiable: boolean
  status: CriterionStatus
  reason: string
  confidence: number
  category: GapCategory | null
  evidence: unknown
}

export interface AnalysisRow {
  id: number
  created_at: string
  requirement_text: string
  pr_reference: string | null
  scope: unknown
}

export const ANALYSIS_SELECT = 'id, created_at, requirement_text, pr_reference, scope'

export const CRITERION_SELECT =
  'analysis_id, criterion_key, position, text, verifiable, status, reason, confidence, category, evidence'

function toEvidence(value: unknown): readonly EvidenceHunk[] | 'none' {
  // NULL and [] both mean 'none'; the domain has no third state.
  if (value === null || value === undefined) return 'none'
  if (!Array.isArray(value) || value.length === 0) return 'none'
  return value as EvidenceHunk[]
}

function toCriterion(row: CriterionRow): EvaluatedCriterion {
  const base = {
    id: row.criterion_key,
    text: row.text,
    verifiable: row.verifiable,
    reason: row.reason,
    evidence: toEvidence(row.evidence),
    confidence: row.confidence,
  }

  // The cast is safe because `criteria_category_matches_status` enforces the
  // pairing in the database.
  if (row.status === 'partial' || row.status === 'missing') {
    return { ...base, status: row.status, category: row.category as GapCategory }
  }
  return { ...base, status: row.status, category: null }
}

export function toReport(row: AnalysisRow, criterionRows: readonly CriterionRow[]): AnalysisReport {
  // Sorted here rather than trusted from the query.
  const criteria = [...criterionRows].sort((a, b) => a.position - b.position).map(toCriterion)

  return {
    id: row.id,
    // Postgres returns a `+00:00` offset; the wire contract is ISO with `Z`.
    createdAt: new Date(row.created_at).toISOString(),
    requirementText: row.requirement_text,
    prReference: row.pr_reference,
    // Recomputed, never stored — one implementation of this arithmetic.
    summary: summariseCriteria(criteria),
    scope: row.scope as ScopeSignal,
    criteria,
  }
}
