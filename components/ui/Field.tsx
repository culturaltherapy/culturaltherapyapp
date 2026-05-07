import * as React from "react";
import { cn } from "@/lib/utils";

type FieldProps = {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
};

export function Field({ label, hint, error, children, required }: FieldProps) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-sm font-medium text-ink2">
          {label}
          {required && <span className="text-terracotta"> *</span>}
        </span>
        {hint && <span className="text-xs text-ink3">{hint}</span>}
      </div>
      {children}
      {error && <p className="mt-1 text-xs text-crisis">{error}</p>}
    </label>
  );
}

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      {...props}
      className={cn(
        "w-full rounded-md border border-line bg-bone px-3.5 py-2.5",
        "text-[15px] text-ink placeholder:text-ink3",
        "focus:border-terracotta focus:outline-none",
        className
      )}
    />
  );
});

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      {...props}
      className={cn(
        "w-full rounded-md border border-line bg-bone px-3.5 py-2.5",
        "text-[15px] text-ink placeholder:text-ink3",
        "focus:border-terracotta focus:outline-none resize-y min-h-[88px]",
        className
      )}
    />
  );
});

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      {...props}
      className={cn(
        "w-full rounded-md border border-line bg-bone px-3.5 py-2.5",
        "text-[15px] text-ink focus:border-terracotta focus:outline-none",
        className
      )}
    >
      {children}
    </select>
  );
});
