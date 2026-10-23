// 导航只显示站名与英文名，不放图片；RingMark 保留为加载动画。
import { SITE } from "../site.ts";

export function Wordmark({ size = 24, className = "", title = SITE.name }: { size?: number; className?: string; title?: string }) {
  const stacked = size >= 24;
  return (
    <span className={`inline-flex shrink-0 items-center flex-col font-black leading-none tracking-[-0.03em] ${stacked ? "gap-1.5" : "gap-0.5"} ${className}`} style={{ fontSize: stacked ? Math.round(size * 0.92) : 12 }} aria-label={`${title} ${SITE.nameEn}`} role="img">
      <span aria-hidden="true">{SITE.name}</span>
      {stacked && <span aria-hidden="true" className="font-semibold tracking-[0.08em] text-ink-3" style={{ fontSize: Math.round(size * 0.42) }}>{SITE.nameEn}</span>}
    </span>
  );
}

/** A film reel; spinning, it is the loader. */
export function RingMark({ className = "", spinning = false }: { className?: string; spinning?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <g style={spinning ? { transformOrigin: "12px 12px", animation: "spin-slow 1.1s linear infinite" } : undefined}>
        <circle cx="12" cy="10.8" r="7" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path d="M17 16 L20.5 20.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="12" cy="10.8" r="1.1" fill="currentColor" />
        <circle cx="9" cy="7.8" r="1.5" fill="currentColor" />
        <circle cx="15" cy="7.8" r="1.5" fill="currentColor" />
        <circle cx="9" cy="13.8" r="1.5" fill="currentColor" />
        <circle cx="15" cy="13.8" r="1.5" fill="currentColor" />
      </g>
    </svg>
  );
}
