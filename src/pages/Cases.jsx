import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Trash2, ArrowUpDown, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDataStore } from '../store/dataStore';
import { useAuthStore } from '../store/authStore';
import { api } from '../utils/api';
import { PageHeader, Card, StatusBadge, Loading, Empty, Button, inputCls } from '../components/ui';
import { useCaseFilters, CaseFilterBar } from '../components/CaseFilters';
import { STATUS, STATUS_ORDER, fmtDateTime, fmtDuration, tatHours, isOverdue } from '../utils/format';
import { toCsv, downloadText } from '../utils/csv';

const PAGE = 50;

const Cases = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { cases, casesLoaded, casesLoading, loadCases, settings, loadSettings } = useDataStore();
  const { f, setF, options, filtered } = useCaseFilters(cases);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState({ col: 'Allocated At', dir: -1 });
  const [page, setPage] = useState(1);
  const limit = Number(settings?.tatHours) || 24;

  useEffect(() => {
    loadCases().catch((e) => toast.error(e.message));
    loadSettings().catch(() => {});
  }, [loadCases, loadSettings]);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    const r = filtered.filter((c) => (!status || (status === 'OVERDUE' ? isOverdue(c, limit) : c.Status === status))
      && (!s || ['Case No', 'Applicant Name', 'Applicant Mobile', 'Client', 'Branch', 'Executive Name'].some((k) => String(c[k] || '').toLowerCase().includes(s))));
    return r.sort((a, b) => {
      if (sort.col === 'TAT') return ((tatHours(a) || 0) - (tatHours(b) || 0)) * sort.dir;
      return String(a[sort.col] || '').localeCompare(String(b[sort.col] || '')) * sort.dir;
    });
  }, [filtered, status, q, sort, limit]);

  useEffect(() => setPage(1), [status, q, f]);

  const counts = useMemo(() => {
    const m = { OVERDUE: 0 };
    filtered.forEach((c) => { m[c.Status] = (m[c.Status] || 0) + 1; if (isOverdue(c, limit)) m.OVERDUE++; });
    return m;
  }, [filtered, limit]);

  const del = async (c) => {
    if (!window.confirm(`Delete case ${c['Case No']} (${c['Applicant Name']})? This cannot be undone.`)) return;
    try { await api.deleteCase(c['Case No']); toast.success('Case deleted'); loadCases(); } catch (e) { toast.error(e.message); }
  };

  const exportCsv = () => {
    const cols = ['Case No', 'Client', 'Branch', 'Product', 'Activity', 'Applicant Name', 'Applicant Mobile', 'Occupation', 'Verifications Required', 'Executive Name', 'Status', 'Allocated At', 'Submitted At', 'Reported At'];
    downloadText('cases.csv', toCsv(rows.map((c) => ({ ...c, 'Allocated At': fmtDateTime(c['Allocated At']), 'Submitted At': fmtDateTime(c['Submitted At']), 'Reported At': fmtDateTime(c['Reported At']) })), cols));
  };

  const Th = ({ col, children }) => (
    <th onClick={() => setSort((s) => ({ col, dir: s.col === col ? -s.dir : 1 }))}
      className="text-left font-bold text-indigo-700 px-3 py-3 whitespace-nowrap border-b border-indigo-200 cursor-pointer select-none hover:bg-indigo-100">
      <span className="inline-flex items-center gap-1">{children}<ArrowUpDown size={11} className={sort.col === col ? 'text-indigo-600' : 'text-indigo-300'} /></span>
    </th>
  );

  const shown = rows.slice((page - 1) * PAGE, page * PAGE);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));

  return (
    <div className="space-y-3 flex flex-col min-h-0 flex-1">
      <PageHeader icon="FolderKanban" title="All Cases" subtitle={`${rows.length} of ${cases.length} case(s)`}>
        <div className="relative w-full sm:w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, case no, mobile…" className={`${inputCls} pl-9 !py-2 text-sm`} />
        </div>
        <Button variant="secondary" icon="RefreshCw" loading={casesLoading} onClick={() => loadCases()}>Refresh</Button>
        <button onClick={exportCsv} title="Export CSV" className="p-2.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"><Download size={18} /></button>
        <Button icon="Plus" onClick={() => navigate('/allocate')}>Allocate</Button>
      </PageHeader>

      <Card className="p-3 space-y-3">
        <CaseFilterBar f={f} setF={setF} options={options} />
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          {[['', `All (${filtered.length})`], ...STATUS_ORDER.map((s) => [s, `${STATUS[s].label} (${counts[s] || 0})`]), ['OVERDUE', `Overdue (${counts.OVERDUE})`]].map(([k, l]) => (
            <button key={k} onClick={() => setStatus(k)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border ${status === k ? (k === 'OVERDUE' ? 'bg-red-600 text-white border-red-600' : 'bg-indigo-600 text-white border-indigo-600') : 'bg-white text-gray-600 border-gray-200'}`}>{l}</button>
          ))}
        </div>
      </Card>

      <Card className="overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="overflow-auto flex-1">
          {!casesLoaded && casesLoading ? <Loading /> : shown.length === 0 ? <Empty text="No cases match." /> : (
            <table className="w-full text-sm">
              <thead className="bg-indigo-50 sticky top-0 z-10">
                <tr>
                  <Th col="Case No">Case No</Th><Th col="Applicant Name">Applicant</Th><Th col="Client">Client / Branch</Th>
                  <Th col="Product">Product</Th><Th col="Executive Name">Executive</Th><Th col="Status">Status</Th>
                  <Th col="Allocated At">Allocated</Th><Th col="TAT">TAT</Th>
                  <th className="px-3 py-3 border-b border-indigo-200" />
                </tr>
              </thead>
              <tbody>
                {shown.map((c) => {
                  const od = isOverdue(c, limit);
                  return (
                    <tr key={c['Case No']} onClick={() => navigate(`/cases/${encodeURIComponent(c['Case No'])}`)}
                      className={`border-b border-gray-100 cursor-pointer transition-colors ${od ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-indigo-50/50'}`}>
                      <td className="px-3 py-2.5 font-semibold text-indigo-700 whitespace-nowrap">{c['Case No']}</td>
                      <td className="px-3 py-2.5 text-gray-900 whitespace-nowrap">{c['Applicant Name']}<div className="text-[11px] text-slate-500">{c['Applicant Mobile']}</div></td>
                      <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">{c.Client}<div className="text-[11px] text-slate-500">{c.Branch}</div></td>
                      <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">{c.Product}<div className="text-[11px] text-slate-500">{c.Activity}</div></td>
                      <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">{c['Executive Name']}</td>
                      <td className="px-3 py-2.5"><StatusBadge status={c.Status} /></td>
                      <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap text-xs">{fmtDateTime(c['Allocated At'])}</td>
                      <td className={`px-3 py-2.5 whitespace-nowrap text-xs font-bold ${od ? 'text-red-600' : 'text-gray-700'}`}>{fmtDuration(tatHours(c))}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                        {['APPROVED', 'REPORT_SENT'].includes(c.Status) && (
                          <button onClick={() => navigate(`/cases/${encodeURIComponent(c['Case No'])}/report`)} className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-100" title="Report"><FileText size={16} /></button>
                        )}
                        {user?.role === 'ADMIN' && (
                          <button onClick={() => del(c)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50" title="Delete"><Trash2 size={16} /></button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-2 border-t border-indigo-100 text-xs text-slate-500">
            <span>Page {page} of {pages}</span>
            <div className="flex gap-1">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1 rounded border border-gray-200 disabled:opacity-40">Prev</button>
              <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="px-3 py-1 rounded border border-gray-200 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Cases;
