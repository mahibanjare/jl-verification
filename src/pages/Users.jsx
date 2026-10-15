import React, { useEffect, useState } from 'react';
import { UserCog, Pencil, Trash2, X, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../utils/api';
import { useAuthStore } from '../store/authStore';
import { PageHeader, Card, Button, Field, inputCls, Loading, Empty } from '../components/ui';
import { ROLES, ROLE_LABELS, ROLE_HELP } from '../config';

const blank = { userId: '', name: '', phone: '', email: '', designation: '', role: 'FIELD_EXEC', active: true, telegramChatId: '', password: '' };
const ROLE_CLS = { ADMIN: 'bg-indigo-100 text-indigo-700', REVIEWER: 'bg-violet-100 text-violet-700', FIELD_EXEC: 'bg-amber-100 text-amber-800' };

const Users = () => {
  const { user: me } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setUsers((await api.listUsers()).rows || []); } catch (e) { toast.error(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const reset = () => { setForm(blank); setEditing(null); };
  const edit = (u) => { setEditing(u.userId); setForm({ ...blank, ...u, password: '' }); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.userId.trim()) return toast.error('Full name and User ID are required');
    if (!editing && form.password.length < 6) return toast.error('Password must be at least 6 characters');
    if (editing && form.password && form.password.length < 6) return toast.error('New password must be at least 6 characters');
    setSaving(true);
    try {
      await api.saveUser(form, !editing);
      toast.success(editing ? 'User updated' : 'User created');
      reset(); load();
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  const del = async (u) => {
    if (!window.confirm(`Delete user "${u.name}" (${u.userId})? Tip: you can set them Inactive instead to keep history.`)) return;
    try { await api.deleteUser(u.userId); toast.success('User deleted'); load(); } catch (e) { toast.error(e.message); }
  };

  return (
    <div className="space-y-3">
      <PageHeader icon="UserCog" title="Users & Access" subtitle="Roles are enforced on the server for every request — not just hidden in the menu." />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {ROLES.map((r) => (
          <Card key={r} className="p-3">
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${ROLE_CLS[r]}`}>{ROLE_LABELS[r]}</span>
            <p className="text-xs text-slate-600 mt-2">{ROLE_HELP[r]}</p>
          </Card>
        ))}
      </div>

      <Card className="p-4 sm:p-6">
        <form onSubmit={submit}>
          <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <UserCog size={16} className="text-indigo-600" /> {editing ? `Edit user — ${editing}` : 'Add new user'}
            {editing && <button type="button" onClick={reset} className="ml-auto text-xs text-slate-500 inline-flex items-center gap-1"><X size={14} /> Cancel</button>}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Full Name" required><input className={inputCls} value={form.name} onChange={(e) => set('name', e.target.value)} /></Field>
            <Field label="User ID (login)" required hint="Letters, numbers, . _ - @"><input className={inputCls} disabled={!!editing} value={form.userId} onChange={(e) => set('userId', e.target.value.trim())} /></Field>
            <Field label={editing ? 'New Password' : 'Password'} required={!editing} hint={editing ? 'Leave blank to keep current' : 'Min 6 characters'}>
              <input className={inputCls} type="text" autoComplete="new-password" value={form.password} onChange={(e) => set('password', e.target.value)} />
            </Field>
            <Field label="Role" required>
              <select className={inputCls} value={form.role} onChange={(e) => set('role', e.target.value)}>
                {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
            </Field>
            <Field label="Mobile"><input className={inputCls} inputMode="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
            <Field label="Email" hint="Used for email alerts (Admin / Reviewer)"><input className={inputCls} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} /></Field>
            <Field label="Designation"><input className={inputCls} value={form.designation} onChange={(e) => set('designation', e.target.value)} /></Field>
            <Field label="Telegram Chat ID" hint="User can link it themselves from My Profile → Connect Telegram"><input className={inputCls} value={form.telegramChatId} onChange={(e) => set('telegramChatId', e.target.value.trim())} /></Field>
            <Field label="Status">
              <div className="flex gap-2">
                {[[true, 'Active'], [false, 'Inactive']].map(([v, l]) => (
                  <button type="button" key={l} onClick={() => set('active', v)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border ${form.active === v ? (v ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-red-600 border-red-600 text-white') : 'bg-white text-gray-700 border-gray-200'}`}>{l}</button>
                ))}
              </div>
            </Field>
          </div>
          <div className="mt-5 flex justify-end">
            <Button type="submit" icon={editing ? 'Save' : 'Plus'} loading={saving}>{editing ? 'Update user' : 'Add user'}</Button>
          </div>
        </form>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-auto">
          {loading ? <Loading /> : users.length === 0 ? <Empty text="No users." /> : (
            <table className="w-full text-sm">
              <thead className="bg-indigo-50">
                <tr>{['Name', 'User ID', 'Role', 'Contact', 'Alerts', 'Status', ''].map((h) => <th key={h} className="text-left font-bold text-indigo-700 px-4 py-3 whitespace-nowrap">{h}</th>)}</tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.userId} className={`border-b border-gray-100 hover:bg-indigo-50/50 ${u.active ? '' : 'opacity-60'}`}>
                    <td className="px-4 py-2.5 text-gray-900 font-medium whitespace-nowrap">{u.name}<div className="text-[11px] text-slate-500">{u.designation}</div></td>
                    <td className="px-4 py-2.5 text-gray-700">{u.userId}</td>
                    <td className="px-4 py-2.5"><span className={`px-2 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${ROLE_CLS[u.role]}`}>{ROLE_LABELS[u.role]}</span></td>
                    <td className="px-4 py-2.5 text-xs text-gray-600 whitespace-nowrap">{u.phone}<div>{u.email}</div></td>
                    <td className="px-4 py-2.5 text-xs whitespace-nowrap">
                      {u.email && <span className="mr-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">Email</span>}
                      {u.telegramChatId && <span className="px-1.5 py-0.5 rounded bg-sky-100 text-sky-700 inline-flex items-center gap-0.5"><Send size={10} /> Telegram</span>}
                    </td>
                    <td className="px-4 py-2.5 text-xs font-bold">{u.active ? <span className="text-emerald-600">Active</span> : <span className="text-red-600">Inactive</span>}</td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      <button onClick={() => edit(u)} className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-100"><Pencil size={16} /></button>
                      {u.userId !== me?.userId && <button onClick={() => del(u)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"><Trash2 size={16} /></button>}
                    </td>
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

export default Users;
