'use client';

// ─────────────────────────────────────────────────────────────
//  REVIA Easter Egg #8 — The Hidden Scroll 📜
//  Hidden message revealed at the absolute bottom of the layout.
// ─────────────────────────────────────────────────────────────

import { Sparkles, Heart } from 'lucide-react';

export default function HiddenScrollQuote() {
  return (
    <div
      className="w-full pt-10 pb-8 px-6 text-center select-none opacity-80 hover:opacity-100 transition-opacity duration-300"
      dir="rtl"
    >
      <div
        className="max-w-md mx-auto p-5 rounded-3xl space-y-3 border backdrop-blur-xl transition-all duration-300"
        style={{
          background: 'linear-gradient(180deg, rgba(18, 18, 21, 0.4) 0%, rgba(10, 10, 12, 0.7) 100%)',
          borderColor: 'rgba(245, 166, 35, 0.2)',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(245, 166, 35, 0.05)',
        }}
      >
        <div className="flex items-center justify-center gap-2 text-amber-400">
          <Sparkles size={14} />
          <span className="text-[10px] font-black tracking-widest uppercase">
            The Hidden Scroll 📜
          </span>
          <Sparkles size={14} />
        </div>

        <p
          className="text-xs italic font-semibold leading-relaxed"
          style={{ color: 'var(--text-secondary)' }}
        >
          «السينما ليست مجرد تسلية، إنها مرآة لأرواحنا وذكرياتنا المشتركة.»
        </p>

        <div className="w-12 h-0.5 mx-auto rounded-full bg-gradient-to-r from-amber-400/40 via-purple-400/40 to-amber-400/40" />

        <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-amber-300/90">
          <span>صُنع بشغف وحب للسينما</span>
          <Heart size={12} className="text-rose-500 fill-rose-500 inline" />
          <span>بواسطة Ozz & Team</span>
        </div>

        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
          شكرًا لأنك تصنع ذكريات سينمائية لا تُنسى في REVIA ✨
        </p>
      </div>
    </div>
  );
}
