'use client';

export const dynamic = 'force-dynamic';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Film, Eye, EyeOff, Loader2, Clapperboard, User, Mail, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

// ─── Ambient particle ──────────────────────────────────────
function Particle({ style }: { style: React.CSSProperties }) {
  return (
    <span
      className="absolute rounded-full pointer-events-none"
      style={{
        background: 'radial-gradient(circle, rgba(245,158,11,0.6) 0%, transparent 70%)',
        ...style,
      }}
    />
  );
}

// ─── Film strip decoration ─────────────────────────────────
function FilmStrip({ side }: { side: 'left' | 'right' }) {
  return (
    <div
      className={`absolute top-0 bottom-0 ${side === 'left' ? 'left-0' : 'right-0'} w-8 flex flex-col gap-3 py-4 opacity-20 pointer-events-none`}
    >
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="mx-1 rounded-sm flex-shrink-0"
          style={{
            height: '1.75rem',
            background: 'rgba(245,158,11,0.5)',
            opacity: i % 3 === 0 ? 0.8 : 0.3,
          }}
        />
      ))}
    </div>
  );
}

// ─── Reusable cinematic input style ───────────────────────
const inputStyle: React.CSSProperties = {
  background: 'rgba(18, 18, 21, 0.75)',
  backdropFilter: 'blur(20px)',
  border: '1.5px solid rgba(255,255,255,0.08)',
  color: '#ffffff',
  borderRadius: '0.875rem',
  padding: '0.85rem 1rem',
  width: '100%',
  fontSize: '0.875rem',
  fontWeight: 600,
  outline: 'none',
  transition: 'border-color 0.25s, box-shadow 0.25s',
};

function onFocusGlow(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.borderColor = 'var(--accent-amber)';
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245,166,35,0.15), 0 4px 20px rgba(0,0,0,0.5)';
}
function onBlurGlow(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
  e.currentTarget.style.boxShadow = 'none';
}

// ─── Main Page ─────────────────────────────────────────────
export default function SignUpPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [username, setUsername]   = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const particles = [
    { width: 80,  height: 80,  top: '10%', left: '15%', opacity: 0.4  },
    { width: 120, height: 120, top: '70%', left: '5%',  opacity: 0.25 },
    { width: 60,  height: 60,  top: '40%', left: '80%', opacity: 0.35 },
    { width: 100, height: 100, top: '20%', left: '75%', opacity: 0.2  },
    { width: 50,  height: 50,  top: '85%', left: '60%', opacity: 0.3  },
    { width: 90,  height: 90,  top: '55%', left: '40%', opacity: 0.15 },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const cleanUsername = username.trim();
    const cleanEmail    = email.trim();

    if (!cleanUsername) { setError('يرجى كتابة اسم المستخدم.'); return; }
    if (password.length < 6) { setError('يجب أن تكون كلمة المرور 6 أحرف على الأقل.'); return; }

    startTransition(async () => {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: { data: { username: cleanUsername } },
      });

      if (authError) {
        setError(authError.message || 'تعذّر إنشاء الحساب. يرجى التأكد من البيانات.');
        return;
      }

      if (authData.user) {
        try {
          await supabase.from('profiles').upsert(
            { id: authData.user.id, email: cleanEmail, username: cleanUsername, role: 'user', avatar_url: null },
            { onConflict: 'id' }
          );
        } catch { /* handled via Supabase trigger */ }

        if (authData.session) {
          router.push('/'); router.refresh();
        } else {
          const { error: signInErr } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
          if (!signInErr) { router.push('/'); router.refresh(); }
          else router.push('/login');
        }
      }
    });
  }

  return (
    <div
      className="relative min-h-dvh flex flex-col items-center justify-center overflow-hidden px-4 py-8"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* Cinematic bg */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(245,158,11,0.09) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 50% 100%, rgba(99,102,241,0.06) 0%, transparent 70%)',
        }}
      />
      <FilmStrip side="left" />
      <FilmStrip side="right" />
      {particles.map((p, i) => (
        <Particle key={i} style={{ width: p.width, height: p.height, top: p.top, left: p.left, opacity: p.opacity }} />
      ))}

      {/* ── Card ── */}
      <div
        className="relative z-10 w-full max-w-sm rounded-3xl p-8 space-y-6"
        style={{
          background: 'linear-gradient(160deg, rgba(22,22,26,0.85) 0%, rgba(10,10,12,0.95) 100%)',
          backdropFilter: 'blur(36px)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 30px 70px rgba(0,0,0,0.7), 0 0 0 1px rgba(245,166,35,0.08)',
        }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-1">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-2"
            style={{
              background: 'linear-gradient(135deg, #fef08a 0%, #f5a623 50%, #e879f9 100%)',
              boxShadow: '0 0 30px rgba(245,166,35,0.45)',
            }}
          >
            <Clapperboard size={32} color="#050505" strokeWidth={2.8} />
          </div>
          <h1 className="text-gradient-amber-rose text-3xl font-black tracking-[0.25em]">REVIA</h1>
          <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
            سينمانا المشتركة · إنشاء حساب جديد
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4 text-right">

          {/* Username */}
          <div className="space-y-1.5">
            <label htmlFor="username" className="block text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
              اسم المستخدم
            </label>
            <div className="relative">
              <input
                id="username"
                type="text"
                autoComplete="username"
                placeholder="مثال: CinemaLover"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                dir="rtl"
                disabled={isPending}
                style={{ ...inputStyle, paddingRight: '2.75rem' }}
                onFocus={onFocusGlow}
                onBlur={onBlurGlow}
              />
              <User
                size={16}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--text-muted)' }}
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
              البريد الإلكتروني
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                dir="ltr"
                disabled={isPending}
                style={{ ...inputStyle, paddingLeft: '2.75rem', textAlign: 'left' }}
                onFocus={onFocusGlow}
                onBlur={onBlurGlow}
              />
              <Mail
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--text-muted)' }}
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
              كلمة المرور
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPass ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                dir="ltr"
                disabled={isPending}
                style={{ ...inputStyle, paddingLeft: '2.75rem', paddingRight: '2.75rem', textAlign: 'left' }}
                onFocus={onFocusGlow}
                onBlur={onBlurGlow}
              />
              <Lock
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--text-muted)' }}
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: 'var(--text-muted)' }}
                aria-label={showPass ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p
              className="text-xs text-center rounded-2xl py-3 px-4 font-bold border"
              style={{
                color: '#f87171',
                background: 'rgba(239,68,68,0.1)',
                borderColor: 'rgba(239,68,68,0.3)',
              }}
              role="alert"
            >
              {error}
            </p>
          )}

          {/* Submit — .btn-cinematic */}
          <button
            type="submit"
            disabled={isPending || !email || !password || !username}
            className="btn-cinematic w-full mt-2 flex items-center justify-center gap-2.5 py-4 rounded-2xl text-sm disabled:opacity-40 disabled:pointer-events-none"
          >
            {isPending ? (
              <><Loader2 size={18} className="animate-spin" /> جاري إنشاء الحساب…</>
            ) : (
              <><Film size={18} /> إنشاء حساب والانضمام</>
            )}
          </button>
        </form>

        {/* Footer */}
        <div
          className="pt-3 text-center text-xs border-t"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <p style={{ color: 'var(--text-secondary)' }}>
            لديك حساب بالفعل؟{' '}
            <Link
              href="/login"
              className="font-black transition-colors"
              style={{ color: '#fef08a' }}
            >
              تسجيل الدخول
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
