import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Award,
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle,
  ClipboardList,
  Cloud,
  Download,
  FileText,
  GraduationCap,
  IdCard,
  Landmark,
  ListChecks,
  Lock,
  LockKeyhole,
  Mail,
  MapPinned,
  Megaphone,
  Menu,
  MoonStar,
  PlayCircle,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  SunMedium,
  TrendingUp,
  UserRound,
  Users,
} from 'lucide-react';
import { BILIRAN_MUNICIPALITIES, BiliranMunicipality, ensureNstpSeedData, loadAccounts, loadPendingStudentRegistrations, savePendingStudentRegistrations } from '../data/nstpData';
import { addAudit } from '../data/workflowData';
import splashImage from '../assets/images/splash.png';
import { useModalEscape } from '../features/facilitator/components/FacilitatorUI';

type LoginMode = 'login' | 'register';
type ComponentKey = 'CWTS' | 'LTS' | 'MTS';
type PublicView = 'home' | 'nstp' | 'school' | 'portal' | 'feature' | 'preview' | 'component';

const componentCards = [
  { label: 'CWTS', title: 'Civic Welfare Training Service', copy: 'Community development, health, environment, disaster readiness, and service-learning projects.', icon: Users, accent: '#1856c8', fill: '#002147', value: 34 },
  { label: 'LTS', title: 'Literacy Training Service', copy: 'Literacy, numeracy, tutoring, and learning support for partner schools and communities.', icon: BookOpen, accent: '#1856c8', fill: '#0b4ea2', value: 28 },
  { label: 'MTS Army', title: 'Military Training Service - Army', copy: 'Discipline, leadership, physical readiness, and national defense preparation.', icon: ShieldCheck, accent: '#d4a719', fill: '#e5b73b', value: 22 },
  { label: 'MTS Navy', title: 'Military Training Service - Navy', copy: 'Maritime awareness, coastal service, naval discipline, and emergency coordination.', icon: Award, accent: '#426db4', fill: '#7092c8', value: 16 },
];

const landingComponents: Array<{ key: ComponentKey; title: string; copy: string; focus: string[]; icon: any; gold?: boolean }> = [
  {
    key: 'CWTS',
    title: 'Civic Welfare Training Service',
    copy: 'Prepares students for organized community service through health, environment, disaster readiness, safety, livelihood, and local development initiatives.',
    focus: ['Community immersion', 'Disaster preparedness', 'Health and environment projects'],
    icon: Users,
  },
  {
    key: 'LTS',
    title: 'Literacy Training Service',
    copy: 'Trains students to support literacy and numeracy programs for learners, out-of-school youth, and community partners who need learning assistance.',
    focus: ['Reading support', 'Numeracy sessions', 'Learning materials and tutoring'],
    icon: BookOpen,
    gold: true,
  },
  {
    key: 'MTS',
    title: 'Military Training Service',
    copy: 'Develops discipline, leadership, physical readiness, and national defense awareness through Army or Navy-oriented training pathways.',
    focus: ['Leadership and discipline', 'Defense preparedness', 'Army or Navy track assignment'],
    icon: ShieldCheck,
  },
];

const servicePillars = [
  { title: 'Nation-Building', copy: 'Empowering students to serve and create impact.', icon: GraduationCap },
  { title: 'Community Focused', copy: 'Addressing real needs through meaningful service.', icon: Users },
  { title: 'Character Development', copy: 'Building discipline, integrity, and social responsibility.', icon: ShieldCheck },
  { title: 'Lifelong Competencies', copy: 'Equipping students with skills for personal and professional growth.', icon: BarChart3 },
];

const componentInformation = {
  CWTS: {
    label: 'Civic Welfare Training Service',
    badge: 'Community service and development',
    lead: 'Empowering students to become agents of social change through organized community projects that improve quality of life in Biliran.',
    overview: [
      'CWTS develops students through activities contributory to community welfare, public health, environmental stewardship, safety, education, and local development.',
      'After meeting Common Phase requirements and receiving classification approval, students work with facilitators on component-specific sessions, attendance, outputs, and progress records.',
    ],
    focus: [
      { title: 'Health and Safety', copy: 'Community wellness, preparedness, and outreach.', icon: ShieldCheck },
      { title: 'Environment', copy: 'Stewardship projects and sustainable practices.', icon: Sparkles },
      { title: 'Community Action', copy: 'Service planning with local partners.', icon: Users },
      { title: 'Civic Leadership', copy: 'Responsible participation and follow-through.', icon: Award },
    ],
    activities: [
      { title: 'Community Needs Assessment', copy: 'Identify priority concerns with assigned local partners.', icon: ClipboardList },
      { title: 'Disaster Preparedness', copy: 'Translate readiness training into service-oriented action.', icon: ShieldCheck },
      { title: 'Environmental Initiatives', copy: 'Plan and document projects supporting resilient communities.', icon: Sparkles },
    ],
    resources: ['CWTS orientation and syllabus', 'Community project proposal guide', 'NSTP policy and service references'],
    coordinator: 'CWTS Component Coordination Office',
    coordinatorCopy: 'Project assignments, faculty contact details, and approved learning links are released inside the student portal.',
  },
  LTS: {
    label: 'Literacy Training Service',
    badge: 'Education and literacy',
    lead: 'Empowering learners through literacy and numeracy initiatives that strengthen education and community opportunity.',
    overview: [
      'LTS prepares BiPSU students to support literacy and numeracy development among school children, out-of-school youth, and other community members who need learning assistance.',
      'Classified LTS students take part in guided teaching sessions, learning-output preparation, attendance tracking, and reflection-based assessment with their facilitator.',
    ],
    focus: [
      { title: 'Reading Literacy', copy: 'Developmental reading and guided learning.', icon: BookOpen },
      { title: 'Numeracy Skills', copy: 'Accessible foundations for daily learning.', icon: BarChart3 },
      { title: 'Youth Mentorship', copy: 'Supportive instruction for learners.', icon: GraduationCap },
      { title: 'Learning Design', copy: 'Create useful educational outputs.', icon: FileText },
    ],
    activities: [
      { title: 'Literacy Drives', copy: 'Support reading initiatives in partner communities.', icon: BookOpen },
      { title: 'Reading Remediation', copy: 'Guided tutoring for developing readers.', icon: GraduationCap },
      { title: 'Numeracy Workshops', copy: 'Engaging practical mathematics activities.', icon: BarChart3 },
    ],
    resources: ['LTS session and teaching guide', 'Activity output template', 'Assessment and progress references'],
    coordinator: 'LTS Component Coordination Office',
    coordinatorCopy: 'Teaching schedules, assigned learners, approved materials, and facilitator notices are provided through authenticated access.',
  },
  MTS: {
    label: 'Military Training Service',
    badge: 'Discipline and preparedness',
    lead: 'Building responsible citizens through leadership, discipline, national defense awareness, and readiness for coordinated service.',
    overview: [
      'MTS develops organizational discipline, leadership capability, and defense preparedness through Army or Navy-oriented training pathways under the NSTP classification process.',
      'Once assigned, students receive component schedules, facilitator guidance, attendance records, approved training resources, and progress monitoring through the portal.',
    ],
    focus: [
      { title: 'Defense Readiness', copy: 'Preparedness and responsible service.', icon: ShieldCheck },
      { title: 'Leadership', copy: 'Decision-making and accountability.', icon: Award },
      { title: 'Emergency Response', copy: 'Coordinated action in crises.', icon: Bell },
      { title: 'Team Discipline', copy: 'Formation, cooperation, and duty.', icon: Users },
    ],
    activities: [
      { title: 'Leadership Training', copy: 'Strengthen resilience and ethical direction.', icon: Award },
      { title: 'Disaster Response', copy: 'Develop readiness for community emergencies.', icon: ShieldCheck },
      { title: 'Civic Engagement', copy: 'Connect disciplined training to public service.', icon: Users },
    ],
    resources: ['MTS training guide', 'Preparedness and protocol reference', 'Training session schedule'],
    coordinator: 'MTS Component Coordination Office',
    coordinatorCopy: 'Army or Navy assignments, training schedules, and official component resources are available to classified students after login.',
  },
} satisfies Record<ComponentKey, {
  label: string;
  badge: string;
  lead: string;
  overview: string[];
  focus: Array<{ title: string; copy: string; icon: any }>;
  activities: Array<{ title: string; copy: string; icon: any }>;
  resources: string[];
  coordinator: string;
  coordinatorCopy: string;
}>;

const componentFromPath = (): ComponentKey | null => {
  if (typeof window === 'undefined') return null;
  const match = window.location.pathname.match(/^\/components\/(cwts|lts|mts)\/?$/i);
  return match ? (match[1].toUpperCase() as ComponentKey) : null;
};

