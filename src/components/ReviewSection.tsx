'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Star, User, Edit3, Trash2, Check, Loader2,
  Bookmark, CheckCircle2, Sparkles, Plus, X, MessageSquare, Tag,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { type MediaReview, type WatchStatus, type CustomTag, CUSTOM_TAGS } from '@/lib/types';
import { showToast, launchConfetti } from '@/components/Toaster';

interface ReviewSectionProps {
  mediaId: string;
  initialReviews: MediaReview[];
}

const STATUS_OPTIONS: { value: WatchStatus; label: string; icon: typeof Bookmark; color: string }[] = [
  { value: 'to_watch',    label: 'قائمة المشاهدة', icon: Bookmark,     color: '#818cf8' },
  { value: 'watched',     label: 'شاهدت',          icon: CheckCircle2, color: '#34d399' },
  { value: 'recommended', label: 'توصية مميزة',    icon: Sparkles,     color: '#e879f9' },
];

const RATING_LABELS: Record<number, string> = {
  1: 'كارثي', 2: 'سيء جداً', 3: 'ضعيف', 4: 'أقل من المتوسط',
  5: 'متوسط', 6: 'مقبول', 7: 'جيد', 8: 'جيد جداً', 9: 'ممتاز', 10: 'تحفة سينمائية',
};

// ─── Shared cinematic input style ──────────────────────────
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
  resize: 'vertical',
};
function onFocusGlow(e: React.FocusEvent<HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = 'var(--accent-amber)';
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245,166,35,0.12), 0 4px 20px rgba(0,0,0,0.4)';
}
function onBlurGlow(e: React.FocusEvent<HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
  e.currentTarget.style.boxShadow = 'none';
}

