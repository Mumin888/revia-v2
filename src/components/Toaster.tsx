'use client';

// ─────────────────────────────────────────────────────────────
//  REVIA — Toast & Confetti System
//  Usage:  showToast('message')  /  launchConfetti()
//  Add <Toaster /> once in layout.tsx
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';

// ── Public API ────────────────────────────────────────────────

export function showToast(message: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('revia:toast', { detail: { message } }));
}

export function launchConfetti() {
  if (typeof window === 'undefined') return;
  const colors = ['#f5a623', '#e879f9', '#34d399', '#60a5fa', '#fbbf24', '#f87171'];
  const container = document.createElement('div');
  container.style.cssText =
    'position:fixed;inset:0;pointer-events:none;z-index:99999;overflow:hidden;';
  document.body.appendChild(container);

  for (let i = 0; i < 100; i++) {
    const piece   = document.createElement('div');
    const color   = colors[Math.floor(Math.random() * colors.length)];
    const x       = Math.random() * 100;
    const delay   = Math.random() * 0.6;
    const dur     = 1.8 + Math.random() * 1.2;
    const size    = 6 + Math.random() * 9;
    const isCircle = Math.random() > 0.5;
    piece.style.cssText =
      `position:absolute;top:-30px;left:${x}%;width:${size}px;height:${size}px;` +
      `background:${color};border-radius:${isCircle ? '50%' : '2px'};` +
      `animation:reviaConfettiFall ${dur}s ${delay}s ease-in forwards;` +
      `transform:rotate(${Math.random() * 360}deg);`;
    container.appendChild(piece);
  }

  const style = document.createElement('style');
  style.id = 'revia-confetti-style';
  style.textContent =
    '@keyframes reviaConfettiFall{' +
    '0%{transform:translateY(0) rotate(0deg) scale(1);opacity:1}' +
    '80%{opacity:1}' +
    '100%{transform:translateY(115vh) rotate(900deg) scale(0.5);opacity:0}}';
  if (!document.getElementById('revia-confetti-style')) {
    document.head.appendChild(style);
  }
  setTimeout(() => container.remove(), 3500);
}

// ── Toaster Component ─────────────────────────────────────────

interface ToastItem {
  id: number;
  message: string;
  exiting: boolean;
}

export function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const { message } = (e as CustomEvent<{ message: string }>).detail;
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev.slice(-4), { id, message, exiting: false }]);

      // Start exit animation after 2.8s, remove after 3.3s
      setTimeout(() => {
        setToasts((prev) =>
          prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
        );
      }, 2800);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3300);
    };

    window.addEventListener('revia:toast', handler);
    return () => window.removeEventListener('revia:toast', handler);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-32 inset-x-0 flex flex-col items-center gap-2 z-[99998] px-4 pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto max-w-sm w-full"
          style={{
            animation: t.exiting
              ? 'reviaToastOut 0.45s cubic-bezier(0.4,0,1,1) forwards'
              : 'reviaToastIn 0.45s cubic-bezier(0.16,1,0.3,1) forwards',
          }}
        >
          <div
            className="flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-black text-right"
            style={{
              background: 'linear-gradient(135deg, rgba(22,22,26,0.97) 0%, rgba(12,12,14,0.98) 100%)',
              backdropFilter: 'blur(30px)',
              border: '1px solid rgba(245,166,35,0.35)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(245,166,35,0.15)',
              color: 'var(--text-primary)',
            }}
          >
            <span className="flex-1 leading-snug">{t.message}</span>
            <div
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: 'var(--accent-amber)', boxShadow: '0 0 8px var(--accent-amber)' }}
            />
          </div>
        </div>
      ))}

      {/* Toast animations */}
      <style>{`
        @keyframes reviaToastIn {
          from { opacity: 0; transform: translateY(20px) scale(0.92); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
        @keyframes reviaToastOut {
          from { opacity: 1; transform: translateY(0)    scale(1); }
          to   { opacity: 0; transform: translateY(-12px) scale(0.95); }
        }
      `}</style>
    </div>
  );
}
