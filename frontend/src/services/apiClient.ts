const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
const REQUEST_TIMEOUT_MS = Number(import.meta.env.VITE_REQUEST_TIMEOUT_MS || 25000);

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
    const user = JSON.parse(localStorage.getItem('nstpUser') || 'null');
    if (!user) return {};
    return {
      'x-user-id': String(user.id || ''),
      'x-user-role': String(user.role || ''),
      'x-user-component': String(user.component || user.preferredComponent || ''),
      'x-user-municipalities': Array.isArray(user.municipalities) ? user.municipalities.join(',') : '',
      'x-active-municipality': String(user.activeMunicipality || localStorage.getItem(`nstp-facilitator-municipality-scope-${user.id}`) || ''),
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
