/** Request bodies and route envelopes, kept apart so `domain.ts` stays a mirror. */

import type { AnalysisSummary, InsightSubstrate, NarrativeCard } from './domain'

/** `POST /api/analyses` — exactly one of diffText/prUrl, enforced server-side. */
export type CreateAnalysisRequest = { requirementText: string } & (
  | { diffText: string; prUrl?: never }
  | { prUrl: string; diffText?: never }
)

/** A row from `GET /api/analyses` — summaries only, no verdicts. */
export interface AnalysisListItem {
  id: number
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

/** `stale` means the numbers moved since the last narration. */
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
  | 'unauthorized'
  | 'source_unavailable'
  | 'not_found'
  | 'upstream_error'
  | 'internal_error'
  | 'network_error'

/**
 * A failure as the UI holds it. Lives here rather than beside the hook so a
 * component can be handed one without importing from the layer above it.
 */
export interface AnalysisFailure {
  message: string
  /** Stable server code, so the UI can offer the right recovery. */
  code: string
}
