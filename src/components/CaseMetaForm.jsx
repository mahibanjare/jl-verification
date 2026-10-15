import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useDataStore } from '../store/dataStore';
import { api } from '../utils/api';
import { VERIFICATIONS } from '../lib/sections';
import { Field, inputCls, Button } from './ui';

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
  const branchOptions = branches.filter((b) => !form.Client || b.Client === form.Client);

  const submit = async (e) => {
    e.preventDefault();
    for (const k of ['Client', 'Applicant Name', 'Applicant Mobile', 'Applicant Address', 'Assigned To']) {
      if (!String(form[k] || '').trim()) return toast.error(`${k} is required`);
    }
    if (!/^\d{10}$/.test(String(form['Applicant Mobile']).trim())) return toast.error('Mobile must be 10 digits');
    if (!verifs.length) return toast.error('Select at least one verification');
    setSaving(true);
    try { await onSubmit(form); } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

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
          <select className={inputCls} value={form.Client} onChange={(e) => { set('Client', e.target.value); set('Branch', ''); }}>
            <option value="">Select client</option>
            {clients.map((c) => <option key={c['Client ID']} value={c['Client Name']}>{c['Client Name']}</option>)}
          </select>
        </Field>
        <Field label="Branch" hint={!branches.length ? 'Add branches under Masters → Branches' : ''}>
          <select className={inputCls} value={form.Branch} onChange={(e) => set('Branch', e.target.value)}>
            <option value="">Select branch</option>
            {branchOptions.map((b) => <option key={b['Branch ID']} value={b['Branch Name']}>{b['Branch Name']} ({b.City})</option>)}
          </select>
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
