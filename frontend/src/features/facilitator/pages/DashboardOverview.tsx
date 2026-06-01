import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  FilePlus2,
  GraduationCap,
  Link2,
  UserCheck,
  Users,
} from 'lucide-react';
import { EmptyState, PageIntro, Panel, StatCard, StatusBadge } from '../components/FacilitatorUI';
import type { FacilitatorPage } from '../types';
import type { FacilitatorWorkspace } from '../hooks/useFacilitatorWorkspace';

export default function DashboardOverview({
  workspace,
  onNavigate,
}: {
  workspace: FacilitatorWorkspace;
  onNavigate: (page: FacilitatorPage) => void;
}) {
  const { students, pending, attendance, assessments, detailedGrades, activity } = workspace;
  const nameParts = workspace.user.name.split(' ').filter(Boolean);
  const greetingName = /^(Dr\.|Prof\.)$/i.test(nameParts[0]) && nameParts.length > 1
    ? `${nameParts[0]} ${nameParts[nameParts.length - 1]}`
    : nameParts[0];
  const attendanceEntries = attendance.flatMap((session) => session.entries);
  const markedAttendance = attendanceEntries.filter((entry) => Boolean(entry.status)).length;
  const attendanceRate = attendanceEntries.length ? Math.round((markedAttendance / attendanceEntries.length) * 100) : 0;
  const publishedIds = assessments.filter((assessment) => assessment.status === 'published').map((assessment) => assessment.id);
  const submitted = students.reduce((total, student) => {
    const raw = localStorage.getItem(`assessments-${student.id}`);
    const attempts = raw ? Object.keys(JSON.parse(raw) as object) : [];
    return total + attempts.filter((assessmentId) => publishedIds.includes(assessmentId)).length;
  }, 0);
  const completeGrades = detailedGrades.filter((entry) => ['Submitted', 'Reviewed', 'Released'].includes(entry.status)).length;
  const gradingProgress = students.length ? Math.round((completeGrades / students.length) * 100) : 0;
  const upcoming = workspace.sessions
    .filter((session) => session.date >= new Date().toISOString().slice(0, 10) && session.status !== 'Cancelled')
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4);

  const actions = [
    { label: 'Record attendance', detail: 'Open today\'s sheet', icon: CalendarCheck, page: 'attendance' as const },
    { label: 'Open gradebook', detail: 'Update standing', icon: ClipboardList, page: 'gradebook' as const },
    { label: 'Create assessment', detail: 'Build a quiz', icon: FilePlus2, page: 'assessments' as const },
    { label: 'Add material link', detail: 'Share resource', icon: Link2, page: 'learning-materials' as const },
    { label: 'View reports', detail: 'Track outcomes', icon: BarChart3, page: 'reports' as const },
  ];

  return (
    <>
      <PageIntro
        eyebrow="Facilitator Workspace"
        title={`Welcome, ${greetingName}`}
        description={`Manage assigned NSTP learners in ${(workspace.user.municipalities || []).join(', ') || 'your assigned scope'}, monitor class work, and prepare each session from one organized portal.`}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard label="Assigned Students" value={students.length} detail="Current roster" icon={Users} tone="blue" />
        <StatCard label="Pending Enrollments" value={pending.length} detail="Awaiting processing" icon={UserCheck} tone="amber" />
        <StatCard label="Attendance Completion" value={`${attendanceRate}%`} detail={`${attendance.length} sessions recorded`} icon={CalendarCheck} tone="emerald" progress={attendanceRate} />
        <StatCard label="Assessments Created" value={assessments.length} detail="Owned assessments" icon={GraduationCap} tone="indigo" />
        <StatCard label="Submissions" value={submitted} detail="Recorded attempts" icon={BookOpen} tone="blue" />
        <StatCard label="Grading Progress" value={`${gradingProgress}%`} detail={`${completeGrades} completed records`} icon={ClipboardList} tone="emerald" progress={gradingProgress} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <Panel>
          <h2 className="text-lg font-bold text-slate-950 dark:text-white">Quick Actions</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Continue routine class operations without hunting through a dashboard.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {actions.map(({ label, detail, icon: Icon, page }) => (
              <button key={page} type="button" onClick={() => onNavigate(page)} className="group rounded-2xl border border-[#e6ecf4] bg-[#fbfcfe] p-4 text-left transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500/40 dark:hover:bg-blue-500/10">
                <Icon className="h-5 w-5 text-blue-700 dark:text-blue-300" />
                <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">{label}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{detail}</p>
                <ArrowRight className="mt-3 h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600" />
              </button>
            ))}
          </div>
        </Panel>
        <Panel>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-950 dark:text-white">Upcoming Sessions</h2>
            <button type="button" onClick={() => onNavigate('attendance')} className="text-sm font-semibold text-blue-700 dark:text-blue-300">Open sheet</button>
          </div>
          <div className="mt-4 space-y-3">
            {upcoming.length ? upcoming.map((session) => (
              <div key={session.id} className="rounded-xl border border-[#e6ecf4] bg-[#fbfcfe] p-3 transition hover:border-blue-200 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{session.title}</p>
                  <StatusBadge value={session.date === new Date().toISOString().slice(0, 10) ? 'Today' : 'Scheduled'} />
                </div>
                <p className="mt-1 text-xs text-slate-500">{new Date(`${session.date}T00:00:00`).toLocaleDateString()} / {session.component}</p>
              </div>
            )) : <EmptyState title="No sessions prepared" body="Create an attendance session to make upcoming class meetings visible here." />}
          </div>
        </Panel>
      </div>

      <Panel>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950 dark:text-white">Recent Activity</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Updates saved within your facilitator workspace.</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {activity.length ? activity.slice(0, 6).map((item) => (
            <div key={item.id} className="flex gap-3 rounded-xl border border-[#e6ecf4] bg-[#fbfcfe] p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600" />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.title}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{item.detail}</p>
                <p className="mt-2 text-xs text-slate-400">{new Date(item.at).toLocaleString()}</p>
              </div>
            </div>
          )) : <div className="md:col-span-2"><EmptyState title="No recorded activity yet" body="Attendance saves, grade updates, materials, and announcements will appear here." /></div>}
        </div>
      </Panel>
    </>
  );
}
