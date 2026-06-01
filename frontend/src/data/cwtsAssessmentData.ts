import type { BiliranMunicipality, NstpStudent } from './nstpData';

export type CwtsSemester = 'CWTS 1' | 'CWTS 2';
export type CwtsTaskCategory =
  | 'Reflection Activities'
  | 'Community Engagement'
  | 'Journals'
  | 'Video Outputs'
  | 'Reports and Documentation'
  | 'Major Performance Tasks';
export type CwtsSubmissionFormat = 'PDF' | 'DOCX' | 'Images' | 'Video Link' | 'Google Drive Link' | 'YouTube Link' | 'Mixed Portfolio' | 'Onsite Performance';
export type CwtsTaskStatus = 'Draft' | 'Published' | 'Archived';
export type CwtsSubmissionStatus = 'Pending' | 'Submitted' | 'Late' | 'Revision Requested' | 'Graded';

export type CwtsRubricItem = {
  criterion: string;
  points: number;
};

export type CwtsAssessmentTask = {
  id: string;
  semester: CwtsSemester;
  week: string;
  title: string;
  category: CwtsTaskCategory;
  objective: string;
  instructions: string;
  submissionTypes: CwtsSubmissionFormat[];
  dueDate: string;
  resources: string[];
  rubric: CwtsRubricItem[];
  points: number;
  status: CwtsTaskStatus;
  createdBy: string;
  ownerId?: string;
  ownerName?: string;
  updatedAt: string;
};

export type CwtsSubmission = {
  id: string;
  assessmentId: string;
  studentId: string;
  studentName: string;
  municipality?: BiliranMunicipality;
  section?: string;
  submittedAt: string;
  status: CwtsSubmissionStatus;
  submissionType: CwtsSubmissionFormat;
  link?: string;
  fileNames: string[];
  notes?: string;
  score?: number;
  feedback?: string;
  facilitatorComments?: string;
  gradedAt?: string;
  gradedBy?: string;
};

const TASKS_KEY = 'nstp-cwts-assessment-tasks';
const SUBMISSIONS_KEY = 'nstp-cwts-assessment-submissions';

const todayIso = () => new Date().toISOString();

export const CWTS_ASSESSMENT_CATEGORIES: CwtsTaskCategory[] = [
  'Reflection Activities',
  'Community Engagement',
  'Journals',
  'Video Outputs',
  'Reports and Documentation',
  'Major Performance Tasks',
];

export const CWTS_SUBMISSION_FORMATS: CwtsSubmissionFormat[] = [
  'PDF',
  'DOCX',
  'Images',
  'Video Link',
  'Google Drive Link',
  'YouTube Link',
  'Mixed Portfolio',
  'Onsite Performance',
];

