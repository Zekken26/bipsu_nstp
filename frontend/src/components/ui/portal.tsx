import type { ReactNode } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';

type PortalCardProps = {
  children: ReactNode;
  className?: string;
};

type PortalStatCardProps = {
  title: string;
  value: ReactNode;
  description?: string;
  icon?: ReactNode;
  status?: string;
  tone?: 'blue' | 'gold' | 'green' | 'red' | 'slate';
  className?: string;
  children?: ReactNode;
};

const toneClass: Record<NonNullable<PortalStatCardProps['tone']>, string> = {
  blue: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/25 dark:bg-blue-500/10 dark:text-blue-200',
  gold: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200',
  green: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-200',
  red: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200',
  slate: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200',
};

export function PortalCard({ children, className = '' }: PortalCardProps) {
  return <section className={`portal-card ${className}`}>{children}</section>;
}

export function PortalSectionHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="portal-section-header">
      <div>
        {eyebrow ? <p className="portal-eyebrow">{eyebrow}</p> : null}
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className="portal-section-actions">{actions}</div> : null}
    </div>
  );
}

export function PortalStatCard({ title, value, description, icon, status, tone = 'blue', className = '', children }: PortalStatCardProps) {
  return (
    <article className={`portal-stat-card ${className}`}>
      <div className="portal-stat-topline">
        <div>
          <p className="portal-stat-title">{title}</p>
          <p className="portal-stat-value">{value}</p>
        </div>
        {icon ? <span className={`portal-stat-icon ${toneClass[tone]}`}>{icon}</span> : null}
      </div>
      {description ? <p className="portal-stat-description">{description}</p> : null}
      {children}
      {status ? <span className={`portal-badge ${toneClass[tone]}`}>{status}</span> : null}
    </article>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="portal-empty-state">
      <AlertCircle className="h-5 w-5" />
      <p className="font-semibold">{title}</p>
      {description ? <p className="text-sm">{description}</p> : null}
    </div>
  );
}

export function LoadingState({ label = 'Loading records...' }: { label?: string }) {
  return (
    <div className="portal-loading-state">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>{label}</span>
    </div>
  );
}
