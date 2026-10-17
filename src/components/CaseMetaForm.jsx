import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useDataStore } from '../store/dataStore';
import { api } from '../utils/api';
import { VERIFICATIONS } from '../lib/sections';
import { BANK_GROUPS } from '../lib/banks';
import SearchSelect from './SearchSelect';
import { Field, inputCls, Button } from './ui';

const same = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();

export const PRODUCTS = ['Home Loan', 'Vehicle Loan'];
export const ACTIVITIES = ['FI', 'CPV'];
export const OCCUPATIONS = ['Salaried', 'Self Employed', 'Professional'];

export const blankCase = {
  Client: '', Branch: '', Product: 'Home Loan', Activity: 'FI',
  'Applicant Name': '', 'Applicant Mobile': '', 'Applicant Address': '', 'Business Name': '',
  Occupation: 'Salaried', 'Verifications Required': 'Residence', 'Assigned To': '',
};

// Allocation form (used for new cases and for editing a case's allocation).
const CaseMetaForm = ({ initial, submitLabel = 'Allocate Case', onSubmit }) => {
  const { loadMaster } = useDataStore();
  const [form, setForm] = useState({ ...blankCase, ...(initial || {}) });
  const [clients, setClients] = useState([]);
  const [branches, setBranches] = useState([]);
  const [execs, setExecs] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadMaster('Clients').then(setClients).catch((e) => toast.error(e.message));
    loadMaster('Branches').then(setBranches).catch(() => {});
    api.listExecutives().then((r) => setExecs(r.rows || [])).catch((e) => toast.error(e.message));
  }, [loadMaster]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const verifs = String(form['Verifications Required'] || '').split(',').map((s) => s.trim()).filter(Boolean);
  const toggleVerif = (label) => set('Verifications Required',
    (verifs.includes(label) ? verifs.filter((x) => x !== label) : [...verifs, label]).join(', '));
  const branchOptions = branches.filter((b) => !form.Client || same(b.Client, form.Client));

  // Saved clients first, then every Indian bank / NBFC not already saved.
  const clientGroups = useMemo(() => {
    const saved = clients.map((c) => c['Client Name']).filter(Boolean);
    const mine = saved.length ? [{ label: 'आपके Clients', items: saved.map((n) => ({ value: n, label: n })) }] : [];
    return [...mine, ...BANK_GROUPS.map((g) => ({
      label: g.label,
      items: g.items.filter((n) => !saved.some((s) => same(s, n))).map((n) => ({ value: n, label: n })),
    }))];
  }, [clients]);
  const branchGroups = useMemo(() => [{
    label: form.Client ? `${form.Client} की branches` : 'Branches',
    items: branchOptions.map((b) => ({ value: b['Branch Name'], label: b['Branch Name'], sub: b.City })),
  }], [branchOptions, form.Client]);

  // ---- inline "add new" (client / branch) without leaving the form ----
  const [newClient, setNewClient] = useState(null);   // { name }
  const [newBranch, setNewBranch] = useState(null);   // { name, city }
  const [adding, setAdding] = useState(false);

  // Make sure the client exists in the Clients sheet (built-in banks are
  // saved the first time they are used, so they show up under "आपके Clients").
  const ensureClient = async (name) => {
    const existing = clients.find((c) => same(c['Client Name'], name));
    if (existing) return existing['Client Name'];
    await api.saveMaster('Clients', { 'Client Name': name.trim() });
    setClients(await loadMaster('Clients', true));
    return name.trim();
  };

  const saveNewClient = async () => {
    const name = String(newClient?.name || '').trim();
    if (!name) return toast.error('Client का नाम लिखो');
    const known = [...clients.map((c) => c['Client Name']), ...BANK_GROUPS.flatMap((g) => g.items)].find((n) => same(n, name));
    setAdding(true);
    try {
      const saved = await ensureClient(known || name);
      setForm((f) => ({ ...f, Client: saved, Branch: '' }));
      setNewClient(null);
      toast.success(`${saved} जोड़ दिया`);
    } catch (err) { toast.error(err.message); } finally { setAdding(false); }
  };

  const saveNewBranch = async () => {
    const name = String(newBranch?.name || '').trim();
    const city = String(newBranch?.city || '').trim();
    if (!form.Client) return toast.error('पहले Client चुनो');
    if (!name || !city) return toast.error('Branch का नाम और City दोनों भरो');
    const dup = branchOptions.find((b) => same(b['Branch Name'], name));
    if (dup) { set('Branch', dup['Branch Name']); setNewBranch(null); return toast('यह branch पहले से है, उसे चुन लिया'); }
    setAdding(true);
    try {
      const client = await ensureClient(form.Client);
      await api.saveMaster('Branches', { Client: client, 'Branch Name': name, City: city });
      setBranches(await loadMaster('Branches', true));
      setForm((f) => ({ ...f, Client: client, Branch: name }));
      setNewBranch(null);
      toast.success(`Branch ${name} (${city}) जोड़ दी`);
    } catch (err) { toast.error(err.message); } finally { setAdding(false); }
  };

  const submit = async (e) => {
    e.preventDefault();
    for (const k of ['Client', 'Applicant Name', 'Applicant Mobile', 'Applicant Address', 'Assigned To']) {
      if (!String(form[k] || '').trim()) return toast.error(`${k} is required`);
    }
    if (!/^\d{10}$/.test(String(form['Applicant Mobile']).trim())) return toast.error('Mobile must be 10 digits');
    if (!verifs.length) return toast.error('Select at least one verification');
    setSaving(true);
    try {
      // Best effort: keep the Clients list in sync. Never blocks allocation.
      try { await ensureClient(form.Client); } catch (err) { /* e.g. older backend */ }
      await onSubmit(form);
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  const miniInput = `${inputCls} !py-2 text-sm`;

  const pills = (key, options) => (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button type="button" key={o} onClick={() => set(key, o)}
          className={`px-3.5 py-2 rounded-full text-sm font-medium border ${form[key] === o ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'}`}>{o}</button>
      ))}
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Client (Bank / NBFC)" required>
          <SearchSelect
            value={form.Client}
            onChange={(v) => setForm((f) => ({ ...f, Client: v, Branch: '' }))}
            groups={clientGroups}
            placeholder="Bank / NBFC चुनो"
            searchPlaceholder="Bank का नाम टाइप करो… (जैसे SBI, HDFC)"
            addLabel="नया Client जोड़ें"
            onAdd={(q) => setNewClient({ name: q })}
          />
          {newClient && (
            <div className="mt-2 p-3 rounded-lg border border-indigo-200 bg-indigo-50/40 space-y-2">
              <input autoFocus className={miniInput} placeholder="Client का पूरा नाम" value={newClient.name}
                onChange={(e) => setNewClient({ name: e.target.value })}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveNewClient(); } }} />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" className="!py-1.5" onClick={() => setNewClient(null)}>Cancel</Button>
                <Button type="button" icon="Plus" className="!py-1.5" loading={adding} onClick={saveNewClient}>Client जोड़ें</Button>
              </div>
            </div>
          )}
        </Field>
        <Field label="Branch" hint={form.Client && !branchOptions.length && !newBranch ? 'इस client की कोई branch नहीं है — dropdown में "+ नई Branch जोड़ें" दबाओ' : ''}>
          <SearchSelect
            value={form.Branch}
            onChange={(v) => set('Branch', v)}
            groups={branchGroups}
            disabled={!form.Client}
            placeholder={form.Client ? 'Branch चुनो' : 'पहले Client चुनो'}
            searchPlaceholder="Branch या City टाइप करो…"
            emptyText="कोई branch नहीं मिली"
            addLabel="नई Branch जोड़ें"
            onAdd={(q) => setNewBranch({ name: q, city: '' })}
          />
          {newBranch && (
            <div className="mt-2 p-3 rounded-lg border border-indigo-200 bg-indigo-50/40 space-y-2">
              <p className="text-xs text-slate-500">{form.Client} की नई branch · City report में “Location” पर छपती है</p>
              <div className="grid grid-cols-2 gap-2">
                <input autoFocus className={miniInput} placeholder="Branch का नाम" value={newBranch.name}
                  onChange={(e) => setNewBranch((b) => ({ ...b, name: e.target.value }))} />
                <input className={miniInput} placeholder="City" value={newBranch.city}
                  onChange={(e) => setNewBranch((b) => ({ ...b, city: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); saveNewBranch(); } }} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" className="!py-1.5" onClick={() => setNewBranch(null)}>Cancel</Button>
                <Button type="button" icon="Plus" className="!py-1.5" loading={adding} onClick={saveNewBranch}>Branch जोड़ें</Button>
              </div>
            </div>
          )}
        </Field>
        <Field label="Product" required>{pills('Product', PRODUCTS)}</Field>
        <Field label="Activity" required>{pills('Activity', ACTIVITIES)}</Field>
        <Field label="Applicant Name" required>
          <input className={inputCls} value={form['Applicant Name']} onChange={(e) => set('Applicant Name', e.target.value)} />
        </Field>
        <Field label="Applicant Mobile" required>
          <input className={inputCls} inputMode="numeric" maxLength={10} value={form['Applicant Mobile']} onChange={(e) => set('Applicant Mobile', e.target.value.replace(/\D/g, ''))} />
        </Field>
        <Field label="Applicant Address" required className="md:col-span-2">
          <textarea rows={2} className={`${inputCls} resize-y`} value={form['Applicant Address']} onChange={(e) => set('Applicant Address', e.target.value)} />
        </Field>
        <Field label="Business Name">
          <input className={inputCls} value={form['Business Name']} onChange={(e) => set('Business Name', e.target.value)} />
        </Field>
        <Field label="Occupation" required>{pills('Occupation', OCCUPATIONS)}</Field>
        <Field label="Verifications Required" required className="md:col-span-2">
          <div className="flex flex-wrap gap-2">
            {VERIFICATIONS.map((v) => (
              <button type="button" key={v.key} onClick={() => toggleVerif(v.label)}
                className={`px-3.5 py-2 rounded-full text-sm font-medium border ${verifs.includes(v.label) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'}`}>{v.label}</button>
            ))}
          </div>
        </Field>
        <Field label="Assign to Field Executive" required hint={!execs.length ? 'Create users with role Field Executive in Users & Access' : ''}>
          <select className={inputCls} value={form['Assigned To']} onChange={(e) => set('Assigned To', e.target.value)}>
            <option value="">Select executive</option>
            {execs.map((x) => <option key={x.userId} value={x.userId}>{x.name} ({x.userId})</option>)}
          </select>
        </Field>
      </div>
      <div className="flex justify-end">
        <Button type="submit" icon="Save" loading={saving}>{submitLabel}</Button>
      </div>
    </form>
  );
};

export default CaseMetaForm;
