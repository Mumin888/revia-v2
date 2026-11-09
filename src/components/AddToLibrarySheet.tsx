'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  X, Loader2, Film, Tv2, Sparkles,
  Check, Plus, Bookmark, CheckCircle2, Trash2,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import type { SearchResult, WatchStatus } from '@/lib/types';
import { isOwnReview } from '@/lib/security';
import { showToast } from '@/components/Toaster';
import BottomSheet from '@/components/BottomSheet';

const TYPE_META = {
  movie:  { label: 'فيلم',   Icon: Film,     color: '#60a5fa' },
  series: { label: 'مسلسل',  Icon: Tv2,      color: '#c084fc' },
  anime:  { label: 'أنمي',   Icon: Sparkles, color: '#e879f9' },
} as const;

const STATUS_OPTIONS: { value: WatchStatus; label: string; icon: typeof Bookmark; color: string }[] = [
  { value: 'to_watch',    label: 'قائمة المشاهدة', icon: Bookmark,     color: '#818cf8' },
  { value: 'watched',     label: 'شاهدت',          icon: CheckCircle2, color: '#34d399' },
  { value: 'recommended', label: 'توصية مميزة',    icon: Sparkles,     color: '#e879f9' },
];

interface AddToLibrarySheetProps {
  item: SearchResult | null;
  onClose: () => void;
  onSuccess?: (mediaId: string) => void;
}

type ExistingReview = { id: string; user_name: string; user_id?: string | null; status: WatchStatus };

export default function AddToLibrarySheet({ item, onClose, onSuccess }: AddToLibrarySheetProps) {
  const [userName, setUserName] = useState<string>('');
  const [userId, setUserId]     = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function initUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      const { data: profile } = await supabase
        .from('profiles').select('username').eq('id', user.id).maybeSingle();
      if (cancelled) return;
      setUserId(user.id);
      setUserName(
        profile?.username ||
        (user.user_metadata?.username as string) ||
        (user.email ? user.email.split('@')[0] : 'User')
      );
    }
    initUser();
    return () => { cancelled = true; };
  }, []);

  if (!item) return null;

  // Keyed by title: each opened item gets a fresh body, so nothing loaded for
  // the previous one (its saved review, its "remove" button) can act on this one.
  return (
    <SheetBody
      key={`${item.media_type}-${item.tmdb_id}`}
      item={item}
      userName={userName}
      userId={userId}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}

interface SheetBodyProps {
  item: SearchResult;
  userName: string;
  userId: string | null;
  onClose: () => void;
  onSuccess?: (mediaId: string) => void;
}

