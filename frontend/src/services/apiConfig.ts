const LOCAL_API_BASE = '/api';

/** Resolves the API at startup; Vite's proxy is development-only. */
export function getApiBaseUrl(value = import.meta.env.VITE_API_BASE_URL, production = import.meta.env.PROD): string {
  if (!value) {
    if (production) throw new Error('VITE_API_BASE_URL is required for production. Set it to the public HTTPS backend URL ending in /api.');
    return LOCAL_API_BASE;
  }
  const apiBase = value.replace(/\/$/, '');
  if (!production && apiBase === LOCAL_API_BASE) return apiBase;
  let url: URL;
  try { url = new URL(apiBase); } catch { throw new Error('VITE_API_BASE_URL must be an absolute URL ending in /api in production.'); }
  if (production && (url.protocol !== 'https:' || ['localhost', '127.0.0.1'].includes(url.hostname) || !url.pathname.endsWith('/api'))) {
    throw new Error('VITE_API_BASE_URL must be a public HTTPS backend URL ending in /api; localhost and relative URLs are not valid in production.');
  }
  return apiBase;
}

export const API_BASE = getApiBaseUrl();
