import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CloudUpload, CheckCircle2, AlertTriangle, Send, Phone, Navigation } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../utils/api';
import { useDataStore } from '../store/dataStore';
import SectionForm from '../components/SectionForm';
import { PhotoCapture } from '../components/Photos';
import { Card, Loading, StatusBadge, Button, Empty } from '../components/ui';
import { SECTIONS, PHOTO_SECTIONS, requiredSectionKeys, cleanSection, defaultsFor } from '../lib/sections';
import { validateCase } from '../lib/validation';
import { fmtDateTime, toDate } from '../utils/format';

const EDITABLE = ['ALLOCATED', 'IN_FIELD', 'SENT_BACK'];
const draftKey = (no) => `jl-draft:${no}`;
const readDraft = (no) => { try { return JSON.parse(localStorage.getItem(draftKey(no)) || 'null'); } catch (e) { return null; } };
const writeDraft = (no, data) => { try { localStorage.setItem(draftKey(no), JSON.stringify({ data, savedAt: new Date().toISOString() })); } catch (e) { /* storage full */ } };

const FieldCase = () => {
  const { caseNo } = useParams();
  const navigate = useNavigate();
  const loadCases = useDataStore((s) => s.loadCases);
  const [c, setC] = useState(null);
  const [data, setData] = useState({});
  const [photos, setPhotos] = useState([]);
  const [step, setStep] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [error, setError] = useState('');
  const dataRef = useRef(data);
  dataRef.current = data;

  // Load server copy; prefer the local draft if it is newer (offline work).
  useEffect(() => {
    (async () => {
      try {
        const res = await api.getCase(caseNo);
        const cs = res.case;
        const server = {};
        ['visit', ...requiredSectionKeys(cs)].forEach((k) => { server[k] = cs.data?.[k] ?? defaultsFor(k); });
        const draft = readDraft(caseNo);
        const serverAt = toDate(cs['Updated At'])?.getTime() || 0;
        if (draft && EDITABLE.includes(cs.Status) && new Date(draft.savedAt).getTime() > serverAt) {
          setData({ ...server, ...draft.data });
          setDirty(true);
          toast('Restored your unsaved draft from this device', { icon: '💾' });
        } else {
          setData(server);
        }
        setPhotos(cs.photos || []);
        setC(cs);
      } catch (err) {
        setError(err.message);
      }
    })();
  }, [caseNo]);

  const editable = c && EDITABLE.includes(c.Status);
  const req = c ? requiredSectionKeys(c) : [];
  const steps = useMemo(() => (c ? [
    { key: 'visit', title: 'Visit Info' },
    ...req.map((k) => ({ key: k, title: SECTIONS[k].title })),
    { key: 'photos', title: 'Photos' },
    { key: 'review', title: 'Review & Submit' },
  ] : []), [c]); // eslint-disable-line react-hooks/exhaustive-deps

  const setSection = (key, value) => {
    setData((d) => {
      const next = { ...d, [key]: value };
      writeDraft(caseNo, next);
      return next;
    });
    setDirty(true);
  };

  const cleaned = () => Object.fromEntries(Object.entries(dataRef.current).map(([k, v]) => [k, cleanSection(k, v)]));

  const sync = useCallback(async (silent = true) => {
    if (!editable || !navigator.onLine) return false;
    setSyncing(true);
    try {
      const res = await api.saveSections(caseNo, cleaned());
      setDirty(false);
      setLastSync(new Date());
      if (res.status) setC((x) => ({ ...x, Status: res.status }));
      if (!silent) toast.success('Saved to server');
      return true;
    } catch (err) {
      if (!silent) toast.error(err.message);
      return false;
    } finally {
      setSyncing(false);
    }
  }, [editable, caseNo]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-sync every 30s while there are unsaved changes; and when back online.
  useEffect(() => {
    if (!dirty) return undefined;
    const t = setInterval(() => sync(true), 30000);
    const on = () => sync(true);
    window.addEventListener('online', on);
    return () => { clearInterval(t); window.removeEventListener('online', on); };
  }, [dirty, sync]);

  const result = useMemo(() => (c ? validateCase(c, cleaned(), photos) : { errors: [], warnings: [] }), [c, data, photos]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async () => {
    if (result.errors.length) return toast.error(`Fix ${result.errors.length} issue(s) before submitting`);
    if (!navigator.onLine) return toast.error('You are offline. Your draft is saved — submit when back online.');
    if (!window.confirm('Submit this case to the office for review? You cannot edit it after submitting.')) return;
    setSubmitting(true);
    try {
      await api.submitCase(caseNo, cleaned());
      localStorage.removeItem(draftKey(caseNo));
      toast.success('Case submitted. Office has been notified.');
      loadCases().catch(() => {});
      navigate('/my-cases', { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (error) return <Card><Empty icon="ShieldAlert" text={error} /></Card>;
  if (!c) return <Loading text="Loading case…" />;

  const cur = steps[step];
  const errsFor = (key) => result.errors.filter((e) => e.section === key);
  const photoSections = [...PHOTO_SECTIONS.filter((k) => req.includes(k)).map((k) => ({ key: k, label: SECTIONS[k].title })), { key: 'other', label: 'Other' }];

  return (
    <div className="space-y-3 pb-24">
      {/* Case header */}
      <Card className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-indigo-600">{c['Case No']} · {c.Product} · {c.Activity}</p>
            <h1 className="text-lg font-bold text-gray-900 truncate">{c['Applicant Name']}</h1>
            <p className="text-xs text-slate-500">{c['Applicant Address']}</p>
          </div>
          <StatusBadge status={c.Status} />
        </div>
        <div className="flex gap-2">
          <a href={`tel:${c['Applicant Mobile']}`} className="flex-1 py-2 rounded-lg border border-gray-200 text-sm font-semibold inline-flex items-center justify-center gap-1.5"><Phone size={15} /> {c['Applicant Mobile']}</a>
          <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(c['Applicant Address'] || '')}`} target="_blank" rel="noreferrer" className="flex-1 py-2 rounded-lg border border-gray-200 text-sm font-semibold inline-flex items-center justify-center gap-1.5"><Navigation size={15} /> Directions</a>
        </div>
        {c.Status === 'SENT_BACK' && c['Reviewer Note'] && (
          <p className="text-sm bg-rose-50 border border-rose-200 text-rose-800 rounded-lg p-2 flex gap-1.5"><AlertTriangle size={16} className="shrink-0 mt-0.5" /> Office note: {c['Reviewer Note']}</p>
        )}
        {!editable && <p className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-600">This case is {c.Status.replace('_', ' ').toLowerCase()} — view only.</p>}
      </Card>

      {/* Stepper */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
        {steps.map((s, i) => {
          const bad = s.key !== 'review' && errsFor(s.key).length > 0;
          return (
            <button key={s.key} onClick={() => setStep(i)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border inline-flex items-center gap-1 ${i === step ? 'bg-indigo-600 text-white border-indigo-600' : bad ? 'bg-white text-rose-600 border-rose-200' : 'bg-white text-gray-600 border-gray-200'}`}>
              {i + 1}. {s.title}
            </button>
          );
        })}
      </div>

      <Card className="p-4 sm:p-6">
        <h2 className="text-base font-bold text-gray-900 mb-4">{cur.title}</h2>
        {cur.key === 'photos' ? (
          <PhotoCapture caseNo={caseNo} sections={photoSections} photos={photos} onChange={setPhotos} canEdit={editable} />
        ) : cur.key === 'review' ? (
          <div className="space-y-4">
            {result.errors.length === 0 ? (
              <p className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold flex items-center gap-2"><CheckCircle2 size={18} /> All checks passed. Ready to submit.</p>
            ) : (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 space-y-1">
                <p className="text-sm font-bold text-rose-800">{result.errors.length} issue(s) to fix:</p>
                {result.errors.map((e, i) => (
                  <button key={i} onClick={() => setStep(Math.max(0, steps.findIndex((s) => s.key === e.section)))} className="block text-left text-sm text-rose-700 underline-offset-2 hover:underline">
                    • [{SECTIONS[e.section]?.title || 'Photos'}] {e.msg}
                  </button>
                ))}
              </div>
            )}
            {result.warnings.length > 0 && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 space-y-1">
                {result.warnings.map((w, i) => <p key={i} className="text-sm text-amber-800">⚠️ {w.msg}</p>)}
              </div>
            )}
            <p className="text-xs text-slate-500">Photos: {photos.length} · Last saved: {lastSync ? fmtDateTime(lastSync) : dirty ? 'not yet (draft on device)' : 'up to date'}</p>
            {editable && (
              <Button variant="success" icon="Send" className="w-full py-3.5 text-base" loading={submitting} onClick={submit} disabled={result.errors.length > 0}>
                Submit to Office
              </Button>
            )}
          </div>
        ) : (
          <>
            {errsFor(cur.key).length > 0 && editable && (
              <div className="mb-4 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 space-y-0.5">
                {errsFor(cur.key).slice(0, 6).map((e, i) => <p key={i}>• {e.msg}</p>)}
              </div>
            )}
            <SectionForm sectionKey={cur.key} value={data[cur.key]} readOnly={!editable} onChange={(v) => setSection(cur.key, v)} />
          </>
        )}
      </Card>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-60 z-40 bg-white border-t border-indigo-200 p-3 flex items-center gap-2 no-print">
        <button disabled={step === 0} onClick={() => setStep(step - 1)} className="p-3 rounded-lg border border-gray-200 text-gray-700 disabled:opacity-40"><ChevronLeft size={20} /></button>
        {editable && (
          <button onClick={() => sync(false)} disabled={syncing}
            className="flex-1 py-3 rounded-lg border border-indigo-200 text-indigo-700 font-semibold text-sm inline-flex items-center justify-center gap-1.5">
            <CloudUpload size={18} className={syncing ? 'animate-pulse' : ''} /> {syncing ? 'Saving…' : dirty ? 'Save draft' : 'Saved'}
          </button>
        )}
        {step < steps.length - 1 ? (
          <button onClick={() => { if (dirty) sync(true); setStep(step + 1); }} className="flex-1 py-3 rounded-lg bg-indigo-600 text-white font-semibold text-sm inline-flex items-center justify-center gap-1">
            Next <ChevronRight size={18} />
          </button>
        ) : editable ? (
          <button onClick={submit} disabled={submitting || result.errors.length > 0} className="flex-1 py-3 rounded-lg bg-emerald-600 text-white font-semibold text-sm inline-flex items-center justify-center gap-1.5 disabled:opacity-50">
            <Send size={16} /> Submit
          </button>
        ) : <div className="flex-1" />}
      </div>
    </div>
  );
};

export default FieldCase;
