import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart3, Bell, BookOpen, Check, ChevronDown, ClipboardList, Download, FileText, LayoutDashboard, Mail, Menu, Moon, Plus, Save, Search, Settings, Trash2, Upload, UserCog, Users, X,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import CollapsibleRoleSidebar from '../../../components/layout/CollapsibleRoleSidebar';
import {
  BILIRAN_MUNICIPALITIES, BiliranMunicipality, createEmptyModule, loadAccounts, loadAssessments, loadModules, loadStudents, NSTP_COMPONENTS, NstpAccount, NstpModule, NstpStudent, saveAccounts, saveModules,
} from '../../../data/nstpData';

const initials = (name: string) => name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'C';

export default function CoordinatorDashboard({
  user, onLogout, onNavigate, embedded = false,
}: {
  user: any; onLogout?: () => void; onNavigate?: (target: string) => void; embedded?: boolean;
}) {
  type CoordinatorView = 'dashboard' | 'modules' | 'facilitators' | 'reports';

  const [view, setView] = useState<CoordinatorView>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [modules, setModules] = useState<NstpModule[]>([]);
  const [facilitators, setFacilitators] = useState<NstpAccount[]>([]);
  const [students, setStudents] = useState<NstpStudent[]>([]);
  const [search, setSearch] = useState('');

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<NstpModule | null>(null);

  const [facilitatorEditorOpen, setFacilitatorEditorOpen] = useState(false);
  const [editingFacilitator, setEditingFacilitator] = useState<NstpAccount | null>(null);

  const userComponent = user.component || 'CWTS';

  const refreshData = () => {
    setModules(loadModules());
    setFacilitators(loadAccounts().filter((a) => a.role === 'facilitator'));
    setStudents(loadStudents());
  };

  useEffect(() => { refreshData(); }, []);

  const scopedModules = useMemo(
    () => modules.filter((m) => m.component === userComponent || m.component === 'Common'),
    [modules, userComponent],
  );

  const scopedStudents = useMemo(
    () => students.filter((s) => s.component === userComponent),
    [students, userComponent],
  );

  const scopedFacilitators = useMemo(
    () => facilitators,
    [facilitators],
  );

  const query = search.trim().toLowerCase();

  const filteredModules = scopedModules.filter((m) =>
    !query || [m.title, m.description].some((v) => v?.toLowerCase().includes(query))
  );

  const filteredFacilitators = scopedFacilitators.filter((f) =>
    !query || [f.name, f.email, ...(f.municipalities || [])].some((v) => v?.toLowerCase().includes(query))
  );

  const componentColors = ['#10b981', '#2563eb', '#f59e0b', '#8b5cf6', '#06b6d4'];

  const componentData = NSTP_COMPONENTS.map((c) => ({
    name: c, value: scopedStudents.filter((s) => s.component === c).length,
  }));

  const sideNavItems = [
    { id: 'dashboard' as CoordinatorView, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'modules' as CoordinatorView, label: 'Module Library', icon: BookOpen },
    { id: 'facilitators' as CoordinatorView, label: 'Facilitators', icon: Users },
    { id: 'reports' as CoordinatorView, label: 'Reports', icon: BarChart3 },
  ];

  const handleNewModule = () => {
    setEditingModule(createEmptyModule());
    setEditorOpen(true);
  };

  const handleEditModule = (mod: NstpModule) => {
    setEditingModule({ ...mod });
    setEditorOpen(true);
  };

  const handleSaveModule = () => {
    if (!editingModule) return;
    const next = { ...editingModule, component: editingModule.component || userComponent, updatedAt: new Date().toISOString() };
    const existing = loadModules();
    const idx = existing.findIndex((m) => m.id === next.id);
    const updated = idx >= 0 ? existing.map((m) => m.id === next.id ? next : m) : [next, ...existing];
    saveModules(updated);
    setModules(updated);
    setEditorOpen(false);
    setEditingModule(null);
  };

  const handleDeleteModule = (id: string) => {
    const updated = loadModules().filter((m) => m.id !== id);
    saveModules(updated);
    setModules(updated);
  };

  const handleNewFacilitator = () => {
    setEditingFacilitator({
      id: `facilitator-${Math.random().toString(36).slice(2, 9)}`,
      name: '', email: '', password: '', role: 'facilitator',
      employeeNumber: `FAC-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      municipalities: [],
      title: userComponent,
    } as NstpAccount);
    setFacilitatorEditorOpen(true);
  };

  const handleEditFacilitator = (f: NstpAccount) => {
    setEditingFacilitator({ ...f });
    setFacilitatorEditorOpen(true);
  };

  const handleSaveFacilitator = () => {
    if (!editingFacilitator) return;
    const next = { ...editingFacilitator, role: 'facilitator' as const, title: editingFacilitator.title || userComponent };
    const allAccounts = loadAccounts();
    const otherAccounts = allAccounts.filter((a) => a.role !== 'facilitator');
    const existingFacs = allAccounts.filter((a) => a.role === 'facilitator');
    const updatedFacs = existingFacs.some((f) => f.id === next.id)
      ? existingFacs.map((f) => f.id === next.id ? next : f)
      : [next, ...existingFacs];
    saveAccounts([...otherAccounts, ...updatedFacs]);
    setFacilitators(updatedFacs);
    setFacilitatorEditorOpen(false);
    setEditingFacilitator(null);
  };

  const handleDeleteFacilitator = (id: string) => {
    const allAccounts = loadAccounts();
    const otherAccounts = allAccounts.filter((a) => a.role !== 'facilitator');
    const remainingFacs = allAccounts.filter((a) => a.role === 'facilitator' && a.id !== id);
    saveAccounts([...otherAccounts, ...remainingFacs]);
    setFacilitators(remainingFacs);
  };

  const renderDashboard = () => (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Modules', value: scopedModules.length, detail: `For ${userComponent}`, icon: BookOpen, tone: 'bg-blue-50 text-blue-700' },
          { label: 'Facilitators', value: scopedFacilitators.length, detail: 'Active facilitators', icon: Users, tone: 'bg-emerald-50 text-emerald-700' },
          { label: 'Students', value: scopedStudents.length, detail: `Enrolled in ${userComponent}`, icon: UserCog, tone: 'bg-violet-50 text-violet-700' },
          { label: 'Assessments', value: loadAssessments().length, detail: 'In the library', icon: ClipboardList, tone: 'bg-amber-50 text-amber-700' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-center gap-4">
                <span className={`grid h-14 w-14 place-items-center rounded-2xl ${stat.tone}`}><Icon className="h-6 w-6" /></span>
                <div>
                  <p className="text-2xl font-semibold text-slate-950 dark:text-white">{stat.value}</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{stat.label}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{stat.detail}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Quick Actions</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button onClick={() => setView('modules')} className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-left text-sm font-semibold text-blue-800 hover:bg-blue-100 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200">
              <BookOpen className="mb-1 h-5 w-5" />
              Manage Modules
            </button>
            <button onClick={() => setView('facilitators')} className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-left text-sm font-semibold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
              <Users className="mb-1 h-5 w-5" />
              Manage Facilitators
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Student Distribution</p>
          <div className="mt-4 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={componentData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {componentData.map((_, i) => <Cell key={i} fill={componentColors[i % componentColors.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );

  const renderModulesView = () => (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">Module Library</p>
          <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">Manage Modules</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Create and manage modules for {userComponent}.</p>
        </div>
        <button onClick={handleNewModule} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800">
          <Plus className="h-4 w-4" /> New Module
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.08em] text-slate-500 dark:bg-slate-900 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Hours</th>
                <th className="px-4 py-3">Difficulty</th>
                <th className="px-4 py-3">Component</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredModules.map((mod) => (
                <tr key={mod.id} className="border-t border-slate-100 hover:bg-blue-50/60 dark:border-slate-800 dark:hover:bg-slate-900">
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{mod.title}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{mod.hours}h</td>
                  <td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">{mod.difficulty}</span></td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{mod.component || 'Common'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEditModule(mod)} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-700 hover:bg-blue-50 dark:border-slate-700 dark:text-slate-100"><FileText className="h-4 w-4" /></button>
                      <button onClick={() => handleDeleteModule(mod.id)} className="grid h-9 w-9 place-items-center rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-500/30 dark:text-rose-200"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredModules.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">No modules found. Create your first module.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderFacilitatorsView = () => (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">Facilitator Management</p>
          <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">Manage Facilitators</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Create and manage facilitators for {userComponent}.</p>
        </div>
        <button onClick={handleNewFacilitator} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800">
          <Plus className="h-4 w-4" /> New Facilitator
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.08em] text-slate-500 dark:bg-slate-900 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Facilitator</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Municipalities</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFacilitators.map((fac) => (
                <tr key={fac.id} className="border-t border-slate-100 hover:bg-blue-50/60 dark:border-slate-800 dark:hover:bg-slate-900">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-200">{initials(fac.name)}</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{fac.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{fac.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(fac.municipalities || []).slice(0, 3).map((m) => <span key={m} className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-200">{m}</span>)}
                      {(fac.municipalities || []).length > 3 && <span className="text-xs text-slate-500">+{(fac.municipalities || []).length - 3}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEditFacilitator(fac)} className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-700 hover:bg-blue-50 dark:border-slate-700 dark:text-slate-100"><FileText className="h-4 w-4" /></button>
                      <button onClick={() => handleDeleteFacilitator(fac.id)} className="grid h-9 w-9 place-items-center rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-500/30 dark:text-rose-200"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredFacilitators.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">No facilitators found. Create your first facilitator.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderReportsView = () => {
    const gradeValues = scopedStudents.map((s) => {
      const progress = s.progress || 0;
      return progress;
    }).filter((g) => g > 0);
    const avgProgress = gradeValues.length ? Math.round(gradeValues.reduce((a, b) => a + b, 0) / gradeValues.length) : 0;

    return (
      <div className="space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">Reports</p>
          <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">{userComponent} Analytics</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Total Students', value: scopedStudents.length, color: 'text-blue-700' },
            { label: 'Active', value: scopedStudents.filter((s) => s.status === 'active').length, color: 'text-emerald-700' },
            { label: 'Avg Progress', value: `${avgProgress}%`, color: 'text-amber-700' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
              <p className={`mt-2 text-3xl font-bold ${stat.color} dark:text-${stat.color.replace('text-', '')}`}>{stat.value}</p>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <p className="mb-4 text-sm font-semibold text-slate-800 dark:text-slate-100">Module Hours</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scopedModules.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="title" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="hours" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (view) {
      case 'modules': return renderModulesView();
      case 'facilitators': return renderFacilitatorsView();
      case 'reports': return renderReportsView();
      default: return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f8fd] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="flex h-screen">
        <CollapsibleRoleSidebar
          open={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
          portalLabel="Coordinator Portal"
          closeLabel="Close coordinator navigation"
          groups={[
            {
              label: 'Navigation',
              items: sideNavItems.map((item) => ({
                label: item.label,
                icon: item.icon,
                active: view === item.id,
                onClick: () => { setView(item.id); setMobileSidebarOpen(false); },
              })),
            },
          ]}
          avatarLabel={initials(user.name)}
          accountLabel="Coordinator"
          accountTitle={user.name}
          accountSubtitle={user.email}
          accountMeta={<div className="flex items-center gap-2 text-xs text-white/75"><span>{userComponent}</span></div>}
          onLogout={onLogout || (() => {})}
        />

        <main className="min-h-0 min-w-0 flex-1 overflow-auto">
          {!embedded && (
            <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button onClick={() => setMobileSidebarOpen(true)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white lg:hidden dark:border-slate-700 dark:bg-slate-950">
                    <Menu className="h-5 w-5" />
                  </button>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">Coordinator Portal — {userComponent}</p>
                    <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
                      {view === 'dashboard' ? 'Dashboard' : view === 'modules' ? 'Module Library' : view === 'facilitators' ? 'Facilitator Management' : 'Reports'}
                    </h2>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {onNavigate && (
                    <button onClick={() => onNavigate('announcements')} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-950">
                      <Bell className="h-4 w-4" />
                    </button>
                  )}
                  {onLogout && (
                    <button onClick={onLogout} className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                      Logout
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="p-5">
            {renderContent()}
          </div>
        </main>
      </div>

      {editorOpen && editingModule && (
        <div className="fixed inset-0 z-50 grid items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">{editingModule.id.startsWith('module-') ? 'Create' : 'Edit'} Module</p>
                <h3 className="text-xl font-semibold text-slate-950 dark:text-white">Module Details</h3>
              </div>
              <button onClick={() => { setEditorOpen(false); setEditingModule(null); }} className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-slate-500"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-1.5 md:col-span-2">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Title</span>
                <input value={editingModule.title} onChange={(e) => setEditingModule({ ...editingModule, title: e.target.value })} className="w-full rounded-xl border border-blue-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
              </label>
              <label className="block space-y-1.5 md:col-span-2">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Description</span>
                <textarea value={editingModule.description} onChange={(e) => setEditingModule({ ...editingModule, description: e.target.value })} rows={3} className="w-full rounded-xl border border-blue-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Hours</span>
                <input type="number" value={editingModule.hours} onChange={(e) => setEditingModule({ ...editingModule, hours: Number(e.target.value) })} className="w-full rounded-xl border border-blue-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Difficulty</span>
                <select value={editingModule.difficulty} onChange={(e) => setEditingModule({ ...editingModule, difficulty: e.target.value as any })} className="w-full rounded-xl border border-blue-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </label>
              <label className="block space-y-1.5 md:col-span-2">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Component</span>
                <select value={editingModule.component || userComponent} onChange={(e) => setEditingModule({ ...editingModule, component: e.target.value as any })} className="w-full rounded-xl border border-blue-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                  <option value="Common">Common</option>
                  {NSTP_COMPONENTS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => { setEditorOpen(false); setEditingModule(null); }} className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">Cancel</button>
              <button onClick={handleSaveModule} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800"><Save className="h-4 w-4" /> Save Module</button>
            </div>
          </div>
        </div>
      )}

      {facilitatorEditorOpen && editingFacilitator && (
        <div className="fixed inset-0 z-50 grid items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">{editingFacilitator.id.startsWith('facilitator-') ? 'Create' : 'Edit'} Facilitator</p>
                <h3 className="text-xl font-semibold text-slate-950 dark:text-white">Facilitator Details</h3>
              </div>
              <button onClick={() => { setFacilitatorEditorOpen(false); setEditingFacilitator(null); }} className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-slate-500"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Name</span>
                <input value={editingFacilitator.name} onChange={(e) => setEditingFacilitator({ ...editingFacilitator, name: e.target.value })} className="w-full rounded-xl border border-blue-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Email</span>
                <input value={editingFacilitator.email} onChange={(e) => setEditingFacilitator({ ...editingFacilitator, email: e.target.value })} className="w-full rounded-xl border border-blue-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Password</span>
                <input type="password" value={editingFacilitator.password} onChange={(e) => setEditingFacilitator({ ...editingFacilitator, password: e.target.value })} className="w-full rounded-xl border border-blue-200 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">NSTP Component</span>
                <input value={editingFacilitator.title || userComponent} disabled className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900" />
              </label>
              <div className="space-y-1.5 md:col-span-2">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Assigned Municipalities</span>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {BILIRAN_MUNICIPALITIES.map((item) => {
                    const selected = editingFacilitator.municipalities?.includes(item) || false;
                    return (
                      <label key={item} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold ${selected ? 'border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-500/40 dark:bg-blue-500/10' : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900'}`}>
                        <input type="checkbox" checked={selected} onChange={(e) => {
                          const current = editingFacilitator.municipalities || [];
                          setEditingFacilitator({ ...editingFacilitator, municipalities: e.target.checked ? [...current, item] : current.filter((m) => m !== item) });
                        }} className="h-4 w-4 rounded border-slate-300 text-blue-600" />
                        {item}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => { setFacilitatorEditorOpen(false); setEditingFacilitator(null); }} className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">Cancel</button>
              <button onClick={handleSaveFacilitator} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800"><Save className="h-4 w-4" /> Save Facilitator</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
