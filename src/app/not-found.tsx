'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Terminal } from 'lucide-react';

export default function NotFound() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const characters = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンREVIA404MATRIX';
    const fontSize = 16;
    const columns = Math.floor(width / fontSize);
    const drops: number[] = Array.from({ length: columns }, () => Math.floor(Math.random() * -50));

    const draw = () => {
      ctx.fillStyle = 'rgba(5, 5, 5, 0.08)';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#00ff66';
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = characters.charAt(Math.floor(Math.random() * characters.length));
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Bright head of drop
        if (Math.random() > 0.9) {
          ctx.fillStyle = '#ffffff';
        } else {
          ctx.fillStyle = '#00ff66';
        }

        ctx.fillText(text, x, y);

        if (y > height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="relative min-h-dvh flex flex-col items-center justify-center overflow-hidden bg-black text-green-500 font-mono px-4 select-none">
      {/* Matrix digital rain canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0 opacity-40 pointer-events-none"
      />

      {/* Terminal Glitch Box */}
      <div
        className="relative z-10 max-w-lg w-full p-8 rounded-3xl space-y-6 text-center border backdrop-blur-xl"
        style={{
          background: 'rgba(0, 15, 5, 0.85)',
          borderColor: 'rgba(0, 255, 102, 0.4)',
          boxShadow: '0 0 50px rgba(0, 255, 102, 0.2), inset 0 0 30px rgba(0, 255, 102, 0.05)',
        }}
      >
        <div className="flex items-center justify-center gap-2 text-xs tracking-widest text-green-400">
          <Terminal size={18} className="animate-pulse" />
          <span>SYSTEM_ERROR // CODE_404</span>
        </div>

        <h1
          className="text-7xl font-black tracking-tighter"
          style={{
            color: '#00ff66',
            textShadow: '0 0 20px rgba(0,255,102,0.8), 0 0 40px rgba(0,255,102,0.4)',
          }}
        >
          404
        </h1>

        <div className="space-y-2 text-sm leading-relaxed text-green-300">
          <p className="font-bold">لقد خرجت عن مسار الماتريكس...</p>
          <p className="text-xs text-green-500/90 font-sans leading-normal">
            الصفحة التي تبحث عنها غير موجودة في هذا البُعد السينمائي.
          </p>
        </div>

        {/* The Red Pill Button */}
        <div className="pt-4 flex justify-center">
          <Link
            href="/"
            className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full font-sans font-black text-sm tracking-wide text-white transition-all duration-300 active:scale-95 overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
              boxShadow: '0 0 30px rgba(239, 68, 68, 0.6), inset 0 0 15px rgba(255, 255, 255, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
            }}
          >
            <span
              className="w-3.5 h-3.5 rounded-full bg-white/90 shadow-md group-hover:scale-125 transition-transform"
              style={{ boxShadow: '0 0 8px #ffffff' }}
            />
            <span>Take the Red Pill to return to reality 💊</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
