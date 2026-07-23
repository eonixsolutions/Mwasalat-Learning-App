import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useMwasalatAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      setAuth: (user, accessToken, isNewUser = false) => set({ user: { ...user, isNewUser }, accessToken, isAuthenticated: true }),
      updateUser: (patch) => set((state) => ({ user: state.user ? { ...state.user, ...patch } : state.user })),
      logout: () => set({ user: null, accessToken: null, isAuthenticated: false }),
    }),
    { name: 'mwasalat-auth' }
  )
);
