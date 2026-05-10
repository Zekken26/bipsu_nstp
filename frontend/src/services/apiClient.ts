const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export async function apiGet<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${path}`);
    if (!response.ok) throw new Error(`API ${response.status}`);
    return await response.json() as T;
  } catch {
    return fallback;
  }
}

export async function apiPost<T>(path: string, payload: unknown, fallback: T): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`API ${response.status}`);
    return await response.json() as T;
  } catch {
    return fallback;
  }
}
