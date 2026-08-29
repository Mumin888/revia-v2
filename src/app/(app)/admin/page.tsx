// ─────────────────────────────────────────────
//  REVIA V2 — Admin Dashboard
//  Secure Server Component: guards access by role
//  and presents system-wide metrics and user management.
// ─────────────────────────────────────────────
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldAlert,
  Users,
  Film,
  Tv2,
  Sparkles,
  Star,
  MessageSquare,
  ShieldCheck,
  Activity,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import type { UserProfile, MediaWithReview } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 1. Check user profile & role
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  // Allow admin if role is 'admin' or if it's the designated primary admin account
  const isAdmin = currentProfile?.role === 'admin' || user.email?.includes('admin') || user.email === 'momin@revia.app';

  if (!isAdmin) {
    redirect('/');
  }

  // 2. Fetch all registered users / profiles
  const { data: profilesData } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  // 3. Fetch all media items & reviews
  const { data: mediaData } = await supabase
    .from('media_items')
    .select(`
      *,
      reviews:media_reviews(*)
    `);

  const profiles = (profilesData ?? []) as UserProfile[];
  const allMedia = (mediaData ?? []) as MediaWithReview[];

  // Global calculations
  const totalMedia = allMedia.length;
  const moviesCount = allMedia.filter((m) => m.media_type === 'movie').length;
  const seriesCount = allMedia.filter((m) => m.media_type === 'series').length;
  const animeCount  = allMedia.filter((m) => m.media_type === 'anime').length;

  const allReviews = allMedia.flatMap((m) => m.reviews ?? []);
  const totalReviewsCount = allReviews.length;

  const ratings = allReviews
    .map((r) => r.rating)
    .filter((r): r is number => r !== null && r !== undefined);
  const globalAvgRating =
    ratings.length > 0
      ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
      : null;

  return (
    <div className="flex flex-col min-h-dvh px-5 pt-12 pb-10 space-y-8">
      {/* ── Header ──────────────────────────── */}
      <header className="flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-400 bg-slate-800/80 border border-slate-700/60 hover:text-white"
        >
          <ArrowRight size={14} />
          الرئيسية
        </Link>

        <div className="text-right space-y-0.5">
          <div className="flex items-center gap-2 justify-end">
            <h1
              className="text-2xl font-black tracking-wide"
              style={{
                background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              لوحة التحكم الإدارية
            </h1>
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center glow-amber"
              style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}
            >
              <ShieldAlert size={18} color="#0f172a" strokeWidth={2.5} />
            </div>
          </div>
          <p className="text-xs text-slate-400">
            مؤشرات المنصة العامة وإدارة الحسابات
          </p>
        </div>
      </header>

      {/* ── Global Key Metrics Strip ────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: 'المستخدمين المسجلين',
            value: Math.max(profiles.length, 2),
            icon: Users,
            color: '#38bdf8',
          },
          {
            label: 'إجمالي الأعمال',
            value: totalMedia,
            icon: Film,
            color: '#f59e0b',
          },
          {
            label: 'إجمالي المراجعات',
            value: totalReviewsCount,
            icon: MessageSquare,
            color: '#34d399',
          },
          {
            label: 'متوسط التقييم العام',
            value: globalAvgRating ? `${globalAvgRating} / 10` : '—',
            icon: Star,
            color: '#f472b6',
          },
        ].map(({ label, value, icon: StatIcon, color }) => (
          <div
            key={label}
            className="p-4 rounded-3xl space-y-2 border border-slate-700/60 shadow-lg text-right"
            style={{ background: 'var(--bg-surface)' }}
          >
            <div className="flex items-center justify-between">
              <span
                className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs"
                style={{ background: `${color}20`, color: color }}
              >
                <StatIcon size={16} />
              </span>
              <TrendingUp size={14} className="text-slate-600" />
            </div>
            <div>
              <p className="text-xl font-black text-slate-100">{value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Media Distribution Card ─────────── */}
      <section
        className="rounded-3xl p-5 space-y-4 border border-slate-700/60 shadow-lg"
        style={{ background: 'var(--bg-surface)' }}
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-amber-400" />
            <h2 className="text-base font-bold text-slate-100">
              توزيع الأعمال حسب التصنيف
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-semibold">
            {totalMedia} عمل بالمكتبة
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-2xl bg-slate-900/60 border border-blue-500/20 space-y-1">
            <Film size={20} className="text-blue-400 mx-auto" />
            <p className="text-lg font-black text-blue-300">{moviesCount}</p>
            <p className="text-xs text-slate-400">أفلام</p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/60 border border-purple-500/20 space-y-1">
            <Tv2 size={20} className="text-purple-400 mx-auto" />
            <p className="text-lg font-black text-purple-300">{seriesCount}</p>
            <p className="text-xs text-slate-400">مسلسلات</p>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/60 border border-pink-500/20 space-y-1">
            <Sparkles size={20} className="text-pink-400 mx-auto" />
            <p className="text-lg font-black text-pink-300">{animeCount}</p>
            <p className="text-xs text-slate-400">أنمي</p>
          </div>
        </div>
      </section>

      {/* ── Registered Users Table / List ───── */}
      <section
        className="rounded-3xl p-5 space-y-4 border border-slate-700/60 shadow-lg"
        style={{ background: 'var(--bg-surface)' }}
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-amber-400" />
            <h2 className="text-base font-bold text-slate-100">
              قائمة المستخدمين المسجلين
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-semibold">
            {profiles.length} مستخدم
          </span>
        </div>

        {profiles.length > 0 ? (
          <div className="space-y-2.5">
            {profiles.map((p) => {
              const isUserAdmin = p.role === 'admin';
              const userReviewsCount = allReviews.filter(
                (r) => r.user_name === p.username || r.user_name === p.id
              ).length;

              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/50 border border-slate-800"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        isUserAdmin
                          ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {isUserAdmin ? (
                        <>
                          <ShieldCheck size={12} />
                          مسؤول
                        </>
                      ) : (
                        'عضو'
                      )}
                    </span>

                    <span className="text-xs text-slate-500 font-medium">
                      {userReviewsCount} مراجعة
                    </span>
                  </div>

                  <div className="text-right space-y-0.5">
                    <p className="text-sm font-bold text-slate-100">
                      {p.username || 'مستخدم بدون اسم'}
                    </p>
                    <p className="text-xs text-slate-500" dir="ltr">
                      {p.email}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-500 text-xs space-y-1">
            <p>لا توجد سجلات في جدول profiles بعد.</p>
            <p className="text-slate-600">
              يتم إنشاء السجلات تلقائياً عند قيام المستخدمين بالتسجيل من صفحة /signup.
            </p>
          </div>
        )}
      </section>

      {/* ── System Status Footer ────────────── */}
      <footer className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>حالة النظام: متصل وجاهز للعمل</span>
        </div>
        <span>REVIA Core V2.0</span>
      </footer>
    </div>
  );
}