const portalFeatures = [
  {
    icon: BookOpen,
    label: 'Common Phase',
    value: 'Deliver standardized learning with tracked completion.',
    color: 'from-[#002147] to-[#0b4ea2]',
    metric: '25 hours',
    status: '8 lessons prepared',
    audience: 'Students and NSTP facilitators',
    preview: 'A sequenced learning path with lesson sections, completion buttons, learning hours, post-tests, and downloadable references.',
    bullets: ['Orientation, seminars, workshops, assessments, and service preparation', 'Session-based contact-hour records for every student', 'Admin view for scheduling and updating learning content'],
    data: [
      { name: 'Lessons', score: 100 },
      { name: 'Post-tests', score: 88 },
      { name: 'Hours', score: 100 },
    ],
  },
  {
    icon: Users,
    label: 'Enrollment Verification',
    value: 'Verify and manage student enrollment with accuracy.',
    color: 'from-[#0b4ea2] to-[#7092c8]',
    metric: 'ID-based',
    status: 'Approval queue',
    audience: 'Students, registrar staff, and NSTP admins',
    preview: 'Student access begins with BiPSU student ID verification, admin approval, component preference capture, and enrollment history.',
    bullets: ['Pending student registrations are held for admin review', 'Duplicate email and student ID checks reduce bad records', 'Enrollment status follows students into the dashboard'],
    data: [
      { name: 'Verified', score: 76 },
      { name: 'Pending', score: 24 },
      { name: 'Duplicates', score: 6 },
    ],
  },
  {
    icon: ClipboardList,
    label: 'Assessments',
    value: 'Administer exams and measure knowledge readiness.',
    color: 'from-[#173b70] to-[#002147]',
    metric: '8 items',
    status: 'Post-tests and exams',
    audience: 'Students, facilitators, facilitators, and admins',
    preview: 'The assessment bank connects quizzes, major exams, answer keys, facilitator-uploaded materials, and readiness tracking.',
    bullets: ['Facilitators can publish learning links and manage linked assessments', 'Students can access available tests from their portal', 'Admins can monitor coverage and published assessment status'],
    data: [
      { name: 'Published', score: 88 },
      { name: 'Drafts', score: 32 },
      { name: 'Answered', score: 74 },
    ],
  },
  {
    icon: ShieldCheck,
    label: 'Classification',
    value: 'Classify students into CWTS, LTS, MTS Army or Navy.',
    color: 'from-[#735c00] to-[#e5b73b]',
    metric: '4 tracks',
    status: 'Rules-assisted',
    audience: 'NSTP coordinators and students',
    preview: 'Classification summarizes preferences, qualifying results, capacity, and official track assignment across CWTS, LTS, MTS Army, and MTS Navy.',
    bullets: ['Component distribution is visible to admins', 'Students see their official assigned component', 'Reports can surface uneven distribution early'],
    data: [
      { name: 'CWTS', score: 34 },
      { name: 'LTS', score: 28 },
      { name: 'MTS-A', score: 22 },
      { name: 'MTS-N', score: 16 },
    ],
  },
  {
    icon: Star,
    label: 'Grades',
    value: 'Compute and release NSTP grades securely and on time.',
    color: 'from-[#0b4ea2] to-[#002147]',
    metric: 'Official',
    status: 'Release-ready',
    audience: 'Students, facilitators, and NSTP admins',
    preview: 'The grade center gives students a clear released grade view while admins manage official status, completion records, and release readiness.',
    bullets: ['Students see released standing and progress signals', 'Admins can release grades after module and assessment requirements', 'Records stay connected to component and enrollment status'],
    data: [
      { name: 'Ready', score: 82 },
      { name: 'Pending', score: 18 },
      { name: 'Released', score: 64 },
    ],
  },
  {
    icon: BarChart3,
    label: 'Reports & Analytics',
    value: 'Real-time insights for better program decisions.',
    color: 'from-[#e5b73b] to-[#735c00]',
    metric: 'Live',
    status: 'Export-ready',
    audience: 'NSTP administrators and program coordinators',
    preview: 'Reports combine enrollment, module progress, assessment coverage, component distribution, grade release, and operational activity.',
    bullets: ['Dashboards show progress bands and component distribution', 'Report tools support monthly and program-level summaries', 'Search and filtering work across admin modules'],
    data: [
      { name: 'Progress', score: 91 },
      { name: 'Coverage', score: 86 },
      { name: 'Exports', score: 72 },
    ],
  },
];

const readinessBars = [
  { label: 'Modules', score: 100, value: '25h' },
  { label: 'Tests', score: 92, value: '8' },
  { label: 'ID Checks', score: 76, value: 'Live' },
  { label: 'Grades', score: 64, value: 'Ready' },
];

const impactBars = [
  { name: 'Civic', score: 88 },
  { name: 'Literacy', score: 82 },
  { name: 'Defense', score: 74 },
  { name: 'Resilience', score: 91 },
];

const workflowSteps = [
  'Common Phase Sessions',
  'Enrollment Verify',
  'Assessments Administer',
  'Classification Assign',
  'Grades Release',
];

const dashboardStats = [
  { label: 'Common Phase', value: 'In Progress', icon: BookOpen, tone: 'bg-blue-50 text-blue-700' },
  { label: 'Assessments', value: 'Completed', icon: CheckCircle, tone: 'bg-emerald-50 text-emerald-700' },
  { label: 'Classification', value: 'MTS Army', icon: ShieldCheck, tone: 'bg-violet-50 text-violet-700' },
  { label: 'NSTP Grade', value: '1.25', icon: Star, tone: 'bg-amber-50 text-amber-700' },
];

const trustItems = [
  { icon: LockKeyhole, title: 'Secure Platform', copy: 'Role-based access and data encryption protect every user.' },
  { icon: ShieldCheck, title: 'Privacy First', copy: 'Student records stay confidential and properly governed.' },
  { icon: Cloud, title: 'Always Available', copy: 'Access the portal anytime with reliable performance.' },
  { icon: Users, title: 'Built for BiPSU', copy: 'Designed for service, learning, and university excellence.' },
];

// Program list is intentionally centralized so it can be updated from the official
// BiPSU AY 2025-2026 Program Offerings when exact program text is finalized.
const BIPSU_PROGRAMS = [
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
    programs: ['Bachelor of Elementary Education', 'Bachelor of Secondary Education', 'Bachelor of Physical Education'],
  },
  {
    school: 'School of Teacher Education - Biliran Campus',
    programs: ['Bachelor of Elementary Education', 'Bachelor of Secondary Education'],
  },
  {
    school: 'School of Agri-Fisheries',
    programs: ['Bachelor of Science in Agriculture', 'Bachelor of Science in Fisheries'],
  },
  {
    school: 'School of Agribusiness and Forest Resource Management',
    programs: ['Bachelor of Science in Agribusiness', 'Bachelor of Science in Forestry'],
  },
  {
    school: 'School of Graduate Studies',
    programs: ['Master in Public Management', 'Master of Arts in Education', 'Doctor of Philosophy in Education'],
  },
];

const YEAR_LEVEL_OPTIONS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const INDUSTRIAL_TECHNOLOGY_PROGRAM = 'BS in Industrial Technology';
const INDUSTRIAL_TECHNOLOGY_MAJORS = [
  'Automotive Technology',
  'Drafting Technology',
  'Electricity Technology',
  'Foods Technology',
  'Garments Technology',
  'Handicraft Technology',
  'Refrigeration and Air-Conditioning Technology',
];

const buildOfficialName = (firstName: string, middleName: string, surname: string) => (
  `${firstName.trim()} ${middleName.trim()} ${surname.trim()}`.replace(/\s+/g, ' ').trim()
);

const buildCurrentAddress = (houseStreetPurok: string, barangay: string, municipality: string, province: string) => {
  return [houseStreetPurok, barangay, municipality, province]
    .map((item) => item.trim())
    .filter(Boolean)
    .join(', ');
};

