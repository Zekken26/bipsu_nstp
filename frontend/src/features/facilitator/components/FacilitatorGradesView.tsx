import { useEffect, useState } from 'react';
import { Loader2, Save, Search } from 'lucide-react';
import {
  fetchInstructorClasses, fetchInstructorGradeRoster, previewClassification, saveInstructorGrade,
  type AcademicSemester, type GradeRosterRow, type InstructorClass,
} from '../../../services/grades';
import { getCurrentAcademicYear } from '../../../utils/academicYear';

type Draft = { percentGrade: string; numericalGrade: string; remarks: string };
const blank = (): Draft => ({ percentGrade: '', numericalGrade: '', remarks: '' });

export default function FacilitatorGradesView() {
  const [classes, setClasses] = useState<InstructorClass[]>([]);
  const [classId, setClassId] = useState('');
  const [schoolYear, setSchoolYear] = useState(getCurrentAcademicYear());
  const [semester, setSemester] = useState<AcademicSemester>('FIRST');
  const [roster, setRoster] = useState<GradeRosterRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const pageSize = 10;

  useEffect(() => {
    fetchInstructorClasses().then((rows) => {
      setClasses(rows);
      if (rows[0]) {
        setClassId(rows[0].id);
        setSchoolYear(rows[0].schoolYear.replace(/^SY\s+/i, ''));
        setSemester(/^second/i.test(rows[0].semester) ? 'SECOND' : 'FIRST');
      }
      setError('');
    }).catch((reason) => setError(reason instanceof Error ? reason.message : 'Unable to load assigned classes.'));
  }, []);

  useEffect(() => {
    if (!classId) { setRoster([]); setLoading(false); return; }
    const timeout = window.setTimeout(() => {
      setLoading(true);
      fetchInstructorGradeRoster(classId, { schoolYear, semester, page, pageSize, search: search.trim() || undefined }).then((response) => {
        setRoster(response.data);
        setTotal(response.meta?.total || 0);
        setTotalPages(response.meta?.totalPages || 1);
        setDrafts(Object.fromEntries(response.data.map((row) => [row.student.id, row.grade ? {
          percentGrade: String(row.grade.percentGrade), numericalGrade: String(row.grade.numericalGrade), remarks: row.grade.remarks || '',
        } : blank()])));
        setError('');
      }).catch((reason) => setError(reason instanceof Error ? reason.message : 'Unable to load the class grade roster.')).finally(() => setLoading(false));
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [classId, schoolYear, semester, page, search]);

  useEffect(() => { setPage(1); }, [classId, schoolYear, semester, search]);

  const updateDraft = (id: string, patch: Partial<Draft>) => {
    setDrafts((current) => ({ ...current, [id]: { ...(current[id] || blank()), ...patch } }));
    setRowErrors((current) => ({ ...current, [id]: '' }));
  };

  const save = async (row: GradeRosterRow) => {
    const draft = drafts[row.student.id] || blank();
    const percentGrade = Number(draft.percentGrade);
    const numericalGrade = Number(draft.numericalGrade);
    if (!previewClassification(percentGrade, numericalGrade)) {
      setRowErrors((current) => ({ ...current, [row.student.id]: 'Percent and numerical grades do not match the approved grading system.' }));
      return;
    }
    setBusyId(row.student.id);
    try {
      const grade = await saveInstructorGrade(classId, { studentId: row.student.id, schoolYear, semester, percentGrade, numericalGrade, remarks: draft.remarks });
      setRoster((current) => current.map((item) => item.student.id === row.student.id ? { ...item, grade } : item));
      setRowErrors((current) => ({ ...current, [row.student.id]: '' }));
    } catch (reason) {
      setRowErrors((current) => ({ ...current, [row.student.id]: reason instanceof Error ? reason.message : 'Grade draft could not be saved.' }));
    } finally { setBusyId(null); }
  };

  return <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
    <div><h2 className="text-lg font-semibold text-slate-950 dark:text-white">Semester Grade Book</h2><p className="text-sm text-slate-500 dark:text-slate-400">Enter First or Second Semester drafts for students in your assigned classes. Administrators control official release.</p></div>
    <div className="grid gap-3 md:grid-cols-4">
      <label className="text-sm font-medium">Assigned class<select value={classId} onChange={(event) => setClassId(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900"><option value="">Select a class</option>{classes.map((item) => <option key={item.id} value={item.id}>{item.code} — {item.name}</option>)}</select></label>
      <label className="text-sm font-medium">School year<input value={schoolYear} onChange={(event) => setSchoolYear(event.target.value)} pattern="\d{4}-\d{4}" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900" /></label>
      <label className="text-sm font-medium">Semester<select value={semester} onChange={(event) => setSemester(event.target.value as AcademicSemester)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900"><option value="FIRST">First Semester</option><option value="SECOND">Second Semester</option></select></label>
      <label className="relative text-sm font-medium">Search<Search className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name or student ID" className="mt-1 w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 dark:border-slate-700 dark:bg-slate-900" /></label>
    </div>
    {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800"><table className="min-w-[900px] w-full text-left text-sm"><thead className="bg-slate-50 dark:bg-slate-900"><tr><th className="px-4 py-3">Student</th><th className="px-4 py-3">Percent</th><th className="px-4 py-3">Numerical</th><th className="px-4 py-3">Classification</th><th className="px-4 py-3">Remarks</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Action</th></tr></thead>
      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">{loading ? <tr><td colSpan={7} className="p-10 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-700" /></td></tr> : roster.map((row) => {
        const draft = drafts[row.student.id] || blank(); const locked = Boolean(row.grade?.isReleased); const classification = previewClassification(Number(draft.percentGrade), Number(draft.numericalGrade));
        return <tr key={row.student.id}><td className="px-4 py-3"><p className="font-semibold">{row.student.user.name}</p><p className="text-xs text-slate-500">{row.student.studentNumber}</p>{rowErrors[row.student.id] && <p role="alert" className="mt-1 text-xs text-rose-600">{rowErrors[row.student.id]}</p>}</td><td className="px-4 py-3"><input disabled={locked} type="number" min="0" max="100" step="1" value={draft.percentGrade} onChange={(event) => updateDraft(row.student.id, { percentGrade: event.target.value })} className="w-20 rounded-lg border px-2 py-2 disabled:bg-slate-100 dark:bg-slate-900" /></td><td className="px-4 py-3"><input disabled={locked} type="number" min="1" max="5" step="0.1" value={draft.numericalGrade} onChange={(event) => updateDraft(row.student.id, { numericalGrade: event.target.value })} className="w-20 rounded-lg border px-2 py-2 disabled:bg-slate-100 dark:bg-slate-900" /></td><td className="px-4 py-3">{classification?.replace(/_/g, ' ') || '—'}</td><td className="px-4 py-3"><input disabled={locked} value={draft.remarks} maxLength={500} onChange={(event) => updateDraft(row.student.id, { remarks: event.target.value })} className="w-40 rounded-lg border px-2 py-2 disabled:bg-slate-100 dark:bg-slate-900" /></td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${locked ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{locked ? 'Released' : 'Draft'}</span></td><td className="px-4 py-3"><button disabled={locked || busyId === row.student.id} onClick={() => void save(row)} className="inline-flex items-center gap-1 rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{busyId === row.student.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save Draft</button></td></tr>;
      })}{!loading && roster.length === 0 && <tr><td colSpan={7} className="p-10 text-center text-slate-500">No assigned students found.</td></tr>}</tbody></table></div>
    <div className="flex items-center justify-between text-sm text-slate-500"><span>{total} students</span><div className="flex gap-2"><button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="rounded-lg border px-3 py-2 disabled:opacity-40">Previous</button><span className="py-2">{page}/{totalPages}</span><button disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)} className="rounded-lg border px-3 py-2 disabled:opacity-40">Next</button></div></div>
  </section>;
}
