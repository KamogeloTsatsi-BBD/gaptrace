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
