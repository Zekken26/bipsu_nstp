import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { createTemplateBackup, parseTemplateBackup, validateProfileConfiguration, type ProfileExportConfiguration } from '../services/profileTemplates';

const configuration: ProfileExportConfiguration = {
  layout: 'classic', pageSize: 'a4', orientation: 'portrait',
  republicLine: 'Republic of the Philippines', schoolName: 'BiPSU', certificationLine: '',
  officeName: 'NSTP Office', formTitle: 'Student Profile', academicPeriod: 'AY 2026-2027',
  fieldHeader: 'Field', valueHeader: 'Value', accentColor: '#1d4ed8', leftCopyLabel: '',
  rightCopyLabel: '', studentSignatureLabel: 'Student signature',
  signatoryName: 'Dr. Reynold G. Bustillo', signatoryTitle: 'NSTP DIRECTOR', signatureSpacing: 48,
  fieldOrder: ['studentId', 'email'], showFieldBorders: true, repeatHeader: true,
};

describe('student profile layout backups', () => {
  it('round-trips a versioned strict backup', () => {
    const backup = createTemplateBackup(configuration, 'Official Student Profile');
    expect(parseTemplateBackup(backup)).toEqual({ templateName: 'Official Student Profile', configuration });
  });

  it('rejects unknown properties, malformed layouts, duplicate fields, and active content', () => {
    expect(() => validateProfileConfiguration({ ...configuration, script: '<script>alert(1)</script>' })).toThrow(/unsupported template property/i);
    expect(() => validateProfileConfiguration({ ...configuration, fieldOrder: ['email', 'email'] })).toThrow(/recognized and unique/i);
    expect(() => validateProfileConfiguration({ ...configuration, headerImageDataUrl: 'javascript:alert(1)' })).toThrow(/PNG or JPEG/i);
    expect(() => parseTemplateBackup({ ...createTemplateBackup(configuration), accessToken: 'must-not-import' })).toThrow(/unsupported backup property/i);
  });

  it('keeps official exports server-authoritative and uses the current director', async () => {
    const dashboard = await readFile(new URL('../features/admin/pages/AdminDashboard.tsx', import.meta.url), 'utf8');
    expect(dashboard).toContain("signatoryName: 'Dr. Reynold G. Bustillo'");
    expect(dashboard).toContain('activeProfileTemplate?.configuration || DEFAULT_FORM_TEMPLATE');
    expect(dashboard).not.toContain("localStorage.setItem(FORM_TEMPLATE_KEY");
  });
});
