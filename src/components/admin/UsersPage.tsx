import { useState, useEffect } from 'react';
import { Trash2, Users, Mail, Crown, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '../../store/authStore';
import { useConfirm } from '../../hooks/useConfirm';
import type { AppUser } from '../../store/authStore';

interface InviteRow {
  id: string;
  code: string;
  email: string;
  role: 'admin' | 'user';
  created_by: string;
  created_at: string;
  expires_at: string;
  used_at: string | null;
  used_by: string | null;
}

interface ProfileRow {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  created_at: string;
}

type Tab = 'users' | 'invitations';

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export function UsersPage() {
  const { currentUser } = useAuthStore();
  const confirm = useConfirm();
  const [tab, setTab] = useState<Tab>('users');
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [invitations, setInvitations] = useState<InviteRow[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'user'>('user');
  const [copied, setCopied] = useState<string | null>(null);
  const [newInvCode, setNewInvCode] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadUsers = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at');
    if (data) setUsers(data as ProfileRow[]);
  };

  const loadInvitations = async () => {
    const { data } = await supabase.from('invitations').select('*').order('created_at', { ascending: false });
    if (data) setInvitations(data as InviteRow[]);
  };

  useEffect(() => {
    loadUsers();
    loadInvitations();
  }, []);

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase.from('invitations').insert({
      code,
      email: inviteEmail.trim(),
      role: inviteRole,
      created_by: currentUser.id,
      expires_at: expiresAt,
    });

    if (!error) {
      setNewInvCode(code);
      setInviteEmail('');
      loadInvitations();
    }
  };

  const handleRevokeInvitation = async (id: string) => {
    const ok = await confirm({
      title: 'Zrušiť pozvánku?',
      description: 'Pozvánka bude deaktivovaná.',
      confirmLabel: 'Zrušiť pozvánku',
      variant: 'destructive',
    });
    if (!ok) return;
    await supabase.from('invitations').delete().eq('id', id);
    loadInvitations();
  };

  const handleDeleteUser = async (id: string, name: string) => {
    const ok = await confirm({
      title: `Vymazať používateľa „${name}"?`,
      description: 'Táto akcia je nevratná. Používateľ stratí prístup do systému.',
      confirmLabel: 'Vymazať',
      variant: 'destructive',
    });
    if (!ok) return;

    setDeleteError(null);

    // S1 FIX: use supabase.functions.invoke instead of raw fetch
    const { error } = await supabase.functions.invoke('delete-user', {
      body: { userId: id },
    });

    if (error) {
      // U1 FIX: show error message to user in UI
      setDeleteError(`Chyba: ${error.message ?? 'Nepodarilo sa vymazať používateľa'}`);
      return;
    }

    loadUsers();
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(code);
      setTimeout(() => setCopied(null), 2500);
    });
  };

  const now = new Date();
  const pending = invitations.filter((i) => !i.used_at && new Date(i.expires_at) > now);
  const archived = invitations.filter((i) => i.used_at || new Date(i.expires_at) <= now);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Users className="w-5 h-5 text-foreground" />
          <h1 className="text-xl font-bold text-foreground uppercase tracking-wide">Správa používateľov</h1>
        </div>
        <p className="text-sm text-muted-foreground">Pozvania, prístupy a roly</p>
      </div>

      {deleteError && (
        <div className="mb-4 px-4 py-3 bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-lg flex items-center justify-between">
          <span>{deleteError}</span>
          <button onClick={() => setDeleteError(null)} className="text-destructive/60 hover:text-destructive ml-4">✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border border-border bg-muted p-1 w-fit" style={{ borderRadius: 'var(--radius)' }}>
        {(['users', 'invitations'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-2 text-sm font-semibold transition-colors flex items-center gap-1.5"
            style={{
              borderRadius: 'var(--radius)',
              backgroundColor: tab === t ? 'hsl(var(--card))' : 'transparent',
              color: tab === t ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
              boxShadow: tab === t ? '0 1px 3px hsl(var(--navy) / 0.08)' : 'none',
            }}
          >
            {t === 'users' ? (
              <><User className="w-3.5 h-3.5" /> Používatelia ({users.length})</>
            ) : (
              <><Mail className="w-3.5 h-3.5" /> Pozvánky ({pending.length} aktívnych)</>
            )}
          </button>
        ))}
      </div>

      {/* Users tab */}
      {tab === 'users' && (
        <div className="bg-card border border-border overflow-hidden shadow-sm" style={{ borderRadius: 'var(--radius)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Meno</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Rola</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Registrovaný</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground w-16">Akcie</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">
                    {user.name}
                    {user.id === currentUser?.id && <span className="ml-2 text-xs text-teal font-normal">(ja)</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-sm">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${user.role === 'admin' ? 'bg-orange/10 text-orange' : 'bg-primary/10 text-primary'}`}>
                      {user.role === 'admin' ? <><Crown className="w-3 h-3" /> Admin</> : <><User className="w-3 h-3" /> User</>}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(user.created_at).toLocaleDateString('sk-SK')}</td>
                  <td className="px-4 py-3 text-center">
                    {user.id !== currentUser?.id && (
                      <button
                        onClick={() => handleDeleteUser(user.id, user.name)}
                        className="p-1.5 hover:bg-destructive/10 text-destructive/40 hover:text-destructive transition-colors"
                        style={{ borderRadius: 'var(--radius)' }}
                        title="Vymazať používateľa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Invitations tab */}
      {tab === 'invitations' && (
        <div className="space-y-6">
          <div className="bg-card border border-border p-5 shadow-sm" style={{ borderRadius: 'var(--radius)' }}>
            <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wide">Vytvoriť novú pozvánku</h3>
            <form onSubmit={handleCreateInvite} className="flex gap-3 items-end flex-wrap">
              <div className="flex-1 min-w-[180px]">
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Email (voliteľné)</label>
                <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="kolega@sanfog.sk" className="w-full px-3 py-2 border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" style={{ borderRadius: 'var(--radius)' }} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Rola</label>
                <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as 'admin' | 'user')} className="px-3 py-2 border border-border bg-background text-foreground text-sm focus:outline-none" style={{ borderRadius: 'var(--radius)' }}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button type="submit" className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold transition-colors shadow-sm" style={{ borderRadius: 'var(--radius)' }}>
                Vytvoriť pozvánku
              </button>
            </form>

            {newInvCode && (
              <div className="mt-4 p-4 bg-primary/5 border border-primary/20" style={{ borderRadius: 'var(--radius)' }}>
                <p className="text-xs font-semibold text-primary mb-3">✅ Pozvánka vytvorená! Zdieľajte tento kód:</p>
                <div className="flex items-center gap-4">
                  <code className="text-2xl font-mono font-bold text-foreground tracking-[0.3em]">{newInvCode}</code>
                  <button onClick={() => copyCode(newInvCode)} className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold transition-colors" style={{ borderRadius: 'var(--radius)' }}>
                    {copied === newInvCode ? '✓ Skopírované' : 'Kopírovať'}
                  </button>
                  <button onClick={() => setNewInvCode(null)} className="text-muted-foreground hover:text-foreground text-xs">Zavrieť</button>
                </div>
              </div>
            )}
          </div>

          {pending.length > 0 && (
            <div className="bg-card border border-border overflow-hidden shadow-sm" style={{ borderRadius: 'var(--radius)' }}>
              <div className="px-4 py-3 bg-muted border-b border-border">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Aktívne pozvánky ({pending.length})</h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Kód</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Email</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Rola</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Platí do</th>
                    <th className="text-center px-4 py-2 text-xs font-semibold text-muted-foreground w-20">Akcie</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map((inv) => (
                    <tr key={inv.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <code className="font-mono font-bold text-foreground tracking-wider">{inv.code}</code>
                          <button onClick={() => copyCode(inv.code)} className="text-xs text-muted-foreground hover:text-foreground">
                            {copied === inv.code ? '✓' : '⎘'}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground text-xs">{inv.email || <span className="text-border">—</span>}</td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${inv.role === 'admin' ? 'bg-orange/10 text-orange' : 'bg-primary/10 text-primary'}`}>{inv.role}</span>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground text-xs">{new Date(inv.expires_at).toLocaleDateString('sk-SK')}</td>
                      <td className="px-4 py-2.5 text-center">
                        <button onClick={() => handleRevokeInvitation(inv.id)} className="text-xs text-destructive/60 hover:text-destructive transition-colors">Zrušiť</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {archived.length > 0 && (
            <div className="bg-card border border-border overflow-hidden shadow-sm opacity-60" style={{ borderRadius: 'var(--radius)' }}>
              <div className="px-4 py-3 bg-muted border-b border-border">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Použité / Vypršané ({archived.length})</h3>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {archived.map((inv) => (
                    <tr key={inv.id} className="border-b border-border">
                      <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{inv.code}</td>
                      <td className="px-4 py-2 text-xs">
                        {inv.used_at ? <span className="text-teal">✓ Použitá</span> : <span className="text-muted-foreground">Vypršaná</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {invitations.length === 0 && (
            <div className="bg-card border border-border p-12 text-center" style={{ borderRadius: 'var(--radius)' }}>
              <p className="text-muted-foreground text-sm">Zatiaľ žiadne pozvánky</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
