import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
}

interface AuthStore {
  currentUser: AppUser | null;
  loading: boolean;
  setCurrentUser: (user: AppUser | null) => void;
  setLoading: (loading: boolean) => void;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  registerWithInvite: (code: string, email: string, name: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  bootstrapAdmin: (email: string, name: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  loadProfile: (user: SupabaseUser) => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  currentUser: null,
  loading: true,

  setCurrentUser: (user) => set({ currentUser: user }),
  setLoading: (loading) => set({ loading }),

  loadProfile: async (user: SupabaseUser) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, name, role')
        .eq('id', user.id)
        .maybeSingle();

      if (error || !data) {
        console.error('[Auth] Failed to load profile:', error?.message);
        set({ currentUser: null, loading: false });
        return;
      }

      set({
        currentUser: {
          id: data.id,
          email: data.email,
          name: data.name,
          role: data.role as 'admin' | 'user',
        },
        loading: false,
      });
    } catch (e) {
      console.error('[Auth] loadProfile exception:', e);
      set({ currentUser: null, loading: false });
    }
  },

  // onAuthStateChange in App.tsx is the single source of truth.
  // These functions only trigger the auth event; profile loading happens via the listener.
  login: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: 'Nesprávny email alebo heslo' };
    return { ok: true };
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ currentUser: null, loading: false });
  },

  bootstrapAdmin: async (email, name, password) => {
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if ((count ?? 0) > 0) return { ok: false, error: 'Systém už má používateľov' };

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, invited_role: 'admin' },
      },
    });

    if (error) return { ok: false, error: error.message };
    if (!data.user) return { ok: false, error: 'Registrácia zlyhala' };

    // Update role to admin — trigger creates the profile but with defaults
    await supabase
      .from('profiles')
      .update({ role: 'admin', name })
      .eq('id', data.user.id);

    // onAuthStateChange will fire and call loadProfile automatically
    return { ok: true };
  },

  registerWithInvite: async (code, email, name, password) => {
    const { data: inv, error: invErr } = await supabase
      .from('invitations')
      .select('*')
      .eq('code', code)
      .maybeSingle();

    if (invErr || !inv) return { ok: false, error: 'Pozvánka nenájdená' };
    if (inv.used_at) return { ok: false, error: 'Pozvánka už bola použitá' };
    if (new Date(inv.expires_at) < new Date()) return { ok: false, error: 'Platnosť pozvánky vypršala' };

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, invited_role: inv.role },
      },
    });

    if (error) return { ok: false, error: error.message };
    if (!data.user) return { ok: false, error: 'Registrácia zlyhala' };

    await supabase
      .from('profiles')
      .upsert({ id: data.user.id, email, name, role: inv.role });

    await supabase
      .from('invitations')
      .update({ used_at: new Date().toISOString(), used_by: data.user.id })
      .eq('code', code);

    // onAuthStateChange will fire and call loadProfile automatically
    return { ok: true };
  },
}));
