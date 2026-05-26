import { ExternalLink, FileText, Link2, PlayCircle, ShieldAlert } from 'lucide-react';
import type { LearningMaterial } from '../../data/learningMaterials';
import { embeddedMaterialUrl, validatedMaterialUrl } from '../../utils/learningMaterialLinks';
import { StatusBadge } from '../../features/facilitator/components/FacilitatorUI';

export default function LearningMaterialViewer({ material, viewed, onMarkViewed }: { material: LearningMaterial; viewed?: boolean; onMarkViewed?: (id: string) => void }) {
  const external = validatedMaterialUrl(material.url);
  const embedUrl = embeddedMaterialUrl(material.url, material.category);
  const Icon = material.category.includes('Video') ? PlayCircle : material.category.includes('Document') || material.category.includes('PDF') ? FileText : Link2;

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="border-b border-slate-100 p-5 dark:border-slate-800">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300"><Icon className="h-4 w-4" /> {material.category}</p>
            <h2 className="mt-2 text-xl font-bold text-slate-950 dark:text-white">{material.title}</h2>
          </div>
          <div className="flex flex-wrap gap-2"><StatusBadge value={material.audience} /><StatusBadge value={viewed ? 'Viewed' : material.visibility} /></div>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{material.description}</p>
      </div>
      <div className="bg-slate-950">
        {embedUrl ? (
          <iframe
            title={`${material.title} preview`}
            src={embedUrl}
            className="aspect-video w-full"
            allow={material.category.includes('Video') ? 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture' : undefined}
            allowFullScreen={material.category.includes('Video')}
            referrerPolicy="strict-origin-when-cross-origin"
            loading="lazy"
            sandbox={material.category.includes('Video') ? 'allow-scripts allow-same-origin allow-presentation' : 'allow-scripts allow-same-origin allow-popups'}
          />
        ) : (
          <div className="grid min-h-[260px] place-items-center p-8 text-center text-white">
            <div>
              <ShieldAlert className="mx-auto h-10 w-10 text-amber-300" />
              <p className="mt-4 font-semibold">Embedded preview is not available for this resource.</p>
              <p className="mt-2 text-sm text-slate-300">Use the verified external link to access the educational material.</p>
            </div>
          </div>
        )}
      </div>
      <div className="space-y-4 p-5">
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <p><span className="block text-xs font-semibold uppercase text-slate-400">Facilitator / Speaker</span>{material.speaker || material.facilitatorName}</p>
          <p><span className="block text-xs font-semibold uppercase text-slate-400">Session Date</span>{material.sessionDate || 'Not session-specific'}</p>
          <p><span className="block text-xs font-semibold uppercase text-slate-400">Related Activity</span>{material.relatedActivity || 'No linked output'}</p>
          <p><span className="block text-xs font-semibold uppercase text-slate-400">Tags</span>{material.tags.length ? material.tags.join(', ') : 'No tags'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {external ? <a href={external.toString()} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-blue-200 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50 dark:border-blue-500/30 dark:text-blue-200"><ExternalLink className="h-4 w-4" /> Open externally</a> : <StatusBadge value="Broken link" />}
          {onMarkViewed ? <button type="button" onClick={() => onMarkViewed(material.id)} className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white">{viewed ? 'Mark reviewed again' : 'Mark as viewed'}</button> : null}
        </div>
      </div>
    </article>
  );
}
