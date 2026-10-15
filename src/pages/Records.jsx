import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Pencil, Trash2, Search, ArrowUpDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../utils/api';
import { useDataStore } from '../store/dataStore';
import RecordModal from '../components/RecordModal';
import { PageHeader, Card, Loading, Empty, Button, inputCls } from '../components/ui';
import { getModule, matchColumnFor } from '../config';

// Generic master-data CRUD (Clients, Branches) driven by app.config.json.
const Records = () => {
  const { key } = useParams();
  const mod = getModule(key);
  const loadMaster = useDataStore((s) => s.loadMaster);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState({ col: null, dir: 1 });
  const [modal, setModal] = useState(null);

  const reload = async () => {
    if (!mod) return;
    setLoading(true);
    try { setRows(await loadMaster(mod.sheet, true)); } catch (e) { toast.error(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { setQ(''); reload(); }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  const cols = mod ? [...(mod.autoId ? [mod.idColumn] : []), ...mod.fields.map((f) => f.key)] : [];
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    const r = rows.filter((row) => !s || cols.some((c) => String(row[c] || '').toLowerCase().includes(s)));
    if (!sort.col) return r;
    return [...r].sort((a, b) => String(a[sort.col] || '').localeCompare(String(b[sort.col] || ''), undefined, { numeric: true }) * sort.dir);
  }, [rows, q, sort]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!mod) return <Card><Empty text="Unknown page." /></Card>;
  const matchCol = matchColumnFor(mod);

  const save = async (form) => {
    if (modal.mode === 'edit') await api.saveMaster(mod.sheet, form, modal.initial[matchCol]);
    else await api.saveMaster(mod.sheet, form);
    toast.success('Saved');
    reload();
  };
  const del = async (row) => {
    if (!window.confirm(`Delete "${row[mod.fields[0].key] || row[matchCol]}"?`)) return;
    try { await api.deleteMaster(mod.sheet, row[matchCol]); toast.success('Deleted'); reload(); } catch (e) { toast.error(e.message); }
  };

  return (
    <div className="space-y-3 flex flex-col min-h-0 flex-1">
      <PageHeader icon={mod.icon} title={mod.label} subtitle={`${rows.length} record(s)`}>
        <div className="relative w-full sm:w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className={`${inputCls} pl-9 !py-2 text-sm`} />
        </div>
        <Button icon="Plus" onClick={() => setModal({ mode: 'add', initial: null })}>Add</Button>
      </PageHeader>
      <Card className="overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="overflow-auto flex-1">
          {loading ? <Loading /> : shown.length === 0 ? <Empty text="No records yet." /> : (
            <table className="w-full text-sm">
              <thead className="bg-indigo-50 sticky top-0">
                <tr>
                  {cols.map((c) => (
                    <th key={c} onClick={() => setSort((s) => ({ col: c, dir: s.col === c ? -s.dir : 1 }))} className="text-left font-bold text-indigo-700 px-4 py-3 whitespace-nowrap border-b border-indigo-200 cursor-pointer select-none">
                      <span className="inline-flex items-center gap-1">{c}<ArrowUpDown size={11} className={sort.col === c ? 'text-indigo-600' : 'text-indigo-300'} /></span>
                    </th>
                  ))}
                  <th className="border-b border-indigo-200" />
                </tr>
              </thead>
              <tbody>
                {shown.map((row) => (
                  <tr key={row[matchCol]} className="border-b border-gray-100 hover:bg-indigo-50/50">
                    {cols.map((c) => <td key={c} className="px-4 py-2.5 text-gray-700 whitespace-nowrap">{String(row[c] ?? '')}</td>)}
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      <button onClick={() => setModal({ mode: 'edit', initial: row })} className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-100"><Pencil size={16} /></button>
                      <button onClick={() => del(row)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
      {modal && <RecordModal mod={mod} mode={modal.mode} initial={modal.initial} onClose={() => setModal(null)} onSubmit={save} />}
    </div>
  );
};

export default Records;
