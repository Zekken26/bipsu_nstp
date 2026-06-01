import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  Download,
  Edit3,
  Eye,
  FileText,
  GraduationCap,
  Layers3,
  MessageSquare,
  Plus,
  Save,
  Search,
  Send,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import type { BiliranMunicipality, NstpAccount, NstpStudent } from '../../../data/nstpData';
import {
  CWTS_ASSESSMENT_CATEGORIES,
  CWTS_SUBMISSION_FORMATS,
  type CwtsAssessmentTask,
  type CwtsSemester,
  type CwtsSubmission,
  type CwtsSubmissionFormat,
  type CwtsSubmissionStatus,
  createBlankCwtsTask,
  loadCwtsAssessmentTasks,
  loadCwtsSubmissions,
  saveCwtsAssessmentTasks,
  saveCwtsSubmissions,
  studentDisplayName,
  submissionStatusFor,
  upsertCwtsSubmission,
} from '../../../data/cwtsAssessmentData';
import { loadAccounts, loadStudents } from '../../../data/nstpData';
import { addAudit } from '../../../data/workflowData';
import { ConfirmDialog, EmptyState, MunicipalityScopeBanner, PageIntro, Pager, Panel, SearchField, StatusBadge, useModalEscape } from '../../facilitator/components/FacilitatorUI';

type Role = 'student' | 'facilitator' | 'admin';

type CwtsAssessmentWorkspaceProps = {
  role: Role;
  user: NstpAccount;
  studentId?: string;
  students?: NstpStudent[];
  title?: string;
  description?: string;
};

type TaskDraft = CwtsAssessmentTask & {
  resourcesText: string;
  rubricText: string;
};

const semesterOptions: Array<CwtsSemester | 'All'> = ['All', 'CWTS 1', 'CWTS 2'];
const statusOptions: Array<CwtsSubmissionStatus | 'All'> = ['All', 'Pending', 'Submitted', 'Late', 'Revision Requested', 'Graded'];

const compactDate = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

const primaryButton = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/70 disabled:cursor-not-allowed disabled:opacity-55';
const secondaryButton = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/50 disabled:cursor-not-allowed disabled:opacity-55 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900';
const dangerButton = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-bold text-rose-700 transition hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/60 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200';
const MAX_UPLOAD_SIZE_BYTES = Number(import.meta.env.VITE_UPLOAD_SIZE_LIMIT_BYTES || 10 * 1024 * 1024);
const ALLOWED_UPLOAD_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'];

