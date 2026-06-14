const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
const REQUEST_TIMEOUT_MS = Number(import.meta.env.VITE_REQUEST_TIMEOUT_MS || 25000);
const AUTH_TOKEN_KEY = 'nstpAuthToken';

const inFlightMutations = new Map<string, Promise<unknown>>();

export class ApiClientError extends Error {
  status: number;
  code?: string;
  retryAfterSeconds?: number;

  constructor(message: string, status: number, code?: string, retryAfterSeconds?: number) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

function authScopeHeaders() {
  try {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const user = JSON.parse(localStorage.getItem('nstpUser') || 'null');
    if (!user && !token) return {};
    return {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'x-user-id': String(user?.id || ''),
      'x-user-role': String(user?.role || ''),
      'x-user-component': String(user?.component || user?.preferredComponent || ''),
      'x-user-municipalities': Array.isArray(user?.municipalities) ? user.municipalities.join(',') : '',
      'x-active-municipality': String(user?.activeMunicipality || (user?.id ? localStorage.getItem(`nstp-facilitator-municipality-scope-${user.id}`) : '') || ''),
    };
  } catch {
    return {};
  }
}

function timeoutSignal(timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  return { controller, clear: () => window.clearTimeout(timer) };
}

async function readError(response: Response) {
  const retryAfter = Number(response.headers.get('Retry-After') || 0) || undefined;
  try {
    const body = await response.json();
    return new ApiClientError(
      body.error || `API ${response.status}`,
      response.status,
      body.code,
      body.retryAfterSeconds || retryAfter
    );
  } catch {
    return new ApiClientError(`API ${response.status}`, response.status, undefined, retryAfter);
  }
}

function userFriendlyError(error: unknown) {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return 'The request took too long. Please retry in a moment.';
  }
  if (error instanceof ApiClientError) {
    if (error.status === 429) {
      return error.retryAfterSeconds
        ? `Too many requests. Try again in ${error.retryAfterSeconds} seconds.`
        : 'Too many requests. Please wait and try again.';
    }
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}

export function apiErrorMessage(error: unknown) {
  return userFriendlyError(error);
}

export function saveAuthSession(token: string, user: unknown) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem('nstpUser', JSON.stringify(user));
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { controller, clear } = timeoutSignal();
  try {
    const headers = {
      ...authScopeHeaders(),
      ...(options.headers || {}),
    };
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    if (!response.ok) throw await readError(response);
    return await response.json() as T;
  } finally {
    clear();
  }
}

export async function apiGet<T>(path: string, fallback: T): Promise<T> {
  const { controller, clear } = timeoutSignal();
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: authScopeHeaders(),
      signal: controller.signal,
    });
    if (!response.ok) throw await readError(response);
    return await response.json() as T;
  } catch {
    return fallback;
  } finally {
    clear();
  }
}

export async function apiPost<T>(path: string, payload: unknown, fallback: T): Promise<T> {
  const mutationKey = `${path}:${JSON.stringify(payload)}`;
  const existing = inFlightMutations.get(mutationKey);
  if (existing) return existing as Promise<T>;

  const request = (async () => {
    const { controller, clear } = timeoutSignal();
    try {
      const response = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': crypto.randomUUID(),
          ...authScopeHeaders(),
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      if (!response.ok) throw await readError(response);
      return await response.json() as T;
    } catch {
      return fallback;
    } finally {
      clear();
      inFlightMutations.delete(mutationKey);
    }
  })();

  inFlightMutations.set(mutationKey, request);
  return request;
}

function filenameFromDisposition(disposition: string | null, fallback: string) {
  const match = disposition?.match(/filename="?([^"]+)"?/i);
  return match?.[1] || fallback;
}

export async function apiDownload(path: string, fallbackFilename = 'NSTP_Export.csv') {
  const { controller, clear } = timeoutSignal(60000);
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: authScopeHeaders(),
      signal: controller.signal,
    });
    if (!response.ok) throw await readError(response);
    const blob = await response.blob();
    const filename = filenameFromDisposition(response.headers.get('Content-Disposition'), fallbackFilename);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return {
      filename,
      rows: Number(response.headers.get('X-NSTP-Export-Rows') || 0),
      scope: response.headers.get('X-NSTP-Export-Scope') || '',
    };
  } finally {
    clear();
  }
}
