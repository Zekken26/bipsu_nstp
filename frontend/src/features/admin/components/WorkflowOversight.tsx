import { useMemo, useState } from 'react';
import { Bell, CalendarCheck, Download, Eye, GraduationCap, Save, Settings, ShieldCheck, TrendingUp, X } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { loadStudents } from '../../../data/nstpData';
import {
  addAudit,
  allStudentProgress,
  finalGrade,
  loadAttendanceSheets,
  loadAuditLog,
  loadDetailedGrades,
  loadGradingSettings,
  loadSessions,
  loadWorkflowNotices,
  saveDetailedGrades,
  saveGradingSettings,
  saveWorkflowNotices,
  workflowSummary,
  type GradingSettings,
  type WorkflowNotice,
} from '../../../data/workflowData';
import { EmptyState, Pager, Panel, StatCard, StatusBadge, useModalEscape } from '../../facilitator/components/FacilitatorUI';
import AdminLearningMaterialsPanel from './AdminLearningMaterialsPanel';

type Tab = 'overview' | 'attendance' | 'grades' | 'classification' | 'materials' | 'notices' | 'audit' | 'settings';
const actor = { id: 'admin-1', name: 'Administrator', role: 'admin' };

export default function WorkflowOversight() {
  const [tab, setTab] = useState<Tab>('overview');
  const [revision, setRevision] = useState(0);
  const [dateFilter, setDateFilter] = useState('');
  const [componentFilter, setComponentFilter] = useState('all');
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [sheetStatus, setSheetStatus] = useState('all');
  const [settings, setSettings] = useState<GradingSettings>(() => loadGradingSettings());
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeMessage, setNoticeMessage] = useState('');
  const [noticeTarget, setNoticeTarget] = useState<WorkflowNotice['component']>('All');
  const [selectedSheetId, setSelectedSheetId] = useState<string | null>(null);
  const [overviewPage, setOverviewPage] = useState(1);
  const [overviewPageSize, setOverviewPageSize] = useState(10);
  const [attendancePage, setAttendancePage] = useState(1);
  const [attendancePageSize, setAttendancePageSize] = useState(25);
  const [gradePage, setGradePage] = useState(1);
  const [gradePageSize, setGradePageSize] = useState(25);
  const [classificationPage, setClassificationPage] = useState(1);
  const [classificationPageSize, setClassificationPageSize] = useState(25);
  const [auditPage, setAuditPage] = useState(1);
  const [auditPageSize, setAuditPageSize] = useState(25);
  const [sheetEntryPage, setSheetEntryPage] = useState(1);
  const [sheetEntryPageSize, setSheetEntryPageSize] = useState(25);
  const sessions = loadSessions();
  const sheets = loadAttendanceSheets();
  const grades = loadDetailedGrades();
  const notices = loadWorkflowNotices();
  const audit = loadAuditLog();
  const summary = workflowSummary();
  const students = loadStudents();
  const progress = allStudentProgress();
  const tabs: Array<[Tab, string]> = [['overview', 'Overview'], ['attendance', 'Attendance Monitoring'], ['grades', 'Grade Release'], ['classification', 'Classification'], ['materials', 'Learning Materials'], ['notices', 'Announcements'], ['audit', 'Audit Logs'], ['settings', 'Settings']];

  const filteredSheets = useMemo(() => sheets.filter((sheet) => (!dateFilter || sheet.date === dateFilter) && (componentFilter === 'all' || sheet.component === componentFilter) && (sheetStatus === 'all' || sheet.status === sheetStatus || (sheetStatus === 'Completed' && sheet.status === 'Complete')) && (!attendanceSearch || `${sheet.facilitatorName} ${sheet.topic} ${sheet.group} ${sheet.municipality}`.toLowerCase().includes(attendanceSearch.toLowerCase()))), [sheets, dateFilter, componentFilter, sheetStatus, attendanceSearch, revision]);
  const commonSessions = sessions.filter((session) => session.phase === 'Common Phase');
  const displayedSessions = commonSessions.slice((overviewPage - 1) * overviewPageSize, overviewPage * overviewPageSize);
  const displayedSheets = filteredSheets.slice((attendancePage - 1) * attendancePageSize, attendancePage * attendancePageSize);
  const displayedGrades = grades.slice((gradePage - 1) * gradePageSize, gradePage * gradePageSize);
  const displayedProgress = progress.slice((classificationPage - 1) * classificationPageSize, classificationPage * classificationPageSize);
  const displayedAudit = audit.slice((auditPage - 1) * auditPageSize, auditPage * auditPageSize);
  const selectedSheet = sheets.find((sheet) => sheet.id === selectedSheetId);
  useModalEscape({
    open: Boolean(selectedSheet),
    onClose: () => setSelectedSheetId(null),
  });
  const displayedSheetEntries = selectedSheet?.entries.slice((sheetEntryPage - 1) * sheetEntryPageSize, sheetEntryPage * sheetEntryPageSize) || [];
  const exportAttendance = async (selection = filteredSheets) => {
    if (!selection.length) {
      toast.error('No saved attendance records match the export selection.');
      return;
    }
    const XLSX = await import('xlsx');
    const rows = selection.flatMap((sheet) => sheet.entries.map((entry) => {
      const student = students.find((value) => value.id === entry.studentId);
      return [sheet.date, sheet.sessionNumber, sheet.topic, sheet.facilitatorName, sheet.municipality, sheet.component, student?.studentId || entry.studentId, student?.name || entry.studentId, entry.status, entry.remarks || ''];
    }));
    const detailSheet = XLSX.utils.aoa_to_sheet([['Date', 'Session', 'Topic', 'Facilitator', 'Municipality', 'Component', 'Student ID', 'Student Name', 'Status', 'Remarks'], ...rows]);
    detailSheet['!cols'] = [{ wch: 14 }, { wch: 10 }, { wch: 34 }, { wch: 25 }, { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 28 }, { wch: 14 }, { wch: 30 }];
    if (detailSheet['!ref']) detailSheet['!autofilter'] = { ref: detailSheet['!ref'] };
    const summarySheet = XLSX.utils.aoa_to_sheet([['Date', 'Session', 'Topic', 'Facilitator', 'Group', 'Present', 'Absent', 'Late', 'Excused', 'Status'], ...selection.map((sheet) => [
      sheet.date, sheet.sessionNumber, sheet.topic, sheet.facilitatorName, sheet.group,
      sheet.entries.filter((entry) => entry.status === 'present').length,
      sheet.entries.filter((entry) => entry.status === 'absent').length,
      sheet.entries.filter((entry) => entry.status === 'late').length,
      sheet.entries.filter((entry) => entry.status === 'excused').length,
      sheet.status,
    ])]);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, summarySheet, 'Sheet Summary');
    XLSX.utils.book_append_sheet(book, detailSheet, 'Student Attendance');
    XLSX.writeFile(book, `nstp-attendance-monitoring-${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success('Attendance spreadsheet exported.');
  };
  const exportGrades = async () => {
    if (!grades.length) {
      toast.error('No facilitator grade records are available to export.');
      return;
    }
    const XLSX = await import('xlsx');
    const rows = grades.map((grade) => {
      const student = students.find((value) => value.id === grade.studentId);
      return [
        student?.studentId || grade.studentId,
        student?.name || grade.studentId,
        student?.component || '',
        grade.facilitatorId,
        grade.attendance ?? '',
        grade.assessments ?? '',
        grade.activities ?? '',
        grade.participation ?? '',
        grade.majorExam ?? '',
        finalGrade(grade, settings) ?? '',
        grade.overrideFinal ?? '',
        grade.status,
        grade.feedback,
      ];
    });
    const sheet = XLSX.utils.aoa_to_sheet([['Student ID', 'Student Name', 'Component', 'Facilitator ID', 'Attendance', 'Assessments', 'Activities', 'Participation', 'Major Exam', 'Final Grade', 'Override', 'Status', 'Feedback'], ...rows]);
    sheet['!cols'] = [{ wch: 16 }, { wch: 28 }, { wch: 16 }, { wch: 18 }, { wch: 13 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 16 }, { wch: 34 }];
    if (sheet['!ref']) sheet['!autofilter'] = { ref: sheet['!ref'] };
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, 'Facilitator Gradebooks');
    XLSX.writeFile(book, `nstp-grade-monitoring-${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success('Grade monitoring spreadsheet exported.');
  };
  const setGradeStatus = (studentId: string, status: typeof grades[number]['status']) => {
    saveDetailedGrades(grades.map((grade) => grade.studentId === studentId ? { ...grade, status, updatedAt: new Date().toISOString() } : grade));
    addAudit(actor, status === 'Released' ? 'Grade released' : 'Grade reviewed', 'Gradebook', studentId, `Grade workflow updated to ${status}.`);
    setRevision((value) => value + 1);
    toast.success(`Grade status updated to ${status}.`);
  };
  const publishNotice = () => {
    if (!noticeTitle.trim() || !noticeMessage.trim()) {
      toast.error('Enter an announcement title and message.');
      return;
    }
    const notice: WorkflowNotice = { id: `admin-notice-${Date.now()}`, actorId: actor.id, actorName: actor.name, audience: 'student', municipality: 'All', component: noticeTarget, title: noticeTitle.trim(), message: noticeMessage.trim(), priority: 'Normal', status: 'Published', createdAt: new Date().toISOString() };
    saveWorkflowNotices([notice, ...notices]);
    addAudit(actor, 'Announcement published', 'Notice', notice.id, `Audience: ${notice.component}.`);
    setNoticeTitle('');
    setNoticeMessage('');
    setRevision((value) => value + 1);
    toast.success('Announcement published.');
  };
  const saveRules = () => {
    const total = settings.attendance + settings.assessments + settings.activities + settings.participation + settings.majorExam;
    if (total !== 100) {
      toast.error('Grading breakdown must total 100%.');
      return;
    }
    saveGradingSettings({ ...settings, updatedAt: new Date().toISOString() });
    addAudit(actor, 'System settings updated', 'Settings', 'grading-breakdown', 'Updated grade computation policy.');
    setRevision((value) => value + 1);
    toast.success('System grading settings saved.');
  };

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-white to-blue-50 p-5 dark:border-blue-500/20 dark:from-slate-950 dark:to-blue-950/30">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">Common Phase and Academic Oversight</p>
        <h2 className="mt-2 text-2xl font-semibold">NSTP Workflow Control Center</h2>
        <p className="mt-2 text-sm text-slate-500">Monitor the flexible 25 contact-hour phase, persistent facilitator attendance records, grade release, classification readiness, and accountability logs.</p>
      </div>
      <div className="flex flex-wrap gap-2">{tabs.map(([value, label]) => <button type="button" key={value} onClick={() => setTab(value)} className={`rounded-xl px-4 py-2 text-sm font-semibold ${tab === value ? 'bg-blue-700 text-white' : 'border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200'}`}>{label}</button>)}</div>
      {tab === 'overview' && <>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="All Students" value={summary.students} detail="System roster" icon={GraduationCap} tone="blue" />
          <StatCard label="Common Sessions" value={sessions.filter((session) => session.phase === 'Common Phase').length} detail="Flexible contact-hour schedule" icon={CalendarCheck} tone="indigo" />
          <StatCard label="Attendance Completion" value={`${summary.attendanceCompletion}%`} detail="Saved sheets vs sessions" icon={TrendingUp} tone="emerald" />
          <StatCard label="Grade Release" value={`${summary.gradeRelease}%`} detail="Visible to students" icon={ShieldCheck} tone="amber" />
        </div>
        <Panel>
          <h3 className="text-lg font-bold">Common Phase Schedule and Completion</h3>
          <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-900"><tr><th className="p-3">Date</th><th className="p-3">Session</th><th className="p-3">Type</th><th className="p-3">Hours</th><th className="p-3">Attendance Sheet</th><th className="p-3">Status</th></tr></thead><tbody>{displayedSessions.map((session) => <tr key={session.id} className="border-b dark:border-slate-800"><td className="p-3">{session.date}</td><td className="p-3 font-semibold">{session.title}</td><td className="p-3">{session.type}</td><td className="p-3">{session.duration}</td><td className="p-3"><StatusBadge value={sheets.find((sheet) => sheet.sessionId === session.id)?.status || 'Missing attendance'} /></td><td className="p-3"><StatusBadge value={session.status} /></td></tr>)}</tbody></table></div>
          <Pager page={overviewPage} totalPages={Math.ceil(commonSessions.length / overviewPageSize)} onPage={setOverviewPage} total={commonSessions.length} pageSize={overviewPageSize} onPageSize={(size) => { setOverviewPageSize(size); setOverviewPage(1); }} pageSizeOptions={[10, 25, 50]} />
        </Panel>
      </>}
      {tab === 'attendance' && <Panel>
        <div className="flex flex-col justify-between gap-3 md:flex-row"><div><h3 className="text-lg font-bold">Attendance Monitoring</h3><p className="text-sm text-slate-500">Open and export dated records saved by facilitators without editing their source sheets.</p></div><button type="button" onClick={() => exportAttendance()} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white"><Download className="h-4 w-4" /> Export Excel</button></div>
        <div className="my-4 flex flex-wrap gap-3"><input type="date" value={dateFilter} onChange={(event) => { setDateFilter(event.target.value); setAttendancePage(1); }} className="rounded-xl border px-3 py-2 dark:border-slate-700 dark:bg-slate-900" /><input value={attendanceSearch} onChange={(event) => { setAttendanceSearch(event.target.value); setAttendancePage(1); }} placeholder="Facilitator, group, municipality, session" className="min-w-[260px] flex-1 rounded-xl border px-3 py-2 dark:border-slate-700 dark:bg-slate-900" /><select value={componentFilter} onChange={(event) => { setComponentFilter(event.target.value); setAttendancePage(1); }} className="rounded-xl border px-3 py-2 dark:border-slate-700 dark:bg-slate-900"><option value="all">All components</option>{['Common', 'CWTS', 'LTS', 'MTS (Army)', 'MTS (Navy)'].map((value) => <option key={value}>{value}</option>)}</select><select value={sheetStatus} onChange={(event) => { setSheetStatus(event.target.value); setAttendancePage(1); }} className="rounded-xl border px-3 py-2 dark:border-slate-700 dark:bg-slate-900"><option value="all">Any sheet status</option>{['Draft', 'Ongoing', 'Submitted', 'Completed', 'Complete', 'Needs Review'].map((value) => <option key={value}>{value}</option>)}</select></div>
        {filteredSheets.length ? <>
          <div className="overflow-x-auto"><table className="w-full min-w-[940px] text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-900"><tr><th className="p-3">Date</th><th className="p-3">Session / Topic</th><th className="p-3">Facilitator</th><th className="p-3">Group</th><th className="p-3">Summary</th><th className="p-3">Sheet Status</th><th className="p-3">Open</th></tr></thead><tbody>{displayedSheets.map((sheet) => <tr key={sheet.id} className="border-b dark:border-slate-800"><td className="p-3">{sheet.date}</td><td className="p-3 font-semibold">{sheet.topic}</td><td className="p-3">{sheet.facilitatorName}</td><td className="p-3">{sheet.group}</td><td className="p-3">{['present', 'absent', 'late', 'excused'].map((value) => `${value[0].toUpperCase()}: ${sheet.entries.filter((entry) => entry.status === value).length}`).join(' / ')}</td><td className="p-3"><StatusBadge value={sheet.status} /></td><td className="p-3"><button type="button" onClick={() => { setSelectedSheetId(sheet.id); setSheetEntryPage(1); }} className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-2.5 py-2 text-xs font-semibold text-blue-700"><Eye className="h-4 w-4" /> View</button></td></tr>)}</tbody></table></div>
          <Pager page={attendancePage} totalPages={Math.ceil(filteredSheets.length / attendancePageSize)} onPage={setAttendancePage} total={filteredSheets.length} pageSize={attendancePageSize} onPageSize={(size) => { setAttendancePageSize(size); setAttendancePage(1); }} pageSizeOptions={[10, 25, 50, 100]} />
        </> : <EmptyState title="No attendance sheets" body="No saved attendance records match these filters." />}
      </Panel>}
      {tab === 'grades' && <Panel>
        <div className="flex flex-col justify-between gap-3 md:flex-row"><div><h3 className="text-lg font-bold">Grade Monitoring and Release</h3><p className="text-sm text-slate-500">Review facilitator-entered category scores and control student release status.</p></div><button type="button" onClick={exportGrades} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white"><Download className="h-4 w-4" /> Export Excel</button></div>
        {grades.length ? <>
          <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[1080px] text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-900"><tr><th className="p-3">Student</th><th className="p-3">Attendance</th><th className="p-3">Assessments</th><th className="p-3">Activities</th><th className="p-3">Participation</th><th className="p-3">Major Exam</th><th className="p-3">Final</th><th className="p-3">Status</th><th className="p-3">Review Action</th></tr></thead><tbody>{displayedGrades.map((grade) => { const student = students.find((value) => value.id === grade.studentId); const computed = finalGrade(grade, settings); return <tr key={grade.studentId} className="border-b dark:border-slate-800"><td className="p-3 font-semibold">{student?.name || grade.studentId}<p className="text-xs font-normal text-slate-500">{student?.component || ''}</p></td><td className="p-3">{grade.attendance ?? '--'}</td><td className="p-3">{grade.assessments ?? '--'}</td><td className="p-3">{grade.activities ?? '--'}</td><td className="p-3">{grade.participation ?? '--'}</td><td className="p-3">{grade.majorExam ?? '--'}</td><td className="p-3 font-bold">{computed === null ? '--' : computed.toFixed(2)}</td><td className="p-3"><StatusBadge value={grade.status} /></td><td className="p-3"><select value={grade.status} onChange={(event) => setGradeStatus(grade.studentId, event.target.value as typeof grade.status)} className="rounded-lg border px-2 py-2 dark:border-slate-700 dark:bg-slate-900">{['Draft', 'In Progress', 'Submitted', 'Reviewed', 'Released'].map((value) => <option key={value}>{value}</option>)}</select></td></tr>; })}</tbody></table></div>
          <Pager page={gradePage} totalPages={Math.ceil(grades.length / gradePageSize)} onPage={setGradePage} total={grades.length} pageSize={gradePageSize} onPageSize={(size) => { setGradePageSize(size); setGradePage(1); }} pageSizeOptions={[10, 25, 50, 100]} />
        </> : <EmptyState title="No facilitator grades" body="Saved gradebook entries from facilitators will appear here for review and release." />}
      </Panel>}
      {tab === 'classification' && <Panel>
        <h3 className="text-lg font-bold">Component Classification Readiness</h3><p className="text-sm text-slate-500">Eligibility is based on 25 completed contact hours, attendance, assessed outputs, and final approval.</p>
        <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-900"><tr><th className="p-3">Student</th><th className="p-3">Current Stage</th><th className="p-3">Contact Hours</th><th className="p-3">Attendance</th><th className="p-3">Eligibility</th></tr></thead><tbody>{displayedProgress.map(({ student, progress: item }) => { const approved = student.component !== 'Common Phase'; return <tr key={student.id} className="border-b dark:border-slate-800"><td className="p-3 font-semibold">{student.name}</td><td className="p-3">{student.component}</td><td className="p-3">{approved ? '25 / 25' : `${item.completedHours} / 25`}</td><td className="p-3">{item.attendancePercentage}%</td><td className="p-3"><StatusBadge value={approved ? 'Approved' : item.status} /></td></tr>; })}</tbody></table></div>
        <Pager page={classificationPage} totalPages={Math.ceil(progress.length / classificationPageSize)} onPage={setClassificationPage} total={progress.length} pageSize={classificationPageSize} onPageSize={(size) => { setClassificationPageSize(size); setClassificationPage(1); }} pageSizeOptions={[10, 25, 50, 100]} />
      </Panel>}
      {tab === 'materials' && <AdminLearningMaterialsPanel />}
      {tab === 'notices' && <Panel>
        <h3 className="inline-flex items-center gap-2 text-lg font-bold"><Bell className="h-5 w-5 text-blue-700" /> Announcements Management</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_180px_auto]"><input value={noticeTitle} onChange={(event) => setNoticeTitle(event.target.value)} placeholder="Notice title" className="rounded-xl border px-3 py-2 dark:border-slate-700 dark:bg-slate-900" /><input value={noticeMessage} onChange={(event) => setNoticeMessage(event.target.value)} placeholder="Message" className="rounded-xl border px-3 py-2 dark:border-slate-700 dark:bg-slate-900" /><select value={noticeTarget} onChange={(event) => setNoticeTarget(event.target.value as WorkflowNotice['component'])} className="rounded-xl border px-3 py-2 dark:border-slate-700 dark:bg-slate-900"><option value="All">All students</option><option value="Common">Common Phase</option><option value="CWTS">CWTS</option><option value="LTS">LTS</option><option value="MTS (Army)">MTS Army</option></select><button type="button" onClick={publishNotice} className="rounded-xl bg-blue-700 px-4 py-2 font-semibold text-white">Publish</button></div>
        <div className="mt-5 space-y-2">{notices.map((notice) => <div key={notice.id} className="rounded-xl border p-3 dark:border-slate-800"><div className="flex items-center gap-2"><strong>{notice.title}</strong><StatusBadge value={notice.status} /><StatusBadge value={notice.component} /></div><p className="mt-2 text-sm">{notice.message}</p></div>)}</div>
      </Panel>}
      {tab === 'audit' && <Panel>
        <h3 className="text-lg font-bold">Audit Logs</h3>
        {audit.length ? <><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[820px] text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-900"><tr><th className="p-3">Date / Time</th><th className="p-3">Actor</th><th className="p-3">Action</th><th className="p-3">Record</th><th className="p-3">Detail</th></tr></thead><tbody>{displayedAudit.map((row) => <tr key={row.id} className="border-b dark:border-slate-800"><td className="p-3">{new Date(row.at).toLocaleString()}</td><td className="p-3">{row.actorName}</td><td className="p-3"><StatusBadge value={row.action} /></td><td className="p-3">{row.recordType}</td><td className="p-3">{row.detail}</td></tr>)}</tbody></table></div><Pager page={auditPage} totalPages={Math.ceil(audit.length / auditPageSize)} onPage={setAuditPage} total={audit.length} pageSize={auditPageSize} onPageSize={(size) => { setAuditPageSize(size); setAuditPage(1); }} pageSizeOptions={[10, 25, 50, 100]} /></> : <EmptyState title="No logged workflow actions" body="Attendance saves, grade releases, and published notices will appear here." />}
      </Panel>}
      {tab === 'settings' && <Panel>
        <h3 className="inline-flex items-center gap-2 text-lg font-bold"><Settings className="h-5 w-5 text-blue-700" /> System Settings</h3><p className="mt-1 text-sm text-slate-500">School year and flexible session scheduling remain in existing admin modules; manage the shared grading breakdown here.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">{(['attendance', 'assessments', 'activities', 'participation', 'majorExam'] as const).map((field) => <label key={field} className="text-xs font-semibold uppercase text-slate-500">{field}<input type="number" value={settings[field]} onChange={(event) => setSettings((current) => ({ ...current, [field]: Number(event.target.value) }))} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" /></label>)}<button type="button" onClick={saveRules} className="inline-flex items-center justify-center gap-2 self-end rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white"><Save className="h-4 w-4" /> Save</button></div>
      </Panel>}
      {selectedSheet && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <section role="dialog" aria-modal="true" className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-950">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Read-only Attendance Sheet</p><h3 className="mt-1 text-xl font-bold">{selectedSheet.topic}</h3><p className="mt-1 text-sm text-slate-500">{selectedSheet.date} / Session {selectedSheet.sessionNumber} / {selectedSheet.facilitatorName} / {selectedSheet.group}</p></div>
              <div className="flex gap-2"><button type="button" onClick={() => exportAttendance([selectedSheet])} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-3 py-2 text-sm font-semibold text-white"><Download className="h-4 w-4" /> Export Sheet</button><button type="button" onClick={() => setSelectedSheetId(null)} className="rounded-xl border border-slate-200 p-2"><X className="h-5 w-5" /></button></div>
            </div>
            <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full table-fixed text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-900"><tr><th className="w-[38%] p-3">Student</th><th className="w-[20%] p-3">Status</th><th className="w-[42%] p-3">Remarks</th></tr></thead><tbody>{displayedSheetEntries.map((entry) => { const student = students.find((value) => value.id === entry.studentId); return <tr key={entry.studentId} className="border-t dark:border-slate-800"><td className="p-3 font-semibold">{student?.name || entry.studentId}<p className="text-xs font-normal text-slate-500">{student?.studentId || ''}</p></td><td className="p-3"><StatusBadge value={entry.status} /></td><td className="p-3">{entry.remarks || '--'}</td></tr>; })}</tbody></table>
            </div>
            <Pager page={sheetEntryPage} totalPages={Math.ceil(selectedSheet.entries.length / sheetEntryPageSize)} onPage={setSheetEntryPage} total={selectedSheet.entries.length} pageSize={sheetEntryPageSize} onPageSize={(size) => { setSheetEntryPageSize(size); setSheetEntryPage(1); }} pageSizeOptions={[10, 25, 50, 100]} />
          </section>
        </div>
      )}
      <Toaster position="top-right" richColors />
    </section>
  );
}
