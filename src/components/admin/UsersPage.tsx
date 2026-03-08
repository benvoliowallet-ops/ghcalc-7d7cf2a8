import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import type { Invitation } from '../../types';

type Tab = 'users' | 'invitations';

export function UsersPage() {
  const { users, invitations, currentUser, createInvitation, revokeInvitation, deleteUser } =
    useAuthStore();

  const [tab, setTab] = useState<Tab>('users');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'user'>('user');
  const [copied, setCopied] = useState<string | null>(null);
  const [newInvitation, setNewInvitation] = useState<Invitation | null>(null);

  const handleCreateInvite = (e: React.FormEvent) => {
    e.preventDefault();
    const inv = createInvitation(inviteEmail.trim(), inviteRole);
    if (inv) {
      setNewInvitation(inv);
      setInviteEmail('');
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(code);
      setTimeout(() => setCopied(null), 2500);
    });
  };

  const now = new Date();
  const pending = invitations.filter((i) => !i.usedAt && new Date(i.expiresAt) > now);
  const archived = invitations.filter((i) => i.usedAt || new Date(i.expiresAt) <= now);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground uppercase tracking-wide">👥 Správa používateľov</h1>
        <p className="text-sm text-muted-foreground">
          Pozvania, prístupy a roly
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border border-border bg-muted p-1 w-fit" style={{ borderRadius: 'var(--radius)' }}>
        <button
          onClick={() => setTab('users')}
          className={`px-4 py-2 text-sm font-semibold transition-colors`}
          style={{
            borderRadius: 'var(--radius)',
            backgroundColor: tab === 'users' ? 'hsl(var(--card))' : 'transparent',
            color: tab === 'users' ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
            boxShadow: tab === 'users' ? '0 1px 3px hsl(var(--navy) / 0.08)' : 'none',
          }}
        >
          👤 Používatelia ({users.length})
        </button>
        <button
          onClick={() => setTab('invitations')}
          className={`px-4 py-2 text-sm font-semibold transition-colors`}
          style={{
            borderRadius: 'var(--radius)',
            backgroundColor: tab === 'invitations' ? 'hsl(var(--card))' : 'transparent',
            color: tab === 'invitations' ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
            boxShadow: tab === 'invitations' ? '0 1px 3px hsl(var(--navy) / 0.08)' : 'none',
          }}
        >
          📩 Pozvánky ({pending.length} aktívnych)
        </button>
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
                    {user.id === currentUser?.id && (
                      <span className="ml-2 text-xs text-teal font-normal">(ja)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-sm">{user.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        user.role === 'admin'
                          ? 'bg-orange/10 text-orange'
                          : 'bg-primary/10 text-primary'
                      }`}
                    >
                      {user.role === 'admin' ? '👑 Admin' : '👤 User'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(user.createdAt).toLocaleDateString('sk-SK')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {user.id !== currentUser?.id && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Vymazať používateľa „${user.name}"?\nTáto akcia je nevratná.`)) {
                            deleteUser(user.id);
                          }
                        }}
                        className="p-1.5 hover:bg-destructive/10 text-destructive/40 hover:text-destructive transition-colors"
                        style={{ borderRadius: 'var(--radius)' }}
                        title="Vymazať používateľa"
                      >
                        🗑
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

          {/* Create invite form */}
          <div className="bg-card border border-border p-5 shadow-sm" style={{ borderRadius: 'var(--radius)' }}>
            <h3 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wide">Vytvoriť novú pozvánku</h3>
            <form onSubmit={handleCreateInvite} className="flex gap-3 items-end flex-wrap">
              <div className="flex-1 min-w-[180px]">
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Email (voliteľné)</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="kolega@sanfog.sk"
                  className="w-full px-3 py-2 border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                  style={{ borderRadius: 'var(--radius)' }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Rola</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'admin' | 'user')}
                  className="px-3 py-2 border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                  style={{ borderRadius: 'var(--radius)' }}
                >
                  <option value="user">👤 User</option>
                  <option value="admin">👑 Admin</option>
                </select>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold transition-colors shadow-sm"
                style={{ borderRadius: 'var(--radius)' }}
              >
                Vytvoriť pozvánku
              </button>
            </form>

            {newInvitation && (
              <div className="mt-4 p-4 bg-primary/5 border border-primary/20" style={{ borderRadius: 'var(--radius)' }}>
                <p className="text-xs font-semibold text-primary mb-3">
                  ✅ Pozvánka vytvorená! Zdieľajte tento kód:
                </p>
                <div className="flex items-center gap-4">
                  <code className="text-2xl font-mono font-bold text-foreground tracking-[0.3em]">
                    {newInvitation.code}
                  </code>
                  <button
                    onClick={() => copyCode(newInvitation.code)}
                    className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold transition-colors"
                    style={{ borderRadius: 'var(--radius)' }}
                  >
                    {copied === newInvitation.code ? '✓ Skopírované' : '📋 Kopírovať'}
                  </button>
                  <button
                    onClick={() => setNewInvitation(null)}
                    className="text-muted-foreground hover:text-foreground text-xs transition-colors"
                  >
                    Zavrieť
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Rola: <strong className="text-foreground">{newInvitation.role}</strong> · Platí do:{' '}
                  {new Date(newInvitation.expiresAt).toLocaleDateString('sk-SK')}
                </p>
              </div>
            )}
          </div>

          {pending.length > 0 && (
            <div className="bg-card border border-border overflow-hidden shadow-sm" style={{ borderRadius: 'var(--radius)' }}>
              <div className="px-4 py-3 bg-muted border-b border-border">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  Aktívne pozvánky ({pending.length})
                </h3>
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
                    <tr key={inv.code} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <code className="font-mono font-bold text-foreground tracking-wider">{inv.code}</code>
                          <button
                            onClick={() => copyCode(inv.code)}
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                            title="Kopírovať kód"
                          >
                            {copied === inv.code ? '✓' : '📋'}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground text-xs">
                        {inv.email || <span className="text-border">—</span>}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${inv.role === 'admin' ? 'bg-orange/10 text-orange' : 'bg-primary/10 text-primary'}`}>
                          {inv.role}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground text-xs">
                        {new Date(inv.expiresAt).toLocaleDateString('sk-SK')}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <button
                          onClick={() => { if (window.confirm('Zrušiť túto pozvánku?')) revokeInvitation(inv.code); }}
                          className="text-xs text-destructive/60 hover:text-destructive transition-colors"
                        >
                          Zrušiť
                        </button>
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
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                  Použité / Vypršané ({archived.length})
                </h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Kód</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Stav</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Dátum</th>
                  </tr>
                </thead>
                <tbody>
                  {archived.map((inv) => (
                    <tr key={inv.code} className="border-b border-border">
                      <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{inv.code}</td>
                      <td className="px-4 py-2 text-xs">
                        {inv.usedAt ? <span className="text-teal">✓ Použitá</span> : <span className="text-muted-foreground">Vypršaná</span>}
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">
                        {inv.usedAt ? new Date(inv.usedAt).toLocaleDateString('sk-SK') : new Date(inv.expiresAt).toLocaleDateString('sk-SK')}
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
              <p className="text-muted-foreground/50 text-xs mt-1">Vytvorte pozvánku vyššie a zdieľajte kód s kolegom</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
