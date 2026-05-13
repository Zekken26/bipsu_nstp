import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart3,
  Bell,
  BookOpen,
  CalendarCheck,
  Check,
  CheckCircle,
  ChevronDown,
  ClipboardList,
  FileQuestion,
  FileVideo,
  LayoutDashboard,
  MapPin,
  Menu,
  Moon,
  Search,
  Settings,
  Upload,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import AssessmentManager from '../../assessments/components/AssessmentManager';
import CollapsibleRoleSidebar from '../../../components/layout/CollapsibleRoleSidebar';
import {
  createEmptyStudent,
  loadAccounts,
  loadAssessments,
  loadGradeRecords,
  loadPendingStudentRegistrations,
  loadStudents,
  saveAccounts,
  saveGradeRecords,
  savePendingStudentRegistrations,
  saveStudents,
  NSTP_COMPONENTS,
  PendingStudentRegistration,
  NstpAssessment,
  NstpGradeRecord,
  NstpStudent,
} from '../../../data/nstpData';

type FacilitatorLecture = {
  id: string;
  title: string;
  fileName: string;
  uploadedAt: string;
};

const componentColors = ['#10b981', '#2563eb', '#f59e0b', '#8b5cf6'];
const gradeColors = ['#10b981', '#2563eb', '#f59e0b', '#8b5cf6', '#ef4444'];

const initials = (name: string) => name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'F';

