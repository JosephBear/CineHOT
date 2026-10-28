// 导航：摄影机图标 + 大字 CineHOT，下面一行中文站名；RingMark 保留为加载动画。
import { SITE } from "../site.ts";

/** A cine camera: two reels on top, the body with its recording light (the "hot"), the matte box in front. */
function CameraMark({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 32 24" width={Math.round((size * 32) / 24)} height={size} className={`shrink-0 ${className}`} aria-hidden="true">
      <circle cx="9" cy="6" r="4.6" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="19.5" cy="6.6" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="9" cy="6" r="1.2" fill="currentColor" />
      <circle cx="19.5" cy="6.6" r="1.1" fill="currentColor" />
      <rect x="2" y="11" width="20" height="11" rx="2.2" fill="currentColor" />
      <path d="M22.5 14.2 L30 10.8 V22.2 L22.5 18.8 Z" fill="currentColor" />
      <circle cx="6.6" cy="14.8" r="1.7" fill="var(--color-hot)" />
    </svg>
  );
}

export function Wordmark({ size = 24, className = "", title = SITE.name }: { size?: number; className?: string; title?: string }) {
  const stacked = size >= 24;
  return (
    <span className={`inline-flex shrink-0 items-center leading-none ${stacked ? "gap-2.5" : "gap-1.5"} ${className}`} aria-label={`${SITE.nameEn} ${title}`} role="img">
      <CameraMark size={stacked ? Math.round(size * 1.15) : size + 2} />
      <span aria-hidden="true" className="flex flex-col gap-1.5">
        <span className="font-black tracking-[-0.02em]" style={{ fontSize: Math.round(size * (stacked ? 1 : 1.05)) }}>{SITE.nameEn}</span>
        {/* The phone bar has no room beside its centre switch: there the Chinese name stays in the label only. */}
        {stacked && <span className="font-semibold tracking-[0.06em] text-ink-3" style={{ fontSize: Math.round(size * 0.5) }}>{title}</span>}
      </span>
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
