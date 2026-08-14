import type { AnalysisReport, CreateAnalysisPayload, InsightsData } from '../types';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message = typeof body === 'object' && body !== null && 'message' in body && typeof body.message === 'string'
      ? body.message
      : 'The request could not be completed.';
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

function authorization(accessToken?: string): HeadersInit {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

export const analysesApi = {
  create: (payload: CreateAnalysisPayload, accessToken?: string) => request<AnalysisReport>('/analyses', {
    method: 'POST', body: JSON.stringify(payload), headers: authorization(accessToken),
  }),
  getById: (id: string, accessToken?: string) => request<AnalysisReport>(`/analyses/${id}`, { headers: authorization(accessToken) }),
  getInsights: (accessToken?: string) => request<InsightsData>('/insights', { headers: authorization(accessToken) }),
};
