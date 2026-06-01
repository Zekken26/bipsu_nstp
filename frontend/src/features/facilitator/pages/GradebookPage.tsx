import { useEffect, useMemo, useState } from 'react';
import { BarChart3, ClipboardCheck, Download, GraduationCap, Save, SlidersHorizontal, TrendingUp, Users } from 'lucide-react';
import { addAudit, finalGrade, type GradingSettings } from '../../../data/workflowData';
import type { FacilitatorWorkspace } from '../hooks/useFacilitatorWorkspace';
import type { FacilitatorGradeEntry, GradeStatus } from '../types';
import { EmptyState, MunicipalityScopeBanner, PageIntro, Pager, Panel, SearchField, StatCard, StatusBadge } from '../components/FacilitatorUI';

const statuses: GradeStatus[] = ['Draft', 'In Progress', 'Submitted', 'Reviewed', 'Released'];
const tracks = ['All Assigned', 'Common Phase', 'CWTS', 'LTS', 'MTS'] as const;
type Track = typeof tracks[number];
const fields: Array<{ key: 'attendance' | 'assessments' | 'activities' | 'participation' | 'majorExam'; label: string }> = [
  { key: 'attendance', label: 'Attendance' },
  { key: 'assessments', label: 'Assessments' },
  { key: 'activities', label: 'Activities / Outputs' },
  { key: 'participation', label: 'Participation' },
  { key: 'majorExam', label: 'Major Exam' },
];

function entryFor(studentId: string, workspace: FacilitatorWorkspace): FacilitatorGradeEntry {
  const existing = workspace.detailedGrades.find((entry) => entry.studentId === studentId);
  if (existing) return existing;
  const studentNumber = workspace.students.find((student) => student.id === studentId)?.studentId;
  const legacy = workspace.gradeRecords.find((record) => record.studentId === studentId || studentNumber === record.studentId);
  return {
    studentId,
    facilitatorId: workspace.user.id,
    assessments: legacy?.prelim || null,
    quizzes: legacy?.midterm || null,
    attendance: null,
    activities: null,
    participation: null,
    majorExam: legacy?.final || null,
    overrideFinal: null,
    status: 'Draft',
    feedback: '',
    updatedAt: new Date().toISOString(),
  };
}

