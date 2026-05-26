import { BarChart3, CalendarCheck, ClipboardCheck, GraduationCap, TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { calculateFinalGrade, type FacilitatorWorkspace } from '../hooks/useFacilitatorWorkspace';
import { EmptyState, PageIntro, Panel, StatCard, StatusBadge } from '../components/FacilitatorUI';

export default function FacilitatorReportsPage({ workspace }: { workspace: FacilitatorWorkspace }) {
  const attendanceRows = workspace.attendance.map((session) => ({
    date: session.date,
    topic: session.topic,
    present: session.entries.filter((entry) => entry.status === 'present').length,
    absent: session.entries.filter((entry) => entry.status === 'absent').length,
    late: session.entries.filter((entry) => entry.status === 'late').length,
  }));
  const totalAttendance = attendanceRows.reduce((total, row) => total + row.present + row.absent + row.late, 0);
  const presentRate = totalAttendance ? Math.round((attendanceRows.reduce((total, row) => total + row.present, 0) / totalAttendance) * 100) : 0;
  const completedGrades = workspace.detailedGrades.filter((grade) => ['Submitted', 'Reviewed', 'Released'].includes(grade.status)).length;
  const submissionData = workspace.assessments.map((assessment) => ({
    name: assessment.title.length > 18 ? `${assessment.title.slice(0, 18)}...` : assessment.title,
    submissions: workspace.students.filter((student) => {
      const raw = localStorage.getItem(`assessments-${student.id}`);
      return raw ? Boolean((JSON.parse(raw) as Record<string, unknown>)[assessment.id]) : false;
    }).length,
  }));
  const progressData = [
    { name: '0-49%', value: workspace.students.filter((student) => student.progress < 50).length },
    { name: '50-74%', value: workspace.students.filter((student) => student.progress >= 50 && student.progress < 75).length },
    { name: '75-89%', value: workspace.students.filter((student) => student.progress >= 75 && student.progress < 90).length },
    { name: '90-100%', value: workspace.students.filter((student) => student.progress >= 90).length },
  ];
  const gradeRows = workspace.students.map((student) => {
    const grade = workspace.detailedGrades.find((item) => item.studentId === student.id);
    return { student, grade, final: calculateFinalGrade(grade) };
  }).filter((row) => row.grade);

  return (
    <>
      <PageIntro
        eyebrow="Monitoring and Evaluation"
        title="Facilitator Reports"
        description="Reports are generated only from your assigned student scope and facilitator-entered class records."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Attendance Report" value={`${presentRate}%`} detail="Present across recorded sessions" icon={CalendarCheck} tone="emerald" />
        <StatCard label="Grade Completion" value={`${completedGrades}/${workspace.students.length}`} detail="Completed or released" icon={GraduationCap} tone="blue" />
        <StatCard label="Assessment Report" value={submissionData.reduce((total, item) => total + item.submissions, 0)} detail="Recorded submissions" icon={ClipboardCheck} tone="indigo" />
        <StatCard label="Student Progress" value={`${workspace.students.length ? Math.round(workspace.students.reduce((sum, item) => sum + item.progress, 0) / workspace.students.length) : 0}%`} detail="Average learning progress" icon={TrendingUp} tone="amber" />
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel>
          <h2 className="inline-flex items-center gap-2 text-lg font-bold text-slate-950 dark:text-white"><CalendarCheck className="h-5 w-5 text-blue-700" /> Attendance Report</h2>
          {attendanceRows.length ? (
            <div className="mt-5 h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceRows}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" fontSize={11} />
                  <YAxis allowDecimals={false} fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="present" fill="#059669" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="late" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="absent" fill="#e11d48" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <div className="mt-4"><EmptyState title="No attendance report data" body="Record attendance sessions to display attendance trends." /></div>}
        </Panel>
        <Panel>
          <h2 className="inline-flex items-center gap-2 text-lg font-bold text-slate-950 dark:text-white"><BarChart3 className="h-5 w-5 text-blue-700" /> Student Progress Report</h2>
          <div className="mt-5 grid items-center gap-3 sm:grid-cols-[230px_1fr]">
            <div className="h-[230px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={progressData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={88} paddingAngle={3}>
                    {['#ef4444', '#f59e0b', '#2563eb', '#059669'].map((color) => <Cell key={color} fill={color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {progressData.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: ['#ef4444', '#f59e0b', '#2563eb', '#059669'][index] }} /> {item.name}</span>
                  <span className="font-bold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel>
          <h2 className="text-lg font-bold text-slate-950 dark:text-white">Assessment Submission Report</h2>
          {submissionData.length ? (
            <div className="mt-5 h-[270px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={submissionData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} fontSize={11} />
                  <YAxis type="category" dataKey="name" width={125} fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="submissions" fill="#2563eb" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <div className="mt-4"><EmptyState title="No assessment records" body="Created facilitator assessments will appear in this report." /></div>}
        </Panel>
        <Panel>
          <h2 className="text-lg font-bold text-slate-950 dark:text-white">Grade Completion Report</h2>
          {gradeRows.length ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-slate-900"><tr><th className="px-3 py-3">Student</th><th className="px-3 py-3">Final</th><th className="px-3 py-3">Status</th></tr></thead>
                <tbody>
                  {gradeRows.slice(0, 8).map(({ student, grade, final }) => (
                    <tr key={student.id} className="border-b border-slate-100 dark:border-slate-800"><td className="px-3 py-3 font-semibold">{student.name}</td><td className="px-3 py-3">{final ?? '--'}</td><td className="px-3 py-3"><StatusBadge value={grade!.status} /></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <div className="mt-4"><EmptyState title="No grade completion data" body="Gradebook entries saved by the facilitator will populate this table." /></div>}
        </Panel>
      </div>
    </>
  );
}
