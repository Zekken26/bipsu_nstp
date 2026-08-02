const IFRAME_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'www.youtube-nocookie.com', 'youtu.be']);

function parseSafeHttpsUrl(value?: string): URL | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url : null;
  } catch {
    return null;
  }
}

export function toSafeExternalUrl(value?: string): string | undefined {
  return parseSafeHttpsUrl(value)?.toString();
}

export function toSafeEmbedUrl(value?: string): string | undefined {
  const url = parseSafeHttpsUrl(value);
  if (!url || !IFRAME_HOSTS.has(url.hostname.toLowerCase())) return undefined;

  if (url.hostname === 'youtu.be') {
    const videoId = url.pathname.split('/').filter(Boolean)[0];
    return videoId ? `https://www.youtube.com/embed/${encodeURIComponent(videoId)}` : undefined;
  }
  if (url.pathname === '/watch') {
    const videoId = url.searchParams.get('v');
    return videoId ? `https://www.youtube.com/embed/${encodeURIComponent(videoId)}` : undefined;
  }
  if (url.pathname.startsWith('/embed/')) return url.toString();
  return undefined;
}
