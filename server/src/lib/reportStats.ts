/**
 * Pure counting over verdicts. No I/O, no AI — the numbers the UI shows and
 * the narrator quotes are true by construction.
 *
 * `summariseCriteria` is per-report, computed once at analysis time.
 * `buildSubstrate` is the cross-analysis read; when Supabase lands, its counting
 * half becomes SQL in a repository and the sampling half stays here. Its return
 * type is the contract the client and the narrator code against either way.
 *
 * Determinism is a requirement, not a nicety: the narrative cache is keyed on a
 * hash of the substrate, so every list below is sorted with a stable tie-break
 * and every float is rounded. A value that wobbled between identical inputs
 * would bill for a fresh model call on every fetch.
 */
import { CRITERION_STATUSES, isGap } from '../types.js'
import type {
  AnalysisReport,
  AnalysisSummary,
  CategoryCount,
  CategoryStat,
  CriterionStatus,
  EvaluatedCriterion,
  GapCategory,
  GapExample,
  InsightSubstrate,
  UnsettledCriterion,
} from '../types.js'

/**
 * Caps on what reaches the model. Cost per generation is bounded by these, not
 * by how much history has accumulated — one narration costs about the same at
 * 500 analyses as at 10.
 */
const GAP_EXAMPLES_PER_CATEGORY = 3
const MAX_UNSETTLED = 12

/** Enough of the requirement to recognise it; the narrator judges wording, not detail. */
const PREVIEW_CHARS = 180

function zeroedStatusCounts(): Record<CriterionStatus, number> {
  return Object.fromEntries(CRITERION_STATUSES.map((status) => [status, 0])) as Record<
    CriterionStatus,
    number
  >
}

/** Highest count first; ties broken by name so the order is stable per render. */
function rank(counts: Map<GapCategory, number>): CategoryCount[] {
  return [...counts]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category))
}

function ratio(part: number, whole: number): number {
  return whole === 0 ? 0 : round(part / whole)
}

/** Rounded so floating-point noise cannot change the cache key. */
function round(value: number): number {
  return Math.round(value * 1000) / 1000
}

function preview(text: string): string {
  const trimmed = text.trim()
  return trimmed.length > PREVIEW_CHARS
    ? `${trimmed.slice(0, PREVIEW_CHARS).trimEnd()}…`
    : trimmed
}

export function summariseCriteria(criteria: readonly EvaluatedCriterion[]): AnalysisSummary {
  const byStatus = zeroedStatusCounts()
  const categories = new Map<GapCategory, number>()

  for (const criterion of criteria) {
    byStatus[criterion.status] += 1
    if (isGap(criterion)) {
      categories.set(criterion.category, (categories.get(criterion.category) ?? 0) + 1)
    }
  }

  return { total: criteria.length, byStatus, gapsByCategory: rank(categories) }
}

/**
 * Cross-analysis substrate. Keeps the **wording** behind each signal, not just
 * counts — a narrator given only totals can say "validation gaps are common"
 * but cannot say "and these three criteria were too vague to check", which is
 * the observation that makes the dashboard worth reading.
 */
export function buildSubstrate(reports: readonly AnalysisReport[]): InsightSubstrate {
  const counts = new Map<GapCategory, number>()
  const analysesWithCategory = new Map<GapCategory, Set<string>>()
  const examplesByCategory = new Map<GapCategory, GapExample[]>()
  const unsettled: UnsettledCriterion[] = []

  let criterionCount = 0
  let gapCount = 0
  let partialCount = 0
  let missingCount = 0
  let needsReviewCount = 0
  let notVerifiableCount = 0
  let confidenceTotal = 0
  let uncitedRatioTotal = 0
  let analysesOverHalfUncited = 0

  for (const report of reports) {
    const requirementPreview = preview(report.requirementText)

    uncitedRatioTotal += report.scope.uncitedRatio
    if (report.scope.uncitedRatio > 0.5) analysesOverHalfUncited += 1

    for (const criterion of report.criteria) {
      criterionCount += 1
      confidenceTotal += criterion.confidence

      if (!criterion.verifiable) {
        notVerifiableCount += 1
      } else if (criterion.status === 'needs_review') {
        needsReviewCount += 1
      }

      // Both kinds are wording problems, but different ones: not_verifiable was
      // caught at parse time and cost nothing; needs_review survived to the
      // comparator and still couldn't be settled.
      if (!criterion.verifiable || criterion.status === 'needs_review') {
        unsettled.push({
          criterionText: criterion.text,
          reason: criterion.reason,
          kind: criterion.verifiable ? 'needs_review' : 'not_verifiable',
          requirementPreview,
        })
      }

      if (!isGap(criterion)) continue

      gapCount += 1
      if (criterion.status === 'partial') partialCount += 1
      else missingCount += 1

      const { category } = criterion
      counts.set(category, (counts.get(category) ?? 0) + 1)

      const seen = analysesWithCategory.get(category) ?? new Set<string>()
      seen.add(report.id)
      analysesWithCategory.set(category, seen)

      const examples = examplesByCategory.get(category) ?? []
      if (examples.length < GAP_EXAMPLES_PER_CATEGORY) {
        examples.push({
          category,
          status: criterion.status,
          criterionText: criterion.text,
          reason: criterion.reason,
          requirementPreview,
        })
        examplesByCategory.set(category, examples)
      }
    }
  }

  const categories: CategoryStat[] = rank(counts).map(({ category, count }) => ({
    category,
    count,
    analyses: analysesWithCategory.get(category)?.size ?? 0,
    rate: ratio(count, criterionCount),
  }))

  return {
    analysisCount: reports.length,
    criterionCount,
    meanCriteriaPerAnalysis: ratio(criterionCount, reports.length),

    gapCount,
    gapRate: ratio(gapCount, criterionCount),
    partialCount,
    missingCount,

    needsReviewCount,
    needsReviewRate: ratio(needsReviewCount, criterionCount),
    notVerifiableCount,
    notVerifiableRate: ratio(notVerifiableCount, criterionCount),

    meanConfidence: ratio(confidenceTotal, criterionCount),

    categories,

    scope: {
      meanUncitedRatio: ratio(uncitedRatioTotal, reports.length),
      analysesOverHalfUncited,
    },

    // Ordered by category so the sample is stable regardless of which analysis
    // happened to contribute first.
    gapExamples: categories.flatMap(({ category }) => examplesByCategory.get(category) ?? []),
    unsettledCriteria: unsettled.slice(0, MAX_UNSETTLED),
  }
}
