import { useMemo, useState } from 'react';
import { Bell, Send } from 'lucide-react';
import { NSTP_COMPONENTS, safeJsonParse } from '../../../data/nstpData';
import { addAudit, loadWorkflowNotices, saveWorkflowNotices, type WorkflowNotice } from '../../../data/workflowData';
import type { FacilitatorWorkspace } from '../hooks/useFacilitatorWorkspace';
import { EmptyState, PageIntro, Panel, SearchField, StatusBadge } from '../components/FacilitatorUI';

type SystemNotice = {
  id: string;
  title: string;
  message: string;
  audience: 'all' | 'student' | 'admin' | 'facilitator';
  priority: 'normal' | 'high';
  createdBy: string;
  createdAt: string;
};

export default function FacilitatorAnnouncementsPage({ workspace, notify }: { workspace: FacilitatorWorkspace; notify: (message: string) => void }) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<WorkflowNotice['priority']>('Normal');
  const [municipality, setMunicipality] = useState<WorkflowNotice['municipality']>('All');
  const [component, setComponent] = useState<WorkflowNotice['component']>('All');
  const [search, setSearch] = useState('');
  const [posts, setPosts] = useState(() => loadWorkflowNotices().filter((notice) => notice.actorId === workspace.user.id));
  const systemNotices = safeJsonParse<SystemNotice[]>(localStorage.getItem('nstp-system-notices'), [])
    .filter((notice) => notice.audience === 'all' || notice.audience === 'facilitator');

  const visiblePosts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return posts.filter((notice) => !query || `${notice.title} ${notice.message}`.toLowerCase().includes(query));
  }, [posts, search]);

  const publish = () => {
    if (!title.trim() || !message.trim()) {
      notify('Enter an announcement title and message before posting.');
      return;
    }
    const notice: WorkflowNotice = {
      id: `fac-notice-${Date.now()}`,
      actorId: workspace.user.id,
      actorName: workspace.user.name,
      audience: 'student',
      title: title.trim(),
      message: message.trim(),
      priority,
      municipality,
      component,
      status: 'Published',
      createdAt: new Date().toISOString(),
    };
    saveWorkflowNotices([notice, ...loadWorkflowNotices()]);
    setPosts([notice, ...posts]);
    workspace.recordActivity('Announcement posted', `${notice.title} / ${notice.municipality} / ${notice.component}`);
    addAudit(workspace.user, 'Announcement published', 'Notice', notice.id, `Published for ${notice.municipality} / ${notice.component}.`);
    setTitle('');
    setMessage('');
    setPriority('Normal');
    notify('Announcement published to the assigned student audience.');
  };

  return (
    <>
      <PageIntro
        eyebrow="Communications"
        title="Announcements and Notices"
        description="Review program announcements and prepare notices addressed only to student groups within your facilitator assignment."
      />
      <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
        <Panel className="h-fit">
          <h2 className="text-lg font-bold text-slate-950 dark:text-white">Post to Assigned Students</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Published notices appear in the student portal only for the selected assigned audience.</p>
          <div className="mt-5 space-y-3">
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Announcement title" className="w-full rounded-xl border border-[#dfe7f1] bg-[#fbfcfe] px-3 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900" />
            <textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={4} placeholder="Message for assigned students" className="w-full rounded-xl border border-[#dfe7f1] bg-[#fbfcfe] px-3 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900" />
            <div className="grid gap-3 sm:grid-cols-2">
              <select value={municipality} onChange={(event) => setMunicipality(event.target.value as WorkflowNotice['municipality'])} className="rounded-xl border border-[#dfe7f1] bg-[#fbfcfe] px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900">
                <option value="All">All assigned</option>
                {(workspace.user.municipalities || []).map((value) => <option key={value}>{value}</option>)}
              </select>
              <select value={component} onChange={(event) => setComponent(event.target.value as WorkflowNotice['component'])} className="rounded-xl border border-[#dfe7f1] bg-[#fbfcfe] px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900">
                <option value="All">All stages</option>
                {['Common', ...NSTP_COMPONENTS].map((value) => <option key={value}>{value}</option>)}
              </select>
            </div>
            <select value={priority} onChange={(event) => setPriority(event.target.value as WorkflowNotice['priority'])} className="w-full rounded-xl border border-[#dfe7f1] bg-[#fbfcfe] px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900">
              <option value="Normal">Normal priority</option>
              <option value="Urgent">Urgent priority</option>
            </select>
            <button type="button" onClick={publish} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800"><Send className="h-4 w-4" /> Post announcement</button>
          </div>
        </Panel>
        <div className="space-y-5">
          <Panel>
            <h2 className="inline-flex items-center gap-2 text-lg font-bold text-slate-950 dark:text-white"><Bell className="h-5 w-5 text-blue-700" /> Program Notices</h2>
            <div className="mt-4 space-y-3">
              {systemNotices.length ? systemNotices.map((notice) => (
                <article key={notice.id} className="rounded-xl border border-[#e6ecf4] bg-[#fbfcfe] p-4 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-slate-900 dark:text-white">{notice.title}</h3><StatusBadge value={notice.priority} /></div>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{notice.message}</p>
                  <p className="mt-2 text-xs text-slate-400">{notice.createdBy} / {new Date(notice.createdAt).toLocaleString()}</p>
                </article>
              )) : <EmptyState title="No program notices" body="Official notices addressed to facilitators will show here." />}
            </div>
          </Panel>
          <Panel>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-bold text-slate-950 dark:text-white">Your Student Notices</h2>
              <div className="w-full sm:w-64"><SearchField value={search} onChange={setSearch} placeholder="Search notices" /></div>
            </div>
            {visiblePosts.length ? (
              <div className="space-y-3">
                {visiblePosts.map((notice) => (
                  <article key={notice.id} className="rounded-xl border border-[#e6ecf4] bg-[#fbfcfe] p-4 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-slate-900 dark:text-white">{notice.title}</h3><StatusBadge value={notice.priority} /></div>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{notice.message}</p>
                    <p className="mt-3 text-xs font-semibold text-blue-700 dark:text-blue-300">Audience: {notice.municipality} / {notice.component}</p>
                  </article>
                ))}
              </div>
            ) : <EmptyState title="No scoped student notices" body="Create an announcement to communicate with assigned learners." />}
          </Panel>
        </div>
      </div>
    </>
  );
}
