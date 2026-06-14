import { useMemo, useState } from 'react';
import { Archive, Pencil, Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import LearningMaterialViewer from '../../../components/learning-materials/LearningMaterialViewer';
import { loadAllLearningMaterials, saveAllLearningMaterials, type LearningMaterial, type MaterialAudience, type MaterialCategory, type MaterialVisibility } from '../../../data/learningMaterials';
import { addAudit } from '../../../data/workflowData';
import { detectLinkType, validatedMaterialUrl } from '../../../utils/learningMaterialLinks';
import { ConfirmDialog, EmptyState, Panel, SearchField, StatusBadge } from '../../facilitator/components/FacilitatorUI';

const admin = { id: 'admin-1', name: 'Administrator', role: 'admin' };
const CATEGORIES: MaterialCategory[] = ['YouTube Video', 'Google Drive Video', 'Google Drive Document', 'PDF / Document', 'Web Resource'];
const AUDIENCES: MaterialAudience[] = ['Common Phase', 'CWTS', 'CWTS-Coastguard', 'LTS', 'MTS'];

const blank = (): LearningMaterial => ({
  id: '',
  facilitatorId: admin.id,
  facilitatorName: admin.name,
  title: '',
  description: '',
  url: '',
  category: 'Web Resource',
  audience: 'Common Phase',
  visibility: 'Draft',
  sessionDate: '',
  speaker: admin.name,
  relatedActivity: '',
  tags: [],
  createdAt: '',
  updatedAt: '',
});

export default function AdminLearningMaterialsPanel() {
  const [materials, setMaterials] = useState<LearningMaterial[]>(loadAllLearningMaterials);
  const [form, setForm] = useState<LearningMaterial>(blank);
  const [tags, setTags] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [audience, setAudience] = useState('all');
  const [category, setCategory] = useState('all');
  const [visibility, setVisibility] = useState('all');
  const [pending, setPending] = useState<{ action: 'delete' | 'archive'; material: LearningMaterial } | null>(null);

  const filtered = useMemo(() => materials.filter((material) => (
    (audience === 'all' || material.audience === audience) &&
    (category === 'all' || material.category === category) &&
    (visibility === 'all' || material.visibility === visibility) &&
    (!search.trim() || `${material.title} ${material.facilitatorName} ${material.tags.join(' ')}`.toLowerCase().includes(search.trim().toLowerCase()))
  )), [materials, audience, category, visibility, search]);
  const selected = materials.find((material) => material.id === selectedId) || filtered[0];

  const edit = (material: LearningMaterial) => {
    setForm(material);
    setTags(material.tags.join(', '));
    setSelectedId(material.id);
  };

  const persist = (next: LearningMaterial[], message: string) => {
    saveAllLearningMaterials(next);
    setMaterials(next);
    toast.success(message);
  };

  const save = () => {
    const url = validatedMaterialUrl(form.url);
    if (!form.title.trim() || !form.description.trim() || !url) {
      toast.error('Title, description, and a valid material URL are required.');
      return;
    }
    const now = new Date().toISOString();
    const record: LearningMaterial = {
      ...form,
      id: form.id || `admin-material-${Date.now()}`,
      title: form.title.trim(),
      description: form.description.trim(),
      url: url.toString(),
      tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      facilitatorId: form.id ? form.facilitatorId : admin.id,
      facilitatorName: form.id ? form.facilitatorName : admin.name,
      createdAt: form.createdAt || now,
      updatedAt: now,
      overriddenBy: form.id && form.facilitatorId !== admin.id ? admin.name : form.overriddenBy,
      archivedAt: form.visibility === 'Archived' ? form.archivedAt || now : undefined,
    };
    const next = form.id ? materials.map((material) => material.id === form.id ? record : material) : [record, ...materials];
    persist(next, form.id ? 'Learning material override saved.' : 'Admin learning material created.');
    addAudit(admin, form.id ? 'Learning material overridden' : 'Learning material created', 'Learning Material', record.id, `${record.audience} / ${record.visibility}`);
    setSelectedId(record.id);
    setForm(blank());
    setTags('');
  };

  const updateVisibility = (material: LearningMaterial, nextVisibility: MaterialVisibility) => {
    const next = materials.map((item) => item.id === material.id ? { ...item, visibility: nextVisibility, updatedAt: new Date().toISOString(), archivedAt: nextVisibility === 'Archived' ? new Date().toISOString() : undefined, overriddenBy: admin.name } : item);
    persist(next, `Material set to ${nextVisibility.toLowerCase()}.`);
    addAudit(admin, `Learning material ${nextVisibility.toLowerCase()}`, 'Learning Material', material.id, material.title);
  };

  const confirm = () => {
    if (!pending) return;
    if (pending.action === 'delete') {
      persist(materials.filter((material) => material.id !== pending.material.id), 'Learning material deleted.');
      addAudit(admin, 'Learning material deleted', 'Learning Material', pending.material.id, pending.material.title);
    } else {
      updateVisibility(pending.material, 'Archived');
    }
    setPending(null);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5 dark:border-blue-500/20 dark:bg-blue-500/10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">Learning Material Governance</p>
        <h3 className="mt-2 text-xl font-bold">Published Link Library</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Review all facilitator links, correct outdated URLs, reassign audiences, and control publication visibility.</p>
      </div>
      <div className="grid gap-5 2xl:grid-cols-[390px_minmax(360px,0.9fr)_minmax(440px,1.1fr)]">
        <Panel className="h-fit">
          <div className="flex items-center justify-between"><h3 className="font-bold">{form.id ? 'Override Material' : 'Add Admin Material'}</h3><button type="button" onClick={() => { setForm(blank()); setTags(''); }} className="rounded-lg border border-blue-200 p-2 text-blue-700" aria-label="New admin material"><Plus className="h-4 w-4" /></button></div>
          <div className="mt-4 space-y-3 text-sm font-semibold">
            <label className="block">Title<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="mt-1 block w-full rounded-xl border px-3 py-2.5 font-normal dark:border-slate-700 dark:bg-slate-900" /></label>
            <label className="block">Link / URL<input type="url" value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} placeholder="https://..." className="mt-1 block w-full rounded-xl border px-3 py-2.5 font-normal dark:border-slate-700 dark:bg-slate-900" /></label>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <label className="block">Link type<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as MaterialCategory })} className="mt-1 block w-full rounded-xl border px-3 py-2.5 font-normal dark:border-slate-700 dark:bg-slate-900">{CATEGORIES.map((value) => <option key={value}>{value}</option>)}</select></label>
              <button type="button" onClick={() => setForm({ ...form, category: detectLinkType(form.url) })} className="self-end rounded-xl border border-blue-200 px-3 py-2.5 text-xs text-blue-700">Detect</button>
            </div>
            <label className="block">Description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={3} className="mt-1 block w-full rounded-xl border px-3 py-2.5 font-normal dark:border-slate-700 dark:bg-slate-900" /></label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block">Audience<select value={form.audience} onChange={(event) => setForm({ ...form, audience: event.target.value as MaterialAudience })} className="mt-1 block w-full rounded-xl border px-2 py-2.5 font-normal dark:border-slate-700 dark:bg-slate-900">{AUDIENCES.map((value) => <option key={value}>{value}</option>)}</select></label>
              <label className="block">Visibility<select value={form.visibility} onChange={(event) => setForm({ ...form, visibility: event.target.value as MaterialVisibility })} className="mt-1 block w-full rounded-xl border px-2 py-2.5 font-normal dark:border-slate-700 dark:bg-slate-900">{['Draft', 'Published', 'Archived'].map((value) => <option key={value}>{value}</option>)}</select></label>
              <label className="block">Session date<input type="date" value={form.sessionDate} onChange={(event) => setForm({ ...form, sessionDate: event.target.value })} className="mt-1 block w-full rounded-xl border px-2 py-2.5 font-normal dark:border-slate-700 dark:bg-slate-900" /></label>
              <label className="block">Speaker<input value={form.speaker} onChange={(event) => setForm({ ...form, speaker: event.target.value })} className="mt-1 block w-full rounded-xl border px-2 py-2.5 font-normal dark:border-slate-700 dark:bg-slate-900" /></label>
            </div>
            <label className="block">Related activity<input value={form.relatedActivity} onChange={(event) => setForm({ ...form, relatedActivity: event.target.value })} className="mt-1 block w-full rounded-xl border px-3 py-2.5 font-normal dark:border-slate-700 dark:bg-slate-900" /></label>
            <label className="block">Tags<input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="seminar, reference" className="mt-1 block w-full rounded-xl border px-3 py-2.5 font-normal dark:border-slate-700 dark:bg-slate-900" /></label>
            <button type="button" onClick={save} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-white"><Save className="h-4 w-4" /> Save override</button>
          </div>
        </Panel>
        <Panel className="h-fit">
          <h3 className="font-bold">All Materials</h3>
          <div className="mt-3 space-y-2">
            <SearchField value={search} onChange={setSearch} placeholder="Search title, tag, facilitator" />
            <div className="grid gap-2">
              <select value={audience} onChange={(event) => setAudience(event.target.value)} className="rounded-xl border px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"><option value="all">All audiences</option>{AUDIENCES.map((value) => <option key={value}>{value}</option>)}</select>
              <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-xl border px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"><option value="all">All link types</option>{CATEGORIES.map((value) => <option key={value}>{value}</option>)}</select>
              <select value={visibility} onChange={(event) => setVisibility(event.target.value)} className="rounded-xl border px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"><option value="all">All states</option>{['Draft', 'Published', 'Archived'].map((value) => <option key={value}>{value}</option>)}</select>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {filtered.length ? filtered.map((material) => (
              <article key={material.id} className={`rounded-xl border p-3 ${selected?.id === material.id ? 'border-blue-300 bg-blue-50 dark:bg-blue-500/10' : 'border-slate-200 dark:border-slate-800'}`}>
                <button type="button" onClick={() => setSelectedId(material.id)} className="w-full text-left">
                  <div className="flex justify-between gap-2"><p className="font-semibold">{material.title}</p><StatusBadge value={material.visibility} /></div>
                  <p className="mt-1 text-xs text-slate-500">{material.facilitatorName} / {material.audience}</p>
                </button>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => edit(material)} aria-label={`Override ${material.title}`} className="rounded-lg border border-blue-200 p-2 text-blue-700"><Pencil className="h-4 w-4" /></button>
                  {material.visibility !== 'Published' ? <button type="button" onClick={() => updateVisibility(material, 'Published')} className="rounded-lg border border-emerald-200 px-2 text-xs font-semibold text-emerald-700">Publish</button> : <button type="button" onClick={() => updateVisibility(material, 'Draft')} className="rounded-lg border border-amber-200 px-2 text-xs font-semibold text-amber-700">Unpublish</button>}
                  {material.visibility !== 'Archived' ? <button type="button" onClick={() => setPending({ action: 'archive', material })} aria-label={`Archive ${material.title}`} className="rounded-lg border border-amber-200 p-2 text-amber-700"><Archive className="h-4 w-4" /></button> : null}
                  <button type="button" onClick={() => setPending({ action: 'delete', material })} aria-label={`Delete ${material.title}`} className="rounded-lg border border-rose-200 p-2 text-rose-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              </article>
            )) : <EmptyState title="No material links" body="No materials match the selected admin filters." />}
          </div>
        </Panel>
        {selected ? <LearningMaterialViewer material={selected} /> : <Panel><EmptyState title="No resource selected" body="Select a resource to inspect its portal preview and details." /></Panel>}
      </div>
      <ConfirmDialog open={Boolean(pending)} title={pending?.action === 'archive' ? 'Archive learning material?' : 'Delete learning material?'} body={pending?.action === 'archive' ? 'This keeps the resource in admin records but removes it from student publication.' : 'This permanently removes the learning material link for all portal users.'} confirmLabel={pending?.action === 'archive' ? 'Archive' : 'Delete'} onCancel={() => setPending(null)} onConfirm={confirm} />
    </div>
  );
}
