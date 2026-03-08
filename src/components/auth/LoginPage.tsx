import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import sanfogLogoWhite from '../../assets/sanfog-logo-white.svg';

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

    const ok = login(email.trim(), password);
    if (!ok) setError('Nesprávny email alebo heslo');
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setError('');
  };

  return (
    <div className="login-bg min-h-screen flex items-center justify-center p-4 relative overflow-hidden">

      {/* Decorative blobs */}
      <div
        className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, hsl(var(--teal) / 0.18) 0%, transparent 70%)',
          transform: 'translate(30%, -30%)',
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-80 h-80 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, hsl(var(--orange) / 0.12) 0%, transparent 70%)',
          transform: 'translate(-30%, 30%)',
        }}
      />

      <div className="w-full max-w-md relative z-10">

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-5 relative">
            {/* Glow halo behind logo */}
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse 120px 60px at center, hsl(var(--teal) / 0.2) 0%, transparent 70%)',
              }}
            />
            <img src={sanfogLogoWhite} alt="Sanfog" className="h-20 w-auto relative" />
          </div>
          <h1
            className="text-xl font-bold uppercase tracking-widest"
            style={{ color: 'hsl(var(--white))' }}
          >
            Greenhouse Calc
          </h1>
          {/* Teal accent line */}
          <div
            className="mx-auto mt-2 mb-2 h-px w-16"
            style={{ background: 'linear-gradient(90deg, transparent, hsl(var(--teal)), transparent)' }}
          />
          <p
            className="text-xs tracking-wide uppercase font-medium"
            style={{ color: 'hsl(var(--teal) / 0.8)' }}
          >
            Interný BOM kalkulátor
          </p>
        </div>

        {/* Card */}
        <div className="login-card overflow-hidden" style={{ borderRadius: 'calc(var(--radius) + 4px)' }}>

          {/* Bootstrap banner */}
          {isBootstrap && (
            <div
              className="px-6 py-4 border-b"
              style={{
                background: 'hsl(var(--orange) / 0.1)',
                borderColor: 'hsl(var(--orange) / 0.25)',
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span style={{ color: 'hsl(var(--orange))' }} className="text-lg">★</span>
                <p className="text-sm font-bold" style={{ color: 'hsl(var(--white))' }}>
                  Prvotné nastavenie systému
                </p>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'hsl(var(--white) / 0.5)' }}>
                Systém nemá žiadnych používateľov. Vytvorte prvý administrátorský účet.
              </p>
            </div>
          )}

          {/* Tabs */}
          {!isBootstrap && (
            <div
              className="flex border-b"
              style={{ borderColor: 'hsl(var(--teal) / 0.2)' }}
            >
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="flex-1 py-3 text-sm font-semibold uppercase tracking-wide transition-colors"
                style={{
                  color: mode === 'login' ? 'hsl(var(--teal))' : 'hsl(var(--white) / 0.4)',
                  borderBottom: mode === 'login' ? '2px solid hsl(var(--teal))' : '2px solid transparent',
                  background: 'transparent',
                }}
              >
                Prihlásiť sa
              </button>
              <button
                type="button"
                onClick={() => switchMode('register')}
                className="flex-1 py-3 text-sm font-semibold uppercase tracking-wide transition-colors"
                style={{
                  color: mode === 'register' ? 'hsl(var(--teal))' : 'hsl(var(--white) / 0.4)',
                  borderBottom: mode === 'register' ? '2px solid hsl(var(--teal))' : '2px solid transparent',
                  background: 'transparent',
                }}
              >
                Registrovať
              </button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">

            {/* Invite code */}
            {!isBootstrap && mode === 'register' && (
              <div>
                <label
                  className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                  style={{ color: 'hsl(var(--teal) / 0.8)' }}
                >
                  Kód pozvánky
                </label>
                <input
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="XXXXXXXX"
                  maxLength={8}
                  required
                  className="login-input w-full px-3 py-2.5 text-sm font-mono tracking-widest text-center uppercase"
                  style={{ borderRadius: 'var(--radius)' }}
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label
                className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                style={{ color: 'hsl(var(--teal) / 0.8)' }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="meno@sanfog.sk"
                required
                autoComplete="email"
                className="login-input w-full px-3 py-2.5 text-sm"
                style={{ borderRadius: 'var(--radius)' }}
              />
            </div>

            {/* Name */}
            {isRegister && (
              <div>
                <label
                  className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                  style={{ color: 'hsl(var(--teal) / 0.8)' }}
                >
                  Meno a priezvisko
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ján Novák"
                  required
                  className="login-input w-full px-3 py-2.5 text-sm"
                  style={{ borderRadius: 'var(--radius)' }}
                />
              </div>
            )}

            {/* Password */}
            <div>
              <label
                className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
                style={{ color: 'hsl(var(--teal) / 0.8)' }}
              >
                Heslo
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                className="login-input w-full px-3 py-2.5 text-sm"
                style={{ borderRadius: 'var(--radius)' }}
              />
              {isRegister && (
                <p className="text-xs mt-1" style={{ color: 'hsl(var(--white) / 0.35)' }}>
                  Minimálne 6 znakov
                </p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div
                className="px-3 py-2 text-xs border"
                style={{
                  borderRadius: 'var(--radius)',
                  background: 'hsl(var(--destructive) / 0.15)',
                  borderColor: 'hsl(var(--destructive) / 0.4)',
                  color: 'hsl(0 80% 75%)',
                }}
              >
                ⚠️ {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-2.5 text-sm font-bold uppercase tracking-widest transition-all"
              style={{
                borderRadius: 'var(--radius)',
                background: 'linear-gradient(135deg, hsl(var(--teal)), hsl(190 100% 30%))',
                color: 'hsl(var(--white))',
                boxShadow: '0 4px 20px hsl(var(--teal) / 0.3)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 28px hsl(var(--teal) / 0.5)';
                (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.1)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 20px hsl(var(--teal) / 0.3)';
                (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1)';
              }}
            >
              {isBootstrap
                ? 'Vytvoriť admin účet'
                : mode === 'login'
                ? 'Prihlásiť sa →'
                : 'Zaregistrovať sa ✓'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-center gap-1.5 mt-6 text-xs"
          style={{ color: 'hsl(var(--white) / 0.2)' }}
        >
          <span>made by VORA · v12</span>
        </div>
      </div>
    </div>
  );
}
