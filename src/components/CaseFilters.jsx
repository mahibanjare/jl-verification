import React, { useMemo, useState } from 'react';
import { inputCls } from './ui';
import { toDate } from '../utils/format';

const uniq = (arr) => [...new Set(arr.filter(Boolean))].sort();

// Filters shared by Dashboard and All Cases: client, branch, executive, date range.
export const useCaseFilters = (cases) => {
  const [f, setF] = useState({ client: '', branch: '', exec: '', from: '', to: '' });
  const options = useMemo(() => ({
    clients: uniq(cases.map((c) => c.Client)),
    branches: uniq(cases.filter((c) => !f.client || c.Client === f.client).map((c) => c.Branch)),
    execs: uniq(cases.map((c) => c['Executive Name'])),
  }), [cases, f.client]);

  const filtered = useMemo(() => cases.filter((c) => {
    if (f.client && c.Client !== f.client) return false;
    if (f.branch && c.Branch !== f.branch) return false;
    if (f.exec && c['Executive Name'] !== f.exec) return false;
    const d = toDate(c['Allocated At']);
    if (f.from && d && d < new Date(`${f.from}T00:00:00+05:30`)) return false;
    if (f.to && d && d > new Date(`${f.to}T23:59:59+05:30`)) return false;
    return true;
  }), [cases, f]);

  return { f, setF, options, filtered };
};

export const CaseFilterBar = ({ f, setF, options }) => {
  const set = (k, v) => setF((x) => ({ ...x, [k]: v, ...(k === 'client' ? { branch: '' } : {}) }));
  const sel = `${inputCls} !py-2 text-sm`;
  const active = Object.values(f).some(Boolean);
  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-2 items-end">
      <select className={sel} value={f.client} onChange={(e) => set('client', e.target.value)}>
        <option value="">All clients</option>{options.clients.map((x) => <option key={x}>{x}</option>)}
      </select>
      <select className={sel} value={f.branch} onChange={(e) => set('branch', e.target.value)}>
        <option value="">All branches</option>{options.branches.map((x) => <option key={x}>{x}</option>)}
      </select>
      <select className={sel} value={f.exec} onChange={(e) => set('exec', e.target.value)}>
        <option value="">All executives</option>{options.execs.map((x) => <option key={x}>{x}</option>)}
      </select>
      <input type="date" className={sel} value={f.from} onChange={(e) => set('from', e.target.value)} title="Allocated from" />
      <input type="date" className={sel} value={f.to} onChange={(e) => set('to', e.target.value)} title="Allocated to" />
      <button type="button" disabled={!active} onClick={() => setF({ client: '', branch: '', exec: '', from: '', to: '' })}
        className="py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40">Clear filters</button>
    </div>
  );
};
