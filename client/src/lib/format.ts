import type { CriterionStatus, GapCategory, NarrativeAudience, NarrativeSeverity } from '../types/domain'

/**
 * Every user-facing string derived from a domain value lives here, so a label
 * is written once and the components stay presentation-only.
 *
 * The lookups are `Record<Union, string>` rather than a function with a
 * `default` branch: adding a status or a category to the taxonomy then fails
 * the typecheck here instead of silently rendering a raw enum in the UI.
 */

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

// Constructed once. `new Intl.DateTimeFormat()` per render is a measurable cost
// in a list, and this one has no per-call configuration to vary.
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