export const DEFAULT_CWTS_ASSESSMENT_TASKS: CwtsAssessmentTask[] = [
  {
    id: 'cwts1-drug-education-reflection',
    semester: 'CWTS 1',
    week: 'Week 4',
    title: 'Drug Education Youth Role Reflection',
    category: 'Reflection Activities',
    objective: 'Connect RA 9165 awareness with personal responsibility and youth participation in prevention.',
    instructions: 'Write a concise reflection on the implications of drug education in your personal life and the role of youth in combating drug abuse and supporting prevention in the community.',
    submissionTypes: ['PDF', 'DOCX'],
    dueDate: '2026-06-05',
    resources: ['RA 9165 orientation notes', 'Drug education session guide'],
    rubric: [
      { criterion: 'Personal insight and relevance', points: 30 },
      { criterion: 'Connection to youth prevention role', points: 30 },
      { criterion: 'Clarity, organization, and grammar', points: 20 },
      { criterion: 'Completeness and timely submission', points: 20 },
    ],
    points: 100,
    status: 'Published',
    createdBy: 'CWTS 1 syllabus extraction',
    updatedAt: todayIso(),
  },
  {
    id: 'cwts1-drug-education-promotional-video',
    semester: 'CWTS 1',
    week: 'Week 4',
    title: 'Drug Education Promotional Video',
    category: 'Video Outputs',
    objective: 'Produce a short advocacy material that communicates youth involvement in drug detection, awareness, and prevention.',
    instructions: 'Submit a video link presenting a clear drug education message for young people. The output may be hosted on YouTube or Google Drive.',
    submissionTypes: ['YouTube Link', 'Google Drive Link', 'Video Link'],
    dueDate: '2026-06-08',
    resources: ['Drug education campaign guide'],
    rubric: [
      { criterion: 'Accuracy of message', points: 30 },
      { criterion: 'Creativity and audience impact', points: 30 },
      { criterion: 'Technical clarity', points: 20 },
      { criterion: 'Call to action and completeness', points: 20 },
    ],
    points: 100,
    status: 'Published',
    createdBy: 'CWTS 1 syllabus extraction',
    updatedAt: todayIso(),
  },
  {
    id: 'cwts1-drrm-basic-response-performance',
    semester: 'CWTS 1',
    week: 'Weeks 5-6',
    title: 'Disaster Preparedness Basic Response Performance',
    category: 'Major Performance Tasks',
    objective: 'Demonstrate practical disaster preparedness skills through rescue response, first aid, and basic life support activities.',
    instructions: 'Complete the onsite performance task and submit documentation or facilitator verification of Basic Rescue Response, First Aid, or Basic Life Support performance.',
    submissionTypes: ['Onsite Performance', 'Images', 'PDF'],
    dueDate: '2026-06-15',
    resources: ['DRRM skill checklist', 'First aid and BLS practice guide'],
    rubric: [
      { criterion: 'Correctness of demonstrated procedure', points: 40 },
      { criterion: 'Safety and preparedness practice', points: 25 },
      { criterion: 'Participation and teamwork', points: 20 },
      { criterion: 'Documentation quality', points: 15 },
    ],
    points: 100,
    status: 'Published',
    createdBy: 'CWTS 1 syllabus extraction',
    updatedAt: todayIso(),
  },
  {
    id: 'cwts1-drrm-infographic',
    semester: 'CWTS 1',
    week: 'Weeks 5-6',
    title: 'Youth Role in Disaster Preparedness Infographic',
    category: 'Reports and Documentation',
    objective: 'Explain disaster preparedness and management roles using a clear visual educational output.',
    instructions: 'Create and submit a digital infographic or presentation about the youth role in disaster preparedness and management.',
    submissionTypes: ['PDF', 'Images', 'Google Drive Link'],
    dueDate: '2026-06-18',
    resources: ['DRRM awareness materials'],
    rubric: [
      { criterion: 'Content accuracy', points: 35 },
      { criterion: 'Visual organization and readability', points: 30 },
      { criterion: 'Practical youth action steps', points: 25 },
      { criterion: 'Citation/completeness', points: 10 },
    ],
    points: 100,
    status: 'Published',
    createdBy: 'CWTS 1 syllabus extraction',
    updatedAt: todayIso(),
  },
  {
    id: 'cwts1-environmental-protection-journal',
    semester: 'CWTS 1',
    week: 'Weeks 7-8',
    title: 'Environmental Protection and Tree Planting Journal',
    category: 'Journals',
    objective: 'Document participation in environmental initiatives such as nursery work, tree planting, mangrove planting, restoration, or prevention activities.',
    instructions: 'Submit a journal with dated entries, photos if available, and a reflection on the value of environmental protection and student participation.',
    submissionTypes: ['PDF', 'DOCX', 'Images', 'Mixed Portfolio'],
    dueDate: '2026-06-25',
    resources: ['Tree planting journal format', 'Environmental protection activity guide'],
    rubric: [
      { criterion: 'Completeness of journal entries', points: 30 },
      { criterion: 'Documentation of actual participation', points: 30 },
      { criterion: 'Reflection quality', points: 25 },
      { criterion: 'Organization and format', points: 15 },
    ],
    points: 100,
    status: 'Published',
    createdBy: 'CWTS 1 syllabus extraction',
    updatedAt: todayIso(),
  },
  {
    id: 'cwts1-national-security-reflection-video',
    semester: 'CWTS 1',
    week: 'Week 9',
    title: 'National Security Reflection or Inspirational Video',
    category: 'Video Outputs',
    objective: 'Relate national security concerns to personal civic responsibility and youth participation.',
    instructions: 'Submit either a short reflection paper or an inspirational video explaining the role of youth in national security awareness.',
    submissionTypes: ['PDF', 'DOCX', 'YouTube Link', 'Google Drive Link', 'Video Link'],
    dueDate: '2026-07-01',
    resources: ['National security discussion notes'],
    rubric: [
      { criterion: 'Understanding of national security concerns', points: 30 },
      { criterion: 'Youth role and civic responsibility', points: 30 },
      { criterion: 'Clarity and persuasive value', points: 25 },
      { criterion: 'Format and completeness', points: 15 },
    ],
    points: 100,
    status: 'Published',
    createdBy: 'CWTS 1 syllabus extraction',
    updatedAt: todayIso(),
  },
  {
    id: 'cwts1-values-leadership-reflection',
    semester: 'CWTS 1',
    week: 'Weeks 7-10',
    title: 'Values, Nationalism, and Leadership Reflection Set',
    category: 'Reflection Activities',
    objective: 'Synthesize self-awareness, good citizenship values, nationalism, teamwork, time management, decision making, and leadership practice.',
    instructions: 'Submit a combined reflection/essay output covering self-awareness in service, the continuing value of nationalism and patriotism, good citizenship values, and leadership/teamwork insights.',
    submissionTypes: ['PDF', 'DOCX'],
    dueDate: '2026-07-08',
    resources: ['Good citizenship values guide', 'Leadership reflection prompts'],
    rubric: [
      { criterion: 'Depth of reflection', points: 35 },
      { criterion: 'Integration of values and leadership concepts', points: 30 },
      { criterion: 'Use of concrete examples', points: 20 },
      { criterion: 'Writing mechanics and organization', points: 15 },
    ],
    points: 100,
    status: 'Published',
    createdBy: 'CWTS 1 syllabus extraction',
    updatedAt: todayIso(),
  },
  {
    id: 'cwts1-dimensions-development-infographic-video',
    semester: 'CWTS 1',
    week: 'Weeks 11-13',
    title: 'Dimensions of Development Infographic and Video',
    category: 'Reports and Documentation',
    objective: 'Illustrate one dimension of community development such as health, education, entrepreneurship, recreation, morals, voters education, or poverty alleviation.',
    instructions: 'Submit an infographic and video or linked digital presentation explaining the components and features of one selected development dimension.',
    submissionTypes: ['PDF', 'Images', 'YouTube Link', 'Google Drive Link', 'Video Link'],
    dueDate: '2026-07-15',
    resources: ['Dimensions of development activity guide'],
    rubric: [
      { criterion: 'Development dimension accuracy', points: 30 },
      { criterion: 'Visual and video communication quality', points: 30 },
      { criterion: 'Community relevance', points: 25 },
      { criterion: 'Completeness and citations', points: 15 },
    ],
    points: 100,
    status: 'Published',
    createdBy: 'CWTS 1 syllabus extraction',
    updatedAt: todayIso(),
  },
  {
    id: 'cwts2-community-immersion-reflection',
    semester: 'CWTS 2',
    week: 'Weeks 1-2',
    title: 'Community Immersion Objectives Essay Reflection',
    category: 'Reflection Activities',
    objective: 'Explain the objectives and elements of NSTP-CWTS community immersion and its importance in nation-building.',
    instructions: 'Submit a 300-word reflection with real-life examples showing why community immersion matters in civic welfare work.',
    submissionTypes: ['PDF', 'DOCX'],
    dueDate: '2026-08-07',
    resources: ['Community immersion reflection prompt'],
    rubric: [
      { criterion: 'Coverage of immersion objectives and elements', points: 30 },
      { criterion: 'Nation-building connection', points: 30 },
      { criterion: 'Real-life examples', points: 20 },
      { criterion: 'Writing quality and word count', points: 20 },
    ],
    points: 100,
    status: 'Published',
    createdBy: 'CWTS 2 syllabus extraction',
    updatedAt: todayIso(),
  },
  {
    id: 'cwts2-community-interview-summary',
    semester: 'CWTS 2',
    week: 'Weeks 1-2',
    title: 'Community Worker Interview and Summary Report',
    category: 'Reports and Documentation',
    objective: 'Understand community work through direct conversation with a local leader, volunteer, or organization representative.',
    instructions: 'Interview a community worker and submit a 1-2 page report highlighting whom to immerse with, why involvement matters, and what civic lessons were learned.',
    submissionTypes: ['PDF', 'DOCX', 'Google Drive Link'],
    dueDate: '2026-08-12',
    resources: ['Interview guide questions', 'Report format'],
    rubric: [
      { criterion: 'Quality of interview evidence', points: 30 },
      { criterion: 'Summary and analysis', points: 35 },
      { criterion: 'Community relevance', points: 20 },
      { criterion: 'Format and clarity', points: 15 },
    ],
    points: 100,
    status: 'Published',
    createdBy: 'CWTS 2 syllabus extraction',
    updatedAt: todayIso(),
  },
  {
    id: 'cwts2-ethical-immersion-reflection',
    semester: 'CWTS 2',
    week: 'Weeks 3-4',
    title: 'Ethical Community Immersion Reflection',
    category: 'Reflection Activities',
    objective: 'Reflect on personal gains from community immersion and identify ethical do’s and don’ts for respectful participation.',
    instructions: 'Submit a 300-word reflection on skills, values, experiences, and professional growth from community immersion. Include a short section on ethical do’s and don’ts.',
    submissionTypes: ['PDF', 'DOCX'],
    dueDate: '2026-08-19',
    resources: ['Community immersion ethics guide'],
    rubric: [
      { criterion: 'Personal and professional growth insight', points: 35 },
      { criterion: 'Ethical do’s and don’ts', points: 30 },
      { criterion: 'Real-life application', points: 20 },
      { criterion: 'Clarity and completeness', points: 15 },
    ],
    points: 100,
    status: 'Published',
    createdBy: 'CWTS 2 syllabus extraction',
    updatedAt: todayIso(),
  },
  {
    id: 'cwts2-mapping-community-profiling',
    semester: 'CWTS 2',
    week: 'Weeks 5-6',
    title: 'Barangay Mapping and Community Profiling Portfolio',
    category: 'Community Engagement',
    objective: 'Produce a practical community profile using mapping, resident/barangay official interviews, and problem identification.',
    instructions: 'Submit a portfolio containing barangay map, 1-page community profile, interview-based profiling report, and analysis of at least two major community issues with proposed solutions.',
    submissionTypes: ['PDF', 'DOCX', 'Images', 'Google Drive Link', 'Mixed Portfolio'],
    dueDate: '2026-08-29',
    resources: ['Community profiling template', 'Barangay problem identification guide'],
    rubric: [
      { criterion: 'Completeness of map and profile', points: 30 },
      { criterion: 'Quality of interview-based evidence', points: 25 },
      { criterion: 'Problem analysis and solution fit', points: 30 },
      { criterion: 'Organization and documentation', points: 15 },
    ],
    points: 100,
    status: 'Published',
    createdBy: 'CWTS 2 syllabus extraction',
    updatedAt: todayIso(),
  },
  {
    id: 'cwts2-project-planning-documents',
    semester: 'CWTS 2',
    week: 'Weeks 7-8',
    title: 'Community Immersion Proposal and Letter of Intent',
    category: 'Major Performance Tasks',
    objective: 'Prepare implementation-ready community work documents aligned with local off-campus activity policies and partner coordination.',
    instructions: 'Submit a package containing a 1-page policy analysis, 2-3 page community immersion proposal, and formal letter of intent to the partner barangay or organization.',
    submissionTypes: ['PDF', 'DOCX', 'Google Drive Link', 'Mixed Portfolio'],
    dueDate: '2026-09-08',
    resources: ['Proposal template', 'Letter of intent format', 'Policy analysis prompt'],
    rubric: [
      { criterion: 'Proposal clarity and feasibility', points: 35 },
      { criterion: 'Policy/safety/ethical considerations', points: 25 },
      { criterion: 'Letter format and partnership clarity', points: 20 },
      { criterion: 'Expected outcomes and resources', points: 20 },
    ],
    points: 100,
    status: 'Published',
    createdBy: 'CWTS 2 syllabus extraction',
    updatedAt: todayIso(),
  },
  {
    id: 'cwts2-community-immersion-journal',
    semester: 'CWTS 2',
    week: 'Weeks 7-8',
    title: 'Community Immersion Daily Journal',
    category: 'Journals',
    objective: 'Document community immersion experiences, challenges, interactions, lessons learned, and impact assessment.',
    instructions: 'Submit a daily journal with at least three entries. Include dates, activities, reflections, challenges, insights, and documentation where available.',
    submissionTypes: ['PDF', 'DOCX', 'Images', 'Mixed Portfolio'],
    dueDate: '2026-09-15',
    resources: ['Community immersion journal format'],
    rubric: [
      { criterion: 'Required journal entries and dates', points: 25 },
      { criterion: 'Reflection depth and lessons learned', points: 30 },
      { criterion: 'Evidence of community interaction', points: 25 },
      { criterion: 'Organization and completeness', points: 20 },
    ],
    points: 100,
    status: 'Published',
    createdBy: 'CWTS 2 syllabus extraction',
    updatedAt: todayIso(),
  },
  {
    id: 'cwts2-immersion-proper-documentation',
    semester: 'CWTS 2',
    week: 'Community Immersion Proper',
    title: 'Community Immersion Proper Documentation',
    category: 'Major Performance Tasks',
    objective: 'Document actual community immersion participation in education/literacy, health/sanitation, livelihood, environmental protection, DRRM, sports/recreation, social awareness, or infrastructure activities.',
    instructions: 'Submit documentation of the implemented community immersion activity, including outputs, photos or links, partner/community evidence, and a brief impact summary.',
    submissionTypes: ['PDF', 'DOCX', 'Images', 'Google Drive Link', 'Mixed Portfolio'],
    dueDate: '2026-09-30',
    resources: ['Community immersion documentation format', 'Program evaluation prompt'],
    rubric: [
      { criterion: 'Actual participation and output evidence', points: 40 },
      { criterion: 'Community relevance and impact', points: 25 },
      { criterion: 'Documentation quality', points: 20 },
      { criterion: 'Reflection and evaluation', points: 15 },
    ],
    points: 100,
    status: 'Published',
    createdBy: 'CWTS 2 syllabus extraction',
    updatedAt: todayIso(),
  },
  {
    id: 'cwts2-tree-planting-journal',
    semester: 'CWTS 2',
    week: 'Mini Project',
    title: 'Tree Planting and Mini Project Journal',
    category: 'Journals',
    objective: 'Document tangible community-needed project work and tree planting activities as part of CWTS service learning.',
    instructions: 'Submit a journal documenting mini project work and tree planting activities, with dated entries, photos if available, reflections, and community relevance.',
    submissionTypes: ['PDF', 'DOCX', 'Images', 'Mixed Portfolio'],
    dueDate: '2026-10-07',
    resources: ['Tree planting journal format', 'Mini project documentation guide'],
    rubric: [
      { criterion: 'Completeness of mini project and tree planting records', points: 35 },
      { criterion: 'Evidence and documentation', points: 25 },
      { criterion: 'Reflection and community impact', points: 25 },
      { criterion: 'Format and organization', points: 15 },
    ],
    points: 100,
    status: 'Published',
    createdBy: 'CWTS 2 syllabus extraction',
    updatedAt: todayIso(),
  },
];

