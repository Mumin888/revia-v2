'use client';

import Link from 'next/link';
import {
  Sparkles, Clapperboard, Code2, Lightbulb,
  ArrowRight, Film, Coffee, Popcorn, Star,
} from 'lucide-react';

export default function MastermindsPage() {

  return (
    <div className="relative min-h-dvh flex flex-col items-center justify-between overflow-hidden px-5 py-12 select-none"
      style={{
        background: 'radial-gradient(ellipse 90% 600px at 50% -100px, rgba(245, 166, 35, 0.15) 0%, rgba(10, 15, 28, 0.9) 60%, #030305 100%)',
        color: '#ffffff',
      }}
      dir="rtl"
    >
      {/* ── Ambient Glow Hotspots ── */}
      <div
        className="absolute top-1/4 -left-32 w-96 h-96 rounded-full pointer-events-none opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(circle, #e879f9 0%, transparent 70%)' }}
      />
      <div
        className="absolute top-1/3 -right-32 w-96 h-96 rounded-full pointer-events-none opacity-25 blur-3xl"
        style={{ background: 'radial-gradient(circle, #f5a623 0%, transparent 70%)' }}
      />

      {/* ── Floating Background Elements (Popcorn, Film, Code) ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Floating Item 1: Popcorn */}
        <div
          className="absolute text-amber-300/40"
          style={{
            top: '15%',
            left: '12%',
            animation: 'floatSlow 7s ease-in-out infinite alternate',
          }}
        >
          <Popcorn size={38} />
        </div>

        {/* Floating Item 2: Film Roll */}
        <div
          className="absolute text-purple-400/30"
          style={{
            top: '22%',
            right: '15%',
            animation: 'floatSlow 9s 1s ease-in-out infinite alternate-reverse',
          }}
        >
          <Film size={44} />
        </div>

        {/* Floating Item 3: Coffee */}
        <div
          className="absolute text-amber-400/30"
          style={{
            top: '65%',
            left: '8%',
            animation: 'floatSlow 8s 2s ease-in-out infinite alternate',
          }}
        >
          <Coffee size={32} />
        </div>

        {/* Floating Item 4: Code Brackets */}
        <div
          className="absolute text-cyan-400/30 font-mono text-3xl font-black"
          style={{
            top: '70%',
            right: '12%',
            animation: 'floatSlow 6s 1.5s ease-in-out infinite alternate-reverse',
          }}
        >
          {'</>'}
        </div>

        {/* Floating Stars */}
        {Array.from({ length: 18 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${2 + (i % 3)}px`,
              height: `${2 + (i % 3)}px`,
              top: `${(i * 17) % 90}%`,
              left: `${(i * 23) % 95}%`,
              background: i % 2 === 0 ? '#f5a623' : '#e879f9',
              boxShadow: '0 0 8px currentColor',
              opacity: 0.3 + ((i % 5) * 0.15),
              animation: `starPulse ${3 + (i % 4)}s ${(i * 0.3)}s infinite ease-in-out`,
            }}
          />
        ))}
      </div>

      {/* ── Top Header Badge ── */}
      <header className="relative z-10 text-center space-y-2 pt-4 animate-fade-in-up">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border backdrop-blur-xl"
          style={{
            background: 'rgba(245, 166, 35, 0.12)',
            borderColor: 'rgba(245, 166, 35, 0.35)',
            boxShadow: '0 0 20px rgba(245, 166, 35, 0.2)',
          }}
        >
          <Sparkles size={14} className="text-amber-400 animate-spin" style={{ animationDuration: '8s' }} />
          <span className="text-xs font-black tracking-widest text-amber-300">
            SECRET ORIGINS // المنصة وسر البداية
          </span>
          <Sparkles size={14} className="text-amber-400 animate-spin" style={{ animationDuration: '8s' }} />
        </div>
      </header>

      {/* ── Main Cinematic Story Card ── */}
      <main className="relative z-10 max-w-2xl w-full my-auto py-8">
        <div
          className="relative rounded-[2.5rem] p-7 sm:p-10 border backdrop-blur-2xl text-center space-y-6 shadow-2xl transition-all duration-700"
          style={{
            background: 'linear-gradient(165deg, rgba(22, 22, 28, 0.8) 0%, rgba(10, 10, 14, 0.95) 100%)',
            borderColor: 'rgba(245, 166, 35, 0.3)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(245, 166, 35, 0.12), inset 0 0 30px rgba(255, 255, 255, 0.03)',
            animation: 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both',
          }}
        >
          {/* Top glowing icon */}
          <div className="flex justify-center -mt-14 mb-2">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center border shadow-2xl transition-transform hover:scale-110"
              style={{
                background: 'linear-gradient(135deg, #fef08a 0%, #f5a623 50%, #e879f9 100%)',
                borderColor: 'rgba(245, 166, 35, 0.6)',
                boxShadow: '0 0 35px rgba(245, 166, 35, 0.6)',
              }}
            >
              <Clapperboard size={36} color="#050505" strokeWidth={2.6} />
            </div>
          </div>

          {/* 📍 Title: The Masterminds - وراء كواليس Revia */}
          <div className="space-y-2">
            <h1
              className="text-2xl sm:text-3xl font-black tracking-tight"
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #fef08a 25%, #f5a623 65%, #e879f9 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 2px 12px rgba(245, 166, 35, 0.35))',
              }}
            >
              The Masterminds - وراء كواليس Revia
            </h1>
            <p className="text-xs font-bold text-amber-300/80 tracking-wide">
              قصة الشغف والسطور البرمجية التي صنعت سينمانا المشتركة
            </p>
          </div>

          {/* Elegant Divider */}
          <div className="flex items-center justify-center gap-3">
            <span className="w-12 h-[1px] bg-gradient-to-r from-transparent to-amber-500/50" />
            <Star size={12} className="text-amber-400 fill-amber-400" />
            <span className="w-12 h-[1px] bg-gradient-to-l from-transparent to-amber-500/50" />
          </div>

          {/* 📍 Exact Body Text */}
          <p
            className="text-sm sm:text-base leading-loose sm:leading-[2.2] font-semibold text-slate-200 text-justify"
            style={{
              textJustify: 'inter-word',
              color: 'rgba(240, 240, 245, 0.95)',
              lineHeight: '2.1',
            }}
          >
            في زحمة الأيام وضغوط الإنجاز، وبين عالم الأكواد والبرمجة من جهة، والتخطيط والأفكار الذكية من جهة أخرى، كان هناك ملاذ واحد يجمعنا ويفصلنا عن الواقع: شغفنا بالسينما والمسلسلات. لكن المشكلة كانت دائماً في الفوضى! أين توقفنا في هذه السلسلة؟ ماذا نشاهد في عطلة نهاية الأسبوع؟ قوائمنا كانت مبعثرة، والملاحظات ضائعة. في لحظة إلهام، قررنا ألا ننتظر الحل من الآخرين، بل نصنعه بأنفسنا. دمجنا بين الخبرة التقنية والرؤية التنظيمية لنبتكر منصة Revia. هذا التطبيق لم يُكتب فقط بسطور برمجية، بل صُنع بشغف خالص ليكون المساحة التي ننظم فيها عالمنا السينمائي، ونشاركه معكم. شكراً لأنكم جزء من رحلتنا. 🍿✨
          </p>

          {/* Dual Creators Tags */}
          <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-black">
              <Code2 size={15} />
              <span>الهندسة والبرمجة السحابية</span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-black">
              <Lightbulb size={15} />
              <span>الرؤية والتخطيط وتجربة المستخدم</span>
            </div>
          </div>
        </div>
      </main>

      {/* ── Animated Walking Characters (Developer & Planner) ── */}
      <div className="relative z-10 w-full overflow-hidden h-24 my-2 select-none pointer-events-none">
        {/* Track Line */}
        <div
          className="absolute bottom-4 inset-x-0 h-[1px]"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(245, 166, 35, 0.4) 30%, rgba(232, 121, 249, 0.4) 70%, transparent 100%)',
          }}
        />

        {/* The Two Walking Buddies Container */}
        <div
          className="absolute bottom-4 flex items-end gap-6"
          style={{
            animation: 'walkAcrossScreen 16s linear infinite',
          }}
        >
          {/* Avatar 1: The Developer 💻 (with glowing laptop & walk bounce) */}
          <div className="flex flex-col items-center animate-walk-bounce">
            <div className="relative">
              {/* Floating code bulb */}
              <span className="absolute -top-3 -right-2 text-[10px] font-mono font-black text-cyan-400 bg-slate-900/90 px-1 rounded border border-cyan-400/40">
                {'</>'}
              </span>
              {/* Character head & body */}
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center border shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                  borderColor: 'rgba(56, 189, 248, 0.6)',
                  boxShadow: '0 0 16px rgba(14, 165, 233, 0.5)',
                }}
              >
                <Code2 size={20} className="text-white" />
              </div>
            </div>
            {/* Legs walking */}
            <div className="flex gap-1.5 mt-0.5">
              <div className="w-1.5 h-3.5 rounded-full bg-sky-400 animate-leg-left" />
              <div className="w-1.5 h-3.5 rounded-full bg-sky-500 animate-leg-right" />
            </div>
            <span className="text-[9px] font-black text-sky-300 mt-1">المطور</span>
          </div>

          {/* Avatar 2: The Planner 💡 (with coffee & idea bulb & walk bounce) */}
          <div className="flex flex-col items-center animate-walk-bounce-alt">
            <div className="relative">
              {/* Floating idea bulb */}
              <span className="absolute -top-3 -left-2 text-[10px] text-amber-400 animate-bounce">
                💡
              </span>
              {/* Character head & body */}
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center border shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #ec4899, #d946ef)',
                  borderColor: 'rgba(236, 72, 153, 0.6)',
                  boxShadow: '0 0 16px rgba(236, 72, 153, 0.5)',
                }}
              >
                <Lightbulb size={20} className="text-white" />
              </div>
            </div>
            {/* Legs walking */}
            <div className="flex gap-1.5 mt-0.5">
              <div className="w-1.5 h-3.5 rounded-full bg-pink-400 animate-leg-right" />
              <div className="w-1.5 h-3.5 rounded-full bg-pink-500 animate-leg-left" />
            </div>
            <span className="text-[9px] font-black text-pink-300 mt-1">المخطط</span>
          </div>
        </div>
      </div>

      {/* ── Back to Reality Button ── */}
      <footer className="relative z-10 pb-4 pt-2">
        <Link
          href="/"
          className="group inline-flex items-center gap-3 px-8 py-4 rounded-full font-black text-sm transition-all duration-300 active:scale-95 border"
          style={{
            background: 'linear-gradient(135deg, #fef08a 0%, #f5a623 50%, #e879f9 100%)',
            color: '#050505',
            boxShadow: '0 0 30px rgba(245, 166, 35, 0.4), 0 8px 24px rgba(0,0,0,0.5)',
            borderColor: 'rgba(255, 255, 255, 0.5)',
          }}
        >
          <ArrowRight size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span>العودة إلى الواقع (Back to Reality) 🌌</span>
        </Link>
      </footer>

      {/* ── Custom CSS Animations ── */}
      <style jsx global>{`
        @keyframes floatSlow {
          0% { transform: translateY(0px) rotate(0deg); }
          100% { transform: translateY(-24px) rotate(8deg); }
        }
        @keyframes starPulse {
          0%, 100% { transform: scale(0.8); opacity: 0.3; }
          50% { transform: scale(1.4); opacity: 0.9; }
        }
        @keyframes walkAcrossScreen {
          0% { transform: translateX(110vw); }
          100% { transform: translateX(-120vw); }
        }
        @keyframes walkBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes legLeft {
          0%, 100% { transform: rotate(-15deg); }
          50% { transform: rotate(15deg); }
        }
        @keyframes legRight {
          0%, 100% { transform: rotate(15deg); }
          50% { transform: rotate(-15deg); }
        }
        .animate-walk-bounce {
          animation: walkBounce 0.5s ease-in-out infinite;
        }
        .animate-walk-bounce-alt {
          animation: walkBounce 0.5s 0.25s ease-in-out infinite;
        }
        .animate-leg-left {
          animation: legLeft 0.5s ease-in-out infinite;
          transform-origin: top center;
        }
        .animate-leg-right {
          animation: legRight 0.5s ease-in-out infinite;
          transform-origin: top center;
        }
      `}</style>
    </div>
  );
}
