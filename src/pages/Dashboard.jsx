import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import toast from 'react-hot-toast';
import { useDataStore } from '../store/dataStore';
import { useCaseFilters, CaseFilterBar } from '../components/CaseFilters';
import { PageHeader, Card, StatusBadge, Icon, Button, Empty } from '../components/ui';
import { CHART_COLORS, THEME_PRIMARY } from '../config';
import { STATUS, STATUS_ORDER, DONE_STATUSES, fmtDate, fmtDuration, tatHours, isOverdue, toDate } from '../utils/format';

const Stat = ({ icon, label, value, color, onClick, danger }) => (
  <Card className={`p-4 flex items-center gap-3 ${onClick ? 'cursor-pointer hover:shadow-md' : ''} ${danger ? 'border-red-300 bg-red-50' : ''}`} onClick={onClick}>
    <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: color }}>
      <Icon name={icon} size={22} className="text-white" />
    </div>
    <div>
      <p className={`text-2xl font-bold leading-none ${danger ? 'text-red-600' : 'text-gray-900'}`}>{value}</p>
      <p className="text-xs font-medium text-slate-500 mt-1">{label}</p>
    </div>
  </Card>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { cases, casesLoading, loadCases, settings, loadSettings } = useDataStore();
  const { f, setF, options, filtered } = useCaseFilters(cases);
  const limit = Number(settings?.tatHours) || 24;

  useEffect(() => {
    loadCases().catch((e) => toast.error(e.message));
    loadSettings().catch(() => {});
  }, [loadCases, loadSettings]);

  const by = (s) => filtered.filter((c) => s.includes(c.Status)).length;
  const overdue = useMemo(() => filtered.filter((c) => isOverdue(c, limit)).sort((a, b) => tatHours(b) - tatHours(a)), [filtered, limit]);

  const statusPie = useMemo(() => STATUS_ORDER.map((s) => ({ name: STATUS[s].label, value: filtered.filter((c) => c.Status === s).length })).filter((x) => x.value), [filtered]);

  const trend = useMemo(() => {
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 864e5);
      days.push({ key: fmtDate(d), name: fmtDate(d).slice(0, 5), allocated: 0, reported: 0 });
    }
    const idx = Object.fromEntries(days.map((d, i) => [d.key, i]));
    filtered.forEach((c) => {
      const a = fmtDate(c['Allocated At']); if (a in idx) days[idx[a]].allocated++;
      const r = fmtDate(c['Reported At']); if (r in idx) days[idx[r]].reported++;
    });
    return days;
  }, [filtered]);

  const execTat = useMemo(() => {
    const m = {};
    filtered.forEach((c) => {
      const name = c['Executive Name'] || '—';
      m[name] = m[name] || { name, open: 0, done: 0, tatSum: 0 };
      if (DONE_STATUSES.includes(c.Status) && c['Reported At']) { m[name].done++; m[name].tatSum += tatHours(c) || 0; } else m[name].open++;
    });
    return Object.values(m).map((x) => ({ ...x, avgTat: x.done ? Math.round((x.tatSum / x.done) * 10) / 10 : 0 }));
  }, [filtered]);

  const done = filtered.filter((c) => DONE_STATUSES.includes(c.Status) && c['Reported At']);
  const avgTat = done.length ? done.reduce((s, c) => s + (tatHours(c) || 0), 0) / done.length : null;
  const today = fmtDate(new Date());
  const allocatedToday = filtered.filter((c) => fmtDate(c['Allocated At']) === today).length;

  return (
    <div className="space-y-3">
      <PageHeader icon="LayoutDashboard" title="Dashboard" subtitle={`TAT limit ${limit}h · cases older than this are red`}>
        <Button variant="secondary" icon="RefreshCw" loading={casesLoading} onClick={() => loadCases()}>Refresh</Button>
        <Button icon="Plus" onClick={() => navigate('/allocate')}>Allocate</Button>
      </PageHeader>

      <Card className="p-3"><CaseFilterBar f={f} setF={setF} options={options} /></Card>

      <div className="grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-6 gap-3">
        <Stat icon="Inbox" label="Total cases" value={filtered.length} color={CHART_COLORS[0]} onClick={() => navigate('/cases')} />
        <Stat icon="CalendarPlus" label="Allocated today" value={allocatedToday} color={CHART_COLORS[1]} />
        <Stat icon="Footprints" label="Pending in field" value={by(['ALLOCATED', 'IN_FIELD', 'SENT_BACK'])} color="#f59e0b" />
        <Stat icon="FileSearch" label="Awaiting review" value={by(['SUBMITTED', 'UNDER_REVIEW'])} color="#8b5cf6" />
        <Stat icon="CheckCircle2" label="Approved / Sent" value={by(DONE_STATUSES)} color="#10b981" />
        <Stat icon="AlarmClock" label={`Overdue (> ${limit}h)`} value={overdue.length} color="#ef4444" danger={overdue.length > 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card className="p-4 lg:col-span-2">
          <h2 className="text-sm font-bold text-gray-900 mb-3">Allocated vs Reported (last 14 days)</h2>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <LineChart data={trend} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="allocated" name="Allocated" stroke={THEME_PRIMARY} strokeWidth={2} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="reported" name="Reported" stroke="#10b981" strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-4">
          <h2 className="text-sm font-bold text-gray-900 mb-1">Cases by status</h2>
          <p className="text-xs text-slate-500 mb-2">Average TAT (completed): <b>{fmtDuration(avgTat)}</b></p>
          {statusPie.length === 0 ? <Empty text="No cases yet." /> : (
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={statusPie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={80}>
                    {statusPie.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card className="p-4">
          <h2 className="text-sm font-bold text-gray-900 mb-3">Executive workload &amp; avg TAT (hours)</h2>
          {execTat.length === 0 ? <Empty text="No data." /> : (
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer>
                <BarChart data={execTat} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="open" name="Open" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="done" name="Done" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="avgTat" name="Avg TAT (h)" fill={THEME_PRIMARY} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="p-4 flex flex-col">
          <h2 className="text-sm font-bold text-red-600 mb-3">Overdue cases ({overdue.length})</h2>
          {overdue.length === 0 ? <Empty icon="PartyPopper" text="Nothing overdue." /> : (
            <div className="overflow-auto max-h-64">
              <table className="w-full text-sm">
                <tbody>
                  {overdue.slice(0, 50).map((c) => (
                    <tr key={c['Case No']} onClick={() => navigate(`/cases/${encodeURIComponent(c['Case No'])}`)} className="border-b border-red-100 hover:bg-red-50 cursor-pointer">
                      <td className="py-2 pr-2"><p className="font-semibold text-gray-900">{c['Applicant Name']}</p><p className="text-[11px] text-slate-500">{c['Case No']} · {c['Executive Name']}</p></td>
                      <td className="py-2 pr-2"><StatusBadge status={c.Status} /></td>
                      <td className="py-2 text-right text-red-600 font-bold text-xs whitespace-nowrap">{fmtDuration(tatHours(c))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {overdue.length > 0 && <p className="text-[11px] text-slate-500 mt-2">Oldest allocated {fmtDate(toDate(overdue[0]['Allocated At']))}</p>}
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
