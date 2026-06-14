import { useState, useEffect, useMemo } from 'react';
import { FileText, CheckCircle, Clock, Award, TrendingUp, History, AlertTriangle, ArrowLeft, ShieldCheck } from 'lucide-react';
import { contentComponentFor, loadAssessments, loadModules, NstpAssessment, type NstpComponent, type NstpModule } from '../data/nstpData';

type AssessmentAudience = NstpComponent | 'MTS' | 'Common' | 'Common Phase';

const componentFromUser = (user: any): NstpComponent | undefined => {
  if (user.component) return user.component;
  if (user.demoStage === 'cwts') return 'CWTS';
  if (user.demoStage === 'cwts-coastguard') return 'CWTS-Coastguard';
  if (user.demoStage === 'cwts-sunday') return 'CWTS-Sunday';
  if (user.demoStage === 'lts') return 'LTS';
  if (user.demoStage === 'mts') return 'MTS';
  return undefined;
};

const assessmentAudience = (assessment: NstpAssessment, modules: NstpModule[]): AssessmentAudience => {
  const explicit = (assessment as any).component || (assessment as any).phase;
  if (explicit) return explicit;
  return modules.find((module) => module.id === assessment.moduleId)?.component || 'Common';
};

const canAccessAssessment = (assessment: NstpAssessment, modules: NstpModule[], user: any) => {
  const component = componentFromUser(user);
  const classified = user.commonPhaseStatus === 'approved' || Boolean(component);
  const audience = assessmentAudience(assessment, modules);

  if (!classified) return audience === 'Common' || audience === 'Common Phase';
  if (audience === 'Common' || audience === 'Common Phase') return true;
  return component ? audience === contentComponentFor(component) : false;
};

