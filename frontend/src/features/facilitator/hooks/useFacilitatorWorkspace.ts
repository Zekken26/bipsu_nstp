import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  loadAssessments,
  loadGradeRecords,
  loadModules,
  loadPendingStudentRegistrations,
  loadStudents,
  type NstpAccount,
  type NstpAssessment,
  type NstpGradeRecord,
  type NstpModule,
  type NstpStudent,
  type PendingStudentRegistration,
} from '../../../data/nstpData';
import {
  loadFacilitatorActivity,
  loadFacilitatorNotices,
  loadLearningMaterials,
  saveFacilitatorActivity,
  saveFacilitatorNotices,
  saveLearningMaterials,
} from '../data/facilitatorStore';
import {
  addAudit,
  finalGrade,
  loadAttendanceSheets,
  loadDetailedGrades,
  loadGradingSettings,
  loadInterventionNotes,
  loadSessions,
  saveAttendanceSheets,
  saveDetailedGrades,
  saveGradingSettings,
  saveInterventionNotes,
  saveSessions,
  type GradingSettings,
  type InterventionNote,
  type NstpSession,
} from '../../../data/workflowData';
import type {
  AttendanceSession,
  FacilitatorActivity,
  FacilitatorGradeEntry,
  FacilitatorNotice,
  LearningMaterial,
} from '../types';

export type FacilitatorWorkspace = {
  user: NstpAccount;
  students: NstpStudent[];
  pending: PendingStudentRegistration[];
  assessments: NstpAssessment[];
  gradeRecords: NstpGradeRecord[];
  modules: NstpModule[];
  attendance: AttendanceSession[];
  detailedGrades: FacilitatorGradeEntry[];
  materials: LearningMaterial[];
  notices: FacilitatorNotice[];
  activity: FacilitatorActivity[];
  sessions: NstpSession[];
  notes: InterventionNote[];
  gradingSettings: GradingSettings;
  refresh: () => void;
  recordActivity: (title: string, detail: string) => void;
  setAttendance: (value: AttendanceSession[]) => void;
  setDetailedGrades: (value: FacilitatorGradeEntry[]) => void;
  setMaterials: (value: LearningMaterial[]) => void;
  setNotices: (value: FacilitatorNotice[]) => void;
  setSessions: (value: NstpSession[]) => void;
  setNotes: (value: InterventionNote[]) => void;
  setGradingSettings: (value: GradingSettings) => void;
};

const isAssignedStudent = (user: NstpAccount, student: NstpStudent) => {
  const municipalities = user.municipalities || [];
  if (municipalities.length > 0) return Boolean(student.municipality && municipalities.includes(student.municipality));
  return student.facilitatorId === user.id;
};

export function calculateFinalGrade(entry?: FacilitatorGradeEntry) {
  return entry ? finalGrade(entry) : null;
}

