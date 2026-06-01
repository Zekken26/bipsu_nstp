import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Award, Bell, BookOpen, CalendarCheck, ClipboardList, GraduationCap, LayoutDashboard, Lock, Menu, MoonStar, SunMedium, TrendingUp } from 'lucide-react';
import { Toaster } from 'sonner';
import CollapsibleRoleSidebar from '../../../components/layout/CollapsibleRoleSidebar';
import AssessmentsPage from '../../../pages/AssessmentsPage';
import { loadAssessments, loadModules, loadStudents, safeJsonParse, type NstpAccount, type NstpAssessment, type NstpComponent, type NstpModule } from '../../../data/nstpData';
import { commonPhaseProgress, finalGrade, loadDetailedGrades, loadSessions, studentAttendance, workflowNoticesForStudent } from '../../../data/workflowData';
import { EmptyState, PageIntro, Pager, Panel, StatCard, StatusBadge } from '../../facilitator/components/FacilitatorUI';
import StudentLearningMaterialsPage from './StudentLearningMaterialsPage';
import CwtsAssessmentWorkspace from '../../cwts/components/CwtsAssessmentWorkspace';

type StudentPage = 'dashboard' | 'common-phase' | 'attendance' | 'grades' | 'assessments' | 'materials' | 'announcements' | 'enrollment';
const pages: StudentPage[] = ['dashboard', 'common-phase', 'attendance', 'grades', 'assessments', 'materials', 'announcements', 'enrollment'];
const pathFor = (page: StudentPage) => `/student/${page}`;
const pageFromPath = () => {
  const page = window.location.pathname.replace(/^\/student\/?/, '').split('/')[0] as StudentPage;
  return pages.includes(page) ? page : 'dashboard';
};

