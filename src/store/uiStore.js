import { create } from 'zustand';

// Light/dark theme preference, persisted in localStorage and applied by
// toggling the `.dark` class on <html>. main.jsx applies the saved value
// before first paint to avoid a flash.
const KEY = 'sheet-app-theme';

const prefersDark = () => {
  try { return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches; }
  catch (e) { return false; }
};

const initialDark = (() => {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) return saved === 'dark';
  } catch (e) { /* ignore */ }
  return prefersDark();
})();

const applyClass = (dark) => {
  if (typeof document !== 'undefined') document.documentElement.classList.toggle('dark', !!dark);
};

const useUIStore = create((set, get) => ({
  dark: initialDark,
  toggleDark: () => {
    const dark = !get().dark;
    try { localStorage.setItem(KEY, dark ? 'dark' : 'light'); } catch (e) { /* ignore */ }
    applyClass(dark);
    set({ dark });
  },
}));

export { useUIStore };
