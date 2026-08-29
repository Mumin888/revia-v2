import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface SectionRowProps {
  title: string;
  icon: LucideIcon;
  iconColor?: string;
  children: ReactNode;
  /** Optional badge count shown next to the title */
  count?: number;
  empty?: ReactNode;
}

export default function SectionRow({
  title,
  icon: Icon,
  iconColor = '#f5a623',
  children,
  count,
  empty,
}: SectionRowProps) {
  const hasChildren =
    Array.isArray(children)
      ? children.some(Boolean)
      : Boolean(children);

  return (
    <section className="space-y-3.5">
      {/* ── Section Header ─────────────── */}
      <div className="flex items-center justify-between px-5">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md backdrop-blur-xl"
            style={{
              background: `${iconColor}18`,
              border: `1px solid ${iconColor}45`,
              boxShadow: `0 0 15px ${iconColor}25`,
            }}
          >
            <Icon size={16} style={{ color: iconColor }} strokeWidth={2.4} />
          </div>
          <h2 className="text-base font-black text-white tracking-tight">
            {title}
          </h2>
        </div>

        {count !== undefined && count > 0 && (
          <span
            className="text-[11px] font-black px-2.5 py-0.5 rounded-full border backdrop-blur-xl shadow-sm"
            style={{
              background: `${iconColor}15`,
              color: iconColor,
              borderColor: `${iconColor}40`,
            }}
          >
            {count}
          </span>
        )}
      </div>

      {/* ── Scroll row or empty state ───── */}
      {hasChildren ? (
        <div className="scroll-row px-5">{children}</div>
      ) : (
        <div className="px-5">
          {empty ?? (
            <p className="text-xs text-center py-8 rounded-3xl text-[#71717a] bg-[#121215]/30 border border-dashed border-white/10">
              لا يوجد محتوى بعد
            </p>
          )}
        </div>
      )}
    </section>
  );
}
