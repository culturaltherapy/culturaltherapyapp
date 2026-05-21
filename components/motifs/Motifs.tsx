// Cultural motifs — Adinkra, Kemetic, Bantu — used as ambient
// background marks, never as decoration alone. Density is controlled
// via the [data-motif] attribute on <html>.

import * as React from "react";
import { cn } from "@/lib/utils";

type MotifProps = {
  size?: number;
  className?: string;
  color?: string;
  ambient?: boolean;
};

function shell(
  size: number,
  className: string | undefined,
  ambient: boolean | undefined,
  color: string | undefined,
  children: React.ReactNode
) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={cn(className)}
      style={{ opacity: ambient ? "var(--motif-opacity)" : 1, color: color ?? "currentColor" }}
      aria-hidden
    >
      {children}
    </svg>
  );
}

// Adinkra: Sankofa — go back and get it. Used on Network surfaces.
export function Sankofa({ size = 64, className, color, ambient }: MotifProps) {
  return shell(size, className, ambient, color, (
    <g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M50 18c-15 0-26 10-26 24s11 24 26 24 24-10 24-22" />
      <path d="M62 38l12 4-4 12" />
      <circle cx="50" cy="42" r="6" fill="currentColor" />
    </g>
  ));
}

// Adinkra: Dwennimmen — strength in humility. Used on Academy.
export function Dwennimmen({ size = 64, className, color, ambient }: MotifProps) {
  return shell(size, className, ambient, color, (
    <g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="32" cy="50" r="14" />
      <circle cx="68" cy="50" r="14" />
      <path d="M22 36c-6-4-6-12 0-16M78 36c6-4 6-12 0-16" />
      <path d="M22 64c-6 4-6 12 0 16M78 64c6 4 6 12 0 16" />
    </g>
  ));
}

// Adinkra: Funtunfunefu — siamese crocodiles, unity. Used on Discussions.
export function Funtunfunefu({ size = 64, className, color, ambient }: MotifProps) {
  return shell(size, className, ambient, color, (
    <g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 50c10-8 20-8 30 0 10 8 20 8 30 0" />
      <path d="M20 50c10 8 20 8 30 0 10-8 20-8 30 0" />
      <circle cx="50" cy="50" r="3" fill="currentColor" />
      <path d="M14 50h6M80 50h6" />
    </g>
  ));
}

// Kemetic: Eye of Horus — protection, perception. Used on Profile.
export function EyeOfHorus({ size = 64, className, color, ambient }: MotifProps) {
  return shell(size, className, ambient, color, (
    <g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 52c10-14 30-22 50-14 10 4 16 10 22 14-10 12-26 18-44 14-12-2-22-8-28-14Z" />
      <circle cx="50" cy="52" r="6" fill="currentColor" />
      <path d="M44 64c-2 8-8 12-14 12M62 62c2 8 6 14 14 16" />
    </g>
  ));
}

// Kemetic: Pyramid — foundation. Used on Home.
export function Pyramid({ size = 64, className, color, ambient }: MotifProps) {
  return shell(size, className, ambient, color, (
    <g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 78 50 18l34 60Z" />
      <path d="M50 18v60M30 48l40 0" />
    </g>
  ));
}

// Kemetic: Ankh — life. Used on Crisis surfaces.
export function Ankh({ size = 64, className, color, ambient }: MotifProps) {
  return shell(size, className, ambient, color, (
    <g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="50" cy="32" r="14" />
      <path d="M50 46v40M30 60h40" />
    </g>
  ));
}

// Bantu: Ubuntu — I am because we are. Used on Tribes / Village.
export function Ubuntu({ size = 64, className, color, ambient }: MotifProps) {
  return shell(size, className, ambient, color, (
    <g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="50" cy="50" r="22" />
      <circle cx="50" cy="34" r="6" />
      <circle cx="34" cy="60" r="6" />
      <circle cx="66" cy="60" r="6" />
      <path d="M50 40v8M40 60h20" />
    </g>
  ));
}

export const MOTIFS = {
  sankofa: Sankofa,
  dwennimmen: Dwennimmen,
  funtunfunefu: Funtunfunefu,
  eye: EyeOfHorus,
  pyramid: Pyramid,
  ankh: Ankh,
  ubuntu: Ubuntu
} as const;

export type MotifName = keyof typeof MOTIFS;

export function Motif({ name, ...rest }: { name: MotifName | string | null | undefined } & MotifProps) {
  // Defensive: unknown / null / wrong-case motif names fall back to Ubuntu
  // rather than crashing the page with `<undefined />`.
  const key = (name as string)?.toLowerCase() as MotifName;
  const Component = MOTIFS[key] ?? MOTIFS.ubuntu;
  return <Component {...rest} />;
}
