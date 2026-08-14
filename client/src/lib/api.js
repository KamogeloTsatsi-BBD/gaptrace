const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message ?? 'The request could not be completed.');
  }
  return response.json();
}

export const analysesApi = {
  create: (payload, accessToken) => request('/analyses', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  }),
  getById: (id, accessToken) => request(`/analyses/${id}`, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  }),
  getInsights: (accessToken) => request('/insights', {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  }),
};
