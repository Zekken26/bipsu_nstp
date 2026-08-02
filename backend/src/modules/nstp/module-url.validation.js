const IFRAME_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'www.youtube-nocookie.com', 'youtu.be']);
const EXTERNAL_URL_FIELDS = ['meetingLink', 'documentLink', 'resourceUrl', 'externalLink', 'downloadUrl'];
const IFRAME_URL_FIELDS = ['videoUrl', 'iframeUrl'];

function isSafeLocalDevelopmentUrl(url) {
  return process.env.NODE_ENV !== 'production'
    && url.protocol === 'http:'
    && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
}

function normalizeUrl(value, field, allowedHosts) {
  if (value === undefined || value === null || value === '') return '';
  if (typeof value !== 'string' || value.length > 2048) {
    const error = new Error(`${field} must be a valid URL.`);
    error.statusCode = 400;
    throw error;
  }

  let url;
  try {
    url = new URL(value.trim());
  } catch {
    const error = new Error(`${field} must be a valid URL.`);
    error.statusCode = 400;
    throw error;
  }

  const isHttps = url.protocol === 'https:';
  if ((!isHttps && !isSafeLocalDevelopmentUrl(url)) || url.username || url.password) {
    const error = new Error(`${field} must use HTTPS.`);
    error.statusCode = 400;
    throw error;
  }
  if (allowedHosts && !allowedHosts.has(url.hostname.toLowerCase())) {
    const error = new Error(`${field} host is not approved for embedding.`);
    error.statusCode = 400;
    throw error;
  }
  return url.toString();
}

function normalizeUrlFields(value) {
  const normalized = { ...value };
  for (const field of EXTERNAL_URL_FIELDS) {
    if (Object.hasOwn(normalized, field)) normalized[field] = normalizeUrl(normalized[field], field);
  }
  for (const field of IFRAME_URL_FIELDS) {
    if (Object.hasOwn(normalized, field)) normalized[field] = normalizeUrl(normalized[field], field, IFRAME_HOSTS);
  }
  return normalized;
}

export function normalizeModuleUrls(payload) {
  const normalized = normalizeUrlFields(payload);
  if (normalized.data && typeof normalized.data === 'object' && !Array.isArray(normalized.data)) {
    normalized.data = normalizeUrlFields(normalized.data);
  }
  return normalized;
}

export const approvedIframeHosts = [...IFRAME_HOSTS];
