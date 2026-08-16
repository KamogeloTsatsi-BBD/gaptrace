import { request } from "./httpClient";
import type {
  AnalysisListResponse,
  CreateAnalysisRequest,
} from "../../types/api";
import type { AnalysisReport } from "../../types/domain";

/** One module per resource. No barrel — it would undo the insights code-split. */

export function createAnalysis(
  body: CreateAnalysisRequest,
  options: { accessToken?: string; signal?: AbortSignal } = {},
): Promise<AnalysisReport> {
  return request<AnalysisReport>("/analyses", {
    method: "POST",
    body,
    ...options,
  });
}

export function listAnalyses(
  options: { limit?: number; accessToken?: string; signal?: AbortSignal } = {},
): Promise<AnalysisListResponse> {
  const { limit, ...rest } = options;
  const query = limit === undefined ? "" : `?limit=${limit}`;
  return request<AnalysisListResponse>(`/analyses${query}`, rest);
}

export function getAnalysis(
  id: number,
  options: { accessToken?: string; signal?: AbortSignal } = {},
): Promise<AnalysisReport> {
  return request<AnalysisReport>(`/analyses/${id}`, options);
}
