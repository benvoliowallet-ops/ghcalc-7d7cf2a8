import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';

type Mode = 'login' | 'register';

export function LoginPage() {
  const { users, login, registerWithInvite, bootstrapAdmin } = useAuthStore();
  const isBootstrap = users.length === 0;

  const [mode, setMode] = useState<Mode>('login');
  const [inviteCode, setInviteCode] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const isRegister = isBootstrap || mode === 'register';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isBootstrap) {
      bootstrapAdmin(email.trim(), name.trim(), password);
      return;
    }

    if (mode === 'register') {
      const result = registerWithInvite(
        inviteCode.trim().toUpperCase(),
        email.trim(),
        name.trim(),
        password
      );
      if (!result.ok) setError(result.error ?? 'Chyba registrácie');
      return;
    }

    // login
    const ok = login(email.trim(), password);
    if (!ok) setError('Nesprávny email alebo heslo');
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logos */}
        <div className="text-center mb-8">
          <div className="h-12 mx-auto mb-4 flex items-center justify-center">
            <span className="text-green-600 font-bold text-3xl">🌿 Sanfog</span>
          </div>
          <h1 className="text-xl font-bold text-gray-800">Greenhouse Projekt</h1>
          <p className="text-sm text-gray-500">Interný BOM kalkulátor</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">

          {/* Bootstrap banner */}
          {isBootstrap && (
            <div className="px-6 py-4 bg-amber-50 border-b border-amber-200">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-amber-500 text-lg">🎉</span>
                <p className="text-sm font-bold text-amber-800">
                  Prvotné nastavenie systému
                </p>
              </div>
              <p className="text-xs text-amber-700 leading-relaxed">
                Systém nemá žiadnych používateľov. Vytvorte prvý administrátorský účet.
              </p>
            </div>
          )}

          {/* Tabs (only when not bootstrapping) */}
          {!isBootstrap && (
            <div className="flex border-b border-gray-100">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                  mode === 'login'
                    ? 'bg-white text-green-700 border-b-2 border-green-600'
                    : 'bg-gray-50 text-gray-400 hover:text-gray-600'
                }`}
              >
                Prihlásiť sa
              </button>
              <button
                type="button"
                onClick={() => switchMode('register')}
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                  mode === 'register'
                    ? 'bg-white text-green-700 border-b-2 border-green-600'
                    : 'bg-gray-50 text-gray-400 hover:text-gray-600'
                }`}
              >
                📩 Registrovať s pozvánkou
              </button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">

            {/* Invite code – only on register mode */}
            {!isBootstrap && mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Kód pozvánky
                </label>
                <input
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="XXXXXXXX"
                  maxLength={8}
                  required
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm font-mono tracking-widest text-center uppercase focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="meno@sanfog.sk"
                required
                autoComplete="email"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Name – only on register / bootstrap */}
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Meno a priezvisko
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ján Novák"
                  required
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Heslo</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              {isRegister && (
                <p className="text-xs text-gray-400 mt-1">Minimálne 6 znakov</p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                ⚠️ {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors shadow-sm"
            >
              {isBootstrap
                ? '🚀 Vytvoriť admin účet a prihlásiť sa'
                : mode === 'login'
                ? '→ Prihlásiť sa'
                : '✓ Zaregistrovať sa'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-1.5 mt-6 text-xs text-gray-400">
          <span>made by VORA · v12</span>
        </div>
      </div>
    </div>
  );
}
