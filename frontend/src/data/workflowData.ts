import {
  loadAccounts,
  loadStudents,
  safeJsonParse,
  type BiliranMunicipality,
  type NstpComponent,
} from './nstpData';

export type WorkflowPhase = 'Common Phase' | 'Component Proper';
export type SessionType = 'Orientation' | 'Seminar' | 'Workshop' | 'Lecture' | 'Activity' | 'Assessment' | 'Examination';
export type SessionStatus = 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';
export type AttendanceRecordStatus = 'Draft' | 'Ongoing' | 'Submitted' | 'Completed' | 'Complete' | 'Needs Review';
export type GradeWorkflowStatus = 'Draft' | 'In Progress' | 'Submitted' | 'Reviewed' | 'Released';
export type EligibilityStatus = 'Not Eligible' | 'Near Completion' | 'Eligible for Component Classification' | 'Approved';

export type NstpSession = {
  id: string;
  phase: WorkflowPhase;
  sessionNumber: number;
  title: string;
  type: SessionType;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  venue: string;
  facilitatorId: string;
  facilitatorName: string;
  municipality: BiliranMunicipality | 'All';
  component: NstpComponent | 'Common';
  group: string;
  description: string;
  assessmentId?: string;
  status: SessionStatus;
};

export type AttendanceEntry = {
  studentId: string;
  status: AttendanceStatus;
  remarks: string;
  excuseAttachmentName?: string;
};

export type AttendanceSheet = {
  id: string;
  sessionId: string;
  facilitatorId: string;
  facilitatorName: string;
  date: string;
  sessionNumber: number;
  topic: string;
  phase: WorkflowPhase;
  municipality: BiliranMunicipality | 'All';
  component: NstpComponent | 'Common' | 'All Components';
  group: string;
  status: AttendanceRecordStatus;
  entries: AttendanceEntry[];
  createdAt: string;
  updatedAt: string;
};

export type DetailedGrade = {
  studentId: string;
  facilitatorId: string;
  assessments: number | null;
  quizzes: number | null;
  attendance: number | null;
  activities: number | null;
  participation: number | null;
  majorExam: number | null;
  overrideFinal: number | null;
  status: GradeWorkflowStatus;
  feedback: string;
  updatedAt: string;
};

export type GradingSettings = {
  attendance: number;
  assessments: number;
  activities: number;
  participation: number;
  majorExam: number;
  allowOverride: boolean;
  updatedAt: string;
};

export type InterventionNote = {
  id: string;
  studentId: string;
  facilitatorId: string;
  note: string;
  category: 'Attendance' | 'Academic' | 'Follow-up' | 'Commendation';
  createdAt: string;
  private: true;
};

export type WorkflowNotice = {
  id: string;
  actorId: string;
  actorName: string;
  audience: 'all' | 'student' | 'facilitator';
  municipality: BiliranMunicipality | 'All';
  component: NstpComponent | 'Common' | 'All';
  title: string;
  message: string;
  priority: 'Normal' | 'Urgent';
  status: 'Draft' | 'Published' | 'Archived';
  createdAt: string;
};

export type AuditEntry = {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  recordType: string;
  recordId: string;
  detail: string;
  at: string;
};

const SESSION_KEY = 'nstp-workflow-sessions';
const ATTENDANCE_KEY = 'nstp-workflow-attendance';
const GRADE_KEY = 'nstp-workflow-grades';
const SETTINGS_KEY = 'nstp-workflow-grading-settings';
const NOTE_KEY = 'nstp-workflow-intervention-notes';
const NOTICE_KEY = 'nstp-workflow-notices';
const AUDIT_KEY = 'nstp-workflow-audit-log';

const iso = (value: string) => new Date(`${value}T08:00:00`).toISOString();

