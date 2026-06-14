import { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, Building2, Filter, KeyRound, LockKeyhole, Mail, MoreVertical, Pencil, Plus, Save, Search, Trash2, Users, X } from 'lucide-react';
import { BILIRAN_MUNICIPALITIES, BiliranMunicipality, NSTP_COMPONENTS, loadAccounts, loadStudents, normalizeComponent, NstpAccount, saveAccounts } from '../../../data/nstpData';
import { Pager, useModalEscape } from '../../facilitator/components/FacilitatorUI';
import ExportButtonGroup from '../../../components/common/ExportButtonGroup';
import { exportRows, type ExportColumn, type ExportFormat } from '../../../utils/exportRecords';

type Props = {
  admin: NstpAccount;
};

const emptyFacilitator = (): NstpAccount => ({
  id: `facilitator-${Math.random().toString(36).slice(2, 9)}`,
  name: 'New Facilitator',
  email: `facilitator-${Math.random().toString(36).slice(2, 5)}@nstp.edu`,
  password: 'facilitator123',
  role: 'facilitator',
  title: 'NSTP Facilitator',
  bio: 'Facilitates assigned municipality groups, monitors attendance, validates outputs, and records grades.',
  municipalities: ['Naval'],
  component: 'CWTS',
});

const initials = (name: string) => name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();

