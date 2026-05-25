export type NstpRole = 'admin' | 'student' | 'facilitator';
export type NstpComponent = 'CWTS' | 'LTS' | 'MTS (Army)' | 'MTS (Navy)';
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
  ownerId: string;
  ownerName: string;
  ownerRole: 'admin' | 'facilitator';
  status: 'draft' | 'published';
  questions: NstpQuestion[];
  updatedAt: string;
};

export type NstpModuleSection = {
  id: string;
  type: 'video' | 'reading' | 'lesson';
  title: string;
  duration: string;
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
  sections: NstpModuleSection[];
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
export const QUALIFYING_RESULTS_KEY = 'qualifyingExamResults';
export const COMPONENT_APPLICATION_STATE_KEY = 'nstp-component-application-state';
export const NSTP_COMPONENTS: NstpComponent[] = ['CWTS', 'LTS', 'MTS (Army)', 'MTS (Navy)'];
export const BILIRAN_MUNICIPALITIES: BiliranMunicipality[] = ['Almeria', 'Biliran', 'Cabucgayan', 'Caibiran', 'Culaba', 'Kawayan', 'Maripipi', 'Naval'];

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
  },
  qualifyingScore: 70,
  applicationClosed: false,
};

const now = () => new Date().toISOString();

const DUMMY_FIRST_NAMES = [
  'Aira',
  'Benjie',
  'Christine',
  'Daniel',
  'Elaine',
  'Francis',
  'Grace',
  'Harold',
  'Ivy',
  'Jerome',
  'Kimberly',
  'Lester',
  'Mariel',
  'Nathan',
  'Olivia',
  'Paolo',
  'Queenie',
  'Rafael',
  'Shaira',
  'Tristan',
  'Ursula',
  'Vincent',
  'Wendy',
  'Xander',
  'Yasmine',
  'Zachary',
];

const DUMMY_LAST_NAMES = [
  'Abad',
  'Bautista',
  'Cabrera',
  'Domingo',
  'Espina',
  'Flores',
  'Gonzales',
  'Hernandez',
  'Ilagan',
  'Javier',
  'Lazaro',
  'Mendoza',
  'Navarro',
  'Ocampo',
  'Perez',
  'Quintos',
  'Ramos',
  'Salazar',
  'Tolentino',
  'Villanueva',
];

const DUMMY_PROGRAMS = [
  'BS Information Technology',
  'BS Criminology',
  'BS Hospitality Management',
  'BS Business Administration',
  'BS Civil Engineering',
  'BS Education',
  'BS Nursing',
  'BS Computer Science',
];

