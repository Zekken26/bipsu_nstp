import { useState, useRef, useEffect } from 'react';
import { searchBarangays, type Barangay } from '../services/api';

interface BarangaySearchProps {
  municipalityCode: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
}

export default function BarangaySearch({ municipalityCode, value, onChange, required, disabled }: BarangaySearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<Barangay[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!municipalityCode || !query || query.length < 1) {
      setResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const res = await searchBarangays(municipalityCode, query);
      if (res.success) {
        setResults(res.data);
      }
      setLoading(false);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, municipalityCode]);

  const handleSelect = (barangay: Barangay) => {
    onChange(barangay.name);
    setQuery(barangay.name);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <label className="block">
        <span className="mb-2 flex items-center gap-1 text-sm font-bold text-slate-700 dark:text-slate-200">
          Barangay {required && <span className="text-rose-600 dark:text-rose-300">*</span>}
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (!e.target.value) onChange('');
          }}
          onFocus={() => { if (query) setOpen(true); }}
          placeholder="Type to search barangay..."
          required={required}
          disabled={disabled || !municipalityCode}
          className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:disabled:bg-slate-950"
        />
      </label>
      {open && municipalityCode && (
        <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-blue-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
          {loading && (
            <div className="px-4 py-3 text-sm text-slate-500">Searching...</div>
          )}
          {!loading && results.length === 0 && query.length >= 1 && (
            <div className="px-4 py-3 text-sm text-slate-500">No barangay found. You can continue typing.</div>
          )}
          {!loading && results.map((b) => (
            <button
              key={b.code}
              type="button"
              onMouseDown={() => handleSelect(b)}
              className="w-full px-4 py-2 text-left text-sm font-medium text-slate-700 hover:bg-blue-50 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {b.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
