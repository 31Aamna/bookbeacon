const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || '';

export function isApiMode() {
  return String(import.meta.env.VITE_DATA_MODE || 'mock').toLowerCase() === 'api';
}

export class ApiError extends Error {
  constructor(message, status = 0, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

function getStoredToken() {
  try {
    return JSON.parse(localStorage.getItem('bookbeacon.session') || '{}').token || '';
  } catch {
    return '';
  }
}

export async function apiRequest(path, { method = 'GET', body, headers = {}, signal } = {}) {
  if (!API_BASE_URL) {
    throw new ApiError('API mode is enabled, but VITE_API_BASE_URL is not configured. Set it to the Flask API base URL and reload.');
  }
  const requestHeaders = { Accept: 'application/json', ...headers };
  if (body !== undefined) requestHeaders['Content-Type'] = 'application/json';
  const token = getStoredToken();
  if (token) requestHeaders.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`, {
      method,
      headers: requestHeaders,
      credentials: 'include',
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError(`Could not reach the Flask API at ${API_BASE_URL}. Check that the backend is running and reachable.`, 0, error);
  }

  const text = await response.text();
  let payload = null;
  if (text) {
    try { payload = JSON.parse(text); } catch { payload = { message: text }; }
  }
  if (!response.ok) {
    throw new ApiError(payload?.message || payload?.error || `The API request failed with status ${response.status}.`, response.status, payload);
  }
  return payload?.data ?? payload;
}
