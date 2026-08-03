import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  loadModules,
  saveModules,
  setSessionUser,
  syncCollectionFromApi,
  type NstpModule,
} from '../data/nstpData';
import { createManagedModule, modulePayload, updateManagedModule } from '../services/modules';

const moduleRecord: NstpModule = {
  id: 'client-only-module',
  title: 'Client-only module',
  description: '',
  component: 'Common',
  hours: 3,
  difficulty: 'Beginner',
  documentLink: '',
  speaker: '',
  speakerPosition: '',
  scheduledDate: '',
  scheduledTime: '',
  updatedAt: '2026-08-03T00:00:00.000Z',
};

describe('server-authoritative module collection', () => {
  afterEach(() => {
    setSessionUser(null);
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('removes client-only modules when the database collection is empty', async () => {
    vi.stubGlobal('window', { dispatchEvent: vi.fn() });
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true, data: { upserted: 1 } }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 })));
    setSessionUser({ id: 'admin-1', role: 'admin' });

    await expect(saveModules([moduleRecord])).resolves.toBe(true);
    expect(loadModules()).toHaveLength(1);

    await syncCollectionFromApi('nstp-module-library');
    expect(loadModules()).toEqual([]);
  });

  it('rolls back a module that the database rejects', async () => {
    vi.stubGlobal('window', { dispatchEvent: vi.fn() });
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: 'Invalid module' }), { status: 400 })));
    setSessionUser({ id: 'admin-1', role: 'admin' });

    await syncCollectionFromApi('nstp-module-library');
    await expect(saveModules([moduleRecord])).resolves.toBe(false);
    expect(loadModules()).toEqual([]);
  });

  it('does not send a client-generated id when creating a module', async () => {
    expect(modulePayload(moduleRecord)).not.toHaveProperty('id');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      success: true,
      data: { ...moduleRecord, id: 'server-generated-id', status: 'DRAFT' },
    }), { status: 201 })));

    await expect(createManagedModule('admin', moduleRecord)).resolves.toMatchObject({ id: 'server-generated-id' });
    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect(JSON.parse(String(init?.body))).not.toHaveProperty('id');
  });

  it('uses PATCH for updates and keeps publication state server-backed', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      success: true,
      data: { ...moduleRecord, status: 'PUBLISHED', isPublished: true },
    }), { status: 200 })));

    await updateManagedModule('admin', { ...moduleRecord, status: 'PUBLISHED' });
    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toContain('/nstp/admin/modules/client-only-module');
    expect(init?.method).toBe('PATCH');
    expect(JSON.parse(String(init?.body))).toMatchObject({ status: 'PUBLISHED' });
  });
});
