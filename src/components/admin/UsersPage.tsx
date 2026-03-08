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
        <h1 className="text-xl font-bold text-gray-800">👥 Správa používateľov</h1>
        <p className="text-sm text-gray-500">
          Pozvania, prístupy a roly
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab('users')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            tab === 'users' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          👤 Používatelia ({users.length})
        </button>
        <button
          onClick={() => setTab('invitations')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            tab === 'invitations'
              ? 'bg-white text-gray-800 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📩 Pozvánky ({pending.length} aktívnych)
        </button>
      </div>

      {/* Users tab */}
      {tab === 'users' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Meno</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Rola</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Registrovaný</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 w-16">Akcie</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {user.name}
                    {user.id === currentUser?.id && (
                      <span className="ml-2 text-xs text-green-600 font-normal">(ja)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-sm">{user.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        user.role === 'admin'
                          ? 'bg-purple-50 text-purple-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {user.role === 'admin' ? '👑 Admin' : '👤 User'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
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
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-300 hover:text-red-500 transition-colors"
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
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-700 mb-4">Vytvoriť novú pozvánku</h3>
            <form onSubmit={handleCreateInvite} className="flex gap-3 items-end flex-wrap">
              <div className="flex-1 min-w-[180px]">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Email (voliteľné)</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="kolega@sanfog.sk"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Rola</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'admin' | 'user')}
                  className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="user">👤 User</option>
                  <option value="admin">👑 Admin</option>
                </select>
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors shadow-sm"
              >
                Vytvoriť pozvánku
              </button>
            </form>

            {newInvitation && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                <p className="text-xs font-semibold text-green-700 mb-3">
                  ✅ Pozvánka vytvorená! Zdieľajte tento kód:
                </p>
                <div className="flex items-center gap-4">
                  <code className="text-2xl font-mono font-bold text-green-800 tracking-[0.3em]">
                    {newInvitation.code}
                  </code>
                  <button
                    onClick={() => copyCode(newInvitation.code)}
                    className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-semibold transition-colors"
                  >
                    {copied === newInvitation.code ? '✓ Skopírované' : '📋 Kopírovať'}
                  </button>
                  <button
                    onClick={() => setNewInvitation(null)}
                    className="text-gray-400 hover:text-gray-600 text-xs"
                  >
                    Zavrieť
                  </button>
                </div>
                <p className="text-xs text-green-600 mt-2">
                  Rola: <strong>{newInvitation.role}</strong> · Platí do:{' '}
                  {new Date(newInvitation.expiresAt).toLocaleDateString('sk-SK')}
                </p>
              </div>
            )}
          </div>

          {pending.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                  Aktívne pozvánky ({pending.length})
                </h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Kód</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Email</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Rola</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Platí do</th>
                    <th className="text-center px-4 py-2 text-xs font-semibold text-gray-500 w-20">Akcie</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map((inv) => (
                    <tr key={inv.code} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <code className="font-mono font-bold text-gray-800 tracking-wider">{inv.code}</code>
                          <button
                            onClick={() => copyCode(inv.code)}
                            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                            title="Kopírovať kód"
                          >
                            {copied === inv.code ? '✓' : '📋'}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-gray-600 text-xs">
                        {inv.email || <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${inv.role === 'admin' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                          {inv.role}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-500 text-xs">
                        {new Date(inv.expiresAt).toLocaleDateString('sk-SK')}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <button
                          onClick={() => { if (window.confirm('Zrušiť túto pozvánku?')) revokeInvitation(inv.code); }}
                          className="text-xs text-red-400 hover:text-red-600 transition-colors"
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
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm opacity-60">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Použité / Vypršané ({archived.length})
                </h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-400">Kód</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-400">Stav</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-400">Dátum</th>
                  </tr>
                </thead>
                <tbody>
                  {archived.map((inv) => (
                    <tr key={inv.code} className="border-b border-gray-100">
                      <td className="px-4 py-2 font-mono text-xs text-gray-400">{inv.code}</td>
                      <td className="px-4 py-2 text-xs">
                        {inv.usedAt ? <span className="text-green-600">✓ Použitá</span> : <span className="text-gray-400">Vypršaná</span>}
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-400">
                        {inv.usedAt ? new Date(inv.usedAt).toLocaleDateString('sk-SK') : new Date(inv.expiresAt).toLocaleDateString('sk-SK')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {invitations.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <p className="text-gray-400 text-sm">Zatiaľ žiadne pozvánky</p>
              <p className="text-gray-300 text-xs mt-1">Vytvorte pozvánku vyššie a zdieľajte kód s kolegom</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