const DEMO_SESSIONS: NstpSession[] = [
  {
    id: 'common-orientation',
    phase: 'Common Phase',
    sessionNumber: 1,
    title: 'NSTP Orientation and Republic Act 9163',
    type: 'Orientation',
    date: '2026-05-04',
    startTime: '08:00',
    endTime: '12:00',
    duration: 4,
    venue: 'BiPSU Gymnasium',
    facilitatorId: 'facilitator-1',
    facilitatorName: 'Dr. Maria Elena Santos',
    municipality: 'Naval',
    component: 'Common',
    group: 'Naval Common Phase - Batch A',
    description: 'Program orientation, legal basis, expectations, and student safety briefing.',
    status: 'Completed',
  },
  {
    id: 'common-citizenship',
    phase: 'Common Phase',
    sessionNumber: 2,
    title: 'Citizenship and Values Formation',
    type: 'Seminar',
    date: '2026-05-09',
    startTime: '08:00',
    endTime: '12:00',
    duration: 4,
    venue: 'University AVR',
    facilitatorId: 'facilitator-1',
    facilitatorName: 'Dr. Maria Elena Santos',
    municipality: 'Naval',
    component: 'Common',
    group: 'Naval Common Phase - Batch A',
    description: 'Rights, duties, civic responsibility, and values-based service.',
    assessmentId: 'asmt-citizenship',
    status: 'Completed',
  },
  {
    id: 'common-drrm',
    phase: 'Common Phase',
    sessionNumber: 3,
    title: 'Disaster Preparedness Workshop',
    type: 'Workshop',
    date: '2026-05-16',
    startTime: '08:00',
    endTime: '13:00',
    duration: 5,
    venue: 'DRRM Training Hall',
    facilitatorId: 'facilitator-1',
    facilitatorName: 'Dr. Maria Elena Santos',
    municipality: 'Naval',
    component: 'Common',
    group: 'Naval Common Phase - Batch A',
    description: 'Hands-on emergency response, hazard mapping, and community preparedness.',
    status: 'Completed',
  },
  {
    id: 'common-service-design',
    phase: 'Common Phase',
    sessionNumber: 4,
    title: 'Service Project Design Laboratory',
    type: 'Activity',
    date: '2026-05-23',
    startTime: '08:00',
    endTime: '13:00',
    duration: 5,
    venue: 'Flexible Learning Room',
    facilitatorId: 'facilitator-1',
    facilitatorName: 'Dr. Maria Elena Santos',
    municipality: 'Naval',
    component: 'Common',
    group: 'Naval Common Phase - Batch A',
    description: 'Community needs assessment and service intervention proposal.',
    status: 'Completed',
  },
  {
    id: 'common-reflection-exam',
    phase: 'Common Phase',
    sessionNumber: 5,
    title: 'Common Phase Synthesis and Examination',
    type: 'Examination',
    date: '2026-06-01',
    startTime: '08:00',
    endTime: '11:00',
    duration: 3,
    venue: 'NSTP Testing Room',
    facilitatorId: 'facilitator-1',
    facilitatorName: 'Dr. Maria Elena Santos',
    municipality: 'Naval',
    component: 'Common',
    group: 'Naval Common Phase - Batch A',
    description: 'Culminating assessment and classification readiness review.',
    status: 'Upcoming',
  },
  {
    id: 'cwts-community-profile',
    phase: 'Component Proper',
    sessionNumber: 1,
    title: 'CWTS Community Profiling and Consultation',
    type: 'Activity',
    date: '2026-05-21',
    startTime: '08:00',
    endTime: '12:00',
    duration: 4,
    venue: 'Naval Barangay Hall',
    facilitatorId: 'facilitator-1',
    facilitatorName: 'Dr. Maria Elena Santos',
    municipality: 'Naval',
    component: 'CWTS',
    group: 'CWTS - Naval Group 1',
    description: 'Community consultation for the civic welfare service project.',
    status: 'Completed',
  },
  {
    id: 'lts-reading-clinic',
    phase: 'Component Proper',
    sessionNumber: 1,
    title: 'LTS Reading Clinic Facilitation',
    type: 'Activity',
    date: '2026-05-22',
    startTime: '13:00',
    endTime: '17:00',
    duration: 4,
    venue: 'Naval Central School',
    facilitatorId: 'facilitator-1',
    facilitatorName: 'Dr. Maria Elena Santos',
    municipality: 'Naval',
    component: 'LTS',
    group: 'LTS - Naval Group 1',
    description: 'Guided literacy support and learner assessment.',
    status: 'Completed',
  },
  {
    id: 'mts-readiness-drill',
    phase: 'Component Proper',
    sessionNumber: 1,
    title: 'MTS Leadership and Readiness Drill',
    type: 'Workshop',
    date: '2026-05-24',
    startTime: '06:00',
    endTime: '10:00',
    duration: 4,
    venue: 'University Field',
    facilitatorId: 'facilitator-1',
    facilitatorName: 'Dr. Maria Elena Santos',
    municipality: 'Naval',
    component: 'MTS (Army)',
    group: 'MTS Army - Naval Group 1',
    description: 'Leadership, formation, and safety preparedness exercise.',
    status: 'Completed',
  },
];

