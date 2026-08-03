import { readFile } from 'node:fs/promises';
import { describe, expect, it, vi } from 'vitest';
import { ApiRequestError } from '../services/apiClient';
import {
  createRegistrationApprovalClient,
  getRegistrationApprovalErrorMessage,
  RegistrationApprovalInProgressError,
} from '../features/admin/services/registrationApproval';

describe('server-authoritative registration approval', () => {
  it('returns only a server-confirmed approval', async () => {
    const request = vi.fn().mockResolvedValue({ success: true, data: { id: 'user-1', email: 'student@example.edu' } });
    const client = createRegistrationApprovalClient(request);

    await expect(client.approve('pending-1')).resolves.toEqual({ id: 'user-1', email: 'student@example.edu' });
    expect(request).toHaveBeenCalledWith('/auth/admin/registrations/pending-1/approve', {});
  });

  it('propagates failures so pending UI state can be preserved and retried', async () => {
    const request = vi.fn()
      .mockRejectedValueOnce(new ApiRequestError(503, 'Service unavailable.'))
      .mockResolvedValueOnce({ success: true, data: { id: 'user-1', email: 'student@example.edu' } });
    const client = createRegistrationApprovalClient(request);

    await expect(client.approve('pending-1')).rejects.toMatchObject({ status: 503, retryable: true });
    expect(getRegistrationApprovalErrorMessage(new ApiRequestError(503, 'Service unavailable.'))).toContain('request remains pending');
    await expect(client.approve('pending-1')).resolves.toMatchObject({ id: 'user-1' });
  });

  it('blocks duplicate approval submissions while the first request is pending', async () => {
    let resolveRequest: ((value: { success: true; data: { id: string; email: string } }) => void) | undefined;
    const request = vi.fn(() => new Promise<{ success: true; data: { id: string; email: string } }>((resolve) => {
      resolveRequest = resolve;
    }));
    const client = createRegistrationApprovalClient(request);

    const firstApproval = client.approve('pending-1');
    await expect(client.approve('pending-1')).rejects.toBeInstanceOf(RegistrationApprovalInProgressError);
    expect(request).toHaveBeenCalledTimes(1);

    resolveRequest?.({ success: true, data: { id: 'user-1', email: 'student@example.edu' } });
    await expect(firstApproval).resolves.toMatchObject({ id: 'user-1' });
  });

  it('keeps password material and browser-only approval fallback out of Admin approval state', async () => {
    const dataSource = await readFile(new URL('../data/nstpData.ts', import.meta.url), 'utf8');
    const dashboardSource = await readFile(new URL('../features/admin/pages/AdminDashboard.tsx', import.meta.url), 'utf8');
    const facilitatorSource = await readFile(new URL('../features/facilitator/pages/FacilitatorDashboard.tsx', import.meta.url), 'utf8');
    const pendingType = dataSource.slice(dataSource.indexOf('export type PendingStudentRegistration'), dataSource.indexOf('export type NstpQuestion'));

    expect(pendingType).not.toContain('password:');
    expect(dashboardSource).not.toContain('Backend unreachable — will proceed with localStorage only');
    expect(dashboardSource).not.toContain('registration.password');
    expect(facilitatorSource).not.toContain('registration.password');
    expect(facilitatorSource).not.toContain('const approveRegistration');
  });
});
