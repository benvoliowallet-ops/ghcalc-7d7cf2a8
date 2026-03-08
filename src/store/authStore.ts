import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Invitation } from '../types';

function hashPassword(password: string): string {
  const salted = `greenhouse_${password}_snfg2026`;
  let h = 5381;
  for (let i = 0; i < salted.length; i++) {
    h = ((h << 5) + h) ^ salted.charCodeAt(i);
    h = h >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 8 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}

interface AuthStore {
  users: User[];
  invitations: Invitation[];
  currentUser: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  bootstrapAdmin: (email: string, name: string, password: string) => void;
  registerWithInvite: (code: string, email: string, name: string, password: string) => { ok: boolean; error?: string };
  createInvitation: (email: string, role: 'admin' | 'user') => Invitation | null;
  revokeInvitation: (code: string) => void;
  deleteUser: (id: string) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      users: [],
      invitations: [],
      currentUser: null,

      login: (email, password) => {
        const user = get().users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!user) return false;
        if (user.passwordHash !== hashPassword(password)) return false;
        set({ currentUser: user });
        return true;
      },

      logout: () => set({ currentUser: null }),

      bootstrapAdmin: (email, name, password) => {
        if (get().users.length > 0) return;
        const admin: User = {
          id: crypto.randomUUID(),
          email,
          name,
          role: 'admin',
          passwordHash: hashPassword(password),
          createdAt: new Date().toISOString(),
        };
        set({ users: [admin], currentUser: admin });
      },

      registerWithInvite: (code, email, name, password) => {
        const inv = get().invitations.find(i => i.code === code);
        if (!inv) return { ok: false, error: 'Pozvánka nenájdená' };
        if (inv.usedAt) return { ok: false, error: 'Pozvánka už bola použitá' };
        if (new Date(inv.expiresAt) < new Date()) return { ok: false, error: 'Platnosť pozvánky vypršala' };
        if (get().users.find(u => u.email.toLowerCase() === email.toLowerCase()))
          return { ok: false, error: 'Tento email je už zaregistrovaný' };
        const newUser: User = {
          id: crypto.randomUUID(),
          email,
          name,
          role: inv.role,
          passwordHash: hashPassword(password),
          createdAt: new Date().toISOString(),
        };
        set(s => ({
          users: [...s.users, newUser],
          invitations: s.invitations.map(i =>
            i.code === code ? { ...i, usedAt: new Date().toISOString(), usedBy: newUser.id } : i
          ),
          currentUser: newUser,
        }));
        return { ok: true };
      },

      createInvitation: (email, role) => {
        const me = get().currentUser;
        if (!me || me.role !== 'admin') return null;
        const inv: Invitation = {
          code: generateCode(),
          email,
          role,
          createdBy: me.id,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        };
        set(s => ({ invitations: [...s.invitations, inv] }));
        return inv;
      },

      revokeInvitation: (code) => {
        set(s => ({ invitations: s.invitations.filter(i => i.code !== code) }));
      },

      deleteUser: (id) => {
        const s = get();
        const target = s.users.find(u => u.id === id);
        if (!target) return;
        if (target.role === 'admin' && s.users.filter(u => u.role === 'admin').length === 1) return;
        set({
          users: s.users.filter(u => u.id !== id),
          currentUser: s.currentUser?.id === id ? null : s.currentUser,
        });
      },
    }),
    { name: 'greenhouse-auth' }
  )
);
