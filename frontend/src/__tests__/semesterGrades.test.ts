import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { previewGradeConversion } from '../services/grades';

describe('semester grade workflow', () => {
  it('previews server-compatible BiPSU conversion from either input format', () => {
    expect(previewGradeConversion('PERCENT', 90)).toEqual({ percentEquivalent: '90%', numericalEquivalent: '1.5', classification: 'OUTSTANDING' });
    expect(previewGradeConversion('NUMERICAL', 1.3)).toEqual({ percentEquivalent: '92%', numericalEquivalent: '1.3', classification: 'OUTSTANDING' });
    expect(previewGradeConversion('PERCENT', 72)).toEqual({ percentEquivalent: '72%', numericalEquivalent: '3.1–4.0', classification: 'CONDITIONAL' });
    expect(previewGradeConversion('NUMERICAL', 3.5)).toEqual({ percentEquivalent: '71–74%', numericalEquivalent: '3.5', classification: 'CONDITIONAL' });
    expect(previewGradeConversion('NUMERICAL', 4.5)).toBeNull();
  });

  it('uses a dedicated Admin grade screen with two semester choices and explicit saving', async () => {
    const dashboard = await readFile(new URL('../features/admin/pages/AdminDashboard.tsx', import.meta.url), 'utf8');
    const grades = await readFile(new URL('../features/admin/components/AdminGradesView.tsx', import.meta.url), 'utf8');
    expect(dashboard).toContain('<AdminGradesView />');
    expect(grades).toContain("(['FIRST', 'SECOND'] as const)");
    expect(grades).toContain('Save Draft');
    expect(grades).toContain('Release');
    expect(grades).toContain('fetchAdminGradeRoster');
    expect(grades).toContain('Automatic conversion');
    expect(grades).toContain('gradeInput');
    expect(grades).not.toContain('prelim');
  });

  it('facilitator grade entry is server-backed and limited to semester drafts', async () => {
    const grades = await readFile(new URL('../features/facilitator/components/FacilitatorGradesView.tsx', import.meta.url), 'utf8');
    expect(grades).toContain('fetchInstructorGradeRoster');
    expect(grades).toContain('saveInstructorGrade');
    expect(grades).toContain('First Semester');
    expect(grades).toContain('Second Semester');
    expect(grades).not.toContain('Prelim');
  });

  it('student grade cards show only First and Second Semester records', async () => {
    const page = await readFile(new URL('../pages/GradesPage.tsx', import.meta.url), 'utf8');
    expect(page).toContain("grade.semester === 'FIRST'");
    expect(page).toContain("grade.semester === 'SECOND'");
    expect(page).toContain('Pending official release');
    expect(page).not.toContain('gradeRecord?.prelim');
  });
});
