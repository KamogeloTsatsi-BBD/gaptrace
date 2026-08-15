import { request } from './httpClient'
import type { AnalysisListResponse, CreateAnalysisRequest } from '../../types/api'
import type { AnalysisReport } from '../../types/domain'

/**
 * One module per API resource, each a thin typed wrapper over `request`. No
 * barrel re-export: importing `lib/api/analyses` must not drag the insights
 * module (and its types) into the same chunk.
 */

export function createAnalysis(
  body: CreateAnalysisRequest,
  options: { accessToken?: string; signal?: AbortSignal } = {},
): Promise<AnalysisReport> {
  return request<AnalysisReport>('/analyses', { method: 'POST', body, ...options })
}

export function listAnalyses(
  options: { limit?: number; accessToken?: string; signal?: AbortSignal } = {},
): Promise<AnalysisListResponse> {
  const { limit, ...rest } = options
  const query = limit === undefined ? '' : `?limit=${limit}`
  return request<AnalysisListResponse>(`/analyses${query}`, rest)
}

export function getAnalysis(
  id: string,
  options: { accessToken?: string; signal?: AbortSignal } = {},
): Promise<AnalysisReport> {
  return request<AnalysisReport>(`/analyses/${encodeURIComponent(id)}`, options)
}
