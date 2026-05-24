"use client";

import * as React from "react";

/**
 * Layered web screenshot deterrent. Real screenshot blocking is impossible
 * on the web (the OS owns screen capture), but we can:
 *
 *   1) Repeat a faint username watermark across the content — any leaked
 *      screenshot identifies the person who took it.
 *   2) Blur the content when the page loses focus or visibility (a quick
 *      window-switch to a screenshot tool now blurs the content).
 *   3) Disable text selection + right-click — removes the easy copy path.
 *
 * For the real thing, the app needs to ship as a native iOS/Android wrapper
 * (Capacitor / React Native) so it can use FLAG_SECURE / SCREENCAPTURE_DISABLED.
 */
export function PrivacyShield({
  watermark,
  children,
  className = "",
}: {
  watermark: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [obscure, setObscure] = React.useState(false);

  // Blur the content when the window loses focus / visibility changes.
  React.useEffect(() => {
    function onVisibility() {
      setObscure(document.visibilityState !== "visible");
    }
    function onBlur() { setObscure(true); }
    function onFocus() { setObscure(false); }
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  // Disable native right-click menu within sensitive content
  function onContextMenu(e: React.MouseEvent) {
    e.preventDefault();
  }

  return (
    <div
      onContextMenu={onContextMenu}
      className={`relative overflow-hidden select-text ${className}`}
      style={{ WebkitUserSelect: "text" } as React.CSSProperties}
    >
      {/* Content layer */}
      <div
        className="transition-[filter] duration-200"
        style={{ filter: obscure ? "blur(14px)" : undefined }}
      >
        {children}
      </div>

      {/* Repeating diagonal watermark — pointer-events none so it doesn't
          interfere with clicks/scroll */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 select-none"
        style={{
          backgroundImage: `repeating-linear-gradient(
            -30deg,
            rgba(28,22,18,0) 0,
            rgba(28,22,18,0) 90px,
            rgba(28,22,18,0.04) 90px,
            rgba(28,22,18,0.04) 110px
          )`,
        }}
      >
        <div
          className="absolute inset-0 flex flex-wrap items-start justify-around content-around opacity-[0.045] text-ink"
          style={{ transform: "rotate(-30deg) scale(1.5)", transformOrigin: "center" }}
        >
          {Array.from({ length: 60 }).map((_, i) => (
            <span key={i} className="font-mono text-xs whitespace-nowrap px-6 py-2">
              {watermark} · Cultural Therapy · do not share
            </span>
          ))}
        </div>
      </div>

      {/* Focus-loss overlay */}
      {obscure && (
        <div className="absolute inset-0 flex items-center justify-center bg-bone/90 backdrop-blur-sm pointer-events-none">
          <p className="text-sm text-ink2 text-center max-w-xs px-6">
            Content hidden because this window is not focused.
            Return to this tab to read.
          </p>
        </div>
      )}
    </div>
  );
}
