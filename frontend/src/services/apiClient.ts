const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

const REQUEST_TIMEOUT = 15000;

function logApiError(method: string, path: string, error: unknown) {
  console.warn(`[apiClient] ${method} ${path} failed:`, error instanceof Error ? error.message : error);
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

async function fetchWithRetry(input: RequestInfo, init: RequestInit = {}, retries = 3): Promise<Response> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fetchWithTimeout(input, init);
    } catch (error) {
      if (attempt === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }
  throw new Error('fetchWithRetry exhausted');
}

async function parseErrorResponse<T>(response: Response, fallback: T): Promise<T> {
  try {
    const body = await response.json();
    return body as T;
  } catch {
    return fallback;
  }
}

export async function apiPut<T>(path: string, payload: unknown, fallback: T): Promise<T> {
  try {
    const response = await fetchWithRetry(`${API_BASE}${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      return parseErrorResponse(response, fallback);
    }
    return await response.json() as T;
  } catch (error) {
    logApiError('PUT', path, error);
    return fallback;
  }
}

export async function apiGet<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetchWithRetry(`${API_BASE}${path}`, {
      headers: { ...getAuthHeaders() },
    });
    if (!response.ok) {
      return parseErrorResponse(response, fallback);
    }
    return await response.json() as T;
  } catch (error) {
    logApiError('GET', path, error);
    return fallback;
  }
}

export async function apiDel<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetchWithRetry(`${API_BASE}${path}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() },
    });
    if (!response.ok) {
      return parseErrorResponse(response, fallback);
    }
    return await response.json() as T;
  } catch (error) {
    logApiError('DELETE', path, error);
    return fallback;
  }
}

export async function apiPost<T>(path: string, payload: unknown, fallback: T): Promise<T> {
  try {
    const response = await fetchWithRetry(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      return parseErrorResponse(response, fallback);
    }
    return await response.json() as T;
  } catch (error) {
    logApiError('POST', path, error);
    return fallback;
  }
}
