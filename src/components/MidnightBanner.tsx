'use client';

// ─────────────────────────────────────────────────────────────
//  REVIA Easter Egg #6 — Midnight Marathon 🌙
//  Checks local time; displays banner if between 12 AM and 5 AM.
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { Moon, Popcorn } from 'lucide-react';

export default function MidnightBanner() {
  const [isMidnight, setIsMidnight] = useState(false);

  useEffect(() => {
    const hours = new Date().getHours();
    // 12:00 AM (0) to 4:59 AM (4)
    if (hours >= 0 && hours < 5) {
      setIsMidnight(true);
    }
  }, []);

  if (!isMidnight) return null;

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-4 my-3 text-right transition-all duration-500 animate-fade-in-up border"
      style={{
        background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.75) 0%, rgba(15, 23, 42, 0.9) 100%)',
        borderColor: 'rgba(129, 140, 248, 0.35)',
        boxShadow: '0 8px 32px rgba(99, 102, 241, 0.18), inset 0 0 20px rgba(129, 140, 248, 0.1)',
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center border"
            style={{
              background: 'rgba(129, 140, 248, 0.2)',
              borderColor: 'rgba(129, 140, 248, 0.4)',
              color: '#c7d2fe',
            }}
          >
            <Popcorn size={16} />
          </div>
          <span className="text-[10px] font-black tracking-widest px-2 py-0.5 rounded-full border bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
            MIDNIGHT MARATHON
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <h4 className="text-xs font-black text-indigo-200">
              Midnight Movie Marathon? Grab your popcorn! 🍿
            </h4>
            <p className="text-[11px] font-semibold text-indigo-300/80">
              أجواء سينمائية ليلية هادئة لعشاق السهر
            </p>
          </div>
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center border flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, rgba(129, 140, 248, 0.3), rgba(232, 121, 249, 0.2))',
              borderColor: 'rgba(129, 140, 248, 0.5)',
              boxShadow: '0 0 16px rgba(129, 140, 248, 0.3)',
            }}
          >
            <Moon size={20} className="text-amber-300 fill-amber-300/30" />
          </div>
        </div>
      </div>
    </div>
  );
}
