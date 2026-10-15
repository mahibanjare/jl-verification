import React from 'react';
import {
  AlarmClock, Building2, CalendarPlus, Check, CheckCircle2, CircleUser, ClipboardList, Download, FilePlus2, FileSearch, FileText, FolderKanban, Footprints, History, Inbox, Landmark, LayoutDashboard, Link, PartyPopper, Pencil, Play, Plus, RefreshCw, Save, Search, Send, Settings, ShieldAlert, Square, Table, Undo2, UserCog, X,
} from 'lucide-react';

// Explicit icon map (keeps the bundle small — no import of every lucide icon).
const Icons = { AlarmClock, Building2, CalendarPlus, Check, CheckCircle2, CircleUser, ClipboardList, Download, FilePlus2, FileSearch, FileText, FolderKanban, Footprints, History, Inbox, Landmark, LayoutDashboard, Link, PartyPopper, Pencil, Play, Plus, RefreshCw, Save, Search, Send, Settings, ShieldAlert, Square, Table, Undo2, UserCog, X };
import { STATUS } from '../utils/format';

export const Icon = ({ name, ...props }) => {
  const Cmp = Icons[name] || Icons.Square;
  return <Cmp {...props} />;
};

export const Card = ({ className = '', children, ...rest }) => (
  <div className={`bg-white rounded-xl border border-indigo-200 shadow-sm ${className}`} {...rest}>{children}</div>
);

export const PageHeader = ({ icon, title, subtitle, children }) => (
  <Card className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
    <div className="flex items-center gap-3 min-w-0">
      {icon && (
        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
          <Icon name={icon} className="text-indigo-600" size={22} />
        </div>
      )}
      <div className="min-w-0">
        <h1 className="text-lg font-bold text-gray-900 truncate">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
    </div>
    {children && <div className="flex items-center gap-2 flex-wrap no-print">{children}</div>}
  </Card>
);

export const Spinner = ({ size = 'w-4 h-4', light = false }) => (
  <div className={`${size} border-2 ${light ? 'border-white' : 'border-indigo-500'} border-t-transparent rounded-full animate-spin`} />
);

export const Loading = ({ text = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
    <Spinner size="w-8 h-8" />
    <span className="text-sm">{text}</span>
  </div>
);

export const Empty = ({ icon = 'Inbox', text }) => (
  <div className="flex flex-col items-center justify-center py-14 text-slate-400 gap-2 text-center px-4">
    <Icon name={icon} size={36} />
    <span className="text-sm">{text}</span>
  </div>
);

export const StatusBadge = ({ status }) => {
  const s = STATUS[status] || { label: status || '—', cls: 'bg-slate-100 text-slate-600 border-slate-200' };
  return <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold border whitespace-nowrap ${s.cls}`}>{s.label}</span>;
};

const BTN = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700 border border-indigo-600',
  secondary: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50',
  danger: 'bg-red-600 text-white hover:bg-red-700 border border-red-600',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 border border-emerald-600',
  warn: 'bg-amber-500 text-white hover:bg-amber-600 border border-amber-500',
};

export const Button = ({ variant = 'primary', icon, loading, children, className = '', disabled, ...rest }) => (
  <button
    disabled={disabled || loading}
    className={`px-4 py-2.5 rounded-lg font-semibold text-sm transition-all inline-flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed ${BTN[variant]} ${className}`}
    {...rest}
  >
    {loading ? <Spinner light={variant !== 'secondary'} /> : icon ? <Icon name={icon} size={16} /> : null}
    {children}
  </button>
);

export const inputCls = 'block w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all';

export const Field = ({ label, required, hint, children, className = '' }) => (
  <div className={`space-y-1.5 ${className}`}>
    {label && (
      <label className="text-sm font-medium text-gray-700 block">
        {label}{required && <span className="text-red-500"> *</span>}
      </label>
    )}
    {children}
    {hint && <p className="text-[11px] text-slate-500">{hint}</p>}
  </div>
);

export const NoAccess = ({ text = "You don't have permission to view this page." }) => (
  <Card className="p-10 text-center text-slate-500">
    <Icons.ShieldAlert size={40} className="mx-auto text-indigo-300 mb-3" />
    <p className="font-semibold text-gray-700">No access</p>
    <p className="text-sm">{text}</p>
  </Card>
);

export const Modal = ({ title, onClose, children, wide }) => (
  <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />
    <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} max-h-[90dvh] flex flex-col`}>
      <div className="flex items-center justify-between p-4 border-b border-indigo-100">
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><Icons.X size={20} /></button>
      </div>
      <div className="p-4 sm:p-6 overflow-y-auto">{children}</div>
    </div>
  </div>
);
