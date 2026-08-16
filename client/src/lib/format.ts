import type { ApiErrorCode } from '../types/api'
import type { CriterionStatus, GapCategory, NarrativeAudience, NarrativeSeverity } from '../types/domain'

/** `Record<Union, string>`, so extending the taxonomy fails the typecheck here. */

export const STATUS_LABELS: Readonly<Record<CriterionStatus, string>> = {
  full: 'Full',
  partial: 'Partial',
  missing: 'Missing',
  needs_review: 'Needs review',
}

export const CATEGORY_LABELS: Readonly<Record<GapCategory, string>> = {
  error_handling: 'Error handling',
  edge_cases: 'Edge cases',
  permissions: 'Permissions',
  validation: 'Validation',
  data_integrity: 'Data integrity',
  performance: 'Performance',
  ui_ux: 'UI / UX',
  other: 'Other',
}

export const SEVERITY_LABELS: Readonly<Record<NarrativeSeverity, string>> = {
  high: 'High priority',
  medium: 'Medium priority',
  low: 'Low priority',
}

export const AUDIENCE_LABELS: Readonly<Record<NarrativeAudience, string>> = {
  dev: 'For developers',
  ba: 'For analysts',
  both: 'For the whole team',
}

/**
 * The server's message says what went wrong; these say why it happened and what
 * to do about it. A bare instruction reads as a shrug when the reader cannot see
 * the reason for it.
 */
const RECOVERY_HINTS: Readonly<Record<ApiErrorCode, string>> = {
  invalid_input: 'Correct it on the previous step and run again.',
  unauthorized: 'Sign-in expired, sign in again.',
  source_unavailable: 'Private or missing PR, paste the diff instead.',
  not_found: 'Removed or not yours, so nothing to show.',
  upstream_error: 'The AI service faltered, not your input. Run it again.',
  internal_error: 'A fault on our side, so the same submission may work.',
  network_error: 'Server never reached, check your connection.',
}

/**
 * Falls back rather than narrowing: an unrecognised code is a server that has
 * grown one, and the user still deserves a next step.
 */
export function recoveryHint(code: string): string {
  return RECOVERY_HINTS[code as ApiErrorCode] ?? 'Try again, or start a new analysis.'
}

// Constructed once: `new Intl.DateTimeFormat()` per render costs measurably in a list.
const dateTimeFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function formatDateTime(isoString: string): string {
  const value = new Date(isoString)
  return Number.isNaN(value.getTime()) ? 'an unknown time' : dateTimeFormat.format(value)
}

/** Server rates are 0-1 throughout; the UI shows whole percentages. */
export function formatRate(rate: number): string {
  return `${Math.round(rate * 100)}%`
}
