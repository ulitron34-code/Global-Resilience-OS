import { create } from 'zustand';
import { getCurrentUser, login, logout } from '../api/client';

export const useSessionStore = create((set) => ({
  user: (() => { try { return JSON.parse(localStorage.getItem('resilience_user') || 'null'); } catch { return null; } })(),
  isLoading: false,
  error: null,
  restore: async () => { set({ isLoading: true }); const user = await getCurrentUser(); set({ user, isLoading: false }); },
  signIn: async (email, password) => { set({ isLoading: true, error: null }); try { const session = await login(email, password); set({ user: session.user, isLoading: false }); return session.user; } catch { set({ error: 'Credenciales invalidas', isLoading: false }); return null; } },
  signOut: async () => { await logout().catch(() => {}); set({ user: null, error: null }); },
}));
