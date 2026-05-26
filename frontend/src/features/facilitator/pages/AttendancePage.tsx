import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Download, Eye, Filter, Pencil, Plus, Save, Trash2 } from 'lucide-react';
import { addAudit, type AttendanceSheet, type NstpSession, type SessionType } from '../../../data/workflowData';
import type { FacilitatorWorkspace } from '../hooks/useFacilitatorWorkspace';
import type { AttendanceStatus } from '../types';
import { ConfirmDialog, EmptyState, PageIntro, Panel, StatCard, StatusBadge } from '../components/FacilitatorUI';

const STATUSES: AttendanceStatus[] = ['present', 'absent', 'late', 'excused'];
const SESSION_TYPES: SessionType[] = ['Orientation', 'Seminar', 'Workshop', 'Lecture', 'Activity', 'Assessment', 'Examination'];
const today = () => new Date().toISOString().slice(0, 10);

const newSession = (workspace: FacilitatorWorkspace): NstpSession => ({
  id: `session-${Date.now()}`,
  phase: 'Common Phase',
  sessionNumber: workspace.sessions.filter((session) => session.phase === 'Common Phase').length + 1,
  title: '',
  type: 'Seminar',
  date: today(),
  startTime: '08:00',
  endTime: '12:00',
  duration: 4,
  venue: '',
  facilitatorId: workspace.user.id,
  facilitatorName: workspace.user.name,
  municipality: workspace.user.municipalities?.[0] || 'All',
  component: 'Common',
  group: `${workspace.user.municipalities?.[0] || 'Assigned'} Common Phase`,
  description: '',
  status: 'Upcoming',
});

function scopedStudents(session: NstpSession, workspace: FacilitatorWorkspace) {
  return workspace.students.filter((student) => (
    (session.municipality === 'All' || student.municipality === session.municipality) &&
    (session.component === 'Common' || student.component === session.component)
  ));
}

