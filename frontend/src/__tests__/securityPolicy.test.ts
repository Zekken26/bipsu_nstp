import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { toSafeEmbedUrl, toSafeExternalUrl } from '../utils/moduleUrls';

describe('service-worker and deployment security policy', () => {
  it('does not cache authenticated API traffic and clears obsolete API caches', async () => {
    const serviceWorker = await readFile(new URL('../../public/sw.js', import.meta.url), 'utf8');
    expect(serviceWorker).not.toContain('const API_CACHE =');
    expect(serviceWorker).toContain("request.credentials === 'omit'");
    expect(serviceWorker).toContain('clearSensitiveApiCaches');
    expect(serviceWorker).toContain("type === 'CLEAR_SENSITIVE_CACHES'");
    expect(serviceWorker).toContain('networkOnly(request)');
  });

  it('allows only explicit public API paths to be cached', async () => {
    const serviceWorker = await readFile(new URL('../../public/sw.js', import.meta.url), 'utf8');
    expect(serviceWorker).toContain("'/api/address/provinces'");
    expect(serviceWorker).toContain("'/api/address/municipalities'");
    expect(serviceWorker).toContain("'/api/address/barangays/search'");
    expect(serviceWorker).not.toContain("'/api/auth/");
  });

  it('requires Compose secrets and keeps PostgreSQL off the host network', async () => {
    const compose = await readFile(new URL('../../../docker-compose.yml', import.meta.url), 'utf8');
    for (const variable of ['POSTGRES_PASSWORD', 'JWT_SECRET', 'ADMIN_EMAIL', 'ADMIN_PASSWORD']) {
      expect(compose).toContain(`\${${variable}:?${variable} is required}`);
    }
    expect(compose).toContain('internal: true');
    const postgresService = compose.split('\n  backend:')[0];
    expect(postgresService).not.toContain('\n    ports:');
  });
});

describe('module URL rendering policy', () => {
  it('rejects unsafe external protocols and unapproved iframe hosts', () => {
    expect(toSafeExternalUrl('javascript:alert(1)')).toBeUndefined();
    expect(toSafeExternalUrl('data:text/html,alert(1)')).toBeUndefined();
    expect(toSafeEmbedUrl('https://attacker.example/embed')).toBeUndefined();
  });

  it('accepts approved HTTPS video hosts and normalizes embeds', () => {
    expect(toSafeEmbedUrl('https://youtu.be/approved-video')).toBe('https://www.youtube.com/embed/approved-video');
    expect(toSafeExternalUrl('https://drive.google.com/file/d/abc')).toBe('https://drive.google.com/file/d/abc');
  });

  it('uses restrictive iframe and external-link attributes', async () => {
    const modulesPage = await readFile(new URL('../pages/ModulesPage.tsx', import.meta.url), 'utf8');
    const generalEducation = await readFile(new URL('../features/enrollment/GeneralEducation.tsx', import.meta.url), 'utf8');
    for (const source of [modulesPage, generalEducation]) {
      expect(source).toContain('sandbox="allow-scripts allow-same-origin allow-presentation"');
      expect(source).toContain('referrerPolicy="no-referrer"');
      expect(source).toContain('rel="noopener noreferrer"');
    }
  });
});
