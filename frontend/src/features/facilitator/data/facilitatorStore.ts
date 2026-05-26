import { safeJsonParse } from '../../../data/nstpData';
import { materialsForFacilitator, saveFacilitatorOwnedMaterials } from '../../../data/learningMaterials';
import type {
  AttendanceSession,
  FacilitatorActivity,
  FacilitatorGradeEntry,
  FacilitatorNotice,
  LearningMaterial,
} from '../types';

const keyFor = (section: string, facilitatorId: string) => `nstp-facilitator-${section}-${facilitatorId}`;

function loadScoped<T>(section: string, facilitatorId: string): T[] {
  if (typeof window === 'undefined') return [];
  return safeJsonParse<T[]>(localStorage.getItem(keyFor(section, facilitatorId)), []);
}

function saveScoped<T>(section: string, facilitatorId: string, value: T[]) {
  if (typeof window === 'undefined') return;
  // TODO(API): replace facilitator workspace local persistence when scoped API routes are available.
  localStorage.setItem(keyFor(section, facilitatorId), JSON.stringify(value));
  window.dispatchEvent(new CustomEvent(`nstp-facilitator-${section}-updated`, { detail: facilitatorId }));
}

export const loadAttendanceSessions = (facilitatorId: string) => loadScoped<AttendanceSession>('attendance', facilitatorId);
export const saveAttendanceSessions = (facilitatorId: string, sessions: AttendanceSession[]) => saveScoped('attendance', facilitatorId, sessions);

export const loadFacilitatorGrades = (facilitatorId: string) => loadScoped<FacilitatorGradeEntry>('gradebook', facilitatorId);
export const saveFacilitatorGrades = (facilitatorId: string, grades: FacilitatorGradeEntry[]) => saveScoped('gradebook', facilitatorId, grades);

export const loadLearningMaterials = (facilitatorId: string) => materialsForFacilitator(facilitatorId);
export const saveLearningMaterials = (facilitatorId: string, materials: LearningMaterial[]) => saveFacilitatorOwnedMaterials(facilitatorId, materials);

export const loadFacilitatorNotices = (facilitatorId: string) => loadScoped<FacilitatorNotice>('notices', facilitatorId);
export const saveFacilitatorNotices = (facilitatorId: string, notices: FacilitatorNotice[]) => saveScoped('notices', facilitatorId, notices);

export const loadFacilitatorActivity = (facilitatorId: string) => loadScoped<FacilitatorActivity>('activity', facilitatorId);
export const saveFacilitatorActivity = (facilitatorId: string, activity: FacilitatorActivity[]) => saveScoped('activity', facilitatorId, activity.slice(0, 30));
