import React, { useEffect, useState } from 'react';
import { X, Save, Upload, FileCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../utils/api';

// Generic add/edit modal driven by a module's field config.
// mode: 'add' | 'edit'. initial: object keyed by field key (for edit).
// Field types: text | number | date | tel | email | textarea | select |
//              currency | checkbox | multiselect | file | lookup
const RecordModal = ({ mod, mode, initial, onClose, onSubmit }) => {
  const buildInitial = () =>
    mod.fields.reduce((acc, f) => ({ ...acc, [f.key]: initial?.[f.key] ?? (f.type === 'multiselect' ? '' : '') }), {});

  const [form, setForm] = useState(buildInitial);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState({});
  const [lookups, setLookups] = useState({});

  const onChange = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  // Load options for any lookup fields from their source sheet.
  useEffect(() => {
    const lookupFields = mod.fields.filter((f) => f.type === 'lookup');
    if (!lookupFields.length) return;
    let active = true;
    (async () => {
      const out = {};
      for (const f of lookupFields) {
        try {
          const res = await api.listMaster(f.lookupSheet);
          out[f.key] = (res.rows || [])
            .map((r) => ({
              value: r[f.lookupColumn],
              label: f.lookupLabel ? `${r[f.lookupColumn]} — ${r[f.lookupLabel]}` : String(r[f.lookupColumn]),
            }))
            .filter((o) => o.value !== '' && o.value != null);
        } catch (err) {
          out[f.key] = [];
        }
      }
      if (active) setLookups(out);
    })();
    return () => { active = false; };
  }, [mod]);

  const handleFile = async (key, file) => {
    if (!file) return;
    setUploading((u) => ({ ...u, [key]: true }));
    try {
      const dataUrl = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      onChange(key, dataUrl);
      toast.error('File fields are not used in this app');
    } catch (err) {
      console.error(err);
      toast.error('Upload failed');
    } finally {
      setUploading((u) => ({ ...u, [key]: false }));
    }
  };

  const toggleMulti = (key, opt) => {
    const cur = String(form[key] || '').split(',').map((s) => s.trim()).filter(Boolean);
    const next = cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt];
    onChange(key, next.join(', '));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    for (const f of mod.fields) {
      if (f.required && f.type !== 'checkbox' && !String(form[f.key] || '').trim()) {
        toast.error(`${f.label} is required`);
        return;
      }
    }
    setSaving(true);
    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Save failed. Check Apps Script URL / token / network.');
    } finally {
      setSaving(false);
    }
  };

  const baseInput = 'block w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all';

  const renderField = (field) => {
    const val = form[field.key] ?? '';
    switch (field.type) {
      case 'select':
        return (
          <select value={val} onChange={(e) => onChange(field.key, e.target.value)} className={baseInput}>
            <option value="">Select {field.label}</option>
            {(field.options || []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        );
      case 'lookup':
        return (
          <select value={val} onChange={(e) => onChange(field.key, e.target.value)} className={baseInput}>
            <option value="">Select {field.label}</option>
            {(lookups[field.key] || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        );
      case 'textarea':
        return (
          <textarea
            rows={3} value={val} placeholder={field.placeholder}
            onChange={(e) => onChange(field.key, e.target.value)}
            className={`${baseInput} resize-none`}
          />
        );
      case 'checkbox':
        return (
          <label className="inline-flex items-center gap-2 mt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={val === 'Yes' || val === true}
              onChange={(e) => onChange(field.key, e.target.checked ? 'Yes' : 'No')}
              className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-600">{field.checkboxLabel || 'Yes'}</span>
          </label>
        );
      case 'multiselect':
        return (
          <div className="flex flex-wrap gap-2 mt-1">
            {(field.options || []).map((opt) => {
              const active = String(val).split(',').map((s) => s.trim()).includes(opt);
              return (
                <button
                  type="button" key={opt} onClick={() => toggleMulti(field.key, opt)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${active ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        );
      case 'currency':
        return (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{field.symbol || '₹'}</span>
            <input
              type="number" value={val} placeholder={field.placeholder}
              onChange={(e) => onChange(field.key, e.target.value)}
              className={`${baseInput} pl-8`}
            />
          </div>
        );
      case 'file':
        return (
          <div className="flex items-center gap-3">
            <label className="px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer text-sm flex items-center gap-2">
              {uploading[field.key] ? (
                <><div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /> Uploading...</>
              ) : (
                <><Upload size={16} /> Choose file</>
              )}
              <input type="file" className="hidden" onChange={(e) => handleFile(field.key, e.target.files[0])} />
            </label>
            {val && (
              <a href={val} target="_blank" rel="noreferrer" className="text-indigo-600 text-sm inline-flex items-center gap-1 underline">
                <FileCheck size={16} /> View
              </a>
            )}
          </div>
        );
      default:
        return (
          <input
            type={field.type || 'text'} value={val} placeholder={field.placeholder}
            maxLength={field.maxLength}
            onChange={(e) => onChange(field.key, e.target.value)}
            className={baseInput}
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90dvh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-indigo-100">
          <h2 className="text-lg font-bold text-gray-900">
            {mode === 'edit' ? 'Edit' : 'Add'} {mod.label.replace(/s$/, '')}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {mod.autoId && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">{mod.idColumn}</label>
                <input
                  disabled
                  value={mode === 'edit' ? initial?.[mod.idColumn] || '' : 'Auto-generated'}
                  className="block w-full px-3 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
                />
              </div>
            )}

            {mod.fields.map((field) => (
              <div key={field.key} className={`space-y-1.5 ${field.full || field.type === 'multiselect' ? 'sm:col-span-2' : ''}`}>
                <label className="text-sm font-medium text-gray-700">
                  {field.label}
                  {field.required && <span className="text-red-500"> *</span>}
                </label>
                {renderField(field)}
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`px-6 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-all flex items-center gap-2 ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} /> Save
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecordModal;
