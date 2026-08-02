import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiGet, apiPost } from '../services/apiClient';

describe('cookie-based API client', () => {
  afterEach(() => vi.restoreAllMocks());

  it('sends credentials and does not build an Authorization header', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await apiGet('/auth/me', { ok: false });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.credentials).toBe('include');
    expect(init.headers.Authorization).toBeUndefined();
  });

  it('treats non-2xx responses as typed failures instead of fallback success data', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'Conflict' }), { status: 409 })));
    await expect(apiPost('/nstp/admin/grades', { id: 'grade-1' }, { id: 'fallback' })).rejects.toMatchObject({
      name: 'ApiRequestError', status: 409, retryable: false,
    });
  });
});
