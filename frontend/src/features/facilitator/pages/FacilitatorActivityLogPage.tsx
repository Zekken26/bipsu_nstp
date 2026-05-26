import { useMemo, useState } from 'react';
import { loadAuditLog } from '../../../data/workflowData';
import type { FacilitatorWorkspace } from '../hooks/useFacilitatorWorkspace';
import { EmptyState, PageIntro, Panel, SearchField, StatusBadge } from '../components/FacilitatorUI';

export default function FacilitatorActivityLogPage({ workspace }: { workspace: FacilitatorWorkspace }) {
  const [search, setSearch] = useState('');
  const audit = useMemo(() => loadAuditLog().filter((row) => row.actorId === workspace.user.id).filter((row) => !search || `${row.action} ${row.detail} ${row.recordType}`.toLowerCase().includes(search.toLowerCase())), [workspace.user.id, workspace.activity, search]);
  return (
    <>
      <PageIntro eyebrow="Accountability" title="Facilitator Activity Log" description="A persistent trail of attendance, grading, notice, and record actions completed under your account." />
      <Panel>
        <div className="mb-4 max-w-md"><SearchField value={search} onChange={setSearch} placeholder="Search recorded actions" /></div>
        {audit.length ? <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-900"><tr><th className="px-4 py-3">Date / Time</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Record</th><th className="px-4 py-3">Detail</th></tr></thead><tbody>{audit.map((row) => <tr key={row.id} className="border-b border-slate-100 dark:border-slate-800"><td className="px-4 py-3">{new Date(row.at).toLocaleString()}</td><td className="px-4 py-3"><StatusBadge value={row.action} /></td><td className="px-4 py-3">{row.recordType}</td><td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.detail}</td></tr>)}</tbody></table></div> : <EmptyState title="No auditable actions yet" body="Saved attendance, gradebook updates, and notices will be listed here." />}
      </Panel>
    </>
  );
}