const entry = (studentId: string, status: AttendanceStatus, remarks = '', excuseAttachmentName?: string): AttendanceEntry => ({ studentId, status, remarks, excuseAttachmentName });
const commonLearners = ['student-demo-common', 'student-demo-cwts', 'student-demo-lts', 'student-demo-mts'];
const commonEntries = (commonStatus: AttendanceStatus = 'present') => [
  entry('student-demo-common', commonStatus, commonStatus === 'late' ? 'Arrived 20 minutes late; counseled.' : ''),
  entry('student-demo-cwts', 'present'),
  entry('student-demo-lts', 'present'),
  entry('student-demo-mts', 'present'),
];
const DEMO_ATTENDANCE: AttendanceSheet[] = [
  ...DEMO_SESSIONS.slice(0, 4).map((session, index) => ({
    id: `sheet-${session.id}`,
    sessionId: session.id,
    facilitatorId: session.facilitatorId,
    facilitatorName: session.facilitatorName,
    date: session.date,
    sessionNumber: session.sessionNumber,
    topic: session.title,
    phase: session.phase,
    municipality: session.municipality,
    component: session.component,
    group: session.group,
    status: index === 3 ? 'Needs Review' as const : 'Complete' as const,
    entries: commonEntries(index === 2 ? 'late' : 'present'),
    createdAt: iso(session.date),
    updatedAt: iso(session.date),
  })),
  {
    id: 'sheet-cwts',
    sessionId: 'cwts-community-profile',
    facilitatorId: 'facilitator-1',
    facilitatorName: 'Dr. Maria Elena Santos',
    date: '2026-05-21',
    sessionNumber: 1,
    topic: 'CWTS Community Profiling and Consultation',
    phase: 'Component Proper',
    municipality: 'Naval',
    component: 'CWTS',
    group: 'CWTS - Naval Group 1',
    status: 'Complete',
    entries: [entry('student-demo-cwts', 'present', 'Completed consultation worksheet.')],
    createdAt: iso('2026-05-21'),
    updatedAt: iso('2026-05-21'),
  },
  {
    id: 'sheet-lts',
    sessionId: 'lts-reading-clinic',
    facilitatorId: 'facilitator-1',
    facilitatorName: 'Dr. Maria Elena Santos',
    date: '2026-05-22',
    sessionNumber: 1,
    topic: 'LTS Reading Clinic Facilitation',
    phase: 'Component Proper',
    municipality: 'Naval',
    component: 'LTS',
    group: 'LTS - Naval Group 1',
    status: 'Complete',
    entries: [entry('student-demo-lts', 'present', 'Submitted reading observation log.')],
    createdAt: iso('2026-05-22'),
    updatedAt: iso('2026-05-22'),
  },
  {
    id: 'sheet-mts',
    sessionId: 'mts-readiness-drill',
    facilitatorId: 'facilitator-1',
    facilitatorName: 'Dr. Maria Elena Santos',
    date: '2026-05-24',
    sessionNumber: 1,
    topic: 'MTS Leadership and Readiness Drill',
    phase: 'Component Proper',
    municipality: 'Naval',
    component: 'MTS (Army)',
    group: 'MTS Army - Naval Group 1',
    status: 'Complete',
    entries: [entry('student-demo-mts', 'excused', 'Medical excuse filed.', 'medical-certificate.pdf')],
    createdAt: iso('2026-05-24'),
    updatedAt: iso('2026-05-24'),
  },
];

const DEMO_GRADES: DetailedGrade[] = [
  { studentId: 'student-demo-cwts', facilitatorId: 'facilitator-1', assessments: 91, quizzes: 88, attendance: 96, activities: 94, participation: 93, majorExam: 90, overrideFinal: null, status: 'Released', feedback: 'Strong community profiling output.', updatedAt: iso('2026-05-24') },
  { studentId: 'student-demo-lts', facilitatorId: 'facilitator-1', assessments: 92, quizzes: 94, attendance: 100, activities: 95, participation: 94, majorExam: 91, overrideFinal: null, status: 'Released', feedback: 'Excellent learner facilitation.', updatedAt: iso('2026-05-24') },
  { studentId: 'student-demo-mts', facilitatorId: 'facilitator-1', assessments: 88, quizzes: 90, attendance: 92, activities: 87, participation: 91, majorExam: 89, overrideFinal: null, status: 'Reviewed', feedback: 'Medical excuse accepted; release pending.', updatedAt: iso('2026-05-24') },
  { studentId: 'student-demo-common', facilitatorId: 'facilitator-1', assessments: 87, quizzes: 84, attendance: 94, activities: 88, participation: 90, majorExam: null, overrideFinal: null, status: 'In Progress', feedback: 'Complete synthesis examination to reach eligibility.', updatedAt: iso('2026-05-24') },
];

