import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search, Plus, Check, X } from 'lucide-react';
import { inputCls } from './ui';

// Searchable, grouped dropdown. groups = [{ label, items: [{ value, label, sub }] }].
// Optional footer action (e.g. "+ नया Client जोड़ें") via addLabel + onAdd(query).
const SearchSelect = ({ value, onChange, groups, placeholder = 'Select…', searchPlaceholder = 'Search…', addLabel, onAdd, disabled, emptyText = 'No match' }) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const box = useRef(null);
  const search = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('touchstart', onDoc);
    setTimeout(() => search.current?.focus(), 0);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('touchstart', onDoc); };
  }, [open]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return groups
      .map((g) => ({ ...g, items: g.items.filter((it) => !s || `${it.label} ${it.sub || ''}`.toLowerCase().includes(s)) }))
      .filter((g) => g.items.length);
  }, [groups, q]);

  const pick = (v) => { onChange(v); setOpen(false); setQ(''); };
  const first = filtered[0]?.items[0];

  const onKey = (e) => {
    if (e.key === 'Escape') setOpen(false);
    if (e.key === 'Enter') { e.preventDefault(); if (first) pick(first.value); else if (onAdd && q.trim()) { setOpen(false); onAdd(q.trim()); } }
  };

  return (
    <div className="relative" ref={box}>
      <button type="button" disabled={disabled} onClick={() => setOpen((o) => !o)}
        className={`${inputCls} flex items-center justify-between gap-2 text-left disabled:opacity-60 disabled:cursor-not-allowed`}>
        <span className={`truncate ${value ? 'text-gray-900' : 'text-gray-400'}`}>{value || placeholder}</span>
        <span className="flex items-center gap-1 shrink-0">
          {value && !disabled && (
            <span role="button" tabIndex={-1} title="Clear" onClick={(e) => { e.stopPropagation(); onChange(''); }} className="p-0.5 rounded text-gray-400 hover:text-gray-600"><X size={14} /></span>
          )}
          <ChevronDown size={16} className="text-gray-400" />
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-indigo-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100 relative">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input ref={search} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey}
              placeholder={searchPlaceholder} className={`${inputCls} !py-2 pl-8 text-sm`} />
          </div>
          <div className="max-h-72 overflow-y-auto py-1">
            {filtered.length === 0 && <p className="px-3 py-3 text-sm text-slate-400">{emptyText}</p>}
            {filtered.map((g) => (
              <div key={g.label}>
                <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-indigo-500">{g.label}</p>
                {g.items.map((it) => (
                  <button type="button" key={`${g.label}:${it.value}`} onClick={() => pick(it.value)}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2 hover:bg-indigo-50 ${it.value === value ? 'text-indigo-700 font-semibold' : 'text-gray-700'}`}>
                    <span className="truncate">{it.label}{it.sub && <span className="text-xs text-slate-400"> · {it.sub}</span>}</span>
                    {it.value === value && <Check size={14} className="shrink-0" />}
                  </button>
                ))}
              </div>
            ))}
          </div>
          {onAdd && (
            <button type="button" onClick={() => { setOpen(false); onAdd(q.trim()); setQ(''); }}
              className="w-full px-3 py-2.5 text-sm font-semibold text-indigo-600 border-t border-gray-100 hover:bg-indigo-50 flex items-center gap-1.5">
              <Plus size={15} /> {addLabel}{q.trim() ? `: "${q.trim()}"` : ''}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchSelect;