const parse = <T,>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export function loadCwtsAssessmentTasks() {
  const tasks = parse<CwtsAssessmentTask[]>(localStorage.getItem(TASKS_KEY), DEFAULT_CWTS_ASSESSMENT_TASKS);
  return tasks.length ? tasks : DEFAULT_CWTS_ASSESSMENT_TASKS;
}

export function saveCwtsAssessmentTasks(tasks: CwtsAssessmentTask[]) {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  window.dispatchEvent(new Event('nstp-cwts-assessments-updated'));
}

export function loadCwtsSubmissions() {
  return parse<CwtsSubmission[]>(localStorage.getItem(SUBMISSIONS_KEY), []);
}

export function saveCwtsSubmissions(submissions: CwtsSubmission[]) {
  localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(submissions));
  window.dispatchEvent(new Event('nstp-cwts-submissions-updated'));
}

export function upsertCwtsSubmission(submission: CwtsSubmission) {
  const submissions = loadCwtsSubmissions();
  const index = submissions.findIndex((item) => item.assessmentId === submission.assessmentId && item.studentId === submission.studentId);
  const next = index >= 0
    ? submissions.map((item, currentIndex) => currentIndex === index ? submission : item)
    : [submission, ...submissions];
  saveCwtsSubmissions(next);
}

export function submissionStatusFor(task: CwtsAssessmentTask, submission?: CwtsSubmission): CwtsSubmissionStatus {
  if (submission?.status) return submission.status;
  return new Date(`${task.dueDate}T23:59:59`).getTime() < Date.now() ? 'Late' : 'Pending';
}

export function createBlankCwtsTask(): CwtsAssessmentTask {
  return {
    id: `cwts-task-${Date.now()}`,
    semester: 'CWTS 1',
    week: 'New Task',
    title: '',
    category: 'Reflection Activities',
    objective: '',
    instructions: '',
    submissionTypes: ['PDF'],
    dueDate: new Date().toISOString().slice(0, 10),
    resources: [],
    rubric: [
      { criterion: 'Content quality', points: 40 },
      { criterion: 'Completeness', points: 30 },
      { criterion: 'Organization and format', points: 30 },
    ],
    points: 100,
    status: 'Draft',
    createdBy: 'Facilitator',
    updatedAt: todayIso(),
  };
}

export function studentDisplayName(student: NstpStudent) {
  return student.name || [student.firstName, student.middleName, student.surname].filter(Boolean).join(' ');
}
