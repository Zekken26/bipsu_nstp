import { afterEach, describe, expect, it, vi } from 'vitest';
import { createEmptyAssessment, type NstpAccount } from '../data/nstpData';
import { assessmentPayload, createManagedAssessment, fetchStudentAssessments } from '../services/assessments';

const admin: NstpAccount = {
  id: 'admin-1', name: 'Admin', email: 'admin@example.edu', password: '', role: 'admin',
};

describe('server-authoritative assessment integration', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('does not assign the obsolete m1 module id to a new assessment', () => {
    expect(createEmptyAssessment(admin).moduleId).toBe('');
  });

  it('sends the selected database module id and never sends a client assessment id', async () => {
    const assessment = { ...createEmptyAssessment(admin), id: 'client-id', moduleId: 'database-module-id' };
    expect(assessmentPayload(assessment)).toMatchObject({ moduleId: 'database-module-id' });
    expect(assessmentPayload(assessment)).not.toHaveProperty('id');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      success: true, data: { ...assessment, id: 'server-id', status: 'draft' },
    }), { status: 201 })));

    await expect(createManagedAssessment('admin', assessment)).resolves.toMatchObject({ id: 'server-id' });
    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect(JSON.parse(String(init?.body))).toMatchObject({ moduleId: 'database-module-id', status: 'DRAFT' });
    expect(JSON.parse(String(init?.body))).not.toHaveProperty('id');
  });

  it('loads the student library from the role-scoped endpoint', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify([]), { status: 200 })));
    await expect(fetchStudentAssessments()).resolves.toEqual([]);
    expect(vi.mocked(fetch).mock.calls[0][0]).toContain('/nstp/students/me/assessments');
  });
});
