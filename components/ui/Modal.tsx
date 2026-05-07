"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
};

export function Modal({ open, onClose, title, children, footer, size = "md" }: Props) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const widths = {
    sm: "sm:max-w-md",
    md: "sm:max-w-xl",
    lg: "sm:max-w-3xl"
  } as const;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "w-full bg-bone border border-line shadow-soft",
          "rounded-t-2xl sm:rounded-2xl",
          "max-h-[92dvh] overflow-y-auto",
          widths[size]
        )}
      >
        {title && (
          <div className="px-5 py-4 border-b border-line flex items-center justify-between">
            <h2 className="font-display text-xl">{title}</h2>
            <button
              aria-label="Close"
              onClick={onClose}
              className="text-ink3 hover:text-ink"
            >
              ✕
            </button>
          </div>
        )}
        <div className="px-5 py-4">{children}</div>
        {footer && (
          <div className="px-5 py-4 border-t border-line bg-parchment/40">{footer}</div>
        )}
      </div>
    </div>
  );
}