function SheetBody({ item, userName, userId, onClose, onSuccess }: SheetBodyProps) {
  const router = useRouter();
  const [status, setStatus]     = useState<WatchStatus>('to_watch');
  const [existingReviewId, setExistingReviewId] = useState<string | null>(null);
  const [done, setDone]   = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Real in-flight flag: stays true for the whole request, so the buttons
  // cannot be pressed twice while a save or delete is still running.
  const [isPending, setIsPending] = useState(false);

  const hasExistingReview = existingReviewId !== null;

  useEffect(() => {
    if (!userName) return;
    let cancelled = false;

    async function checkExisting() {
      const { data: media } = await supabase
        .from('media_items')
        .select('id, reviews:media_reviews(id, user_name, user_id, status)')
        .eq('tmdb_id', item.tmdb_id)
        .eq('media_type', item.media_type)
        .maybeSingle();
      if (cancelled) return;

      const review = (media?.reviews as ExistingReview[] | null | undefined)?.find(
        (r) => isOwnReview(r, userId, userName)
      );
      if (review) {
        setExistingReviewId(review.id);
        setStatus(review.status);
      }
    }
    checkExisting();
    return () => { cancelled = true; };
  }, [item, userName, userId]);

  const meta = TYPE_META[item.media_type];
  const Icon = meta.Icon;
  const year = item.release_date?.slice(0, 4);

  async function handleAdd() {
    if (isPending || done) return;
    setError(null);

    // ── Sarcastic Toast Easter Egg ──
    if (typeof item.vote_average === 'number' && item.vote_average > 0 && item.vote_average < 4.0) {
      showToast('Are you sure you want to waste your time on this? 😂');
    }

    setIsPending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError('يرجى تسجيل الدخول أولاً.'); return; }

      const { data: profile } = await supabase
        .from('profiles').select('username').eq('id', user.id).maybeSingle();
      const activeUsername =
        profile?.username || userName ||
        (user.user_metadata?.username as string) ||
        (user.email ? user.email.split('@')[0] : 'User');

      const { data: existingItem, error: fetchErr } = await supabase
        .from('media_items').select('id')
        .eq('tmdb_id', item.tmdb_id).eq('media_type', item.media_type).maybeSingle();
      if (fetchErr) { setError('حدث خطأ أثناء البحث في المكتبة.'); return; }

      let mediaId: string;
      if (existingItem) {
        mediaId = existingItem.id;
      } else {
        const { data: inserted, error: insertErr } = await supabase
          .from('media_items')
          .insert({
            tmdb_id: item.tmdb_id, media_type: item.media_type,
            title: item.title, poster_path: item.poster_path,
            release_date: item.release_date,
            genres: item.genre_ids.map(String), overview: item.overview,
          })
          .select('id').single();
        if (insertErr || !inserted) { setError('تعذّر إضافة العنوان إلى المكتبة.'); return; }
        mediaId = inserted.id;
      }

      const reviewPayload: Record<string, unknown> = {
        media_id: mediaId, user_name: activeUsername, user_id: user.id, status,
      };
      if (existingReviewId) reviewPayload.id = existingReviewId;

      const { error: reviewErr } = await supabase
        .from('media_reviews')
        .upsert(reviewPayload, { onConflict: 'media_id,user_name' });
      if (reviewErr) { setError('تعذّر حفظ حالة المشاهدة.'); return; }

      setDone(true);
      setTimeout(() => { if (onSuccess) onSuccess(mediaId); onClose(); router.push(`/media/${mediaId}`); }, 350);
    } catch {
      setError('تعذّر حفظ حالة المشاهدة.');
    } finally {
      setIsPending(false);
    }
  }

  async function handleRemove() {
    // Only ever the one review this sheet loaded for the signed-in member,
    // addressed by its id. No filter is built from the username.
    if (!existingReviewId || isPending || done) return;
    setError(null);

    setIsPending(true);
    try {
      const { data: removed, error: delErr } = await supabase
        .from('media_reviews')
        .delete()
        .eq('id', existingReviewId)
        .select('id');
      // No rows back means nothing was deleted (for example a policy refused it).
      if (delErr || !removed || removed.length === 0) {
        setError('تعذّر حذف العمل من المكتبة.');
        return;
      }
      setDone(true);
      setTimeout(() => { onClose(); router.refresh(); }, 350);
    } catch {
      setError('تعذّر حذف العمل من المكتبة.');
    } finally {
      setIsPending(false);
    }
  }

  return (
    // BottomSheet provides the backdrop, drag handle, slide animation,
    // Escape / drag-to-dismiss, focus handling and scroll lock.
    <BottomSheet
      onClose={onClose}
      label={`إضافة ${item.title} إلى المكتبة`}
      dismissible={!isPending}
    >
      {(close) => (
        <>
        {/* Close */}
        <button
          type="button"
          onClick={close}
          className="absolute top-4 start-5 w-9 h-9 rounded-full flex items-center justify-center transition-colors border"
          style={{
            background: 'rgba(255,255,255,0.05)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-secondary)',
          }}
          aria-label="إغلاق"
        >
          <X size={18} />
        </button>

        {/* Item preview */}
        <div className="flex items-center gap-4 pt-3">
          <div
            className="relative w-16 h-24 rounded-2xl overflow-hidden flex-shrink-0 shadow-2xl border"
            style={{
              background: 'var(--bg-elevated)',
              borderColor: 'var(--border-luminous)',
              boxShadow: '0 0 20px var(--accent-glow)',
            }}
          >
            {item.poster_path ? (
              <Image src={`https://image.tmdb.org/t/p/w185${item.poster_path}`} alt={item.title} fill sizes="64px" className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center opacity-40">
                <Icon size={24} color={meta.color} />
              </div>
            )}
          </div>
          <div className="flex-1 text-right space-y-1.5">
            <h3 className="font-black text-lg leading-snug line-clamp-1" style={{ color: 'var(--text-primary)' }}>
              {item.title}
            </h3>
            <div className="flex items-center gap-2 justify-end">
              {year && (
                <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>{year}</span>
              )}
              <span
                className="text-[10px] font-black px-2.5 py-0.5 rounded-md border"
                style={{ background: `${meta.color}20`, color: meta.color, borderColor: `${meta.color}40` }}
              >
                {meta.label}
              </span>
            </div>
          </div>
        </div>

        {/* User indicator — .glass-panel card */}
        {userName && (
          <div
            className="glass-panel flex items-center justify-between p-3.5 rounded-2xl text-xs"
          >
            <span style={{ color: 'var(--text-secondary)' }}>إضافة باسم:</span>
            <span className="font-black" style={{ color: '#fef08a' }}>{userName}</span>
          </div>
        )}

        {/* Status options */}
        <div className="space-y-2.5">
          <p className="text-xs font-bold text-right" style={{ color: 'var(--text-secondary)' }}>
            اختر حالة المشاهدة
          </p>
          <div className="flex flex-col gap-2.5">
            {STATUS_OPTIONS.map(({ value, label, icon: StatusIcon, color }) => {
              const active = status === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatus(value)}
                  className="flex items-center justify-between px-4 py-3.5 rounded-2xl font-bold text-xs transition-all duration-250 backdrop-blur-xl border"
                  style={{
                    background: active
                      ? 'linear-gradient(135deg, rgba(245,166,35,0.18) 0%, rgba(232,121,249,0.12) 100%)'
                      : 'rgba(255,255,255,0.04)',
                    borderColor: active ? 'var(--accent-amber)' : 'var(--border-subtle)',
                    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                    boxShadow: active ? '0 0 18px rgba(245,166,35,0.2)' : 'none',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <StatusIcon size={18} style={{ color: active ? '#fef08a' : color }} />
                    <span className="text-sm">{label}</span>
                  </div>
                  {active && (
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(135deg, var(--accent-amber), var(--accent-rose))',
                        color: 'var(--bg-base)',
                      }}
                    >
                      <Check size={12} strokeWidth={3.5} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs text-red-400 border border-red-500/30 py-3 px-4 rounded-2xl text-center font-bold" style={{ background: 'rgba(239,68,68,0.1)' }}>
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          {hasExistingReview && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={isPending || done}
              className="px-5 py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 transition-all active:scale-97 border disabled:opacity-40 disabled:pointer-events-none"
              style={{ color: '#f87171', background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' }}
            >
              <Trash2 size={17} />
              إزالة
            </button>
          )}

          {/* ── .btn-cinematic (exact class from globals.css) ── */}
          <button
            onClick={handleAdd}
            disabled={isPending || done}
            className="btn-cinematic flex-1 flex items-center justify-center gap-2.5 text-sm py-4 rounded-2xl disabled:opacity-40 disabled:pointer-events-none"
          >
            {done ? (
              <><Check size={20} strokeWidth={3} /> تم الحفظ بنجاح</>
            ) : isPending ? (
              <><Loader2 size={20} className="animate-spin" /> جاري الحفظ…</>
            ) : hasExistingReview ? (
              <><Check size={20} strokeWidth={3} /> تحديث الحالة والانتقال</>
            ) : (
              <><Plus size={20} strokeWidth={3} /> إضافة والانتقال للتقييم</>
            )}
          </button>
        </div>
        </>
      )}
    </BottomSheet>
  );
}
