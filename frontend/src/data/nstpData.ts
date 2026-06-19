export type NstpRole = 'admin' | 'student' | 'facilitator';
export type NstpComponent = 'CWTS' | 'LTS' | 'MTS (Army)' | 'MTS (Navy)' | 'CWTS (Coast Guard)';
export type BiliranMunicipality = 'Almeria' | 'Biliran' | 'Cabucgayan' | 'Caibiran' | 'Culaba' | 'Kawayan' | 'Maripipi' | 'Naval';

export type NstpAccount = {
  id: string;
  name: string;
  studentId?: string;
  surname?: string;
  firstName?: string;
  middleName?: string;
  email: string;
  password: string;
  role: NstpRole;
  school?: string;
  department?: string;
  degreeProgram?: string;
  yearLevel?: string;
  major?: string;
  gender?: string;
  birthdate?: string;
  houseStreetPurok?: string;
  barangay?: string;
  province?: string;
  currentAddress?: string;
  cityAddress?: string;
  provincialAddress?: string;
  contactNumber?: string;
  title?: string;
  bio?: string;
  municipalities?: BiliranMunicipality[];
  municipality?: BiliranMunicipality;
  generalEducationComplete?: boolean;
  preferredComponent?: NstpComponent;
  examTaken?: boolean;
  examScore?: number;
  component?: NstpComponent;
  componentAccessStatus?: string;
};

export type PendingStudentRegistration = {
  id: string;
  studentId?: string;
  surname?: string;
  firstName?: string;
  middleName?: string;
  name: string;
  email: string;
  password: string;
  school?: string;
  department?: string;
  degreeProgram?: string;
  yearLevel?: string;
  major?: string;
  gender?: string;
  birthdate?: string;
  houseStreetPurok?: string;
  barangay?: string;
  province?: string;
  currentAddress?: string;
  cityAddress?: string;
  provincialAddress?: string;
  contactNumber?: string;
  municipality?: BiliranMunicipality;
  createdAt: string;
};

export type NstpQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
};

export type NstpAssessment = {
  id: string;
  title: string;
  type: 'quiz' | 'exam' | 'seminar';
  description: string;
  moduleId?: string;
  timeLimit: number;
  passingScore: number;
  questionsToShow: number;
  ownerId: string;
  ownerName: string;
  ownerRole: 'admin' | 'facilitator';
  status: 'draft' | 'published';
  questions: NstpQuestion[];
  updatedAt: string;
};

export type NstpModule = {
  id: string;
  title: string;
  description: string;
  component?: NstpComponent | 'Common';
  courseCode?: string;
  semester?: string;
  schoolYear?: string;
  sourceDocument?: string;
  outcomes?: string[];
  hours: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  videoUrl?: string;
  meetingLink?: string;
  documentLink?: string;
  speaker?: string;
  speakerPosition?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  updatedAt: string;
};

export type NstpStudent = {
  id: string;
  studentId?: string;
  surname?: string;
  firstName?: string;
  middleName?: string;
  name: string;
  email: string;
  school?: string;
  department?: string;
  degreeProgram?: string;
  yearLevel?: string;
  major?: string;
  gender?: string;
  birthdate?: string;
  houseStreetPurok?: string;
  barangay?: string;
  province?: string;
  currentAddress?: string;
  cityAddress?: string;
  provincialAddress?: string;
  contactNumber?: string;
  component: NstpComponent;
  municipality?: BiliranMunicipality;
  programSection?: string;
  trainingGroupId?: string;
  facilitatorId?: string;
  facilitatorName?: string;
  progress: number;
  assessments: number;
  status: 'active' | 'pending' | 'graduated';
  notes: string;
  updatedAt: string;
};

export type NstpTrainingGroup = {
  id: string;
  schoolYear: string;
  semester: string;
  component: NstpComponent;
  facilitatorName: string;
  facilitatorId?: string;
  programHandles: string[];
  municipality?: BiliranMunicipality;
  studentCount: number;
  maxRecommendedLoad: number;
  sourceDocument: string;
};

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export type NstpAttendanceRecord = {
  id: string;
  studentId: string;
  sessionId: string;
  status: AttendanceStatus;
  facilitatorId: string;
  updatedAt: string;
};

