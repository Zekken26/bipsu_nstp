import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { COMPONENT_TYPE_LABELS, SCOPE_COMPONENT_TYPES } from '../services/staff';

describe('coordinator program scope', () => {
  it('maps broad coordinator programs to the required specific components', () => {
    expect(SCOPE_COMPONENT_TYPES.CWTS).toEqual(['CWTS', 'CWTS_COAST_GUARD']);
    expect(SCOPE_COMPONENT_TYPES.MTS).toEqual(['MTS_ARMY', 'MTS_NAVY']);
    expect(SCOPE_COMPONENT_TYPES.LTS).toEqual(['LTS']);
    expect(COMPONENT_TYPE_LABELS.CWTS_COAST_GUARD).toBe('CWTS (Coast Guard)');
  });

  it('uses server-backed facilitator ownership instead of browser account storage', async () => {
    const dashboard = await readFile(new URL('../features/coordinator/pages/CoordinatorDashboard.tsx', import.meta.url), 'utf8');
    expect(dashboard).toContain('fetchMyFacilitators()');
    expect(dashboard).toContain('createMyFacilitator');
    expect(dashboard).not.toContain('loadAccounts()');
    expect(dashboard).not.toContain('saveAccounts(');
  });

  it('limits coordinator creation to CWTS, MTS, and LTS program choices', async () => {
    const dashboard = await readFile(new URL('../features/admin/pages/AdminDashboard.tsx', import.meta.url), 'utf8');
    expect(dashboard).toContain('<option value="CWTS">CWTS — manages CWTS and CWTS Coast Guard</option>');
    expect(dashboard).toContain('<option value="MTS">MTS — manages MTS Army and MTS Navy</option>');
    expect(dashboard).toContain('<option value="LTS">LTS — manages LTS</option>');
    expect(dashboard).toContain('fetchAdminCoordinators');
  });
});
