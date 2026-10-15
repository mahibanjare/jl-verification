import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut as LogOutIcon, X, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { MENU_ITEMS, APP_NAME, LOGO, ROLE_LABELS } from '../config';
import { api } from '../utils/api';
import { Icon } from './ui';

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    try { await api.logout(); } catch (e) { /* session may already be gone */ }
    logout();
    navigate('/login', { replace: true });
  };

  // Role-based menu. Routes are guarded with the same role lists, and the
  // backend re-checks the role on every request.
  const visibleItems = MENU_ITEMS.filter((item) => item.roles.includes(user?.role));

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm z-[60] lg:hidden" onClick={onClose} />}

      <aside
        className={`fixed top-0 left-0 h-full w-60 bg-white border-r border-indigo-200 z-[70] transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex flex-col h-full">
          <div className="p-5 border-b border-indigo-200 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              {LOGO ? (
                <img src={LOGO} alt={APP_NAME} className="w-9 h-9 rounded-lg object-contain bg-white shrink-0" />
              ) : (
                <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                  <ShieldCheck size={20} className="text-white" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-bold text-indigo-700 leading-tight truncate">Jain &amp; Lunkad</p>
                <p className="text-[11px] text-slate-500 leading-tight truncate">FI / CPV Verification</p>
              </div>
            </div>
            <button onClick={onClose} className="lg:hidden p-2 hover:bg-indigo-100 rounded-lg shrink-0">
              <X size={20} className="text-indigo-600" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-hide">
            {visibleItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group
                  ${isActive
                    ? 'bg-indigo-100 text-indigo-600 border-l-4 border-indigo-600'
                    : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 border-l-4 border-transparent'}
                `}
              >
                <Icon name={item.icon} size={19} className="group-hover:scale-110 transition-transform" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="p-4 border-t border-indigo-200 bg-indigo-50 space-y-3">
            <div className="text-xs">
              <p className="font-semibold text-gray-900 truncate">{user?.name}</p>
              <p className="text-slate-500">{ROLE_LABELS[user?.role] || user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-500 hover:text-white transition-all font-semibold shadow-sm"
            >
              <LogOutIcon size={18} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
