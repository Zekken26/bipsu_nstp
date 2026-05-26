import type { MaterialCategory } from '../data/learningMaterials';

const DRIVE_HOSTS = new Set(['drive.google.com', 'docs.google.com']);
const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be']);

export function validatedMaterialUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' || url.protocol === 'http:' ? url : null;
  } catch {
    return null;
  }
}

export function detectLinkType(value: string): MaterialCategory {
  const url = validatedMaterialUrl(value);
  if (!url) return 'Web Resource';
  const host = url.hostname.toLowerCase();
  if (YOUTUBE_HOSTS.has(host)) return 'YouTube Video';
  if (DRIVE_HOSTS.has(host)) {
    const title = `${url.pathname} ${url.search}`.toLowerCase();
    return title.includes('video') || title.includes('.mp4') ? 'Google Drive Video' : 'Google Drive Document';
  }
  if (url.pathname.toLowerCase().endsWith('.pdf') || url.search.toLowerCase().includes('.pdf')) return 'PDF / Document';
  return 'Web Resource';
}

export function convertYouTubeToEmbed(value: string) {
  const url = validatedMaterialUrl(value);
  if (!url || !YOUTUBE_HOSTS.has(url.hostname.toLowerCase())) return null;
  const path = url.pathname.split('/').filter(Boolean);
  const id = url.hostname.toLowerCase() === 'youtu.be'
    ? path[0]
    : url.pathname === '/watch'
      ? url.searchParams.get('v')
      : ['embed', 'shorts'].includes(path[0] || '')
        ? path[1]
        : null;
  return id && /^[A-Za-z0-9_-]{6,20}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
}

function googleDriveId(url: URL) {
  const match = url.pathname.match(/\/d\/([A-Za-z0-9_-]+)/);
  return match?.[1] || url.searchParams.get('id');
}

export function convertGoogleDriveToPreview(value: string) {
  const url = validatedMaterialUrl(value);
  if (!url || !DRIVE_HOSTS.has(url.hostname.toLowerCase())) return null;
  const id = googleDriveId(url);
  if (!id || !/^[A-Za-z0-9_-]+$/.test(id)) return null;
  const source = url.pathname.includes('/document/') ? 'document' : url.pathname.includes('/presentation/') ? 'presentation' : url.pathname.includes('/spreadsheets/') ? 'spreadsheets' : 'file';
  return source === 'file' ? `https://drive.google.com/file/d/${id}/preview` : `https://docs.google.com/${source}/d/${id}/preview`;
}

export function embeddedMaterialUrl(value: string, category: MaterialCategory) {
  if (category === 'YouTube Video') return convertYouTubeToEmbed(value);
  if (category === 'Google Drive Video' || category === 'Google Drive Document') return convertGoogleDriveToPreview(value);
  if (category === 'PDF / Document') {
    const url = validatedMaterialUrl(value);
    return url?.protocol === 'https:' ? url.toString() : null;
  }
  return null;
}

export function isEmbeddableLink(value: string, category: MaterialCategory) {
  return Boolean(embeddedMaterialUrl(value, category));
}
