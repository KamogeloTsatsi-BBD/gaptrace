import type { InsightsResponse } from '../types/api'

/** Demo-mode stand-in. `canNarrate: false` so no generate button is offered. */
export const exampleInsights: InsightsResponse = {
  substrate: {
    analysisCount: 6,
    criterionCount: 24,
    meanCriteriaPerAnalysis: 4,

    gapCount: 8,
    gapRate: 0.33,
    partialCount: 5,
    missingCount: 3,

    needsReviewCount: 3,
    needsReviewRate: 0.13,
    notVerifiableCount: 2,
    notVerifiableRate: 0.08,

    meanConfidence: 0.86,

    categories: [
      { category: 'validation', count: 4, analyses: 3, rate: 0.17 },
      { category: 'error_handling', count: 2, analyses: 2, rate: 0.08 },
      { category: 'permissions', count: 2, analyses: 2, rate: 0.08 },
    ],

    scope: { meanUncitedRatio: 0.42, analysesOverHalfUncited: 2 },

    gapExamples: [
      {
        category: 'validation',
        status: 'partial',
        criterionText: 'The email address is validated before a reset request.',
        reason: 'The endpoint checks for a present value, but does not validate format.',
        requirementPreview: 'Users can reset their password by email…',
      },
    ],

    unsettledCriteria: [
      {
        criterionText: 'The reset flow should feel fast.',
        reason: 'Subjective; no measurable assertion to check against the diff.',
        kind: 'not_verifiable',
        requirementPreview: 'Users can reset their password by email…',
      },
      {
        criterionText: 'Errors are handled appropriately.',
        reason: 'The criterion does not say which errors or what handling looks like.',
        kind: 'needs_review',
        requirementPreview: 'Users can reset their password by email…',
      },
    ],
  },

  narrative: {
    generatedAt: '2026-08-14T10:05:00Z',
    analysisCount: 6,
    cards: [
      {
        audience: 'ba',
        finding: 'Validation is the most recurring delivery gap.',
        groundingStat: '4 of 8 gaps are validation, across 3 of 6 analyses.',
        hypothesis:
          'Several criteria describe the successful outcome without stating what invalid input should do.',
        suggestedAction:
          'Add an explicit invalid-input example to acceptance criteria, and check for it in review.',
        severity: 'high',
      },
      {
        audience: 'both',
        finding: 'A fifth of criteria could not be judged from code.',
        groundingStat: '13% needed review and 8% were not verifiable from a diff.',
        hypothesis:
          'Wording like "appropriately" and "should feel fast" leaves nothing concrete to compare against.',
        suggestedAction:
          'Rewrite the two criteria listed above into assertions a diff can settle.',
        severity: 'medium',
      },
    ],
  },

  stale: false,
  canNarrate: false,
}
