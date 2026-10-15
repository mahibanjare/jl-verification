import React, { useEffect, useState } from 'react';
import { Mail, Send, Building, Stamp, BellRing, CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getFileDataUrl, primeFileCache } from '../utils/api';
import { useDataStore } from '../store/dataStore';
import { compressImage } from '../utils/image';
import { PageHeader, Card, Button, Field, inputCls, Loading } from '../components/ui';

const FIRM_FIELDS = [
  ['firmName', 'Firm name (letterhead)'], ['firmSubtitle', 'Subtitle'],
  ['firmAddress1', 'Address line 1'], ['firmAddress2', 'Address line 2'],
  ['firmPhone', 'Phone'], ['firmEmail1', 'Email 1'], ['firmEmail2', 'Email 2'],
  ['agencyName', 'Agency name (Employment page)'],
];

const Toggle = ({ on, onChange, label }) => (
  <button type="button" onClick={() => onChange(on ? 'No' : 'Yes')} className="flex items-center gap-3 text-sm text-gray-700">
    <span className={`w-11 h-6 rounded-full relative transition-colors ${on ? 'bg-indigo-600' : 'bg-gray-300'}`}>
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
    </span>
    {label}
  </button>
);

const Section = ({ icon: I, title, children, right }) => (
  <Card className="p-4 sm:p-6 space-y-4">
    <div className="flex items-center justify-between gap-2">
      <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2"><I size={16} className="text-indigo-600" /> {title}</h2>
      {right}
    </div>
    {children}
  </Card>
);

