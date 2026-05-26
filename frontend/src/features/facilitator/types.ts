import type { BiliranMunicipality, NstpComponent } from '../../data/nstpData';
import type { AttendanceSheet, AttendanceStatus, DetailedGrade, GradeWorkflowStatus } from '../../data/workflowData';

export type { AttendanceStatus, GradeWorkflowStatus };
export type { LearningMaterial } from '../../data/learningMaterials';

export type FacilitatorPage =
  | 'dashboard'
  | 'students'
  | 'attendance'
  | 'gradebook'
  | 'assessments'
  | 'submissions'
  | 'learning-materials'
  | 'reports'
  | 'announcements'
  | 'activity-log';

export type AttendanceSession = AttendanceSheet;
export type FacilitatorGradeEntry = DetailedGrade;
export type GradeStatus = GradeWorkflowStatus;

export type FacilitatorActivity = {
  id: string;
  title: string;
  detail: string;
  at: string;
};

export type FacilitatorNotice = {
  id: string;
  facilitatorId: string;
  title: string;
  message: string;
  priority: 'normal' | 'high';
  municipality: BiliranMunicipality | 'All Assigned';
  component: NstpComponent | 'All Components';
  createdAt: string;
};
