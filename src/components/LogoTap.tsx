'use client';

// ─────────────────────────────────────────────────────────────
//  REVIA Easter Egg #1 — Cinematic Premiere Mode (Logo Tap ×5)
//  Velvet red curtain backdrop, interactive spotlight (mouse & touch),
//  ambient automated light pan, floating dust motes, and golden accents.
// ─────────────────────────────────────────────────────────────

import { useState, useCallback, useEffect, useRef } from 'react';
import { Clapperboard, Film, X } from 'lucide-react';
import { showToast } from '@/components/Toaster';

const PREMIERE_PALETTE = {
  '--bg-base':        '#0c0103',
  '--bg-surface':     'rgba(40, 4, 12, 0.65)',
  '--bg-elevated':    'rgba(55, 6, 16, 0.75)',
  '--accent-amber':   '#f59e0b',   // Golden premiere amber
  '--accent-rose':    '#e11d48',   // Cinema velvet red
  '--accent-glow':    'rgba(245, 158, 11, 0.5)',
  '--text-primary':   '#fff1f2',
  '--text-secondary': '#fda4af',
  '--text-muted':     '#fb7185',
  '--border-subtle':  'rgba(244, 63, 94, 0.25)',
  '--border-luminous':'rgba(245, 158, 11, 0.45)',
};

const DEFAULT_PALETTE: Record<string, string> = {
  '--bg-base':        '#050505',
  '--bg-surface':     'rgba(18,18,21,0.35)',
  '--bg-elevated':    'rgba(24,24,28,0.45)',
  '--accent-amber':   '#f5a623',
  '--accent-rose':    '#e879f9',
  '--accent-glow':    'rgba(245, 166, 35, 0.45)',
  '--text-primary':   '#ffffff',
  '--text-secondary': '#a1a1aa',
  '--text-muted':     '#71717a',
  '--border-subtle':  'rgba(255,255,255,0.08)',
  '--border-luminous':'rgba(255,255,255,0.15)',
};