const Settings = () => {
  const setStoreSettings = useDataStore((x) => x.setSettings);
  const [s, setS] = useState(null);
  const [meta, setMeta] = useState({});
  const [botToken, setBotToken] = useState('');
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState('');
  const [chats, setChats] = useState(null);
  const [assets, setAssets] = useState({});

  const load = async () => {
    const res = await api.getSettings();
    setS(res.settings); setMeta(res.meta || {}); setStoreSettings(res.settings);
    ['stampFileId', 'signatureFileId'].forEach((k) => res.settings[k] && getFileDataUrl(res.settings[k]).then((d) => setAssets((a) => ({ ...a, [k]: d }))).catch(() => {}));
  };
  useEffect(() => { load().catch((e) => toast.error(e.message)); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!s) return <Loading />;
  const set = (k, v) => setS((x) => ({ ...x, [k]: v }));
  const yes = (k) => String(s[k]).toLowerCase() === 'yes';

  const save = async () => {
    setSaving(true);
    try {
      await api.saveSettings(s, botToken.trim() || undefined);
      setBotToken('');
      toast.success('Settings saved');
      await load();
    } catch (e) { toast.error(e.message); } finally { setSaving(false); }
  };

  const run = async (key, fn, ok) => {
    setBusy(key);
    try { const r = await fn(); toast.success(ok(r)); return r; } catch (e) { toast.error(e.message); return null; } finally { setBusy(''); }
  };

  const uploadAsset = async (kind, file) => {
    if (!file) return;
    try {
      setBusy(kind);
      const dataUrl = await compressImage(file, { maxBytes: 300 * 1024 });
      const r = await api.uploadAsset(kind, dataUrl);
      primeFileCache(r.fileId, dataUrl);
      toast.success(`${kind === 'stamp' ? 'Stamp' : 'Signature'} uploaded`);
      await load();
    } catch (e) { toast.error(e.message); } finally { setBusy(''); }
  };

  const detect = () => run('detect', api.telegramDetectChats, (r) => { setChats(r.chats || []); return `${(r.chats || []).length} chat(s) found`; });

  return (
    <div className="space-y-3 pb-6">
      <PageHeader icon="Settings" title="Settings & Alerts" subtitle="Letterhead, stamp, disclaimer and Email / Telegram notifications">
        <Button icon="Save" loading={saving} onClick={save}>Save settings</Button>
      </PageHeader>

      {/* ---------------- Notifications ---------------- */}
      <Section icon={BellRing} title="Notifications">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-500 uppercase">When</p>
            <Toggle on={yes('notifyOnSubmit')} onChange={(v) => set('notifyOnSubmit', v)} label="Case submitted by field executive → Admins & Reviewers" />
            <Toggle on={yes('notifyDailyOverdue')} onChange={(v) => set('notifyDailyOverdue', v)} label="Daily TAT overdue summary → Admins & Reviewers" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="TAT limit (hours)"><input type="number" className={inputCls} value={s.tatHours} onChange={(e) => set('tatHours', e.target.value)} /></Field>
              <Field label="Daily alert time (IST)">
                <select className={inputCls} value={s.alertHour} onChange={(e) => set('alertHour', e.target.value)}>
                  {Array.from({ length: 24 }, (_, h) => <option key={h} value={String(h)}>{`${((h + 11) % 12) + 1}:00 ${h < 12 ? 'AM' : 'PM'}`}</option>)}
                </select>
              </Field>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <Button variant="secondary" icon="AlarmClock" loading={busy === 'trigger'} onClick={() => run('trigger', api.installTriggers, (r) => `Daily alert scheduled at ${r.hourLabel} IST`)}>
                {meta.triggerInstalled ? 'Re-schedule daily alert' : 'Activate daily alert'}
              </Button>
              <Button variant="secondary" icon="Play" loading={busy === 'overdue'} onClick={() => run('overdue', api.runOverdueNow, (r) => r.sent ? `Sent: ${r.count} overdue case(s)` : 'No overdue cases — nothing sent')}>Send overdue summary now</Button>
            </div>
            <p className="text-[11px] text-slate-500 flex items-center gap-1">
              {meta.triggerInstalled ? <><CheckCircle2 size={12} className="text-emerald-600" /> Daily trigger is active</> : <><XCircle size={12} className="text-red-500" /> Daily trigger not active yet — click Activate after saving</>}
            </p>
            <Field label="App URL (link in alerts)" hint="e.g. https://jl-verify.vercel.app"><input className={inputCls} value={s.appUrl} onChange={(e) => set('appUrl', e.target.value)} placeholder={window.location.origin} /></Field>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-500 uppercase">Who</p>
            <p className="text-xs text-slate-600">Every <b>active Admin / Reviewer</b> gets alerts on the channels below — by the Email and Telegram Chat ID on their user record. Add extra recipients here.</p>
            <Field label="Extra email recipients" hint="Comma-separated, e.g. partner@firm.com, office@firm.com"><input className={inputCls} value={s.extraEmails} onChange={(e) => set('extraEmails', e.target.value)} /></Field>
            <Field label="Telegram group / channel Chat ID" hint="Optional: one office group gets every alert. Use “Detect chats” below to find it."><input className={inputCls} value={s.telegramGroupChatId} onChange={(e) => set('telegramGroupChatId', e.target.value.trim())} placeholder="-1001234567890" /></Field>
          </div>
        </div>
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* ---------------- Email ---------------- */}
        <Section icon={Mail} title="Email (Gmail via Apps Script)" right={<Toggle on={yes('notifyEmail')} onChange={(v) => set('notifyEmail', v)} label="" />}>
          <ol className="text-xs text-slate-600 list-decimal pl-4 space-y-1">
            <li>No setup needed — emails are sent from the Google account that deployed the Apps Script.</li>
            <li>Make sure each Admin / Reviewer has an <b>Email</b> in Users &amp; Access.</li>
            <li>Gmail limit: ~100 emails/day (free) or 1,500/day (Workspace). Remaining today: <b>{meta.emailQuota ?? '—'}</b>.</li>
          </ol>
          <Button variant="secondary" icon="Send" loading={busy === 'email'} onClick={() => run('email', () => api.testNotification('email'), (r) => `Test email sent to ${r.sentTo}`)}>Send test email</Button>
        </Section>

        {/* ---------------- Telegram ---------------- */}
        <Section icon={Send} title="Telegram" right={<Toggle on={yes('notifyTelegram')} onChange={(v) => set('notifyTelegram', v)} label="" />}>
          <ol className="text-xs text-slate-600 list-decimal pl-4 space-y-1">
            <li>In Telegram open <b>@BotFather</b> → send <code>/newbot</code> → choose a name (e.g. <i>JL Verify Alerts</i>) → copy the <b>bot token</b>.</li>
            <li>Paste the token below and click <b>Save settings</b>. It is stored in Apps Script properties, never in the sheet.</li>
            <li>Each Admin / Reviewer opens <b>My Profile → Connect Telegram</b> and taps <b>Start</b> in the bot. Done — their Chat ID is saved automatically.</li>
            <li>Optional office group: add the bot to the group, send any message there, then <b>Detect chats</b> and pick the group.</li>
          </ol>
          <Field label="Bot token" hint={meta.telegramBotSet ? `✅ Saved${meta.botUsername ? ` — bot @${meta.botUsername}` : ''}. Paste a new one only to replace it.` : 'Not set yet'}>
            <input className={inputCls} type="password" autoComplete="off" value={botToken} onChange={(e) => setBotToken(e.target.value)} placeholder={meta.telegramBotSet ? '•••••••••• (saved)' : '123456789:AA...'} />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" icon="Search" loading={busy === 'detect'} disabled={!meta.telegramBotSet} onClick={detect}>Detect chats</Button>
            <Button variant="secondary" icon="Send" loading={busy === 'tg'} disabled={!meta.telegramBotSet} onClick={() => run('tg', () => api.testNotification('telegram'), (r) => `Test sent to ${r.sentTo} chat(s)`)}>Send test message</Button>
          </div>
          {chats && (
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
              {chats.length === 0 ? <p className="p-3 text-xs text-slate-500">No chats found. Send a message to the bot (or in the group) and try again within 24 hours.</p> : chats.map((ch) => (
                <div key={ch.id} className="p-2.5 flex items-center justify-between gap-2 text-sm">
                  <div><b className="text-gray-900">{ch.name}</b> <span className="text-xs text-slate-500">({ch.type}) · {ch.id}</span></div>
                  {ch.type !== 'private' && <button onClick={() => set('telegramGroupChatId', String(ch.id))} className="text-xs font-semibold text-indigo-600">Use as office group</button>}
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      {/* ---------------- Letterhead ---------------- */}
      <Section icon={Building} title="Report letterhead">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FIRM_FIELDS.map(([k, l]) => <Field key={k} label={l}><input className={inputCls} value={s[k] || ''} onChange={(e) => set(k, e.target.value)} /></Field>)}
        </div>
        <Field label="Disclaimer (printed on the last page)">
          <textarea rows={6} className={`${inputCls} resize-y text-sm`} value={s.disclaimer} onChange={(e) => set('disclaimer', e.target.value)} />
        </Field>
      </Section>

      <Section icon={Stamp} title="Stamp & signature (last page of report)">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[['stamp', 'stampFileId', 'Firm stamp'], ['signature', 'signatureFileId', 'Partner signature']].map(([kind, key, label]) => (
            <div key={kind} className="border border-dashed border-indigo-200 rounded-xl p-4 flex flex-col items-center gap-3">
              <p className="text-sm font-semibold text-gray-700">{label}</p>
              <div className="h-28 flex items-center justify-center">
                {assets[key] ? <img src={assets[key]} alt={label} className="max-h-28 object-contain" /> : <span className="text-xs text-slate-400">Not uploaded</span>}
              </div>
              <label className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer">
                {busy === kind ? 'Uploading…' : 'Upload image'}
                <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => { uploadAsset(kind, e.target.files[0]); e.target.value = ''; }} />
              </label>
              <p className="text-[11px] text-slate-500">PNG with transparent background looks best.</p>
            </div>
          ))}
        </div>
      </Section>

      <div className="flex justify-end"><Button icon="Save" loading={saving} onClick={save}>Save settings</Button></div>
    </div>
  );
};

export default Settings;
