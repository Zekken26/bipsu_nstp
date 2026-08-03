import type { NstpModule, NstpRole } from '../data/nstpData';
import { apiDel, apiGet, apiPatch, apiPost } from './apiClient';

type ModuleEditorRole = Extract<NstpRole, 'admin' | 'coordinator'>;
type ModuleReaderRole = NstpRole;
type ApiEnvelope<T> = { success: boolean; data: T };

function managementBase(role: ModuleEditorRole) {
  return role === 'coordinator' ? '/nstp/coordinators/modules' : '/nstp/admin/modules';
}

function readerBase(role: ModuleReaderRole) {
  if (role === 'admin') return '/nstp/admin/modules';
  if (role === 'coordinator') return '/nstp/coordinators/modules';
  if (role === 'facilitator') return '/nstp/instructors/modules';
  return '/nstp/students/me/modules';
}

export function modulePayload(module: NstpModule) {
  return {
    title: module.title.trim(),
    description: module.description.trim(),
    component: module.component || 'Common',
    hours: Number(module.hours),
    difficulty: module.difficulty,
    status: module.status || 'DRAFT',
    order: Number(module.order) || 0,
    ...(module.courseCode ? { courseCode: module.courseCode } : {}),
    ...(module.semester ? { semester: module.semester } : {}),
    ...(module.schoolYear ? { schoolYear: module.schoolYear } : {}),
    ...(module.sourceDocument ? { sourceDocument: module.sourceDocument } : {}),
    ...(module.outcomes?.length ? { outcomes: module.outcomes } : {}),
    ...(module.videoUrl ? { videoUrl: module.videoUrl } : {}),
    ...(module.meetingLink ? { meetingLink: module.meetingLink } : {}),
    ...(module.documentLink ? { documentLink: module.documentLink } : {}),
    ...(module.speaker ? { speaker: module.speaker } : {}),
    ...(module.speakerPosition ? { speakerPosition: module.speakerPosition } : {}),
    ...(module.scheduledDate ? { scheduledDate: module.scheduledDate } : {}),
    ...(module.scheduledTime ? { scheduledTime: module.scheduledTime } : {}),
  };
}

export async function fetchManagedModules(role: ModuleReaderRole) {
  return apiGet<NstpModule[]>(readerBase(role));
}

export async function createManagedModule(role: ModuleEditorRole, module: NstpModule) {
  const response = await apiPost<ApiEnvelope<NstpModule>>(managementBase(role), modulePayload(module));
  return response.data;
}

export async function updateManagedModule(role: ModuleEditorRole, module: NstpModule) {
  const response = await apiPatch<ApiEnvelope<NstpModule>>(`${managementBase(role)}/${encodeURIComponent(module.id)}`, modulePayload(module));
  return response.data;
}

export async function removeManagedModule(role: ModuleEditorRole, id: string) {
  const response = await apiDel<ApiEnvelope<{ id: string; archived: boolean }>>(`${managementBase(role)}/${encodeURIComponent(id)}`);
  return response.data;
}
