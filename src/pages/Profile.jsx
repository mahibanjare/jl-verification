import React, { useState } from 'react';
import { KeyRound, Send, CheckCircle2, ExternalLink, Contact } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../utils/api';
import { useAuthStore } from '../store/authStore';
import { PageHeader, Card, Button, Field, inputCls } from '../components/ui';
import { ROLE_LABELS, ROLE_HELP } from '../config';

const Profile = () => {
  const { user, setUser } = useAuthStore();
  const [pw, setPw] = useState({ old: '', next: '', confirm: '' });
  const [contact, setContact] = useState({ email: user?.email || '', phone: user?.phone || '' });
  const [link, setLink] = useState(null);
  const [busy, setBusy] = useState('');

  const changePw = async (e) => {
    e.preventDefault();
    if (pw.next.length < 6) return toast.error('New password must be at least 6 characters');
    if (pw.next !== pw.confirm) return toast.error('Passwords do not match');
    setBusy('pw');
    try { await api.changePassword(pw.old, pw.next); toast.success('Password changed'); setPw({ old: '', next: '', confirm: '' }); } catch (err) { toast.error(err.message); } finally { setBusy(''); }
  };

  const saveContact = async (e) => {
    e.preventDefault();
    setBusy('contact');
    try { const r = await api.updateMyContact(contact); setUser(r.user); toast.success('Saved'); } catch (err) { toast.error(err.message); } finally { setBusy(''); }
  };

  const startLink = async () => {
    setBusy('link');
    try { setLink(await api.telegramLinkStart()); } catch (err) { toast.error(err.message); } finally { setBusy(''); }
  };
  const verifyLink = async () => {
    setBusy('verify');
    try {
      await api.telegramLinkVerify(link.code);
      const me = await api.me();
      setUser(me.user);
      setLink(null);
      toast.success('Telegram connected! You will now get alerts there.');
    } catch (err) { toast.error(err.message); } finally { setBusy(''); }
  };

  return (
    <div className="space-y-3">
      <PageHeader icon="CircleUser" title={user?.name} subtitle={`${ROLE_LABELS[user?.role]} · ${user?.userId}`} />
      <Card className="p-4 text-xs text-slate-600"><b>Your access:</b> {ROLE_HELP[user?.role]}</Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card className="p-4 sm:p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2"><KeyRound size={16} className="text-indigo-600" /> Change password</h2>
          <form onSubmit={changePw} className="space-y-3">
            <Field label="Current password"><input type="password" autoComplete="current-password" className={inputCls} value={pw.old} onChange={(e) => setPw({ ...pw, old: e.target.value })} /></Field>
            <Field label="New password"><input type="password" autoComplete="new-password" className={inputCls} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></Field>
            <Field label="Confirm new password"><input type="password" autoComplete="new-password" className={inputCls} value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></Field>
            <div className="flex justify-end"><Button type="submit" icon="Save" loading={busy === 'pw'}>Update password</Button></div>
          </form>
        </Card>

        <div className="space-y-3">
          <Card className="p-4 sm:p-6">
            <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2"><Contact size={16} className="text-indigo-600" /> My contact</h2>
            <form onSubmit={saveContact} className="space-y-3">
              <Field label="Email (for email alerts)"><input type="email" className={inputCls} value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} /></Field>
              <Field label="Mobile"><input inputMode="tel" className={inputCls} value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} /></Field>
              <div className="flex justify-end"><Button type="submit" variant="secondary" icon="Save" loading={busy === 'contact'}>Save</Button></div>
            </form>
          </Card>

          <Card className="p-4 sm:p-6 space-y-3">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2"><Send size={16} className="text-sky-500" /> Telegram alerts</h2>
            {user?.telegramLinked && !link ? (
              <p className="text-sm text-emerald-700 flex items-center gap-2"><CheckCircle2 size={16} /> Connected. <button className="text-xs text-indigo-600 underline" onClick={startLink}>Re-connect</button></p>
            ) : !link ? (
              <>
                <p className="text-xs text-slate-600">Get case-submitted and overdue alerts on Telegram. Takes 10 seconds.</p>
                <Button icon="Link" loading={busy === 'link'} onClick={startLink}>Connect Telegram</Button>
              </>
            ) : (
              <ol className="text-sm text-gray-700 list-decimal pl-5 space-y-2">
                <li>
                  <a href={link.link} target="_blank" rel="noreferrer" className="text-indigo-600 font-semibold underline inline-flex items-center gap-1">Open @{link.botUsername} <ExternalLink size={13} /></a>
                  {' '}and tap <b>Start</b>.
                  <p className="text-xs text-slate-500">If Start isn't shown, send this message to the bot: <code className="bg-gray-100 px-1 rounded">/start {link.code}</code></p>
                </li>
                <li>Come back and click: <Button className="ml-1 !py-1.5" loading={busy === 'verify'} onClick={verifyLink}>I've tapped Start — verify</Button></li>
              </ol>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