export default function LoginPage({ onLogin }: { onLogin: (user: any) => void }) {
  const [publicView, setPublicView] = useState<PublicView>(() => componentFromPath() ? 'component' : 'home');
  const [mode, setMode] = useState<LoginMode>('login');
  const [showAuth, setShowAuth] = useState(false);
  const [surname, setSurname] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [school, setSchool] = useState('');
  const [degreeProgram, setDegreeProgram] = useState('');
  const [yearLevel, setYearLevel] = useState('');
  const [major, setMajor] = useState('');
  const [gender, setGender] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [houseStreetPurok, setHouseStreetPurok] = useState('');
  const [barangay, setBarangay] = useState('');
  const [municipality, setMunicipality] = useState<BiliranMunicipality | ''>('');
  const [province, setProvince] = useState('Biliran');
  const [provincialAddress, setProvincialAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authAttemptTimestamps, setAuthAttemptTimestamps] = useState<number[]>([]);
  const [authCooldownUntil, setAuthCooldownUntil] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState(portalFeatures[0].label);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [selectedLandingComponent, setSelectedLandingComponent] = useState<ComponentKey>(() => componentFromPath() || 'CWTS');
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    return localStorage.getItem('nstp-theme') === 'dark' ? 'dark' : 'light';
  });
  const selectedSchoolPrograms = BIPSU_PROGRAMS.find((item) => item.school === school)?.programs || [];
  const hasAuthDraft = [
    surname,
    firstName,
    middleName,
    studentId,
    school,
    degreeProgram,
    yearLevel,
    major,
    gender,
    birthdate,
    houseStreetPurok,
    barangay,
    municipality,
    provincialAddress,
    contactNumber,
    email,
    password,
    confirmPassword,
  ].some((value) => String(value || '').trim());
  const confirmCloseAuth = () => !hasAuthDraft || window.confirm('Close the portal access form and discard the current entries?');
  const closeAuthModal = () => setShowAuth(false);

  useModalEscape({
    open: showAuth,
    onClose: closeAuthModal,
    confirmClose: confirmCloseAuth,
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', themeMode === 'dark');
    localStorage.setItem('nstp-theme', themeMode);
  }, [themeMode]);

  useEffect(() => {
    const syncPublicRoute = () => {
      const component = componentFromPath();
      if (component) {
        setSelectedLandingComponent(component);
        setPublicView('component');
      } else {
        setPublicView('home');
      }
      window.scrollTo({ top: 0, behavior: 'auto' });
    };

    window.addEventListener('popstate', syncPublicRoute);
    return () => window.removeEventListener('popstate', syncPublicRoute);
  }, []);

  useEffect(() => {
    if (publicView !== 'preview') return;
    const timer = window.setInterval(() => {
      setPreviewIndex((index) => (index + 1) % portalFeatures.length);
    }, 2600);
    return () => window.clearInterval(timer);
  }, [publicView]);

  const showPublicView = (view: PublicView, featureLabel?: string, targetId = 'public-sections') => {
    if (window.location.pathname.startsWith('/components/')) {
      window.history.pushState({}, '', '/');
    }
    if (featureLabel) {
      const nextIndex = portalFeatures.findIndex((feature) => feature.label === featureLabel);
      setSelectedFeature(featureLabel);
      if (nextIndex >= 0) setPreviewIndex(nextIndex);
    }
    setPublicView(view);
    setMobileMenuOpen(false);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  };

  const openComponentInformation = (component: ComponentKey) => {
    setSelectedLandingComponent(component);
    setPublicView('component');
    setMobileMenuOpen(false);
    window.history.pushState({}, '', `/components/${component.toLowerCase()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const watchOverview = () => {
    setPreviewIndex(0);
    showPublicView('preview', portalFeatures[0].label, 'overview-carousel');
  };

  const openAuth = (nextMode: LoginMode = 'login') => {
    setMode(nextMode);
    setShowAuth(true);
    setError(null);
    setNotice(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    window.setTimeout(() => setIsSubmitting(false), 700);
    setNotice(null);
    setError(null);

    ensureNstpSeedData();
    const accounts = loadAccounts();
    const pendingRegistrations = loadPendingStudentRegistrations();
    const now = Date.now();

    if (mode === 'login' && authCooldownUntil > now) {
      setError(`Too many login attempts. Try again in ${Math.ceil((authCooldownUntil - now) / 1000)} seconds.`);
      return;
    }

    if (mode === 'register') {
      const cleanStudentId = studentId.trim();
      if (!cleanStudentId) {
        setError('Enter your BiPSU student ID for registrar verification.');
        return;
      }

      if (!surname.trim() || !firstName.trim() || !school || !degreeProgram.trim() || !gender.trim() || !birthdate.trim() || !contactNumber.trim() || !email.trim() || !password || !confirmPassword) {
        setError('Complete the required official student profile fields before submission.');
        return;
      }

      if (!yearLevel) {
        setError('Year Level is required.');
        return;
      }

      if (degreeProgram === INDUSTRIAL_TECHNOLOGY_PROGRAM && !major) {
        setError('Major is required for BS in Industrial Technology.');
        return;
      }

      if (!barangay.trim()) {
        setError('Barangay is required.');
        return;
      }

      if (!municipality) {
        setError('Municipality is required.');
        return;
      }

      if (!province.trim()) {
        setError('Province is required.');
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      const duplicateAccount = accounts.find((account) => account.email.toLowerCase() === email.toLowerCase());
      if (duplicateAccount) {
        setError('An account with this email already exists. Please sign in.');
        return;
      }

      const duplicateStudentId = accounts.find((account) => account.studentId?.toLowerCase() === cleanStudentId.toLowerCase());
      if (duplicateStudentId) {
        setError('This student ID is already connected to an approved account.');
        return;
      }

      const duplicatePending = pendingRegistrations.find((registration) =>
        registration.email.toLowerCase() === email.toLowerCase() ||
        registration.studentId?.toLowerCase() === cleanStudentId.toLowerCase()
      );
      if (duplicatePending) {
        setError('Your registration is already pending admin approval.');
        return;
      }

      const pendingRequest = {
        id: `pending-${Math.random().toString(36).slice(2, 10)}`,
        studentId: cleanStudentId,
        surname: surname.trim(),
        firstName: firstName.trim(),
        middleName: middleName.trim(),
        name: buildOfficialName(firstName, middleName, surname),
        email: email.trim(),
        password,
        school,
        department: school,
        degreeProgram: degreeProgram.trim(),
        yearLevel,
        ...(degreeProgram === INDUSTRIAL_TECHNOLOGY_PROGRAM ? { major } : {}),
        gender,
        birthdate,
        houseStreetPurok: houseStreetPurok.trim(),
        barangay: barangay.trim(),
        municipality,
        province: province.trim(),
        currentAddress: buildCurrentAddress(houseStreetPurok, barangay, municipality, province),
        provincialAddress: provincialAddress.trim(),
        contactNumber: contactNumber.trim(),
        createdAt: new Date().toISOString(),
      };

      savePendingStudentRegistrations([pendingRequest, ...pendingRegistrations]);
      addAudit({ id: pendingRequest.id, name: pendingRequest.name, role: 'student' }, 'Registration submitted', 'Account', pendingRequest.id, pendingRequest.email);
      setNotice('Registration submitted. Please wait for admin approval before signing in.');
      setSurname('');
      setFirstName('');
      setMiddleName('');
      setStudentId('');
      setSchool('');
      setDegreeProgram('');
      setYearLevel('');
      setMajor('');
      setGender('');
      setBirthdate('');
      setHouseStreetPurok('');
      setBarangay('');
      setMunicipality('');
      setProvince('Biliran');
      setProvincialAddress('');
      setContactNumber('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setMode('login');
      return;
    }

    const match = accounts.find((account) => account.email.toLowerCase() === email.toLowerCase() && account.password === password);

    if (match) {
      setAuthAttemptTimestamps([]);
      setAuthCooldownUntil(0);
      addAudit(match, 'Login successful', 'Account', match.id, match.email);
      onLogin(match);
      return;
    }

    const pending = pendingRegistrations.find((registration) => registration.email.toLowerCase() === email.toLowerCase());
    if (pending) {
      addAudit({ id: pending.id, name: pending.name, role: 'student' }, 'Login blocked pending approval', 'Account', pending.id, pending.email);
      setError('Your account is still pending admin approval.');
      return;
    }

    const recentAttempts = [...authAttemptTimestamps.filter((time) => now - time < 60_000), now];
    setAuthAttemptTimestamps(recentAttempts);
    if (recentAttempts.length >= 5) {
      setAuthCooldownUntil(now + 30_000);
      addAudit({ id: 'anonymous', name: email || 'Unknown user', role: 'guest' }, 'Login rate limited', 'Account', email || 'unknown', `${recentAttempts.length} attempts in one minute`);
      setError('Too many login attempts. Please wait 30 seconds before trying again.');
      return;
    }

    addAudit({ id: 'anonymous', name: email || 'Unknown user', role: 'guest' }, 'Login failed', 'Account', email || 'unknown', 'Invalid credentials');
    setError('Invalid email or password.');
  };

  const useDemo = (persona: 'admin' | 'facilitator' | 'common' | 'cwts' | 'lts' | 'mts') => {
    ensureNstpSeedData();
    const address = {
      admin: 'admin@nstp.edu',
      facilitator: 'facilitator@nstp.edu',
      common: 'common.phase@student.edu',
      cwts: 'cwts.student@student.edu',
      lts: 'lts.student@student.edu',
      mts: 'mts.student@student.edu',
    }[persona];
    const account = loadAccounts().find((value) => value.email === address);
    if (!account) {
      setError('Demo account seed could not be loaded. Please refresh and try again.');
      return;
    }
    onLogin(account);
  };

  return (
    <div className="landing-page min-h-screen bg-[#edf5fb] text-[#061a42] dark:bg-[#08111f] dark:text-slate-100">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#061f4f] text-white shadow-[0_10px_30px_-20px_rgba(2,6,23,0.8)]">
        <div className="mx-auto flex max-w-[1540px] items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-5 lg:px-12">
          <button onClick={() => showPublicView('home', undefined, 'landing-hero')} className="flex min-w-0 items-center gap-2 text-left sm:gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white p-1 shadow-sm sm:h-14 sm:w-14 sm:rounded-2xl sm:p-1.5">
              <img src="/bipsu-logo.png" alt="Biliran Province State University logo" className="h-full w-full object-contain" />
            </span>
            <span className="flex min-w-0 items-center gap-3 sm:gap-4">
              <span className="font-brand hidden border-r border-white/40 pr-5 text-3xl font-semibold tracking-tight sm:block">BiPSU</span>
              <span>
                <span className="font-portal block text-base font-semibold uppercase leading-tight tracking-[0.14em] sm:text-2xl sm:tracking-[0.22em]">NSTP Portal</span>
                <span className="block max-w-[9rem] text-[10px] font-bold uppercase leading-tight tracking-[0.06em] text-white/82 sm:max-w-none sm:text-xs">National Service Training Program</span>
              </span>
            </span>
          </button>

          <nav className="hidden items-center gap-7 lg:flex">
            {[
              ['nstp', 'About NSTP'],
              ['school', 'Guidelines'],
              ['portal', 'FAQs'],
              ['school', 'Contact'],
            ].map(([id, label]) => (
              <button
                key={label}
                onClick={() => showPublicView(id as PublicView)}
                className="rounded-full px-2 py-2 text-sm font-semibold uppercase tracking-tight text-white/88 hover:text-white"
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setThemeMode((mode) => (mode === 'dark' ? 'light' : 'dark'))}
              className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-blue-300/70 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-tight text-white shadow-sm hover:bg-white/12 sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm"
              aria-label="Toggle landing page theme"
            >
              {themeMode === 'dark' ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
              <span className="hidden sm:inline">{themeMode === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
            <button onClick={() => openAuth('login')} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-[#e5b73b] px-3 py-2 text-xs font-semibold uppercase tracking-tight text-[#002147] shadow-sm hover:bg-[#ffd968] sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm">
              <LockKeyhole className="h-4 w-4" />
              <span className="hidden min-[390px]:inline">Secure </span>Login
            </button>
            <button onClick={() => setMobileMenuOpen((open) => !open)} className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 text-white lg:hidden" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="border-t border-white/10 bg-[#08275d] px-5 py-3 lg:hidden">
            <div className="grid gap-2">
              {[
                ['nstp', 'About NSTP'],
                ['school', 'Guidelines'],
                ['portal', 'FAQs'],
                ['school', 'Contact'],
              ].map(([id, label]) => (
                <button
                  key={label}
                  onClick={() => showPublicView(id as PublicView)}
                  className="rounded-xl px-3 py-3 text-left text-sm font-semibold uppercase tracking-tight text-white/90 hover:bg-white/10"
                >
                  {label}
                </button>
              ))}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openAuth('register');
                }}
                className="rounded-xl bg-[#ffd24d] px-3 py-3 text-left text-sm font-semibold uppercase tracking-tight text-[#061a42]"
              >
                Request Student Access
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="overflow-x-hidden">
        {publicView === 'component' ? (
          <ComponentInformationPage
            componentKey={selectedLandingComponent}
            component={componentInformation[selectedLandingComponent]}
            onBack={() => showPublicView('home', undefined, 'landing-hero')}
            onSelect={openComponentInformation}
            onLogin={() => openAuth('login')}
            onCommonPhase={() => showPublicView('nstp')}
          />
        ) : (
          <>
        <section id="landing-hero" className="relative isolate scroll-mt-24 overflow-hidden bg-[#f9f9ff] dark:bg-[#07111f]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_13%_18%,rgba(229,183,59,0.16),transparent_29%),radial-gradient(circle_at_83%_20%,rgba(0,33,71,0.12),transparent_34%)] dark:bg-[radial-gradient(circle_at_13%_18%,rgba(229,183,59,0.10),transparent_29%),radial-gradient(circle_at_83%_20%,rgba(106,156,226,0.18),transparent_34%)]" />
          <div className="absolute inset-0 opacity-60 [background-image:radial-gradient(rgba(0,33,71,0.08)_1px,transparent_1px)] [background-size:44px_44px] dark:opacity-25" />
          <div className="relative mx-auto grid min-h-[calc(100svh-5rem)] max-w-[1280px] items-center gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16 lg:px-8 lg:py-20">
            <div className="max-w-2xl">
              <span className="landing-label inline-flex items-center gap-2 rounded-full bg-[#002147] px-4 py-2 text-xs font-semibold uppercase tracking-[0.13em] text-[#d6e3ff] dark:bg-blue-400/12 dark:text-blue-100">
                <Sparkles className="h-4 w-4 text-[#e5b73b]" />
                Empowering future community leaders
              </span>
              <p className="landing-label mt-8 text-xs font-semibold uppercase tracking-[0.32em] text-[#735c00] dark:text-[#ffe088]">
                Biliran Province State University
              </p>
              <h1 className="mt-4 text-[clamp(2.55rem,5vw,4.25rem)] font-bold leading-[1.09] tracking-[-0.045em] text-[#000a1e] dark:text-white">
                Welcome to the BiPSU <span className="text-[#735c00] dark:text-[#ffe088]">NSTP Portal</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-8 text-[#44474e] dark:text-slate-300 sm:text-lg">
                A guided digital workspace for Brilliance, Innovation, Progress, Service and Unity, connecting student formation with meaningful service in Biliran communities.
              </p>
              <div className="landing-label mt-9 flex flex-col gap-3 sm:flex-row">
                <button onClick={() => openAuth('login')} className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-[#002147] px-8 py-4 text-sm font-semibold uppercase tracking-[0.06em] text-white shadow-[0_18px_38px_-20px_rgba(0,33,71,0.8)] transition hover:-translate-y-0.5 hover:bg-[#123766]">
                  <LockKeyhole className="h-5 w-5" />
                  Secure Login
                </button>
                <button onClick={watchOverview} className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl border-2 border-[#002147] bg-white/70 px-8 py-4 text-sm font-semibold uppercase tracking-[0.06em] text-[#002147] transition hover:-translate-y-0.5 hover:bg-[#f0f3ff] dark:border-blue-200 dark:bg-transparent dark:text-blue-100 dark:hover:bg-blue-400/10">
                  <PlayCircle className="h-5 w-5" />
                  View Portal Overview
                </button>
              </div>
              <div className="landing-label mt-12 grid gap-4 border-t border-[#c4c6cf]/70 pt-7 sm:grid-cols-3 dark:border-blue-300/15">
                {[
                  ['25', 'Required common phase hours'],
                  ['3', 'NSTP component pathways'],
                  ['Secure', 'Role-based portal access'],
                ].map(([value, label]) => (
                  <div key={label}>
                    <p className="text-2xl font-bold text-[#002147] dark:text-[#ffe088]">{value}</p>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.11em] text-[#5b6473] dark:text-slate-300">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative lg:pl-3">
              <div className="absolute -right-5 -top-6 h-32 w-32 rounded-3xl border border-[#e5b73b]/45 bg-[#e5b73b]/10" />
              <div className="absolute -bottom-8 -left-6 h-48 w-48 rounded-full bg-[#002147]/10 blur-2xl dark:bg-blue-400/10" />
              <figure className="relative overflow-hidden rounded-[2rem] border border-white bg-white p-2 shadow-[0_34px_75px_-34px_rgba(0,33,71,0.42)] dark:border-blue-300/15 dark:bg-[#101d34]">
                <img src={splashImage} alt="BiPSU NSTP students engaged in learning, service, and preparedness activities" className="aspect-[1.46/1] w-full rounded-[1.6rem] object-cover object-center" />
                <figcaption className="landing-label absolute inset-x-7 bottom-7 rounded-2xl border border-white/45 bg-white/92 p-4 shadow-lg backdrop-blur dark:border-blue-300/15 dark:bg-[#081426]/92">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#735c00] dark:text-[#ffe088]">Official NSTP Portal</p>
                  <p className="mt-1 text-sm font-semibold text-[#002147] dark:text-white">Learning, attendance, assessment, and classification in one system.</p>
                </figcaption>
              </figure>
              <div className="landing-label absolute -left-3 top-8 hidden rounded-2xl border border-[#e5b73b]/35 bg-white px-4 py-3 shadow-xl sm:flex sm:items-center sm:gap-3 dark:bg-[#101d34]">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[#ffe088]/60 text-[#735c00]">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-xs font-bold text-[#002147] dark:text-white">Academic workflow</span>
                  <span className="block text-[11px] text-slate-500 dark:text-slate-300">Secure and role-scoped</span>
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-8 dark:bg-[#08111f] sm:px-7 sm:py-10">
          <div className="mx-auto max-w-[1540px] rounded-xl bg-[#f8fbff] px-5 py-12 shadow-[0_14px_48px_-42px_rgba(0,33,71,0.32)] dark:bg-[#0b1426] sm:px-8 sm:py-16 lg:px-14">
            <div className="mx-auto max-w-3xl text-center">
              <p className="landing-label text-xs font-bold uppercase tracking-[0.23em] text-[#97730a] dark:text-[#ffe088]">NSTP Program Components</p>
              <h2 className="mt-5 text-3xl font-semibold text-[#092c66] dark:text-white sm:text-[2.7rem]">Choose a pathway of service.</h2>
              <span className="mx-auto mt-4 block h-0.5 w-20 bg-[#d2a521]" />
              <p className="mt-5 text-sm leading-7 text-[#434853] dark:text-slate-300 sm:text-base">Following the Common Phase and eligibility review, students continue<br className="hidden sm:block" /> through their classified component.</p>
            </div>
            <nav className="mt-12 grid gap-5 lg:grid-cols-3" aria-label="NSTP program components">
              {landingComponents.map((component) => {
                const Icon = component.icon;
                return (
                  <button
                    key={component.key}
                    type="button"
                    onClick={() => openComponentInformation(component.key)}
                    className={`group relative flex min-h-[19.5rem] flex-col rounded-xl border border-[#d5dfeb] bg-white px-7 pb-7 pt-8 text-left shadow-[0_8px_24px_-22px_rgba(0,33,71,0.25)] transition hover:-translate-y-1 hover:shadow-[0_24px_45px_-28px_rgba(0,33,71,0.34)] dark:border-blue-300/15 dark:bg-[#101d34] ${component.gold ? 'hover:border-[#d2a521]' : 'hover:border-[#174589]'}`}
                  >
                    <span className={`absolute inset-x-1 top-0 h-1.5 rounded-full ${component.gold ? 'bg-[#d3a722]' : 'bg-[#113b76]'}`} />
                    <span className="flex items-center gap-5">
                      <span className={`grid h-16 w-16 shrink-0 place-items-center rounded-full text-white shadow-md ${component.gold ? 'bg-gradient-to-br from-[#997000] to-[#e7ba30]' : 'bg-gradient-to-br from-[#113b76] to-[#031f50]'}`}>
                        <Icon className="h-8 w-8" strokeWidth={1.7} />
                      </span>
                      <span>
                        <span className="landing-label block text-2xl font-bold text-[#092c66] dark:text-white">{component.key}</span>
                        <span className="landing-label mt-2 block text-xs font-bold uppercase tracking-[0.1em] text-[#907006] dark:text-[#ffe088]">{component.title}</span>
                        <span className="mt-4 block h-0.5 w-9 bg-[#d2a521]" />
                      </span>
                    </span>
                    <span className="mt-6 flex-1 text-sm leading-7 text-[#434853] dark:text-slate-300 sm:text-base">{component.copy}</span>
                    <span className="landing-label mt-6 inline-flex items-center gap-4 text-sm font-bold uppercase text-[#092c66] dark:text-blue-100">
                      View information
                      <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                    </span>
                  </button>
                );
              })}
            </nav>
            <div className="mt-12 grid gap-6 border-t border-transparent pt-2 sm:grid-cols-2 xl:grid-cols-4">
              {servicePillars.map((pillar, index) => {
                const Icon = pillar.icon;
                return (
                  <div key={pillar.title} className={`flex items-start gap-4 xl:px-6 ${index > 0 ? 'xl:border-l xl:border-[#d5dfeb] dark:xl:border-white/10' : ''}`}>
                    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#eaf0f8] text-[#10376f] dark:bg-white/10 dark:text-blue-100">
                      <Icon className="h-7 w-7" strokeWidth={1.8} />
                    </span>
                    <span>
                      <span className="landing-label block text-xs font-bold uppercase tracking-tight text-[#092c66] dark:text-white">{pillar.title}</span>
                      <span className="mt-2 block text-xs leading-5 text-[#434853] dark:text-slate-300">{pillar.copy}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="relative z-10 mx-auto max-w-[1460px] px-4 py-12 sm:px-5 lg:px-9">
          <div className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_22px_56px_-34px_rgba(15,23,42,0.55)] sm:grid-cols-2 lg:grid-cols-6">
            {portalFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <button
                  key={feature.label}
                  onClick={() => showPublicView('feature', feature.label)}
                  className="group flex min-h-[9.25rem] flex-col items-center justify-start border-b border-slate-200 px-4 py-5 text-center hover:bg-blue-50 sm:px-5 sm:py-6 lg:min-h-[12rem] lg:border-b-0 lg:border-r lg:px-6 lg:py-8"
                >
                  <span className={`mb-3 grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br ${feature.color} text-white shadow-lg shadow-slate-900/10 sm:h-14 sm:w-14 lg:mb-4`}>
                    <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
                  </span>
                  <span className="text-sm font-semibold leading-tight text-[#061a42] sm:text-base">{feature.label}</span>
                  <span className="mt-2 text-xs leading-5 text-[#30476d] sm:text-sm">{feature.value}</span>
                  <span className="mt-3 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600 group-hover:border-blue-200 group-hover:bg-white">
                    {feature.metric} - {feature.status}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section id="public-sections" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-10">
          {publicView === 'home' && <HomeSections onSelect={openComponentInformation} />}
          {publicView === 'nstp' && <NstpSections />}
          {publicView === 'school' && <SchoolSections />}
          {publicView === 'portal' && <PortalSections onLogin={() => openAuth('login')} />}
          {publicView === 'feature' && <FeatureSections feature={portalFeatures.find((feature) => feature.label === selectedFeature) || portalFeatures[0]} onPreview={watchOverview} />}
          {publicView === 'preview' && <OverviewPreviewCarousel activeIndex={previewIndex} onSelect={setPreviewIndex} onLogin={() => openAuth('login')} />}
        </section>

        <TrustBand />
          </>
        )}
      </main>

      {showAuth && (
        <div className="fixed inset-0 z-50 overflow-auto bg-slate-950/70 p-3 backdrop-blur-sm md:p-6">
          <div className="mx-auto grid min-h-full max-w-6xl items-center">
            <div className="grid overflow-hidden rounded-2xl border border-blue-200/70 bg-white shadow-[0_25px_65px_-28px_rgba(11,78,162,0.45)] dark:border-slate-700 dark:bg-slate-950 lg:grid-cols-[0.86fr_1.14fr]">
              <section className="relative hidden bg-[#06245c] p-8 text-white lg:block">
                <div className="absolute inset-0 bg-[#06245c]" />
                <div className="absolute inset-x-0 top-0 h-1 bg-[#f2b705]" />
                <div className="relative">
                  <div className="mb-6 flex items-center gap-3">
                    <img src="/bipsu-logo.png" alt="Biliran Province State University logo" className="h-16 w-16 rounded-2xl bg-white p-2" />
                    <img src="/nstp-logo.svg" alt="NSTP logo" className="h-16 w-16 rounded-2xl bg-white p-2" />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-100">Official BiPSU NSTP Portal</p>
                  <h2 className="mt-2 text-3xl font-semibold">Secure access for enrollment, learning records, and NSTP administration.</h2>
                  <div className="mt-8 space-y-3">
                    {['Student ID approval before access', 'Role-based dashboards for students, facilitators, and admins', 'Grades, reports, modules, and exams in one portal'].map((item) => (
                      <div key={item} className="flex items-center gap-3 rounded-xl border border-white/18 bg-white/10 p-3 text-sm font-semibold">
                        <CheckCircle className="h-4 w-4 text-[#ffd24d]" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="p-6 md:p-10">
                <div className="mb-6 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-3 flex items-center gap-2 lg:hidden">
                      <img src="/bipsu-logo.png" alt="Biliran Province State University logo" className="h-11 w-11 rounded-xl border border-blue-100 bg-white p-1" />
                      <img src="/nstp-logo.svg" alt="NSTP logo" className="h-11 w-11 rounded-xl border border-blue-100 bg-white p-1" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">Portal Access</p>
                    <h2 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">{mode === 'login' ? 'Sign in to continue' : 'Request student access'}</h2>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {mode === 'login'
                        ? 'Access modules, assessments, grades, announcements, reports, and enrollment tools.'
                        : 'Use your BiPSU student ID. Admin approval is required before login.'}
                    </p>
                  </div>
                  <button onClick={() => { if (confirmCloseAuth()) closeAuthModal(); }} className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                    Close
                  </button>
                </div>

                <div className="mb-6 inline-flex rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900">
                  {(['login', 'register'] as LoginMode[]).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        setMode(item);
                        setError(null);
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${mode === item ? 'bg-blue-700 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}
                    >
                      {item === 'login' ? 'Login' : 'Register'}
                    </button>
                  ))}
                </div>

                {mode === 'login' && (
                  <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <DemoButton icon={ShieldCheck} badge="Admin" label="Demo Admin" description="System oversight and classification workflow" onClick={() => useDemo('admin')} />
                    <DemoButton icon={GraduationCap} badge="Facilitator" label="Demo Facilitator" description="Sessions, attendance, grading, and reports" onClick={() => useDemo('facilitator')} />
                    <DemoButton icon={UserRound} badge="Common Phase" label="Demo Student - Common Phase" description="18 / 25 contact hours completed" onClick={() => useDemo('common')} />
                    <DemoButton icon={UserRound} badge="CWTS" label="Demo Student - CWTS" description="Classified with component records" onClick={() => useDemo('cwts')} />
                    <DemoButton icon={UserRound} badge="LTS" label="Demo Student - LTS" description="Literacy service learner workflow" onClick={() => useDemo('lts')} />
                    <DemoButton icon={UserRound} badge="MTS" label="Demo Student - MTS" description="Military training learner workflow" onClick={() => useDemo('mts')} />
                  </div>
                )}

                {notice && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100">{notice}</div>}
                {error && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100">{error}</div>}

                <form onSubmit={handleSubmit} className="grid gap-4">
                  {mode === 'register' && (
                    <div className="max-h-[58vh] space-y-5 overflow-y-auto pr-1">
                      <FormSection title="Student Information">
                        <Field label="BiPSU Student ID" icon={IdCard} value={studentId} onChange={setStudentId} placeholder="2026-0000" required />
                        <Field label="Surname" value={surname} onChange={setSurname} placeholder="Dela Cruz" required />
                        <Field label="First Name" value={firstName} onChange={setFirstName} placeholder="Juan" required />
                        <Field label="Middle Name" value={middleName} onChange={setMiddleName} placeholder="Santos" optional />
                        <SelectField label="Gender" value={gender} onChange={setGender} required options={['Female', 'Male', 'Prefer not to say']} placeholder="Select gender" />
                        <Field label="Birthdate" type="date" value={birthdate} onChange={setBirthdate} placeholder="Birthdate" required />
                      </FormSection>

                      <FormSection title="Academic Information">
                        <SelectField
                          label="School / College / Department"
                          value={school}
                          onChange={(value) => {
                            setSchool(value);
                            setDegreeProgram('');
                            setMajor('');
                          }}
                          required
                          options={BIPSU_PROGRAMS.map((item) => item.school)}
                          placeholder="Select your school"
                        />
                        <SelectField
                          label="Degree Program"
                          value={degreeProgram}
                          onChange={(value) => {
                            setDegreeProgram(value);
                            if (value !== INDUSTRIAL_TECHNOLOGY_PROGRAM) setMajor('');
                          }}
                          required
                          options={selectedSchoolPrograms}
                          placeholder={school ? 'Select your degree program' : 'Select a school first'}
                          disabled={!school}
                        />
                        <SelectField
                          label="Year Level"
                          value={yearLevel}
                          onChange={setYearLevel}
                          required
                          options={YEAR_LEVEL_OPTIONS}
                          placeholder="Select year level"
                        />
                        {degreeProgram === INDUSTRIAL_TECHNOLOGY_PROGRAM && (
                          <SelectField
                            label="Major"
                            value={major}
                            onChange={setMajor}
                            required
                            options={INDUSTRIAL_TECHNOLOGY_MAJORS}
                            placeholder="Select major"
                          />
                        )}
                      </FormSection>

                      <FormSection title="Contact and Address">
                        <Field label="Contact Number" value={contactNumber} onChange={setContactNumber} placeholder="09xx xxx xxxx" required />
                        <Field
                          label="House No. / Street / Purok"
                          value={houseStreetPurok}
                          onChange={setHouseStreetPurok}
                          placeholder="Example: Purok 2, M.H. Del Pilar St."
                          optional
                          helper="You may include your house number, street, or purok."
                        />
                        <Field
                          label="Barangay"
                          value={barangay}
                          onChange={setBarangay}
                          placeholder="Example: Brgy. P.I. Garcia"
                          required
                          helper="This helps assign the correct municipal facilitator."
                        />
                        <SelectField
                          label="Municipality"
                          value={municipality}
                          onChange={(value) => setMunicipality(value as BiliranMunicipality | '')}
                          required
                          options={BILIRAN_MUNICIPALITIES}
                          placeholder="Select municipality"
                          helper="This helps assign the correct municipal facilitator."
                        />
                        <Field label="Province" value={province} onChange={setProvince} placeholder="Example: Biliran" required readOnly helper="Default province for current BiPSU NSTP routing." />
                        <Field label="Provincial Address" value={provincialAddress} onChange={setProvincialAddress} placeholder="Permanent home address" optional helper="Optional if same as current address." />
                      </FormSection>
                    </div>
                  )}

                  {mode === 'register' ? (
                    <FormSection title="Account Security">
                      <Field label="Email Address" icon={Mail} type="email" value={email} onChange={setEmail} placeholder="student@bipsu.edu.ph" required />
                      <Field label="Password" icon={Lock} type="password" value={password} onChange={setPassword} placeholder="Enter your password" required />
                      <Field label="Confirm Password" icon={Lock} type="password" value={confirmPassword} onChange={setConfirmPassword} placeholder="Re-enter your password" required />
                    </FormSection>
                  ) : (
                    <>
                      <Field label="Email Address" icon={Mail} type="email" value={email} onChange={setEmail} placeholder="student@bipsu.edu.ph" required />
                      <Field label="Password" icon={Lock} type="password" value={password} onChange={setPassword} placeholder="Enter your password" required />
                    </>
                  )}

                  <button type="submit" disabled={isSubmitting} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 py-3 font-semibold text-white shadow-sm ring-1 ring-blue-800/10 hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-65">
                    {isSubmitting ? 'Processing...' : mode === 'login' ? 'Continue to Dashboard' : 'Submit Registration'}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>

                {mode === 'login' && (
                  <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                    <p className="font-bold text-slate-800 dark:text-slate-100">Demo Credentials</p>
                    <p>Admin: admin@nstp.edu / admin</p>
                    <p>Facilitator: facilitator@nstp.edu / facilitator</p>
                    <p>Student: juan.dela-cruz@student.edu / student / ID 2024-0001</p>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ComponentInformationPage({
  componentKey,
  component,
  onBack,
  onSelect,
  onLogin,
  onCommonPhase,
}: {
  componentKey: ComponentKey;
  component: typeof componentInformation[ComponentKey];
  onBack: () => void;
  onSelect: (component: ComponentKey) => void;
  onLogin: () => void;
  onCommonPhase: () => void;
}) {
  return (
    <div className="bg-[#f9f9ff] dark:bg-[#07111f]">
      <div className="mx-auto flex max-w-[1280px] items-center gap-2 px-5 py-6 text-xs font-semibold uppercase tracking-[0.14em] text-[#596477] sm:px-8">
        <button type="button" onClick={onBack} className="landing-label hover:text-[#735c00] dark:text-slate-300 dark:hover:text-[#ffe088]">Home</button>
        <span aria-hidden="true">/</span>
        <span className="landing-label text-[#002147] dark:text-blue-100">{componentKey}</span>
      </div>

      <section className="relative isolate overflow-hidden bg-[#002147] text-white">
        <img
          src={splashImage}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-right opacity-35"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#002147_0%,rgba(0,33,71,0.97)_42%,rgba(0,33,71,0.58)_100%)]" />
        <div className="relative mx-auto grid min-h-[28rem] max-w-[1280px] items-center px-5 py-14 sm:px-8 lg:grid-cols-[0.62fr_0.38fr]">
          <div className="max-w-3xl">
            <p className="landing-label inline-flex rounded-full bg-[#fddd7c] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#574500]">
              NSTP Component
            </p>
            <h1 className="mt-6 text-[clamp(2.25rem,5vw,3.6rem)] font-bold leading-[1.12]">{component.label} ({componentKey})</h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/88 sm:text-lg">{component.lead}</p>
            <div className="landing-label mt-9 flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={onLogin} className="inline-flex min-h-13 items-center justify-center gap-2 rounded-xl bg-[#fddd7c] px-7 py-3 text-sm font-semibold uppercase tracking-[0.05em] text-[#574500] shadow-lg hover:bg-[#ffe088]">
                <LockKeyhole className="h-4 w-4" />
                Access Portal
              </button>
              <button type="button" onClick={onCommonPhase} className="inline-flex min-h-13 items-center justify-center gap-2 rounded-xl border border-white/35 bg-white/8 px-7 py-3 text-sm font-semibold uppercase tracking-[0.05em] text-white hover:bg-white/15">
                Common Phase Requirements
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-5 py-14 sm:px-8 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <p className="landing-label text-xs font-semibold uppercase tracking-[0.18em] text-[#735c00] dark:text-[#ffe088]">{component.badge}</p>
            <h2 className="mt-4 border-l-4 border-[#e5b73b] pl-4 text-3xl font-semibold text-[#002147] dark:text-white">What is {componentKey}?</h2>
            <div className="mt-6 space-y-5 text-sm leading-8 text-[#44474e] dark:text-slate-300 sm:text-base">
              {component.overview.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {component.focus.map(({ title, copy, icon: Icon }) => (
              <article key={title} className="rounded-2xl border border-[#d8e3fa] bg-white p-5 shadow-sm dark:border-blue-300/15 dark:bg-[#101d34]">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#f0f3ff] text-[#002147] dark:bg-blue-300/10 dark:text-[#ffe088]">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="landing-label mt-4 text-sm font-semibold text-[#002147] dark:text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#596477] dark:text-slate-300">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#002147] px-5 py-14 text-white sm:px-8 sm:py-20">
        <div className="mx-auto max-w-[1280px]">
          <div className="max-w-2xl">
            <p className="landing-label text-xs font-semibold uppercase tracking-[0.18em] text-[#ffe088]">Impactful activities</p>
            <h2 className="mt-3 text-3xl font-semibold">Purposeful work beyond the classroom.</h2>
            <p className="mt-4 text-sm leading-7 text-white/75 sm:text-base">Component sessions connect learning outcomes with recorded participation, outputs, and facilitator-guided progress.</p>
          </div>
          <div className="mt-9 grid gap-4 md:grid-cols-3">
            {component.activities.map(({ title, copy, icon: Icon }, index) => (
              <article key={title} className={`rounded-2xl border p-6 ${index === 0 ? 'border-[#e5b73b]/45 bg-[#e5b73b]/12' : 'border-white/15 bg-white/6'}`}>
                <Icon className="h-7 w-7 text-[#ffe088]" />
                <h3 className="landing-label mt-7 text-lg font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-white/76">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-5 py-14 sm:px-8 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <p className="landing-label text-xs font-semibold uppercase tracking-[0.18em] text-[#735c00] dark:text-[#ffe088]">Learning resources</p>
            <h2 className="mt-3 text-3xl font-semibold text-[#002147] dark:text-white">Approved materials inside your portal.</h2>
            <div className="mt-7 grid gap-3">
              {component.resources.map((resource) => (
                <div key={resource} className="flex flex-col gap-3 rounded-xl border border-[#d8e3fa] bg-white p-4 sm:flex-row sm:items-center sm:justify-between dark:border-blue-300/15 dark:bg-[#101d34]">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 shrink-0 text-[#735c00] dark:text-[#ffe088]" />
                    <p className="landing-label text-sm font-semibold text-[#002147] dark:text-white">{resource}</p>
                  </div>
                  <button type="button" onClick={onLogin} className="landing-label rounded-lg bg-[#f0f3ff] px-4 py-2 text-xs font-semibold text-[#002147] hover:bg-[#dee9ff] dark:bg-blue-300/10 dark:text-blue-100">
                    Open in portal
                  </button>
                </div>
              ))}
            </div>
          </div>
          <aside className="rounded-[1.5rem] bg-[#f0f3ff] p-7 dark:bg-[#101d34] sm:p-9">
            <p className="landing-label text-xs font-semibold uppercase tracking-[0.18em] text-[#735c00] dark:text-[#ffe088]">Component support</p>
            <h2 className="mt-4 text-2xl font-semibold text-[#002147] dark:text-white">{component.coordinator}</h2>
            <p className="mt-4 text-sm leading-7 text-[#44474e] dark:text-slate-300">{component.coordinatorCopy}</p>
            <button type="button" onClick={onLogin} className="landing-label mt-7 inline-flex items-center gap-2 rounded-xl bg-[#002147] px-6 py-3 text-sm font-semibold text-white hover:bg-[#123766] dark:bg-[#e5b73b] dark:text-[#002147]">
              Sign in for official details
              <ArrowRight className="h-4 w-4" />
            </button>
          </aside>
        </div>
      </section>

      <section className="border-t border-[#d8e3fa] bg-white py-10 dark:border-blue-300/15 dark:bg-[#081426]">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-6 px-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="landing-label text-xs font-semibold uppercase tracking-[0.18em] text-[#735c00] dark:text-[#ffe088]">Explore another component</p>
            <p className="mt-2 text-sm text-[#44474e] dark:text-slate-300">View public information before proceeding to verified portal access.</p>
          </div>
          <div className="landing-label flex flex-wrap gap-2">
            {(Object.keys(componentInformation) as ComponentKey[]).map((key) => (
              <button type="button" key={key} onClick={() => onSelect(key)} className={`rounded-xl px-5 py-3 text-sm font-semibold ${key === componentKey ? 'bg-[#e5b73b] text-[#002147]' : 'border border-[#d8e3fa] text-[#002147] dark:border-blue-300/20 dark:text-blue-100'}`}>
                {key}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="relative hidden lg:block">
      <div className="absolute -left-8 bottom-4 h-24 w-24 rounded-full bg-[#0b4ea2]/10 blur-2xl" />
      <div className="overflow-hidden rounded-[1.5rem] border border-blue-100 bg-white shadow-[0_30px_90px_-36px_rgba(15,45,90,0.55)]">
        <div className="grid min-h-[520px] grid-cols-[170px_1fr]">
          <aside className="bg-[linear-gradient(180deg,#082b66,#031a41)] p-5 text-white">
            <p className="font-brand text-2xl font-semibold leading-none">BiPSU</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-blue-100">NSTP Portal</p>
            <nav className="mt-7 space-y-2">
              {[
                { icon: BarChart3, label: 'Dashboard', active: true },
                { icon: BookOpen, label: 'Common Phase' },
                { icon: ListChecks, label: 'Enrollment' },
                { icon: ClipboardList, label: 'Assessments' },
                { icon: Users, label: 'Classification' },
                { icon: Award, label: 'Grades' },
                { icon: FileText, label: 'Reports' },
                { icon: Megaphone, label: 'Announcements' },
                { icon: Download, label: 'Downloads' },
                { icon: Settings, label: 'Settings' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-bold ${item.active ? 'bg-white/16 text-white shadow-sm' : 'text-white/78'}`}>
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </div>
                );
              })}
            </nav>
          </aside>

          <div className="bg-white p-5">
            <div className="mb-5 flex items-center justify-between">
              <Menu className="h-5 w-5 text-slate-400" />
              <div className="flex items-center gap-4">
                <Bell className="h-4 w-4 text-slate-400" />
                <span className="h-8 w-8 rounded-full bg-[linear-gradient(135deg,#d8e6f7,#8da4c6)] ring-2 ring-blue-100" />
              </div>
            </div>

            <p className="text-sm font-semibold text-slate-500">Welcome back, <span className="text-slate-900">Juan Dela Cruz</span></p>
            <p className="mt-1 text-xs font-semibold text-slate-400">Student</p>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {dashboardStats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className={`rounded-xl p-4 ${stat.tone}`}>
                    <p className="text-xs font-semibold text-slate-900">{stat.label}</p>
                    <p className="mt-2 text-sm font-semibold">{stat.value}</p>
                    <div className="mt-3 flex justify-end">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-white/70">
                        <Icon className="h-5 w-5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="mb-4 text-sm font-semibold text-slate-900">NSTP Workflow</p>
              <div className="relative grid grid-cols-5 gap-2">
                <div className="absolute left-[9%] right-[9%] top-5 h-1 rounded-full bg-gradient-to-r from-[#002147] via-[#0b4ea2] to-[#e5b73b]" />
                {workflowSteps.map((step, index) => (
                  <div key={step} className="relative text-center">
                    <span className={`mx-auto grid h-10 w-10 place-items-center rounded-full border-4 border-white text-sm font-semibold text-white shadow ${index === workflowSteps.length - 1 ? 'bg-emerald-500' : 'bg-blue-600'}`}>
                      {index === workflowSteps.length - 1 ? <CheckCircle className="h-5 w-5" /> : index + 1}
                    </span>
                    <p className="mt-2 text-[11px] font-bold leading-tight text-slate-700">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-[1.05fr_0.95fr] gap-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="mb-2 text-sm font-semibold text-slate-900">Classification Overview</p>
                <div className="grid grid-cols-[130px_1fr] items-center gap-3">
                  <div className="grid h-32 place-items-center">
                    <div className="relative h-28 w-28 rounded-full bg-[conic-gradient(#10b981_0_34%,#2563eb_34%_62%,#f59e0b_62%_84%,#6366f1_84%_100%)]">
                      <span className="absolute inset-7 rounded-full bg-white" />
                      <span className="absolute inset-0 grid place-items-center text-xs font-semibold text-slate-800">1,248</span>
                    </div>
                  </div>
                  <div className="space-y-2 text-xs font-bold">
                    {componentCards.map((item) => (
                      <div key={item.label} className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: item.fill }} />{item.label}</span>
                        <span>{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">Announcements</p>
                  <span className="text-xs font-semibold text-blue-700">View all</span>
                </div>
                {[
                  { title: 'Common Phase Schedule', date: 'May 24, 2026', Icon: CalendarDays },
                  { title: 'Assessment Guidelines', date: 'May 20, 2026', Icon: BookOpen },
                  { title: 'NSTP Orientation', date: 'May 15, 2026', Icon: Megaphone },
                ].map(({ title, date, Icon }) => {
                  const ItemIcon = Icon;
                  return (
                    <div key={String(title)} className="flex items-center gap-3 border-t border-slate-100 py-3">
                      <span className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-blue-700">
                        <ItemIcon className="h-4 w-4" />
                      </span>
                      <span>
                        <span className="block text-xs font-semibold text-slate-900">{title}</span>
                        <span className="block text-[11px] font-semibold text-slate-400">{date}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrustBand() {
  return (
    <section className="relative overflow-hidden bg-[#05275f] text-white">
      <div
        className="absolute inset-y-0 right-0 w-[42%] bg-cover bg-center opacity-35"
        style={{ backgroundImage: `url(${splashImage})` }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,#05275f_0%,#07316e_60%,rgba(5,39,95,0.74)_100%)]" />
      <div className="relative mx-auto grid max-w-[1540px] gap-8 px-5 py-9 lg:grid-cols-[1fr_auto] lg:px-12">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {trustItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="flex gap-4">
                <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-blue-300/30 bg-white/8 text-blue-200">
                  <Icon className="h-8 w-8" />
                </span>
                <span>
                  <span className="block text-base font-semibold">{item.title}</span>
                  <span className="mt-2 block text-sm leading-6 text-white/82">{item.copy}</span>
                </span>
              </div>
            );
          })}
        </div>
        <div className="self-end text-right">
          <p className="text-3xl font-semibold">Serve. Learn. Excel.</p>
          <p className="mt-2 text-xl font-semibold text-[#ffd24d]">#NSTPsaBiPSU</p>
        </div>
      </div>
    </section>
  );
}

function DemoButton({ icon: Icon, badge, label, description, onClick }: { icon: any; badge: string; label: string; description: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="group rounded-xl border border-blue-100 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800">
      <span className="flex items-center justify-between gap-2">
        <Icon className="h-4 w-4 text-blue-700 dark:text-blue-300" />
        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700 dark:bg-blue-500/10 dark:text-blue-200">{badge}</span>
      </span>
      <span className="mt-2 block text-sm font-bold text-slate-800 dark:text-slate-100">{label}</span>
      <span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</span>
    </button>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4 dark:border-slate-700 dark:bg-slate-900/50">
      <h3 className="mb-4 text-sm font-black uppercase tracking-[0.16em] text-blue-800 dark:text-blue-200">{title}</h3>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

function RequiredMark({ required, optional }: { required?: boolean; optional?: boolean }) {
  if (required) return <span className="text-rose-600 dark:text-rose-300">*</span>;
  if (optional) return <span className="text-xs font-semibold text-slate-400">Optional</span>;
  return null;
}

function Field({ label, icon: Icon, value, onChange, placeholder, type = 'text', required = false, optional = false, helper, readOnly = false }: { label: string; icon?: any; value: string; onChange: (value: string) => void; placeholder: string; type?: string; required?: boolean; optional?: boolean; helper?: string; readOnly?: boolean }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center justify-between gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
        <span>{label} <RequiredMark required={required} /></span>
        <RequiredMark optional={optional} />
      </span>
      <span className="relative block">
        {Icon && <Icon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />}
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`w-full rounded-xl border border-blue-200 py-3 ${Icon ? 'pl-10' : 'pl-4'} pr-4 text-sm font-semibold text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-slate-700 dark:text-slate-100 ${readOnly ? 'bg-blue-50 text-slate-600 dark:bg-slate-950 dark:text-slate-300' : 'bg-white dark:bg-slate-900'}`}
          placeholder={placeholder}
          required={required}
          readOnly={readOnly}
        />
      </span>
      {helper && <span className="mt-2 block text-xs font-medium text-slate-500 dark:text-slate-400">{helper}</span>}
    </label>
  );
}

function SelectField({ label, value, onChange, options, placeholder, required = false, disabled = false, helper }: { label: string; value: string; onChange: (value: string) => void; options: string[]; placeholder: string; required?: boolean; disabled?: boolean; helper?: string }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-1 text-sm font-bold text-slate-700 dark:text-slate-200">
        {label} <RequiredMark required={required} />
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:disabled:bg-slate-950"
        required={required}
        disabled={disabled}
      >
        <option value="">{placeholder}</option>
        {options.map((item) => (
          <option key={item} value={item}>{item}</option>
        ))}
      </select>
      {helper && <span className="mt-2 block text-xs font-medium text-slate-500 dark:text-slate-400">{helper}</span>}
    </label>
  );
}

function FeatureSections({ feature, onPreview }: { feature: typeof portalFeatures[number]; onPreview: () => void }) {
  const Icon = feature.icon;
  return (
    <div className="grid gap-4 lg:grid-cols-6">
      <Panel className="lg:col-span-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="eyebrow">Portal module</p>
            <h2 className="section-title">{feature.label}</h2>
            <p className="section-copy max-w-3xl">{feature.preview}</p>
          </div>
          <span className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${feature.color} text-white shadow-lg shadow-slate-900/15`}>
            <Icon className="h-8 w-8" />
          </span>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            ['Coverage', feature.metric],
            ['Status', feature.status],
            ['Users', feature.audience],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-slate-200 bg-white/75 p-4 dark:border-slate-700 dark:bg-slate-900/70">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{label}</p>
              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-3">
          {feature.bullets.map((item) => (
            <div key={item} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-900/70">
              <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <p className="text-sm leading-6 text-slate-700 dark:text-slate-200">{item}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel className="lg:col-span-2">
        <p className="eyebrow">Live preview data</p>
        <div className="mt-5 space-y-4">
          {feature.data.map((item) => (
            <div key={item.name}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-800 dark:text-slate-100">{item.name}</span>
                <span className="text-slate-500 dark:text-slate-400">{item.score}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div className={`h-full rounded-full bg-gradient-to-r ${feature.color}`} style={{ width: `${Math.max(item.score, 8)}%` }} />
              </div>
            </div>
          ))}
        </div>
        <button onClick={onPreview} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-800">
          <PlayCircle className="h-4 w-4" />
          Watch full overview
        </button>
      </Panel>
    </div>
  );
}

function OverviewPreviewCarousel({ activeIndex, onSelect, onLogin }: { activeIndex: number; onSelect: (index: number) => void; onLogin: () => void }) {
  const activeFeature = portalFeatures[activeIndex] || portalFeatures[0];
  const Icon = activeFeature.icon;
  const previous = () => onSelect((activeIndex - 1 + portalFeatures.length) % portalFeatures.length);
  const next = () => onSelect((activeIndex + 1) % portalFeatures.length);

  return (
    <div className="grid min-w-0 gap-4 overflow-x-hidden lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
      <Panel className="order-2 lg:order-1">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="eyebrow">System overview preview</p>
            <h2 className="section-title">A guided look at the NSTP workflow.</h2>
            <p className="section-copy">The cards below rotate through the actual portal capabilities. Use the controls or select a card to preview a module directly.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={previous} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">Previous</button>
            <button onClick={next} className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">Next</button>
          </div>
        </div>

        <div className="mt-6 flex snap-x gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-2 md:overflow-visible md:pb-0 xl:grid-cols-3">
          {portalFeatures.map((feature, index) => {
            const CardIcon = feature.icon;
            const active = index === activeIndex;
            return (
              <button
                key={feature.label}
                onClick={() => onSelect(index)}
                className={`min-w-[13.5rem] snap-start text-left transition-all md:min-w-0 ${active ? 'scale-[1.02]' : 'opacity-75 hover:opacity-100'}`}
              >
                <span className={`block rounded-2xl border p-4 shadow-sm ${active ? 'border-blue-300 bg-blue-50 dark:border-blue-500/40 dark:bg-blue-500/10' : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'}`}>
                  <span className={`mb-4 grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${feature.color} text-white`}>
                    <CardIcon className="h-6 w-6" />
                  </span>
                  <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100">{feature.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-600 dark:text-slate-300">{feature.status}</span>
                </span>
              </button>
            );
          })}
        </div>
      </Panel>

      <Panel id="overview-carousel" className="order-1 min-w-0 scroll-mt-24 overflow-hidden p-4 sm:p-6 lg:order-2">
        <div className={`w-full min-w-0 overflow-hidden rounded-2xl bg-gradient-to-br ${activeFeature.color} p-4 text-white shadow-lg sm:rounded-3xl sm:p-5`}>
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/75 sm:text-xs sm:tracking-[0.16em]">Preview {activeIndex + 1} of {portalFeatures.length}</p>
              <h3 className="mt-2 break-words text-2xl font-semibold leading-tight sm:text-3xl">{activeFeature.label}</h3>
            </div>
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/18 sm:h-14 sm:w-14">
              <Icon className="h-5 w-5 sm:h-7 sm:w-7" />
            </span>
          </div>
          <p className="mt-4 max-w-full whitespace-normal break-words text-sm leading-6 text-white/88 [overflow-wrap:anywhere]">{activeFeature.preview}</p>
        </div>

        <div className="mt-4 space-y-3 sm:mt-5 sm:space-y-4">
          {activeFeature.data.map((item) => (
            <div key={item.name} className="min-w-0 rounded-2xl border border-slate-200 bg-white/75 p-4 dark:border-slate-700 dark:bg-slate-900/70">
              <div className="flex min-w-0 items-center justify-between gap-3 text-sm">
                <span className="font-semibold text-slate-900 dark:text-slate-100">{item.name}</span>
                <span className="shrink-0 text-slate-500 dark:text-slate-300">{item.score}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div className={`h-full rounded-full bg-gradient-to-r ${activeFeature.color}`} style={{ width: `${Math.max(item.score, 8)}%` }} />
              </div>
            </div>
          ))}
        </div>

        <button onClick={onLogin} className="mt-5 inline-flex min-h-12 w-full min-w-0 items-center justify-center gap-2 rounded-2xl bg-[#ffd24d] px-4 py-3 text-center text-sm font-semibold text-[#061a42] shadow-sm hover:brightness-105 sm:px-5">
          <span className="min-w-0 truncate sm:whitespace-normal">Open portal access</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </Panel>
    </div>
  );
}

function HomeSections({ onSelect }: { onSelect: (component: ComponentKey) => void }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <section className="relative overflow-hidden rounded-2xl border border-[#e1e7f0] bg-white px-7 py-7 shadow-[0_12px_40px_-33px_rgba(0,33,71,0.32)] dark:border-blue-300/15 dark:bg-[#101d34] sm:px-11 sm:py-9">
          <span className="absolute inset-y-0 left-0 w-3 bg-gradient-to-b from-[#1856c8] to-[#486fa9]" />
          <div className="landing-label flex items-center gap-4 text-xs font-bold uppercase tracking-[0.13em] text-[#1551bd] dark:text-blue-200">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-[#dfebff] text-[#1756c6] dark:bg-white/10 dark:text-blue-100">
              <BookOpen className="h-6 w-6" strokeWidth={1.8} />
            </span>
            Overview
          </div>
          <h2 className="mt-3 max-w-xl text-3xl font-semibold leading-tight text-[#0a2d68] dark:text-white sm:text-[2rem]">
            One portal for NSTP delivery, assessment, enrollment, and grading.
          </h2>
          <p className="mt-6 max-w-xl text-sm leading-7 text-[#3c568d] dark:text-slate-300">
            Students complete Common Phase sessions and contact hours, meet assessment requirements, receive component classification, and view released grades.
          </p>
          <p className="mt-1 max-w-xl text-sm leading-7 text-[#3c568d] dark:text-slate-300">
            Coordinators manage approvals, schedules, reports, and interventions.
          </p>
        </section>

        <section className="rounded-2xl border border-[#e1e7f0] bg-white px-6 py-7 shadow-[0_12px_40px_-33px_rgba(0,33,71,0.32)] dark:border-blue-300/15 dark:bg-[#101d34] sm:px-8 sm:py-9">
          <div className="landing-label flex items-center gap-7 text-xs font-bold uppercase tracking-[0.13em] text-[#1551bd] dark:text-blue-200">
            <span>How it works</span>
            <span className="h-px flex-1 bg-[#d8e2f0] dark:bg-white/10" />
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {[
              { title: 'Student ID Approval', icon: IdCard },
              { title: 'Common Phase Sessions', icon: CalendarDays },
              { title: 'Required Outputs', icon: FileText },
              { title: 'Grade Release', icon: Award },
            ].map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="flex items-center gap-4 rounded-xl border border-[#e1e7f0] bg-white px-4 py-6 dark:border-white/10 dark:bg-[#081426]">
                  <span className="landing-label grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#1653c5] text-sm font-bold text-white">0{index + 1}</span>
                  <span className="h-12 w-px shrink-0 bg-[#d8e2f0] dark:bg-white/10" />
                  <Icon className="h-7 w-7 shrink-0 text-[#194a99] dark:text-blue-100" strokeWidth={1.7} />
                  <span className="landing-label text-sm font-bold leading-6 text-[#092c66] dark:text-white">{step.title}</span>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-[#e1e7f0] bg-white px-6 py-8 shadow-[0_12px_40px_-33px_rgba(0,33,71,0.32)] dark:border-blue-300/15 dark:bg-[#101d34] sm:px-8">
        <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="landing-label inline-flex items-center gap-4 text-xs font-bold uppercase tracking-[0.12em] text-[#1551bd] dark:text-blue-200">
              <Landmark className="h-6 w-6" strokeWidth={1.6} />
              NSTP Components at the University
            </p>
            <h2 className="mt-5 text-2xl font-semibold text-[#0a2d68] dark:text-white sm:text-[1.72rem]">Official tracks students can enter after completing the Common Phase.</h2>
            <p className="mt-4 text-sm text-[#3c568d] dark:text-slate-300">Choose your path. Each component builds skills, discipline, and service that strengthen<br className="hidden lg:block" /> our communities and the nation.</p>
          </div>
          <span className="landing-label self-start rounded-full border border-[#1856c8] px-5 py-3 text-xs font-bold uppercase tracking-wide text-[#1551bd] dark:border-blue-300/40 dark:text-blue-100 lg:self-center">
            CWTS | LTS | MTS
          </span>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {componentCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                type="button"
                key={card.label}
                onClick={() => onSelect(card.label.startsWith('MTS') ? 'MTS' : card.label as ComponentKey)}
                className="group flex min-h-[15.5rem] flex-col rounded-xl border border-[#dae4f1] bg-white p-6 text-left transition hover:-translate-y-1 hover:border-[#b5cae7] hover:shadow-[0_22px_42px_-32px_rgba(0,33,71,0.48)] dark:border-white/10 dark:bg-[#081426]"
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="grid h-14 w-14 place-items-center rounded-full border border-[#bdd2f5] text-[#194a99] dark:border-blue-300/25 dark:text-blue-100">
                    <Icon className="h-7 w-7" strokeWidth={1.7} />
                  </span>
                  <span
                    className="landing-label grid h-14 w-14 place-items-center rounded-full border-[3px] text-xs font-bold text-[#173b70] dark:text-blue-100"
                    style={{ borderColor: `${card.accent}55`, borderRightColor: card.accent }}
                  >
                    {card.value}%
                  </span>
                </span>
                <span className="landing-label mt-4 block text-2xl font-bold text-[#092c66] dark:text-white">{card.label}</span>
                <span className="landing-label mt-1 block text-sm font-bold leading-5 text-[#092c66] dark:text-slate-100">{card.title}</span>
                <span className="mt-4 flex-1 text-sm leading-6 text-[#3c568d] dark:text-slate-300">{card.copy}</span>
                <span className="landing-label mt-5 inline-flex items-center gap-4 text-xs font-bold uppercase tracking-[0.09em]" style={{ color: card.accent }}>
                  View component
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function NstpSections() {
  return (
    <div className="grid gap-4 lg:grid-cols-6">
      <Panel className="lg:col-span-4">
        <p className="eyebrow">Official NSTP program</p>
        <h2 className="section-title">The National Service Training Program develops civic consciousness, service leadership, and community readiness.</h2>
        <p className="section-copy">This official university landing page presents the program components, learning flow, verification process, and digital services used for modules, materials, videos, lessons, quizzes, assignments, major examinations, grades, and reports.</p>
      </Panel>
      <Panel className="lg:col-span-2">
        <p className="eyebrow">Requirement</p>
        <p className="text-6xl font-semibold text-blue-700 dark:text-blue-300">25</p>
        <p className="mt-2 text-sm font-bold text-slate-600 dark:text-slate-300">Required Common Phase contact hours tracked by the system.</p>
      </Panel>
      <Panel className="lg:col-span-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            ['01', 'General orientation'],
            ['02', 'Component enrollment'],
            ['03', 'Assessment and exams'],
            ['04', 'Grades and reports'],
          ].map(([num, label]) => (
            <div key={label} className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
              <p className="text-2xl font-semibold text-[#f2b705]">{num}</p>
              <p className="mt-1 text-sm font-bold">{label}</p>
            </div>
          ))}
        </div>
      </Panel>
      <Panel className="lg:col-span-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="eyebrow">Interactive program map</p>
            <h2 className="section-title">From verified student access to official NSTP completion.</h2>
            <p className="section-copy">The landing page now shows the public-facing story, while the dashboard handles real work after login: approval, modules, assessment, component assignment, progress, grades, announcements, and reports.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: 'Verify', copy: 'Student ID and account approval', tone: 'bg-[#002147]' },
              { label: 'Learn', copy: 'Common Phase sessions and component content', tone: 'bg-[#0b4ea2]' },
              { label: 'Assess', copy: 'Post-module quizzes and major exams', tone: 'bg-[#e5b73b]' },
              { label: 'Release', copy: 'Grades, clearance, and reports', tone: 'bg-[#173b70]' },
            ].map((item) => (
              <div key={item.label} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
                <span className={`absolute right-4 top-4 h-3 w-3 rounded-full ${item.tone}`} />
                <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">{item.label}</p>
                <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-300">{item.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </Panel>
    </div>
  );
}

function SchoolSections() {
  return (
    <div className="grid gap-4 lg:grid-cols-6">
      <Panel className="lg:col-span-3">
        <p className="eyebrow">About BiPSU</p>
        <h2 className="section-title">Biliran Province State University serves as a center for learning, innovation, public service, and community development in Biliran.</h2>
        <p className="section-copy">The portal reflects BiPSU's official blue and gold identity and its service area in Naval, Biliran, while supporting student development and academic governance.</p>
      </Panel>
      <Panel className="lg:col-span-3">
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { icon: MapPinned, title: 'Biliran service area', copy: 'Localized for BiPSU NSTP operations.' },
            { icon: Landmark, title: 'Academic governance', copy: 'Approval, reporting, and released grades.' },
            { icon: Users, title: 'Student development', copy: 'Civic service and component classification.' },
            { icon: Sparkles, title: 'Blue and gold', copy: 'A visual system aligned with the university seal.' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="rounded-xl border border-slate-200 bg-white/75 p-4 dark:border-slate-700 dark:bg-slate-900/70">
                <Icon className="mb-3 h-5 w-5 text-blue-700 dark:text-blue-300" />
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{item.copy}</p>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

function PortalSections({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="grid gap-4 lg:grid-cols-6">
      <Panel className="lg:col-span-2">
        <ShieldCheck className="mb-4 h-7 w-7 text-blue-700 dark:text-blue-300" />
        <p className="text-xl font-semibold">Verified onboarding</p>
        <p className="section-copy">Student accounts require approval before access, using a BiPSU student ID as the key identifier.</p>
      </Panel>
      <Panel className="lg:col-span-2">
        <TrendingUp className="mb-4 h-7 w-7 text-emerald-600" />
        <p className="text-xl font-semibold">Live analytics</p>
        <p className="section-copy">Admins see progress bands, component distribution, intervention signals, and export-ready reports.</p>
      </Panel>
      <Panel className="lg:col-span-2">
        <FileText className="mb-4 h-7 w-7 text-amber-600" />
        <p className="text-xl font-semibold">Grade center</p>
        <p className="section-copy">Students can view released prelim, midterm, final standing, and clearance requirements.</p>
      </Panel>
      <Panel className="lg:col-span-6">
        <button onClick={onLogin} className="inline-flex items-center gap-2 rounded-full bg-[#f2b705] px-6 py-3 font-semibold text-[#09285f]">
          Open portal access
          <ArrowRight className="h-4 w-4" />
        </button>
      </Panel>
    </div>
  );
}

function Panel({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={`rounded-2xl border border-slate-200 bg-white/82 p-6 shadow-[0_18px_48px_-34px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/78 ${className}`}>
      {children}
    </section>
  );
}
