const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const REQUEST_TIMEOUT = 15000;

function logApiError(method: string, path: string, error: unknown) {
  console.warn(`[apiClient] ${method} ${path} failed:`, error instanceof Error ? error.message : error);
}

function dispatchApiError(method: string, path: string, status: number) {
  window.dispatchEvent(new CustomEvent('api:error', { detail: { method, path, status } }));
}

function getAuthHeaders(): Record<string, string> {
  const raw = localStorage.getItem('nstpUser');
  if (!raw) return {};
  try {
    const user = JSON.parse(raw);
    if (user?.token) return { 'Authorization': `Bearer ${user.token}` };
  } catch { /* ignore */ }
  return {};
}

async function fetchWithTimeout(input: RequestInfo, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  try {
    const response = await fetch(input, { ...init, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function apiGet<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetchWithTimeout(`${API_BASE}${path}`, {
      headers: { ...getAuthHeaders() },
    });
    if (response.status === 401) {
      window.dispatchEvent(new CustomEvent('auth:expired'));
      return fallback;
    }
    if (!response.ok) {
      dispatchApiError('GET', path, response.status);
      return fallback;
    }
    return await response.json() as T;
  } catch (error) {
    logApiError('GET', path, error);
    return fallback;
  }
}

export async function apiDel<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetchWithTimeout(`${API_BASE}${path}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() },
    });
    if (response.status === 401) {
      window.dispatchEvent(new CustomEvent('auth:expired'));
      return fallback;
    }
    if (!response.ok) {
      dispatchApiError('DELETE', path, response.status);
      return fallback;
    }
    return await response.json() as T;
  } catch (error) {
    logApiError('DELETE', path, error);
    return fallback;
  }
}

export async function apiPost<T>(path: string, payload: unknown, fallback: T): Promise<T> {
  try {
    const response = await fetchWithTimeout(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(payload),
    });
    if (response.status === 401) {
      window.dispatchEvent(new CustomEvent('auth:expired'));
      return fallback;
    }
    if (!response.ok) {
      dispatchApiError('POST', path, response.status);
      return fallback;
    }
    return await response.json() as T;
  } catch (error) {
    logApiError('POST', path, error);
    return fallback;
  }
}
