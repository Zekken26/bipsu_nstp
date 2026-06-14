import { useEffect, useMemo, useState } from 'react';
import { ArrowDownUp, Eye, Save, UserRound, X } from 'lucide-react';
import { addAudit, commonPhaseProgress, studentAttendance, type InterventionNote } from '../../../data/workflowData';
import { NSTP_COMPONENTS } from '../../../data/nstpData';
import type { FacilitatorWorkspace } from '../hooks/useFacilitatorWorkspace';
import { EmptyState, PageIntro, Pager, Panel, SearchField, StatusBadge, useModalEscape } from '../components/FacilitatorUI';
import ExportButtonGroup from '../../../components/common/ExportButtonGroup';
import { exportRows, type ExportColumn, type ExportFormat } from '../../../utils/exportRecords';

export default function AssignedStudentsPage({ workspace, notify }: { workspace: FacilitatorWorkspace; notify: (message: string) => void }) {
  const [search, setSearch] = useState('');
  const [component, setComponent] = useState('all');
  const [status, setStatus] = useState('all');
  const [sortAscending, setSortAscending] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [noteCategory, setNoteCategory] = useState<InterventionNote['category']>('Follow-up');
  const latestSession = [...workspace.attendance].sort((a, b) => b.date.localeCompare(a.date))[0];

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...workspace.students]
      .filter((student) => component === 'all' || student.component === component)
      .filter((student) => status === 'all' || student.status === status)
      .filter((student) => !query || [student.name, student.studentId, student.municipality, student.component].some((value) => String(value || '').toLowerCase().includes(query)))
      .sort((a, b) => sortAscending ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
  }, [workspace.students, search, component, status, sortAscending]);

  useEffect(() => setPage(1), [search, component, status, pageSize]);

  const displayed = filtered.slice((page - 1) * pageSize, page * pageSize);
  const selected = workspace.students.find((student) => student.id === selectedId);
  useModalEscape({
    open: Boolean(selected),
    onClose: () => setSelectedId(null),
    confirmClose: () => !noteText.trim() || window.confirm('Discard the unsaved intervention note and close this profile?'),
  });
  const gradeFor = (studentId: string) => workspace.detailedGrades.find((entry) => entry.studentId === studentId)?.status || 'Draft';
  const attendanceFor = (studentId: string) => latestSession?.entries.find((entry) => entry.studentId === studentId)?.status || 'Not recorded';
  const metricsFor = (studentId: string) => {
    const attendance = studentAttendance(studentId);
    const present = attendance.filter(({ entry }) => entry?.status === 'present' || entry?.status === 'late' || entry?.status === 'excused').length;
    const percentage = attendance.length ? Math.round((present / attendance.length) * 100) : 0;
    const missed = attendance.filter(({ entry }) => entry?.status === 'absent').length;
    const progress = commonPhaseProgress(studentId);
    const risk = percentage < 80 || missed > 1 ? 'At Risk' : progress.status === 'Near Completion' ? 'Monitor' : 'On Track';
    return { percentage, missed, progress, risk };
  };
  const saveNote = () => {
    if (!selected || !noteText.trim()) {
      notify('Write an intervention note before saving.');
      return;
    }
    const note: InterventionNote = {
      id: `note-${Date.now()}`,
      studentId: selected.id,
      facilitatorId: workspace.user.id,
      note: noteText.trim(),
      category: noteCategory,
      createdAt: new Date().toISOString(),
      private: true,
    };
    workspace.setNotes([note, ...workspace.notes]);
    workspace.recordActivity('Intervention note saved', `${selected.name} / ${note.category}`);
    addAudit(workspace.user, 'Intervention note saved', 'Student', selected.id, `${note.category} private note recorded.`);
    setNoteText('');
    notify('Private facilitator note saved.');
  };

  const exportStudents = async (format: ExportFormat, rows = filtered, scope = 'Filtered') => {
    if (!rows.length) {
      notify('No assigned students match the current export filters.');
      return;
    }
    const columns: ExportColumn<typeof rows[number]>[] = [
      { header: 'Student Name', value: 'name', width: 28 },
      { header: 'Student ID', value: (student) => student.studentId || student.id, width: 18 },
      { header: 'Email', value: 'email', width: 30 },
      { header: 'Municipality', value: (student) => student.municipality || '', width: 18 },
      { header: 'Component', value: 'component', width: 18 },
      { header: 'Program / Section', value: (student) => student.programSection || student.degreeProgram || '', width: 24 },
      { header: 'Enrollment Status', value: 'status', width: 16 },
      { header: 'Latest Attendance', value: (student) => attendanceFor(student.id), width: 18 },
      { header: 'Attendance Rate', value: (student) => `${metricsFor(student.id).percentage}%`, width: 16 },
      { header: 'Missed Sessions', value: (student) => metricsFor(student.id).missed, width: 16 },
      { header: 'Grade Status', value: (student) => gradeFor(student.id), width: 16 },
      { header: 'Eligibility', value: (student) => metricsFor(student.id).progress.status, width: 28 },
      { header: 'Risk', value: (student) => metricsFor(student.id).risk, width: 14 },
    ];
    await exportRows(format, rows, columns, {
      title: 'Assigned Student Records',
      dataType: 'StudentRecords',
      scope,
      generatedBy: workspace.user.name,
      filters: { Municipality: workspace.activeMunicipality, Component: component, Status: status, Search: search || 'All' },
      signatureLines: ['Prepared by', 'Reviewed by'],
    });
    addAudit(workspace.user, 'Assigned students exported', 'Student Export', scope, `${rows.length} rows exported as ${format.toUpperCase()}.`);
    notify(`Assigned student ${format.toUpperCase()} export generated.`);
  };

  return (
    <>
      <PageIntro
        eyebrow="Class Roster"
        title="Assigned Students"
        description="Only students from your assigned municipality scope are listed here. Review enrollment, participation, and grade readiness in one roster."
      />
      <Panel>
        <div className="mb-5 flex flex-col gap-3 lg:flex-row">
          <SearchField value={search} onChange={setSearch} placeholder="Search student, ID, municipality, or component" />
          <select value={component} onChange={(event) => setComponent(event.target.value)} className="rounded-xl border border-[#dfe7f1] bg-[#fbfcfe] px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900">
            <option value="all">All components</option>
            {NSTP_COMPONENTS.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl border border-[#dfe7f1] bg-[#fbfcfe] px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900">
            <option value="all">All enrollment states</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="graduated">Completed</option>
          </select>
          <button type="button" onClick={() => setSortAscending((value) => !value)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#dfe7f1] bg-white px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
            <ArrowDownUp className="h-4 w-4" />
            {sortAscending ? 'A-Z' : 'Z-A'}
          </button>
          <ExportButtonGroup compact label="Export assigned students" onExport={(format) => exportStudents(format, filtered, 'Filtered')} disabled={!filtered.length} />
        </div>
        {displayed.length ? (
          <>
          <div className="max-h-[650px] overflow-auto rounded-xl border border-[#edf1f6]">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className="sticky top-0 z-10 bg-[#f7f9fc] text-xs uppercase tracking-[0.12em] text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                <tr>
                  {['Student name', 'Student ID', 'Municipality', 'NSTP stage', 'Enrollment', 'Attendance', 'Grade status', 'Risk', ''].map((header) => <th key={header} className="px-4 py-3 font-semibold">{header}</th>)}
                </tr>
              </thead>
              <tbody>
                {displayed.map((student) => {
                  const metrics = metricsFor(student.id);
                  return <tr key={student.id} className="border-b border-slate-100 transition hover:bg-blue-50/35 dark:border-slate-800 dark:hover:bg-slate-900">
                    <td className="px-4 py-4 font-semibold text-slate-900 dark:text-white">{student.name}</td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{student.studentId || '--'}</td>
                    <td className="px-4 py-4">{student.municipality || '--'}</td>
                    <td className="px-4 py-4">{student.component}</td>
                    <td className="px-4 py-4"><StatusBadge value={student.status} /></td>
                    <td className="px-4 py-4"><StatusBadge value={attendanceFor(student.id)} /><p className="mt-1 text-xs text-slate-500">{metrics.percentage}% / {metrics.missed} missed</p></td>
                    <td className="px-4 py-4"><StatusBadge value={gradeFor(student.id)} /></td>
                    <td className="px-4 py-4"><StatusBadge value={metrics.risk} /></td>
                    <td className="px-4 py-4">
                      <button type="button" onClick={() => setSelectedId(student.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50 dark:border-blue-500/30 dark:text-blue-200">
                        <Eye className="h-3.5 w-3.5" /> View
                      </button>
                    </td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
          <Pager page={page} totalPages={Math.ceil(filtered.length / pageSize)} onPage={setPage} total={filtered.length} pageSize={pageSize} onPageSize={setPageSize} pageSizeOptions={[10, 25, 50, 100]} />
          </>
        ) : <EmptyState title="No students found" body="No assigned students match the selected search and filters." />}
      </Panel>

      {selected ? (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-950">
            <div className="flex justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200"><UserRound className="h-6 w-6" /></span>
                <div>
                  <h2 className="text-lg font-bold text-slate-950 dark:text-white">{selected.name}</h2>
                  <p className="text-sm text-slate-500">{selected.studentId || selected.email}</p>
                </div>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <ExportButtonGroup compact label="Export student detail" onExport={(format) => exportStudents(format, [selected], selected.studentId || selected.id)} />
                <button type="button" onClick={() => setSelectedId(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button>
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                ['Email address', selected.email],
                ['Municipality', selected.municipality || '--'],
                ['NSTP component', selected.component],
                ['Program / Section', selected.programSection || selected.degreeProgram || '--'],
                ['Enrollment', selected.status],
                ['Common contact hours', `${metricsFor(selected.id).progress.completedHours} / 25`],
                ['Attendance rate', `${metricsFor(selected.id).percentage}%`],
                ['Missed sessions', `${metricsFor(selected.id).missed}`],
                ['Assessment completion', `${selected.assessments} outputs`],
                ['Attendance status', attendanceFor(selected.id)],
                ['Grade status', gradeFor(selected.id)],
                ['Eligibility', metricsFor(selected.id).progress.status],
                ['Risk indicator', metricsFor(selected.id).risk],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{value}</p>
                </div>
              ))}
            </div>
            <section className="mt-5 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Private Remarks and Intervention Notes</h3>
              <p className="mt-1 text-xs text-slate-500">Visible only within facilitator/admin accountability records.</p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <select value={noteCategory} onChange={(event) => setNoteCategory(event.target.value as InterventionNote['category'])} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
                  {['Attendance', 'Academic', 'Follow-up', 'Commendation'].map((value) => <option key={value}>{value}</option>)}
                </select>
                <input value={noteText} onChange={(event) => setNoteText(event.target.value)} placeholder="Record observation or required follow-up" className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
                <button type="button" onClick={saveNote} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white"><Save className="h-4 w-4" /> Save</button>
              </div>
              <div className="mt-4 space-y-2">
                {workspace.notes.filter((note) => note.studentId === selected.id).map((note) => (
                  <div key={note.id} className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-900">
                    <div className="flex items-center justify-between gap-2"><StatusBadge value={note.category} /><span className="text-xs text-slate-400">{new Date(note.createdAt).toLocaleString()}</span></div>
                    <p className="mt-2 text-slate-700 dark:text-slate-200">{note.note}</p>
                  </div>
                ))}
                {!workspace.notes.some((note) => note.studentId === selected.id) ? <p className="text-sm text-slate-500">No private notes recorded.</p> : null}
              </div>
            </section>
          </div>
        </div>
      ) : null}
    </>
  );
}
