'use client';

export const dynamic = 'force-dynamic';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, ShieldCheck, Film } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { showToast, launchConfetti } from '@/components/Toaster';

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

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const particles = [
    { width: 80,  height: 80,  top: '10%', left: '15%', opacity: 0.35 },
    { width: 120, height: 120, top: '72%', left: '6%',  opacity: 0.25 },
    { width: 60,  height: 60,  top: '38%', left: '80%', opacity: 0.3  },
    { width: 90,  height: 90,  top: '20%', left: '72%', opacity: 0.2  },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('كلمة المرور يجب أن تتكون من 6 خانات على الأقل.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين.');
      return;
    }

    startTransition(async () => {
      try {
        const { error: updateError } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (updateError) {
          setError(updateError.message || 'حدث خطأ أثناء تحديث كلمة المرور. قد يكون الرابط منتهي الصلاحية.');
          return;
        }

        setIsSuccess(true);
        showToast('تم تحديث كلمة المرور بنجاح! 🔒✨');
        launchConfetti();

        // Redirect to homepage after brief delay
        setTimeout(() => {
          router.push('/');
          router.refresh();
        }, 2200);
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
      {/* Ambient background */}
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
        {/* Header */}
        <div className="flex flex-col items-center gap-1 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-2"
            style={{
              background: 'linear-gradient(135deg, #fef08a 0%, #f5a623 50%, #e879f9 100%)',
              boxShadow: '0 0 30px rgba(245,166,35,0.45)',
            }}
          >
            {isSuccess ? (
              <CheckCircle2 size={32} color="#050505" strokeWidth={2.8} />
            ) : (
              <ShieldCheck size={32} color="#050505" strokeWidth={2.6} />
            )}
          </div>
          <h1 className="text-gradient-amber-rose text-2xl font-black tracking-wide">
            {isSuccess ? 'تم التحديث بنجاح!' : 'تعيين كلمة مرور جديدة'}
          </h1>
          <p className="text-xs font-semibold px-2" style={{ color: 'var(--text-secondary)' }}>
            {isSuccess
              ? 'تم حفظ كلمة المرور الجديدة، جاري تحويلك إلى المنصة…'
              : 'أدخل كلمة المرور الجديدة لحماية حسابك'}
          </p>
        </div>

        {/* Success View */}
        {isSuccess ? (
          <div className="space-y-4 text-center animate-fade-in-up py-2">
            <div
              className="p-4 rounded-2xl border text-xs leading-relaxed"
              style={{
                background: 'rgba(16, 185, 129, 0.1)',
                borderColor: 'rgba(16, 185, 129, 0.3)',
                color: '#6ee7b7',
              }}
            >
              <p className="font-bold text-sm mb-1">كلمة المرور محدثة 🔒</p>
              <p className="text-slate-300">
                يمكنك الآن استخدام كلمة المرور الجديدة لتسجيل الدخول في أي وقت.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-300">
              <Loader2 size={16} className="animate-spin" />
              <span>جاري التحويل تلقائياً…</span>
            </div>
          </div>
        ) : (
          /* Form View */
          <form onSubmit={handleSubmit} noValidate className="space-y-4 text-right">
            {/* New Password */}
            <div className="space-y-1.5">
              <label htmlFor="newPassword" className="block text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                كلمة المرور الجديدة
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="6 خانات أو أكثر"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  dir="ltr"
                  disabled={isPending}
                  style={{ ...inputStyle, paddingLeft: '2.75rem', paddingRight: '2.75rem', textAlign: 'left' }}
                  onFocus={onFocusGlow}
                  onBlur={onBlurGlow}
                />
                <Lock
                  size={16}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--text-muted)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  aria-label={showPass ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="block text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                تأكيد كلمة المرور الجديدة
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="أعد إدخال كلمة المرور"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  dir="ltr"
                  disabled={isPending}
                  style={{ ...inputStyle, paddingLeft: '2.75rem', paddingRight: '2.75rem', textAlign: 'left' }}
                  onFocus={onFocusGlow}
                  onBlur={onBlurGlow}
                />
                <Lock
                  size={16}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--text-muted)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  aria-label={showConfirm ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Error Banner */}
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPending || !newPassword || !confirmPassword}
              className="btn-cinematic w-full mt-2 flex items-center justify-center gap-2 py-4 rounded-2xl text-sm disabled:opacity-40 disabled:pointer-events-none"
            >
              {isPending ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  جاري حفظ كلمة المرور…
                </>
              ) : (
                <>
                  <Film size={18} />
                  تأكيد وتحديث كلمة المرور
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
            className="font-bold hover:underline transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            العودة لتسجيل الدخول
          </Link>
        </div>
      </div>
    </div>
  );
}
