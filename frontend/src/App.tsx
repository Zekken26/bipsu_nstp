import { useState, useEffect, useMemo, useRef } from 'react';
import { BookOpen, Users, BarChart3, LogOut, CalendarDays, LayoutGrid, ClipboardList, MoonStar, SunMedium, Mic2, PanelLeftClose, PanelLeftOpen, Bell, Maximize2, Search, ChevronDown, TrendingUp, Award, Menu, X, UserRound, Settings, ShieldCheck, SlidersHorizontal, History, CircleHelp, LockKeyhole, CheckCircle2, Download, Send, Save, Mail, RotateCcw } from 'lucide-react';
import LoginPage from './pages/LoginPage';
import GeneralEducation from './features/enrollment/GeneralEducation';
import EnrollmentPage from './pages/EnrollmentPage';
import QualifyingExam from './features/enrollment/QualifyingExam';
import PendingAssignment from './features/enrollment/PendingAssignment';
import ModulesPage from './pages/ModulesPage';
import AssessmentsPage from './pages/AssessmentsPage';
import ProgressTracker from './features/progress/pages/ProgressTracker';
import AdminDashboard from './features/admin/pages/AdminDashboard';
import FacilitatorDashboard from './features/facilitator/pages/FacilitatorDashboard';
import AnnouncementsCenter from './features/announcements/pages/AnnouncementsCenter';
import ReportsCenter from './pages/ReportsPage';
import GradesPage from './pages/GradesPage';
import RoleDashboardHome from './features/dashboard/pages/RoleDashboardHome';
import { ensureNstpSeedData, safeJsonParse, loadModules, loadAssessments, loadAccounts, saveAccounts, loadQualifyingExamResults, loadStudents } from './data/nstpData';

type ShellSection = 'overview' | 'modules' | 'assessments' | 'progress' | 'grades' | 'admin' | 'facilitator' | 'announcements' | 'reports';
type AccountUtility = 'profile' | 'settings' | 'security' | 'accessibility' | 'activity' | 'help';
type AccountPreferences = {
  defaultLanding: ShellSection;
  notificationDigest: boolean;
  emailAlerts: boolean;
  compactCards: boolean;
  fontScale: 'standard' | 'large';
  reduceMotion: boolean;
  focusMode: boolean;
  highContrast: boolean;
};

type AccountActivity = {
  id: string;
  title: string;
  detail: string;
  createdAt: string;
};

type AuthSplashState = {
  visible: boolean;
  mode: 'login' | 'logout';
  userName?: string;
};

const DEFAULT_ACCOUNT_PREFERENCES: AccountPreferences = {
  defaultLanding: 'overview',
  notificationDigest: true,
  emailAlerts: false,
  compactCards: false,
  fontScale: 'standard',
  reduceMotion: false,
  focusMode: false,
  highContrast: false,
};

function AuthSplash({ mode, userName }: { mode: 'login' | 'logout' | 'boot'; userName?: string }) {
  const isLogin = mode === 'login';
  const isBoot = mode === 'boot';
  const titleText = isBoot ? 'NSTP for BiPSU' : isLogin ? 'Welcome back' : 'Signing out';
  const bodyText = isBoot
    ? 'Loading your dashboard...'
    : isLogin
    ? `Signing in${userName ? `, ${userName.split(' ')[0]}` : ''}...`
    : 'Please wait...';
  const [progress, setProgress] = useState(10);
  const progressDurationMs = isBoot ? 1300 : isLogin ? 2100 : 1800;
  useEffect(() => {
    const startedAt = performance.now();
    const progressTicker = window.setInterval(() => {
      const elapsed = performance.now() - startedAt;
      const ratio = Math.max(0, Math.min(1, elapsed / progressDurationMs));
      setProgress(Math.round(10 + ratio * 90));
    }, 60);
    return () => window.clearInterval(progressTicker);
  }, [progressDurationMs]);

  return (
    <div className="fixed left-0 top-0 z-[9999] h-dvh w-screen flex items-center justify-center overflow-hidden bg-[#082d73]">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#06245c_0%,#0b4ea2_52%,#f2b705_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(180deg,transparent,rgba(2,6,23,0.45))]" />
      <div className="absolute -left-20 top-10 h-64 w-64 rounded-full border border-white/20" />
      <div className="absolute -right-16 bottom-16 h-72 w-72 rounded-full border border-[#ffd24d]/50" />
      <div className="absolute left-[8%] top-[18%] h-20 w-20 rotate-45 border border-white/20" />
      <div className="absolute right-[18%] top-[16%] h-1 w-32 rounded-full bg-[#ffd24d]/70" />
      <div className="absolute bottom-[18%] left-[18%] h-1 w-40 rounded-full bg-white/35" />

      <div
        className="relative w-[min(94vw,760px)] rounded-2xl border border-white/35 bg-white/92 p-6 shadow-[0_28px_90px_-34px_rgba(15,23,42,0.9)] transition-transform duration-200 dark:border-slate-600/60 dark:bg-slate-900/90"
      >
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-blue-200 bg-white p-1.5 shadow-sm dark:border-blue-400/30 dark:bg-slate-950">
              <img src="/bipsu-logo.svg" alt="Biliran Province State University logo" className="h-full w-full object-contain" />
              <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-white bg-[#f2b705] dark:border-slate-900" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300">Biliran Province State University</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{titleText}</h3>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">NSTP Portal for Brilliance, Innovation, Progress, Service and Unity</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold text-slate-700 dark:text-slate-200">
            <span className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 dark:border-blue-500/30 dark:bg-blue-500/10">CWTS</span>
            <span className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 dark:border-blue-500/30 dark:bg-blue-500/10">LTS</span>
            <span className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-500/30 dark:bg-amber-500/10">MTS</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-950/70">
          <div className="mb-2 flex items-center justify-between gap-2 text-sm text-slate-700 dark:text-slate-200">
            <span className="inline-flex items-center gap-2 font-semibold">{bodyText}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div className="h-full animate-[splashPulse_1.05s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-blue-700 to-cyan-500" style={{ width: `${Math.max(progress, 16)}%` }} />
          </div>
        </div>
        <div className="mt-4 grid gap-2 text-xs text-slate-500 dark:text-slate-400 sm:grid-cols-3">
          <span>BiPSU blue and gold identity</span>
          <span>Student ID verification</span>
          <span>Grades and clearance portal</span>
        </div>
      </div>
    </div>
  );
}

const NAV_ITEMS: Record<string, Array<{ id: ShellSection; label: string; icon: any }>> = {
  student: [
    { id: 'overview', label: 'Dashboard', icon: LayoutGrid },
    { id: 'modules', label: 'Modules', icon: BookOpen },
    { id: 'assessments', label: 'Assessments', icon: ClipboardList },
    { id: 'progress', label: 'Progress', icon: TrendingUp },
    { id: 'grades', label: 'Grades', icon: Award },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'announcements', label: 'Announcements', icon: Bell },
  ],
  admin: [
    { id: 'overview', label: 'Home', icon: LayoutGrid },
    { id: 'admin', label: 'Enrollment', icon: Users },
    { id: 'modules', label: 'Common Modules', icon: BookOpen },
    { id: 'assessments', label: 'Major Exams', icon: ClipboardList },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
  ],
  facilitator: [
    { id: 'facilitator', label: 'Facilitator Dashboard', icon: Mic2 },
    { id: 'assessments', label: 'Assessments', icon: ClipboardList },
    { id: 'announcements', label: 'Announcements', icon: Bell },
  ],
};