const DEFAULT_SETTINGS: GradingSettings = {
  attendance: 15,
  assessments: 25,
  activities: 20,
  participation: 10,
  majorExam: 30,
  allowOverride: true,
  updatedAt: new Date().toISOString(),
};

const DEMO_NOTICES: WorkflowNotice[] = [
  {
    id: 'notice-common-exam',
    actorId: 'facilitator-1',
    actorName: 'Dr. Maria Elena Santos',
    audience: 'student',
    municipality: 'Naval',
    component: 'Common',
    title: 'Common Phase Synthesis Examination',
    message: 'Prepare for the final Common Phase readiness examination on June 1. Bring your session activity portfolio.',
    priority: 'Urgent',
    status: 'Published',
    createdAt: iso('2026-05-24'),
  },
  {
    id: 'notice-component-projects',
    actorId: 'admin-1',
    actorName: 'Administrator',
    audience: 'student',
    municipality: 'All',
    component: 'All',
    title: 'Component Proper Requirements',
    message: 'CWTS, LTS, and MTS learners should confirm activity schedules and required outputs with assigned facilitators.',
    priority: 'Normal',
    status: 'Published',
    createdAt: iso('2026-05-20'),
  },
];

function ensureCollection<T>(key: string, defaults: T[]) {
  const existing = safeJsonParse<T[]>(localStorage.getItem(key), []);
  if (!existing.length) {
    localStorage.setItem(key, JSON.stringify(defaults));
    return;
  }
  const rows = existing as Array<T & { id?: string }>;
  const additions = (defaults as Array<T & { id?: string }>).filter((value) => !rows.some((existingValue) => existingValue.id && existingValue.id === value.id));
  if (additions.length) localStorage.setItem(key, JSON.stringify([...existing, ...additions]));
}

export function ensureWorkflowSeedData() {
  if (typeof window === 'undefined') return;
  ensureCollection(SESSION_KEY, DEMO_SESSIONS);
  ensureCollection(ATTENDANCE_KEY, DEMO_ATTENDANCE);
  ensureCollection(GRADE_KEY, DEMO_GRADES);
  ensureCollection(NOTE_KEY, []);
  ensureCollection(NOTICE_KEY, DEMO_NOTICES);
  ensureCollection(AUDIT_KEY, []);
  if (!localStorage.getItem(SETTINGS_KEY)) localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
}

function load<T>(key: string, fallback: T[]) {
  ensureWorkflowSeedData();
  return safeJsonParse<T[]>(localStorage.getItem(key), fallback);
}

function save<T>(key: string, rows: T[], eventName: string) {
  localStorage.setItem(key, JSON.stringify(rows));
  window.dispatchEvent(new CustomEvent(eventName));
}

export const loadSessions = () => load(SESSION_KEY, DEMO_SESSIONS);
export const saveSessions = (sessions: NstpSession[]) => save(SESSION_KEY, sessions, 'nstp-workflow-sessions-updated');
export const loadAttendanceSheets = () => load(ATTENDANCE_KEY, DEMO_ATTENDANCE);
export const saveAttendanceSheets = (sheets: AttendanceSheet[]) => save(ATTENDANCE_KEY, sheets, 'nstp-workflow-attendance-updated');
export const loadDetailedGrades = () => load(GRADE_KEY, DEMO_GRADES);
export const saveDetailedGrades = (grades: DetailedGrade[]) => save(GRADE_KEY, grades, 'nstp-workflow-grades-updated');
export const loadInterventionNotes = () => load(NOTE_KEY, [] as InterventionNote[]);
export const saveInterventionNotes = (notes: InterventionNote[]) => save(NOTE_KEY, notes, 'nstp-workflow-notes-updated');
export const loadWorkflowNotices = () => load(NOTICE_KEY, DEMO_NOTICES);
export const saveWorkflowNotices = (notices: WorkflowNotice[]) => save(NOTICE_KEY, notices, 'nstp-workflow-notices-updated');
export const loadAuditLog = () => load(AUDIT_KEY, [] as AuditEntry[]);
export const saveAuditLog = (logs: AuditEntry[]) => save(AUDIT_KEY, logs.slice(0, 250), 'nstp-workflow-audit-updated');

