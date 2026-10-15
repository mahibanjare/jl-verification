import React, { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../utils/api';
import { PageHeader, Card, Loading, Empty, Button, inputCls } from '../components/ui';
import { fmtDateTime } from '../utils/format';

// Every login, create, edit, submit, approve, send-back and report
// generation is written to the Audit sheet by the backend.
const Audit = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');

  const load = async () => {
    setLoading(true);
    try { setRows((await api.listAudit()).rows || []); } catch (e) { toast.error(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter((r) => !s || Object.values(r).some((v) => String(v).toLowerCase().includes(s)));
  }, [rows, q]);

  return (
    <div className="space-y-3 flex flex-col min-h-0 flex-1">
      <PageHeader icon="History" title="Audit Log" subtitle="Latest 500 actions (full history in the Audit sheet)">
        <div className="relative w-full sm:w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter…" className={`${inputCls} pl-9 !py-2 text-sm`} />
        </div>
        <Button variant="secondary" icon="RefreshCw" loading={loading} onClick={load}>Refresh</Button>
      </PageHeader>
      <Card className="overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="overflow-auto flex-1">
          {loading && !rows.length ? <Loading /> : shown.length === 0 ? <Empty text="No entries." /> : (
            <table className="w-full text-sm">
              <thead className="bg-indigo-50 sticky top-0">
                <tr>{['When', 'User', 'Action', 'Case No', 'Details'].map((h) => <th key={h} className="text-left font-bold text-indigo-700 px-4 py-3 whitespace-nowrap">{h}</th>)}</tr>
              </thead>
              <tbody>
                {shown.map((r, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="px-4 py-2 text-xs text-gray-600 whitespace-nowrap">{fmtDateTime(r.Timestamp)}</td>
                    <td className="px-4 py-2 text-gray-700 whitespace-nowrap">{r['User ID']}</td>
                    <td className="px-4 py-2 font-semibold text-gray-900 whitespace-nowrap">{r.Action}</td>
                    <td className="px-4 py-2 text-indigo-700 whitespace-nowrap">{r['Case No']}</td>
                    <td className="px-4 py-2 text-xs text-gray-600">{r.Details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Audit;
