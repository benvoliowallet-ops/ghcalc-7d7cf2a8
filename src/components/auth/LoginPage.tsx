import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import sanfogLogoWhite from '../../assets/sanfog-logo-white.svg';

type Mode = 'login' | 'register';

function GreenhouseSVG({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 220 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      {/* Main body */}
      <rect x="10" y="80" width="200" height="75" rx="1" stroke="currentColor" strokeWidth="1.5" />
      {/* Roof peak */}
      <polyline points="10,80 110,20 210,80" stroke="currentColor" strokeWidth="1.5" />
      {/* Ridge line cap */}
      <line x1="110" y1="20" x2="110" y2="155" stroke="currentColor" strokeWidth="0.8" strokeDasharray="4 3" />
      {/* Horizontal panel lines on roof */}
      <line x1="35" y1="61" x2="185" y2="61" stroke="currentColor" strokeWidth="0.8" />
      <line x1="60" y1="44" x2="160" y2="44" stroke="currentColor" strokeWidth="0.8" />
      {/* Vertical panel lines on roof */}
      <line x1="60" y1="44" x2="35" y2="61" stroke="currentColor" strokeWidth="0.8" />
      <line x1="85" y1="30" x2="60" y2="61" stroke="currentColor" strokeWidth="0.8" />
      <line x1="135" y1="30" x2="160" y2="61" stroke="currentColor" strokeWidth="0.8" />
      <line x1="160" y1="44" x2="185" y2="61" stroke="currentColor" strokeWidth="0.8" />
      {/* Wall grid - horizontal */}
      <line x1="10" y1="107" x2="210" y2="107" stroke="currentColor" strokeWidth="0.8" />
      <line x1="10" y1="131" x2="210" y2="131" stroke="currentColor" strokeWidth="0.8" />
      {/* Wall grid - vertical */}
      <line x1="55" y1="80" x2="55" y2="155" stroke="currentColor" strokeWidth="0.8" />
      <line x1="110" y1="80" x2="110" y2="155" stroke="currentColor" strokeWidth="0.8" />
      <line x1="165" y1="80" x2="165" y2="155" stroke="currentColor" strokeWidth="0.8" />
      {/* Door */}
      <rect x="86" y="118" width="48" height="37" rx="1" stroke="currentColor" strokeWidth="1.2" />
      {/* Door handle */}
      <circle cx="126" cy="137" r="2" stroke="currentColor" strokeWidth="1" />
      {/* Gutter line */}
      <line x1="8" y1="80" x2="212" y2="80" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function SmallGreenhouseSVG({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 160 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <rect x="8" y="60" width="144" height="55" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <polyline points="8,60 80,15 152,60" stroke="currentColor" strokeWidth="1.5" />
      <line x1="80" y1="15" x2="80" y2="115" stroke="currentColor" strokeWidth="0.7" strokeDasharray="3 3" />
      <line x1="28" y1="46" x2="132" y2="46" stroke="currentColor" strokeWidth="0.7" />
      <line x1="48" y1="32" x2="112" y2="32" stroke="currentColor" strokeWidth="0.7" />
      <line x1="48" y1="32" x2="28" y2="46" stroke="currentColor" strokeWidth="0.7" />
      <line x1="80" y1="18" x2="64" y2="46" stroke="currentColor" strokeWidth="0.7" />
      <line x1="80" y1="18" x2="96" y2="46" stroke="currentColor" strokeWidth="0.7" />
      <line x1="112" y1="32" x2="132" y2="46" stroke="currentColor" strokeWidth="0.7" />
      <line x1="8" y1="82" x2="152" y2="82" stroke="currentColor" strokeWidth="0.7" />
      <line x1="8" y1="100" x2="152" y2="100" stroke="currentColor" strokeWidth="0.7" />
      <line x1="44" y1="60" x2="44" y2="115" stroke="currentColor" strokeWidth="0.7" />
      <line x1="80" y1="60" x2="80" y2="115" stroke="currentColor" strokeWidth="0.7" />
      <line x1="116" y1="60" x2="116" y2="115" stroke="currentColor" strokeWidth="0.7" />
      <rect x="60" y="90" width="40" height="25" rx="1" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  );
}

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
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'hsl(var(--navy))' }}
    >
      {/* Grid texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 49px, hsl(var(--white) / 0.03) 49px, hsl(var(--white) / 0.03) 50px),
            repeating-linear-gradient(90deg, transparent, transparent 49px, hsl(var(--white) / 0.03) 49px, hsl(var(--white) / 0.03) 50px)
          `,
        }}
      />

      {/* Orange glow top-right */}
      <div
        className="absolute top-0 right-0 w-[500px] h-[500px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, hsl(var(--orange) / 0.12) 0%, transparent 65%)',
          transform: 'translate(20%, -20%)',
        }}
      />

      {/* Subtle white glow bottom-left */}
      <div
        className="absolute bottom-0 left-0 w-96 h-96 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, hsl(var(--white) / 0.04) 0%, transparent 70%)',
          transform: 'translate(-30%, 30%)',
        }}
      />

      {/* Greenhouse decorations — background layer */}
      <GreenhouseSVG
        className="absolute pointer-events-none select-none"
        style={{
          width: 360,
          bottom: -20,
          right: -40,
          color: 'hsl(var(--white) / 0.06)',
          transform: 'rotate(-5deg)',
        }}
      />
      <SmallGreenhouseSVG
        className="absolute pointer-events-none select-none"
        style={{
          width: 200,
          top: 40,
          left: -20,
          color: 'hsl(var(--white) / 0.05)',
          transform: 'rotate(8deg)',
        }}
      />
      <SmallGreenhouseSVG
        className="absolute pointer-events-none select-none hidden md:block"
        style={{
          width: 140,
          bottom: 60,
          left: 60,
          color: 'hsl(var(--white) / 0.04)',
          transform: 'rotate(-3deg)',
        }}
      />

      <div className="w-full max-w-md relative z-10">

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-5 relative">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse 140px 70px at center, hsl(var(--orange) / 0.15) 0%, transparent 70%)',
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
          <div
            className="mx-auto mt-2 mb-2 h-px w-16"
            style={{ background: 'linear-gradient(90deg, transparent, hsl(var(--orange) / 0.7), transparent)' }}
          />
          <p
            className="text-xs tracking-wide uppercase font-medium"
            style={{ color: 'hsl(var(--white) / 0.45)' }}
          >
            Interný BOM kalkulátor
          </p>
        </div>

        {/* Card */}
        <div
          className="overflow-hidden"
          style={{
            borderRadius: 'calc(var(--radius) + 4px)',
            background: 'hsl(var(--white) / 0.05)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid hsl(var(--white) / 0.1)',
            boxShadow: '0 8px 40px hsl(var(--navy) / 0.8), 0 0 0 1px hsl(var(--white) / 0.05)',
          }}
        >
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
              <p className="text-xs leading-relaxed" style={{ color: 'hsl(var(--white) / 0.45)' }}>
                Systém nemá žiadnych používateľov. Vytvorte prvý administrátorský účet.
              </p>
            </div>
          )}

          {/* Tabs */}
          {!isBootstrap && (
            <div className="flex border-b" style={{ borderColor: 'hsl(var(--white) / 0.1)' }}>
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="flex-1 py-3 text-sm font-semibold uppercase tracking-wide transition-colors"
                style={{
                  color: mode === 'login' ? 'hsl(var(--white))' : 'hsl(var(--white) / 0.35)',
                  borderBottom: mode === 'login' ? '2px solid hsl(var(--orange))' : '2px solid transparent',
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
                  color: mode === 'register' ? 'hsl(var(--white))' : 'hsl(var(--white) / 0.35)',
                  borderBottom: mode === 'register' ? '2px solid hsl(var(--orange))' : '2px solid transparent',
                  background: 'transparent',
                }}
              >
                Registrovať
              </button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">

            {!isBootstrap && mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'hsl(var(--white) / 0.5)' }}>
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

            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'hsl(var(--white) / 0.5)' }}>
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

            {isRegister && (
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'hsl(var(--white) / 0.5)' }}>
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

            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'hsl(var(--white) / 0.5)' }}>
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
                <p className="text-xs mt-1" style={{ color: 'hsl(var(--white) / 0.3)' }}>
                  Minimálne 6 znakov
                </p>
              )}
            </div>

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

            <button
              type="submit"
              className="w-full py-2.5 text-sm font-bold uppercase tracking-widest transition-all"
              style={{
                borderRadius: 'var(--radius)',
                background: 'linear-gradient(135deg, hsl(var(--orange)), hsl(36 90% 36%))',
                color: 'hsl(var(--white))',
                boxShadow: '0 4px 20px hsl(var(--orange) / 0.35)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.1)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 28px hsl(var(--orange) / 0.55)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 20px hsl(var(--orange) / 0.35)';
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

        <div
          className="flex items-center justify-center gap-1.5 mt-6 text-xs"
          style={{ color: 'hsl(var(--white) / 0.18)' }}
        >
          <span>made by VORA · v12</span>
        </div>
      </div>
    </div>
  );
}
