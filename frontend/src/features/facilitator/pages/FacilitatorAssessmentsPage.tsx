import { useState } from 'react';
import { FileQuestion, ListChecks, Send } from 'lucide-react';
import AssessmentManager from '../../assessments/components/AssessmentManager';
import { usesCwtsContent } from '../../../data/nstpData';
import type { FacilitatorWorkspace } from '../hooks/useFacilitatorWorkspace';
import { EmptyState, PageIntro, Pager, Panel, StatusBadge } from '../components/FacilitatorUI';
import CwtsAssessmentWorkspace from '../../cwts/components/CwtsAssessmentWorkspace';

export default function FacilitatorAssessmentsPage({ workspace }: { workspace: FacilitatorWorkspace }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const submissionCount = (assessmentId: string) => workspace.students.filter((student) => {
    const raw = localStorage.getItem(`assessments-${student.id}`);
    if (!raw) return false;
    return Boolean((JSON.parse(raw) as Record<string, unknown>)[assessmentId]);
  }).length;
  const displayed = workspace.assessments.slice((page - 1) * pageSize, page * pageSize);

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
          <>
          <div className="overflow-auto rounded-xl border border-[#edf1f6]">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="sticky top-0 z-10 bg-[#f7f9fc] text-xs uppercase tracking-[0.12em] text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                <tr>{['Title', 'Module', 'Type', 'Number of items', 'Status', 'Published date', 'Submissions'].map((title) => <th key={title} className="px-4 py-3">{title}</th>)}</tr>
              </thead>
              <tbody>
                {displayed.map((assessment) => (
                  <tr key={assessment.id} className="border-b border-slate-100 transition hover:bg-blue-50/35 dark:border-slate-800 dark:hover:bg-slate-900">
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
          <Pager page={page} totalPages={Math.ceil(workspace.assessments.length / pageSize)} onPage={setPage} total={workspace.assessments.length} pageSize={pageSize} onPageSize={(size) => { setPageSize(size); setPage(1); }} pageSizeOptions={[10, 25, 50]} />
          </>
        ) : <EmptyState title="No facilitator assessments yet" body="Use the assessment builder below to create the first quiz or exam for your class." />}
      </Panel>
      <Panel>
        <AssessmentManager user={workspace.user} role="facilitator" />
      </Panel>
      {usesCwtsContent(workspace.user.component) ? (
        <CwtsAssessmentWorkspace
          role="facilitator"
          user={workspace.user}
          students={workspace.students}
          title={workspace.user.component === 'CWTS-Sunday' ? 'CWTS-Sunday Performance Task Workspace' : 'CWTS Performance Task Workspace'}
          description={workspace.user.component === 'CWTS-Sunday' ? 'Manage Sunday CWTS learners with the shared CWTS 1 and CWTS 2 assessment structure while keeping submissions and grades separate.' : 'Manage CWTS 1 and CWTS 2 reflections, journals, reports, videos, community immersion documents, proposals, and performance tasks extracted from the approved CWTS syllabi.'}
        />
      ) : null}
    </>
  );
}
