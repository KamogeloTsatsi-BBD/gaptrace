/**
 * Wire shapes that are not domain objects: request bodies and the envelopes the
 * routes wrap domain objects in. Kept apart from `domain.ts` so the domain
 * mirror stays a clean reflection of the server's own types.
 */

import type { AnalysisSummary, InsightSubstrate, NarrativeCard } from './domain'

/** `POST /api/analyses` — exactly one of diffText/prUrl, enforced server-side. */
export type CreateAnalysisRequest = { requirementText: string } & (
  | { diffText: string; prUrl?: never }
  | { prUrl: string; diffText?: never }
)

/** A row from `GET /api/analyses` — summaries only, no verdicts. */
export interface AnalysisListItem {
  id: string
  createdAt: string
  prReference: string | null
  summary: AnalysisSummary
  requirementPreview: string
}

export interface AnalysisListResponse {
  analyses: AnalysisListItem[]
}

/** A generated narrative, minus the cache key the server treats as internal. */
export interface InsightNarrative {
  cards: NarrativeCard[]
  generatedAt: string
  analysisCount: number
}

/**
 * `GET /api/insights`. `stale` means the numbers moved since the last
 * narration, so the UI offers regeneration rather than spending on its own;
 * `canNarrate` is false when there is nothing yet to narrate.
 */
export interface InsightsResponse {
  substrate: InsightSubstrate
  narrative: InsightNarrative | null
  stale: boolean
  canNarrate: boolean
}

export interface NarrativeResponse {
  narrative: InsightNarrative
  cached: boolean
}

/** The one error envelope every route returns. */
export interface ApiErrorBody {
  error: {
    code: string
    message: string
  }
}

export type ApiErrorCode =
  | 'invalid_input'
  | 'source_unavailable'
  | 'not_found'
  | 'upstream_error'
  | 'internal_error'
  | 'network_error'