export default function LogoTap() {
  const [tapCount, setTapCount] = useState(0);
  const [cinematicMode, setCinematicMode] = useState(false);
  const [flash, setFlash] = useState(false);

  // Spotlight position
  const [spotlight, setSpotlight] = useState<{ x: number; y: number; manual: boolean }>({
    x: 50,
    y: 30,
    manual: false,
  });
  const manualTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track mouse and touch coordinates
  useEffect(() => {
    if (!cinematicMode) return;

    const handlePointerMove = (clientX: number, clientY: number) => {
      const x = (clientX / window.innerWidth) * 100;
      const y = (clientY / window.innerHeight) * 100;
      setSpotlight({ x, y, manual: true });

      if (manualTimeoutRef.current) clearTimeout(manualTimeoutRef.current);
      // Revert to ambient animation after 4 seconds of idle
      manualTimeoutRef.current = setTimeout(() => {
        setSpotlight((prev) => ({ ...prev, manual: false }));
      }, 4000);
    };

    const onMouseMove = (e: MouseEvent) => {
      handlePointerMove(e.clientX, e.clientY);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchstart', onTouchStart);
      if (manualTimeoutRef.current) clearTimeout(manualTimeoutRef.current);
    };
  }, [cinematicMode]);

  const applyMode = useCallback((activating: boolean) => {
    const palette = activating ? PREMIERE_PALETTE : DEFAULT_PALETTE;
    Object.entries(palette).forEach(([key, val]) => {
      document.documentElement.style.setProperty(key, val);
    });

    if (activating) {
      document.documentElement.classList.add('cinematic-premiere-active');
      showToast('Cinematic Mode Unlocked! 🎟️🎬');
    } else {
      document.documentElement.classList.remove('cinematic-premiere-active');
      showToast('Returned to Classic Cinema 🎬');
    }

    setCinematicMode(activating);
  }, []);

  const handleTap = useCallback(() => {
    setFlash(true);
    setTimeout(() => setFlash(false), 200);

    setTapCount((prev) => {
      const next = prev + 1;
      if (next >= 5) {
        applyMode(!cinematicMode);
        return 0;
      }
      setTimeout(() => setTapCount(0), 1600);
      return next;
    });
  }, [cinematicMode, applyMode]);

  return (
    <>
      {/* ── Logo with Tap Easter Egg ── */}
      <button
        type="button"
        onClick={handleTap}
        aria-label="REVIA logo"
        className="flex items-center gap-3 select-none active:scale-95 transition-transform duration-150"
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        {/* Tap counter progress dots */}
        {tapCount >= 2 && (
          <div className="flex gap-1 items-center">
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full transition-all duration-200"
                style={{
                  background: i < tapCount ? 'var(--accent-amber)' : 'var(--border-subtle)',
                  boxShadow: i < tapCount ? '0 0 6px var(--accent-amber)' : 'none',
                }}
              />
            ))}
          </div>
        )}

        <h1 className="text-gradient-amber-rose text-3xl sm:text-4xl font-black tracking-widest">
          REVIA
        </h1>

        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center border transition-all duration-200"
          style={{
            background: flash
              ? 'linear-gradient(135deg, #e11d48 0%, #f59e0b 100%)'
              : 'linear-gradient(135deg, #fef08a 0%, #f5a623 50%, #e879f9 100%)',
            borderColor: 'rgba(245,166,35,0.4)',
            boxShadow: flash
              ? '0 0 40px rgba(245,158,11,0.9)'
              : '0 0 25px rgba(245,166,35,0.4)',
            transform: flash ? 'scale(1.15) rotate(-10deg)' : 'scale(1)',
          }}
        >
          <Clapperboard size={22} color="#050505" strokeWidth={2.8} />
        </div>
      </button>

      {/* ── Cinematic Premiere Fullscreen Spotlight & Dust Overlay ── */}
      {cinematicMode && (
        <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden select-none">
          {/* Spotlight Cone */}
          <div
            className="absolute inset-0 transition-all duration-300"
            style={
              spotlight.manual
                ? {
                    background: `radial-gradient(circle 380px at ${spotlight.x}% ${spotlight.y}%, rgba(254, 240, 138, 0.16) 0%, rgba(245, 158, 11, 0.08) 40%, transparent 75%)`,
                  }
                : {
                    background:
                      'radial-gradient(circle 420px at 50% 35%, rgba(254, 240, 138, 0.15) 0%, rgba(245, 158, 11, 0.07) 45%, transparent 75%)',
                    animation: 'ambientSpotlightPan 18s ease-in-out infinite',
                  }
            }
          />

          {/* Cinematic Dust Motes floating in the light beam */}
          {Array.from({ length: 28 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${1.5 + (i % 3.5)}px`,
                height: `${1.5 + (i % 3.5)}px`,
                top: `${(i * 13) % 100}%`,
                left: `${(i * 29) % 100}%`,
                background: i % 2 === 0 ? '#fef08a' : '#f59e0b',
                boxShadow: '0 0 6px rgba(245, 158, 11, 0.8)',
                animation: `dustMoteFloat ${4 + (i % 6)}s ${(i * 0.35)}s infinite ease-in-out`,
              }}
            />
          ))}
        </div>
      )}

      {/* ── Floating Premiere Badge (when active) ── */}
      {cinematicMode && (
        <div
          className="fixed bottom-24 end-4 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border backdrop-blur-2xl shadow-2xl animate-fade-in-up font-sans text-xs font-black select-none pointer-events-auto"
          style={{
            background: 'rgba(25, 2, 7, 0.95)',
            borderColor: 'rgba(245, 158, 11, 0.55)',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.85), 0 0 25px rgba(245, 158, 11, 0.35)',
            color: '#fef08a',
          }}
        >
          <div className="relative flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping absolute" />
            <span className="w-2 h-2 rounded-full bg-amber-300 relative" />
          </div>

          <div className="flex items-center gap-1.5">
            <Film size={14} className="text-amber-400" />
            <span>Cinematic Premiere 🎟️🎬</span>
          </div>

          <button
            type="button"
            onClick={() => applyMode(false)}
            title="العودة للوضع الاعتيادي"
            className="ms-1.5 p-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 transition-colors flex items-center justify-center"
          >
            <X size={13} strokeWidth={2.5} />
          </button>
        </div>
      )}
    </>
  );
}
