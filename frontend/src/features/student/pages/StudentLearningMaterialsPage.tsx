import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Film, Search } from 'lucide-react';
import { toast } from 'sonner';
import LearningMaterialViewer from '../../../components/learning-materials/LearningMaterialViewer';
import { publishedMaterialsForStudent, type LearningMaterial } from '../../../data/learningMaterials';
import type { NstpAccount } from '../../../data/nstpData';
import { EmptyState, PageIntro, Panel, StatusBadge } from '../../facilitator/components/FacilitatorUI';

type CategoryFilter = 'All' | 'YouTube' | 'Google Drive' | 'Documents' | 'Resources';

export default function StudentLearningMaterialsPage({ user, studentId }: { user: NstpAccount; studentId: string }) {
  const [materials, setMaterials] = useState<LearningMaterial[]>(() => publishedMaterialsForStudent(user));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('All');
  const viewedKey = `nstp-material-views-${studentId}`;
  const [viewed, setViewed] = useState<string[]>(() => JSON.parse(localStorage.getItem(viewedKey) || '[]') as string[]);

  useEffect(() => {
    const refresh = () => setMaterials(publishedMaterialsForStudent(user));
    window.addEventListener('nstp-learning-materials-updated', refresh);
    return () => window.removeEventListener('nstp-learning-materials-updated', refresh);
  }, [user]);

  const filtered = useMemo(() => materials.filter((material) => {
    const query = search.toLowerCase().trim();
    const matchesSearch = !query || `${material.title} ${material.description} ${material.facilitatorName} ${material.tags.join(' ')}`.toLowerCase().includes(query);
    const matchesCategory = category === 'All' ||
      (category === 'YouTube' && material.category === 'YouTube Video') ||
      (category === 'Google Drive' && material.category.startsWith('Google Drive')) ||
      (category === 'Documents' && (material.category.includes('Document') || material.category.includes('PDF'))) ||
      (category === 'Resources' && material.category === 'Web Resource');
    return matchesSearch && matchesCategory;
  }), [materials, search, category]);
  const selected = filtered.find((material) => material.id === selectedId) || filtered[0];

  const markViewed = (id: string) => {
    const next = viewed.includes(id) ? viewed : [...viewed, id];
    setViewed(next);
    localStorage.setItem(viewedKey, JSON.stringify(next));
    // TODO(API): persist learner material completion once a learning-progress endpoint is available.
    toast.success('Material marked as viewed.');
  };

  return (
    <>
      <PageIntro eyebrow="Learning Resources" title="Learning Materials" description="Watch videos and preview reference documents assigned to your NSTP phase without leaving the portal when supported." />
      <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <Panel className="h-fit">
          <div className="flex items-center justify-between gap-2">
            <h2 className="inline-flex items-center gap-2 text-lg font-bold"><BookOpen className="h-5 w-5 text-blue-700" /> Playlist</h2>
            <StatusBadge value={`${materials.length} published`} />
          </div>
          <label className="relative mt-4 block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search materials or tags" className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm dark:border-slate-700 dark:bg-slate-900" />
          </label>
          <select value={category} onChange={(event) => setCategory(event.target.value as CategoryFilter)} className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900">
            {['All', 'YouTube', 'Google Drive', 'Documents', 'Resources'].map((value) => <option key={value}>{value}</option>)}
          </select>
          <div className="mt-4 space-y-3">
            {filtered.length ? filtered.map((material) => (
              <button type="button" key={material.id} onClick={() => setSelectedId(material.id)} className={`w-full rounded-xl border p-3 text-left transition ${selected?.id === material.id ? 'border-blue-300 bg-blue-50 dark:bg-blue-500/10' : 'border-slate-200 hover:border-blue-200 dark:border-slate-800'}`}>
                <div className="flex justify-between gap-2"><p className="font-semibold">{material.title}</p>{viewed.includes(material.id) ? <StatusBadge value="Viewed" /> : null}</div>
                <p className="mt-2 inline-flex items-center gap-1 text-xs text-slate-500"><Film className="h-3.5 w-3.5" /> {material.category} / {material.audience}</p>
              </button>
            )) : <EmptyState title="No published resources" body="No learning links are currently published for your phase and selected filter." />}
          </div>
        </Panel>
        {selected ? <LearningMaterialViewer material={selected} viewed={viewed.includes(selected.id)} onMarkViewed={markViewed} /> : <Panel><EmptyState title="No material selected" body="Published videos and document links assigned to your phase will appear here." /></Panel>}
      </div>
    </>
  );
}
