import { create } from 'zustand';
import { api } from '../utils/api';

// Small shared caches: masters, settings, the case list.
const useDataStore = create((set, get) => ({
  masters: {},          // { Clients: [...], Branches: [...] }
  settings: null,       // firm letterhead, disclaimer, TAT hours, ...
  cases: [],
  casesLoaded: false,
  casesLoading: false,

  loadMaster: async (sheet, force = false) => {
    if (!force && get().masters[sheet]) return get().masters[sheet];
    const res = await api.listMaster(sheet);
    set((s) => ({ masters: { ...s.masters, [sheet]: res.rows || [] } }));
    return res.rows || [];
  },

  loadSettings: async (force = false) => {
    if (!force && get().settings) return get().settings;
    const res = await api.getSettings();
    set({ settings: res.settings });
    return res.settings;
  },
  setSettings: (settings) => set({ settings }),

  loadCases: async () => {
    set({ casesLoading: true });
    try {
      const res = await api.listCases();
      set({ cases: res.rows || [], casesLoaded: true });
      return res.rows || [];
    } finally {
      set({ casesLoading: false });
    }
  },
}));

export { useDataStore };
