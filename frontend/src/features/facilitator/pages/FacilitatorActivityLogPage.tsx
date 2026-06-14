import { useEffect, useMemo, useState } from 'react';
import { loadAuditLog } from '../../../data/workflowData';
import type { FacilitatorWorkspace } from '../hooks/useFacilitatorWorkspace';
import { EmptyState, PageIntro, Pager, Panel, SearchField, StatusBadge } from '../components/FacilitatorUI';
import ExportButtonGroup from '../../../components/common/ExportButtonGroup';
import { exportRows, type ExportFormat } from '../../../utils/exportRecords';

export default function FacilitatorActivityLogPage({ workspace }: { workspace: FacilitatorWorkspace }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const audit = useMemo(() => loadAuditLog().filter((row) => row.actorId === workspace.user.id).filter((row) => !search || `${row.action} ${row.detail} ${row.recordType}`.toLowerCase().includes(search.toLowerCase())), [workspace.user.id, workspace.activity, search]);
  useEffect(() => setPage(1), [search, pageSize]);
  const displayed = audit.slice((page - 1) * pageSize, page * pageSize);
  const exportActivity = async (format: ExportFormat) => {
    if (!audit.length) return;
    await exportRows(format, audit, [
      { header: 'Date / Time', value: (row) => new Date(row.at).toLocaleString(), width: 22 },
      { header: 'Action', value: 'action', width: 26 },
      { header: 'Record Type', value: 'recordType', width: 18 },
      { header: 'Record ID', value: 'recordId', width: 24 },
      { header: 'Detail', value: 'detail', width: 42 },
    ], {
      title: 'Facilitator Activity Log',
      dataType: 'AuditLogs',
      scope: workspace.activeMunicipality,
      generatedBy: workspace.user.name,
      filters: { Search: search || 'All', Component: workspace.user.component || 'All' },
      signatureLines: ['Prepared by', 'Reviewed by'],
    });
  };
  return (
    <>
      <PageIntro eyebrow="Accountability" title="Facilitator Activity Log" description="A persistent trail of attendance, grading, notice, and record actions completed under your account." />
      <Panel>
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div className="max-w-md flex-1"><SearchField value={search} onChange={setSearch} placeholder="Search recorded actions" /></div><ExportButtonGroup compact label="Export activity" onExport={exportActivity} disabled={!audit.length} /></div>
        {audit.length ? <><div className="max-h-[650px] overflow-auto rounded-xl border border-[#edf1f6]"><table className="w-full min-w-[760px] text-sm"><thead className="sticky top-0 z-10 bg-[#f7f9fc] text-left text-xs uppercase text-slate-500 dark:bg-slate-900"><tr><th className="px-4 py-3">Date / Time</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Record</th><th className="px-4 py-3">Detail</th></tr></thead><tbody>{displayed.map((row) => <tr key={row.id} className="border-b border-slate-100 transition hover:bg-blue-50/35 dark:border-slate-800 dark:hover:bg-slate-900"><td className="px-4 py-3">{new Date(row.at).toLocaleString()}</td><td className="px-4 py-3"><StatusBadge value={row.action} /></td><td className="px-4 py-3">{row.recordType}</td><td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.detail}</td></tr>)}</tbody></table></div><Pager page={page} totalPages={Math.ceil(audit.length / pageSize)} onPage={setPage} total={audit.length} pageSize={pageSize} onPageSize={setPageSize} pageSizeOptions={[10, 25, 50, 100]} /></> : <EmptyState title="No auditable actions yet" body="Saved attendance, gradebook updates, and notices will be listed here." />}
      </Panel>
    </>
  );
}
