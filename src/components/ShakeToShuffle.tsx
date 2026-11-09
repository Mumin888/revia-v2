'use client';

// ─────────────────────────────────────────────────────────────
//  REVIA Easter Egg #9 — Shake to Shuffle 🎲
//  Device motion shake listener + desktop shuffle button.
// ─────────────────────────────────────────────────────────────

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Dices, Loader2 } from 'lucide-react';
import { showToast } from '@/components/Toaster';
import AddToLibrarySheet from '@/components/AddToLibrarySheet';
import type { SearchResult } from '@/lib/types';

// iOS (13+) only delivers motion events after the page has asked for
// permission, and only lets it ask from inside a tap.
type MotionEventWithPermission = typeof DeviceMotionEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>;
};

function motionNeedsPermission(): boolean {
  return (
    typeof DeviceMotionEvent !== 'undefined' &&
    typeof (DeviceMotionEvent as MotionEventWithPermission).requestPermission === 'function'
  );
}

export default function ShakeToShuffle() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [randomItem, setRandomItem] = useState<SearchResult | null>(null);
  const lastShakeTime = useRef<number>(0);
  // Whether the shake listener may be attached. Decided after mount: true
  // straight away where no permission is needed, on iOS once it is granted.
  const [motionAllowed, setMotionAllowed] = useState(false);
  const motionAsked = useRef(false);

  useEffect(() => {
    if (typeof DeviceMotionEvent !== 'undefined' && !motionNeedsPermission()) {
      setMotionAllowed(true);
    }
  }, []);

  // Called from the shuffle button's tap: the first tap on an iPhone also
  // asks for motion access, which is what makes shaking work afterwards.
  const requestMotionAccess = useCallback(() => {
    if (motionAsked.current || !motionNeedsPermission()) return;
    motionAsked.current = true;
    (DeviceMotionEvent as MotionEventWithPermission)
      .requestPermission?.()
      .then((result) => {
        if (result === 'granted') setMotionAllowed(true);
      })
      .catch(() => {
        // Declined or unavailable: the button keeps working without shaking.
      });
  }, []);

  const handleShuffle = useCallback(async () => {
    if (loading) return;
    const now = Date.now();
    if (now - lastShakeTime.current < 2500) return;
    lastShakeTime.current = now;

    setLoading(true);
    showToast('The universe has chosen a movie for you! 🌌');

    try {
      // Pick random page from browse movies
      const randomPage = Math.floor(Math.random() * 5) + 1;
      const res = await fetch(`/api/browse?tab=movies&page=${randomPage}`);
      if (!res.ok) throw new Error('Fetch failed');
      const data = await res.json();
      const results: SearchResult[] = data.results ?? [];

      if (results.length > 0) {
        const picked = results[Math.floor(Math.random() * results.length)];
        setRandomItem(picked);
      } else {
        router.push('/wheel');
      }
    } catch {
      router.push('/wheel');
    } finally {
      setLoading(false);
    }
  }, [loading, router]);

  useEffect(() => {
    if (!motionAllowed) return;

    let lastX = 0, lastY = 0, lastZ = 0;
    const threshold = 18;

    // A jolt while someone is typing or has a sheet open must not pull a
    // random title over what they are doing.
    const isBusy = () => {
      if (document.querySelector('[role="dialog"]')) return true;
      const active = document.activeElement;
      return active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement;
    };

    const handleMotion = (event: DeviceMotionEvent) => {
      const current = event.accelerationIncludingGravity;
      if (!current || current.x === null || current.y === null || current.z === null) return;

      const deltaX = Math.abs(current.x - lastX);
      const deltaY = Math.abs(current.y - lastY);
      const deltaZ = Math.abs(current.z - lastZ);

      if (
        ((deltaX > threshold && deltaY > threshold) || (deltaX > threshold && deltaZ > threshold) || (deltaY > threshold && deltaZ > threshold)) &&
        !isBusy()
      ) {
        handleShuffle();
      }

      lastX = current.x;
      lastY = current.y;
      lastZ = current.z;
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [handleShuffle, motionAllowed]);

  return (
    <>
      {/* Subtle floating desktop/mobile shuffle button */}
      <div className="fixed bottom-24 start-4 z-40">
        <button
          type="button"
          onClick={() => {
            // Must run synchronously inside the tap for iOS to allow it.
            requestMotionAccess();
            handleShuffle();
          }}
          disabled={loading}
          aria-label="اختيار فيلم عشوائي"
          title="هز الجهاز أو اضغط لاختيار فيلم عشوائي (Shake to Shuffle)"
          className="group flex items-center gap-2 p-3 rounded-2xl border backdrop-blur-xl transition-all duration-300 active:scale-95 shadow-xl hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, rgba(245, 166, 35, 0.15) 0%, rgba(232, 121, 249, 0.12) 100%)',
            borderColor: 'rgba(245, 166, 35, 0.35)',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5), 0 0 15px rgba(245, 166, 35, 0.2)',
            color: '#fef08a',
          }}
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin text-amber-400" />
          ) : (
            <Dices size={18} className="text-amber-400 group-hover:rotate-45 transition-transform" />
          )}
          <span className="hidden sm:inline text-xs font-black">
            Shuffle 🎲
          </span>
        </button>
      </div>

      {/* Preview and add sheet if random movie is picked */}
      {randomItem && (
        <AddToLibrarySheet
          item={randomItem}
          onClose={() => setRandomItem(null)}
        />
      )}
    </>
  );
}