export default function useFacilitatorWorkspace(user: NstpAccount): FacilitatorWorkspace {
  const [allStudents, setAllStudents] = useState<NstpStudent[]>([]);
  const [allPending, setAllPending] = useState<PendingStudentRegistration[]>([]);
  const [assessments, setAssessments] = useState<NstpAssessment[]>([]);
  const [gradeRecords, setGradeRecords] = useState<NstpGradeRecord[]>([]);
  const [modules, setModules] = useState<NstpModule[]>([]);
  const [attendance, setAttendanceState] = useState<AttendanceSession[]>([]);
  const [detailedGrades, setDetailedGradesState] = useState<FacilitatorGradeEntry[]>([]);
  const [materials, setMaterialsState] = useState<LearningMaterial[]>([]);
  const [notices, setNoticesState] = useState<FacilitatorNotice[]>([]);
  const [activity, setActivityState] = useState<FacilitatorActivity[]>([]);
  const [sessions, setSessionsState] = useState<NstpSession[]>([]);
  const [notes, setNotesState] = useState<InterventionNote[]>([]);
  const [gradingSettings, setGradingSettingsState] = useState<GradingSettings>(loadGradingSettings());

  const refresh = useCallback(() => {
    setAllStudents(loadStudents());
    setAllPending(loadPendingStudentRegistrations());
    setAssessments(loadAssessments().filter((assessment) => assessment.ownerId === user.id));
    setGradeRecords(loadGradeRecords());
    setModules(loadModules());
    setAttendanceState(loadAttendanceSheets().filter((sheet) => sheet.facilitatorId === user.id));
    setDetailedGradesState(loadDetailedGrades().filter((grade) => grade.facilitatorId === user.id));
    setMaterialsState(loadLearningMaterials(user.id));
    setNoticesState(loadFacilitatorNotices(user.id));
    setActivityState(loadFacilitatorActivity(user.id));
    setSessionsState(loadSessions().filter((session) => session.facilitatorId === user.id));
    setNotesState(loadInterventionNotes().filter((note) => note.facilitatorId === user.id));
    setGradingSettingsState(loadGradingSettings());
  }, [user.id]);

  useEffect(() => {
    refresh();
    const events = [
      'nstp-students-updated',
      'nstp-assessments-updated',
      'nstp-workflow-attendance-updated',
      'nstp-workflow-grades-updated',
      'nstp-workflow-sessions-updated',
      'nstp-workflow-notes-updated',
      'nstp-workflow-settings-updated',
      `nstp-facilitator-materials-updated`,
      'nstp-learning-materials-updated',
      `nstp-facilitator-notices-updated`,
    ];
    events.forEach((event) => window.addEventListener(event, refresh));
    return () => events.forEach((event) => window.removeEventListener(event, refresh));
  }, [refresh]);

  const students = useMemo(() => allStudents.filter((student) => isAssignedStudent(user, student)), [allStudents, user]);
  const pending = useMemo(
    () => allPending.filter((student) => Boolean(student.municipality && user.municipalities?.includes(student.municipality))),
    [allPending, user.municipalities],
  );

  const recordActivity = (title: string, detail: string) => {
    const next = [{ id: `activity-${Date.now()}`, title, detail, at: new Date().toISOString() }, ...activity].slice(0, 30);
    saveFacilitatorActivity(user.id, next);
    setActivityState(next);
  };

  const setAttendance = (value: AttendanceSession[]) => {
    const others = loadAttendanceSheets().filter((sheet) => sheet.facilitatorId !== user.id);
    saveAttendanceSheets([...value, ...others]);
    setAttendanceState(value);
  };
  const setDetailedGrades = (value: FacilitatorGradeEntry[]) => {
    const others = loadDetailedGrades().filter((grade) => grade.facilitatorId !== user.id);
    saveDetailedGrades([...value, ...others]);
    setDetailedGradesState(value);
  };
  const setMaterials = (value: LearningMaterial[]) => {
    saveLearningMaterials(user.id, value);
    setMaterialsState(value);
  };
  const setNotices = (value: FacilitatorNotice[]) => {
    saveFacilitatorNotices(user.id, value);
    setNoticesState(value);
  };
  const setSessions = (value: NstpSession[]) => {
    const others = loadSessions().filter((session) => session.facilitatorId !== user.id);
    saveSessions([...value, ...others]);
    setSessionsState(value);
  };
  const setNotes = (value: InterventionNote[]) => {
    const others = loadInterventionNotes().filter((note) => note.facilitatorId !== user.id);
    saveInterventionNotes([...value, ...others]);
    setNotesState(value);
  };
  const setGradingSettings = (value: GradingSettings) => {
    saveGradingSettings(value);
    setGradingSettingsState(value);
    addAudit(user, 'Updated grading settings', 'Settings', 'grading-breakdown', 'Adjusted official grade computation breakdown.');
  };

  return {
    user,
    students,
    pending,
    assessments,
    gradeRecords,
    modules,
    attendance,
    detailedGrades,
    materials,
    notices,
    activity,
    sessions,
    notes,
    gradingSettings,
    refresh,
    recordActivity,
    setAttendance,
    setDetailedGrades,
    setMaterials,
    setNotices,
    setSessions,
    setNotes,
    setGradingSettings,
  };
}
