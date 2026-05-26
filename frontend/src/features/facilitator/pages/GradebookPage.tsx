import { useEffect, useMemo, useState } from 'react';
import { Download, Save, SlidersHorizontal } from 'lucide-react';
import { addAudit, finalGrade, type GradingSettings } from '../../../data/workflowData';
import type { FacilitatorWorkspace } from '../hooks/useFacilitatorWorkspace';
import type { FacilitatorGradeEntry, GradeStatus } from '../types';
import { EmptyState, PageIntro, Pager, Panel, SearchField, StatusBadge } from '../components/FacilitatorUI';

const PAGE_SIZE = 10;
const statuses: GradeStatus[] = ['Draft', 'In Progress', 'Submitted', 'Reviewed', 'Released'];
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
  const [page, setPage] = useState(1);

  useEffect(() => {
    setDrafts(Object.fromEntries(workspace.students.map((student) => [student.id, entryFor(student.id, workspace)])));
  }, [workspace.students, workspace.detailedGrades, workspace.gradeRecords]);
  useEffect(() => setSettings(workspace.gradingSettings), [workspace.gradingSettings]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return workspace.students.filter((student) => {
      const grade = drafts[student.id];
      return (!query || `${student.name} ${student.studentId} ${student.component}`.toLowerCase().includes(query)) &&
        (statusFilter === 'all' || grade?.status === statusFilter);
    });
  }, [workspace.students, search, statusFilter, drafts]);
  useEffect(() => setPage(1), [search, statusFilter]);
  const displayed = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const weightTotal = settings.attendance + settings.assessments + settings.activities + settings.participation + settings.majorExam;

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

  return (
    <>
      <PageIntro
        eyebrow="Academic Records"
        title="Gradebook"
        description="Encode scoped grades using an academic breakdown, review computed finals, and manage submission or release status."
        actions={(
          <>
            <button type="button" disabled title="PDF/Excel grade export requires an official release template." className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 opacity-60 dark:border-blue-500/30 dark:bg-slate-950 dark:text-blue-200"><Download className="h-4 w-4" /> Export after release</button>
            <button type="button" onClick={saveGrades} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white"><Save className="h-4 w-4" /> Save grades</button>
          </>
        )}
      />
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
              <input type="number" min={0} max={100} value={settings[field.key]} onChange={(event) => setSettings((current) => ({ ...current, [field.key]: Number(event.target.value) }))} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
            </label>
          ))}
          <button type="button" onClick={saveSettings} className="self-end rounded-xl border border-blue-200 px-3 py-2.5 text-sm font-semibold text-blue-700">Save settings</button>
        </div>
        <label className="mt-4 inline-flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={settings.allowOverride} onChange={(event) => setSettings((current) => ({ ...current, allowOverride: event.target.checked }))} />
          Allow manual final-grade override with review justification
          <StatusBadge value={weightTotal === 100 ? 'Complete' : `Invalid total ${weightTotal}%`} />
        </label>
      </Panel>
      <Panel>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row">
          <SearchField value={search} onChange={setSearch} placeholder="Search student or component" />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900">
            <option value="all">All grade statuses</option>
            {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </div>
        {displayed.length ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1300px] text-sm">
                <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase tracking-[0.12em] text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                  <tr><th className="px-3 py-3">Student</th>{fields.map((field) => <th key={field.key} className="px-3 py-3">{field.label}</th>)}<th className="px-3 py-3">Final</th><th className="px-3 py-3">Override</th><th className="px-3 py-3">Workflow</th><th className="px-3 py-3">Feedback</th></tr>
                </thead>
                <tbody>
                  {displayed.map((student) => {
                    const grade = drafts[student.id] || entryFor(student.id, workspace);
                    const computed = finalGrade(grade, settings);
                    return (
                      <tr key={student.id} className="border-b border-slate-100 align-top dark:border-slate-800">
                        <td className="px-3 py-4"><p className="font-semibold">{student.name}</p><p className="text-xs text-slate-500">{student.studentId} / {student.component}</p></td>
                        {fields.map((field) => (
                          <td key={field.key} className="px-3 py-4">
                            <input type="number" min={0} max={100} value={grade[field.key] ?? ''} onChange={(event) => update(student.id, field.key, event.target.value === '' ? null : Math.min(100, Math.max(0, Number(event.target.value))))} className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-2 dark:border-slate-700 dark:bg-slate-900" />
                          </td>
                        ))}
                        <td className="px-3 py-4 text-base font-bold">{computed === null ? '--' : computed.toFixed(2)}</td>
                        <td className="px-3 py-4"><input disabled={!settings.allowOverride} title={settings.allowOverride ? 'Manual approved override' : 'Overrides disabled by settings'} type="number" min={0} max={100} value={grade.overrideFinal ?? ''} onChange={(event) => update(student.id, 'overrideFinal', event.target.value === '' ? null : Number(event.target.value))} className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-2 disabled:cursor-not-allowed disabled:opacity-45 dark:border-slate-700 dark:bg-slate-900" /></td>
                        <td className="px-3 py-4">
                          <select value={grade.status} onChange={(event) => update(student.id, 'status', event.target.value as GradeStatus)} className="mb-2 block rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs dark:border-slate-700 dark:bg-slate-900">{statuses.map((status) => <option key={status}>{status}</option>)}</select>
                          <StatusBadge value={grade.status} />
                        </td>
                        <td className="px-3 py-4"><textarea value={grade.feedback} onChange={(event) => update(student.id, 'feedback', event.target.value)} rows={2} placeholder="Private/release feedback" className="w-48 rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs dark:border-slate-700 dark:bg-slate-900" /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pager page={page} totalPages={Math.ceil(filtered.length / PAGE_SIZE)} onPage={setPage} total={filtered.length} />
          </>
        ) : <EmptyState title="No gradebook students" body="No assigned students match this grade status or search filter." />}
      </Panel>
    </>
  );
}
