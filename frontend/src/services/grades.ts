import { apiGet, apiPatch, apiPost } from './apiClient';

export type AcademicSemester = 'FIRST' | 'SECOND';
export type GradeClassification = 'EXCELLENT' | 'OUTSTANDING' | 'VERY_GOOD' | 'GOOD' | 'FAIR' | 'POOR' | 'CONDITIONAL' | 'FAILED';

export type SemesterGrade = {
  id: string;
  studentId: string;
  componentId: string;
  schoolYear: string;
  semester: AcademicSemester;
  percentGrade: number;
  numericalGrade: number;
  classification: GradeClassification;
  remarks?: string | null;
  isReleased: boolean;
  releasedAt?: string | null;
  updatedAt: string;
  student?: { id: string; studentNumber: string; user: { name: string; email: string } };
  component?: { id: string; type: string; name: string };
};

type ApiEnvelope<T> = { success: boolean; data: T; meta?: { page: number; pageSize: number; total: number; totalPages: number } };
export type GradeDraft = Pick<SemesterGrade, 'studentId' | 'componentId' | 'schoolYear' | 'semester' | 'percentGrade' | 'numericalGrade'> & { remarks?: string };
export type GradeRosterRow = {
  student: {
    id: string; studentNumber: string; componentId?: string | null;
    user: { name: string; email: string };
    component?: { id: string; type: string; name: string } | null;
  };
  grade: SemesterGrade | null;
};

export async function fetchAdminGrades(filters: { schoolYear: string; semester: AcademicSemester; page?: number; pageSize?: number; search?: string }) {
  const params = new URLSearchParams({ schoolYear: filters.schoolYear, semester: filters.semester, page: String(filters.page || 1), pageSize: String(filters.pageSize || 100) });
  if (filters.search) params.set('search', filters.search);
  return apiGet<ApiEnvelope<SemesterGrade[]>>(`/nstp/admin/grades?${params.toString()}`);
}

export async function fetchAdminGradeRoster(filters: { schoolYear: string; semester: AcademicSemester; page: number; pageSize: number; search?: string }) {
  const params = new URLSearchParams({ schoolYear: filters.schoolYear, semester: filters.semester, page: String(filters.page), pageSize: String(filters.pageSize) });
  if (filters.search) params.set('search', filters.search);
  return apiGet<ApiEnvelope<GradeRosterRow[]>>(`/nstp/admin/grade-roster?${params.toString()}`);
}

export async function createAdminGrade(payload: GradeDraft) {
  return (await apiPost<ApiEnvelope<SemesterGrade>>('/nstp/admin/grades', payload)).data;
}

export async function updateAdminGrade(id: string, payload: Pick<GradeDraft, 'percentGrade' | 'numericalGrade' | 'remarks'>) {
  return (await apiPatch<ApiEnvelope<SemesterGrade>>(`/nstp/admin/grades/${encodeURIComponent(id)}`, payload)).data;
}

export async function setAdminGradeRelease(id: string, released: boolean) {
  return (await apiPost<ApiEnvelope<SemesterGrade>>(`/nstp/admin/grades/${encodeURIComponent(id)}/${released ? 'release' : 'hold'}`, {})).data;
}

export type InstructorClass = { id: string; code: string; name: string; schoolYear: string; semester: string; componentId: string };

export async function fetchInstructorClasses() {
  return (await apiGet<ApiEnvelope<InstructorClass[]>>('/nstp/instructors/classes')).data;
}

export async function fetchInstructorGradeRoster(classId: string, filters: { schoolYear: string; semester: AcademicSemester; page: number; pageSize: number; search?: string }) {
  const params = new URLSearchParams({ schoolYear: filters.schoolYear, semester: filters.semester, page: String(filters.page), pageSize: String(filters.pageSize) });
  if (filters.search) params.set('search', filters.search);
  return apiGet<ApiEnvelope<GradeRosterRow[]>>(`/nstp/instructors/classes/${encodeURIComponent(classId)}/grade-roster?${params.toString()}`);
}

export async function saveInstructorGrade(classId: string, payload: Omit<GradeDraft, 'componentId'>) {
  return (await apiPost<ApiEnvelope<SemesterGrade>>(`/nstp/instructors/classes/${encodeURIComponent(classId)}/grades`, payload)).data;
}

export function previewClassification(percentGrade: number, numericalGrade: number): GradeClassification | null {
  const bands: Array<[number, number, number, number, GradeClassification]> = [
    [95, 100, 1, 1, 'EXCELLENT'], [90, 94, 1.1, 1.5, 'OUTSTANDING'],
    [86, 89, 1.6, 1.9, 'VERY_GOOD'], [80, 85, 2, 2.5, 'GOOD'],
    [76, 79, 2.6, 2.9, 'FAIR'], [75, 75, 3, 3, 'POOR'],
    [71, 74, 3.1, 4, 'CONDITIONAL'], [0, 70, 5, 5, 'FAILED'],
  ];
  const match = bands.find(([minPercent, maxPercent, minNumerical, maxNumerical]) => (
    Number.isInteger(percentGrade) && percentGrade >= minPercent && percentGrade <= maxPercent
      && numericalGrade >= minNumerical && numericalGrade <= maxNumerical
      && Math.round(numericalGrade * 10) === numericalGrade * 10
  ));
  return match?.[4] || null;
}