// ─── Component ─────────────────────────────────────────────
export default function ReviewSection({ mediaId, initialReviews }: ReviewSectionProps) {
  const router = useRouter();
  const [reviews, setReviews]             = useState<MediaReview[]>(initialReviews);
  const [currentUsername, setCurrentUsername] = useState<string>('');
  const [currentUserId, setCurrentUserId]     = useState<string | null>(null);
  const [activeUser, setActiveUser]           = useState<string | null>(null);
  const [isOpen, setIsOpen]                   = useState(false);
  const [isPending, startTransition]          = useTransition();
  const [error, setError]                     = useState<string | null>(null);
  const [success, setSuccess]                 = useState<string | null>(null);

  const [formStatus, setFormStatus] = useState<WatchStatus>('watched');
  const [formRating, setFormRating] = useState<number | null>(8);
  const [formReview, setFormReview] = useState<string>('');
  const [formTags, setFormTags]     = useState<CustomTag[]>([]);

  useEffect(() => {
    async function loadCurrentUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        const { data: profile } = await supabase
          .from('profiles').select('username').eq('id', user.id).maybeSingle();
        const username =
          profile?.username ||
          (user.user_metadata?.username as string) ||
          (user.email ? user.email.split('@')[0] : 'User');
        setCurrentUsername(username);
      }
    }
    loadCurrentUser();
  }, []);

  const myReview = reviews.find(
    (r) =>
      (currentUserId && r.user_id === currentUserId) ||
      (currentUsername && r.user_name.toLowerCase() === currentUsername.toLowerCase())
  );

  function openEdit(userNameToEdit: string) {
    const existing = reviews.find(
      (r) =>
        r.user_name.toLowerCase() === userNameToEdit.toLowerCase() ||
        (currentUserId && r.user_id === currentUserId)
    );
    setActiveUser(userNameToEdit);
    setError(null); setSuccess(null);
    if (existing) {
      setFormStatus(existing.status);
      setFormRating(existing.rating);
      setFormReview(existing.review ?? '');
      setFormTags(existing.custom_tags ?? []);
    } else {
      setFormStatus('watched'); setFormRating(8); setFormReview(''); setFormTags([]);
    }
    setIsOpen(true);
  }

  function toggleTag(tag: CustomTag) {
    setFormTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  }

  async function handleSave() {
    if (!activeUser) return;
    setError(null);
    startTransition(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError('يرجى تسجيل الدخول أولاً.'); return; }
      const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).maybeSingle();
      const resolvedName =
        profile?.username || activeUser ||
        (user.user_metadata?.username as string) ||
        (user.email ? user.email.split('@')[0] : 'User');
      const existing = reviews.find(
        (r) => r.user_name.toLowerCase() === resolvedName.toLowerCase() || r.user_id === user.id
      );
      const reviewPayload: Record<string, unknown> = {
        media_id: mediaId, user_name: resolvedName, user_id: user.id,
        status: formStatus, rating: formRating,
        review: formReview.trim() || null,
        custom_tags: formTags.length > 0 ? formTags : null,
      };
      if (existing?.id) reviewPayload.id = existing.id;
      const { data, error: upsertErr } = await supabase
        .from('media_reviews').upsert(reviewPayload, { onConflict: 'media_id,user_name' }).select().single();
      if (upsertErr || !data) { setError('تعذّر حفظ المراجعة. حاول مجدداً.'); return; }
      setReviews((prev) => {
        const idx = prev.findIndex(
          (r) => r.user_name.toLowerCase() === resolvedName.toLowerCase() || r.user_id === user.id
        );
        if (idx >= 0) { const next = [...prev]; next[idx] = data as MediaReview; return next; }
        return [...prev, data as MediaReview];
      });
      setSuccess('تم حفظ التقييم بنجاح');

      // ── Critic's Badge Easter Egg ──
      const cleanReview = formReview.trim();
      if (cleanReview.length > 200) {
        launchConfetti();
        showToast('Professional Critic Badge Earned! ✍️');
      }

      setTimeout(() => { setIsOpen(false); setSuccess(null); router.refresh(); }, 550);
    });
  }

  async function handleDelete() {
    if (!activeUser) return;
    setError(null);
    startTransition(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const existing = reviews.find(
        (r) => r.user_name.toLowerCase() === activeUser.toLowerCase() || (user && r.user_id === user.id)
      );
      const query = supabase.from('media_reviews').delete().eq('media_id', mediaId);
      if (existing?.id) { query.eq('id', existing.id); }
      else if (user?.id) { query.or(`user_id.eq.${user.id},user_name.ilike.${activeUser}`); }
      else { query.eq('user_name', activeUser); }
      const { error: delErr } = await query;
      if (delErr) { setError('تعذّر حذف المراجعة.'); return; }
      setReviews((prev) =>
        prev.filter((r) => r.user_name.toLowerCase() !== activeUser.toLowerCase() && (!user || r.user_id !== user.id))
      );
      setSuccess('تم حذف المراجعة');
      setTimeout(() => { setIsOpen(false); setSuccess(null); router.refresh(); }, 450);
    });
  }

  const hasExisting = activeUser
    ? reviews.some(
        (r) =>
          r.user_name.toLowerCase() === activeUser.toLowerCase() ||
          (currentUserId && r.user_id === currentUserId)
      )
    : false;

  return (
    <section className="space-y-4">
      {/* ── Section header ── */}
      <div className="flex items-center justify-between">
        {currentUsername && (
          <button
            type="button"
            onClick={() => openEdit(currentUsername)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-black transition-all duration-200 border active:scale-95"
            style={{
              background: 'rgba(245,166,35,0.12)',
              borderColor: 'rgba(245,166,35,0.4)',
              color: '#fef08a',
              boxShadow: '0 0 14px rgba(245,166,35,0.15)',
            }}
          >
            {myReview ? <><Edit3 size={13} /> تعديل تقييمي</> : <><Plus size={13} /> إضافة تقييمي</>}
          </button>
        )}
        <div className="flex items-center gap-2.5">
          <h2 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>
            تقييم ومراجعات الأعضاء
          </h2>
          <div
            className="w-9 h-9 rounded-2xl flex items-center justify-center border"
            style={{
              background: 'rgba(245,166,35,0.1)',
              borderColor: 'rgba(245,166,35,0.3)',
            }}
          >
            <MessageSquare size={16} strokeWidth={2.2} style={{ color: 'var(--accent-amber)' }} />
          </div>
        </div>
      </div>

      {/* ── Review Cards ── */}
      {reviews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {reviews.map((rev) => {
            const isMe =
              (currentUserId && rev.user_id === currentUserId) ||
              (currentUsername && rev.user_name.toLowerCase() === currentUsername.toLowerCase());
            const statusConfig = STATUS_OPTIONS.find((s) => s.value === rev.status);
            const StatusIcon = statusConfig?.icon ?? Bookmark;

            return (
              <div
                key={rev.id || rev.user_name}
                className="glass-panel rounded-3xl p-5 space-y-4 transition-all duration-300 hover:scale-[1.01]"
                style={{
                  borderColor: isMe ? 'rgba(245,166,35,0.3)' : 'var(--border-subtle)',
                  boxShadow: isMe ? '0 0 20px rgba(245,166,35,0.1)' : undefined,
                }}
              >
                {/* Card Header */}
                <div className="flex items-center justify-between">
                  <Link href={`/user/${encodeURIComponent(rev.user_name)}`} className="flex items-center gap-3 group">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm border transition-transform group-hover:scale-105"
                      style={{
                        background: isMe
                          ? 'linear-gradient(135deg, rgba(245,166,35,0.2), rgba(232,121,249,0.15))'
                          : 'rgba(255,255,255,0.05)',
                        borderColor: isMe ? 'rgba(245,166,35,0.5)' : 'var(--border-subtle)',
                        boxShadow: isMe ? '0 0 16px rgba(245,166,35,0.2)' : 'none',
                      }}
                    >
                      <User size={18} style={{ color: isMe ? '#fef08a' : 'var(--text-secondary)' }} />
                    </div>
                    <div className="text-right">
                      <h3
                        className="font-black text-sm leading-tight transition-colors group-hover:text-[#fef08a]"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {rev.user_name}
                      </h3>
                      <p className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>
                        {isMe ? 'حسابك الحالي' : 'عضو في الدائرة'}
                      </p>
                    </div>
                  </Link>

                  {isMe && (
                    <button
                      type="button"
                      onClick={() => openEdit(rev.user_name)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all border active:scale-95"
                      style={{
                        background: 'rgba(245,166,35,0.1)',
                        borderColor: 'rgba(245,166,35,0.35)',
                        color: '#fef08a',
                      }}
                    >
                      <Edit3 size={12} /> تعديل
                    </button>
                  )}
                </div>

                {/* Status + Rating */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  {statusConfig && (
                    <span
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border"
                      style={{
                        background: `${statusConfig.color}18`,
                        color: statusConfig.color,
                        borderColor: `${statusConfig.color}45`,
                      }}
                    >
                      <StatusIcon size={12} />
                      {statusConfig.label}
                    </span>
                  )}
                  {rev.rating !== null && (
                    <div
                      className="flex items-center gap-1.5 px-3 py-1 rounded-xl border"
                      style={{
                        background: 'rgba(245,166,35,0.1)',
                        borderColor: 'rgba(245,166,35,0.4)',
                      }}
                    >
                      <Star size={13} style={{ color: 'var(--accent-amber)', fill: 'var(--accent-amber)' }} />
                      <span className="font-black text-sm" style={{ color: '#fef08a' }}>{rev.rating}</span>
                      <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>/10</span>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {rev.custom_tags && rev.custom_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 justify-end">
                    {rev.custom_tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border"
                        style={{
                          background: 'rgba(232,121,249,0.1)',
                          borderColor: 'rgba(232,121,249,0.3)',
                          color: '#e879f9',
                        }}
                      >
                        <Tag size={9} />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Review text */}
                {rev.review ? (
                  <div
                    className="p-3.5 rounded-2xl text-sm leading-relaxed text-right border-r-2"
                    style={{
                      background: 'rgba(245,166,35,0.06)',
                      borderRightColor: 'var(--accent-amber)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <p className="whitespace-pre-wrap">{rev.review}</p>
                  </div>
                ) : (
                  <p className="text-xs text-right italic" style={{ color: 'var(--text-muted)' }}>
                    لا توجد مراجعة مكتوبة بعد
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div
          className="glass-panel py-10 rounded-3xl text-center space-y-2 p-6"
          style={{ borderStyle: 'dashed', borderColor: 'var(--border-subtle)' }}
        >
          <p className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>
            لم يقم أحد بإضافة مراجعة لهذا العمل بعد
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            كن أول من يكتب انطباعه ويقيّم هذا العمل في الدائرة
          </p>
        </div>
      )}

      {/* ── Modal Sheet ── */}
      {isOpen && activeUser && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 backdrop-blur-md"
            style={{ background: 'rgba(5,5,5,0.85)' }}
            onClick={() => !isPending && setIsOpen(false)}
            aria-hidden="true"
          />

          {/* .sheet-glass modal */}
          <div
            className="sheet-glass fixed inset-x-0 bottom-0 z-50 max-h-[92dvh] overflow-y-auto rounded-t-[2.5rem] p-6 pb-14 space-y-6"
            style={{ animation: 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both' }}
            role="dialog"
            aria-modal="true"
            aria-label={`تعديل مراجعة ${activeUser}`}
          >
            {/* Drag handle */}
            <div className="w-12 h-1 rounded-full mx-auto -mt-1" style={{ background: 'var(--border-luminous)' }} />

            {/* Header */}
            <div
              className="flex items-center justify-between pb-4 border-b"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isPending}
                className="w-9 h-9 rounded-full flex items-center justify-center border transition-colors"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-secondary)',
                }}
              >
                <X size={17} />
              </button>
              <div className="text-right">
                <h3 className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>
                  تقييم ومراجعة {activeUser}
                </h3>
                <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  سجّل تجربتك ورأيك الصريح
                </p>
              </div>
            </div>

            {/* Status Picker */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-right" style={{ color: 'var(--text-secondary)' }}>
                حالة المشاهدة
              </label>
              <div className="grid grid-cols-3 gap-2">
                {STATUS_OPTIONS.map(({ value, label, icon: StatusIcon, color }) => {
                  const active = formStatus === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFormStatus(value)}
                      className="flex flex-col items-center justify-center gap-2 py-3.5 px-2 rounded-2xl text-xs font-black transition-all duration-200 text-center border active:scale-95"
                      style={{
                        background: active ? `${color}20` : 'rgba(255,255,255,0.04)',
                        borderColor: active ? color : 'var(--border-subtle)',
                        color: active ? color : 'var(--text-muted)',
                        boxShadow: active ? `0 0 16px ${color}30` : 'none',
                      }}
                    >
                      <StatusIcon size={19} />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rating 1–10 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                {formRating !== null && (
                  <span className="text-xs font-black" style={{ color: 'var(--accent-amber)' }}>
                    {RATING_LABELS[formRating]} ({formRating}/10)
                  </span>
                )}
                <label className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                  التقييم الرقمي
                </label>
              </div>

              <div className="grid grid-cols-10 gap-1.5">
                {Array.from({ length: 10 }).map((_, i) => {
                  const score   = i + 1;
                  const filled  = formRating !== null && score <= formRating;
                  const current = formRating === score;
                  return (
                    <button
                      key={score}
                      type="button"
                      onClick={() => setFormRating(score)}
                      className="h-11 rounded-xl flex items-center justify-center font-black text-sm transition-all duration-150 border active:scale-90"
                      style={{
                        background: filled
                          ? 'linear-gradient(135deg, #fef08a, #f5a623)'
                          : 'rgba(255,255,255,0.04)',
                        color: filled ? '#050505' : 'var(--text-muted)',
                        borderColor: current ? '#ffffff' : filled ? 'transparent' : 'var(--border-subtle)',
                        transform: current ? 'scale(1.12)' : 'scale(1)',
                        boxShadow: current ? '0 0 16px rgba(245,166,35,0.5)' : 'none',
                      }}
                    >
                      {score}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Tags */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-right" style={{ color: 'var(--text-secondary)' }}>
                وسوم التعبير السريع
              </label>
              <div className="flex flex-wrap gap-2 justify-end">
                {CUSTOM_TAGS.map((tag) => {
                  const selected = formTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black border transition-all duration-200 active:scale-95"
                      style={{
                        background: selected
                          ? 'linear-gradient(135deg, rgba(245,166,35,0.25), rgba(232,121,249,0.2))'
                          : 'rgba(255,255,255,0.04)',
                        borderColor: selected ? 'var(--accent-amber)' : 'var(--border-subtle)',
                        color: selected ? '#fef08a' : 'var(--text-secondary)',
                        boxShadow: selected ? '0 0 12px rgba(245,166,35,0.2)' : 'none',
                      }}
                    >
                      <Tag size={11} />
                      <span>{tag}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Review Textarea */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-right" style={{ color: 'var(--text-secondary)' }}>
                مراجعتك المكتوبة (اختياري)
              </label>
              <textarea
                value={formReview}
                onChange={(e) => setFormReview(e.target.value)}
                placeholder="اكتب انطباعك وتفاصيل تجربتك مع هذا العمل…"
                rows={4}
                dir="rtl"
                style={{ ...inputStyle, textAlign: 'right' }}
                onFocus={onFocusGlow}
                onBlur={onBlurGlow}
              />
            </div>

            {/* Feedback */}
            {error && (
              <p
                className="text-xs text-center rounded-2xl py-3 px-4 font-bold border"
                style={{ color: '#f87171', background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' }}
              >
                {error}
              </p>
            )}
            {success && (
              <p
                className="text-xs text-center rounded-2xl py-3 px-4 font-bold border"
                style={{ color: '#34d399', background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.3)' }}
              >
                {success}
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              {hasExisting && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isPending}
                  className="px-5 py-4 rounded-2xl font-black text-xs flex items-center gap-1.5 border transition-all active:scale-95"
                  style={{
                    color: '#f87171',
                    background: 'rgba(239,68,68,0.1)',
                    borderColor: 'rgba(239,68,68,0.3)',
                  }}
                >
                  <Trash2 size={16} />
                  حذف
                </button>
              )}

              {/* .btn-cinematic */}
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="btn-cinematic flex-1 flex items-center justify-center gap-2.5 text-sm py-4 rounded-2xl disabled:opacity-40 disabled:pointer-events-none"
              >
                {isPending ? (
                  <><Loader2 size={18} className="animate-spin" /> جاري الحفظ…</>
                ) : (
                  <><Check size={18} strokeWidth={3} /> حفظ المراجعة</>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
