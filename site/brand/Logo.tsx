// CinemaHOT 使用摄影系提供的完整原图与站名；RingMark 保留为加载动画。
import { SITE } from "../site.ts";

export function Wordmark({ size = 24, className = "", title = SITE.name }: { size?: number; className?: string; title?: string }) {
  const stacked = size >= 24;
  const imageSize = stacked ? Math.round(size * 4.2) : 28;
  return (
    <span className={`inline-flex shrink-0 items-center flex-col font-black leading-none tracking-[-0.03em] ${stacked ? "gap-1.5" : "gap-0.5"} ${className}`} style={{ fontSize: stacked ? Math.round(size * 0.92) : 12 }} aria-label={`${title} · 北京电影学院摄影系`} role="img">
      <img src="/doc-logo-1d9e4beb.jpg" width={imageSize} height={imageSize} className="shrink-0 rounded-sm bg-white object-contain" alt="" aria-hidden="true" />
      <span aria-hidden="true">{SITE.name}</span>
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
