import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  loadAssessments,
  loadGradeRecords,
  loadModules,
  loadPendingStudentRegistrations,
  loadStudents,
  normalizeComponent,
  type BiliranMunicipality,
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
  assignedMunicipalities: BiliranMunicipality[];
  activeMunicipality: BiliranMunicipality | 'All Assigned';
  setActiveMunicipality: (value: BiliranMunicipality | 'All Assigned') => void;
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

const componentAllowedForUser = (user: NstpAccount, component?: NstpStudent['component'] | NstpSession['component'] | 'All Components') => {
  if (!user.component) return true;
  if (!component || component === 'Common' || component === 'Common Phase' || component === 'All Components') return false;
  return normalizeComponent(component) === normalizeComponent(user.component);
};

const isAssignedStudent = (user: NstpAccount, student: NstpStudent) => {
  if (!componentAllowedForUser(user, student.component)) return false;
  const municipalities = user.municipalities || [];
  if (municipalities.length > 0) return Boolean(student.municipality && municipalities.includes(student.municipality));
  return student.facilitatorId === user.id;
};

export function calculateFinalGrade(entry?: FacilitatorGradeEntry) {
  return entry ? finalGrade(entry) : null;
}

export default function useFacilitatorWorkspace(user: NstpAccount): FacilitatorWorkspace {
  const assignedMunicipalities = useMemo(() => user.municipalities || [], [user.municipalities]);
  const [activeMunicipality, setActiveMunicipalityState] = useState<BiliranMunicipality | 'All Assigned'>(
    () => {
      const saved = localStorage.getItem(`nstp-facilitator-municipality-scope-${user.id}`) as BiliranMunicipality | 'All Assigned' | null;
      if (saved === 'All Assigned') return saved;
      if (saved && assignedMunicipalities.includes(saved)) return saved;
      return assignedMunicipalities.length > 1 ? 'All Assigned' : assignedMunicipalities[0] || 'All Assigned';
    },
  );
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

  const municipalityAllowed = useCallback((municipality?: BiliranMunicipality | 'All' | 'All Assigned') => {
    if (!assignedMunicipalities.length) return true;
    if (!municipality || municipality === 'All Assigned') return false;
    if (municipality === 'All') return true;
    return assignedMunicipalities.includes(municipality);
  }, [assignedMunicipalities]);

  const municipalityVisible = useCallback((municipality?: BiliranMunicipality | 'All' | 'All Assigned') => {
    if (!municipalityAllowed(municipality)) return false;
    if (activeMunicipality === 'All Assigned') return true;
    return municipality === activeMunicipality || municipality === 'All';
  }, [activeMunicipality, municipalityAllowed]);

  const refresh = useCallback(() => {
    setAllStudents(loadStudents());
    setAllPending(loadPendingStudentRegistrations());
    setAssessments(loadAssessments().filter((assessment) => assessment.ownerId === user.id));
    setGradeRecords(loadGradeRecords());
    setModules(loadModules());
    setAttendanceState(loadAttendanceSheets().filter((sheet) => sheet.facilitatorId === user.id && componentAllowedForUser(user, sheet.component)));
    setDetailedGradesState(loadDetailedGrades().filter((grade) => grade.facilitatorId === user.id));
    setMaterialsState(loadLearningMaterials(user.id));
    setNoticesState(loadFacilitatorNotices(user.id));
    setActivityState(loadFacilitatorActivity(user.id));
    setSessionsState(loadSessions().filter((session) => session.facilitatorId === user.id && componentAllowedForUser(user, session.component)));
    setNotesState(loadInterventionNotes().filter((note) => note.facilitatorId === user.id));
    setGradingSettingsState(loadGradingSettings());
  }, [user]);

  useEffect(() => {
    if (!assignedMunicipalities.length) {
      if (activeMunicipality !== 'All Assigned') setActiveMunicipalityState('All Assigned');
      return;
    }
    if (activeMunicipality !== 'All Assigned' && !assignedMunicipalities.includes(activeMunicipality)) {
      setActiveMunicipalityState(assignedMunicipalities.length > 1 ? 'All Assigned' : assignedMunicipalities[0]);
    }
  }, [activeMunicipality, assignedMunicipalities]);

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

  const assignedStudents = useMemo(() => allStudents.filter((student) => isAssignedStudent(user, student)), [allStudents, user]);
  const students = useMemo(
    () => assignedStudents.filter((student) => activeMunicipality === 'All Assigned' || student.municipality === activeMunicipality),
    [activeMunicipality, assignedStudents],
  );
  const assignedStudentIds = useMemo(() => new Set(assignedStudents.map((student) => student.id)), [assignedStudents]);
  const visibleStudentIds = useMemo(() => new Set(students.map((student) => student.id)), [students]);
  const pending = useMemo(
    () => allPending
      .filter((student) => Boolean(student.municipality && assignedMunicipalities.includes(student.municipality)))
      .filter((student) => activeMunicipality === 'All Assigned' || student.municipality === activeMunicipality),
    [activeMunicipality, allPending, assignedMunicipalities],
  );
  const scopedAttendance = useMemo(
    () => attendance
      .filter((sheet) => sheet.facilitatorId === user.id && componentAllowedForUser(user, sheet.component) && municipalityVisible(sheet.municipality))
      .map((sheet) => ({ ...sheet, entries: sheet.entries.filter((entry) => visibleStudentIds.has(entry.studentId)) })),
    [attendance, municipalityVisible, user.id, visibleStudentIds],
  );
  const scopedSessions = useMemo(
    () => sessions.filter((session) => session.facilitatorId === user.id && componentAllowedForUser(user, session.component) && municipalityVisible(session.municipality)),
    [municipalityVisible, sessions, user.id],
  );
  const scopedDetailedGrades = useMemo(
    () => detailedGrades.filter((grade) => grade.facilitatorId === user.id && visibleStudentIds.has(grade.studentId)),
    [detailedGrades, user.id, visibleStudentIds],
  );
  const scopedNotes = useMemo(
    () => notes.filter((note) => note.facilitatorId === user.id && visibleStudentIds.has(note.studentId)),
    [notes, user.id, visibleStudentIds],
  );

  const recordActivity = (title: string, detail: string) => {
    const next = [{ id: `activity-${Date.now()}`, title, detail, at: new Date().toISOString() }, ...activity].slice(0, 30);
    saveFacilitatorActivity(user.id, next);
    setActivityState(next);
  };

  const setAttendance = (value: AttendanceSession[]) => {
    const incoming = value
      .filter((sheet) => sheet.facilitatorId === user.id && componentAllowedForUser(user, sheet.component) && municipalityAllowed(sheet.municipality))
      .map((sheet) => ({ ...sheet, entries: sheet.entries.filter((entry) => assignedStudentIds.has(entry.studentId)) }));
    const incomingIds = new Set(incoming.map((sheet) => sheet.id));
    const current = loadAttendanceSheets();
    const others = current.filter((sheet) => sheet.facilitatorId !== user.id || !incomingIds.has(sheet.id));
    saveAttendanceSheets([...incoming, ...others]);
    setAttendanceState([...incoming, ...current.filter((sheet) => sheet.facilitatorId === user.id && !incomingIds.has(sheet.id))]);
  };
  const setDetailedGrades = (value: FacilitatorGradeEntry[]) => {
    const incoming = value.filter((grade) => grade.facilitatorId === user.id && assignedStudentIds.has(grade.studentId));
    const incomingStudentIds = new Set(incoming.map((grade) => grade.studentId));
    const current = loadDetailedGrades();
    const others = current.filter((grade) => grade.facilitatorId !== user.id || !incomingStudentIds.has(grade.studentId));
    saveDetailedGrades([...incoming, ...others]);
    setDetailedGradesState([...incoming, ...current.filter((grade) => grade.facilitatorId === user.id && !incomingStudentIds.has(grade.studentId))]);
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
    const incoming = value.filter((session) => session.facilitatorId === user.id && componentAllowedForUser(user, session.component) && municipalityAllowed(session.municipality));
    const incomingIds = new Set(incoming.map((session) => session.id));
    const current = loadSessions();
    const others = current.filter((session) => session.facilitatorId !== user.id || !incomingIds.has(session.id));
    saveSessions([...incoming, ...others]);
    setSessionsState([...incoming, ...current.filter((session) => session.facilitatorId === user.id && !incomingIds.has(session.id))]);
  };
  const setNotes = (value: InterventionNote[]) => {
    const incoming = value.filter((note) => note.facilitatorId === user.id && assignedStudentIds.has(note.studentId));
    const incomingIds = new Set(incoming.map((note) => note.id));
    const current = loadInterventionNotes();
    const others = current.filter((note) => note.facilitatorId !== user.id || !incomingIds.has(note.id));
    saveInterventionNotes([...incoming, ...others]);
    setNotesState([...incoming, ...current.filter((note) => note.facilitatorId === user.id && !incomingIds.has(note.id))]);
  };
  const setGradingSettings = (value: GradingSettings) => {
    saveGradingSettings(value);
    setGradingSettingsState(value);
    addAudit(user, 'Updated grading settings', 'Settings', 'grading-breakdown', 'Adjusted official grade computation breakdown.');
  };

  const setActiveMunicipality = (value: BiliranMunicipality | 'All Assigned') => {
    const next = value === 'All Assigned' || assignedMunicipalities.includes(value)
      ? value
      : assignedMunicipalities.length > 1 ? 'All Assigned' : assignedMunicipalities[0] || 'All Assigned';
    setActiveMunicipalityState(next);
    localStorage.setItem(`nstp-facilitator-municipality-scope-${user.id}`, next);
    const currentUser = JSON.parse(localStorage.getItem('nstpUser') || 'null');
    if (currentUser?.id === user.id) {
      localStorage.setItem('nstpUser', JSON.stringify({ ...currentUser, activeMunicipality: next }));
    }
  };

  return {
    user,
    assignedMunicipalities,
    activeMunicipality,
    setActiveMunicipality,
    students,
    pending,
    assessments,
    gradeRecords,
    modules,
    attendance: scopedAttendance,
    detailedGrades: scopedDetailedGrades,
    materials,
    notices,
    activity,
    sessions: scopedSessions,
    notes: scopedNotes,
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