function sheetFromSession(session: NstpSession, workspace: FacilitatorWorkspace): AttendanceSheet {
  return {
    id: `sheet-${session.id}`,
    sessionId: session.id,
    facilitatorId: workspace.user.id,
    facilitatorName: workspace.user.name,
    date: session.date,
    sessionNumber: session.sessionNumber,
    topic: session.title,
    phase: session.phase,
    municipality: session.municipality,
    component: session.component,
    group: session.group,
    status: 'Draft',
    entries: scopedStudents(session, workspace).map((student) => ({ studentId: student.id, status: 'present', remarks: '' })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export default function AttendancePage({ workspace, notify }: { workspace: FacilitatorWorkspace; notify: (message: string) => void }) {
  const firstSession = workspace.sessions[0] || newSession(workspace);
  const [sessionDraft, setSessionDraft] = useState<NstpSession>(firstSession);
  const [draft, setDraft] = useState<AttendanceSheet>(() => workspace.attendance.find((sheet) => sheet.sessionId === firstSession.id) || sheetFromSession(firstSession, workspace));
  const [sheetMode, setSheetMode] = useState<'edit' | 'view'>('edit');
  const [showSessionEditor, setShowSessionEditor] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [topicFilter, setTopicFilter] = useState('');
  const [componentFilter, setComponentFilter] = useState('all');
  const [municipalityFilter, setMunicipalityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [exportRange, setExportRange] = useState<'date' | 'week' | 'month' | 'semester'>('date');

  useEffect(() => {
    if (workspace.sessions.length && !workspace.sessions.some((session) => session.id === draft.sessionId)) {
      const session = workspace.sessions[0];
      setSessionDraft(session);
      setDraft(workspace.attendance.find((sheet) => sheet.sessionId === session.id) || sheetFromSession(session, workspace));
      setSheetMode(workspace.attendance.some((sheet) => sheet.sessionId === session.id) ? 'view' : 'edit');
    }
  }, [workspace.sessions, workspace.attendance, draft.sessionId, workspace]);

  const activeSession = workspace.sessions.find((session) => session.id === draft.sessionId) || sessionDraft;
  const students = scopedStudents(activeSession, workspace);
  const entries = students.map((student) => draft.entries.find((entry) => entry.studentId === student.id) || ({ studentId: student.id, status: 'present' as const, remarks: '' }));
  const summary = STATUSES.reduce<Record<AttendanceStatus, number>>((total, status) => ({ ...total, [status]: entries.filter((entry) => entry.status === status).length }), { present: 0, absent: 0, late: 0, excused: 0 });

  const selectSession = (session: NstpSession, view: 'edit' | 'view' = 'edit') => {
    setSessionDraft(session);
    setDraft(workspace.attendance.find((sheet) => sheet.sessionId === session.id) || sheetFromSession(session, workspace));
    setSheetMode(view);
    setShowSessionEditor(false);
  };

  const saveSession = () => {
    if (!sessionDraft.title.trim() || !sessionDraft.date || !sessionDraft.venue.trim() || sessionDraft.duration <= 0) {
      notify('Session title, date, venue, and valid contact hours are required.');
      return;
    }
    const next = workspace.sessions.some((session) => session.id === sessionDraft.id)
      ? workspace.sessions.map((session) => session.id === sessionDraft.id ? sessionDraft : session)
      : [sessionDraft, ...workspace.sessions];
    workspace.setSessions(next);
    workspace.recordActivity('Session scheduled', `${sessionDraft.title} / ${sessionDraft.duration} contact hours`);
    addAudit(workspace.user, 'Created or updated session', 'Session', sessionDraft.id, sessionDraft.title);
    setDraft(workspace.attendance.find((sheet) => sheet.sessionId === sessionDraft.id) || sheetFromSession(sessionDraft, workspace));
    setShowSessionEditor(false);
    notify('Common Phase session saved.');
  };

  const updateEntry = (studentId: string, patch: Partial<AttendanceSheet['entries'][number]>) => {
    const existing = draft.entries.find((entry) => entry.studentId === studentId) || { studentId, status: 'present' as AttendanceStatus, remarks: '' };
    setDraft((value) => ({ ...value, entries: [...value.entries.filter((entry) => entry.studentId !== studentId), { ...existing, ...patch }] }));
  };

  const saveSheet = () => {
    if (!activeSession?.id) {
      notify('Create a session before recording attendance.');
      return;
    }
    const nextSheet: AttendanceSheet = {
      ...draft,
      date: activeSession.date,
      sessionNumber: activeSession.sessionNumber,
      topic: activeSession.title,
      group: activeSession.group,
      municipality: activeSession.municipality,
      component: activeSession.component,
      phase: activeSession.phase,
      status: entries.some((entry) => entry.status === 'absent' && !entry.remarks.trim()) ? 'Needs Review' : 'Complete',
      entries,
      updatedAt: new Date().toISOString(),
    };
    const next = workspace.attendance.some((sheet) => sheet.id === nextSheet.id)
      ? workspace.attendance.map((sheet) => sheet.id === nextSheet.id ? nextSheet : sheet)
      : [nextSheet, ...workspace.attendance];
    workspace.setAttendance(next);
    workspace.recordActivity('Attendance saved', `${nextSheet.date} / Session ${nextSheet.sessionNumber} / ${nextSheet.topic}`);
    addAudit(workspace.user, 'Attendance saved', 'Attendance Sheet', nextSheet.id, `${nextSheet.date} - ${nextSheet.topic}`);
    setDraft(nextSheet);
    setSheetMode('view');
    notify('Permanent dated attendance record saved.');
  };

  const deleteSheet = () => {
    const sheet = workspace.attendance.find((value) => value.id === deleteId);
    workspace.setAttendance(workspace.attendance.filter((value) => value.id !== deleteId));
    workspace.recordActivity('Attendance deleted', `${sheet?.date || ''} / ${sheet?.topic || ''}`);
    addAudit(workspace.user, 'Attendance deleted', 'Attendance Sheet', deleteId || '', sheet?.topic || 'Removed sheet');
    setDeleteId(null);
    if (sheet?.id === draft.id) setDraft(sheetFromSession(activeSession, workspace));
    notify('Attendance sheet deleted; its session schedule remains available.');
  };

  const historyRows = useMemo(() => workspace.sessions
    .filter((session) => !dateFrom || session.date >= dateFrom)
    .filter((session) => !dateTo || session.date <= dateTo)
    .filter((session) => !topicFilter || session.title.toLowerCase().includes(topicFilter.toLowerCase()))
    .filter((session) => componentFilter === 'all' || session.component === componentFilter)
    .filter((session) => municipalityFilter === 'all' || session.municipality === municipalityFilter)
    .map((session) => ({ session, sheet: workspace.attendance.find((sheet) => sheet.sessionId === session.id) }))
    .filter(({ sheet }) => statusFilter === 'all' || (statusFilter === 'missing' ? !sheet : sheet?.entries.some((entry) => entry.status === statusFilter)))
    .sort((a, b) => b.session.date.localeCompare(a.session.date)), [workspace.sessions, workspace.attendance, dateFrom, dateTo, topicFilter, componentFilter, municipalityFilter, statusFilter]);

  const calendarRows = workspace.sessions
    .map((session) => ({ session, sheet: workspace.attendance.find((sheet) => sheet.sessionId === session.id) }))
    .sort((a, b) => a.session.date.localeCompare(b.session.date));

  const exportAttendance = async (format: 'excel' | 'pdf') => {
    const end = activeSession.date;
    const startDate = new Date(`${end}T00:00:00`);
    if (exportRange === 'week') startDate.setDate(startDate.getDate() - 6);
    if (exportRange === 'month') startDate.setDate(1);
    if (exportRange === 'semester') startDate.setMonth(startDate.getMonth() - 5);
    const chosen = exportRange === 'date'
      ? workspace.attendance.filter((sheet) => sheet.date === end)
      : workspace.attendance.filter((sheet) => sheet.date >= startDate.toISOString().slice(0, 10) && sheet.date <= end);
    const rows = chosen.flatMap((sheet) => sheet.entries.map((attendance) => {
      const student = workspace.students.find((value) => value.id === attendance.studentId);
      return [sheet.date, `Session ${sheet.sessionNumber}`, sheet.topic, sheet.group, student?.name || attendance.studentId, attendance.status, attendance.remarks, sheet.facilitatorName];
    }));
    if (!rows.length) {
      notify('No saved attendance records match this export period.');
      return;
    }
    if (format === 'excel') {
      const XLSX = await import('xlsx');
      const book = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([['Date', 'Session', 'Topic', 'Class Group', 'Student', 'Status', 'Remarks', 'Facilitator'], ...rows]), 'Attendance');
      XLSX.writeFile(book, `attendance-${exportRange}-${end}.xlsx`);
    } else {
      const [{ default: JsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
      const doc = new JsPDF({ orientation: 'landscape' });
      doc.setFontSize(14);
      doc.text('NSTP Attendance Record', 14, 14);
      doc.setFontSize(9);
      doc.text(`Period: ${exportRange.toUpperCase()} ending ${end} | Facilitator: ${workspace.user.name}`, 14, 21);
      autoTable(doc, { startY: 27, head: [['Date', 'Session', 'Topic', 'Class Group', 'Student', 'Status', 'Remarks', 'Facilitator']], body: rows });
      doc.save(`attendance-${exportRange}-${end}.pdf`);
    }
    addAudit(workspace.user, 'Attendance exported', 'Attendance Export', exportRange, `${format.toUpperCase()} export generated`);
    notify(`${format === 'excel' ? 'Excel' : 'PDF'} attendance export generated.`);
  };

  return (
    <>
      <PageIntro
        eyebrow="Common Phase Session Records"
        title="Dated Attendance and Sessions"
        description="Create flexible Common Phase sessions toward the required 25 contact hours, then preserve a permanent attendance sheet for each scheduled date."
        actions={(
          <>
            <button type="button" onClick={() => { setSessionDraft(newSession(workspace)); setShowSessionEditor(true); }} className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 dark:border-blue-500/30 dark:bg-slate-950 dark:text-blue-200"><Plus className="h-4 w-4" /> Create session</button>
            <button type="button" onClick={saveSheet} disabled={sheetMode === 'view'} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white disabled:bg-slate-400"><Save className="h-4 w-4" /> Save dated record</button>
          </>
        )}
      />

      {showSessionEditor && (
        <Panel>
          <div className="mb-4 flex justify-between"><div><h2 className="text-lg font-bold">Session Management</h2><p className="text-sm text-slate-500">Sessions represent actual contact hours, not fixed module cards.</p></div><button type="button" onClick={() => setShowSessionEditor(false)} className="text-sm font-semibold text-slate-500">Close</button></div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="text-sm font-semibold">Session title<input value={sessionDraft.title} onChange={(event) => setSessionDraft({ ...sessionDraft, title: event.target.value })} placeholder="Session title" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900" /></label>
            <label className="text-sm font-semibold">Session type<select value={sessionDraft.type} onChange={(event) => setSessionDraft({ ...sessionDraft, type: event.target.value as SessionType })} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900">{SESSION_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label>
            <label className="text-sm font-semibold">Date<input type="date" value={sessionDraft.date} onChange={(event) => setSessionDraft({ ...sessionDraft, date: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900" /></label>
            <label className="text-sm font-semibold">Contact hours<input type="number" min={1} step={0.5} value={sessionDraft.duration} onChange={(event) => setSessionDraft({ ...sessionDraft, duration: Number(event.target.value) })} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900" /></label>
            <label className="text-sm font-semibold">Start time<input type="time" value={sessionDraft.startTime} onChange={(event) => setSessionDraft({ ...sessionDraft, startTime: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900" /></label>
            <label className="text-sm font-semibold">End time<input type="time" value={sessionDraft.endTime} onChange={(event) => setSessionDraft({ ...sessionDraft, endTime: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900" /></label>
            <label className="text-sm font-semibold">Venue / delivery mode<input value={sessionDraft.venue} onChange={(event) => setSessionDraft({ ...sessionDraft, venue: event.target.value })} placeholder="Room or online link" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900" /></label>
            <label className="text-sm font-semibold">Class group<input value={sessionDraft.group} onChange={(event) => setSessionDraft({ ...sessionDraft, group: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900" /></label>
            <label className="text-sm font-semibold">Phase<select value={sessionDraft.phase} onChange={(event) => setSessionDraft({ ...sessionDraft, phase: event.target.value as NstpSession['phase'], component: event.target.value === 'Common Phase' ? 'Common' : 'CWTS' })} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900"><option>Common Phase</option><option>Component Proper</option></select></label>
            <label className="text-sm font-semibold">Component<select value={sessionDraft.component} disabled={sessionDraft.phase === 'Common Phase'} onChange={(event) => setSessionDraft({ ...sessionDraft, component: event.target.value as NstpSession['component'] })} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-900"><option>Common</option>{['CWTS', 'LTS', 'MTS (Army)', 'MTS (Navy)'].map((value) => <option key={value}>{value}</option>)}</select></label>
            <label className="text-sm font-semibold md:col-span-2">Description<input value={sessionDraft.description} onChange={(event) => setSessionDraft({ ...sessionDraft, description: event.target.value })} placeholder="Activity purpose and required output" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900" /></label>
          </div>
          <button type="button" onClick={saveSession} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white"><Save className="h-4 w-4" /> Save session schedule</button>
        </Panel>
      )}

      <div className="grid gap-5 xl:grid-cols-[1.55fr_0.9fr]">
        <Panel>
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">{activeSession.phase} / Session {activeSession.sessionNumber}</p>
              <h2 className="mt-1 text-lg font-bold text-slate-950 dark:text-white">{activeSession.title || 'Select or create a session'}</h2>
              <p className="text-sm text-slate-500">{activeSession.date} / {activeSession.startTime}-{activeSession.endTime} / {activeSession.duration} hours / {activeSession.group}</p>
            </div>
            <div className="flex gap-2"><StatusBadge value={draft.status} /><button type="button" onClick={() => setSheetMode(sheetMode === 'edit' ? 'view' : 'edit')} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold dark:border-slate-700">{sheetMode === 'edit' ? 'View mode' : 'Edit correction'}</button></div>
          </div>
          <div className="mb-4 grid gap-3 sm:grid-cols-4">
            <StatCard label="Present" value={summary.present} detail="Recorded" icon={CalendarDays} tone="emerald" />
            <StatCard label="Absent" value={summary.absent} detail="Unexcused" icon={CalendarDays} tone="rose" />
            <StatCard label="Late" value={summary.late} detail="Late arrival" icon={CalendarDays} tone="amber" />
            <StatCard label="Excused" value={summary.excused} detail="With reason" icon={CalendarDays} tone="slate" />
          </div>
          {students.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-sm">
                <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase tracking-[0.12em] text-slate-500 dark:bg-slate-900"><tr><th className="px-3 py-3">Student</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Remarks / excuse reason</th><th className="px-3 py-3">Proof</th></tr></thead>
                <tbody>{students.map((student) => {
                  const row = entries.find((value) => value.studentId === student.id)!;
                  return (
                    <tr key={student.id} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="px-3 py-3"><p className="font-semibold">{student.name}</p><p className="text-xs text-slate-500">{student.studentId}</p></td>
                      <td className="px-3 py-3"><select disabled={sheetMode === 'view'} value={row.status} onChange={(event) => updateEntry(student.id, { status: event.target.value as AttendanceStatus })} className="rounded-lg border border-slate-200 px-2 py-2 capitalize disabled:bg-slate-50 dark:border-slate-700 dark:bg-slate-900">{STATUSES.map((status) => <option key={status}>{status}</option>)}</select></td>
                      <td className="px-3 py-3"><input disabled={sheetMode === 'view'} value={row.remarks} onChange={(event) => updateEntry(student.id, { remarks: event.target.value })} placeholder={row.status === 'excused' ? 'Required excuse reason' : 'Optional remarks'} className="w-full rounded-lg border border-slate-200 px-3 py-2 disabled:bg-slate-50 dark:border-slate-700 dark:bg-slate-900" /></td>
                      <td className="px-3 py-3"><input disabled={sheetMode === 'view' || row.status !== 'excused'} value={row.excuseAttachmentName || ''} onChange={(event) => updateEntry(student.id, { excuseAttachmentName: event.target.value })} placeholder="Proof filename/link" className="w-full rounded-lg border border-slate-200 px-3 py-2 disabled:bg-slate-50 dark:border-slate-700 dark:bg-slate-900" /></td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          ) : <EmptyState title="No students assigned to this session" body="Review the session group or component selection before recording attendance." />}
        </Panel>

        <Panel>
          <h2 className="inline-flex items-center gap-2 text-lg font-bold"><CalendarDays className="h-5 w-5 text-blue-700" /> Attendance Calendar</h2>
          <p className="mt-1 text-sm text-slate-500">Select a dated session to open its attendance sheet.</p>
          <div className="mt-4 space-y-2">
            {calendarRows.map(({ session, sheet }) => (
              <button key={session.id} type="button" onClick={() => selectSession(session, sheet ? 'view' : 'edit')} className={`flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left ${session.id === activeSession.id ? 'border-blue-300 bg-blue-50 dark:bg-blue-500/10' : 'border-slate-200 dark:border-slate-800'}`}>
                <div><p className="text-sm font-semibold">{new Date(`${session.date}T00:00:00`).toLocaleDateString()} - Session {session.sessionNumber}</p><p className="text-xs text-slate-500">{session.title}</p></div>
                <StatusBadge value={sheet?.status || (session.status === 'Upcoming' ? 'Missing attendance' : 'Draft')} />
              </button>
            ))}
          </div>
          <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
            <h3 className="text-sm font-bold">Attendance Export</h3>
            <div className="mt-3 flex gap-2">
              <select value={exportRange} onChange={(event) => setExportRange(event.target.value as typeof exportRange)} className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"><option value="date">Selected date</option><option value="week">Week</option><option value="month">Month</option><option value="semester">Semester</option></select>
              <button type="button" onClick={() => exportAttendance('excel')} className="rounded-lg border border-blue-200 p-2 text-blue-700" title="Export Excel"><Download className="h-4 w-4" /></button>
              <button type="button" onClick={() => exportAttendance('pdf')} className="rounded-lg border border-blue-200 px-2 text-xs font-bold text-blue-700" title="Export PDF">PDF</button>
            </div>
          </div>
        </Panel>
      </div>

      <Panel>
        <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div><h2 className="inline-flex items-center gap-2 text-lg font-bold"><Filter className="h-5 w-5 text-blue-700" /> Attendance History</h2><p className="text-sm text-slate-500">Permanent dated records and sessions missing a submitted sheet.</p></div>
          <div className="flex flex-wrap gap-2">
            <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} aria-label="Date from" className="rounded-lg border border-slate-200 px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
            <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} aria-label="Date to" className="rounded-lg border border-slate-200 px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
            <input value={topicFilter} onChange={(event) => setTopicFilter(event.target.value)} placeholder="Topic search" className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
            <select value={componentFilter} onChange={(event) => setComponentFilter(event.target.value)} className="rounded-lg border border-slate-200 px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"><option value="all">All components</option><option>Common</option>{['CWTS', 'LTS', 'MTS (Army)', 'MTS (Navy)'].map((item) => <option key={item}>{item}</option>)}</select>
            <select value={municipalityFilter} onChange={(event) => setMunicipalityFilter(event.target.value)} className="rounded-lg border border-slate-200 px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"><option value="all">All groups</option>{(workspace.user.municipalities || []).map((item) => <option key={item}>{item}</option>)}</select>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-lg border border-slate-200 px-2 py-2 text-sm capitalize dark:border-slate-700 dark:bg-slate-900"><option value="all">Any attendance</option><option value="missing">Missing sheet</option>{STATUSES.map((item) => <option key={item}>{item}</option>)}</select>
          </div>
        </div>
        {historyRows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-900"><tr><th className="px-3 py-3">Date / Session</th><th className="px-3 py-3">Topic</th><th className="px-3 py-3">Class Group</th><th className="px-3 py-3">Component</th><th className="px-3 py-3">Record</th><th className="px-3 py-3">Summary</th><th className="px-3 py-3">Actions</th></tr></thead>
              <tbody>{historyRows.map(({ session, sheet }) => (
                <tr key={session.id} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="px-3 py-3 font-semibold">{session.date}<p className="text-xs font-normal text-slate-500">Session {session.sessionNumber}</p></td>
                  <td className="px-3 py-3">{session.title}</td><td className="px-3 py-3">{session.group}</td><td className="px-3 py-3">{session.component}</td>
                  <td className="px-3 py-3"><StatusBadge value={sheet?.status || 'Missing attendance'} /></td>
                  <td className="px-3 py-3 text-xs">{sheet ? `P ${sheet.entries.filter((entry) => entry.status === 'present').length} / A ${sheet.entries.filter((entry) => entry.status === 'absent').length} / L ${sheet.entries.filter((entry) => entry.status === 'late').length} / E ${sheet.entries.filter((entry) => entry.status === 'excused').length}` : '--'}</td>
                  <td className="px-3 py-3"><div className="flex gap-1.5"><button type="button" onClick={() => selectSession(session, 'view')} className="rounded-lg border border-slate-200 p-2" title="View attendance"><Eye className="h-4 w-4" /></button><button type="button" onClick={() => selectSession(session, 'edit')} className="rounded-lg border border-blue-200 p-2 text-blue-700" title="Edit attendance"><Pencil className="h-4 w-4" /></button>{sheet && <button type="button" onClick={() => setDeleteId(sheet.id)} className="rounded-lg border border-rose-200 p-2 text-rose-600" title="Delete attendance"><Trash2 className="h-4 w-4" /></button>}</div></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <EmptyState title="No attendance history found" body="Try another date range or create a new Common Phase session." />}
      </Panel>
      <ConfirmDialog open={Boolean(deleteId)} title="Delete dated attendance sheet?" body="This permanently removes the saved student statuses and remarks for the selected session. The scheduled session remains visible as missing attendance." onCancel={() => setDeleteId(null)} onConfirm={deleteSheet} />
    </>
  );
}
