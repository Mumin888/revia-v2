'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Search, Disc3, UserCircle2 } from 'lucide-react';

const TABS = [
  { href: '/',         label: 'الرئيسية',  icon: Home },
  { href: '/discover', label: 'استكشاف',   icon: Compass },
  { href: '/search',   label: 'بحث',       icon: Search },
  { href: '/wheel',    label: 'عجلة الحظ', icon: Disc3 },
  { href: '/profile',  label: 'حسابي',     icon: UserCircle2 },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  return (
    // ── .dock-glass wraps the nav island (from globals.css @layer components) ──
    <div className="fixed bottom-0 inset-x-0 z-50 pointer-events-none px-3.5">
      <nav
        className="dock-glass dock-safe-bottom max-w-md mx-auto pointer-events-auto rounded-[2rem] px-1.5 pt-1.5"
        aria-label="التنقل الرئيسي"
      >
        <div className="flex items-center justify-around h-14">
          {TABS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className="relative flex flex-col items-center justify-center gap-1 flex-1 h-full rounded-[1.35rem] transition-all duration-300"
                style={{
                  background: active
                    ? 'linear-gradient(135deg, rgba(245,166,35,0.18) 0%, rgba(232,121,249,0.1) 100%)'
                    : 'transparent',
                  border: active ? '1px solid rgba(245, 166, 35, 0.4)' : '1px solid transparent',
                  boxShadow: active ? '0 0 22px rgba(245,166,35,0.25)' : 'none',
                }}
              >
                {/* Active neon top bar */}
                {active && (
                  <span
                    className="absolute -top-1 w-2.5 h-0.5 rounded-full"
                    style={{
                      background: 'linear-gradient(90deg, var(--accent-amber), var(--accent-rose))',
                      boxShadow: '0 0 10px var(--accent-amber)',
                    }}
                  />
                )}

                <Icon
                  size={19}
                  strokeWidth={active ? 2.8 : 1.8}
                  style={{
                    color: active ? '#fef08a' : 'var(--text-muted)',
                    filter: active ? 'drop-shadow(0 0 10px rgba(245, 166, 35, 0.8))' : 'none',
                    transform: active ? 'scale(1.1)' : 'scale(1)',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                />

                {/* .text-gradient-amber-rose for active label */}
                {active ? (
                  <span className="text-gradient-amber-rose text-[10px] font-black leading-none tracking-tight">
                    {label}
                  </span>
                ) : (
                  <span
                    className="text-[10px] font-bold leading-none tracking-tight"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {label}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
