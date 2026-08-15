import type { AnalysisReport } from '../types/domain'

/** Typed as the real contract, so a stale example fails the typecheck. */
export const exampleReport: AnalysisReport = {
  id: 1,
  createdAt: '2026-08-14T09:30:00Z',
  prReference: 'https://github.com/acme/portal/pull/184',
  requirementText:
    'Users can reset their password by email. Validate the email address and rate-limit reset requests.',
  summary: {
    total: 3,
    byStatus: { full: 1, partial: 1, missing: 1, needs_review: 0 },
    gapsByCategory: [
      { category: 'validation', count: 1 },
      { category: 'error_handling', count: 1 },
    ],
  },
  scope: {
    changedFiles: 4,
    citedFiles: 1,
    uncitedFiles: ['src/lib/mailer.ts', 'src/routes/index.ts', 'test/passwordReset.test.ts'],
    uncitedRatio: 0.75,
  },
  criteria: [
    {
      id: '1',
      text: 'Users can reset their password by email.',
      verifiable: true,
      status: 'full',
      reason: 'The reset request endpoint generates a token and sends an email.',
      evidence: [{ file: 'src/routes/passwordReset.ts', lines: '18-56' }],
      confidence: 0.93,
      category: null,
    },
    {
      id: '2',
      text: 'The email address is validated before a reset request.',
      verifiable: true,
      status: 'partial',
      reason: 'The endpoint checks for a present value, but does not validate email format.',
      evidence: [{ file: 'src/routes/passwordReset.ts', lines: '21-25' }],
      confidence: 0.88,
      category: 'validation',
    },
    {
      id: '3',
      text: 'Password-reset requests are rate-limited.',
      verifiable: true,
      status: 'missing',
      reason: 'No rate-limit middleware or throttling logic appears in the supplied diff.',
      evidence: 'none',
      confidence: 0.91,
      category: 'error_handling',
    },
  ],
}
