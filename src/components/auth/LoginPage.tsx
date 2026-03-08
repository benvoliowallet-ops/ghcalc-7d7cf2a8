import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '@/integrations/supabase/client';
import sanfogLogoWhite from '../../assets/sanfog-logo-white.svg';

type Mode = 'login' | 'register';

/** Front-view greenhouse icon */
function GreenhouseIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 180 150" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
      <rect x="12" y="72" width="156" height="70" stroke="currentColor" strokeWidth="2" />
      <polygon points="12,72 90,16 90,72" stroke="currentColor" strokeWidth="2" fill="none" />
      <polygon points="90,16 168,72 90,72" stroke="currentColor" strokeWidth="2" fill="none" />
      <line x1="88" y1="16" x2="92" y2="16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="90" y1="16" x2="38" y2="72" stroke="currentColor" strokeWidth="0.9" />
      <line x1="90" y1="16" x2="56" y2="72" stroke="currentColor" strokeWidth="0.9" />
      <line x1="90" y1="16" x2="74" y2="72" stroke="currentColor" strokeWidth="0.9" />
      <line x1="24" y1="64" x2="90" y2="64" stroke="currentColor" strokeWidth="0.8" />
      <line x1="40" y1="51" x2="90" y2="51" stroke="currentColor" strokeWidth="0.8" />
      <line x1="60" y1="36" x2="90" y2="36" stroke="currentColor" strokeWidth="0.8" />
      <line x1="90" y1="16" x2="106" y2="72" stroke="currentColor" strokeWidth="0.9" />
      <line x1="90" y1="16" x2="124" y2="72" stroke="currentColor" strokeWidth="0.9" />
      <line x1="90" y1="16" x2="142" y2="72" stroke="currentColor" strokeWidth="0.9" />
      <line x1="90" y1="64" x2="156" y2="64" stroke="currentColor" strokeWidth="0.8" />
      <line x1="90" y1="51" x2="140" y2="51" stroke="currentColor" strokeWidth="0.8" />
      <line x1="90" y1="36" x2="120" y2="36" stroke="currentColor" strokeWidth="0.8" />
      <line x1="44" y1="72" x2="44" y2="142" stroke="currentColor" strokeWidth="1.2" />
      <line x1="90" y1="72" x2="90" y2="142" stroke="currentColor" strokeWidth="1.2" />
      <line x1="136" y1="72" x2="136" y2="142" stroke="currentColor" strokeWidth="1.2" />
      <line x1="12" y1="107" x2="168" y2="107" stroke="currentColor" strokeWidth="1" />
      <rect x="72" y="115" width="36" height="27" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <line x1="90" y1="115" x2="90" y2="142" stroke="currentColor" strokeWidth="0.8" />
      <circle cx="100" cy="129" r="2" stroke="currentColor" strokeWidth="1" />
      <path d="M30 104 Q26 97 22 99 Q26 91 32 95 Q30 88 36 86 Q38 93 34 98 Q38 92 43 94 Q40 101 34 100 L33 107Z" stroke="currentColor" strokeWidth="1" fill="none" />
      <path d="M148 104 Q144 97 140 99 Q144 91 150 95 Q148 88 154 86 Q156 93 152 98 Q156 92 161 94 Q158 101 152 100 L151 107Z" stroke="currentColor" strokeWidth="1" fill="none" />
      <line x1="4" y1="142" x2="176" y2="142" stroke="currentColor" strokeWidth="1.5" />
      <line x1="0" y1="146" x2="12" y2="142" stroke="currentColor" strokeWidth="0.8" />
      <line x1="168" y1="142" x2="180" y2="146" stroke="currentColor" strokeWidth="0.8" />
    </svg>
  );
}

