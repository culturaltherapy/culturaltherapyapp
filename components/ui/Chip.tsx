import * as React from "react";
import { cn } from "@/lib/utils";

type Props = React.HTMLAttributes<HTMLSpanElement> & {
  active?: boolean;
  as?: "span" | "button";
};

export function Chip({ active, as = "span", className, ...rest }: Props) {
  const Component: any = as;
  return (
    <Component
      {...rest}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-xs tracking-tight",
        active
          ? "border-ink bg-ink text-bone"
          : "border-line bg-bone/60 text-ink2 hover:bg-ink/5",
        as === "button" && "cursor-pointer",
        className
      )}
    />
  );
}