function createDummyStudents(startNumber = 7, total = 50): NstpStudent[] {
  return Array.from({ length: total }, (_, index) => {
    const sequence = startNumber + index;
    const firstName = DUMMY_FIRST_NAMES[index % DUMMY_FIRST_NAMES.length];
    const lastName = DUMMY_LAST_NAMES[index % DUMMY_LAST_NAMES.length];
    const component = NSTP_COMPONENTS[index % NSTP_COMPONENTS.length];
    const municipality = BILIRAN_MUNICIPALITIES[index % BILIRAN_MUNICIPALITIES.length];
    const progress = 54 + ((index * 7) % 45);
    const status = progress < 65 ? 'pending' : index % 17 === 0 ? 'graduated' : 'active';

    return {
      id: `student-${sequence}`,
      studentId: `2024-${String(1000 + sequence).padStart(4, '0')}`,
      surname: lastName,
      firstName,
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${sequence}@student.bipsu.edu.ph`,
      school: 'Biliran Province State University',
      department: 'NSTP Department',
      degreeProgram: DUMMY_PROGRAMS[index % DUMMY_PROGRAMS.length],
      gender: index % 2 === 0 ? 'Female' : 'Male',
      barangay: `Barangay ${1 + (index % 12)}`,
      province: 'Biliran',
      currentAddress: `${municipality}, Biliran`,
      contactNumber: `09${String(170000000 + index).padStart(9, '0')}`,
      component,
      municipality,
      programSection: `${DUMMY_PROGRAMS[index % DUMMY_PROGRAMS.length].replace(/^BS /, '')} 1${String.fromCharCode(65 + (index % 4))}`,
      facilitatorId: 'facilitator-1',
      facilitatorName: 'Dr. Maria Elena Santos',
      progress,
      assessments: 3 + (index % 7),
      status,
      notes: status === 'pending' ? 'Needs follow-up on pending NSTP requirements.' : 'Generated demo student for roster, reports, and grade testing.',
      updatedAt: now(),
    };
  });
}

function createDummyGrades(startNumber = 7, total = 50): NstpGradeRecord[] {
  return Array.from({ length: total }, (_, index) => {
    const sequence = startNumber + index;
    const prelim = 72 + ((index * 5) % 25);
    const midterm = 70 + ((index * 7) % 27);
    const final = index % 6 === 0 ? 0 : 71 + ((index * 9) % 26);
    const average = final > 0 ? (prelim + midterm + final) / 3 : (prelim + midterm) / 2;

    return {
      studentId: `2024-${String(1000 + sequence).padStart(4, '0')}`,
      prelim,
      midterm,
      final,
      remarks: final === 0 ? 'In Progress' : average >= 75 ? 'Passed' : 'For Completion',
      released: index % 4 !== 0,
      updatedAt: now(),
    };
  });
}

export function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

const createQuestion = (prompt: string, options: string[], correctIndex: number): NstpQuestion => ({
  id: `q-${Math.random().toString(36).slice(2, 9)}`,
  prompt,
  options,
  correctIndex,
});

const DEFAULT_ACCOUNTS: NstpAccount[] = [
  {
    id: 'admin-1',
    name: 'Administrator',
    email: 'admin@nstp.edu',
    password: 'admin',
    role: 'admin',
  },
  {
    id: 'facilitator-1',
    name: 'Dr. Maria Elena Santos',
    email: 'facilitator@nstp.edu',
    password: 'facilitator',
    role: 'facilitator',
    title: 'Municipal NSTP Facilitator',
    bio: 'Facilitates NSTP students assigned to Naval and coordinates enrollment, progress, and grade inputs.',
    municipalities: ['Naval'],
  },
  {
    id: 'student-demo-1',
    studentId: '2024-0001',
    name: 'Juan Dela Cruz',
    email: 'juan.dela-cruz@student.edu',
    password: 'student',
    role: 'student',
    generalEducationComplete: true,
    preferredComponent: 'MTS (Army)',
    examTaken: true,
    examScore: 92,
    component: 'MTS (Army)',
  },
];

const DEFAULT_ASSESSMENTS: NstpAssessment[] = [
  {
    id: 'asmt-nstp-intro',
    title: 'Module 1 Quiz: Introduction to NSTP',
    type: 'quiz',
    description: 'Assess understanding of NSTP history, legal basis, and civic purpose.',
    moduleId: 'm1',
    timeLimit: 15,
    passingScore: 70,
    ownerId: 'admin-1',
    ownerName: 'Administrator',
    ownerRole: 'admin',
    status: 'published',
    updatedAt: now(),
    questions: [
      createQuestion('What does NSTP stand for?', ['National Service Training Program', 'National Student Training Program', 'National Security Training Program', 'National Service Teaching Program'], 0),
      createQuestion('What is NSTP intended to develop?', ['Civic consciousness and defense preparedness', 'Purely academic ranking', 'Commercial skills only', 'Sports performance only'], 0),
      createQuestion('How many major NSTP components are recognized?', ['2', '3', '4', '5'], 1),
    ],
  },
  {
    id: 'asmt-citizenship',
    title: 'Module 2 Quiz: Citizenship Training',
    type: 'quiz',
    description: 'Review civic rights, responsibilities, and Philippine citizenship.',
    moduleId: 'm2',
    timeLimit: 15,
    passingScore: 70,
    ownerId: 'facilitator-1',
    ownerName: 'Dr. Maria Elena Santos',
    ownerRole: 'facilitator',
    status: 'published',
    updatedAt: now(),
    questions: [
      createQuestion('Which is the best example of civic responsibility?', ['Ignoring community needs', 'Participating in local clean-ups', 'Avoiding public service', 'Refusing to vote'], 1),
      createQuestion('Citizenship includes which of the following?', ['Rights only', 'Responsibilities only', 'Both rights and responsibilities', 'None of the above'], 2),
      createQuestion('Why is civic awareness important?', ['It reduces communication', 'It encourages informed participation', 'It removes accountability', 'It replaces leadership'], 1),
    ],
  },
  {
    id: 'asmt-drrm',
    title: 'Module 5 Quiz: Disaster Risk Reduction',
    type: 'quiz',
    description: 'Check preparedness, response, and recovery concepts for communities.',
    moduleId: 'm5',
    timeLimit: 20,
    passingScore: 70,
    ownerId: 'admin-1',
    ownerName: 'Administrator',
    ownerRole: 'admin',
    status: 'draft',
    updatedAt: now(),
    questions: [
      createQuestion('DRRM stands for:', ['Disaster Risk Reduction and Management', 'Disaster Response and Recovery Management', 'Defense Risk Response Mechanism', 'Disaster Relief and Rescue Mission'], 0),
      createQuestion('Preparedness is most effective when it is:', ['Random', 'Community-based', 'Isolated', 'Unplanned'], 1),
      createQuestion('Which action is part of mitigation?', ['Mapping hazards', 'Ignoring evacuation plans', 'Removing signage', 'Delaying response'], 0),
    ],
  },
  {
    id: 'asmt-community-development',
    title: 'Module 3 Quiz: Community Development',
    type: 'quiz',
    description: 'Checks readiness for community profiling, needs assessment, and service planning.',
    moduleId: 'm3',
    timeLimit: 20,
    passingScore: 70,
    ownerId: 'facilitator-1',
    ownerName: 'Dr. Maria Elena Santos',
    ownerRole: 'facilitator',
    status: 'published',
    updatedAt: now(),
    questions: [
      createQuestion('What is the first step in community development planning?', ['Project launch', 'Needs assessment', 'Final evaluation', 'Fundraising only'], 1),
      createQuestion('Participatory planning means:', ['Only leaders decide', 'Community members help identify needs and actions', 'Students avoid consultation', 'Plans are copied from other areas'], 1),
      createQuestion('A good service project should be:', ['Measurable and community-informed', 'Unscheduled', 'Unrelated to local needs', 'Completed without documentation'], 0),
    ],
  },
  {
    id: 'asmt-leadership-team',
    title: 'Module 4 Quiz: Leadership and Team Building',
    type: 'quiz',
    description: 'Measures leadership, communication, collaboration, and group accountability.',
    moduleId: 'm4',
    timeLimit: 15,
    passingScore: 70,
    ownerId: 'facilitator-1',
    ownerName: 'Dr. Maria Elena Santos',
    ownerRole: 'facilitator',
    status: 'published',
    updatedAt: now(),
    questions: [
      createQuestion('Effective NSTP leadership is best shown by:', ['Listening and coordinating tasks', 'Doing all work alone', 'Avoiding feedback', 'Ignoring team roles'], 0),
      createQuestion('Which improves team performance?', ['Clear roles and communication', 'Hidden expectations', 'No schedule', 'No reflection'], 0),
      createQuestion('Conflict in a team should be handled through:', ['Respectful dialogue', 'Public blame', 'Silence only', 'Avoiding the task'], 0),
    ],
  },
  {
    id: 'asmt-health-wellness',
    title: 'Module 6 Quiz: Health and Wellness',
    type: 'quiz',
    description: 'Assesses public health awareness, wellness habits, and community health promotion.',
    moduleId: 'm6',
    timeLimit: 15,
    passingScore: 70,
    ownerId: 'admin-1',
    ownerName: 'Administrator',
    ownerRole: 'admin',
    status: 'published',
    updatedAt: now(),
    questions: [
      createQuestion('Health promotion focuses on:', ['Prevention and informed choices', 'Treatment only', 'Ignoring risk factors', 'Individual benefit only'], 0),
      createQuestion('Mental health awareness helps communities by:', ['Reducing stigma and encouraging support', 'Preventing communication', 'Replacing medical care entirely', 'Avoiding referrals'], 0),
      createQuestion('A responsible health campaign should use:', ['Accurate and accessible information', 'Rumors', 'Fear only', 'Unverified claims'], 0),
    ],
  },
  {
    id: 'asmt-environment',
    title: 'Module 7 Quiz: Environmental Conservation',
    type: 'quiz',
    description: 'Evaluates understanding of sustainability, climate action, and waste management.',
    moduleId: 'm7',
    timeLimit: 15,
    passingScore: 70,
    ownerId: 'admin-1',
    ownerName: 'Administrator',
    ownerRole: 'admin',
    status: 'published',
    updatedAt: now(),
    questions: [
      createQuestion('Environmental conservation aims to:', ['Protect resources for present and future communities', 'Increase waste', 'Ignore local ecosystems', 'Use resources without limits'], 0),
      createQuestion('Which is a sustainable practice?', ['Segregating waste and reducing single-use materials', 'Open dumping', 'Burning plastics', 'Wasting water'], 0),
      createQuestion('Climate awareness in NSTP matters because:', ['Communities need preparedness and adaptation', 'It has no local impact', 'It replaces service learning', 'It only affects other countries'], 0),
    ],
  },
  {
    id: 'asmt-final-project',
    title: 'Module 8 Assessment: Final Project and Reflection',
    type: 'quiz',
    description: 'Confirms final project planning, documentation, reflection, and service outcomes.',
    moduleId: 'm8',
    timeLimit: 20,
    passingScore: 75,
    ownerId: 'facilitator-1',
    ownerName: 'Dr. Maria Elena Santos',
    ownerRole: 'facilitator',
    status: 'published',
    updatedAt: now(),
    questions: [
      createQuestion('A final NSTP reflection should connect:', ['Experience, learning, and community impact', 'Only attendance', 'Only photos', 'Unrelated opinions'], 0),
      createQuestion('Project documentation should include:', ['Objectives, activities, evidence, and outcomes', 'Only names', 'Only expenses', 'No dates'], 0),
      createQuestion('A strong final project is evaluated by:', ['Relevance, participation, completion, and reflection', 'Popularity only', 'Speed only', 'No feedback'], 0),
    ],
  },
  {
    id: 'exam-common-module-final',
    title: 'Major Examination: NSTP Common Module',
    type: 'exam',
    description: 'Comprehensive major examination covering the 25-hour Common Module sequence.',
    moduleId: 'm8',
    timeLimit: 60,
    passingScore: 75,
    ownerId: 'admin-1',
    ownerName: 'Administrator',
    ownerRole: 'admin',
    status: 'published',
    updatedAt: now(),
    questions: [
      createQuestion('The Common Module requirement in this system is monitored as:', ['25 contact hours', '10 minutes', 'One activity only', 'No required time'], 0),
      createQuestion('NSTP classification in this system includes:', ['CWTS, LTS, MTS (Army), and MTS (Navy)', 'Only CWTS', 'Only LTS', 'Only MTS Army'], 0),
      createQuestion('Assessments after modules are used to:', ['Check learning and compliance before progression', 'Remove feedback', 'Avoid instructional delivery', 'Replace enrollment'], 0),
      createQuestion('Instructional delivery in the platform may include:', ['Modules, materials, videos, lessons, quizzes, assignments, and exams', 'Only announcements', 'Only reports', 'Only login forms'], 0),
      createQuestion('Student progress should be reviewed to:', ['Identify completion, risk, and intervention needs', 'Hide learning status', 'Prevent advising', 'Avoid reports'], 0),
    ],
  },
];

const DEFAULT_MODULES: NstpModule[] = [
  {
    id: 'm1',
    title: 'Module 1: Introduction to NSTP',
    description: 'Understanding the National Service Training Program, its history, and objectives',
    component: 'Common',
    hours: 3,
    difficulty: 'Beginner',
    updatedAt: now(),
    sections: [
      { id: 's1', type: 'video', title: 'NSTP History and Legal Basis', duration: '15 min' },
      { id: 's2', type: 'reading', title: 'NSTP Components Overview', duration: '20 min' },
      { id: 's3', type: 'lesson', title: 'Program Objectives and Expected Outcomes', duration: '25 min' },
    ],
  },
  {
    id: 'm2',
    title: 'Module 2: Citizenship Training',
    description: 'Rights, responsibilities, and duties of Filipino citizens',
    component: 'Common',
    hours: 3,
    difficulty: 'Beginner',
    updatedAt: now(),
    sections: [
      { id: 's1', type: 'video', title: 'Philippine Constitution and Citizenship', duration: '18 min' },
      { id: 's2', type: 'reading', title: 'Bill of Rights and Human Rights', duration: '22 min' },
      { id: 's3', type: 'lesson', title: 'Civic Duties and Responsibilities', duration: '20 min' },
    ],
  },
  {
    id: 'm3',
    title: 'Module 3: Community Development',
    description: 'Principles and practices of community engagement and development',
    component: 'Common',
    hours: 4,
    difficulty: 'Intermediate',
    updatedAt: now(),
    sections: [
      { id: 's1', type: 'lesson', title: 'Community Needs Assessment', duration: '25 min' },
      { id: 's2', type: 'video', title: 'Participatory Development Approaches', duration: '20 min' },
      { id: 's3', type: 'reading', title: 'Project Planning and Implementation', duration: '30 min' },
    ],
  },
  {
    id: 'm4',
    title: 'Module 4: Leadership and Team Building',
    description: 'Developing leadership skills and collaborative teamwork',
    component: 'Common',
    hours: 3,
    difficulty: 'Intermediate',
    updatedAt: now(),
    sections: [
      { id: 's1', type: 'video', title: 'Leadership Styles and Theories', duration: '20 min' },
      { id: 's2', type: 'lesson', title: 'Effective Communication Skills', duration: '25 min' },
      { id: 's3', type: 'reading', title: 'Team Dynamics and Collaboration', duration: '15 min' },
    ],
  },
  {
    id: 'm5',
    title: 'Module 5: Disaster Risk Reduction',
    description: 'Preparedness, response, and recovery from disasters',
    component: 'Common',
    hours: 4,
    difficulty: 'Advanced',
    updatedAt: now(),
    sections: [
      { id: 's1', type: 'video', title: 'Types of Disasters and Hazards', duration: '18 min' },
      { id: 's2', type: 'lesson', title: 'Emergency Response Protocols', duration: '27 min' },
      { id: 's3', type: 'reading', title: 'Community-Based DRR Planning', duration: '20 min' },
    ],
  },
  {
    id: 'm6',
    title: 'Module 6: Health and Wellness',
    description: 'Promoting health awareness and wellness in communities',
    component: 'Common',
    hours: 3,
    difficulty: 'Intermediate',
    updatedAt: now(),
    sections: [
      { id: 's1', type: 'lesson', title: 'Public Health Fundamentals', duration: '20 min' },
      { id: 's2', type: 'video', title: 'Disease Prevention and Control', duration: '22 min' },
      { id: 's3', type: 'reading', title: 'Mental Health Awareness', duration: '18 min' },
    ],
  },
  {
    id: 'm7',
    title: 'Module 7: Environmental Conservation',
    description: 'Understanding environmental issues and sustainable practices',
    component: 'Common',
    hours: 3,
    difficulty: 'Intermediate',
    updatedAt: now(),
    sections: [
      { id: 's1', type: 'video', title: 'Climate Change and Environmental Challenges', duration: '20 min' },
      { id: 's2', type: 'lesson', title: 'Waste Management and Recycling', duration: '23 min' },
      { id: 's3', type: 'reading', title: 'Sustainable Development Goals', duration: '17 min' },
    ],
  },
  {
    id: 'm8',
    title: 'Module 8: Final Project and Reflection',
    description: 'Integrating learning through community service projects',
    component: 'Common',
    hours: 2,
    difficulty: 'Advanced',
    updatedAt: now(),
    sections: [
      { id: 's1', type: 'lesson', title: 'Community Service Planning', duration: '30 min' },
      { id: 's2', type: 'reading', title: 'Reflection and Documentation', duration: '15 min' },
    ],
  },
  {
    id: 'cwts1-official-syllabus',
    title: 'CWTS 1: Civic Welfare Training Services',
    description: 'Official CWTS 1 syllabus for civic consciousness, social responsibility, good citizenship, DRRM, values development, and community service preparation.',
    component: 'CWTS',
    courseCode: 'NSTP-CWTS 1',
    semester: '1st Semester',
    schoolYear: 'SY 2025-2026',
    sourceDocument: 'SYLLABUS-IN-CWTS 1-FINAL.docx',
    outcomes: [
      'Participate in NSTP orientation and component organization under RA 9163.',
      'Understand good citizenship, DRRM, values development, collaboration, and leadership.',
      'Analyze dimensions of development and apply civic welfare project planning.',
      'Uphold ethical values, inclusivity, volunteerism, and nation-building.',
    ],
    hours: 54,
    difficulty: 'Intermediate',
    updatedAt: now(),
    sections: [
      { id: 'cwts1-w1-2', type: 'lesson', title: 'Weeks 1-2: NSTP Organization, Orientation, and Component Selection', duration: '6 hrs' },
      { id: 'cwts1-w3', type: 'reading', title: 'Week 3: RA 9163 and NSTP Implementing Guidelines', duration: '3 hrs' },
      { id: 'cwts1-w4', type: 'lesson', title: 'Week 4: Good Citizenship and Civic Responsibility', duration: '3 hrs' },
      { id: 'cwts1-w5-6', type: 'lesson', title: 'Weeks 5-6: Values Development, Leadership, and Team Collaboration', duration: '6 hrs' },
      { id: 'cwts1-w7-8', type: 'lesson', title: 'Weeks 7-8: Green Philippines, DRRM, and Environmental Protection', duration: '6 hrs' },
      { id: 'cwts1-w9-10', type: 'lesson', title: 'Weeks 9-10: Self-Awareness, Service, and Community Development', duration: '6 hrs' },
      { id: 'cwts1-w11-13', type: 'lesson', title: 'Weeks 11-13: Community Engagement, Outreach, and Mini Project Planning', duration: '9 hrs' },
      { id: 'cwts1-project', type: 'reading', title: 'Course Requirement: Tree Planting Journal and Community Project Documentation', duration: '15 hrs' },
    ],
  },
  {
    id: 'cwts2-official-syllabus',
    title: 'CWTS 2: Community Immersion and Civic Welfare Project',
    description: 'Official CWTS 2 syllabus for community immersion, community profiling, needs assessment, project proposal, immersion journal, and implementation.',
    component: 'CWTS',
    courseCode: 'NSTP-CWTS 2',
    semester: '2nd Semester',
    schoolYear: 'SY 2025-2026',
    sourceDocument: 'SYLLABUS-IN-CWTS 2-FINAL.docx',
    outcomes: [
      'Participate in community service initiatives that promote social responsibility and national development.',
      'Demonstrate collaboration and leadership in organizing civic welfare projects.',
      'Plan and implement community-based projects addressing health, education, environment, and disaster preparedness.',
      'Maintain ethical, inclusive, and lifelong commitment to civic engagement.',
    ],
    hours: 54,
    difficulty: 'Advanced',
    updatedAt: now(),
    sections: [
      { id: 'cwts2-w1-2', type: 'lesson', title: 'Weeks 1-2: Community Immersion Concepts, Objectives, and Stakeholders', duration: '10 hrs' },
      { id: 'cwts2-w3-4', type: 'lesson', title: 'Weeks 3-4: Community Needs Assessment and Ethical Immersion Practices', duration: '6 hrs' },
      { id: 'cwts2-w5-6', type: 'lesson', title: 'Weeks 5-6: Community Mapping, Profiling, and Activity Identification', duration: '6 hrs' },
      { id: 'cwts2-w7-8', type: 'lesson', title: 'Weeks 7-8: Community Work, Proposal, Letter of Intent, and Immersion Journal', duration: '6 hrs' },
      { id: 'cwts2-final-immersion', type: 'lesson', title: 'Final Examination: Community Immersion Proper', duration: '26 hrs' },
      { id: 'cwts2-project-docs', type: 'reading', title: 'Course Requirement: Immersion Journal, Tree Planting Journal, and Program Evaluation', duration: '6 hrs' },
    ],
  },
];

const DEFAULT_STUDENTS: NstpStudent[] = [
  {
    id: 'student-1',
    studentId: '2024-1001',
    name: 'Maria Santos',
    email: 'maria.santos@university.edu',
    component: 'CWTS',
    municipality: 'Naval',
    facilitatorId: 'facilitator-1',
    facilitatorName: 'Dr. Maria Elena Santos',
    progress: 85,
    assessments: 7,
    status: 'active',
    notes: 'Consistent class participation and timely submissions.',
    updatedAt: now(),
  },
  {
    id: 'student-2',
    studentId: '2024-1002',
    name: 'Juan Dela Cruz',
    email: 'juan.delacruz@university.edu',
    component: 'LTS',
    municipality: 'Naval',
    facilitatorId: 'facilitator-1',
    facilitatorName: 'Dr. Maria Elena Santos',
    progress: 92,
    assessments: 8,
    status: 'active',
    notes: 'Strong performance and ready for peer mentoring.',
    updatedAt: now(),
  },
  {
    id: 'student-3',
    studentId: '2024-1003',
    name: 'Anna Reyes',
    email: 'anna.reyes@university.edu',
    component: 'MTS (Army)',
    municipality: 'Naval',
    facilitatorId: 'facilitator-1',
    facilitatorName: 'Dr. Maria Elena Santos',
    progress: 68,
    assessments: 5,
    status: 'pending',
    notes: 'Needs intervention and assignment follow-up.',
    updatedAt: now(),
  },
  {
    id: 'student-4',
    studentId: '2024-1004',
    name: 'Carlos Garcia',
    email: 'carlos.garcia@university.edu',
    component: 'MTS (Navy)',
    municipality: 'Naval',
    facilitatorId: 'facilitator-1',
    facilitatorName: 'Dr. Maria Elena Santos',
    progress: 78,
    assessments: 6,
    status: 'active',
    notes: 'On track with periodic module completion.',
    updatedAt: now(),
  },
  {
    id: 'student-5',
    studentId: '2024-1005',
    name: 'Sofia Rodriguez',
    email: 'sofia.rodriguez@university.edu',
    component: 'CWTS',
    municipality: 'Naval',
    facilitatorId: 'facilitator-1',
    facilitatorName: 'Dr. Maria Elena Santos',
    progress: 95,
    assessments: 9,
    status: 'active',
    notes: 'High performer with strong attendance.',
    updatedAt: now(),
  },
  {
    id: 'student-6',
    studentId: '2024-1006',
    name: 'Miguel Torres',
    email: 'miguel.torres@university.edu',
    component: 'LTS',
    municipality: 'Biliran',
    progress: 72,
    assessments: 6,
    status: 'active',
    notes: 'Stable progress with a few pending submissions.',
    updatedAt: now(),
  },
  ...createDummyStudents(7, 50),
];

const DEFAULT_GRADES: NstpGradeRecord[] = [
  { studentId: '2024-0001', prelim: 88, midterm: 90, final: 0, remarks: 'In Progress', released: true, updatedAt: now() },
  { studentId: '2024-1001', prelim: 91, midterm: 87, final: 89, remarks: 'Passed', released: true, updatedAt: now() },
  { studentId: '2024-1002', prelim: 94, midterm: 95, final: 93, remarks: 'Passed', released: true, updatedAt: now() },
  { studentId: '2024-1003', prelim: 72, midterm: 70, final: 0, remarks: 'For Completion', released: false, updatedAt: now() },
  ...createDummyGrades(7, 50),
];

const DEFAULT_TRAINING_GROUPS: NstpTrainingGroup[] = [
  { id: 'tg-2024-docal-los', schoolYear: 'SY 2023-2024', semester: '2nd Semester', component: 'CWTS', facilitatorName: 'DOCALLOS, CARMEL SIGRID D.', programHandles: ['BSCE 1A', 'BSCE 1B', 'BSBA', 'BSHM'], studentCount: 75, maxRecommendedLoad: 100, sourceDocument: 'Distribution of training group per facilitators-without no. 2024.docx' },
  { id: 'tg-2024-suliva', schoolYear: 'SY 2023-2024', semester: '2nd Semester', component: 'CWTS', facilitatorName: 'SULIVA, LOUDIE A.', programHandles: ['BSCompE 1A', 'BSEE 1A', 'BSME 1A'], studentCount: 102, maxRecommendedLoad: 100, sourceDocument: 'Distribution of training group per facilitators-without no. 2024.docx' },
  { id: 'tg-2024-bustillo', schoolYear: 'SY 2023-2024', semester: '2nd Semester', component: 'CWTS', facilitatorName: 'BUSTILLO, MONETTE C.', programHandles: ['BSCS 1A', 'BSCS 1B', 'BSIS 1C'], studentCount: 79, maxRecommendedLoad: 100, sourceDocument: 'Distribution of training group per facilitators-without no. 2024.docx' },
  { id: 'tg-2024-petargue', schoolYear: 'SY 2023-2024', semester: '2nd Semester', component: 'CWTS', facilitatorName: 'PETARGUE, JAYSON', programHandles: ['BSCS 1C', 'BSCS 1D', 'BSBA FM 1A', 'BSBA FM 1C (Half)'], studentCount: 92, maxRecommendedLoad: 100, sourceDocument: 'Distribution of training group per facilitators-without no. 2024.docx' },
  { id: 'tg-2024-veruen', schoolYear: 'SY 2023-2024', semester: '2nd Semester', component: 'CWTS', facilitatorName: 'VERUEN, DONALD L.', programHandles: ['BA-Econ 1A', 'BA-Econ 1B', 'BA-Econ 1C', 'BSBA FM 1D'], studentCount: 108, maxRecommendedLoad: 100, sourceDocument: 'Distribution of training group per facilitators-without no. 2024.docx' },
  { id: 'tg-2024-salomon', schoolYear: 'SY 2023-2024', semester: '2nd Semester', component: 'CWTS', facilitatorName: 'SALOMON, JULITO', programHandles: ['BSHM 1A', 'BSHM 1B'], studentCount: 119, maxRecommendedLoad: 100, sourceDocument: 'Distribution of training group per facilitators-without no. 2024.docx' },
  { id: 'tg-2025-naval', schoolYear: 'SY 2025-2026', semester: '1st Semester', component: 'CWTS', facilitatorName: 'Dr. Maria Elena Santos', facilitatorId: 'facilitator-1', municipality: 'Naval', programHandles: ['Municipality: Naval', 'All approved CWTS students'], studentCount: 0, maxRecommendedLoad: 100, sourceDocument: 'Director-created municipality assignment' },
];

export function ensureNstpSeedData() {
  if (typeof window === 'undefined') return;

  if (!localStorage.getItem(ACCOUNTS_KEY)) {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(DEFAULT_ACCOUNTS));
  } else {
    const existingAccounts = safeJsonParse<NstpAccount[]>(localStorage.getItem(ACCOUNTS_KEY), []);
    const migratedAccounts = existingAccounts.map((account: any) => ({
      ...account,
      role: account.role === 'speaker' ? 'facilitator' : account.role,
      email: account.email === 'speaker@nstp.edu' ? 'facilitator@nstp.edu' : account.email,
      password: account.password === 'speaker' ? 'facilitator' : account.password,
      title: account.role === 'speaker' ? account.title || 'Municipal NSTP Facilitator' : account.title,
      municipalities: account.role === 'speaker' && !account.municipalities ? ['Naval'] : account.municipalities,
    })) as NstpAccount[];
    const enrichedAccounts = migratedAccounts.map((existingAccount) => {
      const defaultAccount = DEFAULT_ACCOUNTS.find((account) => account.email.toLowerCase() === existingAccount.email.toLowerCase());
      return defaultAccount ? { ...defaultAccount, ...existingAccount, studentId: existingAccount.studentId || defaultAccount.studentId } : existingAccount;
    });
    const missingRequiredAccounts = DEFAULT_ACCOUNTS.filter((defaultAccount) => {
      return !enrichedAccounts.some((existingAccount) => existingAccount.email.toLowerCase() === defaultAccount.email.toLowerCase());
    });

    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([...enrichedAccounts, ...missingRequiredAccounts]));
  }

  if (!localStorage.getItem(ASSESSMENTS_KEY)) {
    localStorage.setItem(ASSESSMENTS_KEY, JSON.stringify(DEFAULT_ASSESSMENTS));
  } else {
    const existingAssessments = safeJsonParse<NstpAssessment[]>(localStorage.getItem(ASSESSMENTS_KEY), []).map((assessment: any) => ({
      ...assessment,
      ownerId: assessment.ownerId === 'speaker-1' ? 'facilitator-1' : assessment.ownerId,
      ownerRole: assessment.ownerRole === 'speaker' ? 'facilitator' : assessment.ownerRole,
    }));
    const missingAssessments = DEFAULT_ASSESSMENTS.filter((defaultAssessment) => {
      return !existingAssessments.some((assessment) => assessment.id === defaultAssessment.id);
    });

    if (missingAssessments.length > 0) {
      localStorage.setItem(ASSESSMENTS_KEY, JSON.stringify([...existingAssessments, ...missingAssessments]));
    }
  }

  if (!localStorage.getItem(MODULES_KEY)) {
    localStorage.setItem(MODULES_KEY, JSON.stringify(DEFAULT_MODULES));
  } else {
    const existingModules = safeJsonParse<NstpModule[]>(localStorage.getItem(MODULES_KEY), []);
    const missingModules = DEFAULT_MODULES.filter((defaultModule) => {
      return !existingModules.some((module) => module.id === defaultModule.id);
    });

    if (missingModules.length > 0) {
      localStorage.setItem(MODULES_KEY, JSON.stringify([...existingModules, ...missingModules]));
    }
  }

  if (!localStorage.getItem(STUDENTS_KEY)) {
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(DEFAULT_STUDENTS));
  } else {
    const existingStudents = safeJsonParse<NstpStudent[]>(localStorage.getItem(STUDENTS_KEY), []);
    const enrichedStudents = existingStudents.map((existingStudent) => {
      const defaultStudent = DEFAULT_STUDENTS.find((student) => student.email.toLowerCase() === existingStudent.email.toLowerCase());
      return defaultStudent ? { ...defaultStudent, ...existingStudent, studentId: existingStudent.studentId || defaultStudent.studentId } : existingStudent;
    });
    const missingStudents = DEFAULT_STUDENTS.filter((defaultStudent) => {
      return !enrichedStudents.some((student) => student.email.toLowerCase() === defaultStudent.email.toLowerCase());
    });

    localStorage.setItem(STUDENTS_KEY, JSON.stringify([...enrichedStudents, ...missingStudents]));
  }

  if (!localStorage.getItem(PENDING_REGISTRATIONS_KEY)) {
    localStorage.setItem(PENDING_REGISTRATIONS_KEY, JSON.stringify([]));
  }

  if (!localStorage.getItem(GRADES_KEY)) {
    localStorage.setItem(GRADES_KEY, JSON.stringify(DEFAULT_GRADES));
  } else {
    const existingGrades = safeJsonParse<NstpGradeRecord[]>(localStorage.getItem(GRADES_KEY), []);
    const missingGrades = DEFAULT_GRADES.filter((defaultGrade) => {
      return !existingGrades.some((grade) => grade.studentId === defaultGrade.studentId);
    });

    if (missingGrades.length > 0) {
      localStorage.setItem(GRADES_KEY, JSON.stringify([...existingGrades, ...missingGrades]));
    }
  }

  if (!localStorage.getItem(TRAINING_GROUPS_KEY)) {
    localStorage.setItem(TRAINING_GROUPS_KEY, JSON.stringify(DEFAULT_TRAINING_GROUPS));
  } else {
    const existingGroups = safeJsonParse<NstpTrainingGroup[]>(localStorage.getItem(TRAINING_GROUPS_KEY), []);
    const missingGroups = DEFAULT_TRAINING_GROUPS.filter((defaultGroup) => {
      return !existingGroups.some((group) => group.id === defaultGroup.id);
    });

    if (missingGroups.length > 0) {
      localStorage.setItem(TRAINING_GROUPS_KEY, JSON.stringify([...existingGroups, ...missingGroups]));
    }
  }
}

export function loadAccounts(): NstpAccount[] {
  if (typeof window === 'undefined') return DEFAULT_ACCOUNTS;
  ensureNstpSeedData();
  return safeJsonParse<NstpAccount[]>(localStorage.getItem(ACCOUNTS_KEY), DEFAULT_ACCOUNTS);
}

export function saveAccounts(accounts: NstpAccount[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  window.dispatchEvent(new CustomEvent('nstp-accounts-updated'));
}

export function loadAssessments(): NstpAssessment[] {
  if (typeof window === 'undefined') return DEFAULT_ASSESSMENTS;
  ensureNstpSeedData();
  return safeJsonParse<NstpAssessment[]>(localStorage.getItem(ASSESSMENTS_KEY), DEFAULT_ASSESSMENTS);
}

export function saveAssessments(assessments: NstpAssessment[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ASSESSMENTS_KEY, JSON.stringify(assessments));
}

export function loadModules(): NstpModule[] {
  if (typeof window === 'undefined') return DEFAULT_MODULES;
  ensureNstpSeedData();
  return safeJsonParse<NstpModule[]>(localStorage.getItem(MODULES_KEY), DEFAULT_MODULES);
}

export function saveModules(modules: NstpModule[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MODULES_KEY, JSON.stringify(modules));
}

export function loadStudents(): NstpStudent[] {
  if (typeof window === 'undefined') return DEFAULT_STUDENTS;
  ensureNstpSeedData();
  return safeJsonParse<NstpStudent[]>(localStorage.getItem(STUDENTS_KEY), DEFAULT_STUDENTS);
}

export function saveStudents(students: NstpStudent[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
  window.dispatchEvent(new CustomEvent('nstp-students-updated'));
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
}

export function loadQualifyingExamResults(): QualifyingExamResult[] {
  if (typeof window === 'undefined') return [];
  return safeJsonParse<QualifyingExamResult[]>(localStorage.getItem(QUALIFYING_RESULTS_KEY), []);
}

export function saveQualifyingExamResults(results: QualifyingExamResult[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(QUALIFYING_RESULTS_KEY, JSON.stringify(results));
  window.dispatchEvent(new CustomEvent('nstp-qualifying-results-updated'));
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
}

export function loadGradeRecords(): NstpGradeRecord[] {
  if (typeof window === 'undefined') return DEFAULT_GRADES;
  ensureNstpSeedData();
  return safeJsonParse<NstpGradeRecord[]>(localStorage.getItem(GRADES_KEY), DEFAULT_GRADES);
}

export function saveGradeRecords(records: NstpGradeRecord[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(GRADES_KEY, JSON.stringify(records));
}

export function loadTrainingGroups(): NstpTrainingGroup[] {
  if (typeof window === 'undefined') return DEFAULT_TRAINING_GROUPS;
  ensureNstpSeedData();
  return safeJsonParse<NstpTrainingGroup[]>(localStorage.getItem(TRAINING_GROUPS_KEY), DEFAULT_TRAINING_GROUPS);
}

export function saveTrainingGroups(groups: NstpTrainingGroup[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TRAINING_GROUPS_KEY, JSON.stringify(groups));
  window.dispatchEvent(new CustomEvent('nstp-training-groups-updated'));
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
    updatedAt: now(),
    sections: [
      {
        id: `section-${Math.random().toString(36).slice(2, 10)}`,
        type: 'lesson',
        title: 'New section',
        duration: '20 min',
      },
    ],
  };
}

export function createEmptyAssessment(owner: NstpAccount, overrides: Partial<NstpAssessment> = {}): NstpAssessment {
  return {
    id: `asmt-${Math.random().toString(36).slice(2, 10)}`,
    title: overrides.title || 'Untitled Assessment',
    type: overrides.type || 'quiz',
    description: overrides.description || '',
    moduleId: overrides.moduleId || 'm1',
    timeLimit: overrides.timeLimit || 15,
    passingScore: overrides.passingScore || 70,
    ownerId: owner.id,
    ownerName: owner.name,
    ownerRole: owner.role === 'facilitator' ? 'facilitator' : 'admin',
    status: overrides.status || 'draft',
    updatedAt: now(),
    questions: overrides.questions || [
      createQuestion('New question prompt', ['Option A', 'Option B', 'Option C', 'Option D'], 0),
    ],
  };
}
