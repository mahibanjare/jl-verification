// Date / number / status helpers. All display is IST, DD/MM/YYYY, 12-hour.
const TZ = 'Asia/Kolkata';

export const toDate = (v) => {
  if (!v) return null;
  if (v instanceof Date) return isNaN(v) ? null : v;
  const s = String(v).trim();
  // dd/MM/yyyy [hh:mm[:ss] [AM|PM]]
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ ,]+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?)?$/i);
  if (m) {
    let h = Number(m[4] || 0);
    if (m[7]) { const pm = m[7].toUpperCase() === 'PM'; if (pm && h < 12) h += 12; if (!pm && h === 12) h = 0; }
    // Interpret as IST wall-clock.
    const iso = `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}T${String(h).padStart(2, '0')}:${m[5] || '00'}:${m[6] || '00'}+05:30`;
    const d = new Date(iso);
    return isNaN(d) ? null : d;
  }
  const d = new Date(s);
  return isNaN(d) ? null : d;
};

const dFmt = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric' });
const tFmt = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit', hour12: true });

export const fmtDate = (v) => { const d = toDate(v); return d ? dFmt.format(d) : ''; };
export const fmtTime = (v) => { const d = toDate(v); return d ? tFmt.format(d) : ''; };
export const fmtDateTime = (v) => { const d = toDate(v); return d ? `${dFmt.format(d)} ${tFmt.format(d)}` : ''; };

export const fmtMoney = (n) => {
  const x = Number(n);
  if (n === '' || n == null || isNaN(x)) return '';
  return `Rs. ${x.toLocaleString('en-IN')}/-`;
};

export const hoursBetween = (a, b = new Date()) => {
  const da = toDate(a); const db = toDate(b);
  if (!da || !db) return null;
  return (db - da) / 36e5;
};

export const fmtDuration = (hours) => {
  if (hours == null || isNaN(hours)) return '—';
  const h = Math.max(0, hours);
  if (h < 1) return `${Math.round(h * 60)}m`;
  if (h < 48) return `${Math.floor(h)}h ${Math.round((h % 1) * 60)}m`;
  return `${Math.floor(h / 24)}d ${Math.floor(h % 24)}h`;
};

export const DONE_STATUSES = ['APPROVED', 'REPORT_SENT'];

export const STATUS = {
  ALLOCATED: { label: 'Allocated', cls: 'bg-slate-100 text-slate-700 border-slate-200' },
  IN_FIELD: { label: 'In Field', cls: 'bg-amber-100 text-amber-800 border-amber-200' },
  SUBMITTED: { label: 'Submitted', cls: 'bg-blue-100 text-blue-800 border-blue-200' },
  UNDER_REVIEW: { label: 'Under Review', cls: 'bg-violet-100 text-violet-800 border-violet-200' },
  SENT_BACK: { label: 'Sent Back', cls: 'bg-rose-100 text-rose-800 border-rose-200' },
  APPROVED: { label: 'Approved', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  REPORT_SENT: { label: 'Report Sent', cls: 'bg-teal-100 text-teal-800 border-teal-200' },
};
export const STATUS_ORDER = Object.keys(STATUS);

// TAT = allocation -> report (or -> now while still open).
export const tatHours = (c) => hoursBetween(c['Allocated At'], c['Reported At'] || new Date());
export const isOverdue = (c, limitHours = 24) =>
  !DONE_STATUSES.includes(c.Status) && (tatHours(c) ?? 0) > limitHours;

export const maskAccount = (s) => {
  const t = String(s || '');
  return t.length > 4 ? `XXXX${t.slice(-4)}` : t;
};

export const safeFileName = (s) => String(s || '').replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '');
