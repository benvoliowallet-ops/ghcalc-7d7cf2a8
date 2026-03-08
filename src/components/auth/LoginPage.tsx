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

    // login
    const ok = login(email.trim(), password);
    if (!ok) setError('Nesprávny email alebo heslo');
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setError('');
  };

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img src={sanfogLogoWhite} alt="Sanfog" className="h-24 w-auto" />
          </div>
          <h1 className="text-lg font-bold text-white uppercase tracking-widest">Greenhouse calc </h1>
          <p className="text-sm text-white/40 mt-1">Interný BOM kalkulátor</p>
        </div>

        {/* Card */}
        <div
          className="bg-card border border-border overflow-hidden"
          style={{ borderRadius: 'var(--radius)' }}>
          

          {/* Bootstrap banner */}
          {isBootstrap &&
          <div className="px-6 py-4 bg-orange/10 border-b border-orange/30">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-orange text-lg">★</span>
                <p className="text-sm font-bold text-foreground">Prvotné nastavenie systému</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Systém nemá žiadnych používateľov. Vytvorte prvý administrátorský účet.
              </p>
            </div>
          }

          {/* Tabs */}
          {!isBootstrap &&
          <div className="flex border-b border-border">
              <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex-1 py-3 text-sm font-semibold uppercase tracking-wide transition-colors ${
              mode === 'login' ?
              'bg-card text-primary border-b-2 border-primary' :
              'bg-muted text-muted-foreground hover:text-foreground'}`
              }>
              
                Prihlásiť sa
              </button>
              <button
              type="button"
              onClick={() => switchMode('register')}
              className={`flex-1 py-3 text-sm font-semibold uppercase tracking-wide transition-colors ${
              mode === 'register' ?
              'bg-card text-primary border-b-2 border-primary' :
              'bg-muted text-muted-foreground hover:text-foreground'}`
              }>
              
                Registrovať
              </button>
            </div>
          }

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">

            {/* Invite code */}
            {!isBootstrap && mode === 'register' &&
            <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
                  Kód pozvánky
                </label>
                <input
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="XXXXXXXX"
                maxLength={8}
                required
                className="w-full px-3 py-2.5 border border-input bg-background text-foreground text-sm font-mono tracking-widest text-center uppercase focus:outline-none focus:ring-2 focus:ring-primary"
                style={{ borderRadius: 'var(--radius)' }} />
              
              </div>
            }

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="meno@sanfog.sk"
                required
                autoComplete="email"
                className="w-full px-3 py-2.5 border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                style={{ borderRadius: 'var(--radius)' }} />
              
            </div>

            {/* Name */}
            {isRegister &&
            <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
                  Meno a priezvisko
                </label>
                <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ján Novák"
                required
                className="w-full px-3 py-2.5 border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                style={{ borderRadius: 'var(--radius)' }} />
              
              </div>
            }

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Heslo</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                className="w-full px-3 py-2.5 border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                style={{ borderRadius: 'var(--radius)' }} />
              
              {isRegister &&
              <p className="text-xs text-muted-foreground mt-1">Minimálne 6 znakov</p>
              }
            </div>

            {/* Error */}
            {error &&
            <div
              className="px-3 py-2 bg-destructive/10 border border-destructive/30 text-xs text-destructive"
              style={{ borderRadius: 'var(--radius)' }}>
              
                ⚠️ {error}
              </div>
            }

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold uppercase tracking-widest transition-colors"
              style={{ borderRadius: 'var(--radius)' }}>
              
              {isBootstrap ?
              'Vytvoriť admin účet' :
              mode === 'login' ?
              'Prihlásiť sa →' :
              'Zaregistrovať sa ✓'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-1.5 mt-6 text-xs text-white/20">
          <span>made by VORA · v12</span>
        </div>
      </div>
    </div>);

}