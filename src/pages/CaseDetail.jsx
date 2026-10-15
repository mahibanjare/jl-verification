import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, CheckCircle2, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../utils/api';
import { useAuthStore } from '../store/authStore';
import { useDataStore } from '../store/dataStore';
import SectionForm from '../components/SectionForm';
import CaseMetaForm from '../components/CaseMetaForm';
import { PhotoCapture } from '../components/Photos';
import { Card, Loading, StatusBadge, Button, Modal, Empty, inputCls } from '../components/ui';
import { SECTIONS, PHOTO_SECTIONS, requiredSectionKeys, cleanSection, defaultsFor, displayValue } from '../lib/sections';
import { validateCase } from '../lib/validation';
import { generateComments } from '../lib/comments';
import { fmtDateTime, fmtDuration, tatHours, hoursBetween, maskAccount } from '../utils/format';

const LOCKED = ['REPORT_SENT'];

const CaseDetail = () => {
  const { caseNo } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const loadCases = useDataStore((s) => s.loadCases);
  const [c, setC] = useState(null);
  const [data, setData] = useState({});
  const [photos, setPhotos] = useState([]);
  const [final, setFinal] = useState({});
  const [tab, setTab] = useState('overview');
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState('');
  const [editMeta, setEditMeta] = useState(false);
  const [sendBackOpen, setSendBackOpen] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const res = await api.getCase(caseNo);
      const cs = res.case;
      const d = {};
      ['visit', ...requiredSectionKeys(cs)].forEach((k) => { d[k] = cs.data?.[k] ?? defaultsFor(k); });
      setData(d);
      setPhotos(cs.photos || []);
      setFinal(cs.comments?.final || {});
      setC(cs);
      setDirty(false);
    } catch (err) {
      setError(err.message);
    }
  };
  useEffect(() => { load(); }, [caseNo]); // eslint-disable-line react-hooks/exhaustive-deps

  const req = c ? requiredSectionKeys(c) : [];
  const cleaned = useMemo(() => Object.fromEntries(Object.entries(data).map(([k, v]) => [k, cleanSection(k, v)])), [data]);
  const generated = useMemo(() => (c ? generateComments(c, cleaned) : {}), [c, cleaned]);
  const result = useMemo(() => (c ? validateCase(c, cleaned, photos, { reviewer: true }) : { errors: [], warnings: [] }), [c, cleaned, photos]);

  if (error) return <Card><Empty icon="ShieldAlert" text={error} /></Card>;
  if (!c) return <Loading text="Loading case…" />;

  const locked = LOCKED.includes(c.Status);
  const comments = { generated, final };
  const hasData = ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REPORT_SENT', 'SENT_BACK', 'IN_FIELD'].includes(c.Status);

  const saveAll = async (silent = false) => {
    setBusy('save');
    try {
      const r1 = await api.saveSections(caseNo, cleaned);
      await api.saveComments(caseNo, comments);
      setDirty(false);
      if (r1.status) setC((x) => ({ ...x, Status: r1.status }));
      if (!silent) toast.success('Saved');
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    } finally { setBusy(''); }
  };

  const approve = async () => {
    if (result.errors.length) { setTab('checks'); return toast.error(`Resolve ${result.errors.length} validation error(s) first`); }
    if (!window.confirm('Approve this case? Report date & time will be recorded now.')) return;
    if (dirty && !(await saveAll(true))) return;
    setBusy('approve');
    try {
      await api.approveCase(caseNo, comments);
      toast.success('Approved. You can now generate the report.');
      loadCases().catch(() => {});
      await load();
    } catch (err) { toast.error(err.message); } finally { setBusy(''); }
  };

  const sendBack = async () => {
    if (!note.trim()) return toast.error('Write a note for the field executive');
    setBusy('back');
    try {
      await api.sendBack(caseNo, note.trim());
      toast.success('Sent back to field executive');
      setSendBackOpen(false); setNote('');
      loadCases().catch(() => {});
      await load();
    } catch (err) { toast.error(err.message); } finally { setBusy(''); }
  };

  const markSent = async () => {
    if (!window.confirm('Mark the report as sent to the bank?')) return;
    setBusy('sent');
    try { await api.markSent(caseNo); toast.success('Marked as sent'); loadCases().catch(() => {}); await load(); } catch (err) { toast.error(err.message); } finally { setBusy(''); }
  };

  const saveMeta = async (form) => {
    await api.updateCaseMeta(caseNo, form);
    toast.success('Allocation updated');
    setEditMeta(false);
    loadCases().catch(() => {});
    await load();
  };

  const tabs = [
    { key: 'overview', title: 'Overview' },
    { key: 'visit', title: 'Visit Info' },
    ...req.map((k) => ({ key: k, title: SECTIONS[k].title })),
    { key: 'photos', title: `Photos (${photos.length})` },
    { key: 'comments', title: 'Comments' },
    { key: 'checks', title: `Checks${result.errors.length ? ` (${result.errors.length})` : ''}`, bad: result.errors.length > 0 },
  ];
  const photoSections = [...PHOTO_SECTIONS.filter((k) => req.includes(k)).map((k) => ({ key: k, label: SECTIONS[k].title })), { key: 'other', label: 'Other' }];

  const Row = ({ k, v, red }) => (
    <div className="flex justify-between gap-3 py-1.5 border-b border-gray-100 text-sm">
      <span className="text-slate-500">{k}</span><span className={`text-right font-medium ${red ? 'text-red-600' : 'text-gray-900'}`}>{v || '—'}</span>
    </div>
  );

  return (
    <div className="space-y-3 pb-4">
      <Card className="p-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-indigo-100 text-indigo-600"><ArrowLeft size={20} /></button>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-indigo-600">{c['Case No']} · {c.Product} · {c.Activity}</p>
              <h1 className="text-lg font-bold text-gray-900 truncate">{c['Applicant Name']}</h1>
              <p className="text-xs text-slate-500">{c.Client}{c.Branch ? ` / ${c.Branch}` : ''} · Executive: {c['Executive Name']}</p>
            </div>
            <StatusBadge status={c.Status} />
          </div>
          <div className="flex flex-wrap gap-2">
            {!locked && hasData && <Button variant="secondary" icon="Save" loading={busy === 'save'} disabled={!dirty} onClick={() => saveAll()}>{dirty ? 'Save changes' : 'Saved'}</Button>}
            {['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'].includes(c.Status) && <Button variant="warn" icon="Undo2" onClick={() => setSendBackOpen(true)}>Send Back</Button>}
            {['SUBMITTED', 'UNDER_REVIEW'].includes(c.Status) && <Button variant="success" icon="CheckCircle2" loading={busy === 'approve'} onClick={approve}>Approve</Button>}
            {['APPROVED', 'REPORT_SENT'].includes(c.Status) && <Button icon="FileText" onClick={() => navigate(`/cases/${encodeURIComponent(caseNo)}/report`)}>Report / PDF</Button>}
            {c.Status === 'APPROVED' && <Button variant="secondary" icon="Send" loading={busy === 'sent'} onClick={markSent}>Mark Sent</Button>}
            {!['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REPORT_SENT'].includes(c.Status) && <Button variant="secondary" icon="FileText" onClick={() => navigate(`/cases/${encodeURIComponent(caseNo)}/report`)}>Preview</Button>}
          </div>
        </div>
        {(result.errors.length > 0 || result.warnings.length > 0) && hasData && (
          <button onClick={() => setTab('checks')} className={`w-full text-left text-xs rounded-lg p-2 border flex items-center gap-2 ${result.errors.length ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
            <AlertTriangle size={14} /> {result.errors.length} error(s), {result.warnings.length} warning(s) — click to view
          </button>
        )}
      </Card>

      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border ${tab === t.key ? 'bg-indigo-600 text-white border-indigo-600' : t.bad ? 'bg-white text-rose-600 border-rose-200' : 'bg-white text-gray-600 border-gray-200'}`}>{t.title}</button>
        ))}
      </div>

      <Card className="p-4 sm:p-6">
        {tab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-gray-900">Allocation</h3>
                {!locked && <Button variant="secondary" icon="Pencil" onClick={() => setEditMeta(true)}>Edit</Button>}
              </div>
              <Row k="Applicant" v={c['Applicant Name']} />
              <Row k="Mobile" v={c['Applicant Mobile']} />
              <Row k="Address" v={c['Applicant Address']} />
              <Row k="Business Name" v={c['Business Name']} />
              <Row k="Occupation" v={c.Occupation} />
              <Row k="Client / Branch" v={`${c.Client}${c.Branch ? ` / ${c.Branch}` : ''}`} />
              <Row k="Verifications" v={c['Verifications Required']} />
              <Row k="Field Executive" v={`${c['Executive Name']} (${c['Assigned To']})`} />
              {req.includes('bank') && <Row k="Account (masked)" v={maskAccount(data.bank?.accountNumber)} />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-2">Timeline &amp; TAT</h3>
              <Row k="Allocated" v={fmtDateTime(c['Allocated At'])} />
              <Row k="Visit started" v={fmtDateTime(c['Started At'])} />
              <Row k="Submitted" v={fmtDateTime(c['Submitted At'])} />
              <Row k="Approved (report)" v={fmtDateTime(c['Reported At'])} />
              <Row k="Report sent" v={fmtDateTime(c['Sent At'])} />
              <Row k="Field time (alloc → submit)" v={fmtDuration(hoursBetween(c['Allocated At'], c['Submitted At']))} />
              <Row k="TAT (alloc → report)" v={fmtDuration(tatHours(c))} red={(tatHours(c) || 0) > 24} />
              <Row k="Report versions" v={String(c['Report Version'] || 0)} />
              {c['Reviewer Note'] && <Row k="Last reviewer note" v={c['Reviewer Note']} />}
              <h3 className="text-sm font-bold text-gray-900 mt-4 mb-2">Visit</h3>
              {SECTIONS.visit.fields.map((f) => <Row key={f.key} k={f.label} v={displayValue(f, data.visit?.[f.key])} />)}
            </div>
          </div>
        )}

        {SECTIONS[tab] && (
          !hasData && tab !== 'visit' ? <Empty text="Field executive hasn't started this case yet." /> : (
            <SectionForm sectionKey={tab} value={data[tab]} readOnly={locked} reviewer
              onChange={(v) => { setData((d) => ({ ...d, [tab]: v })); setDirty(true); }} />
          )
        )}

        {tab === 'photos' && <PhotoCapture caseNo={caseNo} sections={photoSections} photos={photos} onChange={setPhotos} canEdit={!locked && user?.role === 'ADMIN'} />}

        {tab === 'comments' && (
          <div className="space-y-5">
            <p className="text-xs text-slate-500">Comments are generated from the case data. You can edit the final text — both versions are saved. The first page of the report uses the Residence comment.</p>
            {req.map((k) => {
              const edited = final[k] !== undefined && final[k] !== null && final[k] !== generated[k];
              return (
                <div key={k} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-900">{SECTIONS[k].title}</h3>
                    {edited && !locked && (
                      <button onClick={() => { setFinal((f) => { const n = { ...f }; delete n[k]; return n; }); setDirty(true); }} className="text-xs text-indigo-600 inline-flex items-center gap-1"><RotateCcw size={12} /> Reset to generated</button>
                    )}
                  </div>
                  <textarea rows={4} readOnly={locked} className={`${inputCls} resize-y text-sm`}
                    value={final[k] ?? generated[k] ?? ''}
                    onChange={(e) => { setFinal((f) => ({ ...f, [k]: e.target.value })); setDirty(true); }} />
                  {edited && <p className="text-[11px] text-slate-500"><b>Generated:</b> {generated[k] || '—'}</p>}
                </div>
              );
            })}
          </div>
        )}

        {tab === 'checks' && (
          <div className="space-y-3">
            {result.errors.length === 0
              ? <p className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2"><CheckCircle2 size={18} /> No blocking errors.</p>
              : result.errors.map((e, i) => (
                <button key={i} onClick={() => setTab(SECTIONS[e.section] ? e.section : 'photos')} className="block w-full text-left text-sm p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700">
                  ✖ [{SECTIONS[e.section]?.title || 'Photos'}] {e.msg}
                </button>
              ))}
            {result.warnings.map((w, i) => <p key={i} className="text-sm p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">⚠️ [{SECTIONS[w.section]?.title || 'Photos'}] {w.msg}</p>)}
          </div>
        )}
      </Card>

      {editMeta && (
        <Modal title="Edit allocation" wide onClose={() => setEditMeta(false)}>
          <CaseMetaForm initial={c} submitLabel="Save allocation" onSubmit={saveMeta} />
        </Modal>
      )}
      {sendBackOpen && (
        <Modal title="Send back to field executive" onClose={() => setSendBackOpen(false)}>
          <textarea rows={4} className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What needs to be corrected? (shown to the executive)" />
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="secondary" onClick={() => setSendBackOpen(false)}>Cancel</Button>
            <Button variant="warn" icon="Undo2" loading={busy === 'back'} onClick={sendBack}>Send Back</Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CaseDetail;
