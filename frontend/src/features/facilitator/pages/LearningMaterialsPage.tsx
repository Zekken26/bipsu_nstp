import { useMemo, useState } from 'react';
import { Archive, Eye, Link2, Pencil, Plus, Save, Trash2 } from 'lucide-react';
import LearningMaterialViewer from '../../../components/learning-materials/LearningMaterialViewer';
import { type LearningMaterial, type MaterialAudience, type MaterialCategory, type MaterialVisibility } from '../../../data/learningMaterials';
import { addAudit } from '../../../data/workflowData';
import { detectLinkType, validatedMaterialUrl } from '../../../utils/learningMaterialLinks';
import type { FacilitatorWorkspace } from '../hooks/useFacilitatorWorkspace';
import { ConfirmDialog, EmptyState, PageIntro, Panel, SearchField, StatusBadge } from '../components/FacilitatorUI';

const CATEGORIES: MaterialCategory[] = ['YouTube Video', 'Google Drive Video', 'Google Drive Document', 'PDF / Document', 'Web Resource'];
const AUDIENCES: MaterialAudience[] = ['Common Phase', 'CWTS', 'LTS', 'MTS'];
const VISIBILITY: MaterialVisibility[] = ['Draft', 'Published'];

const blank = (workspace: FacilitatorWorkspace): LearningMaterial => ({
  id: '',
  facilitatorId: workspace.user.id,
  facilitatorName: workspace.user.name,
  title: '',
  description: '',
  url: '',
  category: 'Web Resource',
  audience: 'Common Phase',
  visibility: 'Draft',
  sessionDate: '',
  speaker: workspace.user.name,
  relatedActivity: '',
  tags: [],
  createdAt: '',
  updatedAt: '',
});

