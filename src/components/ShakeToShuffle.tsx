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

export default function ShakeToShuffle() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [randomItem, setRandomItem] = useState<SearchResult | null>(null);
  const lastShakeTime = useRef<number>(0);

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
    let lastX = 0, lastY = 0, lastZ = 0;
    const threshold = 18;

    const handleMotion = (event: DeviceMotionEvent) => {
      const current = event.accelerationIncludingGravity;
      if (!current || current.x === null || current.y === null || current.z === null) return;

      const deltaX = Math.abs(current.x - lastX);
      const deltaY = Math.abs(current.y - lastY);
      const deltaZ = Math.abs(current.z - lastZ);

      if ((deltaX > threshold && deltaY > threshold) || (deltaX > threshold && deltaZ > threshold) || (deltaY > threshold && deltaZ > threshold)) {
        handleShuffle();
      }

      lastX = current.x;
      lastY = current.y;
      lastZ = current.z;
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [handleShuffle]);

  return (
    <>
      {/* Subtle floating desktop/mobile shuffle button */}
      <div className="fixed bottom-24 start-4 z-40">
        <button
          type="button"
          onClick={handleShuffle}
          disabled={loading}
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