export default function FacilitatorDashboard({
  user,
  onLogout,
  onNavigate,
  embedded = false,
}: {
  user: any;
  onLogout?: () => void;
  onNavigate?: (target: string) => void;
  embedded?: boolean;
}) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [lectures, setLectures] = useState<FacilitatorLecture[]>([]);
  const [students, setStudents] = useState<NstpStudent[]>([]);
  const [pendingRegistrations, setPendingRegistrations] = useState<PendingStudentRegistration[]>([]);
  const [gradeRecords, setGradeRecords] = useState<NstpGradeRecord[]>([]);
  const [assessments, setAssessments] = useState<NstpAssessment[]>([]);
  const [lectureTitle, setLectureTitle] = useState('');
  const [search, setSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const storageKey = `nstp-facilitator-lectures-${user.id}`;

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    setLectures(saved ? JSON.parse(saved) : []);
    setStudents(loadStudents());
    setPendingRegistrations(loadPendingStudentRegistrations());
    setGradeRecords(loadGradeRecords());
    setAssessments(loadAssessments());
  }, [storageKey]);

  const assignedMunicipalities = user.municipalities || [];
  const scopedStudents = useMemo(
    () => students.filter((student) => student.municipality && assignedMunicipalities.includes(student.municipality)),
    [students, assignedMunicipalities],
  );
  const scopedPending = useMemo(
    () => pendingRegistrations.filter((registration) => registration.municipality && assignedMunicipalities.includes(registration.municipality)),
    [pendingRegistrations, assignedMunicipalities],
  );

  const query = search.trim().toLowerCase();
  const visiblePending = scopedPending.filter((registration) => {
    if (!query) return true;
    return [registration.name, registration.email, registration.studentId, registration.municipality].some((value) => value?.toLowerCase().includes(query));
  });

  const getGradeRecord = (student: NstpStudent) => gradeRecords.find((record) => record.studentId === (student.studentId || student.id));
  const getAverageGrade = (student: NstpStudent) => {
    const record = getGradeRecord(student);
    if (!record) return 0;
    const grades = [record.prelim, record.midterm, record.final].filter((grade) => grade > 0);
    return grades.length ? grades.reduce((sum, grade) => sum + grade, 0) / grades.length : 0;
  };

  const gradeValues = scopedStudents.map(getAverageGrade).filter((grade) => grade > 0);
  const averageGrade = gradeValues.length ? gradeValues.reduce((sum, grade) => sum + grade, 0) / gradeValues.length : 0;
  const attendanceToday = scopedStudents.length ? Math.round((scopedStudents.filter((student) => student.status === 'active' || student.status === 'graduated').length / scopedStudents.length) * 100) : 0;

  const componentData = NSTP_COMPONENTS.map((component) => ({
    name: component,
    value: scopedStudents.filter((student) => student.component === component).length,
  }));

  const gradeDistribution = [
    { range: '90 - 100', value: gradeValues.filter((grade) => grade >= 90).length },
    { range: '85 - 89', value: gradeValues.filter((grade) => grade >= 85 && grade < 90).length },
    { range: '80 - 84', value: gradeValues.filter((grade) => grade >= 80 && grade < 85).length },
    { range: '75 - 79', value: gradeValues.filter((grade) => grade >= 75 && grade < 80).length },
    { range: 'Below 75', value: gradeValues.filter((grade) => grade > 0 && grade < 75).length },
  ];

  const recentAssessments = assessments
    .filter((assessment) => assessment.ownerRole === 'facilitator' && (assessment.ownerId === user.id || assessment.ownerId === 'facilitator-1'))
    .slice(0, 4);

  const persistLectures = (nextLectures: FacilitatorLecture[]) => {
    localStorage.setItem(storageKey, JSON.stringify(nextLectures));
    setLectures(nextLectures);
  };

  const handleLectureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const nextLecture: FacilitatorLecture = {
      id: `lecture-${Math.random().toString(36).slice(2, 10)}`,
      title: lectureTitle.trim() || file.name.replace(/\.[^.]+$/, ''),
      fileName: file.name,
      uploadedAt: new Date().toISOString(),
    };

    persistLectures([nextLecture, ...lectures].slice(0, 12));
    setLectureTitle('');
    event.target.value = '';
  };

  const approveRegistration = (registration: PendingStudentRegistration) => {
    if (!registration.municipality || !assignedMunicipalities.includes(registration.municipality)) return;
    const allAccounts = loadAccounts();
    const approvedStudentId = registration.studentId || `LEGACY-${registration.id.slice(-4).toUpperCase()}`;
    const nextAccount = {
      id: `student-${Math.random().toString(36).slice(2, 10)}`,
      studentId: approvedStudentId,
      name: registration.name,
      email: registration.email,
      password: registration.password,
      role: 'student' as const,
      municipality: registration.municipality,
    };
    saveAccounts([nextAccount, ...allAccounts]);

    const nextStudent: NstpStudent = {
      ...createEmptyStudent(),
      id: nextAccount.id,
      studentId: approvedStudentId,
      name: nextAccount.name,
      email: nextAccount.email,
      municipality: registration.municipality,
      facilitatorId: user.id,
      facilitatorName: user.name,
      status: 'active',
      notes: `Approved by ${user.name} for ${registration.municipality}.`,
      updatedAt: new Date().toISOString(),
    };
    const nextStudents = [nextStudent, ...students];
    const nextPending = pendingRegistrations.filter((item) => item.id !== registration.id);
    saveStudents(nextStudents);
    savePendingStudentRegistrations(nextPending);
    setStudents(nextStudents);
    setPendingRegistrations(nextPending);
  };

  const rejectRegistration = (registration: PendingStudentRegistration) => {
    const nextPending = pendingRegistrations.filter((item) => item.id !== registration.id);
    savePendingStudentRegistrations(nextPending);
    setPendingRegistrations(nextPending);
  };

  const updateGrade = (student: NstpStudent, field: 'prelim' | 'midterm' | 'final', value: number) => {
    const studentKey = student.studentId || student.id;
    const existing = gradeRecords.find((record) => record.studentId === studentKey);
    const base: NstpGradeRecord = existing || {
      studentId: studentKey,
      prelim: 0,
      midterm: 0,
      final: 0,
      remarks: 'In Progress',
      released: false,
      updatedAt: new Date().toISOString(),
    };
    const nextRecord = {
      ...base,
      [field]: Math.max(0, Math.min(100, value || 0)),
      updatedAt: new Date().toISOString(),
    };
    const average = Math.round(((nextRecord.prelim || 0) + (nextRecord.midterm || 0) + (nextRecord.final || 0)) / 3);
    nextRecord.remarks = average >= 75 && nextRecord.final > 0 ? 'Passed' : nextRecord.final > 0 ? 'For Completion' : 'In Progress';
    const nextRecords = existing
      ? gradeRecords.map((record) => record.studentId === studentKey ? nextRecord : record)
      : [nextRecord, ...gradeRecords];
    saveGradeRecords(nextRecords);
    setGradeRecords(nextRecords);
  };

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
  };

  const navGroups = [
    {
      label: 'Home',
      items: [{ label: 'Dashboard', icon: LayoutDashboard, active: true, badge: null, target: 'facilitator' }],
    },
    {
      label: 'Students',
      items: [
        { label: 'My Students', icon: Users, active: false, badge: null, target: 'grade-book' },
        { label: 'Student Approvals', icon: UserCheck, active: false, badge: scopedPending.length || null, target: 'enrollment-requests' },
        { label: 'Attendance', icon: CalendarCheck, active: false, badge: null, target: 'class-overview' },
        { label: 'Grades', icon: ClipboardList, active: false, badge: null, target: 'grade-book' },
      ],
    },
    {
      label: 'Assessments',
      items: [
        { label: 'Assessment Management', icon: FileQuestion, active: false, badge: null, target: 'assessment-builder' },
        { label: 'Lecture Uploads', icon: FileVideo, active: false, badge: lectures.length || null, target: 'lecture-uploads' },
        { label: 'Question Banks', icon: BookOpen, active: false, badge: null, target: 'assessment-builder' },
      ],
    },
    {
      label: 'Reports',
      items: [
        { label: 'Grade Book', icon: ClipboardList, active: false, badge: null, target: 'grade-book' },
        { label: 'Reports', icon: BarChart3, active: false, badge: null, target: 'facilitator-analytics' },
      ],
    },
  ];

  const handleSidebarAction = (target: string) => {
    if (target === 'announcements') {
      onNavigate?.(target);
      return;
    }
    document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const kpis = [
    {
      label: 'Total Students',
      value: scopedStudents.length,
      detail: 'Enrolled students',
      action: `${Math.max(0, scopedStudents.length - 116)} this month`,
      icon: Users,
      toneClass: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-200',
    },
    {
      label: 'Student Approvals',
      value: scopedPending.length,
      detail: 'Pending approval',
      action: 'View requests',
      icon: UserCheck,
      toneClass: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-200',
    },
    {
      label: 'Attendance Today',
      value: `${attendanceToday}%`,
      detail: `${Math.round((attendanceToday / 100) * scopedStudents.length)} present / ${scopedStudents.length} total`,
      action: 'View attendance',
      icon: CalendarCheck,
      toneClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-200',
    },
    {
      label: 'Average Grade',
      value: averageGrade ? averageGrade.toFixed(2) : '0.00',
      detail: 'Class average',
      action: 'View grade book',
      icon: BookOpen,
      toneClass: 'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-200',
    },
  ];

  return (
    <div className={`${embedded ? 'min-h-0 bg-transparent' : 'min-h-dvh overflow-x-hidden bg-[#f4f8fd]'} text-slate-950 dark:bg-slate-950 dark:text-slate-100`}>
      <div className={embedded ? 'min-h-0' : 'min-h-dvh'}>
        {!embedded && (
          <CollapsibleRoleSidebar
            open={mobileSidebarOpen}
            onClose={() => setMobileSidebarOpen(false)}
            portalLabel="Facilitator Portal"
            closeLabel="Close facilitator navigation"
            groups={navGroups.map((group) => ({
              label: group.label,
              items: group.items.map((item) => ({
                label: item.label,
                icon: item.icon,
                active: item.active,
                badge: item.badge,
                onClick: () => handleSidebarAction(item.target),
              })),
            }))}
            avatarLabel={initials(user.name)}
            accountLabel="Facilitator"
            accountTitle={user.name}
            accountSubtitle={assignedMunicipalities.length ? `${assignedMunicipalities.join(', ')}, Biliran` : 'Awaiting assignment'}
            accountMeta={
              <div className="flex items-start gap-2 text-xs font-semibold text-white/75">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#E5B73B]" />
                <span className="min-w-0 truncate">{assignedMunicipalities.length ? `${assignedMunicipalities.join(', ')}, Biliran` : 'Awaiting assignment'}</span>
              </div>
            }
            onLogout={onLogout}
          />
        )}

        <main className={`min-w-0 overflow-hidden rounded-[2rem] border border-slate-200 bg-white/85 shadow-xl shadow-slate-200/50 backdrop-blur transition-all duration-300 dark:border-slate-800 dark:bg-slate-900/85 dark:shadow-none ${embedded ? '' : 'm-3 lg:ml-[76px]'}`}>
          <header className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 dark:border-slate-800 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              {!embedded && (
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(true)}
                  className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 lg:hidden"
                  aria-label="Open facilitator navigation"
                >
                  <Menu className="h-5 w-5" />
                </button>
              )}
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-700 dark:text-blue-300">Facilitator Portal</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white md:text-3xl">Good morning, {user.name}</h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Facilitator - {assignedMunicipalities[0] || 'Unassigned'}, Biliran</p>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center xl:justify-end">
              <label className="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-950 sm:min-w-[16rem] xl:w-[24rem]">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search students, assessments..."
                  className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
                />
              </label>
              <button onClick={toggleTheme} className="grid h-12 w-12 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-blue-200 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                <Moon className="h-5 w-5" />
              </button>
              <button className="relative grid h-12 w-12 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                <Bell className="h-5 w-5" />
                {scopedPending.length ? <span className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-rose-500 text-xs font-semibold text-white">{scopedPending.length}</span> : null}
              </button>
              <div className="flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 shadow-sm dark:border-slate-700 dark:bg-slate-950">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-blue-700 text-sm font-semibold text-white">{initials(user.name)}</span>
                <span className="hidden text-sm font-medium text-slate-800 dark:text-slate-100 sm:block">{user.name}</span>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </div>
            </div>
          </header>

          <div className="space-y-5 p-5">
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {kpis.map((stat) => {
                const Icon = stat.icon;
                return (
                  <article key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <div className="flex items-start gap-4">
                      <span className={`grid h-14 w-14 place-items-center rounded-2xl ${stat.toneClass}`}>
                        <Icon className="h-7 w-7" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{stat.label}</p>
                        <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">{stat.value}</p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{stat.detail}</p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm font-medium text-blue-700 dark:text-blue-300">{stat.action}</p>
                  </article>
                );
              })}
            </section>

            <section className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
              <article id="enrollment-requests" className="scroll-mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Student Approvals</h2>
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">View all</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] overflow-hidden rounded-2xl text-sm">
                    <thead>
                      <tr className="border-y border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-[0.08em] text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                        <th className="px-4 py-3">Student</th>
                        <th className="px-4 py-3">Municipality</th>
                        <th className="px-4 py-3">Request Date</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visiblePending.map((registration) => (
                        <tr key={registration.id} className="border-b border-slate-100 dark:border-slate-800">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <span className="grid h-9 w-9 place-items-center rounded-full bg-blue-600 text-xs font-semibold text-white">{initials(registration.name)}</span>
                              <span>
                                <span className="block font-medium text-slate-900 dark:text-slate-100">{registration.name}</span>
                                <span className="text-xs text-slate-500">{registration.studentId || registration.email}</span>
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{registration.municipality}, Biliran</td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{new Date(registration.createdAt).toLocaleDateString()}</td>
                          <td className="px-4 py-3"><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-200">Pending</span></td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button onClick={() => approveRegistration(registration)} className="grid h-9 w-9 place-items-center rounded-full border border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-500/30 dark:hover:bg-emerald-500/10">
                                <Check className="h-4 w-4" />
                              </button>
                              <button onClick={() => rejectRegistration(registration)} className="grid h-9 w-9 place-items-center rounded-full border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-500/30 dark:hover:bg-rose-500/10">
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {visiblePending.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                      No pending enrollment requests for your municipality scope.
                    </div>
                  ) : null}
                </div>
              </article>

              <article id="class-overview" className="scroll-mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Class Overview</h2>
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">View all students</span>
                </div>
                <div className="grid gap-5 sm:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-1 2xl:grid-cols-[220px_minmax(0,1fr)]">
                  <div className="h-56 min-h-56 min-w-0">
                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                      <PieChart>
                        <Pie data={componentData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={2}>
                          {componentData.map((entry, index) => <Cell key={entry.name} fill={componentColors[index % componentColors.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-4">
                    {componentData.map((item, index) => (
                      <div key={item.name} className="flex items-center justify-between gap-3 text-sm">
                        <span className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-200">
                          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: componentColors[index] }} />
                          {item.name}
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-white">{item.value} ({scopedStudents.length ? Math.round((item.value / scopedStudents.length) * 100) : 0}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            </section>

            <section className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
              <article id="facilitator-analytics" className="scroll-mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Recent Assessments</h2>
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">View all</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[680px] text-sm">
                    <thead>
                      <tr className="border-y border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-[0.08em] text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                        <th className="px-4 py-3">Assessment</th>
                        <th className="px-4 py-3">Module</th>
                        <th className="px-4 py-3">Submissions</th>
                        <th className="px-4 py-3">Due Date</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentAssessments.map((assessment, index) => (
                        <tr key={assessment.id} className="border-b border-slate-100 dark:border-slate-800">
                          <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{assessment.title}</td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{assessment.moduleId || 'General'}</td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{Math.max(0, scopedStudents.length - index * 4)} / {scopedStudents.length}</td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{new Date(assessment.updatedAt).toLocaleDateString()}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-3 py-1 text-xs font-medium ${assessment.status === 'published' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                              {assessment.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Grade Distribution</h2>
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">View grade book</span>
                </div>
                <div className="h-64 min-h-64 min-w-0">
                  <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                    <BarChart data={gradeDistribution} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
                      <XAxis dataKey="range" tickLine={false} axisLine={false} fontSize={12} />
                      <YAxis tickLine={false} axisLine={false} fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                        {gradeDistribution.map((entry, index) => <Cell key={entry.range} fill={gradeColors[index % gradeColors.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </article>
            </section>

            <section id="lecture-uploads" className="scroll-mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <span id="grade-book" className="block scroll-mt-5" />
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Lecture Uploads and Grade Book</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Upload lecture materials and update grades without leaving the facilitator dashboard.</p>
                </div>
                <button onClick={() => fileInputRef.current?.click()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800">
                  <Upload className="h-4 w-4" />
                  Upload Lecture
                </button>
              </div>
              <input ref={fileInputRef} type="file" accept="video/*" onChange={handleLectureUpload} className="hidden" />
              <input
                value={lectureTitle}
                onChange={(event) => setLectureTitle(event.target.value)}
                placeholder="Optional lecture title before uploading"
                className="mb-4 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-400 dark:border-slate-800 dark:bg-slate-900"
              />
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-sm">
                  <thead>
                    <tr className="border-y border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-[0.08em] text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
                      <th className="px-4 py-3">Student</th>
                      <th className="px-4 py-3">Component</th>
                      <th className="px-4 py-3">Progress</th>
                      <th className="px-4 py-3">Prelim</th>
                      <th className="px-4 py-3">Midterm</th>
                      <th className="px-4 py-3">Final</th>
                      <th className="px-4 py-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scopedStudents.map((student) => {
                      const record = getGradeRecord(student);
                      return (
                        <tr key={student.id} className="border-b border-slate-100 dark:border-slate-800">
                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-900 dark:text-slate-100">{student.name}</p>
                            <p className="text-xs text-slate-500">{student.studentId || student.email}</p>
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{student.component}</td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{student.progress}%</td>
                          {(['prelim', 'midterm', 'final'] as const).map((field) => (
                            <td key={field} className="px-4 py-3">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={record?.[field] || 0}
                                onChange={(event) => updateGrade(student, field, Number(event.target.value))}
                                className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900"
                              />
                            </td>
                          ))}
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{record?.remarks || student.status}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {scopedStudents.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700">No approved students assigned yet.</p> : null}
              </div>
            </section>

            <section id="assessment-builder" className="scroll-mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <div className="mb-4 flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200">
                  <CheckCircle className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Assessment Builder</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Create assessments and answer keys for your assigned classes.</p>
                </div>
              </div>
              <AssessmentManager user={user} role="facilitator" />
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