export default function App() {
  const [user, setUser] = useState<any>(() => {
    const savedUser = localStorage.getItem('nstpUser');
    return savedUser ? safeJsonParse<any>(savedUser, null) : null;
  });
  const [activeSection, setActiveSection] = useState<ShellSection>(() => {
    const savedUser = localStorage.getItem('nstpUser');
    const parsedUser = savedUser ? safeJsonParse<any>(savedUser, null) : null;
    if (!parsedUser) return 'overview';
    if (parsedUser.role === 'admin') return 'overview';
    if (parsedUser.role === 'facilitator') return 'facilitator';
    return 'overview';
  });
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('nstp-theme') as 'light' | 'dark' | null;
    return savedTheme === 'dark' ? 'dark' : 'light';
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    const savedUser = localStorage.getItem('nstpUser');
    const parsedUser = savedUser ? safeJsonParse<any>(savedUser, null) : null;
    if (parsedUser?.role === 'admin') return false;
    const saved = localStorage.getItem('nstp-sidebar-collapsed');
    return saved ? safeJsonParse<boolean>(saved, false) : false;
  });
  const [headerSearch, setHeaderSearch] = useState('');
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [workspaceLabel, setWorkspaceLabel] = useState('nstp-system/main');
  const [adminInitialView, setAdminInitialView] = useState<'overview' | 'enrollment' | 'students' | 'tools' | 'modules' | 'assessments' | 'facilitators' | 'assignments'>('overview');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [accountUtility, setAccountUtility] = useState<AccountUtility | null>(null);
  const [accountPreferences, setAccountPreferences] = useState<AccountPreferences>(DEFAULT_ACCOUNT_PREFERENCES);
  const [accountActivity, setAccountActivity] = useState<AccountActivity[]>([]);
  const [profileDraft, setProfileDraft] = useState({ name: '', email: '' });
  const [supportMessage, setSupportMessage] = useState('');
  const [supportStatus, setSupportStatus] = useState<string | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [headerHint, setHeaderHint] = useState<string | null>(null);
  const [notices, setNotices] = useState<Array<{ id: string; title: string; message: string; audience: 'all' | 'student' | 'admin' | 'facilitator'; priority: 'normal' | 'high'; createdBy: string; createdAt: string }>>([]);
  const [readNoticeIds, setReadNoticeIds] = useState<string[]>([]);
  const [authSplash, setAuthSplash] = useState<AuthSplashState>({ visible: false, mode: 'login' });
  const [isAuthTransitioning, setIsAuthTransitioning] = useState(false);
  const [isBootSplashVisible, setIsBootSplashVisible] = useState(true);
  const authTimerRef = useRef<number | null>(null);
  const pendingLoginRef = useRef<any>(null);
  const authModeRef = useRef<'login' | 'logout'>('login');
  const workspaceMenuRef = useRef<HTMLDivElement | null>(null);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const notificationsRef = useRef<HTMLDivElement | null>(null);

  const clearAuthTimer = () => {
    if (authTimerRef.current !== null) {
      window.clearTimeout(authTimerRef.current);
      authTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearAuthTimer();
    };
  }, []);

  const completeAuthTransition = () => {
    clearAuthTimer();

    if (authModeRef.current === 'login') {
      const nextUser = pendingLoginRef.current;
      if (nextUser) {
        setUser(nextUser);
        localStorage.setItem('nstpUser', JSON.stringify(nextUser));
        if (nextUser.role === 'admin') {
          setActiveSection('overview');
          setIsSidebarCollapsed(false);
        } else if (nextUser.role === 'facilitator') {
          setActiveSection('facilitator');
        } else {
          setActiveSection('overview');
        }
      }
    } else {
      setUser(null);
      localStorage.removeItem('nstpUser');
      setActiveSection('overview');
    }

    pendingLoginRef.current = null;
    setAuthSplash((state) => ({ ...state, visible: false }));
    setIsAuthTransitioning(false);
  };

  useEffect(() => {
    ensureNstpSeedData();
    document.documentElement.classList.toggle('dark', themeMode === 'dark');
    const bootTimer = window.setTimeout(() => {
      setIsBootSplashVisible(false);
    }, 1300);
    return () => window.clearTimeout(bootTimer);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', themeMode === 'dark');
    localStorage.setItem('nstp-theme', themeMode);
  }, [themeMode]);

  useEffect(() => {
    if (!user || user.role !== 'student') return;

    const refreshStudentAccess = () => {
      const account = loadAccounts().find((item) => item.id === user.id);
      const examResult = loadQualifyingExamResults().find((result) => result.userId === user.id);
      const rosterRecord = loadStudents().find((student) => student.id === user.id || student.email.toLowerCase() === user.email.toLowerCase());
      const hasExamAccess = Boolean(
        examResult?.assignedComponent &&
        examResult.status &&
        !['waitlisted', 'not-qualified'].includes(examResult.status),
      );
      const hasRosterAccess = Boolean(rosterRecord?.component && rosterRecord.status === 'active');
      const nextUser = {
        ...user,
        ...(account || {}),
        ...(hasExamAccess
          ? {
              generalEducationComplete: true,
              preferredComponent: examResult?.preferredComponent || user.preferredComponent,
              examTaken: true,
              examScore: examResult?.score ?? user.examScore,
              component: examResult?.assignedComponent,
              componentAccessStatus: examResult?.status,
            }
          : {}),
        ...(!hasExamAccess && hasRosterAccess
          ? {
              component: rosterRecord?.component,
              componentAccessStatus: rosterRecord?.status,
            }
          : {}),
      };

      if (JSON.stringify(nextUser) !== JSON.stringify(user)) {
        setUser(nextUser);
        localStorage.setItem('nstpUser', JSON.stringify(nextUser));
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (!event.key || ['qualifyingExamResults', 'nstp-student-roster', 'nstp-accounts', 'nstpUser'].includes(event.key)) {
        refreshStudentAccess();
      }
    };
    const handleCurrentUserUpdate = (event: Event) => {
      const nextUser = (event as CustomEvent).detail;
      if (nextUser?.id === user.id) setUser(nextUser);
    };

    refreshStudentAccess();
    window.addEventListener('storage', handleStorage);
    window.addEventListener('nstp-qualifying-results-updated', refreshStudentAccess);
    window.addEventListener('nstp-students-updated', refreshStudentAccess);
    window.addEventListener('nstp-accounts-updated', refreshStudentAccess);
    window.addEventListener('nstp-current-user-updated', handleCurrentUserUpdate);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('nstp-qualifying-results-updated', refreshStudentAccess);
      window.removeEventListener('nstp-students-updated', refreshStudentAccess);
      window.removeEventListener('nstp-accounts-updated', refreshStudentAccess);
      window.removeEventListener('nstp-current-user-updated', handleCurrentUserUpdate);
    };
  }, [user]);

  useEffect(() => {
    localStorage.setItem('nstp-sidebar-collapsed', JSON.stringify(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  useEffect(() => {
    const onOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (workspaceMenuRef.current && !workspaceMenuRef.current.contains(target)) {
        setWorkspaceMenuOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setProfileMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(target)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', onOutsideClick);
    return () => document.removeEventListener('mousedown', onOutsideClick);
  }, []);

  const userRole = user?.role;

  const getPreferenceKey = (userId = user?.id) => `nstp-account-preferences-${userId || 'guest'}`;
  const getActivityKey = (userId = user?.id) => `nstp-account-activity-${userId || 'guest'}`;

  const recordAccountActivity = (title: string, detail: string) => {
    if (!user?.id) return;
    setAccountActivity((previous) => {
      const nextActivity = [
        {
          id: `activity-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          title,
          detail,
          createdAt: new Date().toISOString(),
        },
        ...previous,
      ].slice(0, 18);
      localStorage.setItem(getActivityKey(user.id), JSON.stringify(nextActivity));
      return nextActivity;
    });
  };

  const updateAccountPreferences = (patch: Partial<AccountPreferences>, activityTitle: string, activityDetail: string) => {
    const nextPreferences = { ...accountPreferences, ...patch };
    setAccountPreferences(nextPreferences);
    if (user?.id) localStorage.setItem(getPreferenceKey(user.id), JSON.stringify(nextPreferences));
    recordAccountActivity(activityTitle, activityDetail);
  };

  useEffect(() => {
    if (!user?.id) return;
    const savedPreferences = safeJsonParse<AccountPreferences>(localStorage.getItem(getPreferenceKey(user.id)), DEFAULT_ACCOUNT_PREFERENCES);
    const savedActivity = safeJsonParse<AccountActivity[]>(localStorage.getItem(getActivityKey(user.id)), []);
    setAccountPreferences({ ...DEFAULT_ACCOUNT_PREFERENCES, ...savedPreferences });
    setAccountActivity(savedActivity);
    setProfileDraft({ name: user.name || '', email: user.email || '' });
    setSupportStatus(null);
    setSupportMessage('');
  }, [user?.id]);

  useEffect(() => {
    document.documentElement.dataset.portalFontScale = accountPreferences.fontScale;
    document.documentElement.dataset.portalFocusMode = accountPreferences.focusMode ? 'true' : 'false';
    document.documentElement.dataset.portalHighContrast = accountPreferences.highContrast ? 'true' : 'false';
    document.documentElement.dataset.portalCompactCards = accountPreferences.compactCards ? 'true' : 'false';
    document.documentElement.classList.toggle('reduce-motion', accountPreferences.reduceMotion);
  }, [accountPreferences]);

  useEffect(() => {
    if (!user?.id) {
      setNotices([]);
      setReadNoticeIds([]);
      return;
    }

    const noticeKey = 'nstp-system-notices';
    const readKey = `nstp-notice-read-${user.id}`;
    const savedNotices = safeJsonParse<Array<{ id: string; title: string; message: string; audience: 'all' | 'student' | 'admin' | 'facilitator'; priority: 'normal' | 'high'; createdBy: string; createdAt: string }>>(localStorage.getItem(noticeKey), []);
    const savedReads = safeJsonParse<string[]>(localStorage.getItem(readKey), []);

    setNotices(savedNotices || []);
    setReadNoticeIds(savedReads || []);
  }, [user?.id]);

  const visibleNotifications = useMemo(() => {
    if (!userRole) return [];
    return [...notices]
      .filter((notice) => notice.audience === 'all' || notice.audience === userRole)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [notices, userRole]);

  const unreadNotificationCount = visibleNotifications.filter((notice) => !readNoticeIds.includes(notice.id)).length;

  const markNotificationRead = (noticeId: string) => {
    if (!user?.id || readNoticeIds.includes(noticeId)) return;
    const nextReadIds = [...readNoticeIds, noticeId];
    setReadNoticeIds(nextReadIds);
    localStorage.setItem(`nstp-notice-read-${user.id}`, JSON.stringify(nextReadIds));
  };

  const handleLogin = (userData: any) => {
    if (isAuthTransitioning) return;

    pendingLoginRef.current = userData;
    authModeRef.current = 'login';
    setIsAuthTransitioning(true);
    setAuthSplash({ visible: true, mode: 'login', userName: userData?.name });
    clearAuthTimer();
    authTimerRef.current = window.setTimeout(() => {
      completeAuthTransition();
    }, 2100);
  };

  const handleLogout = () => {
    if (isAuthTransitioning) return;

    setProfileMenuOpen(false);
    setAccountUtility(null);
    setNotificationsOpen(false);
    setWorkspaceMenuOpen(false);
    setHeaderHint(null);

    authModeRef.current = 'logout';
    setIsAuthTransitioning(true);
    setAuthSplash({ visible: true, mode: 'logout', userName: user?.name });
    clearAuthTimer();
    authTimerRef.current = window.setTimeout(() => {
      completeAuthTransition();
    }, 1800);
  };

  if (!user) {
    return (
      <>
        <LoginPage onLogin={handleLogin} />
        {isBootSplashVisible && <AuthSplash mode="boot" />}
        {authSplash.visible && <AuthSplash mode={authSplash.mode} userName={authSplash.userName} />}
      </>
    );
  }

  // Check student enrollment status
  const generalEducationComplete = user.generalEducationComplete || false;
  const preferredComponent = user.preferredComponent || null;
  const examTaken = user.examTaken || false;
  const componentAssigned = user.component || null;

  if (!generalEducationComplete && user.role === 'student') {
    return <GeneralEducation
      user={user}
      onLogout={handleLogout}
      onComplete={() => {
        const updatedUser = { ...user, generalEducationComplete: true };
        setUser(updatedUser);
        localStorage.setItem('nstpUser', JSON.stringify(updatedUser));
      }}
    />;
  }

  if (generalEducationComplete && !preferredComponent && user.role === 'student') {
    return <EnrollmentPage
      user={user}
      onLogout={handleLogout}
      onEnroll={(component) => {
        const updatedUser = { ...user, preferredComponent: component };
        setUser(updatedUser);
        localStorage.setItem('nstpUser', JSON.stringify(updatedUser));
      }}
    />;
  }

  if (preferredComponent && !examTaken && user.role === 'student') {
    return <QualifyingExam
      user={user}
      onLogout={handleLogout}
      preferredComponent={preferredComponent}
      onComplete={(score, assignment) => {
        const updatedUser = {
          ...user,
          examTaken: true,
          examScore: score,
          ...(assignment?.assignedComponent
            ? {
                component: assignment.assignedComponent,
                componentAccessStatus: assignment.status,
              }
            : {}),
        };
        setUser(updatedUser);
        localStorage.setItem('nstpUser', JSON.stringify(updatedUser));
        if (assignment?.assignedComponent) {
          setActiveSection('modules');
          setHeaderHint(`Access granted to the ${assignment.assignedComponent} LMS.`);
        }
      }}
    />;
  }

  if (examTaken && !componentAssigned && user.role === 'student') {
    return <PendingAssignment user={user} onLogout={handleLogout} onAssign={(component) => {
      const updatedUser = { ...user, component };
      setUser(updatedUser);
      localStorage.setItem('nstpUser', JSON.stringify(updatedUser));
    }} />;
  }

  const today = new Date().toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const navItems = NAV_ITEMS[user.role] || NAV_ITEMS.student;
  const goBackToOverview = () => {
    setAdminInitialView('overview');
    setActiveSection('overview');
  };
  const navigateToSection = (section: ShellSection) => {
    if (section === 'overview') setAdminInitialView('overview');
    if (user.role === 'admin' && section === 'admin') setAdminInitialView('enrollment');
    setActiveSection(section);
    setMobileSidebarOpen(false);
  };
  const modules = loadModules();
  const assessments = loadAssessments();
  const moduleCount = modules.length;
  const assessmentCount = assessments.length;
  const commonModuleHours = modules.reduce((total, module) => total + module.hours, 0);
  const publishedPostModuleAssessments = modules.filter((module) =>
    assessments.some((assessment) => assessment.status === 'published' && assessment.moduleId === module.id)
  ).length;
  const majorExamCount = assessments.filter((assessment) => assessment.status === 'published' && assessment.type === 'exam').length;
  const objectiveReadiness = [
    commonModuleHours >= 25,
    publishedPostModuleAssessments >= moduleCount,
    majorExamCount > 0,
    Boolean(user.component || user.role !== 'student'),
  ].filter(Boolean).length;

  const openAdminView = (view: 'overview' | 'enrollment' | 'students' | 'tools' | 'modules' | 'assessments' | 'facilitators' | 'assignments', label: string) => {
    setAdminInitialView(view);
    setActiveSection(view === 'overview' ? 'overview' : 'admin');
    setHeaderHint(`Opened ${label}`);
    setWorkspaceMenuOpen(false);
    setMobileSidebarOpen(false);
  };

  const workspaceActions = user.role === 'admin'
    ? [
      { label: 'Dashboard Overview', detail: 'Program metrics and operations', run: () => openAdminView('overview', 'Dashboard Overview') },
      { label: 'Enrollment Requests', detail: 'Approve new student access', run: () => openAdminView('enrollment', 'Enrollment Requests') },
      { label: 'Student Records', detail: 'Roster, progress, and student data', run: () => openAdminView('students', 'Student Records') },
      { label: 'Facilitator Accounts', detail: 'Manage facilitators and ownership', run: () => openAdminView('facilitators', 'Facilitator Accounts') },
      { label: 'Component Assignment', detail: 'Classify students into NSTP tracks', run: () => openAdminView('assignments', 'Component Assignment') },
      { label: 'Admin Tools', detail: 'Bulk actions, audit, exports', run: () => openAdminView('tools', 'Admin Tools') },
      { label: 'Reports Center', detail: 'Analytics and exports', run: () => { setActiveSection('reports'); setHeaderHint('Opened Reports Center'); setWorkspaceMenuOpen(false); } },
      { label: 'Notice Center', detail: 'Announcements and alerts', run: () => { setActiveSection('announcements'); setHeaderHint('Opened Notice Center'); setWorkspaceMenuOpen(false); } },
    ]
    : user.role === 'facilitator'
      ? [
        { label: 'Facilitator Dashboard', detail: 'Lecture and assessment overview', run: () => { setActiveSection('facilitator'); setHeaderHint('Opened Facilitator Dashboard'); setWorkspaceMenuOpen(false); } },
        { label: 'Assessment Studio', detail: 'Create questions and answer keys', run: () => { setActiveSection('assessments'); setHeaderHint('Opened Assessment Studio'); setWorkspaceMenuOpen(false); } },
        { label: 'Notice Center', detail: 'Read program updates', run: () => { setActiveSection('announcements'); setHeaderHint('Opened Notice Center'); setWorkspaceMenuOpen(false); } },
      ]
      : [
        { label: 'Student Dashboard', detail: 'Progress and student tasks', run: () => { setActiveSection('overview'); setHeaderHint('Opened Student Dashboard'); setWorkspaceMenuOpen(false); } },
        { label: 'Common Modules', detail: 'Study materials and completion', run: () => { setActiveSection('modules'); setHeaderHint('Opened Common Modules'); setWorkspaceMenuOpen(false); } },
        { label: 'Assessments', detail: 'Quizzes and exams', run: () => { setActiveSection('assessments'); setHeaderHint('Opened Assessments'); setWorkspaceMenuOpen(false); } },
        { label: 'Grades', detail: 'Released official standing', run: () => { setActiveSection('grades'); setHeaderHint('Opened Grades'); setWorkspaceMenuOpen(false); } },
        { label: 'Notice Center', detail: 'Program announcements', run: () => { setActiveSection('announcements'); setHeaderHint('Opened Notice Center'); setWorkspaceMenuOpen(false); } },
      ];

  const accountUtilities: Array<{ id: AccountUtility; label: string; detail: string; icon: any }> = [
    { id: 'profile', label: 'Profile details', detail: 'Identity, role, and NSTP affiliation', icon: UserRound },
    { id: 'settings', label: 'Account settings', detail: 'Display, layout, and notification preferences', icon: Settings },
    { id: 'security', label: 'Security and privacy', detail: 'Session, access scope, and data safeguards', icon: ShieldCheck },
    { id: 'accessibility', label: 'Accessibility', detail: 'Reading comfort, contrast, and layout controls', icon: SlidersHorizontal },
    { id: 'activity', label: 'Activity log', detail: 'Recent portal and account events', icon: History },
    { id: 'help', label: 'Help and support', detail: 'Contacts, guides, and service channels', icon: CircleHelp },
  ];

  const selectedAccountUtility = accountUtilities.find((item) => item.id === accountUtility);
  const SelectedAccountUtilityIcon = selectedAccountUtility?.icon;

  const openAccountUtility = (id: AccountUtility) => {
    setAccountUtility(id);
    setProfileMenuOpen(false);
  };

  const saveProfileDetails = () => {
    const nextName = profileDraft.name.trim();
    const nextEmail = profileDraft.email.trim();
    if (!nextName || !nextEmail || !nextEmail.includes('@')) {
      setHeaderHint('Enter a valid name and email before saving profile details.');
      return;
    }

    const updatedUser = { ...user, name: nextName, email: nextEmail };
    const updatedAccounts = loadAccounts().map((account) => (
      account.id === user.id ? { ...account, name: nextName, email: nextEmail } : account
    ));
    setUser(updatedUser);
    localStorage.setItem('nstpUser', JSON.stringify(updatedUser));
    saveAccounts(updatedAccounts);
    setHeaderHint('Profile details saved locally.');
    recordAccountActivity('Profile updated', `${nextName} updated account display details.`);
  };

  const openDefaultLanding = () => {
    navigateToSection(accountPreferences.defaultLanding);
    setAccountUtility(null);
    setHeaderHint(`Opened your saved default landing page.`);
    recordAccountActivity('Default landing opened', `Opened ${accountPreferences.defaultLanding}.`);
  };

  const downloadJsonFile = (fileName: string, payload: unknown) => {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const downloadPrivacySummary = () => {
    downloadJsonFile(`nstp-privacy-summary-${user.id}.json`, {
      account: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        component: user.component || user.preferredComponent || null,
      },
      preferences: accountPreferences,
      localDataStores: [
        'nstpUser',
        'nstp-accounts',
        'nstp-module-library',
        'nstp-assessment-library',
        'nstp-student-roster',
        'nstp-grade-records',
        getPreferenceKey(user.id),
        getActivityKey(user.id),
      ],
      generatedAt: new Date().toISOString(),
    });
    setHeaderHint('Downloaded privacy summary JSON.');
    recordAccountActivity('Privacy summary exported', 'Downloaded a local privacy and data summary.');
  };

  const exportAccountActivity = () => {
    downloadJsonFile(`nstp-account-activity-${user.id}.json`, accountActivity);
    setHeaderHint('Downloaded account activity JSON.');
    recordAccountActivity('Activity exported', 'Downloaded account activity history.');
  };

  const refreshPermissionCheck = () => {
    const roleSummary = user.role === 'admin'
      ? 'Full administrative permissions confirmed.'
      : user.role === 'facilitator'
        ? 'Facilitator permissions confirmed for lecture and assessment publishing.'
        : 'Student permissions confirmed for learning, assessments, progress, and grades.';
    setHeaderHint(roleSummary);
    recordAccountActivity('Permission check refreshed', roleSummary);
  };

  const resetAccessibilityPreferences = () => {
    updateAccountPreferences(
      {
        fontScale: 'standard',
        reduceMotion: false,
        focusMode: false,
        highContrast: false,
        compactCards: false,
      },
      'Accessibility reset',
      'Restored default readability and motion settings.'
    );
    setHeaderHint('Accessibility preferences reset.');
  };

  const submitSupportTicket = () => {
    const message = supportMessage.trim();
    if (message.length < 10) {
      setSupportStatus('Write a short description of the concern before creating a ticket.');
      return;
    }

    const ticket = {
      id: `ticket-${Date.now()}`,
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      message,
      status: 'open',
      createdAt: new Date().toISOString(),
    };
    const tickets = safeJsonParse<any[]>(localStorage.getItem('nstp-support-tickets'), []);
    localStorage.setItem('nstp-support-tickets', JSON.stringify([ticket, ...tickets]));
    setSupportMessage('');
    setSupportStatus(`Support ticket ${ticket.id} was saved locally for follow-up.`);
    setHeaderHint('Support ticket created.');
    recordAccountActivity('Support ticket created', ticket.id);
  };

  const searchCommands = [
    ...navItems.map((item) => ({
      label: item.label,
      keywords: [item.label, item.id],
      run: () => {
        if (user.role === 'admin' && item.id === 'admin') {
          openAdminView('enrollment', 'Enrollment');
          return;
        }
        setActiveSection(item.id);
        if (item.id === 'overview') setAdminInitialView('overview');
        setHeaderHint(`Opened ${item.label}`);
      },
    })),
    ...(user.role === 'admin'
      ? [
        { label: 'Enrollment Requests', keywords: ['approval', 'approvals', 'enrollment', 'request', 'requests'], run: () => openAdminView('enrollment', 'Enrollment Requests') },
        { label: 'Student Records', keywords: ['student', 'students', 'roster', 'records', 'grade release', 'grades'], run: () => openAdminView('students', 'Student Records') },
        { label: 'Admin Tools', keywords: ['admin tools', 'tools', 'bulk', 'audit', 'export', 'import', 'presets'], run: () => openAdminView('tools', 'Admin Tools') },
        { label: 'Facilitator Accounts', keywords: ['facilitator', 'facilitators', 'lecturer', 'teacher', 'accounts', 'ownership'], run: () => openAdminView('facilitators', 'Facilitator Accounts') },
        { label: 'Component Assignment', keywords: ['classification', 'classify', 'component', 'cwts', 'lts', 'mts', 'army', 'navy', 'assignment'], run: () => openAdminView('assignments', 'Component Assignment') },
        { label: 'Module Library', keywords: ['module', 'modules', 'lesson', 'learning', 'common module', 'materials'], run: () => { setActiveSection('modules'); setHeaderHint('Opened Module Library'); } },
        { label: 'Assessment Bank', keywords: ['assessment', 'assessments', 'quiz', 'exam', 'test', 'answer key'], run: () => { setActiveSection('assessments'); setHeaderHint('Opened Assessment Bank'); } },
        { label: 'Reports Center', keywords: ['report', 'reports', 'analytics', 'chart', 'export pdf', 'excel'], run: () => { setActiveSection('reports'); setHeaderHint('Opened Reports Center'); } },
        { label: 'Notice Center', keywords: ['notice', 'notices', 'announcement', 'announcements', 'alert'], run: () => { setActiveSection('announcements'); setHeaderHint('Opened Notice Center'); } },
      ]
      : []),
    ...(user.role === 'facilitator'
      ? [
        { label: 'Lecture Upload', keywords: ['lecture', 'upload', 'video', 'lesson'], run: () => { setActiveSection('facilitator'); setHeaderHint('Opened Lecture Upload'); } },
        { label: 'Answer Keys', keywords: ['answer', 'answer key', 'answers', 'keys', 'quiz', 'assessment'], run: () => { setActiveSection('assessments'); setHeaderHint('Opened Answer Key Manager'); } },
      ]
      : []),
    ...(user.role === 'student'
      ? [
        { label: 'Common Modules', keywords: ['module', 'modules', 'lesson', 'study', 'learning'], run: () => { setActiveSection('modules'); setHeaderHint('Opened Common Modules'); } },
        { label: 'Grades', keywords: ['grade', 'grades', 'standing', 'score', 'completion'], run: () => { setActiveSection('grades'); setHeaderHint('Opened Grades'); } },
        { label: 'Progress', keywords: ['progress', 'classification', 'component', 'cwts', 'lts', 'mts'], run: () => { setActiveSection('progress'); setHeaderHint('Opened Progress'); } },
      ]
      : []),
  ];

  const goToSectionBySearch = (rawQuery: string) => {
    const query = rawQuery.trim().toLowerCase();
    if (!query) return;

    const match = searchCommands.find((item) => item.keywords.some((keyword) => keyword.toLowerCase().includes(query) || query.includes(keyword.toLowerCase())));
    if (match) {
      match.run();
      setHeaderHint(`Opened ${match.label}`);
      setHeaderSearch('');
      return;
    }

    setHeaderHint(`No result for "${rawQuery}". Try student, module, assessment, grade, facilitator, report, or announcement.`);
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    goToSectionBySearch(headerSearch);
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setHeaderHint('Fullscreen enabled');
      } else {
        await document.exitFullscreen();
        setHeaderHint('Fullscreen disabled');
      }
    } catch {
      setHeaderHint('Fullscreen is not available in this environment.');
    }
  };

  const initials = user.name
    ? String(user.name)
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part: string) => part[0]?.toUpperCase() || '')
      .join('')
    : 'U';

  const renderSection = () => {
    if (user.role === 'admin') {
      if (activeSection === 'reports') return <ReportsCenter user={user} />;
      if (activeSection === 'announcements') return <AnnouncementsCenter user={user} />;
      if (activeSection === 'modules') return <ModulesPage user={user} role="admin" onBack={goBackToOverview} />;
      if (activeSection === 'assessments') return <AssessmentsPage user={user} onBack={goBackToOverview} />;
      return <AdminDashboard initialView={activeSection === 'admin' ? adminInitialView : 'overview'} onNavigateApp={(target) => setActiveSection(target as ShellSection)} onLogout={handleLogout} />;
    }

    if (user.role === 'facilitator') {
      if (activeSection === 'reports') return <ReportsCenter user={user} />;
      if (activeSection === 'announcements') return <AnnouncementsCenter user={user} />;
      if (activeSection === 'modules') return <ModulesPage user={user} role="student" onBack={() => setActiveSection('facilitator')} />;
      if (activeSection === 'assessments') return <AssessmentsPage user={user} onBack={() => setActiveSection('facilitator')} />;
      return <FacilitatorDashboard user={user} onLogout={handleLogout} onNavigate={(target) => setActiveSection(target as ShellSection)} />;
    }

    if (activeSection === 'reports') return <ReportsCenter user={user} />;
    if (activeSection === 'announcements') return <AnnouncementsCenter user={user} />;
    if (activeSection === 'modules') return <ModulesPage user={user} role="student" onBack={goBackToOverview} />;
    if (activeSection === 'assessments') return <AssessmentsPage user={user} onBack={goBackToOverview} />;
    if (activeSection === 'progress') return <ProgressTracker user={user} onBack={goBackToOverview} />;
    if (activeSection === 'grades') return <GradesPage user={user} />;
    if (activeSection === 'overview') {
      return <RoleDashboardHome user={user} role="student" onNavigate={(target) => setActiveSection(target as ShellSection)} />;
    }
    return (
      <div className="grid auto-rows-[minmax(120px,auto)] gap-4 md:grid-cols-6">
        <div className="bento-panel md:col-span-4 md:row-span-2 p-6">
          <p className="text-xs uppercase tracking-[0.18em] font-semibold text-blue-700 mb-2 dark:text-blue-300">Objective Readiness</p>
          <h2 className="text-2xl font-bold text-slate-900 mb-3 dark:text-slate-100">NSTP delivery, enrollment, assessment, and reporting are unified in one workspace.</h2>
          <p className="text-slate-600 dark:text-slate-300">
            The system now foregrounds the required 25 contact hours, post-module assessments, major examinations, and component classification for CWTS, LTS, MTS (Army), and MTS (Navy).
          </p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {[
              `${commonModuleHours}/25 Common Module hours`,
              `${publishedPostModuleAssessments}/${moduleCount} modules with published tests`,
              `${majorExamCount} published major exam${majorExamCount === 1 ? '' : 's'}`,
              user.role === 'student' ? (user.component ? `${user.component} classified` : 'Component classification pending') : 'Admin classification tools active',
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="bento-panel p-5 md:col-span-2">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">System readiness</p>
          <p className="mt-2 text-4xl font-bold text-blue-700 dark:text-blue-300">{objectiveReadiness}/4</p>
        </div>

        <div className="bento-panel p-5 md:col-span-2">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Learning materials</p>
          <p className="mt-2 text-4xl font-bold text-emerald-600 dark:text-emerald-300">{moduleCount}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{assessmentCount} assessments in the library</p>
        </div>

        <div className="bento-panel p-5 md:col-span-2">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Contact hours</p>
          <p className="mt-2 text-4xl font-bold text-amber-600 dark:text-amber-300">{commonModuleHours}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Required minimum: 25</p>
        </div>

        <div className="bento-panel p-5 md:col-span-3">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Recommended flow</p>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">Enrollment -&gt; Component classification -&gt; Common modules -&gt; Post-module tests -&gt; Major exam -&gt; Reports</p>
        </div>

        <div className="bento-panel p-5 md:col-span-3">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Current role</p>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-200 capitalize">{user.role} workspace with role-specific modules, assessments, reports, and notices.</p>
        </div>

        <div className="bento-panel p-5 md:col-span-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Quick Actions</p>
              <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">Continue your NSTP workflow</h3>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Open Modules', section: 'modules' as ShellSection, detail: 'Continue the 25-hour Common Module' },
              { label: 'Take Assessment', section: 'assessments' as ShellSection, detail: 'Quizzes and major examinations' },
              { label: 'View Progress', section: 'progress' as ShellSection, detail: 'Hours, scores, and milestones' },
              { label: 'Check Grades', section: 'grades' as ShellSection, detail: 'Official standing and clearance' },
              { label: 'Generate Report', section: 'reports' as ShellSection, detail: 'Export-ready academic records' },
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => setActiveSection(action.section)}
                className="clickable-button rounded-xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-500/50 dark:hover:bg-blue-500/10"
              >
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{action.label}</span>
                <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{action.detail}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (user.role === 'facilitator' && ['facilitator', 'reports', 'assessments'].includes(activeSection)) {
    return (
      <>
        <FacilitatorDashboard user={user} onLogout={handleLogout} onNavigate={(target) => setActiveSection(target as ShellSection)} />
        {isBootSplashVisible && <AuthSplash mode="boot" userName={user?.name} />}
        {authSplash.visible && <AuthSplash mode={authSplash.mode} userName={authSplash.userName} />}
      </>
    );
  }

  if (user.role === 'admin' && ['overview', 'admin', 'modules', 'assessments', 'reports', 'announcements'].includes(activeSection)) {
    const adminView =
      activeSection === 'admin' ? adminInitialView :
      activeSection === 'modules' ? 'modules' :
      activeSection === 'assessments' ? 'assessments' :
      activeSection === 'reports' ? 'tools' :
      activeSection === 'announcements' ? 'settings' :
      'overview';
    return (
      <>
        <AdminDashboard initialView={adminView as any} onNavigateApp={(target) => setActiveSection(target as ShellSection)} onLogout={handleLogout} />
        {isBootSplashVisible && <AuthSplash mode="boot" userName={user?.name} />}
        {authSplash.visible && <AuthSplash mode={authSplash.mode} userName={authSplash.userName} />}
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[#eef2f8] text-slate-900 dark:bg-[#0b1426] dark:text-slate-100 lg:h-screen lg:overflow-hidden">
        <div className="nstp-app-shell min-h-screen flex flex-col lg:h-screen lg:flex-row gap-3 p-2 md:p-3">
        {mobileSidebarOpen && (
          <button
            type="button"
            aria-label="Close menu backdrop"
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm lg:hidden"
          />
        )}
        <aside className={`nstp-sidebar ${mobileSidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-[110%] opacity-0 pointer-events-none'} ${isSidebarCollapsed ? 'lg:w-28 lg:px-3 lg:py-3.5' : 'lg:w-[20rem] lg:p-5'} flex min-h-0 flex-col overflow-hidden transition-all duration-300 rounded-[1.75rem] border border-[#123a75]/70 bg-[radial-gradient(circle_at_top_left,rgba(31,92,187,0.34),transparent_36%),linear-gradient(180deg,#071f49_0%,#061633_48%,#050c23_100%)] text-white shadow-[0_28px_60px_-34px_rgba(7,12,33,0.9)] lg:pointer-events-auto lg:sticky lg:top-3 lg:h-[calc(100dvh-1.5rem)] lg:shrink-0 lg:translate-x-0 lg:opacity-100`}>
          <div className={`mb-4 flex items-center ${isSidebarCollapsed ? 'justify-between lg:justify-center' : 'justify-between'} gap-2`}>
            <div className="min-w-0 flex items-center gap-3">
              <div className={`${user.role === 'student' ? 'h-14 w-14 rounded-full border-[#e5b73b]/80 bg-white' : 'h-11 w-11 rounded-xl border-white/20 bg-white/10'} shrink-0 overflow-hidden border p-1 shadow-sm`}>
                <img src="/bipsu-logo.svg" alt="Biliran Province State University logo" className="h-full w-full object-contain" />
              </div>
              <div className={`${isSidebarCollapsed ? 'lg:hidden' : ''} min-w-0`}>
                <h1 className="truncate text-[1.05rem] font-semibold tracking-tight text-white">NSTP Command Center</h1>
                <p className="truncate text-[11px] font-medium text-white/70 uppercase tracking-[0.22em]">{user.role === 'student' ? 'Student Portal' : user.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMobileSidebarOpen(false)}
                title="Close menu"
                className="clickable-button inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white lg:hidden"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
              <button
                onClick={() => setIsSidebarCollapsed((state) => !state)}
                title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                className="clickable-button hidden h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white lg:inline-flex"
                aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {isSidebarCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {!isSidebarCollapsed && user.role === 'student' && (
            <>
              <div className="mb-6 rounded-2xl border border-white/15 bg-white/8 p-4 backdrop-blur-md">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/65">Signed In</p>
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-blue-600 text-base font-semibold text-white shadow-lg shadow-blue-950/40">{initials}</span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold leading-tight text-white">{user.name}</p>
                    <p className="truncate text-sm text-white/70">{user.email}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-white/75">
                  <CalendarDays className="h-4 w-4 text-cyan-300" />
                  {today}
                </div>
              </div>
            </>
          )}

          {!isSidebarCollapsed && user.role !== 'admin' && user.role !== 'student' && (
            <div className="mb-3 rounded-2xl border border-white/15 bg-white/8 p-3 backdrop-blur-md">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Signed In</p>
              <p className="font-semibold leading-tight text-white">{user.name}</p>
              <p className="text-sm text-white/70">{user.email}</p>
              <div className="mt-4 flex items-center gap-2 text-xs text-white/75">
                <CalendarDays className="h-3.5 w-3.5 text-cyan-300" />
                {today}
              </div>
            </div>
          )}

          {!isSidebarCollapsed && (
            <p className="mb-3 px-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/55">Navigation</p>
          )}

          <nav className={`nstp-nav min-h-0 flex-1 overflow-y-auto pr-1 ${isSidebarCollapsed ? 'flex flex-col items-center gap-3.5 py-3' : 'space-y-2.5'}`}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => navigateToSection(item.id)}
                  title={item.label}
                  className={`clickable-button ${isSidebarCollapsed ? 'lg:h-14 lg:w-14 lg:justify-center lg:px-0 lg:rounded-[1.1rem]' : 'lg:w-full lg:gap-3.5 lg:px-4 lg:py-3.5'} flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left transition-all border ${active ? 'border-blue-400/40 bg-blue-600 text-white shadow-lg shadow-blue-950/30' : 'border-transparent bg-transparent text-white/78 hover:bg-white/10 hover:text-white'}`}
                >
                  <Icon className={isSidebarCollapsed ? 'h-5 w-5 lg:h-6 lg:w-6' : 'h-5 w-5'} />
                  <span className={`${isSidebarCollapsed ? 'lg:hidden' : ''} font-semibold tracking-tight`}>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="shrink-0 pt-3">
            <div className="rounded-2xl border border-white/15 bg-white/8 p-2.5">
              {!isSidebarCollapsed && <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/65 mb-2">Account</p>}
              <button
                type="button"
                onClick={handleLogout}
                className="clickable-button flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-3 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
                {!isSidebarCollapsed && 'Logout'}
              </button>
            </div>
          </div>
        </aside>

        <main className="nstp-main flex-1 min-h-0 overflow-visible lg:h-[calc(100dvh-1.5rem)] lg:overflow-hidden">
          <div className="nstp-workspace flex w-full flex-col overflow-visible rounded-[1.75rem] border border-slate-200/90 bg-[#f8fafc] shadow-[0_28px_70px_-34px_rgba(15,23,42,0.45)] dark:border-slate-700 dark:bg-slate-950/85 lg:h-full lg:overflow-hidden">
            <div className="shrink-0 border-b border-slate-200/90 bg-white/90 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/80 md:px-5">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => setMobileSidebarOpen(true)}
                    className="clickable-button mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 lg:hidden"
                    aria-label="Open menu"
                    title="Open menu"
                  >
                    <Menu className="h-5 w-5" />
                  </button>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] font-semibold text-blue-700 dark:text-blue-300">{user.role === 'admin' ? 'Administration' : user.role === 'facilitator' ? 'Facilitator Workspace' : 'Student Portal'}</p>
                    <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 md:text-3xl">
                    {activeSection === 'overview'
                      ? 'Dashboard'
                      : activeSection === 'modules'
                        ? 'Modules'
                        : activeSection === 'assessments'
                          ? 'Assessments'
                          : activeSection === 'progress'
                            ? 'Progress'
                            : activeSection === 'grades'
                              ? 'Grades'
                            : activeSection === 'facilitator'
                              ? 'Facilitator Dashboard'
                              : activeSection === 'reports'
                                ? 'Reports'
                                : activeSection === 'announcements'
                                ? 'Notice Center'
                                : 'Enrollment'}
                    </h2>
                  </div>
                </div>

                <div className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-2 sm:flex sm:flex-wrap xl:justify-end">
                  <div className="relative" ref={workspaceMenuRef}>
                    <button
                      onClick={() => setWorkspaceMenuOpen((open) => !open)}
                      className="clickable-button inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      Actions
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>

                    {workspaceMenuOpen && (
                      <div className="absolute left-0 z-30 mt-2 max-h-[min(30rem,calc(100dvh-5rem))] w-[min(18rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900 sm:left-auto sm:right-0 sm:w-72">
                        <div className="mb-1 px-2 py-1">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Quick menu</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{workspaceLabel}</p>
                        </div>
                        {workspaceActions.map((action) => (
                          <button
                            key={action.label}
                            onClick={() => {
                              setWorkspaceLabel(action.label);
                              action.run();
                            }}
                            className="clickable-button mb-1 w-full rounded-xl px-3 py-2.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">{action.label}</span>
                            <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{action.detail}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="relative min-w-0 max-w-none sm:min-w-[180px] sm:max-w-[240px] sm:flex-1 xl:flex-none">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search"
                      value={headerSearch}
                      onChange={(event) => setHeaderSearch(event.target.value)}
                      onKeyDown={handleSearchKeyDown}
                      className="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <button
                    onClick={() => setThemeMode((mode) => (mode === 'dark' ? 'light' : 'dark'))}
                    className="clickable-button inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    aria-label="Toggle theme"
                    title="Toggle theme"
                  >
                    {themeMode === 'dark' ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
                    <span className="hidden sm:inline">{themeMode === 'dark' ? 'Light' : 'Dark'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveSection('reports');
                      setAdminInitialView('overview');
                      setHeaderHint('Opened Reports workspace');
                    }}
                    className="clickable-button hidden rounded-full bg-[#0b1233] px-4 py-2 text-sm font-semibold text-white dark:bg-blue-700 sm:inline-flex"
                  >
                    New Report
                  </button>

                  <button
                    onClick={toggleFullscreen}
                    className="clickable-button hidden h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 sm:inline-flex"
                    title="Toggle fullscreen"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </button>

                  <div className="relative" ref={notificationsRef}>
                    <button
                      onClick={() => setNotificationsOpen((open) => !open)}
                      className="clickable-button relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      title="Open notifications"
                    >
                      <Bell className="h-4 w-4" />
                      {unreadNotificationCount > 0 && (
                        <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                          {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                        </span>
                      )}
                    </button>

                    {notificationsOpen && (
                      <div className="absolute right-0 z-30 mt-2 max-h-[min(34rem,calc(100dvh-5rem))] w-[min(20rem,calc(100vw-1rem))] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                        <div className="mb-2 flex items-center justify-between px-2 py-1">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Notifications</p>
                          <button
                            onClick={() => {
                              setActiveSection('announcements');
                              setNotificationsOpen(false);
                            }}
                            className="clickable-button rounded-lg px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-500/10"
                          >
                            Open Notice Center
                          </button>
                        </div>

                        <div className="max-h-72 space-y-1 overflow-auto pr-1">
                          {visibleNotifications.length === 0 && (
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                              No notifications yet.
                            </div>
                          )}

                          {visibleNotifications.slice(0, 6).map((notice) => {
                            const unread = !readNoticeIds.includes(notice.id);
                            return (
                              <button
                                key={notice.id}
                                onClick={() => markNotificationRead(notice.id)}
                                className={`w-full rounded-xl border px-3 py-2.5 text-left ${unread ? 'border-blue-200 bg-blue-50/60 dark:border-blue-500/30 dark:bg-blue-500/10' : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950'}`}
                              >
                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{notice.title}</p>
                                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 line-clamp-2">{notice.message}</p>
                                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{new Date(notice.createdAt).toLocaleString()}</p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="relative" ref={profileMenuRef}>
                    <button
                      onClick={() => setProfileMenuOpen((open) => !open)}
                      className="clickable-button inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      title="Profile menu"
                    >
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-700 text-xs font-semibold text-white">{initials}</span>
                      <span className="hidden max-w-[120px] truncate text-xs md:inline">{user.name}</span>
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>

                    {profileMenuOpen && (
                      <div className="absolute right-0 z-30 mt-2 max-h-[min(30rem,calc(100dvh-5rem))] w-[min(20rem,calc(100vw-1rem))] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                        <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Signed In</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{user.name}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-300">{user.email}</p>
                        </div>
                        <div className="mt-2 space-y-1">
                          {accountUtilities.map((action) => {
                            const Icon = action.icon;
                            return (
                            <button
                              key={action.id}
                              onClick={() => openAccountUtility(action.id)}
                              className="clickable-button flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                                <Icon className="h-4 w-4" />
                              </span>
                              <span>
                                <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">{action.label}</span>
                                <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{action.detail}</span>
                              </span>
                            </button>
                          );
                          })}
                        </div>
                        <div className="my-2 h-px bg-slate-200 dark:bg-slate-800" />
                        <button
                          onClick={() => {
                            setThemeMode((mode) => (mode === 'dark' ? 'light' : 'dark'));
                            setProfileMenuOpen(false);
                          }}
                          className="clickable-button w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          Switch to {themeMode === 'dark' ? 'light' : 'dark'} mode
                        </button>
                        <button
                          onClick={() => {
                            setIsSidebarCollapsed((state) => !state);
                            setProfileMenuOpen(false);
                          }}
                          className="clickable-button hidden w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 lg:block"
                        >
                          {isSidebarCollapsed ? 'Expand sidebar' : 'Use compact sidebar'}
                        </button>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="clickable-button sticky bottom-0 mt-1 flex w-full items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-left text-sm font-semibold text-rose-700 shadow-sm hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:bg-rose-500/15"
                        >
                          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-rose-600 dark:bg-rose-500/10 dark:text-rose-200">
                            <LogOut className="h-4 w-4" />
                          </span>
                          <span>
                            <span className="block">Logout</span>
                            <span className="block text-xs font-medium text-rose-500 dark:text-rose-200/80">End this portal session</span>
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {headerHint && (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{headerHint}</p>
              )}
            </div>

            <div className="nstp-content min-h-0 flex-1 overflow-visible p-3 md:p-4 lg:overflow-auto lg:p-4">
              {renderSection()}
            </div>
          </div>
        </main>
        </div>
      </div>
      {accountUtility && selectedAccountUtility && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm md:p-6">
          <div className="max-h-[92dvh] w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800 md:px-6">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                  {SelectedAccountUtilityIcon && <SelectedAccountUtilityIcon className="h-5 w-5" />}
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">Account Center</p>
                  <h3 className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">{selectedAccountUtility.label}</h3>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{selectedAccountUtility.detail}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAccountUtility(null)}
                className="clickable-button inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                title="Close account center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[70dvh] overflow-auto p-5 md:p-6">
              {accountUtility === 'profile' && (
                <div className="grid gap-4 md:grid-cols-[1fr_1.1fr]">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-700 text-lg font-semibold text-white">{initials}</span>
                      <div>
                        <p className="text-base font-semibold text-slate-950 dark:text-white">{user.name}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{user.email}</p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                      <span className="rounded-xl bg-white p-3 dark:bg-slate-900">
                        <span className="block text-xs uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Role</span>
                        <span className="mt-1 block font-semibold capitalize text-slate-900 dark:text-slate-100">{user.role}</span>
                      </span>
                      <span className="rounded-xl bg-white p-3 dark:bg-slate-900">
                        <span className="block text-xs uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Status</span>
                        <span className="mt-1 block font-semibold text-emerald-700 dark:text-emerald-300">Active</span>
                      </span>
                    </div>
                    <div className="mt-4 space-y-3">
                      <label className="block text-sm font-semibold text-slate-800 dark:text-slate-100">
                        Display name
                        <input
                          value={profileDraft.name}
                          onChange={(event) => setProfileDraft((draft) => ({ ...draft, name: event.target.value }))}
                          className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                        />
                      </label>
                      <label className="block text-sm font-semibold text-slate-800 dark:text-slate-100">
                        Email address
                        <input
                          type="email"
                          value={profileDraft.email}
                          onChange={(event) => setProfileDraft((draft) => ({ ...draft, email: event.target.value }))}
                          className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={saveProfileDetails}
                        className="clickable-button inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
                      >
                        <Save className="h-4 w-4" />
                        Save profile
                      </button>
                    </div>
                  </div>
                  <div className="grid gap-3">
                    {[
                      ['NSTP component', user.component || user.preferredComponent || (user.role === 'admin' ? 'Program administration' : user.role === 'facilitator' ? 'Lecture facilitator' : 'Pending assignment')],
                      ['Portal access', user.role === 'admin' ? 'Full administrative workspace' : user.role === 'facilitator' ? 'Facilitator lecture and assessment tools' : 'Student learning and grade portal'],
                      ['Last portal view', navItems.find((item) => item.id === activeSection)?.label || activeSection],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{label}</p>
                        <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {accountUtility === 'settings' && (
                <div className="grid gap-3 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      setThemeMode((mode) => (mode === 'dark' ? 'light' : 'dark'));
                      recordAccountActivity('Theme changed', `Switched to ${themeMode === 'dark' ? 'light' : 'dark'} mode.`);
                    }}
                    className="clickable-button rounded-2xl border border-slate-200 bg-white p-4 text-left hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-slate-800"
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold text-slate-950 dark:text-white">{themeMode === 'dark' ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />} Display mode</span>
                    <span className="mt-2 block text-sm text-slate-600 dark:text-slate-300">Currently using {themeMode} mode. Switch for the lighting condition of your device.</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSidebarCollapsed((state) => !state);
                      recordAccountActivity('Sidebar density changed', isSidebarCollapsed ? 'Expanded sidebar labels.' : 'Enabled compact sidebar.');
                    }}
                    className="clickable-button hidden rounded-2xl border border-slate-200 bg-white p-4 text-left hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-slate-800 lg:block"
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold text-slate-950 dark:text-white">{isSidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />} Sidebar density</span>
                    <span className="mt-2 block text-sm text-slate-600 dark:text-slate-300">{isSidebarCollapsed ? 'Expanded navigation will show full labels.' : 'Compact navigation gives the workspace more horizontal room.'}</span>
                  </button>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                    <p className="text-sm font-semibold text-slate-950 dark:text-white">Notification preferences</p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{unreadNotificationCount} unread item{unreadNotificationCount === 1 ? '' : 's'} from notices and program alerts.</p>
                    <div className="mt-3 space-y-2">
                      {[
                        ['notificationDigest', 'Daily digest inside portal'],
                        ['emailAlerts', 'Email-style alert preference'],
                      ].map(([key, label]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => updateAccountPreferences({ [key]: !accountPreferences[key as keyof AccountPreferences] } as Partial<AccountPreferences>, 'Notification preference changed', label)}
                          className="clickable-button flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm dark:border-slate-700 dark:bg-slate-900"
                        >
                          <span className="font-medium text-slate-800 dark:text-slate-100">{label}</span>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${accountPreferences[key as keyof AccountPreferences] ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'}`}>{accountPreferences[key as keyof AccountPreferences] ? 'On' : 'Off'}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                    <label className="block text-sm font-semibold text-slate-950 dark:text-white">
                      Default landing
                      <select
                        value={accountPreferences.defaultLanding}
                        onChange={(event) => updateAccountPreferences({ defaultLanding: event.target.value as ShellSection }, 'Default landing changed', `Saved ${event.target.value} as the landing page.`)}
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      >
                        {navItems.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                      </select>
                    </label>
                    <button
                      type="button"
                      onClick={openDefaultLanding}
                      className="clickable-button mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-100 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200"
                    >
                      Open saved landing
                    </button>
                  </div>
                </div>
              )}

              {accountUtility === 'security' && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                    <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800 dark:text-emerald-200"><LockKeyhole className="h-4 w-4" /> Secure session active</p>
                    <p className="mt-2 text-sm text-emerald-800/80 dark:text-emerald-100/80">Your account is scoped to {user.role === 'admin' ? 'full administrative access' : user.role === 'facilitator' ? 'facilitator-only publishing access' : 'student learning access'}.</p>
                  </div>
                  {[
                    'Role-based access protects restricted modules.',
                    'Profile actions stay separate from learning and administration workflows.',
                    'Local portal data is saved only for NSTP workspace continuity.',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                      <p className="text-sm text-slate-700 dark:text-slate-200">{item}</p>
                    </div>
                  ))}
                  <div className="grid gap-3 sm:grid-cols-3">
                    <button type="button" onClick={refreshPermissionCheck} className="clickable-button inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
                      <RotateCcw className="h-4 w-4" />
                      Check access
                    </button>
                    <button type="button" onClick={downloadPrivacySummary} className="clickable-button inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800 hover:bg-blue-100 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200">
                      <Download className="h-4 w-4" />
                      Privacy JSON
                    </button>
                    <button type="button" onClick={handleLogout} className="clickable-button inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                      <LogOut className="h-4 w-4" />
                      End session
                    </button>
                  </div>
                </div>
              )}

              {accountUtility === 'accessibility' && (
                <div className="grid gap-3 md:grid-cols-2">
                  {[
                    { key: 'fontScale', label: 'Large text', detail: 'Increase portal text size for easier reading.', value: accountPreferences.fontScale === 'large', patch: { fontScale: accountPreferences.fontScale === 'large' ? 'standard' : 'large' } },
                    { key: 'highContrast', label: 'High contrast', detail: 'Strengthen borders, foregrounds, and focus states.', value: accountPreferences.highContrast, patch: { highContrast: !accountPreferences.highContrast } },
                    { key: 'reduceMotion', label: 'Reduce motion', detail: 'Minimize transitions and motion effects.', value: accountPreferences.reduceMotion, patch: { reduceMotion: !accountPreferences.reduceMotion } },
                    { key: 'focusMode', label: 'Focus mode', detail: 'Tone down decorative surfaces around the workspace.', value: accountPreferences.focusMode, patch: { focusMode: !accountPreferences.focusMode } },
                    { key: 'compactCards', label: 'Compact cards', detail: 'Tighten card padding for dense dashboards.', value: accountPreferences.compactCards, patch: { compactCards: !accountPreferences.compactCards } },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => updateAccountPreferences(item.patch as Partial<AccountPreferences>, 'Accessibility preference changed', item.label)}
                      className="clickable-button rounded-2xl border border-slate-200 bg-white p-4 text-left hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-slate-800"
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold text-slate-950 dark:text-white">{item.label}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${item.value ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'}`}>{item.value ? 'On' : 'Off'}</span>
                      </span>
                      <span className="mt-2 block text-sm text-slate-600 dark:text-slate-300">{item.detail}</span>
                    </button>
                  ))}
                  <button type="button" onClick={resetAccessibilityPreferences} className="clickable-button inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800 hover:bg-blue-100 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200">
                    <RotateCcw className="h-4 w-4" />
                    Reset accessibility
                  </button>
                </div>
              )}

              {accountUtility === 'activity' && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                    <div>
                      <p className="text-sm font-semibold text-slate-950 dark:text-white">Activity timeline</p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{accountActivity.length} saved account event{accountActivity.length === 1 ? '' : 's'} on this device.</p>
                    </div>
                    <button
                      type="button"
                      onClick={exportAccountActivity}
                      disabled={accountActivity.length === 0}
                      className="clickable-button inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-100 disabled:opacity-50 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200"
                    >
                      <Download className="h-4 w-4" />
                      Export JSON
                    </button>
                  </div>
                  {[
                    ...accountActivity,
                    { id: 'workspace', title: 'Current workspace opened', detail: workspaceLabel, createdAt: new Date().toISOString() },
                    { id: 'role', title: 'Active role loaded', detail: `${user.role} access profile`, createdAt: new Date().toISOString() },
                    { id: 'area', title: 'Latest portal area', detail: navItems.find((item) => item.id === activeSection)?.label || activeSection, createdAt: new Date().toISOString() },
                  ].slice(0, 10).map((item) => (
                    <div key={item.id} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600 dark:bg-blue-300" />
                      <div>
                        <p className="text-sm font-semibold text-slate-950 dark:text-white">{item.title}</p>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.detail}</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{new Date(item.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {accountUtility === 'help' && (
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950 md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-950 dark:text-white">
                      Create a local support ticket
                      <textarea
                        value={supportMessage}
                        onChange={(event) => setSupportMessage(event.target.value)}
                        placeholder="Describe the login, module, assessment, grade, or accessibility concern..."
                        className="mt-2 min-h-28 w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      />
                    </label>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={submitSupportTicket}
                        className="clickable-button inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
                      >
                        <Send className="h-4 w-4" />
                        Save support ticket
                      </button>
                      {supportStatus && <span className="text-sm text-slate-600 dark:text-slate-300">{supportStatus}</span>}
                    </div>
                  </div>
                  {[
                    ['NSTP coordinator', 'nstp.coordinator@bipsu.edu.ph', 'Program requirements, component concerns, and schedules.'],
                    ['Technical support', 'support@nstp.edu', 'Login, device, accessibility, and portal issue assistance.'],
                    ['Registrar support', 'registrar@bipsu.edu.ph', 'Student records, enrollment verification, and official standing.'],
                    ['Facilitator support', 'facilitator.support@nstp.edu', 'Lecture uploads, answer keys, and assessment publishing.'],
                  ].map(([title, email, detail]) => (
                    <a
                      key={title}
                      href={`mailto:${email}?subject=NSTP Portal Support&body=${encodeURIComponent(`Name: ${user.name}\nRole: ${user.role}\nConcern:\n`)}`}
                      onClick={() => recordAccountActivity('Support contact opened', title)}
                      className="clickable-button rounded-2xl border border-slate-200 bg-white p-4 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-slate-800"
                    >
                      <p className="flex items-center gap-2 text-sm font-semibold text-slate-950 dark:text-white"><Mail className="h-4 w-4" />{title}</p>
                      <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">{email}</p>
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{detail}</p>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {isBootSplashVisible && <AuthSplash mode="boot" userName={user?.name} />}
      {authSplash.visible && <AuthSplash mode={authSplash.mode} userName={authSplash.userName} />}
    </>
  );
}
