import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => set(() => ({ user, token, isAuthenticated: true })),
      logout: () => set(() => ({ user: null, token: null, isAuthenticated: false })),
      checkAuth: () => {
        const { token } = get();
        return !!token;
      },
      getAuthHeaders: () => {
        const { token } = get();
        return token ? { Authorization: `Bearer ${token}` } : {};
      }
    }),
    {
      name: 'queue-md-auth', // localStorage key persists the state securely
    }
  )
);
