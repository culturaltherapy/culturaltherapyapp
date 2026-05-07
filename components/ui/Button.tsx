import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-ink text-bone hover:bg-ink2 active:bg-ink2 disabled:opacity-50",
  secondary:
    "bg-terracotta text-bone hover:bg-terracotta2 active:bg-terracotta2 disabled:opacity-50",
  ghost:
    "bg-transparent text-ink hover:bg-ink/5 active:bg-ink/10",
  outline:
    "bg-transparent text-ink border border-line hover:bg-ink/5",
  danger:
    "bg-crisis text-bone hover:opacity-90"
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-2 text-sm rounded-md",
  md: "px-4 py-2.5 text-[15px] rounded-md",
  lg: "px-6 py-3 text-base rounded-lg"
};

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  full?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  full,
  className,
  ...props
}: Props) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium tracking-tight transition-colors",
        "focus-visible:outline-2 focus-visible:outline-terracotta",
        variants[variant],
        sizes[size],
        full && "w-full",
        className
      )}
    />
  );
}