export default function GradebookPage({ workspace, notify }: { workspace: FacilitatorWorkspace; notify: (message: string) => void }) {
  const [drafts, setDrafts] = useState<Record<string, FacilitatorGradeEntry>>({});
  const [settings, setSettings] = useState<GradingSettings>(workspace.gradingSettings);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [track, setTrack] = useState<Track>('All Assigned');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    setDrafts(Object.fromEntries(workspace.students.map((student) => [student.id, entryFor(student.id, workspace)])));
  }, [workspace.students, workspace.detailedGrades, workspace.gradeRecords]);
  useEffect(() => setSettings(workspace.gradingSettings), [workspace.gradingSettings]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return workspace.students.filter((student) => {
      const grade = drafts[student.id];
      const componentMatch = track === 'All Assigned' || track === 'Common Phase' ||
        (track === 'MTS' && student.component.toUpperCase().startsWith('MTS')) ||
        student.component === track;
      return (!query || `${student.name} ${student.studentId} ${student.component}`.toLowerCase().includes(query)) &&
        (statusFilter === 'all' || grade?.status === statusFilter) &&
        componentMatch;
    });
  }, [workspace.students, search, statusFilter, track, drafts]);
  useEffect(() => setPage(1), [search, statusFilter, track, pageSize]);
  const displayed = filtered.slice((page - 1) * pageSize, page * pageSize);
  const weightTotal = settings.attendance + settings.assessments + settings.activities + settings.participation + settings.majorExam;
  const calculated = filtered.map((student) => finalGrade(drafts[student.id] || entryFor(student.id, workspace), settings)).filter((grade): grade is number => grade !== null);
  const classAverage = calculated.length ? Math.round(calculated.reduce((total, grade) => total + grade, 0) / calculated.length) : 0;
  const releasedCount = filtered.filter((student) => drafts[student.id]?.status === 'Released').length;
  const completeCount = filtered.filter((student) => finalGrade(drafts[student.id] || entryFor(student.id, workspace), settings) !== null).length;
  const performanceBands = [
    { label: '90 - 100', count: calculated.filter((grade) => grade >= 90).length, className: 'bg-emerald-500' },
    { label: '80 - 89', count: calculated.filter((grade) => grade >= 80 && grade < 90).length, className: 'bg-blue-600' },
    { label: '75 - 79', count: calculated.filter((grade) => grade >= 75 && grade < 80).length, className: 'bg-amber-500' },
    { label: 'Below 75', count: calculated.filter((grade) => grade < 75).length, className: 'bg-rose-500' },
  ];
  const highAttendanceGrades = filtered.map((student) => drafts[student.id]).filter((grade) => grade && Number(grade.attendance) >= 85).map((grade) => finalGrade(grade, settings)).filter((grade): grade is number => grade !== null);
  const supportAttendanceGrades = filtered.map((student) => drafts[student.id]).filter((grade) => grade && grade.attendance !== null && Number(grade.attendance) < 85).map((grade) => finalGrade(grade, settings)).filter((grade): grade is number => grade !== null);
  const attendanceAverage = (values: number[]) => values.length ? Math.round(values.reduce((total, value) => total + value, 0) / values.length) : 0;

  const update = (studentId: string, field: keyof FacilitatorGradeEntry, value: number | GradeStatus | string | null) => {
    setDrafts((current) => ({
      ...current,
      [studentId]: {
        ...current[studentId],
        [field]: value,
        status: field === 'status' ? value as GradeStatus : current[studentId].status === 'Draft' ? 'In Progress' : current[studentId].status,
        updatedAt: new Date().toISOString(),
      },
    }));
  };

  const saveSettings = () => {
    if (weightTotal !== 100) {
      notify('Grading weights must total exactly 100%.');
      return;
    }
    workspace.setGradingSettings({ ...settings, updatedAt: new Date().toISOString() });
    notify('Grading computation settings saved.');
  };

  const saveGrades = () => {
    workspace.setDetailedGrades(Object.values(drafts));
    workspace.recordActivity('Gradebook updated', `${Object.values(drafts).length} scoped grade records saved`);
    addAudit(workspace.user, 'Grade updated', 'Gradebook', workspace.user.id, 'Facilitator saved scoped gradebook records.');
    notify('Gradebook records saved. Released grades are visible to students.');
  };

  const exportGradebook = async () => {
    const XLSX = await import('xlsx');
    const rows = filtered.map((student) => {
      const grade = drafts[student.id] || entryFor(student.id, workspace);
      return [
        student.studentId,
        student.name,
        student.component,
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
    if (!rows.length) {
      notify('No gradebook records match the current filters.');
      return;
    }
    const book = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([['Student ID', 'Student Name', 'Component', 'Attendance', 'Assessments', 'Activities / Outputs', 'Participation', 'Major Exam', 'Final Grade', 'Override', 'Workflow Status', 'Feedback'], ...rows]);
    sheet['!cols'] = [{ wch: 16 }, { wch: 28 }, { wch: 16 }, { wch: 13 }, { wch: 14 }, { wch: 20 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 18 }, { wch: 34 }];
    if (sheet['!ref']) sheet['!autofilter'] = { ref: sheet['!ref'] };
    const settingsSheet = XLSX.utils.aoa_to_sheet([
      ['Grading Category', 'Weight'],
      ...fields.map((field) => [field.label, `${settings[field.key]}%`]),
      ['Manual Override Allowed', settings.allowOverride ? 'Yes' : 'No'],
    ]);
    XLSX.utils.book_append_sheet(book, sheet, 'Gradebook Records');
    XLSX.utils.book_append_sheet(book, settingsSheet, 'Computation Settings');
    const exportTrack = track.toLowerCase().replace(/\s+/g, '-');
    XLSX.writeFile(book, `gradebook-${exportTrack}-${new Date().toISOString().slice(0, 10)}.xlsx`);
    addAudit(workspace.user, 'Gradebook exported', 'Gradebook Export', track, 'Excel export generated.');
    notify('Gradebook Excel export generated.');
  };

  return (
    <>
      <PageIntro
        eyebrow="Academic Records"
        title="Facilitator Gradebook"
        description="Encode scoped academic records using the approved grading breakdown, inspect performance trends, and prepare grades for formal review and release."
        actions={(
          <>
            <button type="button" onClick={exportGradebook} className="inline-flex items-center gap-2 rounded-xl border border-[#dbe5f2] bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 dark:border-blue-500/30 dark:bg-slate-950 dark:text-blue-200"><Download className="h-4 w-4" /> Export Excel</button>
            <button type="button" onClick={saveGrades} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-700/15 transition hover:bg-blue-800"><Save className="h-4 w-4" /> Save grades</button>
          </>
        )}
      />

      <MunicipalityScopeBanner
        label="Gradesheet Municipality Context"
        activeMunicipality={workspace.activeMunicipality}
        assignedMunicipalities={workspace.assignedMunicipalities}
        onMunicipalityChange={workspace.setActiveMunicipality}
        recordCount={filtered.length}
        helper="Grade encoding, grade exports, and released grade records are constrained to this selected assigned municipality scope."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Students in View" value={filtered.length} detail={`${track} records`} icon={Users} tone="blue" />
        <StatCard label="Class Average" value={calculated.length ? `${classAverage}%` : '--'} detail={`${calculated.length} computed final grades`} icon={TrendingUp} tone="indigo" progress={calculated.length ? classAverage : 0} />
        <StatCard label="Computed Finals" value={completeCount} detail="Complete grading entries" icon={ClipboardCheck} tone="emerald" progress={filtered.length ? Math.round((completeCount / filtered.length) * 100) : 0} />
        <StatCard label="Released Grades" value={releasedCount} detail="Visible to students" icon={GraduationCap} tone="amber" progress={filtered.length ? Math.round((releasedCount / filtered.length) * 100) : 0} />
      </div>

      <Panel className="overflow-hidden">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#112342] dark:text-white">Gradebook Workspace</h2>
            <p className="text-sm text-slate-500">Switch academic tracks while retaining scoped facilitator records only.</p>
          </div>
          <div className="flex flex-wrap gap-1 rounded-xl bg-slate-50 p-1 dark:bg-slate-900">
            {tracks.map((value) => (
              <button key={value} type="button" onClick={() => setTrack(value)} className={`rounded-lg px-3 py-2 text-xs font-bold transition ${value === track ? 'bg-white text-blue-700 shadow-sm dark:bg-slate-800 dark:text-blue-200' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'}`}>{value}</button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <SearchField value={search} onChange={setSearch} placeholder="Search student, ID, or component" />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-xl border border-[#dfe7f1] bg-[#fbfcfe] px-3 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900">
            <option value="all">All grade statuses</option>
            {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </div>
      </Panel>

      <div className="grid gap-5 xl:grid-cols-[1.45fr_0.85fr]">
      <Panel>
        <div className="mb-4 flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-blue-700" />
          <div>
            <h2 className="font-bold">Grade Computation Settings</h2>
            <p className="text-xs text-slate-500">Configurable breakdown for facilitator drafts; total must equal 100%.</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {fields.map((field) => (
            <label key={field.key} className="text-xs font-semibold text-slate-500">
              {field.label} %
              <input type="number" min={0} max={100} value={settings[field.key]} onChange={(event) => setSettings((current) => ({ ...current, [field.key]: Number(event.target.value) }))} className="mt-1 w-full rounded-xl border border-[#dfe7f1] bg-[#fbfcfe] px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
            </label>
          ))}
          <button type="button" onClick={saveSettings} className="self-end rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50">Save settings</button>
        </div>
        <label className="mt-4 inline-flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={settings.allowOverride} onChange={(event) => setSettings((current) => ({ ...current, allowOverride: event.target.checked }))} />
          Allow manual final-grade override with review justification
          <StatusBadge value={weightTotal === 100 ? 'Complete' : `Invalid total ${weightTotal}%`} />
        </label>
      </Panel>
      <Panel>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-700" />
          <div>
            <h2 className="font-bold">Performance Summary</h2>
            <p className="text-xs text-slate-500">Computed records in the selected view.</p>
          </div>
        </div>
        <div className="mt-5 space-y-4">
          {performanceBands.map((band) => (
            <div key={band.label}>
              <div className="mb-1.5 flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300"><span>{band.label}</span><span>{band.count} student{band.count === 1 ? '' : 's'}</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className={`h-full rounded-full ${band.className}`} style={{ width: `${calculated.length ? Math.round((band.count / calculated.length) * 100) : 0}%` }} /></div>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-xl border border-[#e4eaf3] bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">Attendance to Grade View</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div><p className="text-xs text-slate-500">Attendance 85%+</p><p className="mt-1 text-xl font-bold text-[#112342] dark:text-white">{highAttendanceGrades.length ? `${attendanceAverage(highAttendanceGrades)}%` : '--'}</p></div>
            <div><p className="text-xs text-slate-500">Needs Support</p><p className="mt-1 text-xl font-bold text-[#112342] dark:text-white">{supportAttendanceGrades.length ? `${attendanceAverage(supportAttendanceGrades)}%` : '--'}</p></div>
          </div>
        </div>
      </Panel>
      </div>

      <Panel>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#112342] dark:text-white">Student Grade Encoding</h2>
            <p className="text-sm text-slate-500">Inline scores use the current approved computation settings and workflow statuses.</p>
          </div>
          <StatusBadge value={`${filtered.length} scoped records`} />
        </div>
        {displayed.length ? (
          <>
            <div className="hidden max-h-[650px] overflow-auto rounded-xl border border-[#edf1f6] lg:block">
              <table className="w-full min-w-[1120px] border-separate border-spacing-0 text-sm">
                <thead className="sticky top-0 z-20 text-left text-xs uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                  <tr className="bg-[#f2f6fb] dark:bg-slate-900"><th rowSpan={2} className="sticky left-0 z-30 border-b border-r border-[#e5ebf3] bg-[#f2f6fb] px-4 py-3 dark:border-slate-800 dark:bg-slate-900">Student</th><th colSpan={4} className="border-b border-[#e5ebf3] px-3 py-3 text-center text-blue-700 dark:border-slate-800 dark:text-blue-300">Continuous Assessment</th><th colSpan={3} className="border-b border-[#e5ebf3] px-3 py-3 text-center text-blue-700 dark:border-slate-800 dark:text-blue-300">Final Standing</th><th rowSpan={2} className="border-b border-[#e5ebf3] px-3 py-3 dark:border-slate-800">Workflow</th><th rowSpan={2} className="border-b border-[#e5ebf3] px-3 py-3 dark:border-slate-800">Feedback</th></tr>
                  <tr className="bg-[#f7f9fc] dark:bg-slate-900">
                    {fields.slice(0, 4).map((field) => <th key={field.key} className="border-b border-[#e5ebf3] px-3 py-3 dark:border-slate-800">{field.label}</th>)}
                    <th className="border-b border-[#e5ebf3] px-3 py-3 dark:border-slate-800">{fields[4].label}</th><th className="border-b border-[#e5ebf3] px-3 py-3 dark:border-slate-800">Final</th><th className="border-b border-[#e5ebf3] px-3 py-3 dark:border-slate-800">Override</th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((student) => {
                    const grade = drafts[student.id] || entryFor(student.id, workspace);
                    const computed = finalGrade(grade, settings);
                    return (
                      <tr key={student.id} className="group align-top transition hover:bg-blue-50/35 dark:hover:bg-slate-900">
                        <td className="sticky left-0 z-10 border-b border-r border-[#edf1f6] bg-white px-3 py-3 group-hover:bg-[#f5f9ff] dark:border-slate-800 dark:bg-slate-950 dark:group-hover:bg-slate-900"><p className="font-semibold text-[#112342] dark:text-white">{student.name}</p><p className="text-xs text-slate-500">{student.studentId} / {student.component}</p></td>
                        {fields.map((field) => (
                          <td key={field.key} className="border-b border-[#edf1f6] px-2 py-3 dark:border-slate-800">
                            <input type="number" min={0} max={100} value={grade[field.key] ?? ''} onChange={(event) => update(student.id, field.key, event.target.value === '' ? null : Math.min(100, Math.max(0, Number(event.target.value))))} className="w-16 rounded-lg border border-[#dfe7f1] bg-[#fbfcfe] px-2 py-2 outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-900" />
                          </td>
                        ))}
                        <td className={`border-b border-[#edf1f6] px-2 py-3 text-base font-bold dark:border-slate-800 ${computed !== null && computed < 75 ? 'text-rose-600' : 'text-[#112342] dark:text-white'}`}>{computed === null ? '--' : computed.toFixed(2)}</td>
                        <td className="border-b border-[#edf1f6] px-2 py-3 dark:border-slate-800"><input disabled={!settings.allowOverride} title={settings.allowOverride ? 'Manual approved override' : 'Overrides disabled by settings'} type="number" min={0} max={100} value={grade.overrideFinal ?? ''} onChange={(event) => update(student.id, 'overrideFinal', event.target.value === '' ? null : Number(event.target.value))} className="w-16 rounded-lg border border-[#dfe7f1] bg-[#fbfcfe] px-2 py-2 disabled:cursor-not-allowed disabled:opacity-45 dark:border-slate-700 dark:bg-slate-900" /></td>
                        <td className="border-b border-[#edf1f6] px-2 py-3 dark:border-slate-800">
                          <select value={grade.status} onChange={(event) => update(student.id, 'status', event.target.value as GradeStatus)} className="mb-2 block rounded-lg border border-[#dfe7f1] bg-white px-2 py-2 text-xs dark:border-slate-700 dark:bg-slate-900">{statuses.map((status) => <option key={status}>{status}</option>)}</select>
                          <StatusBadge value={grade.status} />
                        </td>
                        <td className="border-b border-[#edf1f6] px-2 py-3 dark:border-slate-800"><textarea value={grade.feedback} onChange={(event) => update(student.id, 'feedback', event.target.value)} rows={2} placeholder="Feedback" className="w-36 rounded-lg border border-[#dfe7f1] bg-[#fbfcfe] px-2 py-2 text-xs outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900" /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="grid gap-3 lg:hidden">
              {displayed.map((student) => {
                const grade = drafts[student.id] || entryFor(student.id, workspace);
                const computed = finalGrade(grade, settings);
                return (
                  <article key={student.id} className="rounded-xl border border-[#edf1f6] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div><p className="font-semibold text-[#112342] dark:text-white">{student.name}</p><p className="text-xs text-slate-500">{student.studentId} / {student.component}</p></div>
                      <StatusBadge value={grade.status} />
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {fields.map((field) => (
                        <label key={field.key} className="text-xs font-semibold text-slate-500">{field.label}
                          <input type="number" min={0} max={100} value={grade[field.key] ?? ''} onChange={(event) => update(student.id, field.key, event.target.value === '' ? null : Math.min(100, Math.max(0, Number(event.target.value))))} className="mt-1 w-full rounded-lg border border-[#dfe7f1] px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
                        </label>
                      ))}
                      <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-900"><p className="text-xs font-semibold text-slate-500">Final Grade</p><p className={`text-lg font-bold ${computed !== null && computed < 75 ? 'text-rose-600' : 'text-[#112342] dark:text-white'}`}>{computed === null ? '--' : computed.toFixed(2)}</p></div>
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr]">
                      <select value={grade.status} onChange={(event) => update(student.id, 'status', event.target.value as GradeStatus)} className="rounded-lg border border-[#dfe7f1] px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">{statuses.map((status) => <option key={status}>{status}</option>)}</select>
                      <textarea value={grade.feedback} onChange={(event) => update(student.id, 'feedback', event.target.value)} rows={2} placeholder="Feedback" className="rounded-lg border border-[#dfe7f1] px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
                    </div>
                  </article>
                );
              })}
            </div>
            <Pager page={page} totalPages={Math.ceil(filtered.length / pageSize)} onPage={setPage} total={filtered.length} pageSize={pageSize} onPageSize={setPageSize} pageSizeOptions={[10, 25, 50, 100]} />
          </>
        ) : <EmptyState title="No gradebook students" body="No assigned students match this grade status or search filter." />}
      </Panel>
    </>
  );
}
