import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Navigation, MapPin, ChevronRight, RefreshCw, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDataStore } from '../store/dataStore';
import { PageHeader, Card, StatusBadge, Loading, Empty, Button } from '../components/ui';
import { fmtDateTime, fmtDuration, tatHours, DONE_STATUSES } from '../utils/format';

const OPEN = ['ALLOCATED', 'IN_FIELD', 'SENT_BACK'];

const MyCases = () => {
  const navigate = useNavigate();
  const { cases, casesLoaded, casesLoading, loadCases } = useDataStore();
  const [tab, setTab] = useState('open');

  useEffect(() => { loadCases().catch((e) => toast.error(e.message)); }, [loadCases]);

  const list = useMemo(() => {
    const f = cases.filter((c) => (tab === 'open' ? OPEN.includes(c.Status) : !OPEN.includes(c.Status)));
    // Sent-back first, then oldest allocation first.
    return f.sort((a, b) => (a.Status === 'SENT_BACK' ? -1 : 0) - (b.Status === 'SENT_BACK' ? -1 : 0)
      || String(a['Allocated At']).localeCompare(String(b['Allocated At'])));
  }, [cases, tab]);

  const openCount = cases.filter((c) => OPEN.includes(c.Status)).length;

  return (
    <div className="space-y-3">
      <PageHeader icon="ClipboardList" title="My Cases" subtitle={`${openCount} open case(s) assigned to you`}>
        <Button variant="secondary" icon="RefreshCw" loading={casesLoading} onClick={() => loadCases()}>Refresh</Button>
      </PageHeader>

      <div className="flex gap-2">
        {[['open', 'To Do'], ['done', 'Submitted / Done']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-semibold border ${tab === k ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200'}`}>
            {l}
          </button>
        ))}
      </div>

      {!casesLoaded && casesLoading ? <Loading /> : list.length === 0 ? (
        <Card><Empty icon="CheckCircle2" text={tab === 'open' ? 'No pending cases. 🎉' : 'Nothing here yet.'} /></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {list.map((c) => {
            const addr = String(c['Applicant Address'] || '');
            const hrs = tatHours(c);
            return (
              <Card key={c['Case No']} className={`p-4 space-y-3 ${c.Status === 'SENT_BACK' ? 'border-rose-300' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-indigo-600">{c['Case No']}</p>
                    <h3 className="text-base font-bold text-gray-900 truncate">{c['Applicant Name']}</h3>
                    <p className="text-xs text-slate-500">{c.Product} · {c.Activity} · {c.Client}{c.Branch ? ` / ${c.Branch}` : ''}</p>
                  </div>
                  <StatusBadge status={c.Status} />
                </div>
                <p className="text-sm text-gray-700 flex gap-1.5"><MapPin size={16} className="shrink-0 mt-0.5 text-slate-400" />{addr}</p>
                <p className="text-xs text-slate-500">Verify: <b className="text-gray-700">{c['Verifications Required']}</b></p>
                {c.Status === 'SENT_BACK' && c['Reviewer Note'] && (
                  <p className="text-xs bg-rose-50 border border-rose-200 text-rose-800 rounded-lg p-2 flex gap-1.5">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" /> {c['Reviewer Note']}
                  </p>
                )}
                <p className="text-[11px] text-slate-500">
                  Allocated {fmtDateTime(c['Allocated At'])}
                  {!DONE_STATUSES.includes(c.Status) && <> · <span className={hrs > 24 ? 'text-red-600 font-bold' : ''}>{fmtDuration(hrs)} ago</span></>}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <a href={`tel:${c['Applicant Mobile']}`} className="py-2.5 rounded-lg border border-gray-200 text-gray-700 text-sm font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-gray-50">
                    <Phone size={16} /> Call
                  </a>
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr)}`} target="_blank" rel="noreferrer"
                    className="py-2.5 rounded-lg border border-gray-200 text-gray-700 text-sm font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-gray-50">
                    <Navigation size={16} /> Map
                  </a>
                  <button onClick={() => navigate(`/field/${encodeURIComponent(c['Case No'])}`)}
                    className="py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold inline-flex items-center justify-center gap-1 hover:bg-indigo-700">
                    {OPEN.includes(c.Status) ? 'Open' : 'View'} <ChevronRight size={16} />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      {casesLoading && casesLoaded && <p className="text-center text-xs text-slate-400 inline-flex items-center gap-1 w-full justify-center"><RefreshCw size={12} className="animate-spin" /> Refreshing…</p>}
    </div>
  );
};

export default MyCases;
