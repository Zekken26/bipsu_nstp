import { Download, FileSpreadsheet, FileText, Printer } from 'lucide-react';
import type { ExportFormat } from '../../utils/exportRecords';

type Props = {
  onExport: (format: ExportFormat) => void | Promise<void>;
  disabled?: boolean;
  busy?: boolean;
  compact?: boolean;
  label?: string;
};

const buttonClass = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-55 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-blue-500/10';

export default function ExportButtonGroup({ onExport, disabled = false, busy = false, compact = false, label = 'Export' }: Props) {
  const actions: Array<{ format: ExportFormat; label: string; icon: typeof Download }> = [
    { format: 'xlsx', label: compact ? 'Excel' : 'Excel', icon: FileSpreadsheet },
    { format: 'csv', label: 'CSV', icon: Download },
    { format: 'pdf', label: 'PDF', icon: FileText },
    { format: 'print', label: 'Print', icon: Printer },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!compact && <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{label}</span>}
      {actions.map(({ format, label: actionLabel, icon: Icon }) => (
        <button
          key={format}
          type="button"
          onClick={() => onExport(format)}
          disabled={disabled || busy}
          className={buttonClass}
          title={`${label} ${actionLabel}`}
        >
          <Icon className="h-4 w-4" />
          {actionLabel}
        </button>
      ))}
    </div>
  );
}
