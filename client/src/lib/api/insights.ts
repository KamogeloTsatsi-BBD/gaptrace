import { request } from './httpClient'
import type { InsightsResponse, NarrativeResponse } from '../../types/api'

/**
 * The two insight calls are split along the line that costs money, and the
 * client mirrors that split deliberately.
 *
 * `getInsights` is free: it counts stored reports and returns a cached
 * narrative if one already matches. It is safe to call on every page view.
 * `generateNarrative` is the one call that can bill, so it is only ever reached
 * from an explicit user action — never from an effect, never from a render.
 */

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