export type NstpAttendanceSession = {
  id: string;
  date: string;
  facilitatorId: string;
  title: string;
  createdAt: string;
};

export type NstpGradeRecord = {
  studentId: string;
  prelim: number;
  midterm: number;
  final: number;
  remarks: 'In Progress' | 'Passed' | 'For Completion' | 'Failed';
  released: boolean;
  updatedAt: string;
};

const ACCOUNTS_KEY = 'nstp-accounts';
const ASSESSMENTS_KEY = 'nstp-assessment-library';
const MODULES_KEY = 'nstp-module-library';
const STUDENTS_KEY = 'nstp-student-roster';
const PENDING_REGISTRATIONS_KEY = 'nstp-pending-student-registrations';
const GRADES_KEY = 'nstp-grade-records';
const TRAINING_GROUPS_KEY = 'nstp-training-groups';
const ATTENDANCE_RECORDS_KEY = 'nstp-attendance-records';
const ATTENDANCE_SESSIONS_KEY = 'nstp-attendance-sessions';
export const QUALIFYING_RESULTS_KEY = 'qualifyingExamResults';
export const COMPONENT_APPLICATION_STATE_KEY = 'nstp-component-application-state';
const AUDIT_LOG_KEY = 'nstp-admin-audit-log';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

async function apiGet<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${path}`);
    if (!response.ok) throw new Error(`API ${response.status}`);
    return await response.json() as T;
  } catch {
    return fallback;
  }
}

async function apiPost<T>(path: string, payload: unknown, fallback: T): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`API ${response.status}`);
    return await response.json() as T;
  } catch {
    return fallback;
  }
}

const API_COLLECTION_MAP: Record<string, string> = {
  [ACCOUNTS_KEY]: 'accounts',
  [STUDENTS_KEY]: 'students',
  [MODULES_KEY]: 'modules',
  [ASSESSMENTS_KEY]: 'assessments',
  [GRADES_KEY]: 'grades',
  [PENDING_REGISTRATIONS_KEY]: 'pending-registrations',
  [TRAINING_GROUPS_KEY]: 'training-groups',
  [ATTENDANCE_RECORDS_KEY]: 'attendance-records',
  [ATTENDANCE_SESSIONS_KEY]: 'attendance-sessions',
  [QUALIFYING_RESULTS_KEY]: 'qualifying-results',
  [COMPONENT_APPLICATION_STATE_KEY]: 'component-state',
  [AUDIT_LOG_KEY]: 'audit-log',
};

async function syncToApi<T>(localKey: string, data: T[]): Promise<void> {
  const collection = API_COLLECTION_MAP[localKey];
  if (!collection || !Array.isArray(data)) return;
  for (const record of data) {
    await apiPost(`/nstp/${collection}`, record, null);
  }
}

async function syncSingleToApi<T>(localKey: string, data: T): Promise<void> {
  const collection = API_COLLECTION_MAP[localKey];
  if (!collection) return;
  await apiPost(`/nstp/${collection}`, data, null);
}

export async function syncCollectionFromApi(localKey: string): Promise<void> {
  const collection = API_COLLECTION_MAP[localKey];
  if (!collection) return;
  if (collection === 'accounts') {
    const apiAccounts = await apiGet<any[]>('/nstp/accounts', []);
    if (apiAccounts.length > 0) {
      const mapped: NstpAccount[] = apiAccounts.map((a: any) => {
        const d = (a.data || {}) as Record<string, unknown>;
        return {
          id: a.id, name: a.name || '', email: a.email || '', password: '',
          role: (a.role || 'student').toLowerCase() as NstpRole,
          studentId: (d.studentId as string) || '',
          surname: d.surname as string, firstName: d.firstName as string,
          middleName: d.middleName as string, school: d.school as string,
          department: d.department as string, degreeProgram: d.degreeProgram as string,
          yearLevel: d.yearLevel as string, major: d.major as string,
          gender: d.gender as string, birthdate: d.birthdate as string,
          houseStreetPurok: d.houseStreetPurok as string, barangay: d.barangay as string,
          province: (d.province as string) || 'Biliran',
          currentAddress: d.currentAddress as string, cityAddress: d.cityAddress as string,
          provincialAddress: d.provincialAddress as string,
          contactNumber: d.contactNumber as string,
          municipality: (d.municipality as BiliranMunicipality) || 'Naval',
        };
      });
      if (mapped.length > 0) {
        const existing = safeJsonParse<NstpAccount[]>(localStorage.getItem(localKey), []);
        const merged = [...existing];
        for (const m of mapped) {
          const idx = merged.findIndex((x) => x.email?.toLowerCase() === m.email?.toLowerCase());
          if (idx >= 0) merged[idx] = { ...merged[idx], ...m, password: merged[idx].password };
          else merged.unshift(m);
        }
        localStorage.setItem(localKey, JSON.stringify(merged));
      }
    }
    return;
  }
  if (collection === 'students') {
    const apiStudents = await apiGet<any[]>('/nstp/students', []);
    if (apiStudents.length > 0) {
      const mapped: NstpStudent[] = apiStudents.map((bs: any) => {
        const userData = bs.user || {};
        const data = (userData.data || {}) as Record<string, unknown>;
        return {
          id: userData.id || bs.id, studentId: bs.studentNumber,
          surname: (data.surname as string) || '', firstName: (data.firstName as string) || '',
          middleName: (data.middleName as string) || '', name: userData.name || '',
          email: userData.email || '', school: (data.school as string) || '',
          department: (data.department as string) || '',
          degreeProgram: bs.course || (data.degreeProgram as string) || '',
          yearLevel: bs.yearLevel || (data.yearLevel as string) || '',
          major: (data.major as string) || '', gender: (data.gender as string) || '',
          birthdate: (data.birthdate as string) || '',
          houseStreetPurok: (data.houseStreetPurok as string) || '',
          barangay: (data.barangay as string) || '',
          province: (data.province as string) || 'Biliran',
          currentAddress: (data.currentAddress as string) || '',
          cityAddress: (data.cityAddress as string) || '',
          provincialAddress: (data.provincialAddress as string) || '',
          contactNumber: (data.contactNumber as string) || '',
          component: (bs.component?.name || 'CWTS') as NstpComponent,
          municipality: (data.municipality as BiliranMunicipality) || 'Naval',
          programSection: (data.degreeProgram as string) || '',
          progress: 0, assessments: 0, status: 'pending' as const,
          notes: 'Imported from server.', updatedAt: new Date().toISOString(),
        };
      });
      if (mapped.length > 0) {
        const existing = safeJsonParse<NstpStudent[]>(localStorage.getItem(localKey), []);
        const merged = [...existing];
        for (const m of mapped) {
          const idx = merged.findIndex((x) => x.studentId === m.studentId || x.email?.toLowerCase() === m.email?.toLowerCase());
          if (idx >= 0) merged[idx] = m;
          else merged.unshift(m);
        }
        localStorage.setItem(localKey, JSON.stringify(merged));
      }
    }
    return;
  }
  const apiData = await apiGet<any[]>(`/nstp/${collection}`, null);
  if (Array.isArray(apiData) && apiData.length > 0) {
    const existing = safeJsonParse<any[]>(localStorage.getItem(localKey), []);
    const merged = [...existing];
    for (const item of apiData) {
      const idx = merged.findIndex((x: any) => x.id === item.id);
      if (idx >= 0) merged[idx] = item;
      else merged.unshift(item);
    }
    localStorage.setItem(localKey, JSON.stringify(merged));
  }
}

export async function syncAllFromApi(): Promise<void> {
  const keys = Object.keys(API_COLLECTION_MAP);
  await Promise.allSettled(keys.map((key) => syncCollectionFromApi(key)));
}
export const NSTP_COMPONENTS: NstpComponent[] = ['CWTS', 'LTS', 'MTS (Army)', 'MTS (Navy)', 'CWTS (Coast Guard)'];
export const BILIRAN_MUNICIPALITIES: BiliranMunicipality[] = ['Almeria', 'Biliran', 'Cabucgayan', 'Caibiran', 'Culaba', 'Kawayan', 'Maripipi', 'Naval'];

export const DEPARTMENTS = [
  'School of Arts and Sciences',
  'School of Criminal Justice Education',
  'School of Management and Entrepreneurship',
  'School of Nursing and Health Sciences',
  'School of Engineering',
  'School of Technology and Computer Studies',
  'School of Teacher Education - Naval Campus',
  'School of Teacher Education - Biliran Campus',
  'School of Agri-Fisheries',
  'School of Agribusiness and Forest Resource Management',
  'School of Graduate Studies',
];

export const COURSES = [
  'BS Information Technology',
  'BS Computer Science',
  'BS Civil Engineering',
  'BS Electrical Engineering',
  'BS Mechanical Engineering',
  'BS Computer Engineering',
  'BS Criminology',
  'BS Hospitality Management',
  'BS Business Administration',
  'BS Business Administration major in Financial Management',
  'BS Elementary Education',
  'BS Secondary Education',
  'BS Nursing',
  'BS Agriculture',
  'BA Economics',
  'BS Information Systems',
];

export const BIPSU_PROGRAMS = [
  {
    school: 'School of Arts and Sciences',
    programs: ['Bachelor of Arts in Communication', 'Bachelor of Science in Biology', 'Bachelor of Science in Economics'],
  },
  {
    school: 'School of Criminal Justice Education',
    programs: ['Bachelor of Science in Criminology'],
  },
  {
    school: 'School of Management and Entrepreneurship',
    programs: ['Bachelor of Science in Business Administration', 'Bachelor of Science in Hospitality Management', 'Bachelor of Science in Tourism Management'],
  },
  {
    school: 'School of Nursing and Health Sciences',
    programs: ['Bachelor of Science in Nursing', 'Bachelor of Science in Public Health'],
  },
  {
    school: 'School of Engineering',
    programs: ['Bachelor of Science in Civil Engineering', 'Bachelor of Science in Computer Engineering', 'Bachelor of Science in Electrical Engineering', 'Bachelor of Science in Mechanical Engineering'],
  },
  {
    school: 'School of Technology and Computer Studies',
    programs: ['Bachelor of Science in Computer Science', 'Bachelor of Science in Information Systems', 'BS in Industrial Technology'],
  },
  {
    school: 'School of Teacher Education - Naval Campus',
    programs: ['Bachelor of Early Childhood Education', 'Bachelor of Elementary Education', 'Bachelor of Physical Education', 'Bachelor of Secondary Education', 'Bachelor of Special Needs Education', 'Bachelor of Technology & Livelihood Education'],
  },
];

export const YEAR_LEVEL_OPTIONS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
export const INDUSTRIAL_TECHNOLOGY_PROGRAM = 'BS in Industrial Technology';
export const INDUSTRIAL_TECHNOLOGY_MAJORS = [
  'Automotive Technology',
  'Architectural Drafting Technology',
  'Electrical Technology',
  'Electronics Technology',
  'Culinary Technology',
  'Apparel and Fashion Design Technology',
  'HVAC-R Technology',
];

export const SECONDARY_EDUCATION_PROGRAM = 'Bachelor of Secondary Education';
export const SECONDARY_EDUCATION_MAJORS = [
  'English',
  'Mathematics',
  'Science',
  'Social Studies',
  'Filipino',
];

export type QualifyingExamResult = {
  userId: string;
  userName: string;
  userEmail: string;
  preferredComponent: NstpComponent;
  score: number;
  timestamp: string;
  assignedComponent?: NstpComponent | null;
  rank?: number;
  status?: 'assigned-preferred' | 'assigned-alternative' | 'manual-approved' | 'filled-preferred' | 'filled-alternative' | 'waitlisted' | 'not-qualified';
  adminOverride?: boolean;
};

export type ComponentApplicationState = {
  slotLimits: Record<NstpComponent, number>;
  qualifyingScore: number;
  applicationClosed: boolean;
  updatedAt?: string;
};

export const DEFAULT_COMPONENT_APPLICATION_STATE: ComponentApplicationState = {
  slotLimits: {
    CWTS: 600,
    LTS: 400,
    'MTS (Army)': 300,
    'MTS (Navy)': 200,
    'CWTS (Coast Guard)': 250,
  },
  qualifyingScore: 70,
  applicationClosed: false,
};

const now = () => new Date().toISOString();



export function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

const DEFAULT_ACCOUNTS: NstpAccount[] = [
  {
    id: 'admin-1',
    name: 'Administrator',
    email: 'bipsu_nstp_admin',
    password: 'bipsu_nstp2026',
    role: 'admin',
  },
];

const SEED_MODULES: NstpModule[] = [
  {
    id: 'sem1', title: 'Seminar 1: Introduction to National Service', description: 'Overview of NSTP, its legal basis, and the role of civic consciousness in nation-building.',
    component: 'Common', hours: 3, difficulty: 'Beginner', speaker: 'Dr. Reynold Garcia Bustillo', speakerPosition: 'NSTP Program Director',
    scheduledDate: '2026-04-25', scheduledTime: '9:00 AM - 12:00 PM', updatedAt: '2026-04-01T00:00:00.000Z',
  },
  {
    id: 'sem2', title: 'Seminar 2: Philippine Constitution and Citizenship', description: 'Understanding constitutional rights, duties, and responsibilities of Filipino citizens.',
    component: 'Common', hours: 3, difficulty: 'Beginner', speaker: 'Atty. Carlos Reyes', speakerPosition: 'Constitutional Law Expert',
    scheduledDate: '2026-04-26', scheduledTime: '1:00 PM - 4:00 PM', updatedAt: '2026-04-01T00:00:00.000Z',
  },
  {
    id: 'sem3', title: 'Seminar 3: Community Development Strategies', description: 'Participatory approaches to community needs assessment and sustainable development.',
    component: 'Common', hours: 3, difficulty: 'Beginner', speaker: 'Engr. Ramon Torres', speakerPosition: 'Community Development Specialist',
    scheduledDate: '2026-04-28', scheduledTime: '9:00 AM - 12:00 PM', updatedAt: '2026-04-01T00:00:00.000Z',
  },
  {
    id: 'sem4', title: 'Seminar 4: Leadership and Ethics', description: 'Developing ethical leadership, effective communication, and team collaboration skills.',
    component: 'Common', hours: 3, difficulty: 'Beginner', speaker: 'Dr. Anna Marie Cruz', speakerPosition: 'Leadership Development Coach',
    scheduledDate: '2026-04-29', scheduledTime: '2:00 PM - 5:00 PM', updatedAt: '2026-04-01T00:00:00.000Z',
  },
  {
    id: 'sem5', title: 'Seminar 5: Disaster Risk Reduction and Management', description: 'Emergency preparedness, response protocols, and community-based disaster management.',
    component: 'Common', hours: 4, difficulty: 'Intermediate', speaker: 'Col. Jose Villanueva (Ret.)', speakerPosition: 'DRRM Coordinator',
    scheduledDate: '2026-05-02', scheduledTime: '8:00 AM - 12:00 PM', updatedAt: '2026-04-01T00:00:00.000Z',
  },
  {
    id: 'sem6', title: 'Seminar 6: Public Health and Wellness', description: 'Health promotion, disease prevention, and mental health awareness in communities.',
    component: 'Common', hours: 3, difficulty: 'Beginner', speaker: 'Dr. Sofia Mendoza', speakerPosition: 'Public Health Officer',
    scheduledDate: '2026-05-05', scheduledTime: '1:00 PM - 4:00 PM', updatedAt: '2026-04-01T00:00:00.000Z',
  },
  {
    id: 'sem7', title: 'Seminar 7: Environmental Conservation', description: 'Climate change, waste management, and sustainable environmental practices.',
    component: 'Common', hours: 3, difficulty: 'Intermediate', speaker: 'Dr. Miguel Garcia', speakerPosition: 'Environmental Scientist',
    scheduledDate: '2026-05-07', scheduledTime: '9:00 AM - 12:00 PM', updatedAt: '2026-04-01T00:00:00.000Z',
  },
  {
    id: 'sem8', title: 'Seminar 8: Service Learning and Reflection', description: 'Integrating learning with community service, reflection, and documentation.',
    component: 'Common', hours: 3, difficulty: 'Beginner', speaker: 'Prof. Isabel Fernandez', speakerPosition: 'Service Learning Coordinator',
    scheduledDate: '2026-05-09', scheduledTime: '2:00 PM - 5:00 PM', updatedAt: '2026-04-01T00:00:00.000Z',
  },
];

export function ensureNstpSeedData() {
  if (typeof window === 'undefined') return;

  if (!localStorage.getItem(ACCOUNTS_KEY)) {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(DEFAULT_ACCOUNTS));
  } else {
    const stored = safeJsonParse<NstpAccount[]>(localStorage.getItem(ACCOUNTS_KEY), []);
    const defaultAdmin = DEFAULT_ACCOUNTS[0];
    const adminIndex = stored.findIndex((a) => a.role === 'admin');
    if (adminIndex >= 0) {
      stored[adminIndex] = { ...stored[adminIndex], email: defaultAdmin.email, password: defaultAdmin.password };
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(stored));
    } else {
      stored.unshift(defaultAdmin);
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(stored));
    }
  }
  if (!localStorage.getItem(ASSESSMENTS_KEY)) {
    localStorage.setItem(ASSESSMENTS_KEY, JSON.stringify([]));
  }
  if (!localStorage.getItem(MODULES_KEY)) {
    localStorage.setItem(MODULES_KEY, JSON.stringify([]));
  }
  if (!localStorage.getItem(STUDENTS_KEY)) {
    localStorage.setItem(STUDENTS_KEY, JSON.stringify([]));
  }
  if (!localStorage.getItem(PENDING_REGISTRATIONS_KEY)) {
    localStorage.setItem(PENDING_REGISTRATIONS_KEY, JSON.stringify([]));
  }
  if (!localStorage.getItem(GRADES_KEY)) {
    localStorage.setItem(GRADES_KEY, JSON.stringify([]));
  }
  if (!localStorage.getItem(TRAINING_GROUPS_KEY)) {
    localStorage.setItem(TRAINING_GROUPS_KEY, JSON.stringify([]));
  }
}

export function loadAccounts(): NstpAccount[] {
  if (typeof window === 'undefined') return [];
  ensureNstpSeedData();
  return safeJsonParse<NstpAccount[]>(localStorage.getItem(ACCOUNTS_KEY), []);
}

export function saveAccounts(accounts: NstpAccount[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  window.dispatchEvent(new CustomEvent('nstp-accounts-updated'));
  syncToApi(ACCOUNTS_KEY, accounts);
}

export function loadAssessments(): NstpAssessment[] {
  if (typeof window === 'undefined') return [];
  ensureNstpSeedData();
  return safeJsonParse<NstpAssessment[]>(localStorage.getItem(ASSESSMENTS_KEY), []);
}

export function saveAssessments(assessments: NstpAssessment[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ASSESSMENTS_KEY, JSON.stringify(assessments));
  syncToApi(ASSESSMENTS_KEY, assessments);
}

export function loadModules(): NstpModule[] {
  if (typeof window === 'undefined') return [];
  ensureNstpSeedData();
  return safeJsonParse<NstpModule[]>(localStorage.getItem(MODULES_KEY), []);
}

export function saveModules(modules: NstpModule[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MODULES_KEY, JSON.stringify(modules));
  syncToApi(MODULES_KEY, modules);
}

export function loadStudents(): NstpStudent[] {
  if (typeof window === 'undefined') return [];
  ensureNstpSeedData();
  return safeJsonParse<NstpStudent[]>(localStorage.getItem(STUDENTS_KEY), []);
}

export function saveStudents(students: NstpStudent[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
  window.dispatchEvent(new CustomEvent('nstp-students-updated'));
  syncToApi(STUDENTS_KEY, students);
}

export function loadComponentApplicationState(): ComponentApplicationState {
  if (typeof window === 'undefined') return DEFAULT_COMPONENT_APPLICATION_STATE;

  const saved = safeJsonParse<Partial<ComponentApplicationState>>(localStorage.getItem(COMPONENT_APPLICATION_STATE_KEY), {});
  return {
    ...DEFAULT_COMPONENT_APPLICATION_STATE,
    ...saved,
    slotLimits: {
      ...DEFAULT_COMPONENT_APPLICATION_STATE.slotLimits,
      ...(saved.slotLimits || {}),
    },
    qualifyingScore: typeof saved.qualifyingScore === 'number' ? Math.max(0, Math.min(100, saved.qualifyingScore)) : DEFAULT_COMPONENT_APPLICATION_STATE.qualifyingScore,
    applicationClosed: typeof saved.applicationClosed === 'boolean' ? saved.applicationClosed : DEFAULT_COMPONENT_APPLICATION_STATE.applicationClosed,
  };
}

export function saveComponentApplicationState(state: ComponentApplicationState) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(COMPONENT_APPLICATION_STATE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent('nstp-component-state-updated'));
  syncToApi(COMPONENT_APPLICATION_STATE_KEY, [state]);
}

export function loadQualifyingExamResults(): QualifyingExamResult[] {
  if (typeof window === 'undefined') return [];
  return safeJsonParse<QualifyingExamResult[]>(localStorage.getItem(QUALIFYING_RESULTS_KEY), []);
}

export function saveQualifyingExamResults(results: QualifyingExamResult[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(QUALIFYING_RESULTS_KEY, JSON.stringify(results));
  window.dispatchEvent(new CustomEvent('nstp-qualifying-results-updated'));
  syncToApi(QUALIFYING_RESULTS_KEY, results);
}

const hasStudentPortalAccess = (result: QualifyingExamResult) => {
  return Boolean(
    result.assignedComponent &&
    result.status &&
    !['waitlisted', 'not-qualified'].includes(result.status),
  );
};

export function syncStudentAccessFromQualifyingResult(result: QualifyingExamResult) {
  if (typeof window === 'undefined' || !hasStudentPortalAccess(result)) return;

  const component = result.assignedComponent as NstpComponent;
  const accounts = loadAccounts();
  const nextAccounts = accounts.map((account) => (
    account.id === result.userId
      ? {
          ...account,
          generalEducationComplete: true,
          preferredComponent: result.preferredComponent,
          examTaken: true,
          examScore: result.score,
          component,
          componentAccessStatus: result.status,
        }
      : account
  ));
  saveAccounts(nextAccounts);

  const students = loadStudents();
  const existingStudent = students.find((student) => student.id === result.userId || student.email.toLowerCase() === result.userEmail.toLowerCase());
  const nextStudent: NstpStudent = {
    ...(existingStudent || createEmptyStudent()),
    id: result.userId,
    name: result.userName,
    email: result.userEmail,
    component,
    status: 'active',
    updatedAt: now(),
  };

  const nextStudents = existingStudent
    ? students.map((student) => (student.id === existingStudent.id ? nextStudent : student))
    : [nextStudent, ...students];

  saveStudents(nextStudents);

  const currentUser = safeJsonParse<NstpAccount | null>(localStorage.getItem('nstpUser'), null);
  if (currentUser?.id === result.userId) {
    const updatedUser = nextAccounts.find((account) => account.id === result.userId) || currentUser;
    localStorage.setItem('nstpUser', JSON.stringify(updatedUser));
    window.dispatchEvent(new CustomEvent('nstp-current-user-updated', { detail: updatedUser }));
  }
}

export function syncStudentAccessFromQualifyingResults(results: QualifyingExamResult[] = loadQualifyingExamResults()) {
  results.forEach(syncStudentAccessFromQualifyingResult);
}

export function autoAssignQualifyingResult(result: QualifyingExamResult, existingResults: QualifyingExamResult[] = loadQualifyingExamResults()) {
  const state = loadComponentApplicationState();
  const preferred = result.preferredComponent;
  const assignedToPreferred = existingResults.filter((row) => (
    row.userId !== result.userId &&
    row.assignedComponent === preferred &&
    row.status &&
    !['waitlisted', 'not-qualified'].includes(row.status)
  )).length;
  const preferredSlots = state.slotLimits[preferred] ?? 0;
  const passed = result.score >= state.qualifyingScore;

  if (passed && assignedToPreferred < preferredSlots) {
    return {
      ...result,
      assignedComponent: preferred,
      rank: assignedToPreferred + 1,
      status: 'assigned-preferred' as const,
    };
  }

  return {
    ...result,
    assignedComponent: null,
    rank: undefined,
    status: passed ? 'waitlisted' as const : 'not-qualified' as const,
  };
}

export function loadPendingStudentRegistrations(): PendingStudentRegistration[] {
  if (typeof window === 'undefined') return [];
  ensureNstpSeedData();
  return safeJsonParse<PendingStudentRegistration[]>(localStorage.getItem(PENDING_REGISTRATIONS_KEY), []);
}

export function savePendingStudentRegistrations(registrations: PendingStudentRegistration[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PENDING_REGISTRATIONS_KEY, JSON.stringify(registrations));
  syncToApi(PENDING_REGISTRATIONS_KEY, registrations);
}

export function loadGradeRecords(): NstpGradeRecord[] {
  if (typeof window === 'undefined') return [];
  ensureNstpSeedData();
  return safeJsonParse<NstpGradeRecord[]>(localStorage.getItem(GRADES_KEY), []);
}

export function saveGradeRecords(records: NstpGradeRecord[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(GRADES_KEY, JSON.stringify(records));
  syncToApi(GRADES_KEY, records);
}

export function loadAttendanceRecords(): NstpAttendanceRecord[] {
  if (typeof window === 'undefined') return [];
  return safeJsonParse<NstpAttendanceRecord[]>(localStorage.getItem(ATTENDANCE_RECORDS_KEY), []);
}

export function saveAttendanceRecords(records: NstpAttendanceRecord[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ATTENDANCE_RECORDS_KEY, JSON.stringify(records));
  syncToApi(ATTENDANCE_RECORDS_KEY, records);
}

export function loadAttendanceSessions(): NstpAttendanceSession[] {
  if (typeof window === 'undefined') return [];
  return safeJsonParse<NstpAttendanceSession[]>(localStorage.getItem(ATTENDANCE_SESSIONS_KEY), []);
}

export function saveAttendanceSessions(sessions: NstpAttendanceSession[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ATTENDANCE_SESSIONS_KEY, JSON.stringify(sessions));
  syncToApi(ATTENDANCE_SESSIONS_KEY, sessions);
}

export function loadTrainingGroups(): NstpTrainingGroup[] {
  if (typeof window === 'undefined') return [];
  ensureNstpSeedData();
  return safeJsonParse<NstpTrainingGroup[]>(localStorage.getItem(TRAINING_GROUPS_KEY), []);
}

export function saveTrainingGroups(groups: NstpTrainingGroup[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TRAINING_GROUPS_KEY, JSON.stringify(groups));
  window.dispatchEvent(new CustomEvent('nstp-training-groups-updated'));
  syncToApi(TRAINING_GROUPS_KEY, groups);
}

export function createEmptyStudent(): NstpStudent {
  return {
    id: `student-${Math.random().toString(36).slice(2, 10)}`,
    studentId: `2026-${Math.floor(1000 + Math.random() * 8999)}`,
    surname: '',
    firstName: '',
    middleName: '',
    name: 'New Student',
    email: `student-${Math.random().toString(36).slice(2, 5)}@university.edu`,
    degreeProgram: '',
    yearLevel: '',
    major: '',
    gender: '',
    birthdate: '',
    houseStreetPurok: '',
    barangay: '',
    province: 'Biliran',
    currentAddress: '',
    cityAddress: '',
    provincialAddress: '',
    contactNumber: '',
    component: 'CWTS',
    municipality: 'Naval',
    progress: 0,
    assessments: 0,
    status: 'pending',
    notes: '',
    updatedAt: now(),
  };
}

export function createEmptyModule(): NstpModule {
  return {
    id: `module-${Math.random().toString(36).slice(2, 10)}`,
    title: 'Untitled Module',
    description: '',
    component: 'Common',
    hours: 3,
    difficulty: 'Beginner',
    documentLink: '',
    speaker: '',
    speakerPosition: '',
    scheduledDate: '',
    scheduledTime: '',
    updatedAt: now(),
  };
}

export function createEmptyAssessment(owner: NstpAccount, overrides: Partial<NstpAssessment> = {}): NstpAssessment {
  const questions = overrides.questions || [
    { id: `q-${Math.random().toString(36).slice(2, 9)}`, prompt: 'New question prompt', options: ['Option A', 'Option B', 'Option C', 'Option D'], correctIndex: 0 },
  ];
  return {
    id: `asmt-${Math.random().toString(36).slice(2, 10)}`,
    title: overrides.title || 'Untitled Assessment',
    type: overrides.type || 'quiz',
    description: overrides.description || '',
    moduleId: overrides.moduleId || 'm1',
    timeLimit: overrides.timeLimit || 15,
    passingScore: overrides.passingScore || 70,
    questionsToShow: overrides.questionsToShow || questions.length,
    ownerId: owner.id,
    ownerName: owner.name,
    ownerRole: owner.role === 'facilitator' ? 'facilitator' : 'admin',
    status: overrides.status || 'draft',
    updatedAt: now(),
    questions,
  };
}
