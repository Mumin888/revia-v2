'use client';

import { useState, useTransition, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  X, Loader2, Film, Tv2, Sparkles,
  Check, Plus, Bookmark, CheckCircle2, Trash2,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import type { SearchResult, WatchStatus } from '@/lib/types';

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

export default function AddToLibrarySheet({ item, onClose, onSuccess }: AddToLibrarySheetProps) {
  const router = useRouter();
  const [status, setStatus]     = useState<WatchStatus>('to_watch');
  const [userName, setUserName] = useState<string>('');
  const [userId, setUserId]     = useState<string | null>(null);
  const [existingMediaId, setExistingMediaId]   = useState<string | null>(null);
  const [existingReviewId, setExistingReviewId] = useState<string | null>(null);
  const [hasExistingReview, setHasExistingReview] = useState(false);
  const [done, setDone]   = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, start] = useTransition();

  useEffect(() => {
    async function initUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data: profile } = await supabase
        .from('profiles').select('username').eq('id', user.id).maybeSingle();
      setUserName(
        profile?.username ||
        (user.user_metadata?.username as string) ||
        (user.email ? user.email.split('@')[0] : 'User')
      );
    }
    initUser();
  }, []);

  useEffect(() => {
    async function checkExisting() {
      if (!item || !userName) return;
      setDone(false); setError(null);
      const { data: media } = await supabase
        .from('media_items')
        .select('id, reviews:media_reviews(*)')
        .eq('tmdb_id', item.tmdb_id)
        .eq('media_type', item.media_type)
        .maybeSingle();

      if (media) {
        setExistingMediaId(media.id);
        const review = (media.reviews as Array<{ id: string; user_name: string; user_id?: string; status: WatchStatus }> | null)?.find(
          (r) => r.user_name.toLowerCase() === userName.toLowerCase() || (userId && r.user_id === userId)
        );
        if (review) {
          setHasExistingReview(true); setExistingReviewId(review.id); setStatus(review.status);
        } else {
          setHasExistingReview(false); setExistingReviewId(null); setStatus('to_watch');
        }
      } else {
        setExistingMediaId(null); setHasExistingReview(false); setExistingReviewId(null); setStatus('to_watch');
      }
    }
    checkExisting();
  }, [item, userName, userId]);

  if (!item) return null;

  const meta = TYPE_META[item.media_type];
  const Icon = meta.Icon;
  const year = item.release_date?.slice(0, 4);

  async function handleAdd() {
    if (!item) return;
    setError(null);
    start(async () => {
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
    });
  }

  async function handleRemove() {
    if (!existingMediaId) return;
    setError(null);
    start(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const query = supabase.from('media_reviews').delete().eq('media_id', existingMediaId);
      if (existingReviewId) {
        query.eq('id', existingReviewId);
      } else if (user?.id) {
        query.or(`user_id.eq.${user.id},user_name.ilike.${userName}`);
      } else {
        query.eq('user_name', userName);
      }
      const { error: delErr } = await query;
      if (delErr) { setError('تعذّر حذف العمل من المكتبة.'); return; }
      setDone(true);
      setTimeout(() => { onClose(); router.refresh(); }, 350);
    });
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 backdrop-blur-md transition-opacity"
        style={{ background: 'rgba(5,5,5,0.85)' }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ── .sheet-glass modal (exact class from globals.css @layer components) ── */}
      <div
        className="sheet-glass fixed inset-x-0 bottom-0 z-50 rounded-t-[2.5rem] p-6 pb-12 space-y-6"
        style={{ animation: 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both' }}
        role="dialog"
        aria-modal="true"
        aria-label={`إضافة ${item.title} إلى المكتبة`}
      >
        {/* Drag handle */}
        <div className="w-12 h-1 rounded-full mx-auto -mt-1" style={{ background: 'var(--border-luminous)' }} />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 start-5 w-9 h-9 rounded-full flex items-center justify-center transition-colors backdrop-blur-xl border"
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
        <div className="flex items-center gap-4 pt-1">
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
              className="px-5 py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 transition-all active:scale-97 border"
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
      </div>
    </>
  );
}
