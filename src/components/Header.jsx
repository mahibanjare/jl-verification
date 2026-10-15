import React, { useEffect, useState } from 'react';
import { Menu, Sun, Moon, Wifi, WifiOff } from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import { ROLE_LABELS } from '../config';

const Header = ({ onMenuClick, user }) => {
  const { dark, toggleDark } = useUIStore();
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-indigo-200 no-print">
      <div className="flex justify-between items-center h-14 px-3 sm:px-6">
        <button onClick={onMenuClick} className="lg:hidden p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors">
          <Menu size={24} />
        </button>
        <div className="hidden lg:block" />

        <div className="flex items-center gap-2 sm:gap-3">
          <span
            title={online ? 'Online' : 'Offline — drafts are saved on this device'}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold ${online ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}
          >
            {online ? <Wifi size={12} /> : <WifiOff size={12} />} {online ? 'Online' : 'Offline'}
          </span>
          <button
            onClick={toggleDark}
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-100 transition-colors"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <div className="h-8 w-px bg-indigo-200 mx-1 hidden sm:block" />
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900 leading-tight">{user?.name || 'User'}</p>
            <p className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider">{ROLE_LABELS[user?.role] || user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
