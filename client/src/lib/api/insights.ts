import { request } from './httpClient'
import type { InsightsResponse, NarrativeResponse } from '../../types/api'

/** `getInsights` is free; `generateNarrative` bills and needs a user action. */

export function getInsights(
  options: { accessToken?: string; signal?: AbortSignal } = {},
): Promise<InsightsResponse> {
  return request<InsightsResponse>('/insights', options)
}

export function generateNarrative(
  options: { accessToken?: string; signal?: AbortSignal } = {},
): Promise<NarrativeResponse> {
  return request<NarrativeResponse>('/insights/narrative', { method: 'POST', ...options })
}
