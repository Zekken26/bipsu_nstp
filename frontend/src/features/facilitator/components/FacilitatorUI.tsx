import { useEffect, useId } from 'react';
import type { ReactNode } from 'react';
import { AlertTriangle, Building2, ChevronLeft, ChevronRight, Inbox, Search, X } from 'lucide-react';
import type { BiliranMunicipality } from '../../../data/nstpData';

const modalEscapeStack: string[] = [];

export function useModalEscape({
  open,
  onClose,
  confirmClose,
}: {
  open: boolean;
  onClose: () => void;
  confirmClose?: () => boolean;
}) {
  const id = useId();

  useEffect(() => {
    if (!open) return undefined;
    modalEscapeStack.push(id);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (modalEscapeStack[modalEscapeStack.length - 1] !== id) return;
      event.preventDefault();
      event.stopPropagation();
      if (confirmClose && !confirmClose()) return;
      onClose();
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      const index = modalEscapeStack.lastIndexOf(id);
      if (index >= 0) modalEscapeStack.splice(index, 1);
      document.removeEventListener('keydown', onKeyDown, true);
    };
  }, [confirmClose, id, onClose, open]);
}

export function PageIntro({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-[#e3eaf4] bg-white p-4 shadow-[0_16px_42px_-32px_rgba(15,39,78,0.48)] dark:border-slate-800 dark:bg-slate-950 sm:flex-row sm:items-end sm:justify-between md:p-5">
      <span className="absolute bottom-0 left-0 top-0 w-1 bg-gradient-to-b from-blue-700 to-[#e5b73b]" />
      <div className="pl-2">
        <p className="text-[0.67rem] font-bold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">{eyebrow}</p>
        <h1 className="mt-1.5 text-xl font-bold tracking-tight text-[#112342] dark:text-white md:text-[1.55rem]">{title}</h1>
        <p className="mt-1.5 max-w-3xl text-[0.8rem] leading-5 text-slate-600 dark:text-slate-300">{description}</p>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}

export function MunicipalityScopeBanner({
  label = 'Municipality Context',
  activeMunicipality,
  assignedMunicipalities,
  onMunicipalityChange,
  recordCount,
  helper = 'Records, exports, and saves are constrained to this facilitator scope.',
}: {
  label?: string;
  activeMunicipality: BiliranMunicipality | 'All Assigned';
  assignedMunicipalities: BiliranMunicipality[];
  onMunicipalityChange?: (value: BiliranMunicipality | 'All Assigned') => void;
  recordCount?: number;
  helper?: string;
}) {
  const canSwitch = Boolean(onMunicipalityChange && assignedMunicipalities.length > 1);
  const activeText = activeMunicipality === 'All Assigned'
    ? `All assigned municipalities (${assignedMunicipalities.join(', ') || 'Scope pending'})`
    : activeMunicipality;

  return (
    <section className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-amber-50/70 p-3.5 shadow-[0_14px_32px_-28px_rgba(15,39,78,0.5)] dark:border-blue-500/20 dark:from-blue-500/10 dark:via-slate-950 dark:to-amber-500/10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-blue-700 shadow-sm ring-1 ring-blue-100 dark:bg-slate-900 dark:text-blue-200 dark:ring-blue-500/20">
            <Building2 className="h-4.5 w-4.5" />
          </span>
          <div className="min-w-0">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-300">{label}</p>
            <h2 className="mt-0.5 truncate text-sm font-bold text-[#112342] dark:text-white">Viewing Students From: {activeText}</h2>
            <p className="mt-0.5 text-[0.72rem] leading-4 text-slate-600 dark:text-slate-300">{helper}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {typeof recordCount === 'number' ? (
            <span className="rounded-full bg-white px-3 py-1 text-[0.7rem] font-bold text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700">
              {recordCount} scoped record{recordCount === 1 ? '' : 's'}
            </span>
          ) : null}
          {canSwitch ? (
            <select
              aria-label="Select assigned municipality scope"
              value={activeMunicipality}
              onChange={(event) => onMunicipalityChange?.(event.target.value as BiliranMunicipality | 'All Assigned')}
              className="h-9 rounded-lg border border-blue-200 bg-white px-3 text-[0.78rem] font-semibold text-blue-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-blue-500/30 dark:bg-slate-900 dark:text-blue-100"
            >
              <option value="All Assigned">All assigned</option>
              {assignedMunicipalities.map((municipality) => <option key={municipality} value={municipality}>{municipality}</option>)}
            </select>
          ) : (
            <span className="rounded-full bg-blue-700 px-3 py-1.5 text-[0.7rem] font-bold text-white shadow-sm">
              Municipality: {assignedMunicipalities[0] || activeMunicipality}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

export function StatCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = 'blue',
  progress,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: any;
  tone?: 'blue' | 'emerald' | 'amber' | 'indigo' | 'rose' | 'slate';
  progress?: number;
}) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200',
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200',
    indigo: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-200',
    rose: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-200',
    slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  };
  const bars = {
    blue: 'bg-blue-600',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    indigo: 'bg-indigo-600',
    rose: 'bg-rose-500',
    slate: 'bg-slate-500',
  };
  const accents = {
    blue: 'before:bg-blue-600',
    emerald: 'before:bg-emerald-500',
    amber: 'before:bg-amber-500',
    indigo: 'before:bg-indigo-600',
    rose: 'before:bg-rose-500',
    slate: 'before:bg-slate-500',
  };
  return (
    <article className={`group relative flex h-full min-h-[8.75rem] flex-col overflow-hidden rounded-xl border border-[#dfe7f2] bg-white p-3.5 shadow-[0_12px_30px_-25px_rgba(15,39,78,0.5)] before:absolute before:inset-x-0 before:top-0 before:h-1 transition duration-200 hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-[0_20px_38px_-25px_rgba(15,39,78,0.42)] dark:border-slate-800 dark:bg-slate-950 ${accents[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div className={`grid h-9 w-9 place-items-center rounded-xl ${tones[tone]}`}>
          <Icon className="h-4.5 w-4.5" />
        </div>
        {typeof progress === 'number' ? (
          <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[0.68rem] font-semibold text-slate-500 dark:bg-slate-900 dark:text-slate-400">
            {Math.max(0, Math.min(100, progress))}%
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-0.5 text-2xl font-bold tracking-tight text-[#112342] dark:text-white">{value}</p>
      <p className="mt-0.5 text-[0.7rem] text-slate-500 dark:text-slate-400">{detail}</p>
      {typeof progress === 'number' ? (
        <div className="mt-auto pt-2.5">
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div className={`h-full rounded-full ${bars[tone]}`} style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
          </div>
        </div>
      ) : null}
    </article>
  );
}

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-[#e3eaf4] bg-white p-4 shadow-[0_16px_36px_-32px_rgba(15,39,78,0.5)] dark:border-slate-800 dark:bg-slate-950 ${className}`}>{children}</section>;
}

const badgeTone = (value: string) => {
  const normalized = value.toLowerCase();
  if (['active', 'present', 'published', 'complete', 'released', 'passed'].some((status) => normalized.includes(status))) {
    return 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-500/30';
  }
  if (['in progress', 'scheduled', 'today'].some((status) => normalized.includes(status))) {
    return 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-200 dark:ring-blue-500/30';
  }
  if (['pending', 'late', 'draft', 'normal', 'needs review'].some((status) => normalized.includes(status))) {
    return 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/30';
  }
  if (['absent', 'failed', 'for completion', 'high', 'missing'].some((status) => normalized.includes(status))) {
    return 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-200 dark:ring-rose-500/30';
  }
  return 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700';
};

export function StatusBadge({ value }: { value: string }) {
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[0.65rem] font-bold capitalize ring-1 ring-inset ${badgeTone(value)}`}>{value}</span>;
}

export function SearchField({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <label className="relative min-w-0 flex-1">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-10 !min-h-10 w-full rounded-lg border border-[#dfe7f1] bg-[#fbfcfe] pl-10 pr-3 text-[0.8rem] outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:focus:ring-blue-500/20"
      />
    </label>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-5 py-8 text-center dark:border-slate-700 dark:bg-slate-900/40">
      <Inbox className="mb-2 h-7 w-7 text-slate-400" />
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</p>
      <p className="mt-1 max-w-sm text-[0.78rem] text-slate-500 dark:text-slate-400">{body}</p>
    </div>
  );
}

export function Pager({
  page,
  totalPages,
  onPage,
  total,
  pageSize,
  onPageSize,
  pageSizeOptions = [10, 25, 50, 100],
}: {
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
  total: number;
  pageSize?: number;
  onPageSize?: (size: number) => void;
  pageSizeOptions?: number[];
}) {
  const first = total ? ((page - 1) * (pageSize || total)) + 1 : 0;
  const last = total ? Math.min(total, page * (pageSize || total)) : 0;
  return (
    <div className="mt-3 flex flex-col gap-2.5 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2.5">
        <span>Showing {first}-{last} of {total} record{total === 1 ? '' : 's'}</span>
        {pageSize && onPageSize ? (
          <label className="inline-flex items-center gap-2">
            Show
            <select value={pageSize} onChange={(event) => onPageSize(Number(event.target.value))} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              {pageSizeOptions.map((size) => <option key={size} value={size}>{size}</option>)}
            </select>
          </label>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <button type="button" disabled={page === 1} onClick={() => onPage(page - 1)} className="rounded-lg border border-slate-200 bg-white p-1.5 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span>{page} / {Math.max(totalPages, 1)}</span>
        <button type="button" disabled={page >= totalPages} onClick={() => onPage(page + 1)} className="rounded-lg border border-slate-200 bg-white p-1.5 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = 'Delete',
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useModalEscape({ open, onClose: onCancel });

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-start justify-between gap-4">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-200">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <button type="button" onClick={onCancel} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>
        <h2 className="mt-3.5 text-base font-bold text-slate-950 dark:text-white">{title}</h2>
        <p className="mt-1.5 text-[0.8rem] leading-5 text-slate-600 dark:text-slate-300">{body}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="min-h-10 rounded-lg border border-slate-200 px-3.5 py-2 text-[0.78rem] font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">Cancel</button>
          <button type="button" onClick={onConfirm} className="min-h-10 rounded-lg bg-rose-600 px-3.5 py-2 text-[0.78rem] font-semibold text-white hover:bg-rose-700">{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
