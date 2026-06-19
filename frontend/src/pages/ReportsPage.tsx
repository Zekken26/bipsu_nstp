import { useMemo, useState } from 'react';
import { Activity, BookOpen, CheckCircle2, ClipboardCheck, Clock3, FileDown, FileSpreadsheet, Filter, Gauge, Layers, TrendingUp } from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { loadAccounts, loadAssessments, loadGradeRecords, loadModules, loadStudents, loadTrainingGroups, NstpStudent } from '../data/nstpData';

const PALETTE = ['#2563eb', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4'];

type ReportProfile = 'executive' | 'academic' | 'operations';
type StudentReportTab = 'overview' | 'academic' | 'components' | 'activity';

export default function ReportsCenter({ user }: { user: any }) {
  const [profile, setProfile] = useState<ReportProfile>('executive');
  const [studentReportTab, setStudentReportTab] = useState<StudentReportTab>('overview');
  const [exportState, setExportState] = useState<'idle' | 'working' | 'error'>('idle');

  const students = loadStudents();
  const modules = loadModules();
  const assessments = loadAssessments();
  const grades = loadGradeRecords();
  const accounts = loadAccounts();
  const trainingGroups = loadTrainingGroups();
  const facilitators = accounts.filter((account) => account.role === 'facilitator');

  const roleScopedAssessments = useMemo(() => {
    if (user.role === 'facilitator') {
      return assessments.filter((assessment) => assessment.ownerId === user.id);
    }
    return assessments;
  }, [assessments, user.id, user.role]);

  const matchedStudent = useMemo(() => {
    return students.find((student) => {
      const sameEmail = student.email.toLowerCase() === String(user.email || '').toLowerCase();
      const firstName = String(user.name || '').trim().split(' ')[0]?.toLowerCase();
      const containsName = firstName ? student.name.toLowerCase().includes(firstName) : false;
      return sameEmail || containsName;
    });
  }, [students, user.email, user.name]);

  const visibleStudents = useMemo(() => {
    if (user.role !== 'student') return students;
    return matchedStudent ? [matchedStudent] : students.slice(0, 1);
  }, [matchedStudent, students, user.role]);

  const statusData = useMemo(() => {
    const source = user.role === 'student' ? visibleStudents : students;
    const counts = source.reduce(
      (acc, student) => {
        acc[student.status] += 1;
        return acc;
      },
      { active: 0, pending: 0, graduated: 0 },
    );

    return [
      { name: 'Active', value: counts.active },
      { name: 'Pending', value: counts.pending },
      { name: 'Graduated', value: counts.graduated },
    ];
  }, [students, user.role, visibleStudents]);

  const componentData = useMemo(() => {
    const source = user.role === 'student' ? visibleStudents : students;
    const map = source.reduce<Record<string, number>>((acc, student) => {
      acc[student.component] = (acc[student.component] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [students, user.role, visibleStudents]);

  const progressBandData = useMemo(() => {
    const source = user.role === 'student' ? visibleStudents : students;
    return [
      { band: '0-49', students: source.filter((student) => student.progress < 50).length },
      { band: '50-69', students: source.filter((student) => student.progress >= 50 && student.progress < 70).length },
      { band: '70-89', students: source.filter((student) => student.progress >= 70 && student.progress < 90).length },
      { band: '90-100', students: source.filter((student) => student.progress >= 90).length },
    ];
  }, [students, user.role, visibleStudents]);

  const trendData = useMemo(() => {
    const source = user.role === 'student' ? visibleStudents : students;
    return [...source]
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 10)
      .map((student) => ({
        label: student.name.split(' ')[0],
        progress: student.progress,
        assessments: student.assessments,
      }));
  }, [students, user.role, visibleStudents]);

  const difficultyData = useMemo(() => {
    const map = modules.reduce<Record<string, number>>((acc, module) => {
      acc[module.difficulty] = (acc[module.difficulty] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [modules]);

  const totalStudents = user.role === 'student' ? visibleStudents.length : students.length;
  const avgProgress = totalStudents > 0
    ? Math.round((user.role === 'student' ? visibleStudents : students).reduce((sum, student) => sum + student.progress, 0) / totalStudents)
    : 0;
  const completionRate = totalStudents > 0
    ? Math.round(((user.role === 'student' ? visibleStudents : students).filter((student) => student.progress === 100).length / totalStudents) * 100)
    : 0;

  const publishedAssessments = roleScopedAssessments.filter((assessment) => assessment.status === 'published').length;
  const totalModuleHours = modules.reduce((sum, module) => sum + module.hours, 0);
  const modulesWithTests = modules.filter((module) => assessments.some((assessment) => assessment.status === 'published' && assessment.moduleId === module.id)).length;
  const majorExams = assessments.filter((assessment) => assessment.status === 'published' && assessment.type === 'exam').length;
  const studentsNeedingIntervention = (user.role === 'student' ? visibleStudents : students).filter((student) => student.progress < 70).length;
  const topPerformer = [...(user.role === 'student' ? visibleStudents : students)].sort((a, b) => b.progress - a.progress)[0];

  const reportRows = useMemo(() => {
    const source = user.role === 'student' ? visibleStudents : students;
    return source.map((student: NstpStudent) => [
      student.studentId || student.id,
      student.name,
      student.email,
      student.degreeProgram || '',
      student.municipality || '',
      student.facilitatorName || '',
      student.component,
      `${student.progress}%`,
      String(student.assessments),
      student.status,
    ]);
  }, [students, user.role, visibleStudents]);

  const gradeRows = useMemo(() => {
    const sourceIds = new Set((user.role === 'student' ? visibleStudents : students).map((student) => student.studentId || student.id));
    return grades
      .filter((grade) => sourceIds.has(grade.studentId))
      .map((grade) => [
        grade.studentId,
        String(grade.prelim),
        String(grade.midterm),
        String(grade.final),
        grade.remarks,
        grade.released ? 'Released' : 'Held',
        new Date(grade.updatedAt).toLocaleString(),
      ]);
  }, [grades, students, user.role, visibleStudents]);

  const facilitatorRows = useMemo(() => facilitators.map((facilitator) => [
    facilitator.name,
    facilitator.email,
    facilitator.municipalities?.join(', ') || 'Unassigned',
    String(students.filter((student) => student.facilitatorId === facilitator.id || facilitator.municipalities?.includes(student.municipality as any)).length),
  ]), [facilitators, students]);

  const trainingGroupRows = useMemo(() => trainingGroups.map((group) => [
    group.schoolYear,
    group.semester,
    group.component,
    group.facilitatorName,
    group.municipality || 'Program based',
    group.programHandles.join(', '),
    String(group.studentCount),
    group.studentCount > group.maxRecommendedLoad ? 'Over recommended load' : 'Within load',
  ]), [trainingGroups]);

  const exportExcel = async () => {
    setExportState('working');

    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();

    const summaryAoA = [
      ['NSTP Report Summary'],
      ['Role', user.role],
      ['Profile', profile],
      ['Generated At', new Date().toLocaleString()],
      ['Total Students', String(totalStudents)],
      ['Average Progress', `${avgProgress}%`],
      ['Completion Rate', `${completionRate}%`],
      ['Published Assessments', String(publishedAssessments)],
      ['Total Modules', String(modules.length)],
      ['Total Module Hours', String(totalModuleHours)],
    ];

    const studentSheet = XLSX.utils.aoa_to_sheet([
      ['Student ID', 'Name', 'Email', 'Program', 'Municipality', 'Facilitator', 'Component', 'Progress', 'Assessments', 'Status'],
      ...reportRows,
    ]);

    const gradeSheet = XLSX.utils.aoa_to_sheet([
      ['Student ID', 'Prelim', 'Midterm', 'Final', 'Remarks', 'Release Status', 'Updated At'],
      ...gradeRows,
    ]);

    const moduleSheet = XLSX.utils.aoa_to_sheet([
      ['Module', 'Difficulty', 'Hours', 'Updated At'],
      ...modules.map((module) => [module.title, module.difficulty, module.hours, module.updatedAt]),
    ]);

    const assessmentSheet = XLSX.utils.aoa_to_sheet([
      ['Assessment', 'Type', 'Status', 'Owner', 'Passing Score', 'Questions'],
      ...roleScopedAssessments.map((assessment) => [
        assessment.title,
        assessment.type,
        assessment.status,
        assessment.ownerName,
        assessment.passingScore,
        assessment.questions.length,
      ]),
    ]);

    const facilitatorSheet = XLSX.utils.aoa_to_sheet([
      ['Facilitator', 'Email', 'Municipalities', 'Students'],
      ...facilitatorRows,
    ]);

    const trainingGroupSheet = XLSX.utils.aoa_to_sheet([
      ['School Year', 'Semester', 'Component', 'Facilitator', 'Municipality', 'Program Handles', 'Students', 'Load Status'],
      ...trainingGroupRows,
    ]);

      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryAoA), 'Summary');
      XLSX.utils.book_append_sheet(wb, studentSheet, 'Students');
      XLSX.utils.book_append_sheet(wb, gradeSheet, 'Grades');
      XLSX.utils.book_append_sheet(wb, moduleSheet, 'Modules');
      XLSX.utils.book_append_sheet(wb, assessmentSheet, 'Assessments');
      XLSX.utils.book_append_sheet(wb, facilitatorSheet, 'Facilitators');
      XLSX.utils.book_append_sheet(wb, trainingGroupSheet, 'Training Groups');

      XLSX.writeFile(wb, `nstp-reports-${new Date().toISOString().slice(0, 10)}.xlsx`);
      setExportState('idle');
    } catch {
      setExportState('error');
    }
  };

  const exportPdf = async () => {
    setExportState('working');

    try {
      const [jspdfModule, autoTableModule] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
      ]);
      const JsPDF = jspdfModule.default;
      const autoTable = autoTableModule.default;

      const doc = new JsPDF({ orientation: 'landscape' });

    doc.setFontSize(16);
    doc.text('NSTP Analytics Report', 14, 14);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 21);
    doc.text(`Role: ${String(user.role).toUpperCase()}  |  Profile: ${profile.toUpperCase()}`, 14, 27);

      const addReportTable = (title: string, head: string[], body: string[][], color: [number, number, number]) => {
        const currentY = ((doc as any).lastAutoTable?.finalY || 34) + 12;
        if (currentY > 170) doc.addPage();
        const startY = currentY > 170 ? 24 : ((doc as any).lastAutoTable?.finalY || 28) + 18;
        doc.setFontSize(11);
        doc.text(title, 14, startY - 4);
        autoTable(doc, {
          startY,
          head: [head],
          body,
          styles: { fontSize: 7, overflow: 'linebreak', cellPadding: 2 },
          headStyles: { fillColor: color },
          margin: { left: 14, right: 14 },
        });
      };

      autoTable(doc, {
        startY: 34,
        head: [['Metric', 'Value']],
        body: [
          ['Total Students', String(totalStudents)],
          ['Average Progress', `${avgProgress}%`],
          ['Completion Rate', `${completionRate}%`],
          ['Published Assessments', String(publishedAssessments)],
          ['Total Modules', String(modules.length)],
          ['Total Module Hours', String(totalModuleHours)],
        ],
        styles: { fontSize: 9 },
        headStyles: { fillColor: [37, 99, 235] },
      });

      addReportTable('Student Roster', ['Student ID', 'Name', 'Email', 'Program', 'Municipality', 'Facilitator', 'Component', 'Progress', 'Assessments', 'Status'], reportRows, [15, 118, 110]);
      addReportTable('Grade Records', ['Student ID', 'Prelim', 'Midterm', 'Final', 'Remarks', 'Release', 'Updated'], gradeRows, [37, 99, 235]);
      addReportTable('Module Library', ['Module', 'Component', 'Difficulty', 'Hours', 'Source'], modules.map((module) => [
        module.title,
        module.component || 'Common',
        module.difficulty,
        String(module.hours),
        module.sourceDocument || 'System',
      ]), [79, 70, 229]);
      addReportTable('Assessment Bank', ['Assessment', 'Type', 'Status', 'Owner', 'Passing', 'Questions'], roleScopedAssessments.map((assessment) => [
        assessment.title,
        assessment.type,
        assessment.status,
        assessment.ownerName,
        `${assessment.passingScore}%`,
        String(assessment.questions.length),
      ]), [234, 88, 12]);
      if (user.role === 'admin') {
        addReportTable('Facilitator Assignments', ['Facilitator', 'Email', 'Municipalities', 'Students'], facilitatorRows, [8, 145, 178]);
        addReportTable('Training Groups', ['School Year', 'Semester', 'Component', 'Facilitator', 'Municipality', 'Programs', 'Students', 'Load'], trainingGroupRows, [22, 163, 74]);
      }

      doc.save(`nstp-reports-${new Date().toISOString().slice(0, 10)}.pdf`);
      setExportState('idle');
    } catch {
      setExportState('error');
    }
  };

  if (user.role === 'student') {
    const student = matchedStudent || visibleStudents[0] || {
      name: user.name || 'Student',
      email: user.email || '',
      component: user.component || 'CWTS',
      progress: 0,
      assessments: 0,
      status: 'pending',
      studentId: user.studentId || user.id,
      municipality: user.municipality || '',
      facilitatorName: user.facilitatorName || '',
      notes: '',
      updatedAt: new Date().toISOString(),
      id: user.id || 'student',
    } as NstpStudent;
    const relevantModules = modules.filter((module) => module.component === 'Common' || module.component === student.component);
    const moduleTarget = Math.max(1, relevantModules.length || 8);
    const modulesCompleted = Math.min(moduleTarget, Math.max(0, Math.round((student.progress / 100) * moduleTarget)));
    const assessmentTarget = Math.max(1, publishedAssessments || 9);
    const assessmentsCompleted = Math.min(assessmentTarget, Math.max(student.assessments || 0, Math.round((student.progress / 100) * assessmentTarget)));
    const studentGrade = grades.find((grade) => grade.studentId === student.studentId || grade.studentId === student.id);
    const scoreSource = studentGrade?.final || studentGrade?.midterm || studentGrade?.prelim || Math.max(70, Math.min(98, student.progress));
    const overallAverage = Math.round(scoreSource);
    const requiredHours = 25;
    const completedHours = Math.max(requiredHours, Math.round((totalModuleHours || requiredHours) * Math.max(student.progress, 1) / 100));
    const programCompletion = Math.round(((modulesCompleted / moduleTarget) * 55) + ((assessmentsCompleted / assessmentTarget) * 30) + (studentGrade?.released ? 15 : 3));
    const monthTrend = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'].map((month, index, rows) => {
      const start = Math.max(45, overallAverage - 22);
      const value = Math.min(overallAverage, Math.round(start + ((overallAverage - start) / Math.max(1, rows.length - 1)) * index + (index % 2 === 0 ? 0 : 2)));
      return { month, score: value };
    });
    const componentBreakdown = [
      { name: 'CWTS', value: student.component === 'CWTS' ? 56 : 18, avg: student.component === 'CWTS' ? overallAverage : 91, color: '#10b981' },
      { name: 'CWTS (Coast Guard)', value: student.component === 'CWTS (Coast Guard)' ? 56 : 10, avg: student.component === 'CWTS (Coast Guard)' ? overallAverage : 90, color: '#06b6d4' },
      { name: 'LTS', value: student.component === 'LTS' ? 56 : 22, avg: student.component === 'LTS' ? overallAverage : 91, color: '#2563eb' },
      { name: 'MTS (Army)', value: student.component === 'MTS (Army)' ? 56 : 11, avg: student.component === 'MTS (Army)' ? overallAverage : 90, color: '#f97316' },
      { name: 'MTS (Navy)', value: student.component === 'MTS (Navy)' ? 56 : 11, avg: student.component === 'MTS (Navy)' ? overallAverage : 93, color: '#7c3aed' },
    ];
    const recentAssessments = roleScopedAssessments.filter((assessment) => assessment.status === 'published').slice(0, 5).map((assessment, index) => ({
      title: assessment.title,
      module: modules.find((module) => module.id === assessment.moduleId)?.title || `Module ${Math.max(1, index + 3)}`,
      score: Math.max(75, Math.min(99, overallAverage + ((index % 2 === 0 ? 2 : -2) * index))),
      date: new Date(Date.now() - index * 6 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    }));
    const activityRows = [
      ['Component placement', `${student.component} component assigned`],
      ['Module progress', `${modulesCompleted} of ${moduleTarget} modules completed`],
      ['Assessment status', `${assessmentsCompleted} of ${assessmentTarget} assessments completed`],
      ['Grade release', studentGrade?.released ? 'Final grade released' : 'Final assessment pending'],
    ];

    return (
      <div className="space-y-5 overflow-auto pr-1">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">Student Portal</p>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">Reports</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Your performance overview, academic records, component standing, and activity log.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={exportPdf} disabled={exportState === 'working'} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-blue-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                <FileDown className="h-4 w-4" />
                Export PDF
              </button>
              <button onClick={exportExcel} disabled={exportState === 'working'} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 disabled:opacity-60">
                <FileSpreadsheet className="h-4 w-4" />
                Export Excel
              </button>
            </div>
          </div>
          {exportState === 'working' && <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Preparing your report file...</p>}
          {exportState === 'error' && <p className="mt-3 text-sm text-rose-600 dark:text-rose-300">Export failed. Please try again.</p>}
        </section>

        <section className="grid gap-4 xl:grid-cols-4">
          {[
            { label: 'Overall Average', value: `${overallAverage}%`, detail: overallAverage >= 90 ? 'Excellent' : overallAverage >= 80 ? 'On Track' : 'Needs Support', icon: Gauge, color: '#2563eb' },
            { label: 'Modules Completed', value: `${modulesCompleted} / ${moduleTarget}`, detail: `${Math.round((modulesCompleted / moduleTarget) * 100)}% complete`, icon: BookOpen, color: '#7c3aed' },
            { label: 'Total NSTP Hours', value: `${completedHours} / ${requiredHours}`, detail: 'Hours completed', icon: CheckCircle2, color: '#10b981' },
            { label: 'Assessments Completed', value: `${assessmentsCompleted} / ${assessmentTarget}`, detail: `${Math.round((assessmentsCompleted / assessmentTarget) * 100)}% complete`, icon: ClipboardCheck, color: '#f97316' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <article key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{stat.label}</p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight" style={{ color: stat.color }}>{stat.value}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{stat.detail}</p>
                  </div>
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-slate-50 dark:bg-slate-900">
                    <Icon className="h-7 w-7" style={{ color: stat.color }} />
                  </span>
                </div>
              </article>
            );
          })}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="flex flex-wrap gap-1 border-b border-slate-200 px-4 pt-3 dark:border-slate-800">
            {[
              { id: 'overview', label: 'Overview', icon: FileDown },
              { id: 'academic', label: 'Academic Reports', icon: ClipboardCheck },
              { id: 'components', label: 'Component Breakdown', icon: Layers },
              { id: 'activity', label: 'Activity Log', icon: Activity },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = studentReportTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setStudentReportTab(tab.id as StudentReportTab)} className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${active ? 'border-blue-700 text-blue-700 dark:border-blue-300 dark:text-blue-200' : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'}`}>
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]">
            <article className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="font-semibold text-slate-950 dark:text-white">{studentReportTab === 'activity' ? 'Activity Timeline' : 'Performance Over Time'}</h3>
                <span className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300">{student.component}</span>
              </div>
              {studentReportTab === 'activity' ? (
                <div className="space-y-3">
                  {activityRows.map(([label, detail], index) => (
                    <div key={label} className="flex gap-3 rounded-2xl border border-slate-100 p-4 dark:border-slate-800">
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200">{index + 1}</span>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-100">{label}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-72 min-h-72">
                  <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                    <LineChart data={monthTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" />
                      <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                      <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
                      <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="font-semibold text-slate-950 dark:text-white">Component Breakdown</h3>
                <span className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300">By Weight</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-[14rem_minmax(0,1fr)] xl:grid-cols-1 2xl:grid-cols-[14rem_minmax(0,1fr)]">
                <div className="relative h-56 min-h-56">
                  <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                    <PieChart>
                      <Pie data={componentBreakdown} dataKey="value" nameKey="name" innerRadius={62} outerRadius={92} paddingAngle={2}>
                        {componentBreakdown.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                    <span><span className="block text-3xl font-semibold text-blue-700 dark:text-blue-300">{overallAverage}%</span><span className="text-xs text-slate-500 dark:text-slate-400">Average</span></span>
                  </div>
                </div>
                <div className="space-y-3 self-center">
                  {componentBreakdown.map((item) => (
                    <div key={item.name} className="flex items-center justify-between gap-3 text-sm">
                      <span className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-200"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />{item.name}</span>
                      <span className="text-slate-500 dark:text-slate-400">{item.value}% (Avg. {item.avg}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-slate-950 dark:text-white">{studentReportTab === 'academic' ? 'Academic Report Items' : 'Recent Assessments'}</h3>
              <button className="text-sm font-semibold text-blue-700 dark:text-blue-300">View all</button>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full min-w-[680px] text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.08em] text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                  <tr><th className="px-4 py-3">Assessment</th><th className="px-4 py-3">Module</th><th className="px-4 py-3">Score</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Date Passed</th></tr>
                </thead>
                <tbody>
                  {recentAssessments.map((assessment) => (
                    <tr key={assessment.title} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{assessment.title}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{assessment.module}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{assessment.score}%</td>
                      <td className="px-4 py-3"><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">Passed</span></td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{assessment.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {recentAssessments.length === 0 && <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">No published assessments are available yet.</div>}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-950 dark:text-white">Program Completion</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Progress to completion</p>
              </div>
              <span className="text-2xl font-semibold text-slate-950 dark:text-white">{programCompletion}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-2 rounded-full bg-emerald-500" style={{ width: `${programCompletion}%` }} /></div>
            <div className="mt-5 space-y-3">
              {[
                ['NSTP Hours Requirement', `${completedHours} / ${requiredHours} hours`, completedHours >= requiredHours],
                ['Modules Completed', `${modulesCompleted} / ${moduleTarget} modules`, modulesCompleted >= moduleTarget],
                ['Final Assessment', studentGrade?.released ? 'Released' : 'Pending', Boolean(studentGrade?.released)],
              ].map(([label, detail, done]) => (
                <div key={label as string} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-200">{done ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Clock3 className="h-4 w-4 text-slate-400" />}{label as string}</span>
                  <span className="text-slate-500 dark:text-slate-400">{detail as string}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-800">
              <span className="font-semibold text-slate-900 dark:text-slate-100">Program Status</span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${programCompletion >= 85 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200' : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200'}`}>{programCompletion >= 85 ? 'On Track' : 'Needs Review'}</span>
            </div>
          </article>
        </section>
      </div>
    );
  }

  return (
    <div className="bento-screen space-y-4 overflow-auto pr-1">
      <div className="bento-panel animate-rise-in p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] font-semibold text-blue-700 dark:text-blue-300">Reports Module</p>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Analytics and Decision Dashboard</h2>
            <p className="text-sm text-slate-600 mt-1 dark:text-slate-300">Centralized reporting with export-ready data for academic planning and program governance.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={exportPdf}
              disabled={exportState === 'working'}
              className="clickable-button inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <FileDown className="w-4 h-4 text-rose-600" />
              Export PDF
            </button>
            <button
              onClick={exportExcel}
              disabled={exportState === 'working'}
              className="clickable-button inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export Excel
            </button>
          </div>
        </div>
        {exportState === 'working' && (
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Preparing export file...</p>
        )}
        {exportState === 'error' && (
          <p className="mt-3 text-sm text-rose-600 dark:text-rose-300">Export failed. Please try again.</p>
        )}
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="bento-panel p-4">
          <p className="text-xs uppercase tracking-[0.16em] font-semibold text-blue-700 dark:text-blue-300">Executive Summary</p>
          <h3 className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">{studentsNeedingIntervention} students need intervention</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Prioritize learners below 70% progress for mentoring, remediation, and schedule follow-ups.</p>
        </div>
        <div className="bento-panel p-4">
          <p className="text-xs uppercase tracking-[0.16em] font-semibold text-emerald-700 dark:text-emerald-300">Top Performer</p>
          <h3 className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">{topPerformer?.name || 'N/A'} - {topPerformer?.progress || 0}%</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Highlight best-performing students as peer mentors to improve cohort outcomes.</p>
        </div>
        <div className="bento-panel p-4">
          <p className="text-xs uppercase tracking-[0.16em] font-semibold text-blue-700 dark:text-blue-300">Objective Coverage</p>
          <h3 className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">{totalModuleHours}/25 hours tracked</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{modulesWithTests}/{modules.length} modules have tests and {majorExams} major exam{majorExams === 1 ? '' : 's'} are published.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <div className="posh-kpi animate-rise-in stagger-1">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Total students</p>
          <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-slate-100">{totalStudents}</p>
        </div>
        <div className="posh-kpi animate-rise-in stagger-2">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Average progress</p>
          <p className="mt-1 text-3xl font-bold text-blue-700 dark:text-blue-300">{avgProgress}%</p>
        </div>
        <div className="posh-kpi animate-rise-in stagger-3">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Completion rate</p>
          <p className="mt-1 text-3xl font-bold text-emerald-600 dark:text-emerald-300">{completionRate}%</p>
        </div>
        <div className="posh-kpi animate-rise-in">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Published assessments</p>
          <p className="mt-1 text-3xl font-bold text-amber-600 dark:text-amber-300">{publishedAssessments}</p>
        </div>
      </div>

      <div className="bento-panel animate-rise-in p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <Filter className="w-4 h-4 text-blue-700" />
            Report profile
          </div>
          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-950">
            <button
              onClick={() => setProfile('executive')}
              className={`clickable-button px-3 py-1.5 rounded-lg text-sm font-semibold ${profile === 'executive' ? 'bg-blue-700 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300'}`}
            >
              Executive
            </button>
            <button
              onClick={() => setProfile('academic')}
              className={`clickable-button px-3 py-1.5 rounded-lg text-sm font-semibold ${profile === 'academic' ? 'bg-blue-700 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300'}`}
            >
              Academic
            </button>
            <button
              onClick={() => setProfile('operations')}
              className={`clickable-button px-3 py-1.5 rounded-lg text-sm font-semibold ${profile === 'operations' ? 'bg-blue-700 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300'}`}
            >
              Operations
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 inline-flex items-center gap-2">
            <Gauge className="w-4 h-4 text-blue-700" />
            Status Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 inline-flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-600" />
            Component Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <PieChart>
                <Pie data={componentData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={88} label>
                  {componentData.map((item, index) => (
                    <Cell key={`component-${item.name}`} fill={PALETTE[index % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 inline-flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            Progress Band Analysis
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <BarChart data={progressBandData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="band" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="students" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Student Progress and Assessments</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="progress" stroke="#2563eb" strokeWidth={2} />
                <Line type="monotone" dataKey="assessments" stroke="#f59e0b" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Module Difficulty Mix</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
            <BarChart data={difficultyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#7c3aed" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
