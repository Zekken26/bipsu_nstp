import type { NstpAssessment, NstpRole } from '../data/nstpData';
import { apiDel, apiGet, apiPatch, apiPost } from './apiClient';

type ApiEnvelope<T> = { success: boolean; data: T };
type AssessmentManagerRole = Extract<NstpRole, 'admin' | 'coordinator' | 'facilitator'>;

function managementBase(role: AssessmentManagerRole) {
  if (role === 'coordinator') return '/nstp/coordinators/assessments';
  if (role === 'facilitator') return '/nstp/instructors/assessments';
  return '/nstp/admin/assessments';
}

export function assessmentPayload(assessment: NstpAssessment) {
  return {
    title: assessment.title.trim(),
    description: assessment.description.trim(),
    moduleId: assessment.moduleId || '',
    type: assessment.type,
    timeLimit: Number(assessment.timeLimit),
    passingScore: Number(assessment.passingScore),
    questionsToShow: Number(assessment.questionsToShow),
    status: assessment.status.toUpperCase(),
    questions: assessment.questions.map((question) => ({
      id: question.id,
      prompt: question.prompt.trim(),
      options: question.options.map((option) => option.trim()),
      correctIndex: Number(question.correctIndex),
    })),
    ...(assessment.ownerId ? { ownerId: assessment.ownerId } : {}),
  };
}

export async function fetchManagedAssessments(role: AssessmentManagerRole) {
  return apiGet<NstpAssessment[]>(managementBase(role));
}

export async function fetchStudentAssessments() {
  return apiGet<NstpAssessment[]>('/nstp/students/me/assessments');
}

export async function createManagedAssessment(role: AssessmentManagerRole, assessment: NstpAssessment) {
  const payload = { ...assessmentPayload(assessment), status: 'DRAFT' };
  return (await apiPost<ApiEnvelope<NstpAssessment>>(managementBase(role), payload)).data;
}

export async function updateManagedAssessment(role: AssessmentManagerRole, assessment: NstpAssessment) {
  return (await apiPatch<ApiEnvelope<NstpAssessment>>(`${managementBase(role)}/${encodeURIComponent(assessment.id)}`, assessmentPayload(assessment))).data;
}

export async function removeManagedAssessment(role: AssessmentManagerRole, id: string) {
  return (await apiDel<ApiEnvelope<{ id: string; archived: boolean }>>(`${managementBase(role)}/${encodeURIComponent(id)}`)).data;
}

export type AssessmentAttemptRow = {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  assessmentId: string;
  assessmentTitle: string;
  score: number;
  passed: boolean;
  manualStatus?: 'passed' | 'failed' | 'review';
  submittedAt: string;
};

export async function fetchAssessmentAttempts() {
  return apiGet<AssessmentAttemptRow[]>('/nstp/admin/assessment-attempts');
}

export async function overrideAssessmentAttempt(id: string, status: 'passed' | 'failed' | 'review', reason: string) {
  return apiPost<ApiEnvelope<{ id: string; status: string }>>(`/nstp/admin/assessment-attempts/${encodeURIComponent(id)}/override`, { status, reason });
}
