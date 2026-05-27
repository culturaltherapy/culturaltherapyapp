import * as React from "react";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/utils";

type Props = {
  name: string;
  color?: string;
  size?: number;
  src?: string | null;
  className?: string;
  /**
   * When true, render a small forest-green dot at the bottom-right of the
   * avatar to signal "active recently" presence. Set this via the
   * `useOnlineStatus(last_seen_at)` helper so the threshold stays consistent
   * across every call site.
   */
  online?: boolean | null;
};

export function Avatar({
  name,
  color = "var(--ct-rust)",
  size = 40,
  src,
  className,
  online,
}: Props) {
  const dim = `${size}px`;
  // Dot scales with avatar size so it stays proportional, with sensible
  // floor / ceiling so it's never invisible or cartoonish.
  const dotSize = Math.max(8, Math.min(16, Math.round(size * 0.22)));
  // The dot sits on top of an outer bone ring so it remains visible against
  // any background (light + dark surfaces alike).
  const ring = Math.max(2, Math.round(dotSize * 0.25));

  return (
    <div className={cn("relative inline-block", className)} style={{ width: dim, height: dim }}>
      <div
        className="inline-flex items-center justify-center font-medium text-bone select-none overflow-hidden h-full w-full"
        style={{
          borderRadius: "999px",
          background: color,
          fontSize: Math.max(11, Math.round(size * 0.38)),
        }}
        aria-label={name}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={name} className="h-full w-full object-cover" />
        ) : (
          <span className="font-mono uppercase tracking-wider">{initials(name)}</span>
        )}
      </div>
      {online ? (
        <span
          className="absolute block bg-forest"
          style={{
            width: `${dotSize}px`,
            height: `${dotSize}px`,
            right: 0,
            bottom: 0,
            borderRadius: "999px",
            boxShadow: `0 0 0 ${ring}px var(--ct-bone, #faf5ec)`,
          }}
          aria-label={`${name} is active`}
          title="Active recently"
        />
      ) : null}
    </div>
  );
}