function downloadCsv(filename: string, rows: Array<Record<string, string | number | undefined>>) {
  if (!rows.length) {
    toast.info('No records are available for export.');
    return;
  }
  const headers = Object.keys(rows[0]);
  const escape = (value: string | number | undefined) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const csv = [headers.join(','), ...rows.map((row) => headers.map((header) => escape(row[header])).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
  toast.success('Export prepared as an Excel-ready CSV file.');
}

function studentComponent(user: NstpAccount) {
  if (user.component === 'CWTS' || user.demoStage === 'cwts') return 'CWTS';
  return user.component;
}

function validateSelectedFiles(files: File[]) {
  for (const file of files) {
    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      return `${file.name} is too large. Maximum size is ${Math.round(MAX_UPLOAD_SIZE_BYTES / 1024 / 1024)} MB.`;
    }
    if (file.type && !ALLOWED_UPLOAD_TYPES.includes(file.type)) {
      return `${file.name} is not an allowed NSTP submission file type.`;
    }
  }
  return null;
}

function validSubmissionLink(value: string) {
  if (!value.trim()) return true;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
}

function resolveStudent(user: NstpAccount, studentId?: string) {
  return loadStudents().find((student) => student.id === studentId || student.id === user.id || student.email.toLowerCase() === user.email.toLowerCase());
}

function canStudentAccessTask(task: CwtsAssessmentTask, student?: NstpStudent) {
  if (!student) return false;
  if (task.status !== 'Published') return false;
  if (!task.ownerId) return true;
  const owner = loadAccounts().find((account) => account.id === task.ownerId);
  const ownerMunicipalities = owner?.municipalities || [];
  return !ownerMunicipalities.length || Boolean(student.municipality && ownerMunicipalities.includes(student.municipality));
}

function taskToDraft(task: CwtsAssessmentTask): TaskDraft {
  return {
    ...task,
    resourcesText: task.resources.join('\n'),
    rubricText: task.rubric.map((item) => `${item.criterion}|${item.points}`).join('\n'),
  };
}

function draftToTask(draft: TaskDraft): CwtsAssessmentTask {
  const { resourcesText, rubricText, ...baseTask } = draft;
  const rubric = draft.rubricText.split('\n').map((line) => {
    const [criterion, points] = line.split('|');
    return { criterion: criterion?.trim(), points: Number(points || 0) };
  }).filter((item) => item.criterion && item.points > 0);

  return {
    ...baseTask,
    resources: resourcesText.split('\n').map((line) => line.trim()).filter(Boolean),
    rubric: rubric.length ? rubric : [{ criterion: 'Content quality', points: draft.points }],
    updatedAt: new Date().toISOString(),
  };
}

function completionPercent(total: number, completed: number) {
  return total ? Math.round((completed / total) * 100) : 0;
}

function ModalShell({ title, subtitle, children, onClose, confirmClose, wide = false }: { title: string; subtitle?: string; children: React.ReactNode; onClose: () => void; confirmClose?: () => boolean; wide?: boolean }) {
  useModalEscape({ open: true, onClose, confirmClose });

  const close = () => {
    if (confirmClose && !confirmClose()) return;
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[90] overflow-y-auto bg-slate-950/55 p-3 backdrop-blur-sm md:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
      <div role="dialog" aria-modal="true" className={`mx-auto my-4 rounded-3xl border border-slate-100 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950 ${wide ? 'max-w-6xl' : 'max-w-3xl'}`}>
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 rounded-t-3xl border-b border-slate-100 bg-white/95 p-5 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
          <div>
            <h2 className="text-lg font-bold text-slate-950 dark:text-white">{title}</h2>
            {subtitle ? <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
          </div>
          <button type="button" onClick={close} className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900" aria-label="Close modal">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function AnalyticsCard({ label, value, detail, icon: Icon, tone = 'blue' }: { label: string; value: string | number; detail: string; icon: any; tone?: 'blue' | 'emerald' | 'amber' | 'rose' }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200',
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200',
    rose: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-200',
  };
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-start justify-between gap-3">
        <div className={`grid h-10 w-10 place-items-center rounded-xl ${tones[tone]}`}><Icon className="h-5 w-5" /></div>
        <span className="rounded-full bg-slate-50 px-2 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-slate-500 dark:bg-slate-900">CWTS</span>
      </div>
      <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{detail}</p>
    </article>
  );
}

function TaskCard({ task, status, submittedCount, totalStudents, onOpen, onEdit, onDelete, role }: { task: CwtsAssessmentTask; status?: CwtsSubmissionStatus; submittedCount?: number; totalStudents?: number; onOpen: () => void; onEdit?: () => void; onDelete?: () => void; role: Role }) {
  const complete = typeof submittedCount === 'number' && typeof totalStudents === 'number' ? completionPercent(totalStudents, submittedCount) : undefined;
  return (
    <article className="interactive-card flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge value={task.semester} />
            <StatusBadge value={task.category} />
            {role !== 'student' ? <StatusBadge value={task.status} /> : status ? <StatusBadge value={status} /> : null}
          </div>
          <h3 className="mt-3 line-clamp-2 text-base font-bold text-slate-950 dark:text-white">{task.title}</h3>
        </div>
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200">
          <FileText className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{task.objective}</p>
      {task.ownerName ? <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Managed by {task.ownerName}</p> : null}
      <div className="mt-4 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
        <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Due {compactDate(task.dueDate)}</span>
        <span className="inline-flex items-center gap-2"><GraduationCap className="h-4 w-4" /> {task.points} pts</span>
      </div>
      {typeof complete === 'number' ? (
        <div className="mt-4">
          <div className="flex justify-between text-xs font-semibold text-slate-500"><span>Submissions</span><span>{submittedCount}/{totalStudents} ({complete}%)</span></div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-blue-700" style={{ width: `${complete}%` }} /></div>
        </div>
      ) : null}
      <div className="mt-auto flex flex-wrap gap-2 pt-4">
        <button type="button" onClick={onOpen} className={role === 'student' ? primaryButton : secondaryButton}><Eye className="h-4 w-4" /> {role === 'student' ? 'Open activity' : 'View submissions'}</button>
        {onEdit ? <button type="button" onClick={onEdit} className={secondaryButton}><Edit3 className="h-4 w-4" /> Edit</button> : null}
        {onDelete ? <button type="button" onClick={onDelete} className={dangerButton}><Trash2 className="h-4 w-4" /> Delete</button> : null}
      </div>
    </article>
  );
}

function StudentTaskModal({ task, submission, student, actor, onClose, onSaved }: { task: CwtsAssessmentTask; submission?: CwtsSubmission; student?: NstpStudent; actor: NstpAccount; onClose: () => void; onSaved: () => void }) {
  const [submissionType, setSubmissionType] = useState<CwtsSubmissionFormat>(submission?.submissionType || task.submissionTypes[0]);
  const [link, setLink] = useState(submission?.link || '');
  const [notes, setNotes] = useState(submission?.notes || '');
  const [fileNames, setFileNames] = useState<string[]>(submission?.fileNames || []);
  const [dirty, setDirty] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const locked = submission?.status === 'Graded';

  const submit = () => {
    if (submitting) return;
    if (!student) {
      toast.error('Student record was not found. Please refresh your session.');
      return;
    }
    if (!validSubmissionLink(link)) {
      toast.error('Enter a valid Google Drive, YouTube, or resource link.');
      return;
    }
    if (!locked && !link.trim() && !fileNames.length && !notes.trim() && submissionType !== 'Onsite Performance') {
      toast.error('Add a file name, link, or note before submitting.');
      return;
    }
    setSubmitting(true);
    const next: CwtsSubmission = {
      id: submission?.id || `cwts-submission-${Date.now()}`,
      assessmentId: task.id,
      studentId: student.id,
      studentName: studentDisplayName(student),
      municipality: student.municipality,
      section: student.programSection,
      submittedAt: new Date().toISOString(),
      status: new Date(`${task.dueDate}T23:59:59`).getTime() < Date.now() ? 'Late' : 'Submitted',
      submissionType,
      link: link.trim() || undefined,
      fileNames,
      notes: notes.trim() || undefined,
      score: submission?.score,
      feedback: submission?.feedback,
      facilitatorComments: submission?.facilitatorComments,
      gradedAt: submission?.gradedAt,
      gradedBy: submission?.gradedBy,
    };
    upsertCwtsSubmission(next);
    addAudit(actor, submission ? 'CWTS submission updated' : 'CWTS submission created', 'CWTS Submission', next.id, `${task.title} / ${next.status}`);
    setDirty(false);
    onSaved();
    toast.success('CWTS activity submitted successfully.');
    onClose();
    window.setTimeout(() => setSubmitting(false), 500);
  };

  return (
    <ModalShell title={task.title} subtitle={`${task.semester} / ${task.category} / Due ${compactDate(task.dueDate)}`} onClose={onClose} confirmClose={() => !dirty || window.confirm('Discard unsaved submission changes?')} wide>
      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <Panel>
            <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-blue-700">Instructions</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{task.instructions}</p>
            <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-900">
              <p className="font-bold text-slate-900 dark:text-white">Objective</p>
              <p className="mt-1 text-slate-600 dark:text-slate-300">{task.objective}</p>
            </div>
          </Panel>
          <Panel>
            <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-blue-700">Rubric / Criteria</h3>
            <div className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
              {task.rubric.map((item) => (
                <div key={item.criterion} className="flex justify-between gap-3 p-3 text-sm">
                  <span>{item.criterion}</span>
                  <span className="font-bold text-blue-700 dark:text-blue-200">{item.points} pts</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
        <div className="space-y-4">
          <Panel>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-blue-700">Submission</h3>
              <StatusBadge value={submissionStatusFor(task, submission)} />
            </div>
            {locked ? (
              <div className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-100">
                This activity has already been graded. Re-upload is disabled unless revision is requested.
              </div>
            ) : null}
            <label className="mt-4 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Submission type</label>
            <select disabled={locked} value={submissionType} onChange={(event) => { setSubmissionType(event.target.value as CwtsSubmissionFormat); setDirty(true); }} className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900">
              {task.submissionTypes.map((type) => <option key={type}>{type}</option>)}
            </select>
            <label className="mt-4 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Link (Drive, YouTube, or resource URL)</label>
            <input disabled={locked} value={link} onChange={(event) => { setLink(event.target.value); setDirty(true); }} className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-900" placeholder="https://..." />
            {link.trim() && !validSubmissionLink(link) ? <p className="mt-2 text-xs font-semibold text-rose-600 dark:text-rose-300">Use a valid http or https link for Drive, YouTube, or other approved resources.</p> : null}
            <label className="mt-4 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Attachment placeholder</label>
            <label className="mt-1 flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 px-4 py-5 text-center text-sm text-blue-800 transition hover:bg-blue-50 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100">
              <UploadCloud className="mb-2 h-6 w-6" />
              <span className="font-bold">Select local file names</span>
              <span className="mt-1 text-xs">Direct upload is kept frontend-safe until backend storage is available.</span>
              <input disabled={locked} type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx,.csv" className="hidden" onChange={(event) => {
                const files = Array.from(event.target.files || []);
                const validationError = validateSelectedFiles(files);
                if (validationError) {
                  setUploadError(validationError);
                  toast.error(validationError);
                  event.currentTarget.value = '';
                  return;
                }
                setUploadError(null);
                setFileNames(files.map((file) => file.name));
                setDirty(true);
              }} />
            </label>
            {uploadError ? <p className="mt-2 text-xs font-semibold text-rose-600 dark:text-rose-300">{uploadError}</p> : null}
            {fileNames.length ? <p className="mt-2 text-xs text-slate-500">{fileNames.join(', ')}</p> : null}
            <label className="mt-4 block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Student notes</label>
            <textarea disabled={locked} value={notes} onChange={(event) => { setNotes(event.target.value); setDirty(true); }} rows={4} className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700 dark:bg-slate-900" placeholder="Add context, activity details, or revision notes..." />
            <button type="button" disabled={locked || submitting} onClick={submit} className={`mt-4 w-full ${primaryButton}`}><Send className="h-4 w-4" /> {submitting ? 'Submitting...' : submission ? 'Update submission' : 'Submit activity'}</button>
          </Panel>
          <Panel>
            <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-blue-700">Score and Feedback</h3>
            {submission?.status === 'Graded' || submission?.status === 'Revision Requested' ? (
              <div className="mt-3 space-y-2 text-sm">
                <p><span className="font-bold">Score:</span> {submission.score ?? '--'} / {task.points}</p>
                <p><span className="font-bold">Feedback:</span> {submission.feedback || 'No feedback recorded.'}</p>
                <p><span className="font-bold">Facilitator comments:</span> {submission.facilitatorComments || 'No private comments shared.'}</p>
              </div>
            ) : <EmptyState title="No grade yet" body="Your score and facilitator feedback will appear here after evaluation." />}
          </Panel>
        </div>
      </div>
    </ModalShell>
  );
}

function TaskEditorModal({ task, onClose, onSave }: { task: CwtsAssessmentTask; onClose: () => void; onSave: (task: CwtsAssessmentTask) => void }) {
  const [draft, setDraft] = useState<TaskDraft>(() => taskToDraft(task));
  const [dirty, setDirty] = useState(false);
  const update = <K extends keyof TaskDraft>(key: K, value: TaskDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setDirty(true);
  };
  const toggleFormat = (format: CwtsSubmissionFormat) => {
    const next = draft.submissionTypes.includes(format) ? draft.submissionTypes.filter((item) => item !== format) : [...draft.submissionTypes, format];
    update('submissionTypes', next.length ? next : ['PDF']);
  };
  const save = () => {
    if (!draft.title.trim() || !draft.instructions.trim() || !draft.objective.trim()) {
      toast.error('Title, objective, and instructions are required.');
      return;
    }
    onSave(draftToTask(draft));
    setDirty(false);
    toast.success('CWTS assessment saved.');
    onClose();
  };

  return (
    <ModalShell title={task.title ? 'Edit CWTS Assessment' : 'Create CWTS Assessment'} subtitle="Create LMS-style performance tasks without changing backend assessment logic." onClose={onClose} confirmClose={() => !dirty || window.confirm('Discard unsaved assessment edits?')} wide>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm font-semibold">Title<input value={draft.title} onChange={(event) => update('title', event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 font-normal dark:border-slate-700 dark:bg-slate-900" /></label>
        <label className="space-y-1 text-sm font-semibold">Week / Group<input value={draft.week} onChange={(event) => update('week', event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 font-normal dark:border-slate-700 dark:bg-slate-900" /></label>
        <label className="space-y-1 text-sm font-semibold">Semester<select value={draft.semester} onChange={(event) => update('semester', event.target.value as CwtsSemester)} className="h-11 w-full rounded-xl border border-slate-200 px-3 font-normal dark:border-slate-700 dark:bg-slate-900"><option>CWTS 1</option><option>CWTS 2</option></select></label>
        <label className="space-y-1 text-sm font-semibold">Category<select value={draft.category} onChange={(event) => update('category', event.target.value as CwtsAssessmentTask['category'])} className="h-11 w-full rounded-xl border border-slate-200 px-3 font-normal dark:border-slate-700 dark:bg-slate-900">{CWTS_ASSESSMENT_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>
        <label className="space-y-1 text-sm font-semibold">Due date<input type="date" value={draft.dueDate} onChange={(event) => update('dueDate', event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 font-normal dark:border-slate-700 dark:bg-slate-900" /></label>
        <label className="space-y-1 text-sm font-semibold">Status<select value={draft.status} onChange={(event) => update('status', event.target.value as CwtsAssessmentTask['status'])} className="h-11 w-full rounded-xl border border-slate-200 px-3 font-normal dark:border-slate-700 dark:bg-slate-900"><option>Draft</option><option>Published</option><option>Archived</option></select></label>
        <label className="space-y-1 text-sm font-semibold md:col-span-2">Objective<textarea value={draft.objective} onChange={(event) => update('objective', event.target.value)} rows={2} className="w-full rounded-xl border border-slate-200 p-3 font-normal dark:border-slate-700 dark:bg-slate-900" /></label>
        <label className="space-y-1 text-sm font-semibold md:col-span-2">Instructions<textarea value={draft.instructions} onChange={(event) => update('instructions', event.target.value)} rows={4} className="w-full rounded-xl border border-slate-200 p-3 font-normal dark:border-slate-700 dark:bg-slate-900" /></label>
        <div className="md:col-span-2">
          <p className="text-sm font-semibold">Accepted submission formats</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {CWTS_SUBMISSION_FORMATS.map((format) => (
              <button key={format} type="button" onClick={() => toggleFormat(format)} className={`rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset transition ${draft.submissionTypes.includes(format) ? 'bg-blue-700 text-white ring-blue-700' : 'bg-white text-slate-600 ring-slate-200 hover:bg-blue-50 dark:bg-slate-950 dark:text-slate-200 dark:ring-slate-700'}`}>{format}</button>
            ))}
          </div>
        </div>
        <label className="space-y-1 text-sm font-semibold">Resources / Materials<textarea value={draft.resourcesText} onChange={(event) => update('resourcesText', event.target.value)} rows={5} className="w-full rounded-xl border border-slate-200 p-3 font-normal dark:border-slate-700 dark:bg-slate-900" placeholder="One resource per line" /></label>
        <label className="space-y-1 text-sm font-semibold">Rubric / Criteria<textarea value={draft.rubricText} onChange={(event) => update('rubricText', event.target.value)} rows={5} className="w-full rounded-xl border border-slate-200 p-3 font-normal dark:border-slate-700 dark:bg-slate-900" placeholder="Criterion|Points" /></label>
      </div>
      <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={onClose} className={secondaryButton}>Cancel</button><button type="button" onClick={save} className={primaryButton}><Save className="h-4 w-4" /> Save assessment</button></div>
    </ModalShell>
  );
}

function SubmissionReviewModal({ task, students, submissions, facilitator, onClose, onUpdated }: { task: CwtsAssessmentTask; students: NstpStudent[]; submissions: CwtsSubmission[]; facilitator: NstpAccount; onClose: () => void; onUpdated: () => void }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<CwtsSubmissionStatus | 'All'>('All');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [grades, setGrades] = useState<Record<string, { score: string; feedback: string; comments: string }>>({});
  const taskSubmissions = submissions.filter((submission) => submission.assessmentId === task.id);

  useEffect(() => {
    const next: Record<string, { score: string; feedback: string; comments: string }> = {};
    taskSubmissions.forEach((submission) => {
      next[submission.studentId] = {
        score: String(submission.score ?? ''),
        feedback: submission.feedback || '',
        comments: submission.facilitatorComments || '',
      };
    });
    setGrades(next);
  }, [task.id]);

  const rows = students.map((student) => {
    const submission = taskSubmissions.find((item) => item.studentId === student.id);
    const resolvedStatus = submissionStatusFor(task, submission);
    return { student, submission, status: resolvedStatus };
  }).filter((row) => {
    const haystack = `${studentDisplayName(row.student)} ${row.student.studentId || ''} ${row.student.programSection || ''}`.toLowerCase();
    return haystack.includes(search.toLowerCase()) && (status === 'All' || row.status === status);
  });
  const displayed = rows.slice((page - 1) * pageSize, page * pageSize);

  const saveGrade = (submission: CwtsSubmission, requestedRevision = false) => {
    const grade = grades[submission.studentId] || { score: '', feedback: '', comments: '' };
    const score = Number(grade.score);
    if (Number.isNaN(score) || score < 0 || score > task.points) {
      toast.error(`Score must be between 0 and ${task.points}.`);
      return;
    }
    const next = loadCwtsSubmissions().map((item) => item.id === submission.id ? {
      ...item,
      score,
      feedback: grade.feedback,
      facilitatorComments: grade.comments,
      status: requestedRevision ? 'Revision Requested' as const : 'Graded' as const,
      gradedAt: new Date().toISOString(),
      gradedBy: facilitator.name,
    } : item);
    saveCwtsSubmissions(next);
    addAudit(facilitator, requestedRevision ? 'CWTS revision requested' : 'CWTS submission graded', 'CWTS Submission', submission.id, `${task.title} / ${score}/${task.points}`);
    onUpdated();
    toast.success(requestedRevision ? 'Revision request sent.' : 'Submission graded.');
  };

  const exportRows = rows.map(({ student, submission, status: rowStatus }) => ({
    Assessment: task.title,
    Semester: task.semester,
    Student: studentDisplayName(student),
    StudentID: student.studentId || student.id,
    Municipality: student.municipality,
    Section: student.programSection,
    Status: rowStatus,
    SubmittedAt: submission?.submittedAt || '',
    SubmissionType: submission?.submissionType || '',
    Link: submission?.link || '',
    Files: submission?.fileNames.join('; ') || '',
    Score: submission?.score ?? '',
    Feedback: submission?.feedback || '',
  }));

  return (
    <ModalShell title={task.title} subtitle="Submission monitoring, grading, missing output tracking, and export." onClose={onClose} wide>
      <div className="grid gap-3 sm:grid-cols-4">
        <AnalyticsCard label="Submitted" value={taskSubmissions.length} detail={`${students.length} scoped students`} icon={Send} tone="blue" />
        <AnalyticsCard label="Missing" value={Math.max(0, students.length - taskSubmissions.length)} detail="No submission record" icon={Search} tone="rose" />
        <AnalyticsCard label="Graded" value={taskSubmissions.filter((item) => item.status === 'Graded').length} detail="Evaluated outputs" icon={CheckCircle2} tone="emerald" />
        <AnalyticsCard label="Completion" value={`${completionPercent(students.length, taskSubmissions.length)}%`} detail="Submission rate" icon={BarChart3} tone="amber" />
      </div>
      <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchField value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search student, ID, or section..." />
        <select value={status} onChange={(event) => { setStatus(event.target.value as CwtsSubmissionStatus | 'All'); setPage(1); }} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900">
          {statusOptions.map((item) => <option key={item}>{item}</option>)}
        </select>
        <button type="button" onClick={() => { downloadCsv(`${task.id}-cwts-submissions.csv`, exportRows); addAudit(facilitator, 'CWTS grades exported', 'CWTS Assessment', task.id, `${exportRows.length} rows`); }} className={secondaryButton}><Download className="h-4 w-4" /> Export grades</button>
      </div>
      <div className="mt-4 overflow-auto rounded-2xl border border-slate-200 dark:border-slate-800">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500 dark:bg-slate-900">
            <tr><th className="px-4 py-3">Student</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Submission</th><th className="px-4 py-3">Score</th><th className="px-4 py-3">Feedback</th><th className="px-4 py-3">Action</th></tr>
          </thead>
          <tbody>
            {displayed.map(({ student, submission, status: rowStatus }) => (
              <tr key={student.id} className="border-t border-slate-100 align-top dark:border-slate-800">
                <td className="sticky left-0 bg-white px-4 py-3 font-semibold text-slate-950 dark:bg-slate-950 dark:text-white">
                  {studentDisplayName(student)}
                  <span className="block text-xs font-normal text-slate-500">{student.studentId || student.id} / {student.municipality || 'No municipality'}</span>
                </td>
                <td className="px-4 py-3"><StatusBadge value={rowStatus} /></td>
                <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
                  {submission ? (
                    <div className="space-y-1">
                      <p className="font-semibold">{submission.submissionType}</p>
                      <p>{new Date(submission.submittedAt).toLocaleString()}</p>
                      {submission.link ? <a className="font-bold text-blue-700 underline" href={submission.link} target="_blank" rel="noreferrer">Open link</a> : null}
                      {submission.fileNames.length ? <p>{submission.fileNames.join(', ')}</p> : null}
                    </div>
                  ) : <span className="text-slate-400">No submission</span>}
                </td>
                <td className="px-4 py-3"><input disabled={!submission} value={grades[student.id]?.score || ''} onChange={(event) => setGrades((current) => ({ ...current, [student.id]: { score: event.target.value, feedback: current[student.id]?.feedback || '', comments: current[student.id]?.comments || '' } }))} className="h-10 w-20 rounded-xl border border-slate-200 px-2 text-sm dark:border-slate-700 dark:bg-slate-900" placeholder={`/${task.points}`} /></td>
                <td className="px-4 py-3"><textarea disabled={!submission} value={grades[student.id]?.feedback || ''} onChange={(event) => setGrades((current) => ({ ...current, [student.id]: { score: current[student.id]?.score || '', feedback: event.target.value, comments: current[student.id]?.comments || '' } }))} rows={2} className="w-64 rounded-xl border border-slate-200 p-2 text-sm dark:border-slate-700 dark:bg-slate-900" placeholder="Feedback to student" /></td>
                <td className="px-4 py-3">
                  {submission ? <div className="flex flex-col gap-2"><button type="button" onClick={() => saveGrade(submission)} className={primaryButton}><Save className="h-4 w-4" /> Grade</button><button type="button" onClick={() => saveGrade(submission, true)} className={secondaryButton}>Request revision</button></div> : <span className="text-xs text-slate-400">Awaiting output</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager page={page} totalPages={Math.ceil(rows.length / pageSize)} onPage={setPage} total={rows.length} pageSize={pageSize} onPageSize={(size) => { setPageSize(size); setPage(1); }} pageSizeOptions={[5, 10, 25, 50]} />
    </ModalShell>
  );
}

export default function CwtsAssessmentWorkspace({ role, user, studentId, students, title = 'CWTS Academic Engagement Workspace', description = 'Assessment-related activities extracted from CWTS 1 and CWTS 2 syllabi and converted into digital LMS-style tasks.' }: CwtsAssessmentWorkspaceProps) {
  const [tasks, setTasks] = useState(loadCwtsAssessmentTasks);
  const [submissions, setSubmissions] = useState(loadCwtsSubmissions);
  const [semester, setSemester] = useState<CwtsSemester | 'All'>('All');
  const [category, setCategory] = useState<string>('All');
  const [query, setQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState<CwtsAssessmentTask | null>(null);
  const [editingTask, setEditingTask] = useState<CwtsAssessmentTask | null>(null);
  const [deletingTask, setDeletingTask] = useState<CwtsAssessmentTask | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [municipality, setMunicipality] = useState<BiliranMunicipality | 'All Assigned'>('All Assigned');

  useEffect(() => {
    const reload = () => {
      setTasks(loadCwtsAssessmentTasks());
      setSubmissions(loadCwtsSubmissions());
    };
    window.addEventListener('nstp-cwts-assessments-updated', reload);
    window.addEventListener('nstp-cwts-submissions-updated', reload);
    return () => {
      window.removeEventListener('nstp-cwts-assessments-updated', reload);
      window.removeEventListener('nstp-cwts-submissions-updated', reload);
    };
  }, []);

  const student = role === 'student' ? resolveStudent(user, studentId) : undefined;
  const studentIsCwts = role !== 'student' || studentComponent(user) === 'CWTS' || student?.component === 'CWTS';
  const scopedStudents = useMemo(() => {
    const source = (students?.length ? students : loadStudents()).filter((item) => item.component === 'CWTS');
    const allowed = user.municipalities?.length ? source.filter((item) => item.municipality && user.municipalities?.includes(item.municipality)) : source;
    return municipality === 'All Assigned' ? allowed : allowed.filter((item) => item.municipality === municipality);
  }, [students, user.municipalities, municipality]);
  const assignedMunicipalities = Array.from(new Set(scopedStudents.map((item) => item.municipality).filter(Boolean))) as BiliranMunicipality[];
  const allAssignedMunicipalities = Array.from(new Set(((students?.length ? students : loadStudents()).filter((item) => item.component === 'CWTS').map((item) => item.municipality).filter(Boolean)))) as BiliranMunicipality[];

  const visibleTasks = tasks.filter((task) => {
    if (role === 'student' && !canStudentAccessTask(task, student)) return false;
    if (role !== 'student' && task.status === 'Archived') return false;
    if (semester !== 'All' && task.semester !== semester) return false;
    if (category !== 'All' && task.category !== category) return false;
    const haystack = `${task.title} ${task.objective} ${task.instructions} ${task.category} ${task.semester}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });
  const displayedTasks = visibleTasks.slice((page - 1) * pageSize, page * pageSize);

  const studentSubmissions = student ? submissions.filter((submission) => submission.studentId === student.id) : [];
  const submittedCount = studentSubmissions.filter((submission) => ['Submitted', 'Late', 'Graded', 'Revision Requested'].includes(submission.status)).length;
  const gradedCount = studentSubmissions.filter((submission) => submission.status === 'Graded').length;
  const publishedCount = tasks.filter((task) => task.status === 'Published').length;
  const totalExpected = role === 'student' ? publishedCount : tasks.filter((task) => task.status === 'Published').length * scopedStudents.length;
  const facilitatorSubmitted = submissions.filter((submission) => tasks.some((task) => task.id === submission.assessmentId) && scopedStudents.some((studentRow) => studentRow.id === submission.studentId)).length;
  const completionRate = role === 'student' ? completionPercent(publishedCount, submittedCount) : completionPercent(totalExpected, facilitatorSubmitted);
  const recentlyGraded = submissions.filter((submission) => submission.status === 'Graded').length;
  const activeImmersion = tasks.filter((task) => task.status === 'Published' && ['Community Engagement', 'Journals', 'Major Performance Tasks'].includes(task.category)).length;

  const saveTask = (task: CwtsAssessmentTask) => {
    const ownedTask: CwtsAssessmentTask = {
      ...task,
      ownerId: task.ownerId || user.id,
      ownerName: task.ownerName || user.name,
      createdBy: task.createdBy === 'Facilitator' ? user.name : task.createdBy,
      updatedAt: new Date().toISOString(),
    };
    const next = tasks.some((item) => item.id === ownedTask.id) ? tasks.map((item) => item.id === ownedTask.id ? ownedTask : item) : [ownedTask, ...tasks];
    saveCwtsAssessmentTasks(next);
    setTasks(next);
    addAudit(user, task.id && tasks.some((item) => item.id === task.id) ? 'CWTS assessment updated' : 'CWTS assessment created', 'CWTS Assessment', ownedTask.id, `${ownedTask.title} / ${ownedTask.status}`);
  };

  const deleteTask = () => {
    if (!deletingTask) return;
    const next = tasks.filter((task) => task.id !== deletingTask.id);
    saveCwtsAssessmentTasks(next);
    setTasks(next);
    setDeletingTask(null);
    addAudit(user, 'CWTS assessment deleted', 'CWTS Assessment', deletingTask.id, deletingTask.title);
    toast.success('CWTS assessment deleted.');
  };

  const exportAll = () => {
    const rows = visibleTasks.flatMap((task) => {
      const taskSubmissions = submissions.filter((submission) => submission.assessmentId === task.id);
      if (role === 'student') {
        const submission = student ? taskSubmissions.find((item) => item.studentId === student.id) : undefined;
        return [{
          Semester: task.semester,
          Category: task.category,
          Assessment: task.title,
          DueDate: task.dueDate,
          Status: submissionStatusFor(task, submission),
          Score: submission?.score ?? '',
          Feedback: submission?.feedback || '',
        }];
      }
      return scopedStudents.map((row) => {
        const submission = taskSubmissions.find((item) => item.studentId === row.id);
        return {
          Municipality: row.municipality,
          Section: row.programSection,
          Student: studentDisplayName(row),
          StudentID: row.studentId || row.id,
          Semester: task.semester,
          Category: task.category,
          Assessment: task.title,
          DueDate: task.dueDate,
          Status: submissionStatusFor(task, submission),
          Score: submission?.score ?? '',
          Feedback: submission?.feedback || '',
        };
      });
    });
    downloadCsv('cwts-assessment-workspace-export.csv', rows);
    addAudit(user, 'CWTS workspace exported', 'CWTS Assessment', role, `${rows.length} rows`);
  };

  if (!studentIsCwts) {
    return (
      <>
        <PageIntro eyebrow="CWTS Workspace" title="CWTS activities are locked" description="This assessment workspace is available after the student is classified under CWTS." />
        <Panel><EmptyState title="Not available for this account" body="Use the regular assessment page for Common Phase, LTS, or MTS requirements." /></Panel>
      </>
    );
  }

  return (
    <section className="space-y-5">
      <PageIntro
        eyebrow="CWTS 1 and CWTS 2"
        title={title}
        description={description}
        actions={
          <>
            <button type="button" onClick={exportAll} className={secondaryButton}><Download className="h-4 w-4" /> Export</button>
            {role !== 'student' ? <button type="button" onClick={() => setEditingTask(createBlankCwtsTask())} className={primaryButton}><Plus className="h-4 w-4" /> Create task</button> : null}
          </>
        }
      />
      {role !== 'student' ? (
        <MunicipalityScopeBanner
          activeMunicipality={municipality}
          assignedMunicipalities={allAssignedMunicipalities.length ? allAssignedMunicipalities : assignedMunicipalities}
          onMunicipalityChange={(value) => setMunicipality(value)}
          recordCount={scopedStudents.length}
          label="CWTS Municipality Scope"
          helper="CWTS submissions, grades, exports, and missing-output analytics are limited to this assigned facilitator scope."
        />
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AnalyticsCard label="Completion rate" value={`${completionRate}%`} detail={role === 'student' ? `${submittedCount}/${publishedCount} submitted` : `${facilitatorSubmitted}/${totalExpected} expected submissions`} icon={BarChart3} tone="blue" />
        <AnalyticsCard label="Pending assessments" value={Math.max(0, publishedCount - (role === 'student' ? submittedCount : 0))} detail={role === 'student' ? 'Available activities left' : `${publishedCount} published CWTS tasks`} icon={Layers3} tone="amber" />
        <AnalyticsCard label="Recently graded works" value={role === 'student' ? gradedCount : recentlyGraded} detail="Score and feedback records" icon={CheckCircle2} tone="emerald" />
        <AnalyticsCard label="Active immersion activities" value={activeImmersion} detail="Journals, profiling, projects" icon={BookOpenCheck} tone="rose" />
      </div>
      <Panel>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <SearchField value={query} onChange={(value) => { setQuery(value); setPage(1); }} placeholder="Search CWTS activity, task, objective, or category..." />
          <select value={semester} onChange={(event) => { setSemester(event.target.value as CwtsSemester | 'All'); setPage(1); }} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900">
            {semesterOptions.map((item) => <option key={item}>{item}</option>)}
          </select>
          <select value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900">
            <option>All</option>
            {CWTS_ASSESSMENT_CATEGORIES.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
      </Panel>
      {visibleTasks.length ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {displayedTasks.map((task) => {
              const submission = student ? studentSubmissions.find((item) => item.assessmentId === task.id) : undefined;
              const taskSubmissions = submissions.filter((item) => item.assessmentId === task.id && scopedStudents.some((row) => row.id === item.studentId));
              const canManageTask = role === 'admin' || !task.ownerId || task.ownerId === user.id;
              return (
                <TaskCard
                  key={task.id}
                  task={task}
                  role={role}
                  status={role === 'student' ? submissionStatusFor(task, submission) : undefined}
                  submittedCount={role !== 'student' ? taskSubmissions.length : undefined}
                  totalStudents={role !== 'student' ? scopedStudents.length : undefined}
                  onOpen={() => setSelectedTask(task)}
                  onEdit={role !== 'student' && canManageTask ? () => setEditingTask(task) : undefined}
                  onDelete={role !== 'student' && canManageTask ? () => setDeletingTask(task) : undefined}
                />
              );
            })}
          </div>
          <Pager page={page} totalPages={Math.ceil(visibleTasks.length / pageSize)} onPage={setPage} total={visibleTasks.length} pageSize={pageSize} onPageSize={(size) => { setPageSize(size); setPage(1); }} pageSizeOptions={[6, 9, 12, 18]} />
        </>
      ) : <Panel><EmptyState title="No CWTS activities found" body="Try a different semester, category, or search keyword." /></Panel>}
      {selectedTask && role === 'student' ? (
        <StudentTaskModal task={selectedTask} student={student} actor={user} submission={studentSubmissions.find((item) => item.assessmentId === selectedTask.id)} onClose={() => setSelectedTask(null)} onSaved={() => setSubmissions(loadCwtsSubmissions())} />
      ) : null}
      {selectedTask && role !== 'student' ? (
        <SubmissionReviewModal task={selectedTask} students={scopedStudents} submissions={submissions} facilitator={user} onClose={() => setSelectedTask(null)} onUpdated={() => setSubmissions(loadCwtsSubmissions())} />
      ) : null}
      {editingTask ? <TaskEditorModal task={editingTask} onClose={() => setEditingTask(null)} onSave={saveTask} /> : null}
      <ConfirmDialog open={Boolean(deletingTask)} title="Delete CWTS assessment?" body={`This removes "${deletingTask?.title}" from the CWTS workspace. Existing student submission records remain stored for audit safety.`} confirmLabel="Delete assessment" onCancel={() => setDeletingTask(null)} onConfirm={deleteTask} />
    </section>
  );
}
