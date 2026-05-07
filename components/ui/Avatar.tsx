import * as React from "react";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/utils";

type Props = {
  name: string;
  color?: string;
  size?: number;
  src?: string | null;
  className?: string;
};

export function Avatar({ name, color = "var(--ct-rust)", size = 40, src, className }: Props) {
  const dim = `${size}px`;
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center font-medium text-bone select-none overflow-hidden",
        className
      )}
      style={{
        width: dim,
        height: dim,
        borderRadius: "999px",
        background: color,
        fontSize: Math.max(11, Math.round(size * 0.38))
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
  );
}
