import { FileQuestion, ListChecks, Send } from 'lucide-react';
import AssessmentManager from '../../assessments/components/AssessmentManager';
import type { FacilitatorWorkspace } from '../hooks/useFacilitatorWorkspace';
import { EmptyState, PageIntro, Panel, StatusBadge } from '../components/FacilitatorUI';

export default function FacilitatorAssessmentsPage({ workspace }: { workspace: FacilitatorWorkspace }) {
  const submissionCount = (assessmentId: string) => workspace.students.filter((student) => {
    const raw = localStorage.getItem(`assessments-${student.id}`);
    if (!raw) return false;
    return Boolean((JSON.parse(raw) as Record<string, unknown>)[assessmentId]);
  }).length;

  return (
    <>
      <PageIntro
        eyebrow="Instruction and Evaluation"
        title="Assessment Management"
        description="Create quizzes or examinations, manage questions and answer keys, and publish assessments for your assigned learners."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Created by you', value: workspace.assessments.length, icon: FileQuestion },
          { label: 'Published', value: workspace.assessments.filter((assessment) => assessment.status === 'published').length, icon: Send },
          { label: 'Recorded submissions', value: workspace.assessments.reduce((sum, assessment) => sum + submissionCount(assessment.id), 0), icon: ListChecks },
        ].map(({ label, value, icon: Icon }) => (
          <Panel key={label}>
            <Icon className="h-5 w-5 text-blue-700 dark:text-blue-300" />
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
            <p className="mt-1 text-3xl font-bold text-slate-950 dark:text-white">{value}</p>
          </Panel>
        ))}
      </div>
      <Panel>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-950 dark:text-white">Assessment Library</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Select edit in the builder below to update details or manage the answer key.</p>
        </div>
        {workspace.assessments.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                <tr>{['Title', 'Module', 'Type', 'Number of items', 'Status', 'Published date', 'Submissions'].map((title) => <th key={title} className="px-4 py-3">{title}</th>)}</tr>
              </thead>
              <tbody>
                {workspace.assessments.map((assessment) => (
                  <tr key={assessment.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="px-4 py-4 font-semibold text-slate-900 dark:text-white">{assessment.title}</td>
                    <td className="px-4 py-4">{workspace.modules.find((module) => module.id === assessment.moduleId)?.title || assessment.moduleId || 'General'}</td>
                    <td className="px-4 py-4 capitalize">{assessment.type}</td>
                    <td className="px-4 py-4">{assessment.questions.length}</td>
                    <td className="px-4 py-4"><StatusBadge value={assessment.status} /></td>
                    <td className="px-4 py-4">{assessment.status === 'published' ? new Date(assessment.updatedAt).toLocaleDateString() : '--'}</td>
                    <td className="px-4 py-4 font-semibold">{submissionCount(assessment.id)} / {workspace.students.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState title="No facilitator assessments yet" body="Use the assessment builder below to create the first quiz or exam for your class." />}
      </Panel>
      <Panel>
        <AssessmentManager user={workspace.user} role="facilitator" />
      </Panel>
    </>
  );
}
