import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { previewClassification } from '../services/grades';

describe('semester grade workflow', () => {
  it('previews the approved grading bands without accepting incompatible pairs', () => {
    expect(previewClassification(95, 1)).toBe('EXCELLENT');
    expect(previewClassification(92, 1.3)).toBe('OUTSTANDING');
    expect(previewClassification(75, 3)).toBe('POOR');
    expect(previewClassification(70, 5)).toBe('FAILED');
    expect(previewClassification(92, 2)).toBeNull();
  });

  it('uses a dedicated Admin grade screen with two semester choices and explicit saving', async () => {
    const dashboard = await readFile(new URL('../features/admin/pages/AdminDashboard.tsx', import.meta.url), 'utf8');
    const grades = await readFile(new URL('../features/admin/components/AdminGradesView.tsx', import.meta.url), 'utf8');
    expect(dashboard).toContain('<AdminGradesView />');
    expect(grades).toContain("(['FIRST', 'SECOND'] as const)");
    expect(grades).toContain('Save Draft');
    expect(grades).toContain('Release');
    expect(grades).toContain('fetchAdminGradeRoster');
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