export default function FacilitatorManagement({ admin }: Props) {
  const [facilitators, setFacilitators] = useState<NstpAccount[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<NstpAccount | null>(null);
  const [query, setQuery] = useState('');
  const [municipalityFilter, setMunicipalityFilter] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const closeEditor = () => {
    setEditingId(null);
    setForm(null);
  };

  useModalEscape({
    open: Boolean(editingId && form),
    onClose: closeEditor,
    confirmClose: () => window.confirm('Close facilitator editing and discard unsaved changes?'),
  });

  useEffect(() => {
    const nextFacilitators = loadAccounts().filter((account) => account.role === 'facilitator');
    setFacilitators(nextFacilitators);
    setSelectedId(nextFacilitators[0]?.id ?? null);
  }, []);

  const students = useMemo(() => loadStudents(), [facilitators]);
  const coveredMunicipalities = useMemo(() => new Set(facilitators.flatMap((facilitator) => facilitator.municipalities || [])).size, [facilitators]);
  const unassignedMunicipalities = Math.max(0, BILIRAN_MUNICIPALITIES.length - coveredMunicipalities);

  const assignedStudentsFor = (facilitator: NstpAccount) => students.filter((student) => {
    const studentMunicipality = student.municipality as BiliranMunicipality | undefined;
    const componentMatches = facilitator.component ? student.component !== 'Common Phase' && normalizeComponent(student.component) === normalizeComponent(facilitator.component) : true;
    return componentMatches && (student.facilitatorId === facilitator.id || Boolean(studentMunicipality && facilitator.municipalities?.includes(studentMunicipality)));
  });

  const filteredFacilitators = facilitators.filter((facilitator) => {
    const haystack = `${facilitator.name} ${facilitator.email} ${facilitator.component || ''} ${(facilitator.municipalities || []).join(' ')}`.toLowerCase();
    const matchesQuery = haystack.includes(query.toLowerCase());
    const matchesMunicipality = municipalityFilter === 'all' || facilitator.municipalities?.includes(municipalityFilter as BiliranMunicipality);
    return matchesQuery && matchesMunicipality;
  });
  useEffect(() => setPage(1), [query, municipalityFilter, pageSize]);
  const displayedFacilitators = filteredFacilitators.slice((page - 1) * pageSize, page * pageSize);

  const selectedFacilitator = facilitators.find((facilitator) => facilitator.id === selectedId) || filteredFacilitators[0] || facilitators[0] || null;
  const selectedStudents = selectedFacilitator ? assignedStudentsFor(selectedFacilitator) : [];

  const persist = (nextFacilitators: NstpAccount[]) => {
    const allAccounts = loadAccounts().filter((account) => account.role !== 'facilitator');
    saveAccounts([...allAccounts, ...nextFacilitators]);
    setFacilitators(nextFacilitators);
  };

  const startNew = () => {
    setEditingId('new');
    setForm(emptyFacilitator());
  };

  const startEdit = (facilitator: NstpAccount) => {
    setEditingId(facilitator.id);
    setForm({ ...facilitator });
    setSelectedId(facilitator.id);
  };

  const removeFacilitator = (facilitatorId: string) => {
    const nextFacilitators = facilitators.filter((facilitator) => facilitator.id !== facilitatorId);
    persist(nextFacilitators);
    setSelectedId(nextFacilitators[0]?.id ?? null);
  };

  const saveFacilitator = () => {
    if (!form) return;
    const nextFacilitator = {
      ...form,
      role: 'facilitator' as const,
      municipalities: form.municipalities?.length ? form.municipalities : ['Naval' as BiliranMunicipality],
      component: form.component ? normalizeComponent(form.component) : 'CWTS',
    };
    const nextFacilitators = facilitators.some((facilitator) => facilitator.id === nextFacilitator.id)
      ? facilitators.map((facilitator) => (facilitator.id === nextFacilitator.id ? nextFacilitator : facilitator))
      : [nextFacilitator, ...facilitators];
    persist(nextFacilitators);
    setSelectedId(nextFacilitator.id);
    setEditingId(null);
    setForm(null);
  };

  const exportFacilitators = async (format: ExportFormat, rows = filteredFacilitators, scope = 'Filtered') => {
    if (!rows.length) return;
    const columns: ExportColumn<NstpAccount>[] = [
      { header: 'Facilitator Name', value: 'name', width: 28 },
      { header: 'Email', value: 'email', width: 30 },
      { header: 'Component', value: (row) => row.component || 'All', width: 18 },
      { header: 'Municipalities', value: (row) => (row.municipalities || []).join('; '), width: 40 },
      { header: 'Assigned Students', value: (row) => assignedStudentsFor(row).length, width: 18 },
      { header: 'Title', value: (row) => row.title || '', width: 22 },
      { header: 'Status', value: () => 'Active', width: 14 },
      { header: 'Bio', value: (row) => row.bio || '', width: 42 },
    ];
    await exportRows(format, rows, columns, {
      title: 'Facilitator Account and Workload Records',
      dataType: 'FacilitatorRecords',
      scope,
      generatedBy: admin.name,
      filters: { Search: query || 'All', Municipality: municipalityFilter },
      signatureLines: ['Prepared by', 'Reviewed by', 'NSTP Director'],
    });
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 dark:border-slate-800 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">Facilitator Module</p>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">Facilitator Management</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Create and manage facilitator accounts. Assign municipalities and monitor workload.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="flex min-h-12 w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:w-96">
            <Search className="h-4 w-4 text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search facilitator name, email, or municipality..." className="w-full bg-transparent outline-none dark:text-slate-100" />
          </label>
          <select value={municipalityFilter} onChange={(event) => setMunicipalityFilter(event.target.value)} className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100">
            <option value="all">All municipalities</option>
            {BILIRAN_MUNICIPALITIES.map((municipality) => <option key={municipality} value={municipality}>{municipality}</option>)}
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Total Facilitators', value: facilitators.length, detail: `${facilitators.length} active`, icon: Users, tone: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200' },
          { label: 'Active Facilitators', value: facilitators.length, detail: 'All listed accounts active', icon: BadgeCheck, tone: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200' },
          { label: 'Municipalities Covered', value: coveredMunicipalities, detail: 'Assigned coverage', icon: Building2, tone: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-200' },
          { label: 'Unassigned Municipalities', value: unassignedMunicipalities, detail: 'Needs assignment', icon: Users, tone: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <article key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-center gap-4">
                <span className={`grid h-14 w-14 place-items-center rounded-2xl ${stat.tone}`}><Icon className="h-6 w-6" /></span>
                <div>
                  <p className="text-2xl font-semibold text-slate-950 dark:text-white">{stat.value}</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{stat.label}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{stat.detail}</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-3">
              <button onClick={startNew} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-800">
                <Plus className="h-4 w-4" />
                Create Facilitator
              </button>
              <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-blue-50 dark:border-slate-800 dark:text-slate-100">
                <Filter className="h-4 w-4" />
                Bulk Actions
              </button>
            </div>
            <ExportButtonGroup compact label="Export facilitators" onExport={(format) => exportFacilitators(format, filteredFacilitators, 'Filtered')} disabled={filteredFacilitators.length === 0} />
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full min-w-[920px] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.08em] text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3"><input type="checkbox" className="h-4 w-4 rounded border-slate-300" /></th>
                  <th className="px-4 py-3">Facilitator</th>
                  <th className="px-4 py-3">Municipalities</th>
                  <th className="px-4 py-3">Students Assigned</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Last Active</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedFacilitators.map((facilitator, index) => {
                  const assignedStudents = assignedStudentsFor(facilitator);
                  const selected = selectedFacilitator?.id === facilitator.id;
                  return (
                    <tr key={facilitator.id} onClick={() => setSelectedId(facilitator.id)} className={`cursor-pointer border-t border-slate-100 hover:bg-blue-50/60 dark:border-slate-800 dark:hover:bg-slate-900 ${selected ? 'bg-blue-50/70 dark:bg-blue-500/10' : ''}`}>
                      <td className="px-4 py-3"><input onClick={(event) => event.stopPropagation()} type="checkbox" className="h-4 w-4 rounded border-slate-300" /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="grid h-11 w-11 place-items-center rounded-full bg-indigo-50 font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-200">{initials(facilitator.name)}</span>
                          <div>
                            <p className="font-semibold text-slate-950 dark:text-white">{facilitator.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{facilitator.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {(facilitator.municipalities || []).slice(0, 2).map((municipality) => <span key={municipality} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-200">{municipality}</span>)}
                          {(facilitator.municipalities || []).length > 2 && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">+{(facilitator.municipalities || []).length - 2}</span>}
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{facilitator.municipalities?.length || 0} municipalit{facilitator.municipalities?.length === 1 ? 'y' : 'ies'}</p>
                      </td>
                      <td className="px-4 py-3"><p className="font-semibold text-slate-900 dark:text-slate-100">{assignedStudents.length}</p><p className="text-xs text-slate-500 dark:text-slate-400">students</p></td>
                      <td className="px-4 py-3"><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">Active</span></td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">May {24 - index}, 2024<br /><span className="text-xs text-slate-500">9:{index}0 AM</span></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={(event) => { event.stopPropagation(); startEdit(facilitator); }} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-700 hover:bg-blue-50 dark:border-slate-800 dark:text-slate-100"><Pencil className="h-4 w-4" /></button>
                          <button onClick={(event) => event.stopPropagation()} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-700 hover:bg-blue-50 dark:border-slate-800 dark:text-slate-100"><MoreVertical className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredFacilitators.length === 0 && <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">No facilitators match the current filters.</div>}
          </div>
          {filteredFacilitators.length ? <Pager page={page} totalPages={Math.ceil(filteredFacilitators.length / pageSize)} onPage={setPage} total={filteredFacilitators.length} pageSize={pageSize} onPageSize={setPageSize} pageSizeOptions={[10, 25, 50, 100]} /> : null}
        </section>

        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="mb-5 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Facilitator Details</p>
            <button onClick={() => setSelectedId(null)} className="grid h-8 w-8 place-items-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300"><X className="h-4 w-4" /></button>
          </div>
          {selectedFacilitator ? (
            <div className="space-y-5">
              <div className="text-center">
                <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-indigo-50 text-2xl font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-200">{initials(selectedFacilitator.name)}</span>
                <h3 className="mt-4 text-lg font-semibold text-slate-950 dark:text-white">{selectedFacilitator.name}</h3>
                <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">Active</span>
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{selectedFacilitator.email}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Facilitator since May 15, 2023</p>
              </div>
              <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-50 dark:border-slate-800 dark:text-blue-200"><LockKeyhole className="h-4 w-4" /> Reset Password</button>
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Assigned Municipalities ({selectedFacilitator.municipalities?.length || 0})</p>
                <div className="space-y-2">
                  {(selectedFacilitator.municipalities || []).map((municipality) => (
                    <div key={municipality} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm dark:bg-slate-900">
                      <span className="font-medium text-slate-900 dark:text-white">{municipality}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{students.filter((student) => student.municipality === municipality).length} students</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Load Summary</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Total Students</span><span className="font-semibold text-slate-900 dark:text-white">{selectedStudents.length}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Municipalities</span><span className="font-semibold text-slate-900 dark:text-white">{selectedFacilitator.municipalities?.length || 0}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500 dark:text-slate-400">Average per Municipality</span><span className="font-semibold text-slate-900 dark:text-white">{Math.round(selectedStudents.length / Math.max(1, selectedFacilitator.municipalities?.length || 1))}</span></div>
                </div>
                <span className="mt-4 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">Balanced Load</span>
              </div>
            </div>
          ) : <p className="text-sm text-slate-500 dark:text-slate-400">Select a facilitator to view details.</p>}
        </aside>
      </div>

      {editingId && form && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
          <div className="max-h-[90dvh] w-full max-w-4xl overflow-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-6 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">{editingId === 'new' ? 'Create Account' : 'Edit Account'}</p>
                <h3 className="text-2xl font-semibold text-slate-950 dark:text-white">{editingId === 'new' ? 'Create Facilitator' : 'Edit Facilitator'}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Define login credentials, component assignment, and municipality coverage.</p>
              </div>
              <button onClick={closeEditor} className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200"><span>Name</span><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900" /></label>
              <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200"><span>Email</span><div className="relative"><Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="w-full rounded-xl border border-slate-300 py-3 pl-9 pr-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900" /></div></label>
              <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200"><span>Password</span><div className="relative"><KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input type="text" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="w-full rounded-xl border border-slate-300 py-3 pl-9 pr-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900" /></div></label>
              <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200"><span>NSTP Component</span><select value={form.component || 'CWTS'} onChange={(event) => setForm({ ...form, component: normalizeComponent(event.target.value) })} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900">{NSTP_COMPONENTS.map((component) => <option key={component} value={component}>{component}</option>)}</select></label>
              <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200"><span>Title</span><input value={form.title || ''} onChange={(event) => setForm({ ...form, title: event.target.value })} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900" /></label>
              <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200 md:col-span-2"><span>Bio</span><textarea value={form.bio || ''} onChange={(event) => setForm({ ...form, bio: event.target.value })} rows={3} className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900" /></label>
              <div className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200 md:col-span-2">
                <span>Assigned Municipalities</span>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {BILIRAN_MUNICIPALITIES.map((item) => {
                    const selected = form.municipalities?.includes(item) || false;
                    return (
                      <label key={item} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm ${selected ? 'border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-200' : 'border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'}`}>
                        <input type="checkbox" checked={selected} onChange={(event) => {
                          const current = form.municipalities || [];
                          setForm({ ...form, municipalities: event.target.checked ? [...current, item] : current.filter((municipality) => municipality !== item) });
                        }} />
                        {item}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              {editingId !== 'new' && <button onClick={() => form && removeFacilitator(form.id)} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-5 py-3 font-semibold text-rose-600 hover:bg-rose-50 dark:border-rose-500/30 dark:text-rose-200"><Trash2 className="h-4 w-4" /> Delete</button>}
              <button onClick={closeEditor} className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200">Cancel</button>
              <button onClick={saveFacilitator} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800"><Save className="h-4 w-4" /> Save Facilitator</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
