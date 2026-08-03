import { describe, expect, it } from 'vitest';
import {
  getAcademicYearStart,
  getCurrentAcademicYear,
  getCurrentSchoolYear,
  getSchoolYearOptions,
} from '../utils/academicYear';

describe('academic year calculation', () => {
  it('uses the previous calendar year from January through May', () => {
    const date = new Date(2026, 4, 31);
    expect(getAcademicYearStart(date)).toBe(2025);
    expect(getCurrentSchoolYear(date)).toBe('SY 2025-2026');
  });

  it('starts the new academic year in June', () => {
    const date = new Date(2026, 5, 1);
    expect(getAcademicYearStart(date)).toBe(2026);
    expect(getCurrentSchoolYear(date)).toBe('SY 2026-2027');
    expect(getCurrentAcademicYear(date)).toBe('2026-2027');
  });

  it('lists the active school year first and retains historical choices', () => {
    expect(getSchoolYearOptions(new Date(2026, 7, 3))).toEqual([
      'SY 2026-2027',
      'SY 2025-2026',
      'SY 2024-2025',
    ]);
  });
});