function GreenhousePerspective({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 280 190" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
      <polygon points="14,90 140,90 140,168 14,168" stroke="currentColor" strokeWidth="2" fill="none" />
      <polygon points="140,90 240,62 240,140 140,168" stroke="currentColor" strokeWidth="2" fill="none" />
      <polygon points="14,90 77,36 140,90" stroke="currentColor" strokeWidth="2" fill="none" />
      <polygon points="140,90 197,62 240,62" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <line x1="77" y1="36" x2="197" y2="8" stroke="currentColor" strokeWidth="1.8" />
      <polygon points="140,62 197,8 240,62" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <line x1="77" y1="36" x2="32" y2="90" stroke="currentColor" strokeWidth="0.9" />
      <line x1="77" y1="36" x2="58" y2="90" stroke="currentColor" strokeWidth="0.9" />
      <line x1="77" y1="36" x2="82" y2="90" stroke="currentColor" strokeWidth="0.9" />
      <line x1="77" y1="36" x2="108" y2="90" stroke="currentColor" strokeWidth="0.9" />
      <line x1="22" y1="80" x2="140" y2="80" stroke="currentColor" strokeWidth="0.8" />
      <line x1="36" y1="66" x2="140" y2="66" stroke="currentColor" strokeWidth="0.8" />
      <line x1="55" y1="51" x2="140" y2="51" stroke="currentColor" strokeWidth="0.8" />
      <line x1="116" y1="21" x2="163" y2="62" stroke="currentColor" strokeWidth="0.9" />
      <line x1="136" y1="15" x2="185" y2="62" stroke="currentColor" strokeWidth="0.9" />
      <line x1="157" y1="9" x2="207" y2="62" stroke="currentColor" strokeWidth="0.9" />
      <line x1="177" y1="4" x2="228" y2="62" stroke="currentColor" strokeWidth="0.9" />
      <line x1="140" y1="76" x2="240" y2="50" stroke="currentColor" strokeWidth="0.8" />
      <line x1="140" y1="66" x2="222" y2="42" stroke="currentColor" strokeWidth="0.8" />
      <line x1="140" y1="51" x2="207" y2="30" stroke="currentColor" strokeWidth="0.8" />
      <line x1="50" y1="90" x2="50" y2="168" stroke="currentColor" strokeWidth="1.2" />
      <line x1="90" y1="90" x2="90" y2="168" stroke="currentColor" strokeWidth="1.2" />
      <line x1="115" y1="90" x2="115" y2="168" stroke="currentColor" strokeWidth="1.2" />
      <line x1="14" y1="130" x2="140" y2="130" stroke="currentColor" strokeWidth="1" />
      <line x1="170" y1="79" x2="163" y2="140" stroke="currentColor" strokeWidth="1" />
      <line x1="200" y1="71" x2="192" y2="140" stroke="currentColor" strokeWidth="1" />
      <line x1="140" y1="130" x2="240" y2="104" stroke="currentColor" strokeWidth="1" />
      <rect x="54" y="136" width="30" height="32" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="78" cy="153" r="1.8" stroke="currentColor" strokeWidth="1" />
      <path d="M28 126 Q24 119 20 121 Q24 113 30 117 Q28 110 34 108 Q36 115 32 120 Q36 114 41 116 Q38 123 32 122 L31 128Z" stroke="currentColor" strokeWidth="0.9" fill="none" />
      <line x1="6" y1="168" x2="140" y2="168" stroke="currentColor" strokeWidth="1.5" />
      <line x1="140" y1="168" x2="240" y2="140" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function LoginPage() {
  const { login, registerWithInvite, bootstrapAdmin } = useAuthStore();
  const [isBootstrap, setIsBootstrap] = useState<boolean | null>(null);

  const [mode, setMode] = useState<Mode>('login');
  const [inviteCode, setInviteCode] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // C3 FIX: use useEffect (not useState) for async side effects
  useEffect(() => {
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .then(({ count, error }) => {
        if (error) {
          setIsBootstrap(false);
          return;
        }
        setIsBootstrap((count ?? 0) === 0);
      });
  }, []);

  const isRegister = isBootstrap || mode === 'register';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (isBootstrap) {
        const result = await bootstrapAdmin(email.trim(), name.trim(), password);
        if (!result.ok) setError(result.error ?? 'Chyba');
        return;
      }

      if (mode === 'register') {
        const result = await registerWithInvite(
          inviteCode.trim().toUpperCase(),
          email.trim(),
          name.trim(),
          password
        );
        if (!result.ok) setError(result.error ?? 'Chyba registrácie');
        return;
      }

      const result = await login(email.trim(), password);
      if (!result.ok) setError(result.error ?? 'Nesprávny email alebo heslo');
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setError('');
  };

  if (isBootstrap === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'hsl(var(--navy))' }}>
        <div className="text-white/40 text-sm">Načítavam...</div>
      </div>
    );
  }

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
      <div
        className="absolute top-0 right-0 w-[500px] h-[500px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, hsl(var(--orange) / 0.12) 0%, transparent 65%)',
          transform: 'translate(20%, -20%)',
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-96 h-96 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, hsl(var(--white) / 0.04) 0%, transparent 70%)',
          transform: 'translate(-30%, 30%)',
        }}
      />

      <GreenhousePerspective
        className="absolute pointer-events-none select-none"
        style={{ width: 420, bottom: -30, right: -50, color: 'hsl(var(--white) / 0.07)' }}
      />
      <GreenhouseIcon
        className="absolute pointer-events-none select-none"
        style={{ width: 220, top: 20, left: -30, color: 'hsl(var(--white) / 0.06)', transform: 'rotate(6deg)' }}
      />
      <GreenhouseIcon
        className="absolute pointer-events-none select-none hidden md:block"
        style={{ width: 130, bottom: 50, left: 80, color: 'hsl(var(--white) / 0.04)', transform: 'rotate(-4deg)' }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-5 relative">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse 140px 70px at center, hsl(var(--orange) / 0.15) 0%, transparent 70%)' }}
            />
            <img src={sanfogLogoWhite} alt="Sanfog" className="h-20 w-auto relative" />
          </div>
          <h1 className="text-xl font-bold uppercase tracking-widest" style={{ color: 'hsl(var(--white))' }}>
            Greenhouse Calc
          </h1>
          <div className="mx-auto mt-2 mb-2 h-px w-16" style={{ background: 'linear-gradient(90deg, transparent, hsl(var(--orange) / 0.7), transparent)' }} />
          <p className="text-xs tracking-wide uppercase font-medium" style={{ color: 'hsl(var(--white) / 0.45)' }}>
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
            <div className="px-6 py-4 border-b" style={{ background: 'hsl(var(--orange) / 0.1)', borderColor: 'hsl(var(--orange) / 0.25)' }}>
              <div className="flex items-center gap-2 mb-1">
                <span style={{ color: 'hsl(var(--orange))' }} className="text-lg">★</span>
                <p className="text-sm font-bold" style={{ color: 'hsl(var(--white))' }}>Prvotné nastavenie systému</p>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'hsl(var(--white) / 0.45)' }}>
                Systém nemá žiadnych používateľov. Vytvorte prvý administrátorský účet.
              </p>
            </div>
          )}

          {/* Tabs */}
          {!isBootstrap && (
            <div className="flex border-b" style={{ borderColor: 'hsl(var(--white) / 0.1)' }}>
              {(['login', 'register'] as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => switchMode(m)}
                  className="flex-1 py-3 text-sm font-semibold uppercase tracking-wide transition-colors"
                  style={{
                    color: mode === m ? 'hsl(var(--white))' : 'hsl(var(--white) / 0.35)',
                    borderBottom: mode === m ? '2px solid hsl(var(--orange))' : '2px solid transparent',
                    background: 'transparent',
                  }}
                >
                  {m === 'login' ? 'Prihlásiť sa' : 'Registrovať'}
                </button>
              ))}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {!isBootstrap && mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'hsl(var(--white) / 0.5)' }}>Kód pozvánky</label>
                <input value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())} placeholder="XXXXXXXX" maxLength={8} required className="login-input w-full px-3 py-2.5 text-sm font-mono tracking-widest text-center uppercase" style={{ borderRadius: 'var(--radius)' }} />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'hsl(var(--white) / 0.5)' }}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="meno@sanfog.sk" required autoComplete="email" className="login-input w-full px-3 py-2.5 text-sm" style={{ borderRadius: 'var(--radius)' }} />
            </div>

            {isRegister && (
              <div>
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'hsl(var(--white) / 0.5)' }}>Meno a priezvisko</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ján Novák" required className="login-input w-full px-3 py-2.5 text-sm" style={{ borderRadius: 'var(--radius)' }} />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'hsl(var(--white) / 0.5)' }}>Heslo</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete={isRegister ? 'new-password' : 'current-password'} className="login-input w-full px-3 py-2.5 text-sm" style={{ borderRadius: 'var(--radius)' }} />
              {isRegister && <p className="text-xs mt-1" style={{ color: 'hsl(var(--white) / 0.3)' }}>Minimálne 6 znakov</p>}
            </div>

            {error && (
              <div className="px-3 py-2 text-xs border" style={{ borderRadius: 'var(--radius)', background: 'hsl(var(--destructive) / 0.15)', borderColor: 'hsl(var(--destructive) / 0.4)', color: 'hsl(0 80% 75%)' }}>
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 text-sm font-bold uppercase tracking-widest transition-all disabled:opacity-60"
              style={{ borderRadius: 'var(--radius)', background: 'linear-gradient(135deg, hsl(var(--orange)), hsl(36 90% 36%))', color: 'hsl(var(--white))', boxShadow: '0 4px 20px hsl(var(--orange) / 0.35)' }}
            >
              {submitting ? '...' : isBootstrap ? 'Vytvoriť admin účet' : mode === 'login' ? 'Prihlásiť sa →' : 'Zaregistrovať sa ✓'}
            </button>
          </form>
        </div>

        <div className="flex items-center justify-center gap-1.5 mt-6 text-xs" style={{ color: 'hsl(var(--white) / 0.18)' }}>
          <span>made by VORA · v13</span>
        </div>
      </div>
    </div>
  );
}