export default function LearningMaterialsPage({ workspace, notify }: { workspace: FacilitatorWorkspace; notify: (message: string) => void }) {
  const [form, setForm] = useState<LearningMaterial>(() => blank(workspace));
  const [tags, setTags] = useState('');
  const [search, setSearch] = useState('');
  const [audienceFilter, setAudienceFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [visibilityFilter, setVisibilityFilter] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewDraft, setPreviewDraft] = useState<LearningMaterial | null>(null);
  const [pendingAction, setPendingAction] = useState<{ type: 'delete' | 'archive'; id: string } | null>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return workspace.materials.filter((material) => (
      (audienceFilter === 'all' || material.audience === audienceFilter) &&
      (typeFilter === 'all' || material.category === typeFilter) &&
      (visibilityFilter === 'all' || material.visibility === visibilityFilter) &&
      (!query || `${material.title} ${material.description} ${material.facilitatorName} ${material.tags.join(' ')}`.toLowerCase().includes(query))
    ));
  }, [workspace.materials, search, audienceFilter, typeFilter, visibilityFilter]);
  const selected = previewDraft || workspace.materials.find((material) => material.id === selectedId) || filtered[0];

  const edit = (material: LearningMaterial) => {
    setForm(material);
    setTags(material.tags.join(', '));
    setSelectedId(material.id);
    setPreviewDraft(null);
  };

  const createNew = () => {
    setForm(blank(workspace));
    setTags('');
    setPreviewDraft(null);
  };

  const save = () => {
    const url = validatedMaterialUrl(form.url);
    if (!form.title.trim() || !form.description.trim() || !form.url.trim() || !form.category || !form.audience || !form.visibility) {
      notify('Title, URL, category, description, audience, and visibility are required.');
      return;
    }
    if (!url) {
      notify('Enter a valid http or https educational resource link.');
      return;
    }
    const now = new Date().toISOString();
    const nextMaterial: LearningMaterial = {
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      url: url.toString(),
      tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      id: form.id || `material-${Date.now()}`,
      createdAt: form.createdAt || now,
      updatedAt: now,
      archivedAt: undefined,
    };
    const next = form.id
      ? workspace.materials.map((material) => material.id === form.id ? nextMaterial : material)
      : [nextMaterial, ...workspace.materials];
    workspace.setMaterials(next);
    workspace.recordActivity(form.id ? 'Learning material updated' : 'Learning material link added', nextMaterial.title);
    addAudit(workspace.user, form.id ? 'Learning material updated' : 'Learning material created', 'Learning Material', nextMaterial.id, `${nextMaterial.audience} / ${nextMaterial.visibility}`);
    setSelectedId(nextMaterial.id);
    setPreviewDraft(null);
    setForm(blank(workspace));
    setTags('');
    notify(`Learning material ${form.id ? 'updated' : 'saved'} successfully.`);
  };

  const preview = () => {
    if (!validatedMaterialUrl(form.url) || !form.title.trim()) {
      notify('Add a valid title and URL before previewing.');
      return;
    }
    setPreviewDraft({ ...form, tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean), facilitatorName: workspace.user.name });
  };

  const confirmAction = () => {
    if (!pendingAction) return;
    const material = workspace.materials.find((item) => item.id === pendingAction.id);
    if (!material) return;
    if (pendingAction.type === 'delete') {
      workspace.setMaterials(workspace.materials.filter((item) => item.id !== material.id));
      workspace.recordActivity('Learning material deleted', material.title);
      addAudit(workspace.user, 'Learning material deleted', 'Learning Material', material.id, material.title);
      notify('Learning material link deleted.');
    } else {
      const archived = { ...material, visibility: 'Archived' as const, archivedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      workspace.setMaterials(workspace.materials.map((item) => item.id === material.id ? archived : item));
      workspace.recordActivity('Learning material archived', material.title);
      addAudit(workspace.user, 'Learning material archived', 'Learning Material', material.id, material.title);
      notify('Learning material archived and hidden from students.');
    }
    if (selectedId === material.id) setSelectedId(null);
    setPendingAction(null);
  };

  return (
    <>
      <PageIntro
        eyebrow="Link-Based Learning Resources"
        title="Learning Materials"
        description="Publish secure external learning links for Common Phase or component learners, with built-in previews for supported video and document services."
        actions={<button type="button" onClick={createNew} className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 dark:border-blue-500/30 dark:bg-slate-950 dark:text-blue-200"><Plus className="h-4 w-4" /> New link</button>}
      />
      <div className="grid gap-5 2xl:grid-cols-[400px_minmax(360px,1fr)_minmax(440px,1.25fr)]">
        <Panel className="h-fit">
          <h2 className="text-lg font-bold text-slate-950 dark:text-white">{form.id ? 'Edit Link Material' : 'Add Link Material'}</h2>
          <p className="mt-1 text-xs text-slate-500">Direct uploads are not used here. Provide a verified educational resource URL.</p>
          <div className="mt-5 space-y-3">
            <label className="block text-sm font-semibold">Title<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Disaster preparedness seminar recording" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal dark:border-slate-700 dark:bg-slate-900" /></label>
            <label className="block text-sm font-semibold">Link / URL<input type="url" value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} placeholder="https://youtube.com/watch?v=..." className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal dark:border-slate-700 dark:bg-slate-900" /></label>
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <label className="block text-sm font-semibold">Category / type<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as MaterialCategory })} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal dark:border-slate-700 dark:bg-slate-900">{CATEGORIES.map((value) => <option key={value}>{value}</option>)}</select></label>
              <button type="button" onClick={() => setForm({ ...form, category: detectLinkType(form.url) })} className="self-end rounded-xl border border-blue-200 px-3 py-2.5 text-xs font-semibold text-blue-700">Detect</button>
            </div>
            <label className="block text-sm font-semibold">Description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={3} placeholder="Learning objective and access instructions" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal dark:border-slate-700 dark:bg-slate-900" /></label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-semibold">Assigned phase / component<select value={form.audience} onChange={(event) => setForm({ ...form, audience: event.target.value as MaterialAudience })} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal dark:border-slate-700 dark:bg-slate-900">{AUDIENCES.map((value) => <option key={value}>{value}</option>)}</select></label>
              <label className="block text-sm font-semibold">Visibility<select value={form.visibility} onChange={(event) => setForm({ ...form, visibility: event.target.value as MaterialVisibility })} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal dark:border-slate-700 dark:bg-slate-900">{VISIBILITY.map((value) => <option key={value}>{value}</option>)}</select></label>
              <label className="block text-sm font-semibold">Session date<input type="date" value={form.sessionDate} onChange={(event) => setForm({ ...form, sessionDate: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal dark:border-slate-700 dark:bg-slate-900" /></label>
              <label className="block text-sm font-semibold">Speaker / facilitator<input value={form.speaker} onChange={(event) => setForm({ ...form, speaker: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal dark:border-slate-700 dark:bg-slate-900" /></label>
            </div>
            <label className="block text-sm font-semibold">Related assessment / activity<input value={form.relatedActivity} onChange={(event) => setForm({ ...form, relatedActivity: event.target.value })} placeholder="Reflection output or assessment" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal dark:border-slate-700 dark:bg-slate-900" /></label>
            <label className="block text-sm font-semibold">Tags<input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="orientation, DRRM, video" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal dark:border-slate-700 dark:bg-slate-900" /></label>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={preview} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-blue-200 px-3 py-3 text-sm font-semibold text-blue-700"><Eye className="h-4 w-4" /> Preview</button>
              <button type="button" onClick={save} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-700 px-3 py-3 text-sm font-semibold text-white"><Save className="h-4 w-4" /> Save</button>
            </div>
          </div>
        </Panel>
        <Panel className="h-fit">
          <h2 className="text-lg font-bold">Material Playlist</h2>
          <div className="mt-4 space-y-2">
            <SearchField value={search} onChange={setSearch} placeholder="Search title, tag, or facilitator" />
            <div className="grid gap-2 sm:grid-cols-3 2xl:grid-cols-1">
              <select value={audienceFilter} onChange={(event) => setAudienceFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"><option value="all">All phases</option>{AUDIENCES.map((value) => <option key={value}>{value}</option>)}</select>
              <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"><option value="all">All link types</option>{CATEGORIES.map((value) => <option key={value}>{value}</option>)}</select>
              <select value={visibilityFilter} onChange={(event) => setVisibilityFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"><option value="all">Any visibility</option>{['Draft', 'Published', 'Archived'].map((value) => <option key={value}>{value}</option>)}</select>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {filtered.length ? filtered.map((material) => (
              <article key={material.id} className={`rounded-xl border p-3 ${selected?.id === material.id ? 'border-blue-300 bg-blue-50 dark:bg-blue-500/10' : 'border-slate-200 dark:border-slate-800'}`}>
                <button type="button" onClick={() => { setSelectedId(material.id); setPreviewDraft(null); }} className="w-full text-left">
                  <div className="flex items-start justify-between gap-2"><p className="font-semibold">{material.title}</p><StatusBadge value={material.visibility} /></div>
                  <p className="mt-1 text-xs text-slate-500">{material.category} / {material.audience}</p>
                </button>
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={() => edit(material)} aria-label={`Edit ${material.title}`} className="rounded-lg border border-blue-200 p-2 text-blue-700"><Pencil className="h-4 w-4" /></button>
                  {material.visibility !== 'Archived' ? <button type="button" onClick={() => setPendingAction({ type: 'archive', id: material.id })} aria-label={`Archive ${material.title}`} className="rounded-lg border border-amber-200 p-2 text-amber-700"><Archive className="h-4 w-4" /></button> : null}
                  <button type="button" onClick={() => setPendingAction({ type: 'delete', id: material.id })} aria-label={`Delete ${material.title}`} className="rounded-lg border border-rose-200 p-2 text-rose-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              </article>
            )) : <EmptyState title="No material links found" body="Try another filter or add the first link-based learning resource." />}
          </div>
        </Panel>
        <div>
          {selected ? <LearningMaterialViewer material={selected} /> : <Panel><EmptyState title="No material selected" body="Select a saved link or preview a draft to see the student-facing embedded viewer." /></Panel>}
        </div>
      </div>
      <ConfirmDialog
        open={Boolean(pendingAction)}
        title={pendingAction?.type === 'archive' ? 'Archive learning material?' : 'Delete learning material?'}
        body={pendingAction?.type === 'archive' ? 'Archived materials remain in your library but are hidden from students.' : 'This permanently removes the material link from your facilitator library.'}
        confirmLabel={pendingAction?.type === 'archive' ? 'Archive' : 'Delete'}
        onCancel={() => setPendingAction(null)}
        onConfirm={confirmAction}
      />
    </>
  );
}
