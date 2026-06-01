import { type ReactNode, useEffect, useState } from 'react';
import {
  BarChart3,
  Bell,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  FileCheck2,
  GraduationCap,
  LayoutDashboard,
  Menu,
  MoonStar,
  SunMedium,
  Users,
  History,
} from 'lucide-react';
import CollapsibleRoleSidebar from '../../../components/layout/CollapsibleRoleSidebar';
import type { NstpAccount } from '../../../data/nstpData';
import type { FacilitatorPage } from '../types';

const PAGE_INFO: Record<FacilitatorPage, { title: string; description: string }> = {
  dashboard: { title: 'Dashboard', description: 'Operations overview and next actions' },
  students: { title: 'Assigned Students', description: 'Scoped roster and student details' },
  attendance: { title: 'Attendance Sheet', description: 'Record daily session participation' },
  gradebook: { title: 'Gradebook', description: 'Encode and track class performance' },
  assessments: { title: 'Assessments', description: 'Create, publish, and manage answer keys' },
  submissions: { title: 'Submission Review', description: 'Score outputs and provide feedback' },
  'learning-materials': { title: 'Learning Materials', description: 'Lecture links and instructional resources' },
  reports: { title: 'Reports', description: 'Class trends and completion visibility' },
  announcements: { title: 'Announcements', description: 'Notices for assigned student groups' },
  'activity-log': { title: 'Activity Log', description: 'Accountability trail for facilitator actions' },
};

const initials = (name: string) => name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();

export default function FacilitatorLayout({
  user,
  page,
  pendingCount,
  children,
  onNavigate,
  onLogout,
}: {
  user: NstpAccount;
  page: FacilitatorPage;
  pendingCount: number;
  children: ReactNode;
  onNavigate: (page: FacilitatorPage) => void;
  onLogout?: () => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('nstp-theme', dark ? 'dark' : 'light');
  }, [dark]);

  const nav = (label: string, icon: any, target: FacilitatorPage, badge?: number) => ({
    label,
    icon,
    active: page === target,
    badge: badge || undefined,
    onClick: () => onNavigate(target),
  });

  return (
    <div className="facilitator-portal min-h-screen bg-[#f5f8fc] text-slate-900 dark:bg-[#080f1f] dark:text-slate-100">
      <CollapsibleRoleSidebar
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        portalLabel="Facilitator Portal"
        closeLabel="Close facilitator navigation"
        avatarLabel={initials(user.name)}
        accountLabel="Facilitator"
        accountTitle={user.name}
        accountSubtitle={(user.municipalities || []).join(', ') || 'Unassigned municipality'}
        onLogout={onLogout}
        groups={[
          { label: 'Workspace', items: [nav('Dashboard', LayoutDashboard, 'dashboard'), nav('Assigned Students', Users, 'students', pendingCount)] },
          { label: 'Class Operations', items: [nav('Attendance Sheet', CalendarCheck, 'attendance'), nav('Gradebook', ClipboardList, 'gradebook'), nav('Assessments', GraduationCap, 'assessments'), nav('Submission Review', FileCheck2, 'submissions')] },
          { label: 'Resources', items: [nav('Learning Materials', BookOpen, 'learning-materials'), nav('Reports', BarChart3, 'reports'), nav('Announcements', Bell, 'announcements'), nav('Activity Log', History, 'activity-log')] },
        ]}
      />
      <div className="min-h-screen lg:pl-[76px]">
        <header className="sticky top-0 z-30 border-b border-[#e4ebf4] bg-white/90 px-4 py-2.5 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90 md:px-6">
          <div className="mx-auto flex max-w-[1540px] items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <button type="button" onClick={() => setMobileOpen(true)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 lg:hidden dark:border-slate-700" aria-label="Open facilitator navigation">
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <p className="text-[0.67rem] font-bold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">Facilitator / {PAGE_INFO[page].title}</p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{PAGE_INFO[page].description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden rounded-full bg-blue-50 px-3 py-1.5 text-[0.68rem] font-bold text-blue-700 dark:bg-blue-500/10 dark:text-blue-200 sm:block">
                {(user.municipalities || []).join(', ') || 'Scope pending'}
              </div>
              <button type="button" onClick={() => setDark((value) => !value)} className="grid h-10 w-10 place-items-center rounded-xl border border-[#dfe7f1] bg-white text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200" aria-label="Toggle color theme">
                {dark ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-[1540px] space-y-4 p-4 md:p-5 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
