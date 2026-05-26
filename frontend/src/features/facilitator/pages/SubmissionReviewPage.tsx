import { useMemo, useState } from 'react';
import { Save } from 'lucide-react';
import { addAudit } from '../../../data/workflowData';
import { safeJsonParse } from '../../../data/nstpData';
import type { FacilitatorWorkspace } from '../hooks/useFacilitatorWorkspace';
import { EmptyState, PageIntro, Panel, SearchField, StatusBadge } from '../components/FacilitatorUI';

type Review = {
  assessmentId: string;
  studentId: string;
  status: 'Submitted' | 'Missing' | 'Late' | 'Graded';
  score: number | null;
  feedback: string;
};

export default function SubmissionReviewPage({ workspace, notify }: { workspace: FacilitatorWorkspace; notify: (message: string) => void }) {
  const key = `nstp-submission-reviews-${workspace.user.id}`;
  const [reviews, setReviews] = useState<Record<string, Review>>(() => safeJsonParse(localStorage.getItem(key), {}));
  const [assessment, setAssessment] = useState('all');
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const rows = useMemo(() => workspace.assessments.flatMap((item) => workspace.students.map((student) => {
    const rowKey = `${item.id}:${student.id}`;
    const submission = safeJsonParse<Record<string, unknown>>(localStorage.getItem(`assessments-${student.id}`), {});
    const inferred: Review['status'] = submission[item.id] ? 'Submitted' : 'Missing';
    return { key: rowKey, item, student, review: reviews[rowKey] || { assessmentId: item.id, studentId: student.id, status: inferred, score: null, feedback: '' } };
  })).filter((row) => (assessment === 'all' || row.item.id === assessment) && (status === 'all' || row.review.status === status) && (!search || row.student.name.toLowerCase().includes(search.toLowerCase()))), [workspace.assessments, workspace.students, reviews, assessment, status, search]);

  const update = (rowKey: string, review: Review) => setReviews((current) => ({ ...current, [rowKey]: review }));
  const save = () => {
    localStorage.setItem(key, JSON.stringify(reviews));
    workspace.recordActivity('Submissions reviewed', `${Object.keys(reviews).length} review records saved`);
    addAudit(workspace.user, 'Submission review saved', 'Assessment', 'scoped-reviews', 'Scores and feedback updated for assigned students.');
    notify('Submission scores and feedback saved.');
  };

  return (
    <>
      <PageIntro eyebrow="Evaluation" title="Submission Review" description="View submissions per facilitator assessment, identify missing or late work, and encode scores and feedback." actions={<button type="button" onClick={save} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white"><Save className="h-4 w-4" /> Save reviews</button>} />
      <Panel>
        <div className="mb-4 flex flex-col gap-3 lg:flex-row">
          <SearchField value={search} onChange={setSearch} placeholder="Search student" />
          <select value={assessment} onChange={(event) => setAssessment(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"><option value="all">All assessments</option>{workspace.assessments.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"><option value="all">All statuses</option>{['Submitted', 'Missing', 'Late', 'Graded'].map((value) => <option key={value}>{value}</option>)}</select>
        </div>
        {rows.length ? <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900"><tr><th className="px-4 py-3">Assessment</th><th className="px-4 py-3">Student</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Score</th><th className="px-4 py-3">Feedback</th></tr></thead>
            <tbody>{rows.map(({ key: rowKey, item, student, review }) => <tr key={rowKey} className="border-b border-slate-100 dark:border-slate-800">
              <td className="px-4 py-3 font-semibold">{item.title}</td><td className="px-4 py-3">{student.name}</td>
              <td className="px-4 py-3"><select value={review.status} onChange={(event) => update(rowKey, { ...review, status: event.target.value as Review['status'] })} className="mb-1 rounded-lg border px-2 py-1.5 dark:border-slate-700 dark:bg-slate-900">{['Submitted', 'Missing', 'Late', 'Graded'].map((value) => <option key={value}>{value}</option>)}</select><StatusBadge value={review.status} /></td>
              <td className="px-4 py-3"><input type="number" min={0} max={100} value={review.score ?? ''} onChange={(event) => update(rowKey, { ...review, score: event.target.value ? Number(event.target.value) : null, status: event.target.value ? 'Graded' : review.status })} className="w-20 rounded-lg border px-2 py-2 dark:border-slate-700 dark:bg-slate-900" /></td>
              <td className="px-4 py-3"><input value={review.feedback} onChange={(event) => update(rowKey, { ...review, feedback: event.target.value })} placeholder="Feedback to learner" className="w-full rounded-lg border px-3 py-2 dark:border-slate-700 dark:bg-slate-900" /></td>
            </tr>)}</tbody>
          </table>
        </div> : <EmptyState title="No submission rows" body="Create an assessment to review assigned student submissions." />}
      </Panel>
    </>
  );
}
