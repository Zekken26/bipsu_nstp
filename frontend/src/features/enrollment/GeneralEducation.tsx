import { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Video, CheckCircle, Play, Lock, Award, LogOut, Sparkles, Flame, Target, BookOpen, ShieldCheck, ArrowRight, LayoutDashboard } from 'lucide-react';
import RoleShell from '../../components/layout/RoleShell';

const SEMINARS = [
  {
    id: 'sem1',
    title: 'Seminar 1: Introduction to National Service',
    speaker: 'Dr. Maria Elena Santos',
    position: 'NSTP Program Director',
    duration: 3,
    date: '2026-04-25',
    time: '9:00 AM - 12:00 PM',
    status: 'upcoming',
    description: 'Overview of NSTP, its legal basis, and the role of civic consciousness in nation-building.'
  },
  {
    id: 'sem2',
    title: 'Seminar 2: Philippine Constitution and Citizenship',
    speaker: 'Atty. Carlos Reyes',
    position: 'Constitutional Law Expert',
    duration: 3,
    date: '2026-04-26',
    time: '1:00 PM - 4:00 PM',
    status: 'scheduled',
    description: 'Understanding constitutional rights, duties, and responsibilities of Filipino citizens.'
  },
  {
    id: 'sem3',
    title: 'Seminar 3: Community Development Strategies',
    speaker: 'Engr. Ramon Torres',
    position: 'Community Development Specialist',
    duration: 3,
    date: '2026-04-28',
    time: '9:00 AM - 12:00 PM',
    status: 'scheduled',
    description: 'Participatory approaches to community needs assessment and sustainable development.'
  },
  {
    id: 'sem4',
    title: 'Seminar 4: Leadership and Ethics',
    speaker: 'Dr. Anna Marie Cruz',
    position: 'Leadership Development Coach',
    duration: 3,
    date: '2026-04-29',
    time: '2:00 PM - 5:00 PM',
    status: 'scheduled',
    description: 'Developing ethical leadership, effective communication, and team collaboration skills.'
  },
  {
    id: 'sem5',
    title: 'Seminar 5: Disaster Risk Reduction and Management',
    speaker: 'Col. Jose Villanueva (Ret.)',
    position: 'DRRM Coordinator',
    duration: 4,
    date: '2026-05-02',
    time: '8:00 AM - 12:00 PM',
    status: 'scheduled',
    description: 'Emergency preparedness, response protocols, and community-based disaster management.'
  },
  {
    id: 'sem6',
    title: 'Seminar 6: Public Health and Wellness',
    speaker: 'Dr. Sofia Mendoza',
    position: 'Public Health Officer',
    duration: 3,
    date: '2026-05-05',
    time: '1:00 PM - 4:00 PM',
    status: 'scheduled',
    description: 'Health promotion, disease prevention, and mental health awareness in communities.'
  },
  {
    id: 'sem7',
    title: 'Seminar 7: Environmental Conservation',
    speaker: 'Dr. Miguel Garcia',
    position: 'Environmental Scientist',
    duration: 3,
    date: '2026-05-07',
    time: '9:00 AM - 12:00 PM',
    status: 'scheduled',
    description: 'Climate change, waste management, and sustainable environmental practices.'
  },
  {
    id: 'sem8',
    title: 'Seminar 8: Service Learning and Reflection',
    speaker: 'Prof. Isabel Fernandez',
    position: 'Service Learning Coordinator',
    duration: 3,
    date: '2026-05-09',
    time: '2:00 PM - 5:00 PM',
    status: 'scheduled',
    description: 'Integrating learning with community service, reflection, and documentation.'
  }
];

const ASSESSMENT_QUESTIONS = [
  {
    question: 'What is the core purpose of NSTP?',
    options: [
      'To reduce academic load',
      'To promote civic consciousness and preparedness',
      'To replace all PE classes',
      'To focus only on military activities'
    ],
    correct: 1
  },
  {
    question: 'Which approach is best for community engagement?',
    options: ['Top-down implementation', 'Participatory planning', 'Single-sector control', 'No stakeholder involvement'],
    correct: 1
  },
  {
    question: 'Why is reflection included in service learning?',
    options: ['To reduce service hours', 'To document growth and insights', 'To skip assessments', 'To change component rules'],
    correct: 1
  },
  {
    question: 'Which area is part of NSTP competency development?',
    options: ['Civic responsibility', 'Corporate accounting', 'Retail marketing', 'Game development'],
    correct: 0
  },
  {
    question: 'Disaster preparedness in NSTP emphasizes:',
    options: ['Reactive response only', 'Community-based risk reduction', 'Individual action only', 'No coordination'],
    correct: 1
  }
];

