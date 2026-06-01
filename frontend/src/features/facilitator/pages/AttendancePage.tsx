import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Check, ChevronDown, Clock3, Download, FileSpreadsheet, Filter, MinusCircle, Pencil, Plus, Printer, Save, Search, Send, Trash2, UserRound, UserX, X } from 'lucide-react';
import { addAudit, type AttendanceRecordStatus, type AttendanceSheet, type NstpSession, type SessionType } from '../../../data/workflowData';
import type { FacilitatorWorkspace } from '../hooks/useFacilitatorWorkspace';
import type { AttendanceStatus } from '../types';
import { ConfirmDialog, EmptyState, MunicipalityScopeBanner, PageIntro, Pager, Panel, StatCard, StatusBadge, useModalEscape } from '../components/FacilitatorUI';

const STATUSES: AttendanceStatus[] = ['present', 'absent', 'late', 'excused'];
const SESSION_TYPES: SessionType[] = ['Orientation', 'Seminar', 'Workshop', 'Lecture', 'Activity', 'Assessment', 'Examination'];
const SHEET_STAGES = ['Draft', 'Ongoing', 'Submitted', 'Completed'] as const;
type SheetStage = typeof SHEET_STAGES[number];
const today = () => new Date().toISOString().slice(0, 10);

const normalizeStage = (status: AttendanceRecordStatus): SheetStage => {
  if (status === 'Complete') return 'Completed';
  if (status === 'Needs Review') return 'Ongoing';
  return status;
};

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[character] || character));

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
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterStatus, setRosterStatus] = useState('all');
  const [rosterPage, setRosterPage] = useState(1);
  const [rosterPageSize, setRosterPageSize] = useState(25);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(10);
  const [historyViewer, setHistoryViewer] = useState<{ session: NstpSession; sheet: AttendanceSheet } | null>(null);
  const [viewerSearch, setViewerSearch] = useState('');
  const [viewerStatus, setViewerStatus] = useState('all');
  const [viewerPage, setViewerPage] = useState(1);
  const [viewerPageSize, setViewerPageSize] = useState(25);
  const [saveIndicator, setSaveIndicator] = useState('Saved');
  const [dirtyStudentIds, setDirtyStudentIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(firstSession.date);
  const [timelineExpanded, setTimelineExpanded] = useState(false);

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
  const filteredStudents = students.filter((student) => {
    const entry = entries.find((row) => row.studentId === student.id);
    const query = rosterSearch.trim().toLowerCase();
    return (!query || `${student.name} ${student.studentId}`.toLowerCase().includes(query))
      && (rosterStatus === 'all' || entry?.status === rosterStatus);
  });
  const displayedStudents = filteredStudents.slice((rosterPage - 1) * rosterPageSize, rosterPage * rosterPageSize);
  const summary = STATUSES.reduce<Record<AttendanceStatus, number>>((total, status) => ({ ...total, [status]: entries.filter((entry) => entry.status === status).length }), { present: 0, absent: 0, late: 0, excused: 0 });
  const percentFor = (status: AttendanceStatus) => entries.length ? Math.round((summary[status] / entries.length) * 100) : 0;
  const allSelected = displayedStudents.length > 0 && displayedStudents.every((student) => selectedStudentIds.includes(student.id));
  const hasUnsavedChanges = dirtyStudentIds.length > 0;

  useEffect(() => setSelectedStudentIds([]), [draft.sessionId]);
  useEffect(() => setRosterPage(1), [draft.sessionId, rosterPageSize, rosterSearch, rosterStatus]);
  useEffect(() => setSelectedDate(activeSession.date), [activeSession.date, activeSession.id]);

  useEffect(() => {
    if (!hasUnsavedChanges) return undefined;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges]);

  const confirmDiscardChanges = () => {
    if (!hasUnsavedChanges) return true;
    return window.confirm('You have unsaved attendance edits. Discard these changes and continue?');
  };

  useModalEscape({
    open: showSessionEditor,
    onClose: () => setShowSessionEditor(false),
    confirmClose: confirmDiscardChanges,
  });
  useModalEscape({
    open: Boolean(historyViewer),
    onClose: () => setHistoryViewer(null),
    confirmClose: confirmDiscardChanges,
  });

  const markRowsDirty = (studentIds: string[]) => {
    setDirtyStudentIds((current) => Array.from(new Set([...current, ...studentIds])));
  };

  const resetDirtyState = (message = 'Saved') => {
    setDirtyStudentIds([]);
    setSaveIndicator(message);
  };

  const selectSession = (session: NstpSession, view: 'edit' | 'view' = 'edit') => {
    setSessionDraft(session);
    setDraft(workspace.attendance.find((sheet) => sheet.sessionId === session.id) || sheetFromSession(session, workspace));
    setSheetMode(view);
    resetDirtyState('Saved');
    setSelectedDate(session.date);
    setShowSessionEditor(false);
  };

  const guardedSelectSession = (session: NstpSession, view: 'edit' | 'view' = 'edit') => {
    if (!confirmDiscardChanges()) return;
    selectSession(session, view);
  };

  const openTodaysSession = () => {
    if (!confirmDiscardChanges()) return;
    const scheduled = workspace.sessions.find((session) => session.date === today());
    if (scheduled) {
      selectSession(scheduled, workspace.attendance.some((sheet) => sheet.sessionId === scheduled.id) ? 'view' : 'edit');
      notify("Today's scheduled session opened.");
      return;
    }
    setSessionDraft(newSession(workspace));
    setShowSessionEditor(true);
    notify("No session scheduled for today. Complete the form to create one.");
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
    const savedSheet = workspace.attendance.find((sheet) => sheet.sessionId === sessionDraft.id);
    if (savedSheet) {
      const syncedSheet: AttendanceSheet = {
        ...savedSheet,
        date: sessionDraft.date,
        sessionNumber: sessionDraft.sessionNumber,
        topic: sessionDraft.title,
        phase: sessionDraft.phase,
        municipality: sessionDraft.municipality,
        component: sessionDraft.component,
        group: sessionDraft.group,
        updatedAt: new Date().toISOString(),
      };
      workspace.setAttendance(workspace.attendance.map((sheet) => sheet.id === syncedSheet.id ? syncedSheet : sheet));
      setDraft(syncedSheet);
    } else {
      setDraft(sheetFromSession(sessionDraft, workspace));
    }
    setSelectedDate(sessionDraft.date);
    setSheetMode('edit');
    setSaveIndicator('Session saved. Attendance is a draft.');
    setShowSessionEditor(false);
    notify('Dated attendance session saved and ready for recording.');
  };

  const saveAttendanceDate = () => {
    if (isSaving) return;
    if (!selectedDate) {
      notify('Select a valid attendance date before saving.');
      return;
    }
    if (selectedDate === activeSession.date) {
      notify('Attendance is already assigned to the selected date.');
      return;
    }
    setIsSaving(true);
    const updatedSession: NstpSession = { ...activeSession, date: selectedDate };
    workspace.setSessions(workspace.sessions.map((session) => session.id === activeSession.id ? updatedSession : session));
    setSessionDraft(updatedSession);
    const syncedSheet = {
      ...draft,
      date: selectedDate,
      updatedAt: new Date().toISOString(),
    };
    const hasSavedSheet = workspace.attendance.some((sheet) => sheet.id === draft.id);
    if (hasSavedSheet) {
      workspace.setAttendance(workspace.attendance.map((sheet) => sheet.id === draft.id ? syncedSheet : sheet));
    }
    setDraft(syncedSheet);
    workspace.recordActivity('Attendance date updated', `${activeSession.title} moved to ${selectedDate}`);
    addAudit(workspace.user, 'Attendance date updated', 'Attendance Sheet', draft.id, `${activeSession.date} changed to ${selectedDate}.`);
    setSaveIndicator('Date saved');
    notify(hasSavedSheet ? 'Attendance date updated across the session and its saved sheet.' : 'Attendance session date updated. Save the attendance sheet to preserve student entries.');
    window.setTimeout(() => setIsSaving(false), 250);
  };

  const updateEntry = (studentId: string, patch: Partial<AttendanceSheet['entries'][number]>) => {
    const existing = draft.entries.find((entry) => entry.studentId === studentId) || { studentId, status: 'present' as AttendanceStatus, remarks: '' };
    setDraft((value) => ({ ...value, entries: [...value.entries.filter((entry) => entry.studentId !== studentId), { ...existing, ...patch }] }));
    setSaveIndicator('Unsaved changes');
    markRowsDirty([studentId]);
  };

  const setRowStatus = (studentId: string, status: AttendanceStatus) => {
    updateEntry(studentId, { status, remarks: status === 'present' ? '' : (draft.entries.find((entry) => entry.studentId === studentId)?.remarks || '') });
  };

  const toggleSelection = (studentId: string) => {
    setSelectedStudentIds((current) => current.includes(studentId) ? current.filter((value) => value !== studentId) : [...current, studentId]);
  };

  const toggleAll = () => {
    const pageIds = displayedStudents.map((student) => student.id);
    setSelectedStudentIds((current) => allSelected
      ? current.filter((value) => !pageIds.includes(value))
      : Array.from(new Set([...current, ...pageIds])));
  };

  const applyBulkStatus = (status: AttendanceStatus) => {
    if (sheetMode === 'view') return;
    const targets = selectedStudentIds.length ? selectedStudentIds : students.map((student) => student.id);
    setDraft((value) => {
      const nextEntries = students.map((student) => {
        const existing = value.entries.find((entry) => entry.studentId === student.id) || { studentId: student.id, status: 'present' as AttendanceStatus, remarks: '' };
        return targets.includes(student.id)
          ? { ...existing, status, remarks: status === 'present' ? '' : existing.remarks }
          : existing;
      });
      return { ...value, entries: nextEntries };
    });
    markRowsDirty(targets);
    setSaveIndicator('Unsaved changes');
    setSelectedStudentIds(targets);
    notify(`${targets.length} student${targets.length === 1 ? '' : 's'} marked ${status}. Review then click Save Changes.`);
  };

  const saveSheet = (requestedStage?: SheetStage) => {
    if (isSaving) return;
    if (!activeSession?.id) {
      notify('Create a session before recording attendance.');
      return;
    }
    const targetStage = requestedStage || normalizeStage(draft.status);
    const missingExcuseReasons = entries.some((entry) => entry.status === 'excused' && !entry.remarks.trim());
    const missingAbsenceRemarks = entries.some((entry) => entry.status === 'absent' && !entry.remarks.trim());
    if ((targetStage === 'Submitted' || targetStage === 'Completed') && missingExcuseReasons) {
      notify('Add a reason for every excused attendance record before submission.');
      return;
    }
    if (targetStage === 'Completed' && missingAbsenceRemarks) {
      notify('Add remarks for absences before completing this attendance sheet.');
      return;
    }
    setIsSaving(true);
    const nextSheet: AttendanceSheet = {
      ...draft,
      date: activeSession.date,
      sessionNumber: activeSession.sessionNumber,
      topic: activeSession.title,
      group: activeSession.group,
      municipality: activeSession.municipality,
      component: activeSession.component,
      phase: activeSession.phase,
      status: targetStage,
      entries,
      updatedAt: new Date().toISOString(),
    };
    const next = workspace.attendance.some((sheet) => sheet.id === nextSheet.id)
      ? workspace.attendance.map((sheet) => sheet.id === nextSheet.id ? nextSheet : sheet)
      : [nextSheet, ...workspace.attendance];
    workspace.setAttendance(next);
    if (targetStage === 'Submitted' || targetStage === 'Completed') {
      workspace.setSessions(workspace.sessions.map((session) => session.id === activeSession.id ? { ...session, status: targetStage === 'Completed' ? 'Completed' : 'Ongoing' } : session));
    }
    workspace.recordActivity(`Attendance ${targetStage.toLowerCase()}`, `${nextSheet.date} / Session ${nextSheet.sessionNumber} / ${nextSheet.topic}`);
    addAudit(workspace.user, `Attendance ${targetStage.toLowerCase()}`, 'Attendance Sheet', nextSheet.id, `${nextSheet.date} - ${nextSheet.topic}`);
    setDraft(nextSheet);
    resetDirtyState('Saved');
    setSheetMode(targetStage === 'Submitted' || targetStage === 'Completed' ? 'view' : 'edit');
    notify(targetStage === 'Draft' ? 'Attendance draft saved permanently.' : `Attendance marked ${targetStage.toLowerCase()} and stored permanently.`);
    window.setTimeout(() => setIsSaving(false), 250);
  };

  const deleteSheet = () => {
    if (isSaving) return;
    setIsSaving(true);
    const sheet = workspace.attendance.find((value) => value.id === deleteId);
    workspace.setAttendance(workspace.attendance.filter((value) => value.id !== deleteId));
    workspace.recordActivity('Attendance deleted', `${sheet?.date || ''} / ${sheet?.topic || ''}`);
    addAudit(workspace.user, 'Attendance deleted', 'Attendance Sheet', deleteId || '', sheet?.topic || 'Removed sheet');
    setDeleteId(null);
    if (sheet?.id === draft.id) {
      setDraft(sheetFromSession(activeSession, workspace));
      setSheetMode('edit');
      resetDirtyState('Saved');
    }
    if (historyViewer?.sheet.id === sheet?.id) setHistoryViewer(null);
    notify('Attendance sheet deleted; its session schedule remains available.');
    window.setTimeout(() => setIsSaving(false), 250);
  };

  const historyRows = useMemo(() => workspace.sessions
    .filter((session) => !dateFrom || session.date >= dateFrom)
    .filter((session) => !dateTo || session.date <= dateTo)
    .filter((session) => !topicFilter || session.title.toLowerCase().includes(topicFilter.toLowerCase()))
    .filter((session) => componentFilter === 'all' || session.component === componentFilter)
    .filter((session) => municipalityFilter === 'all' || session.municipality === municipalityFilter)
    .map((session) => ({ session, sheet: workspace.attendance.find((sheet) => sheet.sessionId === session.id) }))
    .filter(({ sheet }) => statusFilter === 'all'
      || (statusFilter === 'missing' ? !sheet : (sheet && normalizeStage(sheet.status) === statusFilter) || sheet?.entries.some((entry) => entry.status === statusFilter)))
    .sort((a, b) => b.session.date.localeCompare(a.session.date)), [workspace.sessions, workspace.attendance, dateFrom, dateTo, topicFilter, componentFilter, municipalityFilter, statusFilter]);
  const displayedHistoryRows = historyRows.slice((historyPage - 1) * historyPageSize, historyPage * historyPageSize);

  useEffect(() => setHistoryPage(1), [dateFrom, dateTo, topicFilter, componentFilter, municipalityFilter, statusFilter, historyPageSize]);

  const viewerEntries = useMemo(() => {
    if (!historyViewer) return [];
    const term = viewerSearch.toLowerCase().trim();
    return historyViewer.sheet.entries
      .map((entry) => ({ entry, student: workspace.students.find((student) => student.id === entry.studentId) }))
      .filter(({ entry, student }) => viewerStatus === 'all' || entry.status === viewerStatus)
      .filter(({ student }) => !term || `${student?.name || ''} ${student?.studentId || ''}`.toLowerCase().includes(term));
  }, [historyViewer, viewerSearch, viewerStatus, workspace.students]);
  const displayedViewerEntries = viewerEntries.slice((viewerPage - 1) * viewerPageSize, viewerPage * viewerPageSize);

  useEffect(() => setViewerPage(1), [viewerSearch, viewerStatus, viewerPageSize, historyViewer]);

  const openSpreadsheet = (session: NstpSession, sheet: AttendanceSheet) => {
    setHistoryViewer({ session, sheet });
    setViewerSearch('');
    setViewerStatus('all');
    setViewerPage(1);
  };

  const editHistorySheet = (session: NstpSession) => {
    if (!confirmDiscardChanges()) return;
    setHistoryViewer(null);
    selectSession(session, 'edit');
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    notify('Attendance sheet opened in editable mode.');
  };

  const calendarRows = workspace.sessions
    .map((session) => ({ session, sheet: workspace.attendance.find((sheet) => sheet.sessionId === session.id) }))
    .sort((a, b) => a.session.date.localeCompare(b.session.date));

  const calendarLabel = (session: NstpSession, sheet?: AttendanceSheet) => {
    if (sheet?.status === 'Complete' || sheet?.status === 'Completed') return 'Completed';
    if (sheet?.status === 'Submitted') return 'Submitted';
    if (sheet?.status === 'Ongoing' || sheet?.status === 'Draft') return sheet.status;
    if (sheet?.status === 'Needs Review') return 'Needs Review';
    if (sheet) return 'In Progress';
    return session.status === 'Upcoming' ? 'Scheduled' : 'Missing attendance';
  };

  const statusControlClass = (status: AttendanceStatus) => {
    if (status === 'present') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    if (status === 'absent') return 'border-rose-200 bg-rose-50 text-rose-700';
    if (status === 'late') return 'border-amber-200 bg-amber-50 text-amber-700';
    return 'border-slate-200 bg-slate-50 text-slate-700';
  };

  const statusToggleClass = (status: AttendanceStatus, active: boolean) => {
    const activeClass = statusControlClass(status);
    return active
      ? `${activeClass} shadow-sm`
      : 'border-slate-200 bg-white text-slate-500 hover:border-blue-200 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300';
  };

  const exportSheets = async (chosen: AttendanceSheet[], format: 'excel' | 'pdf', filename: string) => {
    const end = chosen[0]?.date || activeSession.date;
    const rows = chosen.flatMap((sheet) => sheet.entries.map((attendance) => {
      const student = workspace.students.find((value) => value.id === attendance.studentId);
      return [sheet.date, `Session ${sheet.sessionNumber}`, sheet.topic, sheet.group, student?.studentId || attendance.studentId, student?.name || attendance.studentId, attendance.status, attendance.remarks, attendance.excuseAttachmentName || '', sheet.facilitatorName, new Date(sheet.updatedAt).toLocaleString()];
    }));
    if (!rows.length) {
      notify('No saved attendance records match this export selection.');
      return;
    }
    if (format === 'excel') {
      const XLSX = await import('xlsx');
      const book = XLSX.utils.book_new();
      const details = XLSX.utils.aoa_to_sheet([['Date', 'Session', 'Topic', 'Class Group', 'Student ID', 'Student', 'Status', 'Remarks', 'Proof Reference', 'Facilitator', 'Submitted / Updated'], ...rows]);
      details['!cols'] = [{ wch: 14 }, { wch: 14 }, { wch: 34 }, { wch: 26 }, { wch: 18 }, { wch: 26 }, { wch: 14 }, { wch: 30 }, { wch: 28 }, { wch: 26 }, { wch: 23 }];
      if (details['!ref']) details['!autofilter'] = { ref: details['!ref'] };
      const summaryRows = chosen.map((sheet) => [
        sheet.date,
        `Session ${sheet.sessionNumber}`,
        sheet.topic,
        sheet.group,
        sheet.entries.filter((entry) => entry.status === 'present').length,
        sheet.entries.filter((entry) => entry.status === 'absent').length,
        sheet.entries.filter((entry) => entry.status === 'late').length,
        sheet.entries.filter((entry) => entry.status === 'excused').length,
        normalizeStage(sheet.status),
        new Date(sheet.updatedAt).toLocaleString(),
      ]);
      const workbookSummary = XLSX.utils.aoa_to_sheet([['Date', 'Session', 'Topic', 'Class Group', 'Present', 'Absent', 'Late', 'Excused', 'Sheet Status', 'Submitted / Updated'], ...summaryRows]);
      workbookSummary['!cols'] = [{ wch: 14 }, { wch: 14 }, { wch: 34 }, { wch: 26 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 18 }, { wch: 23 }];
      XLSX.utils.book_append_sheet(book, workbookSummary, 'Summary');
      XLSX.utils.book_append_sheet(book, details, 'Attendance Records');
      XLSX.writeFile(book, `${filename}.xlsx`);
    } else {
      const [{ default: JsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
      const doc = new JsPDF({ orientation: 'landscape' });
      doc.setFontSize(14);
      doc.text('Biliran Province State University - NSTP Attendance Record', 14, 14);
      doc.setFontSize(9);
      doc.text(`Facilitator: ${workspace.user.name} | Generated: ${new Date().toLocaleString()}`, 14, 21);
      autoTable(doc, { startY: 27, head: [['Date', 'Session', 'Topic', 'Group', 'Student ID', 'Student', 'Status', 'Remarks', 'Proof']], body: rows.map((row) => row.slice(0, 9)) });
      doc.save(`${filename}.pdf`);
    }
    addAudit(workspace.user, 'Attendance exported', 'Attendance Export', filename, `${format.toUpperCase()} export generated`);
    notify(`${format === 'excel' ? 'Excel' : 'PDF'} attendance export generated.`);
  };

  const exportAttendance = async (format: 'excel' | 'pdf') => {
    const end = activeSession.date;
    const startDate = new Date(`${end}T00:00:00`);
    if (exportRange === 'week') startDate.setDate(startDate.getDate() - 6);
    if (exportRange === 'month') startDate.setDate(1);
    if (exportRange === 'semester') startDate.setMonth(startDate.getMonth() - 5);
    const chosen = exportRange === 'date'
      ? workspace.attendance.filter((sheet) => sheet.date === end)
      : workspace.attendance.filter((sheet) => sheet.date >= startDate.toISOString().slice(0, 10) && sheet.date <= end);
    await exportSheets(chosen, format, `attendance-${exportRange}-${end}`);
  };

  const downloadProofRegister = async (sheet: AttendanceSheet) => {
    const references = sheet.entries
      .filter((entry) => entry.excuseAttachmentName?.trim())
      .map((entry) => {
        const student = workspace.students.find((value) => value.id === entry.studentId);
        return [student?.studentId || entry.studentId, student?.name || entry.studentId, entry.status, entry.remarks, entry.excuseAttachmentName || ''];
      });
    if (!references.length) {
      notify('No proof references have been submitted for this session.');
      return;
    }
    const XLSX = await import('xlsx');
    const book = XLSX.utils.book_new();
    const sheetData = XLSX.utils.aoa_to_sheet([['Student ID', 'Student Name', 'Attendance Status', 'Excuse Reason', 'Proof Reference'], ...references]);
    sheetData['!cols'] = [{ wch: 18 }, { wch: 28 }, { wch: 18 }, { wch: 32 }, { wch: 44 }];
    XLSX.utils.book_append_sheet(book, sheetData, 'Proof Register');
    XLSX.writeFile(book, `attendance-proofs-${sheet.date}-session-${sheet.sessionNumber}.xlsx`);
    notify('Proof reference register downloaded.');
  };

  const printSheet = (sheet: AttendanceSheet) => {
    const popup = window.open('', '_blank', 'width=1024,height=720');
    if (!popup) {
      notify('Enable pop-ups to print this attendance sheet.');
      return;
    }
    const rows = sheet.entries.map((entry) => {
      const student = workspace.students.find((value) => value.id === entry.studentId);
      return `<tr><td>${escapeHtml(student?.studentId || entry.studentId)}</td><td>${escapeHtml(student?.name || entry.studentId)}</td><td>${escapeHtml(entry.status.toUpperCase())}</td><td>${escapeHtml(entry.remarks || '--')}</td><td>${escapeHtml(entry.excuseAttachmentName || '--')}</td></tr>`;
    }).join('');
    popup.document.write(`<!doctype html><html><head><title>NSTP Attendance - ${escapeHtml(sheet.date)}</title><style>body{font-family:Arial,sans-serif;color:#14243d;padding:30px}h1{font-size:20px;margin:0 0 6px}.meta{font-size:12px;color:#53657e;margin:0 0 20px}table{width:100%;border-collapse:collapse;font-size:12px}th,td{border:1px solid #dce3ed;padding:9px;text-align:left}th{background:#eff4fb;text-transform:uppercase}footer{margin-top:20px;font-size:11px;color:#53657e}</style></head><body><h1>BiPSU NSTP Attendance Sheet</h1><p class="meta">${escapeHtml(sheet.topic)} | ${escapeHtml(sheet.date)} | Session ${sheet.sessionNumber} | ${escapeHtml(sheet.group)} | Facilitator: ${escapeHtml(sheet.facilitatorName)}</p><table><thead><tr><th>Student ID</th><th>Student Name</th><th>Status</th><th>Remarks</th><th>Proof Reference</th></tr></thead><tbody>${rows}</tbody></table><footer>Record status: ${escapeHtml(normalizeStage(sheet.status))} | Updated: ${escapeHtml(new Date(sheet.updatedAt).toLocaleString())}</footer></body></html>`);
    popup.document.close();
    popup.focus();
    popup.print();
  };

  const buttonBase = 'inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-[0.78rem] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-50';
  const primaryButton = `${buttonBase} bg-blue-700 text-white shadow-sm shadow-blue-700/15 hover:bg-blue-800`;
  const successButton = `${buttonBase} bg-emerald-600 text-white hover:bg-emerald-700`;
  const secondaryButton = `${buttonBase} border border-[#dbe5f2] bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200`;
  const secondaryBlueButton = `${buttonBase} border border-blue-200 bg-white text-blue-700 hover:bg-blue-50 dark:border-blue-500/30 dark:bg-slate-950 dark:text-blue-200`;
  const dangerButton = `${buttonBase} border border-rose-200 bg-white text-rose-600 hover:bg-rose-50`;
  const fieldClass = 'h-10 !min-h-10 rounded-lg border border-[#dfe7f1] bg-white px-3 text-[0.8rem] text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200';

  return (
    <>
      <PageIntro
        eyebrow={`${activeSession.phase} / Session ${activeSession.sessionNumber}`}
        title={activeSession.title || 'Dated Attendance and Sessions'}
        description={`${activeSession.date} (${activeSession.startTime} - ${activeSession.endTime})  |  ${activeSession.duration} contact hours  |  ${activeSession.group}. Saved sheets remain permanent unless explicitly deleted.`}
        actions={(
          <>
            <button type="button" onClick={openTodaysSession} className={secondaryButton}><CalendarDays className="h-4 w-4" /> Today's session</button>
            <button type="button" onClick={() => { if (!confirmDiscardChanges()) return; setSessionDraft(activeSession); setShowSessionEditor(true); }} className={secondaryButton}><Pencil className="h-4 w-4" /> Session details</button>
            <button type="button" onClick={() => { if (!confirmDiscardChanges()) return; setSessionDraft(newSession(workspace)); setShowSessionEditor(true); }} className={secondaryBlueButton}><Plus className="h-4 w-4" /> New session</button>
            <button type="button" onClick={() => saveSheet()} disabled={sheetMode === 'view' || isSaving} className={primaryButton}><Save className="h-4 w-4" /> {isSaving ? 'Saving...' : 'Save attendance'}</button>
          </>
        )}
      />

      <MunicipalityScopeBanner
        label="Attendance Municipality Context"
        activeMunicipality={workspace.activeMunicipality}
        assignedMunicipalities={workspace.assignedMunicipalities}
        onMunicipalityChange={workspace.setActiveMunicipality}
        recordCount={students.length}
        helper="Attendance sheets, history, exports, and saved entries are limited to the selected assigned municipality scope."
      />

      {showSessionEditor && (
        <div className="fixed inset-0 z-[75] flex justify-end bg-slate-950/45 backdrop-blur-sm">
          <section role="dialog" aria-modal="true" aria-label="Create attendance session" className="h-full w-full max-w-xl overflow-y-auto bg-white p-5 shadow-2xl dark:bg-slate-950">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div><p className="text-[0.67rem] font-bold uppercase tracking-[0.18em] text-blue-700">Attendance Session</p><h2 className="mt-1 text-lg font-bold text-[#112342] dark:text-white">Schedule a dated session</h2><p className="mt-1 text-xs text-slate-500">Create past, current, or future class records tied to the official attendance sheet.</p></div>
              <button type="button" onClick={() => { if (confirmDiscardChanges()) setShowSessionEditor(false); }} aria-label="Close session editor" className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 dark:border-slate-700"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid gap-3.5 sm:grid-cols-2">
              <label className="text-xs font-semibold sm:col-span-2">Event / session title<input value={sessionDraft.title} onChange={(event) => setSessionDraft({ ...sessionDraft, title: event.target.value })} placeholder="NSTP orientation, seminar, workshop..." className={`${fieldClass} mt-1.5 w-full`} /></label>
              <label className="text-xs font-semibold">Session type<select value={sessionDraft.type} onChange={(event) => setSessionDraft({ ...sessionDraft, type: event.target.value as SessionType })} className={`${fieldClass} mt-1.5 w-full`}>{SESSION_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label>
              <label className="text-xs font-semibold">Date<input type="date" value={sessionDraft.date} onChange={(event) => setSessionDraft({ ...sessionDraft, date: event.target.value })} className={`${fieldClass} mt-1.5 w-full`} /></label>
              <label className="text-xs font-semibold">NSTP component<select value={sessionDraft.component === 'Common' ? 'Common Phase' : sessionDraft.component} onChange={(event) => setSessionDraft({ ...sessionDraft, phase: event.target.value === 'Common Phase' ? 'Common Phase' : 'Component Proper', component: event.target.value === 'Common Phase' ? 'Common' : event.target.value as NstpSession['component'] })} className={`${fieldClass} mt-1.5 w-full`}><option>Common Phase</option><option>CWTS</option><option>LTS</option><option value="MTS (Army)">MTS</option><option value="MTS (Navy)">MTS - Navy</option></select></label>
              <label className="text-xs font-semibold">Batch / class group<input list="attendance-groups" value={sessionDraft.group} onChange={(event) => setSessionDraft({ ...sessionDraft, group: event.target.value })} placeholder="Assigned class or batch" className={`${fieldClass} mt-1.5 w-full`} /><datalist id="attendance-groups">{Array.from(new Set(workspace.sessions.map((session) => session.group))).map((group) => <option key={group} value={group} />)}</datalist></label>
              <label className="text-xs font-semibold">Start time<input type="time" value={sessionDraft.startTime} onChange={(event) => setSessionDraft({ ...sessionDraft, startTime: event.target.value })} className={`${fieldClass} mt-1.5 w-full`} /></label>
              <label className="text-xs font-semibold">End time<input type="time" value={sessionDraft.endTime} onChange={(event) => setSessionDraft({ ...sessionDraft, endTime: event.target.value })} className={`${fieldClass} mt-1.5 w-full`} /></label>
              <label className="text-xs font-semibold">Contact hours<input type="number" min={0.5} step={0.5} value={sessionDraft.duration} onChange={(event) => setSessionDraft({ ...sessionDraft, duration: Number(event.target.value) })} className={`${fieldClass} mt-1.5 w-full`} /></label>
              <label className="text-xs font-semibold">Session timeline status<select value={sessionDraft.status} onChange={(event) => setSessionDraft({ ...sessionDraft, status: event.target.value as NstpSession['status'] })} className={`${fieldClass} mt-1.5 w-full`}>{['Upcoming', 'Ongoing', 'Completed', 'Cancelled'].map((status) => <option key={status}>{status}</option>)}</select></label>
              <label className="text-xs font-semibold sm:col-span-2">Venue or delivery mode<input value={sessionDraft.venue} onChange={(event) => setSessionDraft({ ...sessionDraft, venue: event.target.value })} placeholder="Room, venue, or online delivery mode" className={`${fieldClass} mt-1.5 w-full`} /></label>
              <label className="text-xs font-semibold sm:col-span-2">Description / notes<textarea value={sessionDraft.description} onChange={(event) => setSessionDraft({ ...sessionDraft, description: event.target.value })} placeholder="Learning purpose, requirements, or instructions" rows={3} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-[0.8rem] dark:border-slate-700 dark:bg-slate-900" /></label>
            </div>
            <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
              <button type="button" onClick={() => { if (confirmDiscardChanges()) setShowSessionEditor(false); }} className={secondaryButton}>Cancel</button>
              <button type="button" onClick={saveSession} className={primaryButton}><Save className="h-4 w-4" /> Save session</button>
            </div>
          </section>
        </div>
      )}

      <Panel className="border-blue-100 bg-gradient-to-r from-white via-white to-blue-50/70 dark:border-blue-500/20 dark:from-slate-950 dark:to-blue-950/20">
        <div className="grid gap-3 lg:grid-cols-[minmax(16rem,1fr)_minmax(12rem,0.85fr)_minmax(12rem,0.85fr)_auto] lg:items-end">
          <div>
            <p className="text-[0.67rem] font-bold uppercase tracking-[0.16em] text-blue-700">Active Dated Record</p>
            <p className="mt-1.5 text-base font-bold text-[#112342] dark:text-white">{activeSession.title || 'Untitled attendance session'}</p>
            <p className="mt-0.5 text-xs text-slate-500">{activeSession.component === 'Common' ? 'Common Phase' : activeSession.component} / {activeSession.group}</p>
          </div>
          <label className="text-[0.67rem] font-bold uppercase tracking-[0.12em] text-slate-500">
            Attendance date
            <input aria-label="Set attendance date" type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className={`${fieldClass} mt-2 block w-full font-semibold text-[#112342] dark:text-white`} />
          </label>
          <div className="rounded-xl border border-[#e5ebf3] bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-[0.67rem] font-bold uppercase tracking-[0.12em] text-slate-500">Record State</p>
            <div className="mt-1.5 flex items-center justify-between gap-2"><StatusBadge value={normalizeStage(draft.status)} /><span className="text-[0.7rem] font-medium text-slate-500">{students.length} assigned</span></div>
          </div>
          <button type="button" onClick={saveAttendanceDate} disabled={isSaving} className={primaryButton}><CalendarDays className="h-4 w-4" /> {isSaving ? 'Saving...' : 'Apply date'}</button>
        </div>
      </Panel>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Present" value={summary.present} detail="Recorded attendance" icon={UserRound} tone="emerald" progress={percentFor('present')} />
        <StatCard label="Absent" value={summary.absent} detail="Requires follow-up" icon={UserX} tone="rose" progress={percentFor('absent')} />
        <StatCard label="Late" value={summary.late} detail="Late arrival" icon={Clock3} tone="amber" progress={percentFor('late')} />
        <StatCard label="Excused" value={summary.excused} detail="With supporting reason" icon={MinusCircle} tone="slate" progress={percentFor('excused')} />
      </div>

      <Panel className="overflow-hidden p-0">
        <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h2 className="inline-flex items-center gap-2 text-sm font-bold text-[#112342] dark:text-white"><CalendarDays className="h-4 w-4 text-blue-700" /> Session Switcher</h2>
            <p className="mt-0.5 text-xs text-slate-500">Access dated sessions without reducing roster workspace.</p>
          </div>
          <div className="flex flex-1 flex-col gap-2 sm:flex-row lg:max-w-3xl lg:justify-end">
            <select
              aria-label="Quick session switch"
              value={activeSession.id}
              onChange={(event) => {
                const target = calendarRows.find(({ session }) => session.id === event.target.value);
                if (target) guardedSelectSession(target.session, target.sheet ? 'view' : 'edit');
              }}
              className={`${fieldClass} min-w-0 flex-1 lg:max-w-md`}
            >
              {calendarRows.map(({ session, sheet }) => (
                <option key={session.id} value={session.id}>{session.date} / Session {session.sessionNumber} / {session.title} / {calendarLabel(session, sheet)}</option>
              ))}
            </select>
            <button type="button" onClick={openTodaysSession} className={secondaryBlueButton}><CalendarDays className="h-4 w-4" /> Today</button>
            <button type="button" onClick={() => setTimelineExpanded((open) => !open)} aria-expanded={timelineExpanded} className={secondaryButton}>
              {timelineExpanded ? 'Hide sessions' : 'Browse sessions'} <ChevronDown className={`h-4 w-4 transition ${timelineExpanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
        {timelineExpanded && (
          <div className="border-t border-slate-100 bg-slate-50/65 p-4 dark:border-slate-800 dark:bg-slate-900/35">
            <div className="grid max-h-64 gap-2 overflow-y-auto pr-1 md:grid-cols-2 xl:grid-cols-3">
              {calendarRows.map(({ session, sheet }) => (
                <button key={session.id} type="button" onClick={() => guardedSelectSession(session, sheet ? 'view' : 'edit')} className={`relative flex min-h-[3.75rem] w-full items-center justify-between gap-3 overflow-hidden rounded-lg border p-2.5 text-left transition ${session.id === activeSession.id ? 'border-blue-300 bg-white shadow-sm before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-blue-700 dark:bg-blue-500/10' : 'border-[#e5ebf3] bg-white hover:border-blue-200 dark:border-slate-800 dark:bg-slate-950'}`}>
                  <div className="min-w-0 pl-1"><p className={`truncate text-xs font-semibold ${session.id === activeSession.id ? 'text-blue-700' : 'text-[#112342] dark:text-white'}`}>{session.date} / Session {session.sessionNumber}</p><p className="mt-0.5 truncate text-[0.7rem] text-slate-500">{session.title}</p></div>
                  <StatusBadge value={calendarLabel(session, sheet)} />
                </button>
              ))}
            </div>
          </div>
        )}
      </Panel>

      <Panel className="border-blue-100 shadow-[0_20px_48px_-34px_rgba(15,39,78,0.52)] dark:border-blue-500/20">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
            <div>
              <p className="text-[0.67rem] font-bold uppercase tracking-[0.16em] text-blue-700">Attendance Roster</p>
              <h2 className="mt-1 text-lg font-bold text-[#112342] dark:text-white">Student Attendance Sheet</h2>
              <p className="mt-0.5 text-xs text-slate-500">Set each learner status and record remarks or excuse proof for {students.length} assigned students.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge value={normalizeStage(draft.status)} />
              {sheetMode === 'edit' && (
                <select aria-label="Attendance sheet status" value={normalizeStage(draft.status)} onChange={(event) => { setDraft((value) => ({ ...value, status: event.target.value as SheetStage })); setSaveIndicator('Unsaved changes'); }} className={`${fieldClass} font-semibold`}>
                  {SHEET_STAGES.map((stage) => <option key={stage}>{stage}</option>)}
                </select>
              )}
              {sheetMode === 'edit' ? (
                <button type="button" onClick={() => applyBulkStatus('present')} disabled={isSaving} className={secondaryBlueButton}>
                  <Check className="h-4 w-4" /> {selectedStudentIds.length ? 'Selected present' : 'Mark all present'}
                </button>
              ) : null}
              {sheetMode === 'edit' ? (
                <button type="button" onClick={() => applyBulkStatus('absent')} disabled={isSaving} className={dangerButton}>
                  <UserX className="h-4 w-4" /> {selectedStudentIds.length ? 'Selected absent' : 'Mark all absent'}
                </button>
              ) : null}
              {workspace.attendance.some((sheet) => sheet.id === draft.id) && (
                <button type="button" onClick={() => openSpreadsheet(activeSession, draft)} className={secondaryBlueButton}><FileSpreadsheet className="h-4 w-4" /> Open spreadsheet</button>
              )}
              <button type="button" onClick={() => { if (sheetMode === 'edit' && !confirmDiscardChanges()) return; setSheetMode(sheetMode === 'edit' ? 'view' : 'edit'); }} className={secondaryButton}>{sheetMode === 'edit' ? 'View mode' : 'Edit correction'}</button>
            </div>
          </div>
          <div className="mb-4 flex flex-col gap-2.5 rounded-xl bg-[#f7f9fc] p-2.5 dark:bg-slate-900/65 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row">
              <label className="relative min-w-0 flex-1 lg:max-w-sm"><Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" /><input aria-label="Search attendance roster" value={rosterSearch} onChange={(event) => setRosterSearch(event.target.value)} placeholder="Search student name or ID" className={`${fieldClass} w-full pl-10`} /></label>
              <select aria-label="Filter roster attendance status" value={rosterStatus} onChange={(event) => setRosterStatus(event.target.value)} className={`${fieldClass} capitalize`}><option value="all">All attendance status</option>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select>
            </div>
            <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3 lg:border-l lg:border-t-0 lg:pl-3 lg:pt-0 dark:border-slate-700">
              <span className="text-[0.67rem] font-bold uppercase tracking-[0.12em] text-slate-500">Export</span>
              <select aria-label="Attendance export range" value={exportRange} onChange={(event) => setExportRange(event.target.value as typeof exportRange)} className={fieldClass}><option value="date">Selected date</option><option value="week">Week</option><option value="month">Month</option><option value="semester">Semester</option></select>
              <button type="button" onClick={() => exportAttendance('excel')} className={secondaryBlueButton} title="Export Excel"><FileSpreadsheet className="h-4 w-4" /> Excel</button>
              <button type="button" onClick={() => exportAttendance('pdf')} className={secondaryBlueButton} title="Export PDF"><Download className="h-4 w-4" /> PDF</button>
            </div>
          </div>
          {filteredStudents.length ? (
            <>
            <div className="hidden max-h-[68vh] overflow-y-auto rounded-xl border border-[#edf1f6] md:block">
              <table className="w-full table-fixed text-[0.8rem]">
                <colgroup><col className="w-[5%]" /><col className="w-[25%]" /><col className="w-[15%]" /><col className="w-[34%]" /><col className="w-[21%]" /></colgroup>
                <thead className="sticky top-0 z-10 bg-[#f7f9fc] text-left text-[0.64rem] font-bold uppercase tracking-[0.12em] text-slate-500 shadow-sm dark:bg-slate-900"><tr><th className="px-4 py-2.5"><input type="checkbox" checked={allSelected} onChange={toggleAll} disabled={sheetMode === 'view'} aria-label="Select visible students" className="h-4 !min-h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600" /></th><th className="sticky left-0 z-20 bg-[#f7f9fc] px-3 py-2.5 shadow-[1px_0_0_#edf1f6] dark:bg-slate-900 dark:shadow-[1px_0_0_#1e293b]">Student</th><th className="px-3 py-2.5">Status</th><th className="px-3 py-2.5">Remarks</th><th className="px-3 py-2.5">Excuse Proof</th></tr></thead>
                <tbody>{displayedStudents.map((student, index) => {
                  const row = entries.find((value) => value.studentId === student.id)!;
                  const dirty = dirtyStudentIds.includes(student.id);
                  return (
                    <tr key={student.id} className={`border-b border-[#edf1f6] transition hover:bg-blue-50/35 dark:border-slate-800 dark:hover:bg-slate-900 ${dirty ? 'bg-amber-50/60 dark:bg-amber-500/10' : ''}`}>
                      <td className="px-4 py-2.5"><input type="checkbox" checked={selectedStudentIds.includes(student.id)} onChange={() => toggleSelection(student.id)} disabled={sheetMode === 'view'} aria-label={`Select ${student.name}`} className="h-4 !min-h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600" /></td>
                      <td className={`sticky left-0 z-10 min-w-0 px-3 py-2.5 shadow-[1px_0_0_#edf1f6] dark:shadow-[1px_0_0_#1e293b] ${dirty ? 'bg-amber-50 dark:bg-amber-500/10' : 'bg-white dark:bg-slate-950'}`}><p className="truncate font-semibold text-[#112342] dark:text-white">{((rosterPage - 1) * rosterPageSize) + index + 1}. {student.name}</p><p className="mt-0.5 truncate text-[0.7rem] text-slate-500">{student.studentId}{dirty ? ' / Modified' : ''}</p></td>
                      <td className="px-3 py-2.5"><div className="grid grid-cols-4 gap-1">{STATUSES.map((status) => <button key={status} type="button" disabled={sheetMode === 'view' || isSaving} onClick={() => setRowStatus(student.id, status)} className={`h-8 rounded-lg border text-[0.68rem] font-bold uppercase transition disabled:opacity-70 ${statusToggleClass(status, row.status === status)}`} aria-label={`Mark ${student.name} ${status}`}>{status[0]}</button>)}</div></td>
                      <td className="px-3 py-2.5"><input disabled={sheetMode === 'view' || isSaving} value={row.remarks} onChange={(event) => updateEntry(student.id, { remarks: event.target.value })} placeholder={row.status === 'excused' ? 'Reason required' : 'Optional remarks'} className="h-9 !min-h-9 w-full min-w-0 rounded-lg border border-[#dfe7f1] bg-white px-2.5 text-xs outline-none transition focus:border-blue-500 disabled:bg-slate-50 dark:border-slate-700 dark:bg-slate-900" /></td>
                      <td className="px-3 py-2.5"><input disabled={sheetMode === 'view' || isSaving || row.status !== 'excused'} value={row.excuseAttachmentName || ''} onChange={(event) => updateEntry(student.id, { excuseAttachmentName: event.target.value })} placeholder="Filename/link" className="h-9 !min-h-9 w-full min-w-0 rounded-lg border border-[#dfe7f1] bg-white px-2.5 text-xs outline-none transition focus:border-blue-500 disabled:bg-slate-50 dark:border-slate-700 dark:bg-slate-900" /></td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
            <div className="grid gap-3 md:hidden">
              {displayedStudents.map((student, index) => {
                const row = entries.find((value) => value.studentId === student.id)!;
                const dirty = dirtyStudentIds.includes(student.id);
                return (
                  <article key={student.id} className={`rounded-lg border p-2.5 text-[0.8rem] ${dirty ? 'border-amber-200 bg-amber-50/70 dark:bg-amber-500/10' : 'border-[#edf1f6]'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <label className="flex min-w-0 items-start gap-3">
                        <input type="checkbox" checked={selectedStudentIds.includes(student.id)} onChange={() => toggleSelection(student.id)} disabled={sheetMode === 'view'} aria-label={`Select ${student.name}`} className="mt-1 h-4 !min-h-4 w-4 rounded border-slate-300 text-blue-700" />
                        <span className="min-w-0"><span className="block truncate font-semibold text-[#112342] dark:text-white">{((rosterPage - 1) * rosterPageSize) + index + 1}. {student.name}</span><span className="text-xs text-slate-500">{student.studentId}{dirty ? ' / Modified' : ''}</span></span>
                      </label>
                      <select disabled={sheetMode === 'view' || isSaving} value={row.status} onChange={(event) => setRowStatus(student.id, event.target.value as AttendanceStatus)} className={`max-w-[7.5rem] rounded-lg border px-2 py-2 text-xs font-semibold capitalize ${statusControlClass(row.status)}`}>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select>
                    </div>
                    <div className="mt-3 grid gap-2">
                      <input disabled={sheetMode === 'view' || isSaving} value={row.remarks} onChange={(event) => updateEntry(student.id, { remarks: event.target.value })} placeholder={row.status === 'excused' ? 'Excuse reason required' : 'Optional remarks'} className="h-9 !min-h-9 w-full rounded-lg border border-[#dfe7f1] px-3 text-xs disabled:bg-slate-50 dark:border-slate-700 dark:bg-slate-900" />
                      {row.status === 'excused' ? <input disabled={sheetMode === 'view' || isSaving} value={row.excuseAttachmentName || ''} onChange={(event) => updateEntry(student.id, { excuseAttachmentName: event.target.value })} placeholder="Proof filename or reference link" className="h-9 !min-h-9 w-full rounded-lg border border-[#dfe7f1] px-3 text-xs disabled:bg-slate-50 dark:border-slate-700 dark:bg-slate-900" /> : null}
                    </div>
                  </article>
                );
              })}
            </div>
            <Pager page={rosterPage} totalPages={Math.ceil(filteredStudents.length / rosterPageSize)} onPage={setRosterPage} total={filteredStudents.length} pageSize={rosterPageSize} onPageSize={(size) => setRosterPageSize(size)} pageSizeOptions={[10, 25, 50, 100]} />
            </>
          ) : <EmptyState title={students.length ? 'No students match the roster filters' : 'No students assigned to this session'} body={students.length ? 'Try another student name or attendance status.' : 'Review the session group or component selection before recording attendance.'} />}
          <div className="sticky bottom-3 z-10 mt-4 flex flex-col gap-3 rounded-xl border border-blue-100 bg-blue-50/90 p-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between dark:border-blue-500/20 dark:bg-blue-500/10">
            <div>
              <p className="text-xs font-medium text-blue-700 dark:text-blue-200">Attendance records are stored by dated session and remain available for review and correction.</p>
              <p className="mt-1 text-xs font-bold text-blue-800 dark:text-blue-100">{saveIndicator}{hasUnsavedChanges ? ` / ${dirtyStudentIds.length} modified row${dirtyStudentIds.length === 1 ? '' : 's'}` : ''}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => saveSheet()} disabled={sheetMode === 'view' || isSaving} className={hasUnsavedChanges ? primaryButton : secondaryBlueButton}><Save className="h-4 w-4" /> {isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save Changes' : 'Save current'}</button>
              <button type="button" onClick={() => saveSheet('Submitted')} disabled={sheetMode === 'view' || isSaving} className={primaryButton}><Send className="h-4 w-4" /> Submit</button>
              <button type="button" onClick={() => saveSheet('Completed')} disabled={sheetMode === 'view' || isSaving} className={successButton}><Check className="h-4 w-4" /> Complete</button>
            </div>
          </div>
      </Panel>

      <Panel>
        <div className="mb-3.5 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div><h2 className="inline-flex items-center gap-2 text-base font-bold"><Filter className="h-4 w-4 text-blue-700" /> Attendance History</h2><p className="text-xs text-slate-500">Permanent dated records and sessions missing a submitted sheet.</p></div>
          <div className="flex flex-wrap gap-2">
            <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} aria-label="Date from" className={fieldClass} />
            <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} aria-label="Date to" className={fieldClass} />
            <input value={topicFilter} onChange={(event) => setTopicFilter(event.target.value)} placeholder="Topic search" className={fieldClass} />
            <select value={componentFilter} onChange={(event) => setComponentFilter(event.target.value)} className={fieldClass}><option value="all">All components</option><option>Common</option>{['CWTS', 'LTS', 'MTS (Army)', 'MTS (Navy)'].map((item) => <option key={item}>{item}</option>)}</select>
            <select value={municipalityFilter} onChange={(event) => setMunicipalityFilter(event.target.value)} className={fieldClass}><option value="all">All groups</option>{(workspace.user.municipalities || []).map((item) => <option key={item}>{item}</option>)}</select>
            <select aria-label="History record status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className={`${fieldClass} capitalize`}><option value="all">Any attendance</option><option value="missing">Missing sheet</option>{SHEET_STAGES.map((stage) => <option key={stage}>{stage}</option>)}{STATUSES.map((item) => <option key={item}>{item}</option>)}</select>
          </div>
        </div>
        {historyRows.length ? (
          <>
          <div className="grid gap-3 lg:grid-cols-2">
            {displayedHistoryRows.map(({ session, sheet }) => (
              <article
                key={session.id}
                role="button"
                tabIndex={0}
                onClick={() => sheet ? openSpreadsheet(session, sheet) : guardedSelectSession(session, 'edit')}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    sheet ? openSpreadsheet(session, sheet) : guardedSelectSession(session, 'edit');
                  }
                }}
                className={`cursor-pointer rounded-xl border p-3.5 transition hover:-translate-y-0.5 hover:shadow-md ${session.id === activeSession.id ? 'border-blue-300 bg-blue-50/50 dark:bg-blue-500/10' : 'border-[#edf1f6] bg-white dark:border-slate-800 dark:bg-slate-950'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div><p className="text-[0.65rem] font-bold uppercase tracking-[0.13em] text-blue-700">{new Date(`${session.date}T00:00:00`).toLocaleDateString()} / Session {session.sessionNumber}</p><h3 className="mt-1.5 text-sm font-bold text-[#112342] dark:text-white">{session.title}</h3></div>
                  <StatusBadge value={sheet ? normalizeStage(sheet.status) : 'Missing attendance'} />
                </div>
                <p className="mt-1.5 text-[0.7rem] text-slate-500">{session.component === 'Common' ? 'Common Phase' : session.component} / {session.group} / {session.duration} hours</p>
                {sheet ? (
                  <div className="mt-3 grid grid-cols-4 gap-1.5 text-center text-[0.7rem] font-semibold">
                    <div className="rounded-lg bg-emerald-50 py-1.5 text-emerald-700">P {sheet.entries.filter((entry) => entry.status === 'present').length}</div>
                    <div className="rounded-lg bg-rose-50 py-1.5 text-rose-700">A {sheet.entries.filter((entry) => entry.status === 'absent').length}</div>
                    <div className="rounded-lg bg-amber-50 py-1.5 text-amber-700">L {sheet.entries.filter((entry) => entry.status === 'late').length}</div>
                    <div className="rounded-lg bg-slate-100 py-1.5 text-slate-700">E {sheet.entries.filter((entry) => entry.status === 'excused').length}</div>
                  </div>
                ) : <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-800">Attendance sheet has not been recorded for this scheduled session.</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  {sheet ? <button type="button" onClick={(event) => { event.stopPropagation(); openSpreadsheet(session, sheet); }} className={primaryButton}><FileSpreadsheet className="h-4 w-4" /> View Attendance</button> : <button type="button" onClick={(event) => { event.stopPropagation(); guardedSelectSession(session, 'edit'); }} className={primaryButton}><Plus className="h-4 w-4" /> Record attendance</button>}
                  <button type="button" onClick={(event) => { event.stopPropagation(); editHistorySheet(session); }} className={secondaryBlueButton}><Pencil className="h-4 w-4" /> Edit Attendance</button>
                  {sheet && <button type="button" onClick={(event) => { event.stopPropagation(); setDeleteId(sheet.id); }} disabled={isSaving} className={dangerButton}><Trash2 className="h-4 w-4" /> Delete</button>}
                </div>
              </article>
            ))}
          </div>
          <Pager page={historyPage} totalPages={Math.ceil(historyRows.length / historyPageSize)} onPage={setHistoryPage} total={historyRows.length} pageSize={historyPageSize} onPageSize={(size) => setHistoryPageSize(size)} pageSizeOptions={[10, 25, 50]} />
          </>
        ) : <EmptyState title="No attendance history found" body="Try another date range or create a new Common Phase session." />}
      </Panel>
      {historyViewer && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-6">
          <section role="dialog" aria-modal="true" aria-label="Attendance spreadsheet record" className="flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-950">
            <header className="border-b border-slate-100 p-4 dark:border-slate-800">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[0.67rem] font-bold uppercase tracking-[0.18em] text-blue-700">Official Attendance Spreadsheet</p>
                  <h2 className="mt-1 text-lg font-bold text-[#112342] dark:text-white">{historyViewer.sheet.topic}</h2>
                  <p className="mt-1 text-xs text-slate-500">{historyViewer.sheet.date} / Session {historyViewer.sheet.sessionNumber} / {historyViewer.sheet.group} / Facilitator: {historyViewer.sheet.facilitatorName}</p>
                  <p className="mt-1 text-[0.7rem] text-slate-400">Last saved: {new Date(historyViewer.sheet.updatedAt).toLocaleString()}</p>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <button type="button" onClick={() => exportSheets([historyViewer.sheet], 'excel', `attendance-${historyViewer.sheet.date}-session-${historyViewer.sheet.sessionNumber}`)} className={primaryButton}><FileSpreadsheet className="h-4 w-4" /> Excel</button>
                  <button type="button" onClick={() => exportSheets([historyViewer.sheet], 'pdf', `attendance-${historyViewer.sheet.date}-session-${historyViewer.sheet.sessionNumber}`)} className={secondaryBlueButton}><Download className="h-4 w-4" /> PDF</button>
                  <button type="button" onClick={() => printSheet(historyViewer.sheet)} className={secondaryBlueButton}><Printer className="h-4 w-4" /> Print</button>
                  <button type="button" onClick={() => downloadProofRegister(historyViewer.sheet)} className={secondaryBlueButton}><Download className="h-4 w-4" /> Proof register</button>
                  <button type="button" onClick={() => { if (confirmDiscardChanges()) setHistoryViewer(null); }} aria-label="Close spreadsheet record" className="rounded-lg border border-slate-200 p-2 text-slate-500 dark:border-slate-700"><X className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-4">
                {STATUSES.map((status) => (
                  <div key={status} className={`rounded-lg border px-3 py-1.5 text-xs font-semibold capitalize ${statusControlClass(status)}`}>
                    {status} <span className="float-right text-sm">{historyViewer.sheet.entries.filter((entry) => entry.status === status).length}</span>
                  </div>
                ))}
              </div>
            </header>
            <div className="flex flex-col gap-2.5 border-b border-slate-100 p-3.5 sm:flex-row dark:border-slate-800">
              <label className="relative min-w-0 flex-1"><Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" /><input aria-label="Search student in spreadsheet" value={viewerSearch} onChange={(event) => setViewerSearch(event.target.value)} placeholder="Search student name or ID" className={`${fieldClass} w-full pl-9`} /></label>
              <select aria-label="Filter spreadsheet attendance status" value={viewerStatus} onChange={(event) => setViewerStatus(event.target.value)} className={`${fieldClass} capitalize`}><option value="all">All attendance status</option>{STATUSES.map((status) => <option key={status}>{status}</option>)}</select>
              <button type="button" onClick={() => editHistorySheet(historyViewer.session)} className={secondaryBlueButton}><Pencil className="h-4 w-4" /> Edit attendance</button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-3.5">
              {viewerEntries.length ? (
                <>
                  <div className="hidden overflow-hidden rounded-xl border border-[#edf1f6] md:block">
                    <table className="w-full table-fixed text-[0.8rem]">
                      <colgroup><col className="w-[25%]" /><col className="w-[15%]" /><col className="w-[28%]" /><col className="w-[18%]" /><col className="w-[14%]" /></colgroup>
                      <thead className="sticky top-0 z-10 bg-[#f7f9fc] text-left text-[0.64rem] font-bold uppercase tracking-[0.12em] text-slate-500 dark:bg-slate-900"><tr><th className="px-3 py-2.5">Student</th><th className="px-3 py-2.5">Status</th><th className="px-3 py-2.5">Remarks</th><th className="px-3 py-2.5">Proof Reference</th><th className="px-3 py-2.5">Saved</th></tr></thead>
                      <tbody>{displayedViewerEntries.map(({ entry, student }) => (
                        <tr key={entry.studentId} className="border-b border-slate-100 dark:border-slate-800">
                          <td className="px-3 py-2.5 font-semibold text-[#112342] dark:text-white">{student?.name || entry.studentId}<p className="text-[0.7rem] font-normal text-slate-500">{student?.studentId || entry.studentId}</p></td>
                          <td className="px-3 py-2.5"><StatusBadge value={entry.status} /></td>
                          <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">{entry.remarks || '--'}</td>
                          <td className="truncate px-3 py-2.5 text-slate-600 dark:text-slate-300">{entry.excuseAttachmentName || '--'}</td>
                          <td className="px-3 py-2.5 text-[0.7rem] text-slate-500">{new Date(historyViewer.sheet.updatedAt).toLocaleDateString()}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                  <div className="grid gap-2 md:hidden">
                    {displayedViewerEntries.map(({ entry, student }) => (
                      <article key={entry.studentId} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                        <div className="flex items-start justify-between gap-2"><div><p className="font-semibold">{student?.name || entry.studentId}</p><p className="text-xs text-slate-500">{student?.studentId || entry.studentId}</p></div><StatusBadge value={entry.status} /></div>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{entry.remarks || 'No remarks recorded.'}</p>
                        {entry.excuseAttachmentName && <p className="mt-2 truncate text-xs text-blue-700">Proof: {entry.excuseAttachmentName}</p>}
                      </article>
                    ))}
                  </div>
                  <Pager page={viewerPage} totalPages={Math.ceil(viewerEntries.length / viewerPageSize)} onPage={setViewerPage} total={viewerEntries.length} pageSize={viewerPageSize} onPageSize={setViewerPageSize} pageSizeOptions={[10, 25, 50, 100]} />
                </>
              ) : <EmptyState title="No attendance entries match" body="Adjust the student search or attendance status filter." />}
            </div>
          </section>
        </div>
      )}
      <ConfirmDialog open={Boolean(deleteId)} title="Delete dated attendance sheet?" body="This permanently removes the saved student statuses and remarks for the selected session. The scheduled session remains visible as missing attendance." onCancel={() => setDeleteId(null)} onConfirm={deleteSheet} />
    </>
  );
}