function Tile({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">{children}</div>;
}

const componentFromUser = (user: NstpAccount): NstpComponent | undefined => {
  if (user.component) return user.component;
  if (user.demoStage === 'cwts') return 'CWTS';
  if (user.demoStage === 'lts') return 'LTS';
  if (user.demoStage === 'mts') return 'MTS (Army)';
  return undefined;
};

const studentCanAccessAssessment = (assessment: NstpAssessment, modules: NstpModule[], user: NstpAccount) => {
  const component = componentFromUser(user);
  const classified = user.commonPhaseStatus === 'approved' || Boolean(component);
  const audience = (assessment as any).component || (assessment as any).phase || modules.find((module) => module.id === assessment.moduleId)?.component || 'Common';

  if (!classified) return audience === 'Common' || audience === 'Common Phase';
  if (audience === 'Common' || audience === 'Common Phase') return true;
  if (audience === 'MTS') return component?.startsWith('MTS');
  return audience === component;
};

export default function StudentPortal({ user, onLogout }: { user: NstpAccount; onLogout: () => void }) {
  const [page, setPage] = useState<StudentPage>(pageFromPath);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [noticeFilter, setNoticeFilter] = useState<'All' | 'Common' | 'Component' | 'Urgent'>('All');
  const [attendancePage, setAttendancePage] = useState(1);
  const [attendancePageSize, setAttendancePageSize] = useState(10);
  useEffect(() => {
    if (!window.location.pathname.startsWith('/student/')) window.history.replaceState({}, '', pathFor('dashboard'));
    const pop = () => setPage(pageFromPath());
    window.addEventListener('popstate', pop);
    return () => window.removeEventListener('popstate', pop);
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('nstp-theme', dark ? 'dark' : 'light');
  }, [dark]);

  const navigate = (target: StudentPage) => {
    setPage(target);
    window.history.pushState({}, '', pathFor(target));
    window.scrollTo({ top: 0 });
  };
  const student = loadStudents().find((row) => row.id === user.id || row.email.toLowerCase() === user.email.toLowerCase());
  const studentId = student?.id || user.id;
  const attendance = studentAttendance(studentId).sort((a, b) => b.sheet.date.localeCompare(a.sheet.date));
  const displayedAttendance = attendance.slice((attendancePage - 1) * attendancePageSize, attendancePage * attendancePageSize);
  const common = commonPhaseProgress(studentId);
  const classified = user.commonPhaseStatus === 'approved' || user.demoStage !== 'common' && Boolean(user.component);
  const completedHours = classified ? 25 : common.completedHours;
  const remainingHours = Math.max(0, 25 - completedHours);
  const eligibility = classified ? 'Approved' : common.status;
  const grade = loadDetailedGrades().find((row) => row.studentId === studentId);
  const assessmentModules = loadModules();
  const publishedAssessments = loadAssessments().filter((item) => item.status === 'published' && studentCanAccessAssessment(item, assessmentModules, user));
  const attempts = safeJsonParse<Record<string, { score?: number; date?: string }>>(localStorage.getItem(`assessments-${studentId}`), {});
  const notices = workflowNoticesForStudent(studentId);
  const visibleNotices = notices.filter((notice) => noticeFilter === 'All' || (noticeFilter === 'Urgent' ? notice.priority === 'Urgent' : noticeFilter === 'Common' ? notice.component === 'Common' : notice.component !== 'Common'));
  const allSessions = loadSessions();
  const sessions = allSessions.filter((session) => session.phase === 'Common Phase' || classified && session.component === user.component);
  const attendancePercent = attendance.length ? Math.round((attendance.filter(({ entry }) => entry?.status !== 'absent').length / attendance.length) * 100) : 0;
  const completedAssessments = Object.keys(attempts).length;
  const openAssessmentWorkspace = () => navigate('assessments');

  const body = useMemo(() => {
    if (page === 'dashboard') return (
      <>
        <PageIntro eyebrow={classified ? `${user.component} Student Workspace` : 'Common Phase Journey'} title={`Welcome, ${user.name.split(' ')[0]}`} description={classified ? `Your Common Phase eligibility is approved. Continue your ${user.component} sessions and released academic records.` : 'Complete the flexible 25 contact-hour Common Phase before component classification.'} />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <StatCard label="Enrollment Status" value={classified ? 'Classified' : 'In Progress'} detail={classified ? user.component || '' : 'Common Phase'} icon={GraduationCap} tone="blue" />
          <StatCard label="Contact Hours" value={`${completedHours}/25`} detail={`${remainingHours} hours remaining`} icon={TrendingUp} tone="indigo" />
          <StatCard label="Attendance" value={`${attendancePercent}%`} detail={`${attendance.length} recorded sessions`} icon={CalendarCheck} tone="emerald" />
          <StatCard label="Assessments" value={`${completedAssessments}/${publishedAssessments.length}`} detail="Recorded completions" icon={ClipboardList} tone="amber" />
          <StatCard label="Grade Status" value={grade?.status || 'Draft'} detail={grade?.status === 'Released' ? 'Visible for review' : 'Not yet released'} icon={Award} tone="blue" />
          <StatCard label="Notices" value={notices.length} detail="Published for you" icon={Bell} tone="slate" />
        </div>
        <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
          <Panel>
            <h2 className="text-lg font-bold">Quick Actions</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                ['Continue Common Phase', 'common-phase' as const, BookOpen, 'Review contact-hour progress'],
                ['Take Assessment', 'assessments' as const, ClipboardList, `${publishedAssessments.length} available`],
                ['View Attendance', 'attendance' as const, CalendarCheck, `${attendance.length} records`],
                ['View Grades', 'grades' as const, Award, grade?.status || 'Not released'],
                ['View Announcements', 'announcements' as const, Bell, `${notices.length} notices`],
              ].map(([label, target, Icon, detail]) => (
                <button
                  key={String(target)}
                  type="button"
                  onClick={() => target === 'assessments' ? openAssessmentWorkspace() : navigate(target as StudentPage)}
                  className={`interactive-card flex min-h-[5rem] items-center gap-3 rounded-xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/70 dark:border-slate-800 ${target === 'assessments' ? 'border-blue-200 bg-blue-50/70 shadow-sm ring-1 ring-blue-100 hover:border-blue-500 hover:bg-blue-100 dark:border-blue-500/30 dark:bg-blue-500/10 dark:ring-blue-500/20' : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50 dark:bg-slate-950 dark:hover:bg-blue-500/10'}`}
                >
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${target === 'assessments' ? 'bg-blue-700 text-white' : 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200'}`}><Icon className="h-5 w-5" /></span>
                  <span className="min-w-0">
                    <span className="block font-bold text-slate-950 dark:text-white">{label as string}</span>
                    <span className="mt-0.5 block text-xs font-semibold text-slate-500 dark:text-slate-400">{detail as string}</span>
                  </span>
                </button>
              ))}
            </div>
          </Panel>
          <Panel>
            <h2 className="text-lg font-bold">Classification Eligibility</h2>
            <div className="mt-3 flex items-center gap-2"><StatusBadge value={eligibility} /></div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-blue-700" style={{ width: `${Math.min(100, completedHours / 25 * 100)}%` }} /></div>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{classified ? `Approved for ${user.component} Component Proper.` : `${completedHours} of 25 contact hours completed. ${remainingHours} hours remain before classification review.`}</p>
          </Panel>
        </div>
      </>
    );
    if (page === 'common-phase') return (
      <>
        <PageIntro eyebrow="NSTP Pathway" title="Common Phase Progress" description="Progress is accumulated from attended orientations, seminars, workshops, activities, and assessments, rather than fixed modules." />
        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-3xl font-bold text-blue-800 dark:text-blue-200">{completedHours} / 25 contact hours completed</p><p className="mt-1 text-sm text-slate-500">{remainingHours ? `${remainingHours} hours remaining before component classification.` : 'Contact-hour requirement completed.'}</p></div><StatusBadge value={eligibility} /></div>
          <div className="mt-5 h-4 rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-blue-700 to-emerald-500" style={{ width: `${Math.min(100, completedHours / 25 * 100)}%` }} /></div>
        </Panel>
        <div className="grid gap-4 lg:grid-cols-2">{sessions.filter((session) => session.phase === 'Common Phase').map((session) => {
          const record = attendance.find(({ sheet }) => sheet.sessionId === session.id);
          return <Tile key={session.id}><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase text-blue-700">{session.type} / Session {session.sessionNumber}</p><h3 className="mt-1 font-bold">{session.title}</h3></div><StatusBadge value={session.status} /></div><p className="mt-3 text-sm text-slate-500">{new Date(`${session.date}T00:00:00`).toLocaleDateString()} / {session.startTime}-{session.endTime} / {session.duration} contact hours</p><p className="mt-2 text-sm">{session.venue}</p><div className="mt-3 flex items-center gap-2"><span className="text-xs font-semibold text-slate-500">Attendance</span><StatusBadge value={record?.entry?.status || 'Not recorded'} /></div></Tile>;
        })}</div>
      </>
    );
    if (page === 'attendance') return (
      <>
        <PageIntro eyebrow="Attendance Records" title="My Attendance" description="Date-based permanent session attendance recorded by your assigned facilitator." />
        <div className="grid gap-4 sm:grid-cols-3"><StatCard label="Attendance Rate" value={`${attendancePercent}%`} detail="Credited attendance" icon={CalendarCheck} tone="emerald" /><StatCard label="Recorded Sessions" value={attendance.length} detail="Historical sheets" icon={ClipboardList} tone="blue" /><StatCard label="Absences" value={attendance.filter(({ entry }) => entry?.status === 'absent').length} detail="For review" icon={Lock} tone="rose" /></div>
        <Panel>{attendance.length ? <><div className="overflow-x-auto"><table className="w-full min-w-[780px] text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-900"><tr><th className="p-3">Date</th><th className="p-3">Session / Topic</th><th className="p-3">Status</th><th className="p-3">Remarks</th><th className="p-3">Facilitator</th></tr></thead><tbody>{displayedAttendance.map(({ sheet, entry }) => <tr key={sheet.id} className="border-b dark:border-slate-800"><td className="p-3">{new Date(`${sheet.date}T00:00:00`).toLocaleDateString()}</td><td className="p-3 font-semibold">{sheet.topic}</td><td className="p-3"><StatusBadge value={entry!.status} /></td><td className="p-3">{entry!.remarks || '--'}</td><td className="p-3">{sheet.facilitatorName}</td></tr>)}</tbody></table></div><Pager page={attendancePage} totalPages={Math.ceil(attendance.length / attendancePageSize)} onPage={setAttendancePage} total={attendance.length} pageSize={attendancePageSize} onPageSize={(size) => { setAttendancePageSize(size); setAttendancePage(1); }} pageSizeOptions={[10, 25, 50]} /></> : <EmptyState title="No attendance history" body="Recorded attendance sheets will appear here by date." />}</Panel>
      </>
    );
    if (page === 'grades') return (
      <>
        <PageIntro eyebrow="Academic Records" title="My Grades" description="Only grades released through the review workflow become visible to students." />
        {!grade || grade.status !== 'Released' ? <Panel><EmptyState title="Grades not released yet" body={`Your current gradebook status is ${grade?.status || 'Draft'}. Records will display after review and release.`} /></Panel> : <Panel><div className="grid gap-3 sm:grid-cols-3">{[['Assessments', grade.assessments], ['Attendance', grade.attendance], ['Activities', grade.activities], ['Participation', grade.participation], ['Major Exam', grade.majorExam], ['Final Grade', finalGrade(grade)]].map(([label, value]) => <Tile key={String(label)}><p className="text-xs font-semibold uppercase text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold">{String(value ?? '--')}</p></Tile>)}</div><p className="mt-5 rounded-xl bg-blue-50 p-4 text-sm text-blue-900 dark:bg-blue-500/10 dark:text-blue-100">{grade.feedback || 'No facilitator feedback recorded.'}</p></Panel>}
      </>
    );
    if (page === 'assessments') {
      const isCwtsStudent = componentFromUser(user) === 'CWTS' || student?.component === 'CWTS';
      return isCwtsStudent
        ? <CwtsAssessmentWorkspace role="student" user={user} studentId={studentId} title="My CWTS Activities" description="Complete CWTS 1 and CWTS 2 reflections, journals, reports, videos, community immersion outputs, and performance tasks." />
        : <AssessmentsPage user={user} studentId={studentId} onBack={() => navigate('dashboard')} />;
    }
    if (page === 'materials') return <StudentLearningMaterialsPage user={user} studentId={studentId} />;
    if (page === 'announcements') return (
      <>
        <PageIntro eyebrow="Communications" title="Announcements" description="General, Common Phase, and component notices issued for your assigned class." actions={<select value={noticeFilter} onChange={(event) => setNoticeFilter(event.target.value as typeof noticeFilter)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"><option>All</option><option>Common</option><option>Component</option><option>Urgent</option></select>} />
        <div className="space-y-3">{visibleNotices.length ? visibleNotices.map((notice) => <Panel key={notice.id}><div className="flex items-center gap-2"><h3 className="font-bold">{notice.title}</h3><StatusBadge value={notice.priority} /><StatusBadge value={notice.component} /></div><p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{notice.message}</p><p className="mt-3 text-xs text-slate-400">{notice.actorName} / {new Date(notice.createdAt).toLocaleDateString()}</p></Panel>) : <Panel><EmptyState title="No announcements" body="No published notices match this audience filter." /></Panel>}</div>
      </>
    );
    return (
      <>
        <PageIntro eyebrow="Enrollment and Classification" title="NSTP Status" description="Your verified pathway from Common Phase completion to component assignment." />
        <Panel><div className="grid gap-4 md:grid-cols-3"><Tile><p className="text-xs uppercase text-slate-500">Verification</p><p className="mt-2 font-bold">{classified ? 'Approved' : 'In Progress'}</p></Tile><Tile><p className="text-xs uppercase text-slate-500">Common Phase</p><p className="mt-2 font-bold">{completedHours}/25 hours</p></Tile><Tile><p className="text-xs uppercase text-slate-500">Component</p><p className="mt-2 font-bold">{classified ? user.component : 'Not yet assigned'}</p></Tile></div><p className="mt-5 rounded-xl bg-blue-50 p-4 text-sm text-blue-900 dark:bg-blue-500/10 dark:text-blue-100">{classified ? `You are approved and enrolled in ${user.component}. Component Proper resources are enabled.` : 'Complete the required contact hours, attendance, and assessed outputs. Classification remains disabled until approved.'}</p></Panel>
      </>
    );
  }, [page, user, studentId, attendance, displayedAttendance, attendancePage, attendancePageSize, common, classified, completedHours, remainingHours, eligibility, grade, publishedAssessments, attempts, notices, visibleNotices, sessions, attendancePercent, completedAssessments, noticeFilter]);

  const nav = (label: string, icon: any, target: StudentPage) => ({ label, icon, active: target === page, onClick: () => navigate(target) });
  return (
    <div className="min-h-dvh bg-[#f4f7fc] text-slate-900 dark:bg-[#080f1f] dark:text-slate-100">
      <CollapsibleRoleSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} portalLabel="Student Portal" closeLabel="Close student navigation" avatarLabel={user.name.slice(0, 2).toUpperCase()} accountLabel="Student" accountTitle={user.name} accountSubtitle={classified ? user.component : 'Common Phase'} onLogout={() => { window.history.replaceState({}, '', '/'); onLogout(); }} groups={[
        { label: 'Journey', items: [nav('Dashboard', LayoutDashboard, 'dashboard'), nav('Common Phase', TrendingUp, 'common-phase'), nav('Enrollment Status', GraduationCap, 'enrollment')] },
        { label: 'Records', items: [nav('My Attendance', CalendarCheck, 'attendance'), nav('My Grades', Award, 'grades'), nav('My Assessments', ClipboardList, 'assessments')] },
        { label: 'Resources', items: [nav('Learning Materials', BookOpen, 'materials'), nav('Announcements', Bell, 'announcements')] },
      ]} />
      <div className="lg:pl-[76px]"><header className="sticky top-0 z-30 flex items-center justify-between border-b bg-white/90 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 md:px-7"><button type="button" onClick={() => setMobileOpen(true)} className="rounded-xl border p-2 lg:hidden" aria-label="Open student navigation"><Menu className="h-5 w-5" /></button><p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">Student / {page.replace('-', ' ')}</p><button type="button" onClick={() => setDark((value) => !value)} className="rounded-xl border p-2" aria-label="Toggle color theme">{dark ? <SunMedium className="h-5 w-5" /> : <MoonStar className="h-5 w-5" />}</button></header><main className="mx-auto max-w-[1450px] space-y-5 p-4 md:p-7">{body}</main></div>
      <Toaster position="top-right" richColors />
    </div>
  );
}
