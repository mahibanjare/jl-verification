import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { SECTIONS, isVisible } from '../lib/sections';
import { inputCls } from './ui';

// Renders one section of the unified data model. Big touch targets so it
// works well on a phone in the field. Options render as pills (one tap).
const Pill = ({ active, onClick, children, disabled }) => (
  <button
    type="button" disabled={disabled} onClick={onClick}
    className={`px-3.5 py-2 rounded-full text-sm font-medium border transition-all ${active ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'} disabled:opacity-60`}
  >
    {children}
  </button>
);

const FieldInput = ({ field, value, onChange, readOnly }) => {
  const v = value ?? '';
  switch (field.type) {
    case 'yesno':
      return (
        <div className="flex gap-2">
          {['Yes', 'No'].map((o) => <Pill key={o} disabled={readOnly} active={v === o} onClick={() => onChange(v === o ? '' : o)}>{o}</Pill>)}
        </div>
      );
    case 'select':
      if (field.options.length <= 5) {
        return (
          <div className="flex flex-wrap gap-2">
            {field.options.map((o) => <Pill key={o} disabled={readOnly} active={v === o} onClick={() => onChange(v === o ? '' : o)}>{o}</Pill>)}
          </div>
        );
      }
      return (
        <select disabled={readOnly} value={v} onChange={(e) => onChange(e.target.value)} className={inputCls}>
          <option value="">Select…</option>
          {field.options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    case 'multiselect': {
      const arr = Array.isArray(v) ? v : String(v).split(',').map((s) => s.trim()).filter(Boolean);
      return (
        <div className="flex flex-wrap gap-2">
          {field.options.map((o) => (
            <Pill key={o} disabled={readOnly} active={arr.includes(o)}
              onClick={() => onChange(arr.includes(o) ? arr.filter((x) => x !== o) : [...arr, o])}>{o}</Pill>
          ))}
        </div>
      );
    }
    case 'textarea':
      return <textarea readOnly={readOnly} rows={2} value={v} onChange={(e) => onChange(e.target.value)} className={`${inputCls} resize-y`} placeholder={field.placeholder} />;
    case 'number':
      return (
        <div className="relative">
          {field.money && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>}
          <input
            readOnly={readOnly} type="number" inputMode="decimal" value={v}
            onChange={(e) => onChange(e.target.value === '' ? '' : e.target.value)}
            className={`${inputCls} ${field.money ? 'pl-7' : ''} ${field.suffix ? 'pr-16' : ''}`}
          />
          {field.suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{field.suffix}</span>}
        </div>
      );
    default:
      return (
        <input
          readOnly={readOnly}
          type={field.type === 'date' ? 'date' : field.type === 'tel' ? 'tel' : 'text'}
          inputMode={field.type === 'tel' ? 'tel' : undefined}
          maxLength={field.maxLength} value={v} placeholder={field.placeholder}
          onChange={(e) => onChange(field.upper ? e.target.value.toUpperCase() : e.target.value)}
          className={inputCls}
        />
      );
  }
};

const FieldsGrid = ({ section, data, onChange, readOnly, reviewer }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
    {section.fields.map((f) => {
      if (!isVisible(f, data)) return null;
      if (f.reviewerOnly && !reviewer) return null;
      const full = f.full || f.type === 'multiselect' || f.type === 'textarea';
      return (
        <div key={f.key} className={`space-y-1.5 ${full ? 'md:col-span-2' : ''}`}>
          <label className="text-sm font-medium text-gray-700 block">
            {f.label}{f.required && !f.reviewerOnly && <span className="text-red-500"> *</span>}
          </label>
          <FieldInput field={f} value={data?.[f.key]} readOnly={readOnly} onChange={(val) => onChange(f.key, val)} />
        </div>
      );
    })}
  </div>
);

const SectionForm = ({ sectionKey, value, onChange, readOnly = false, reviewer = false }) => {
  const section = SECTIONS[sectionKey];

  const patchOne = (current, key, val) => {
    let next = { ...(current || {}), [key]: val };
    const extra = section.derive?.(next, key);
    if (extra) next = { ...next, ...extra };
    return next;
  };

  if (!section.repeat) {
    return <FieldsGrid section={section} data={value || {}} readOnly={readOnly} reviewer={reviewer} onChange={(k, v) => onChange(patchOne(value, k, v))} />;
  }

  const items = Array.isArray(value) && value.length ? value : [{}];
  const setItem = (i, k, v) => onChange(items.map((it, j) => (j === i ? patchOne(it, k, v) : it)));
  return (
    <div className="space-y-4">
      {items.map((it, i) => (
        <div key={i} className="rounded-xl border border-indigo-100 p-3 sm:p-4 bg-indigo-50/30">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-indigo-700">{section.repeat.label} {i + 1}</h4>
            {!readOnly && items.length > 1 && (
              <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50" title="Remove">
                <Trash2 size={16} />
              </button>
            )}
          </div>
          <FieldsGrid section={section} data={it} readOnly={readOnly} reviewer={reviewer} onChange={(k, v) => setItem(i, k, v)} />
        </div>
      ))}
      {!readOnly && items.length < section.repeat.max && (
        <button type="button" onClick={() => onChange([...items, {}])}
          className="w-full py-3 rounded-xl border-2 border-dashed border-indigo-200 text-indigo-600 font-semibold text-sm hover:bg-indigo-50 inline-flex items-center justify-center gap-2">
          <Plus size={16} /> Add {section.repeat.label}
        </button>
      )}
    </div>
  );
};

export default SectionForm;
