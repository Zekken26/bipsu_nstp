import { Award, BookOpen, CheckCircle, Clock, FileText, LockKeyhole, TrendingUp } from 'lucide-react';
import { loadAssessments, loadGradeRecords, loadModules, loadStudents, safeJsonParse } from '../data/nstpData';

export default function GradesPage({ user }: { user: any }) {
  const students = loadStudents();
  const modules = loadModules();
  const assessments = loadAssessments().filter((assessment) => assessment.status === 'published');
  const gradeRecords = loadGradeRecords();
  const student = students.find((item) => item.id === user.id || item.email.toLowerCase() === String(user.email || '').toLowerCase() || item.studentId === user.studentId);
  const studentId = user.studentId || student?.studentId || 'Pending';
  const gradeRecord = gradeRecords.find((record) => record.studentId === studentId);
  const assessmentResults = safeJsonParse<Record<string, any>>(localStorage.getItem(`assessments-${user.id}`), {});
  const moduleProgress = safeJsonParse<Record<string, boolean>>(localStorage.getItem(`progress-${user.id}`), {});

  const completedModules = modules.filter((module) => moduleProgress[module.id]).length;
  const completedHours = modules.length > 0
    ? Math.round((completedModules / modules.length) * modules.reduce((total, module) => total + module.hours, 0))
    : 0;
  const completedAssessments = Object.keys(assessmentResults).length;
  const averageAssessment = completedAssessments > 0
    ? Math.round(Object.values(assessmentResults).reduce((total: number, result: any) => total + (Number(result.score) || 0), 0) / completedAssessments)
    : 0;
  const computedStanding = gradeRecord
    ? Math.round(((gradeRecord.prelim || 0) + (gradeRecord.midterm || 0) + (gradeRecord.final || 0)) / (gradeRecord.final > 0 ? 3 : 2))
    : averageAssessment;
  const releaseLabel = gradeRecord?.released ? 'Released by NSTP Office' : 'Pending official release';

  return (
    <div className="bento-screen space-y-4 overflow-auto pr-1">
      <div className="grid gap-4 xl:grid-cols-6">
        <div className="bento-panel p-6 xl:col-span-4 xl:row-span-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300">Student Grade Portal</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">Official NSTP academic standing</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
            Grades are tied to the approved BiPSU student ID, Common Module progress, assessment performance, and NSTP office release status.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white/75 p-4 dark:border-slate-700 dark:bg-slate-900/70">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Student ID</p>
              <p className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">{studentId}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white/75 p-4 dark:border-slate-700 dark:bg-slate-900/70">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Standing</p>
              <p className="mt-1 text-xl font-bold text-blue-700 dark:text-blue-300">{computedStanding || 0}%</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white/75 p-4 dark:border-slate-700 dark:bg-slate-900/70">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Release</p>
              <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">{releaseLabel}</p>
            </div>
          </div>
        </div>

        <div className="bento-panel p-5 xl:col-span-2">
          <Award className="mb-3 h-5 w-5 text-amber-600" />
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Final Remarks</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{gradeRecord?.remarks || 'In Progress'}</p>
          {!gradeRecord?.released && (
            <p className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-300">
              <LockKeyhole className="h-3.5 w-3.5" />
              Registrar/NSTP office verification required
            </p>
          )}
        </div>

        <div className="bento-panel p-5 xl:col-span-2">
          <Clock className="mb-3 h-5 w-5 text-blue-700 dark:text-blue-300" />
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Contact Hours</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{completedHours}/25</p>
        </div>

        <div className="bento-panel p-5 xl:col-span-3">
          <p className="mb-4 text-sm font-bold text-slate-900 dark:text-slate-100">Grade Breakdown</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ['Prelim', gradeRecord?.prelim ?? 0],
              ['Midterm', gradeRecord?.midterm ?? 0],
              ['Final', gradeRecord?.final ?? 0],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-white/75 p-4 dark:border-slate-700 dark:bg-slate-900/70">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{label}</p>
                <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{value}%</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bento-panel p-5 xl:col-span-3">
          <p className="mb-4 text-sm font-bold text-slate-900 dark:text-slate-100">Academic Inputs</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white/75 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/70">
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200"><BookOpen className="h-4 w-4 text-blue-700" />Modules completed</span>
              <span className="font-bold">{completedModules}/{modules.length}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white/75 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/70">
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200"><FileText className="h-4 w-4 text-emerald-600" />Assessments taken</span>
              <span className="font-bold">{completedAssessments}/{assessments.length}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white/75 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/70">
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200"><TrendingUp className="h-4 w-4 text-amber-600" />Assessment average</span>
              <span className="font-bold">{averageAssessment}%</span>
            </div>
          </div>
        </div>

        <div className="bento-panel p-5 xl:col-span-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Clearance Checklist</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">Complete these before the final grade is considered fully cleared.</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {[
                ['Approved student ID', studentId !== 'Pending'],
                ['25 contact hours', completedHours >= 25],
                ['Major exam record', assessments.some((assessment) => assessment.type === 'exam' && assessmentResults[assessment.id])],
              ].map(([label, done]) => (
                <span key={String(label)} className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold ${done ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                  <CheckCircle className="h-3.5 w-3.5" />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
