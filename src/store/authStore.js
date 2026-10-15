import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// user = { userId, name, role, email, phone, designation, telegramLinked }
// session = server-issued token (sliding 6h expiry, checked on every call)
const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      session: null,
      login: (user, session) => set({ user, session }),
      setUser: (user) => set({ user }),
      logout: () => set({ user: null, session: null }),
    }),
    { name: 'jl-cpv-auth' }
  )
);

export { useAuthStore };