export default function AssessmentsPage({ user, onBack, studentId }: { user: any; onBack?: () => void; studentId?: string }) {
  const [library, setLibrary] = useState<NstpAssessment[]>([]);
  const [results, setResults] = useState<Record<string, any>>({});
  const [activeAssessment, setActiveAssessment] = useState<NstpAssessment | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [attemptHistory, setAttemptHistory] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingAssessment, setSubmittingAssessment] = useState(false);
  const resultStorageId = studentId || user.id;
  const modules = useMemo(() => loadModules(), []);
  const component = componentFromUser(user);
  const classified = user.commonPhaseStatus === 'approved' || Boolean(component);
  const stageLabel = classified ? `${component || 'Component'} assessments` : 'Common Phase assessments';

  useEffect(() => {
    const refresh = () => {
      setLoading(true);
      setError(null);
      try {
        setLibrary(loadAssessments().filter((assessment) => (
          assessment.status === 'published' && canAccessAssessment(assessment, modules, user)
        )));
      } catch {
        setError('Unable to load assessments right now. Please refresh or contact the NSTP office.');
      } finally {
        setLoading(false);
      }
    };

    refresh();
    window.addEventListener('nstp-assessments-updated', refresh);
    return () => window.removeEventListener('nstp-assessments-updated', refresh);
  }, [modules, user]);

  useEffect(() => {
    const saved = localStorage.getItem(`assessments-${resultStorageId}`);
    const savedHistory = localStorage.getItem(`assessments-history-${resultStorageId}`);
    if (saved) setResults(JSON.parse(saved));
    if (savedHistory) setAttemptHistory(JSON.parse(savedHistory));
  }, [resultStorageId]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || !activeAssessment) return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t === null) return null;
        if (t <= 1) {
          handleSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, activeAssessment]);

  const startAssessment = (assessment: NstpAssessment) => {
    setActiveAssessment(assessment);
    setAnswers({});
    setTimeLeft(assessment.timeLimit * 60);
  };

  const handleSubmit = () => {
    if (!activeAssessment) return;
    if (submittingAssessment) return;
    setSubmittingAssessment(true);

    const correct = activeAssessment.questions.reduce((acc, question, index) => {
      return answers[index] === question.correctIndex ? acc + 1 : acc;
    }, 0);
    const total = activeAssessment.questions.length;
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;

    const nextResults = {
      ...results,
      [activeAssessment.id]: {
        score,
        correct,
        total,
        passed: score >= activeAssessment.passingScore,
        date: new Date().toISOString(),
      },
    };

    const attempt = {
      score,
      correct,
      total,
      passed: score >= activeAssessment.passingScore,
      date: new Date().toISOString(),
    };

    const nextHistory = {
      ...attemptHistory,
      [activeAssessment.id]: [attempt, ...(attemptHistory[activeAssessment.id] || [])].slice(0, 5),
    };

    setResults(nextResults);
    setAttemptHistory(nextHistory);
    localStorage.setItem(`assessments-${resultStorageId}`, JSON.stringify(nextResults));
    localStorage.setItem(`assessments-history-${resultStorageId}`, JSON.stringify(nextHistory));
    setActiveAssessment(null);
    setTimeLeft(null);
    window.setTimeout(() => setSubmittingAssessment(false), 400);
  };

  const formatTime = (seconds: number | null) => {
    const safeSeconds = seconds ?? 0;
    const mins = Math.floor(safeSeconds / 60);
    const secs = safeSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (activeAssessment) {
    const answeredCount = Object.keys(answers).length;

    return (
      <div className="size-full overflow-auto bg-[#fcfaf6] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{activeAssessment.title}</h1>
              <div className="flex items-center gap-2 text-blue-700 bg-blue-100 px-4 py-2 rounded-xl dark:bg-blue-500/15 dark:text-blue-100">
                <Clock className="w-5 h-5" />
                <span className="font-mono font-semibold">{formatTime(timeLeft)}</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-600 dark:text-slate-300">
              <span>{activeAssessment.questions.length} questions</span>
              <span>Passing score: {activeAssessment.passingScore}%</span>
              <span>{answeredCount}/{activeAssessment.questions.length} answered</span>
            </div>
            {timeLeft !== null && timeLeft <= 120 && (
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-100 text-rose-700 text-sm font-medium dark:bg-rose-500/15 dark:text-rose-100">
                <AlertTriangle className="w-4 h-4" />
                Less than 2 minutes remaining
              </div>
            )}
          </div>

          <div className="space-y-6 mb-6">
            {activeAssessment.questions.map((question, index) => (
              <div key={question.id} className="bg-white rounded-2xl border border-slate-200 p-6 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                <h3 className="font-semibold text-slate-900 mb-4 dark:text-slate-100">{index + 1}. {question.prompt}</h3>
                <div className="space-y-3">
                  {question.options.map((option, optionIndex) => (
                    <label
                      key={optionIndex}
                      className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${answers[index] === optionIndex ? 'border-blue-600 bg-blue-50 dark:border-blue-400 dark:bg-blue-500/15' : 'border-slate-200 hover:border-blue-300 dark:border-slate-700 dark:bg-slate-950/40 dark:hover:border-blue-400'}`}
                    >
                      <input
                        type="radio"
                        name={`question-${index}`}
                        checked={answers[index] === optionIndex}
                        onChange={() => setAnswers({ ...answers, [index]: optionIndex })}
                        className="w-4 h-4 text-blue-600 dark:text-blue-400"
                      />
                      <span className="text-slate-700 dark:text-slate-200">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-300">Questions answered: {answeredCount} / {activeAssessment.questions.length}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setActiveAssessment(null)} disabled={submittingAssessment} className="px-6 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800">Cancel</button>
                <button onClick={handleSubmit} disabled={submittingAssessment} className="bg-gradient-to-r from-blue-700 to-yellow-500 text-white px-8 py-2 rounded-xl hover:opacity-95 transition-opacity cursor-pointer disabled:cursor-not-allowed disabled:opacity-65">{submittingAssessment ? 'Submitting...' : 'Submit Assessment'}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const completedCount = Object.keys(results).length;
  const averageScore = completedCount > 0 ? Math.round(Object.values(results).reduce((acc: number, result: any) => acc + result.score, 0) / completedCount) : 0;
  const passingRate = completedCount > 0 ? Math.round((Object.values(results).filter((result: any) => {
    if (result.manualStatus === 'passed') return true;
    if (result.manualStatus === 'failed') return false;
    return result.passed;
  }).length / completedCount) * 100) : 0;

  return (
    <div className="min-h-full overflow-visible bg-[#fcfaf6] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 p-2 md:p-4">
        {onBack && (
          <button
            onClick={onBack}
            className="module-btn clickable-button mb-1 w-fit px-3 py-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        )}

        <div className="flex flex-col gap-3 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm dark:border-blue-500/20 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">Student Assessment Workspace</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-950 dark:text-slate-100">Assessments & Examinations</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Showing only assessments authorized for your current NSTP stage.</p>
          </div>
          <span className="posh-tag border-blue-200 bg-blue-100 text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-100">
            <ShieldCheck className="h-4 w-4" /> {stageLabel}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="posh-kpi">
            <div className="flex items-center gap-3 mb-2"><FileText className="w-5 h-5 text-blue-700" /><span className="text-sm text-slate-600 dark:text-slate-300">Available Assessments</span></div>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{library.length}</p>
          </div>
          <div className="posh-kpi">
            <div className="flex items-center gap-3 mb-2"><CheckCircle className="w-5 h-5 text-green-600" /><span className="text-sm text-slate-600 dark:text-slate-300">Completed</span></div>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{completedCount}</p>
          </div>
          <div className="posh-kpi">
            <div className="flex items-center gap-3 mb-2"><Award className="w-5 h-5 text-blue-600" /><span className="text-sm text-slate-600 dark:text-slate-300">Average Score</span></div>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{averageScore}%</p>
          </div>
          <div className="posh-kpi">
            <div className="flex items-center gap-3 mb-2"><TrendingUp className="w-5 h-5 text-rose-600" /><span className="text-sm text-slate-600 dark:text-slate-300">Passing Rate</span></div>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{passingRate}%</p>
          </div>
        </div>

        <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,1.18fr)_minmax(300px,0.82fr)]">
          <div className="bento-panel min-h-0 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-700">Assessment Library</h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">{library.length} items</span>
            </div>
            <div className="space-y-3 xl:max-h-[calc(100dvh-22rem)] xl:overflow-auto xl:pr-1">
              {loading && (
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-8 text-center text-sm font-semibold text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100">Loading authorized assessments...</div>
              )}
              {error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-sm font-semibold text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100">{error}</div>
              )}
              {!loading && !error && library.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  <p className="font-bold">No available assessments</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Published {stageLabel.toLowerCase()} will appear here once released by your facilitator or admin.</p>
                </div>
              )}
              {library.map((assessment) => {
            const result = results[assessment.id];
            const history = attemptHistory[assessment.id] || [];
            const isExam = assessment.type === 'exam';
            const effectivePassed = result
              ? result.manualStatus === 'passed'
                ? true
                : result.manualStatus === 'failed'
                ? false
                : Boolean(result.passed)
              : false;

            return (
              <div key={assessment.id} className="interactive-card min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 sm:p-5">
                <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${isExam ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-100' : 'bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-100'}`}>{isExam ? 'MAJOR EXAM' : 'QUIZ'}</span>
                      <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${assessment.status === 'published' ? 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-100' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200'}`}>{assessment.status.toUpperCase()}</span>
                      {result && <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${effectivePassed ? 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-100' : 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-100'}`}>{effectivePassed ? 'PASSED' : 'FAILED'}</span>}
                      {result?.manualStatus && <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-100">ADMIN OVERRIDE</span>}
                    </div>
                    <h3 className="mb-2 break-words text-lg font-semibold text-slate-900 dark:text-slate-100">{assessment.title}</h3>
                    <p className="text-sm text-slate-600 mb-3 dark:text-slate-300">{assessment.description}</p>
                    <div className="mb-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600 dark:text-slate-300">
                      <span className="flex items-center gap-1"><FileText className="w-4 h-4" />{assessment.questions.length} questions</span>
                      <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{assessment.timeLimit} minutes</span>
                      <span>Passing: {assessment.passingScore}%</span>
                      <span className="min-w-0 break-words">Owner: {assessment.ownerName}</span>
                    </div>
                    {result && (
                      <div className="flex items-center gap-2 text-sm">
                        <Award className={`w-4 h-4 ${effectivePassed ? 'text-green-600' : 'text-red-600'}`} />
                        <span className="font-semibold text-slate-900 dark:text-slate-100">Score: {result.score}% ({result.correct}/{result.total})</span>
                        <span className="text-slate-600 dark:text-slate-300">/ Taken on {new Date(result.date).toLocaleDateString()}</span>
                      </div>
                    )}
                    {history.length > 1 && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <History className="w-4 h-4" /> {history.length} recent attempts recorded
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => startAssessment(assessment)}
                    className={`module-btn clickable-button w-full justify-center lg:w-auto ${result ? '' : 'module-btn-primary border-0 text-white'}`}
                  >
                    {result ? 'Retake' : 'Start Assessment'}
                  </button>
                </div>
              </div>
            );
              })}
            </div>
          </div>

          <div className="grid gap-3">
            <div className="bento-panel p-4">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-blue-700">Performance Snapshot</h3>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                  <p className="text-xs uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-200">Average Score</p>
                  <p className="mt-1 text-3xl font-bold text-emerald-700 dark:text-emerald-200">{averageScore}%</p>
                </div>
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-500/20 dark:bg-rose-500/10">
                  <p className="text-xs uppercase tracking-[0.14em] text-rose-700 dark:text-rose-200">Passing Rate</p>
                  <p className="mt-1 text-3xl font-bold text-rose-700 dark:text-rose-200">{passingRate}%</p>
                </div>
              </div>
            </div>

            <div className="bento-panel p-4">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-blue-700">Recent Attempts</h3>
              <div className="space-y-3 xl:max-h-[28rem] xl:overflow-auto xl:pr-1">
                {Object.entries(results).length === 0 ? (
                  <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">No attempts yet.</p>
                ) : (
                  Object.entries(results)
                    .slice(0, 12)
                    .map(([assessmentId, result]) => (
                      <div key={assessmentId} className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{assessmentId}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-300">Score: {result.score}% / {new Date(result.date).toLocaleDateString()}</p>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