export default function GeneralEducation({ user, onComplete, onLogout }: { user: any; onComplete: () => void; onLogout: () => void }) {
  const [seminars, setSeminars] = useState<any[]>([]);
  const [selectedSeminar, setSelectedSeminar] = useState<any>(null);
  const [isLive, setIsLive] = useState(false);
  const [assessmentActive, setAssessmentActive] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  useEffect(() => {
    const saved = localStorage.getItem(`seminars-${user.id}`);
    if (saved) {
      setSeminars(JSON.parse(saved));
    } else {
      setSeminars(SEMINARS);
    }
  }, [user.id]);

  const totalHours = seminars.reduce((acc, s) => acc + (s.completed ? s.duration : 0), 0);
  const completedCount = seminars.filter((s) => s.completed).length;
  const canComplete = totalHours >= 25 && completedCount === SEMINARS.length;
  const averageScore = completedCount > 0
    ? Math.round(seminars.filter((s) => s.completed).reduce((acc, s) => acc + (s.score || 0), 0) / completedCount)
    : 0;
  const hoursPercent = Math.min(100, Math.round((totalHours / 25) * 100));
  const seminarPercent = Math.min(100, Math.round((completedCount / SEMINARS.length) * 100));
  const nextSeminar = seminars.find((seminar, index) => !seminar.completed && (index === 0 || seminars[index - 1]?.completed));
  const remainingHours = Math.max(0, 25 - totalHours);
  const stageSteps = [
    { label: 'Orientation', complete: true },
    { label: 'Seminars', complete: completedCount === SEMINARS.length },
    { label: 'Assessments', complete: canComplete },
    { label: 'Component', complete: false },
  ];

  const joinSeminar = (seminar: any) => {
    setSelectedSeminar(seminar);
    setIsLive(true);
  };

  const startAssessment = () => {
    setIsLive(false);
    setAssessmentActive(true);
    setAnswers({});
  };

  const completeAssessment = () => {
    if (!selectedSeminar) return;
    const correct = ASSESSMENT_QUESTIONS.reduce((acc, question, idx) => {
      return answers[idx] === question.correct ? acc + 1 : acc;
    }, 0);
    const score = Math.round((correct / ASSESSMENT_QUESTIONS.length) * 100);

    const updatedSeminars = seminars.map(s =>
      s.id === selectedSeminar.id
        ? { ...s, completed: true, score, completedDate: new Date().toISOString() }
        : s
    );
    setSeminars(updatedSeminars);
    localStorage.setItem(`seminars-${user.id}`, JSON.stringify(updatedSeminars));
    setSelectedSeminar(null);
    setAssessmentActive(false);
  };

  // Live Seminar View
  if (isLive && selectedSeminar) {
    return (
      <div className="size-full flex flex-col bg-slate-900">
        {/* Video Area */}
        <div className="flex-1 flex items-center justify-center bg-slate-800 relative">
          <button
            onClick={onLogout}
            className="absolute top-4 right-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
          <div className="text-center">
            <div className="w-32 h-32 bg-slate-700 rounded-full flex items-center justify-center mb-4 mx-auto">
              <Users className="w-16 h-16 text-slate-400" />
            </div>
            <p className="text-white text-xl mb-2">{selectedSeminar.speaker}</p>
            <p className="text-slate-400">{selectedSeminar.position}</p>
            <div className="mt-6 flex items-center justify-center gap-2 text-red-500">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="font-semibold">LIVE</span>
            </div>
          </div>

          {/* Live indicator */}
          <div className="absolute top-4 left-4 bg-red-600 px-4 py-2 rounded-lg flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-white font-semibold text-sm">LIVE SESSION</span>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-slate-900 border-t border-slate-700 p-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">{selectedSeminar.title}</h2>
                <p className="text-slate-400">{selectedSeminar.description}</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={startAssessment}
                  className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6 py-3 rounded-xl hover:opacity-95 transition-opacity font-medium"
                >
                  Proceed to Assessment
                </button>
                <button
                  onClick={() => {
                    setSelectedSeminar(null);
                    setIsLive(false);
                  }}
                  className="px-6 py-3 border border-slate-600 text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Leave Session
                </button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {selectedSeminar.duration} hours
              </span>
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {selectedSeminar.date}
              </span>
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                {selectedSeminar.speaker}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Assessment View
  if (assessmentActive && selectedSeminar) {
    return (
      <div className="size-full overflow-auto bg-[#fcfaf6] dark:bg-slate-950">
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 mb-6 dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                onClick={() => {
                  setAssessmentActive(false);
                  setSelectedSeminar(null);
                  setAnswers({});
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition-all hover:-translate-y-0.5 hover:bg-blue-100 hover:shadow-sm dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100 dark:hover:bg-blue-500/20"
              >
                <LayoutDashboard className="w-4 h-4" />
                Return to Dashboard
              </button>
              <button
                onClick={onLogout}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2 dark:text-slate-100">
              Assessment: {selectedSeminar.title}
            </h1>
            <p className="text-slate-600 dark:text-slate-300">
              Complete the assessment based on the seminar by {selectedSeminar.speaker}
            </p>
          </div>

          <div className="space-y-6 mb-6">
            {ASSESSMENT_QUESTIONS.map((item, index) => (
              <div key={index} className="bg-white rounded-2xl border border-slate-200 p-6 dark:border-slate-700 dark:bg-slate-900">
                <h3 className="font-semibold text-slate-900 mb-4 dark:text-slate-100">
                  Question {index + 1}: {item.question}
                </h3>
                <div className="space-y-3">
                  {item.options.map((option, idx) => (
                    <label
                      key={idx}
                      className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm dark:hover:border-blue-400 dark:hover:bg-blue-500/10 ${
                        answers[index] === idx
                          ? 'border-amber-500 bg-amber-50 shadow-sm dark:bg-amber-500/10'
                          : 'border-slate-200 hover:border-amber-300 dark:border-slate-700 dark:hover:border-amber-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q-${index}`}
                        checked={answers[index] === idx}
                        onChange={() => setAnswers({ ...answers, [index]: idx })}
                        className="w-4 h-4 text-amber-600"
                      />
                      <span className="text-slate-700 dark:text-slate-200">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 dark:border-slate-700 dark:bg-slate-900">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Make sure to review all answers before submitting
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => setAssessmentActive(false)}
                  className="px-6 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={completeAssessment}
                  disabled={Object.keys(answers).length < ASSESSMENT_QUESTIONS.length}
                  className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-8 py-2 rounded-lg disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  Submit Assessment
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Seminar Schedule View
  return (
    <RoleShell
      user={user}
      onLogout={onLogout}
      eyebrow="Student Workspace"
      title="General Education"
      description="Complete all required seminars and assessments before selecting your NSTP component."
      sidebarTitle="Progress Snapshot"
      sidebarItems={[
        { label: 'Contact Hours', value: `${totalHours}/25 completed`, tone: 'warning' },
        { label: 'Seminars Done', value: `${completedCount}/${SEMINARS.length}`, tone: 'success' },
        { label: 'Average Score', value: `${averageScore}% on completed assessments`, tone: 'info' },
      ]}
    >
      <div className="mx-auto grid max-w-7xl gap-4 p-2 md:p-4 xl:grid-cols-12">
        <section className="relative overflow-hidden rounded-3xl border border-blue-200 bg-gradient-to-br from-[#073b8e] via-[#105bd8] to-[#09a6d8] p-5 text-white shadow-[0_28px_80px_-42px_rgba(15,23,42,0.85)] dark:border-blue-400/30 xl:col-span-8">
          <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full border border-white/20" />
          <div className="absolute bottom-0 right-0 h-32 w-64 bg-gradient-to-l from-amber-300/30 to-transparent" />
          <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-end">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]">
                <ShieldCheck className="h-3.5 w-3.5" />
                Required stage
              </span>
              <h1 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight md:text-4xl">General Education for NSTP readiness</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-50 md:text-base">
                Finish the 25-hour seminar track, pass each short assessment, then unlock component selection for CWTS, LTS, MTS Army, or MTS Navy.
              </p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-blue-50">
                <span className="rounded-full bg-white/14 px-3 py-1">25 contact hours</span>
                <span className="rounded-full bg-white/14 px-3 py-1">{SEMINARS.length} guided seminars</span>
                <span className="rounded-full bg-white/14 px-3 py-1">Assessment gated</span>
              </div>
            </div>

            <div className="rounded-3xl border border-white/20 bg-white/14 p-4 backdrop-blur-md">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-100">Next action</p>
              {nextSeminar ? (
                <>
                  <p className="mt-2 text-lg font-semibold leading-snug">{nextSeminar.title.replace('Seminar ', 'S')}</p>
                  <p className="mt-1 text-sm text-blue-50">{nextSeminar.date} at {nextSeminar.time}</p>
                  <button
                    onClick={() => joinSeminar(nextSeminar)}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-blue-800 shadow-sm transition-transform hover:-translate-y-0.5"
                  >
                    <Play className="h-4 w-4" />
                    Join available seminar
                  </button>
                </>
              ) : (
                <>
                  <p className="mt-2 text-lg font-semibold">All seminars cleared</p>
                  <p className="mt-1 text-sm text-blue-50">Proceed when the completion button appears below.</p>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 xl:col-span-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300">Unlock progress</p>
              <h3 className="mt-1 text-2xl font-semibold text-slate-950 dark:text-slate-100">{hoursPercent}% ready</h3>
            </div>
            <div className="relative grid h-20 w-20 place-items-center rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(#2563eb ${hoursPercent * 3.6}deg, rgba(226,232,240,0.9) 0deg)` }} />
              <div className="relative grid h-14 w-14 place-items-center rounded-full bg-white text-sm font-semibold text-blue-700 dark:bg-slate-900 dark:text-blue-200">{hoursPercent}%</div>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {stageSteps.map((step, index) => (
              <div key={step.label} className="flex items-center gap-3">
                <div className={`grid h-8 w-8 place-items-center rounded-full text-xs font-semibold ${step.complete ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-100' : index === 1 ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-100' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                  {step.complete ? <CheckCircle className="h-4 w-4" /> : index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{step.label}</p>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className={`h-full rounded-full ${step.complete ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: step.complete ? '100%' : index === 1 ? `${seminarPercent}%` : '0%' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
        <div className="bento-panel p-5 xl:col-span-6">
            <p className="text-xs uppercase tracking-[0.16em] font-semibold text-amber-700 mb-2">Required Stage</p>
            <h3 className="text-lg font-bold text-slate-900 mb-1 dark:text-slate-100">General Education • 25 Contact Hours</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">Complete all seminars and pass assessments before choosing your NSTP component.</p>
          </div>
          <div className="bento-panel p-5 xl:col-span-6">
            <p className="text-xs uppercase tracking-[0.16em] font-semibold text-rose-700 mb-2">Current Momentum</p>
            <h3 className="text-lg font-bold text-slate-900 mb-1 dark:text-slate-100">{completedCount} / {SEMINARS.length} seminars completed</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">{Math.max(0, 25 - totalHours)} hours remaining to unlock component enrollment.</p>
          </div>

        {/* Header */}
        <div className="bento-panel p-6 text-center xl:col-span-12">
          <h1 className="text-3xl font-bold text-slate-900 mb-3 dark:text-slate-100">
            General Education - 25 Contact Hours
          </h1>
          <p className="text-slate-600 max-w-2xl mx-auto dark:text-slate-300">
            Complete all required seminars and assessments before selecting your NSTP component.
            Each seminar is conducted live by expert speakers.
          </p>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:col-span-12 xl:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Hours Completed</span>
            </div>
            <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
              {totalHours}<span className="text-xl text-slate-600 dark:text-slate-300">/25</span>
            </p>
            <div className="mt-3 bg-slate-100 rounded-full h-2 dark:bg-slate-700">
              <div
                className="bg-gradient-to-r from-amber-500 to-orange-600 h-2 rounded-full transition-all"
                style={{ width: `${hoursPercent}%` }}
              />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3 mb-2">
              <Video className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Seminars Completed</span>
            </div>
            <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
              {completedCount}<span className="text-xl text-slate-600 dark:text-slate-300">/{SEMINARS.length}</span>
            </p>
            <div className="mt-3 bg-slate-100 rounded-full h-2 dark:bg-slate-700">
              <div
                className="bg-green-600 h-2 rounded-full transition-all"
                style={{ width: `${seminarPercent}%` }}
              />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3 mb-2">
              <Award className="w-5 h-5 text-rose-600" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Average Score</span>
            </div>
            <p className="text-3xl font-semibold text-slate-900 dark:text-slate-100">{averageScore}%</p>
            <p className="text-xs text-slate-500 mt-2 inline-flex items-center gap-1 dark:text-slate-400"><Flame className="w-3.5 h-3.5 text-rose-500" />Based on completed seminar assessments</p>
          </div>
        </div>

        {/* Seminar Schedule */}
        <div className="grid gap-4 xl:col-span-12 xl:grid-cols-2">
          {seminars.map((seminar, index) => {
            const isLocked = index > 0 && !seminars[index - 1]?.completed;

            return (
              <div
                key={seminar.id}
                className={`group relative overflow-hidden rounded-3xl border p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:text-slate-100 ${
                  seminar.completed
                    ? 'border-green-200 bg-green-50 dark:border-green-500/20 dark:bg-green-500/10'
                    : isLocked
                    ? 'border-slate-200 bg-slate-50/80 opacity-75 dark:border-slate-700 dark:bg-slate-900/70'
                    : 'border-blue-200 bg-white dark:border-blue-500/20 dark:bg-slate-900'
                }`}
              >
                {!isLocked && !seminar.completed && <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-700 via-cyan-500 to-amber-400" />}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">Seminar {index + 1}</span>
                      {seminar.completed && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-100"><CheckCircle className="h-3.5 w-3.5" /> Completed</span>}
                      {isLocked && <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400"><Lock className="h-3.5 w-3.5" /> Locked</span>}
                    </div>
                    <h3 className="text-lg font-semibold leading-snug text-slate-950 dark:text-slate-100">{seminar.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{seminar.description}</p>

                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600 dark:text-slate-300">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {seminar.speaker}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {seminar.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {seminar.time} ({seminar.duration}h)
                      </span>
                    </div>

                    <p className="mt-3 text-xs font-medium text-slate-500 dark:text-slate-400">{seminar.position}</p>

                    {seminar.completed && (
                      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-emerald-200 bg-white/70 px-3 py-2 dark:border-emerald-500/20 dark:bg-slate-950/40">
                        <Award className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                          Score: {seminar.score}% • Completed on {new Date(seminar.completedDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => !isLocked && !seminar.completed && joinSeminar(seminar)}
                    disabled={isLocked || seminar.completed}
                    className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition-all sm:w-auto ${
                      seminar.completed
                        ? 'bg-green-100 text-green-700 cursor-default dark:bg-green-500/15 dark:text-green-100'
                        : isLocked
                        ? 'bg-slate-200 text-slate-500 cursor-not-allowed dark:bg-slate-700 dark:text-slate-400'
                        : 'bg-gradient-to-r from-blue-700 to-cyan-500 text-white shadow-sm hover:-translate-y-0.5 hover:opacity-95'
                    }`}
                  >
                    {seminar.completed ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Completed
                      </>
                    ) : isLocked ? (
                      <>
                        <Lock className="w-4 h-4" />
                        Locked
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Join Seminar
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Complete Button */}
        {canComplete && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 p-8 text-center shadow-sm dark:border-green-500/20 dark:from-slate-900 dark:to-slate-800 dark:text-slate-100 xl:col-span-12">
            <div className="flex items-center justify-center gap-2 mb-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Congratulations!</h3>
            </div>
            <p className="text-slate-600 mb-6 dark:text-slate-300">
              You've completed all {SEMINARS.length} seminars totaling {totalHours} contact hours.
              You can now proceed to select your NSTP component.
            </p>
            <button
              onClick={onComplete}
              className="bg-green-600 text-white px-8 py-3 rounded-xl hover:bg-green-700 transition-colors font-medium text-lg inline-flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-5 h-5" />
              Proceed to Component Selection
            </button>
          </div>
        )}
      </div>
    </RoleShell>
  );
}
