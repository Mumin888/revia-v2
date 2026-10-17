'use client';

export const dynamic = 'force-dynamic';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Mail, Loader2, ArrowRight, CheckCircle2, KeyRound } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

// ─── Ambient particles ─────────────────────────────────────
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

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [isPending, startTransition] = useTransition();
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const particles = [
    { width: 80,  height: 80,  top: '12%', left: '12%', opacity: 0.35 },
    { width: 110, height: 110, top: '65%', left: '8%',  opacity: 0.25 },
    { width: 70,  height: 70,  top: '35%', left: '82%', opacity: 0.3  },
    { width: 90,  height: 90,  top: '78%', left: '70%', opacity: 0.2  },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('يرجى إدخال البريد الإلكتروني.');
      return;
    }

    startTransition(async () => {
      try {
        const redirectUrl = `${window.location.origin}/update-password`;
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: redirectUrl,
        });

        if (resetError) {
          setError(resetError.message || 'حدث خطأ أثناء إرسال الرابط. تحقق من بريدك وحاول مجدداً.');
          return;
        }

        setIsSent(true);
      } catch {
        setError('تعذّر الاتصال بخادم المصادقة. يرجى المحاولة بعد قليل.');
      }
    });
  }

  return (
    <div
      className="relative min-h-dvh flex flex-col items-center justify-center overflow-hidden px-4"
      style={{ background: 'var(--bg-base)' }}
      dir="rtl"
    >
      {/* Cinematic ambient background */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(245,158,11,0.09) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 50% 100%, rgba(232,121,249,0.06) 0%, transparent 70%)',
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
        {/* Header */}
        <div className="flex flex-col items-center gap-1 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-2"
            style={{
              background: 'linear-gradient(135deg, #fef08a 0%, #f5a623 50%, #e879f9 100%)',
              boxShadow: '0 0 30px rgba(245,166,35,0.45)',
            }}
          >
            {isSent ? (
              <CheckCircle2 size={32} color="#050505" strokeWidth={2.8} />
            ) : (
              <KeyRound size={32} color="#050505" strokeWidth={2.6} />
            )}
          </div>
          <h1 className="text-gradient-amber-rose text-2xl font-black tracking-wide">
            {isSent ? 'تم إرسال الرابط' : 'استعادة كلمة المرور'}
          </h1>
          <p className="text-xs font-semibold px-2" style={{ color: 'var(--text-secondary)' }}>
            {isSent
              ? 'تفقّد بريدك الإلكتروني لاستكمال إعادة التعيين'
              : 'أدخل بريدك الإلكتروني المسجل وسنرسل لك رابطاً آمناً'}
          </p>
        </div>

        {/* Success View */}
        {isSent ? (
          <div className="space-y-5 text-center animate-fade-in-up">
            <div
              className="p-4 rounded-2xl border text-xs leading-relaxed space-y-2"
              style={{
                background: 'rgba(16, 185, 129, 0.1)',
                borderColor: 'rgba(16, 185, 129, 0.3)',
                color: '#6ee7b7',
              }}
            >
              <p className="font-bold">
                أرسلنا رابط إعادة تعيين كلمة المرور إلى:
              </p>
              <p className="font-mono text-white text-sm bg-black/40 py-1.5 px-3 rounded-xl border border-emerald-500/20 break-all">
                {email}
              </p>
              <p className="text-[11px] text-slate-300">
                يرجى فتح الرسالة والنقر على الرابط لتعيين كلمة مرور جديدة. تفقّد مجلد الرسائل غير المرغوب فيها (Spam) إذا لم تجدها.
              </p>
            </div>

            <Link
              href="/login"
              className="btn-cinematic w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm"
            >
              <ArrowRight size={16} />
              العودة لتسجيل الدخول
            </Link>
          </div>
        ) : (
          /* Form View */
          <form onSubmit={handleSubmit} noValidate className="space-y-4 text-right">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                البريد الإلكتروني
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  dir="ltr"
                  disabled={isPending}
                  style={{ ...inputStyle, paddingRight: '2.75rem', textAlign: 'left' }}
                  onFocus={onFocusGlow}
                  onBlur={onBlurGlow}
                />
                <Mail
                  size={16}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--text-muted)' }}
                />
              </div>
            </div>

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

            <button
              type="submit"
              disabled={isPending || !email.trim()}
              className="btn-cinematic w-full mt-2 flex items-center justify-center gap-2 py-4 rounded-2xl text-sm disabled:opacity-40 disabled:pointer-events-none"
            >
              {isPending ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  جاري إرسال الرابط…
                </>
              ) : (
                <>
                  <Mail size={18} />
                  إرسال رابط إعادة التعيين
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer */}
        <div
          className="pt-3 text-center text-xs border-t"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <Link
            href="/login"
            className="font-bold hover:underline transition-colors inline-flex items-center gap-1.5"
            style={{ color: 'var(--text-secondary)' }}
          >
            <ArrowRight size={13} />
            تذكرت كلمة المرور؟ العودة للدخول
          </Link>
        </div>
      </div>
    </div>
  );
}