export function loadGradingSettings(): GradingSettings {
  ensureWorkflowSeedData();
  return safeJsonParse(localStorage.getItem(SETTINGS_KEY), DEFAULT_SETTINGS);
}
export function saveGradingSettings(settings: GradingSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  window.dispatchEvent(new CustomEvent('nstp-workflow-settings-updated'));
}

export function addAudit(actor: { id: string; name: string; role: string }, action: string, recordType: string, recordId: string, detail: string) {
  const row: AuditEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action,
    recordType,
    recordId,
    detail,
    at: new Date().toISOString(),
  };
  saveAuditLog([row, ...loadAuditLog()]);
}

export function finalGrade(grade: DetailedGrade, settings = loadGradingSettings()) {
  if (settings.allowOverride && grade.overrideFinal !== null) return grade.overrideFinal;
  const required = [grade.assessments, grade.attendance, grade.activities, grade.participation, grade.majorExam];
  if (required.some((value) => value === null)) return null;
  return Math.round(
    Number(grade.attendance) * settings.attendance / 100 +
    Number(grade.assessments) * settings.assessments / 100 +
    Number(grade.activities) * settings.activities / 100 +
    Number(grade.participation) * settings.participation / 100 +
    Number(grade.majorExam) * settings.majorExam / 100,
  );
}

export function studentAttendance(studentId: string) {
  return loadAttendanceSheets()
    .map((sheet) => ({ sheet, entry: sheet.entries.find((entry) => entry.studentId === studentId) }))
    .filter((row) => Boolean(row.entry));
}

export function commonPhaseProgress(studentId: string) {
  const rows = studentAttendance(studentId).filter(({ sheet }) => sheet.phase === 'Common Phase');
  const attended = rows.filter(({ entry }) => entry?.status === 'present' || entry?.status === 'late' || entry?.status === 'excused');
  const sessionMap = new Map(loadSessions().map((session) => [session.id, session]));
  const completedHours = attended.reduce((total, { sheet }) => total + (sessionMap.get(sheet.sessionId)?.duration || 0), 0);
  const percentage = rows.length ? Math.round((attended.length / rows.length) * 100) : 0;
  const remainingHours = Math.max(0, 25 - completedHours);
  const grade = loadDetailedGrades().find((value) => value.studentId === studentId);
  const assessmentsReady = Boolean(grade?.assessments && grade.assessments >= 75);
  const status: EligibilityStatus = completedHours >= 25 && percentage >= 80 && assessmentsReady
    ? 'Eligible for Component Classification'
    : completedHours >= 18
      ? 'Near Completion'
      : 'Not Eligible';
  return { completedHours, remainingHours, attendancePercentage: percentage, status, rows };
}

export function allStudentProgress() {
  return loadStudents().map((student) => ({ student, progress: commonPhaseProgress(student.id) }));
}

export function scopedSheetsForFacilitator(facilitatorId: string) {
  return loadAttendanceSheets().filter((sheet) => sheet.facilitatorId === facilitatorId);
}

export function workflowNoticesForStudent(studentId: string) {
  const student = loadStudents().find((value) => value.id === studentId);
  return loadWorkflowNotices().filter((notice) => {
    if (notice.status !== 'Published' || notice.audience !== 'student') return false;
    const municipalityOk = notice.municipality === 'All' || notice.municipality === student?.municipality;
    const componentOk = notice.component === 'All' || notice.component === 'Common' || notice.component === student?.component;
    return municipalityOk && componentOk;
  });
}

export function workflowSummary() {
  const students = loadStudents();
  const accounts = loadAccounts();
  const attendance = loadAttendanceSheets();
  const grades = loadDetailedGrades();
  const sessions = loadSessions();
  const completedSheets = attendance.filter((sheet) => sheet.status === 'Complete' || sheet.status === 'Completed' || sheet.status === 'Submitted').length;
  return {
    students: students.length,
    facilitators: accounts.filter((account) => account.role === 'facilitator').length,
    sessions: sessions.length,
    attendanceCompletion: sessions.length ? Math.round((completedSheets / sessions.length) * 100) : 0,
    gradeRelease: grades.length ? Math.round((grades.filter((grade) => grade.status === 'Released').length / grades.length) * 100) : 0,
    eligible: allStudentProgress().filter(({ progress }) => progress.status === 'Eligible for Component Classification').length,
  };
}
