"use client";

import * as React from "react";
import { Icon } from "@/components/ui/Icon";
import { ReportDialog } from "./ReportDialog";
import type { ReportTargetKind } from "@/lib/hooks/useReports";

type Variant = "icon" | "menu-item" | "link";

type Props = {
  targetKind: ReportTargetKind;
  targetTable: string;
  targetId: string;
  /** Optional label shown in the dialog header ("Report <label>"). */
  targetLabel?: string;
  variant?: Variant;
  className?: string;
};

/**
 * One-stop trigger for filing a moderation report on any content surface.
 * Stays out of the way visually (small text link / menu item / icon) and
 * opens the shared <ReportDialog/> on click.
 *
 * Don't render this on your own content — the call sites handle that guard.
 */
export function ReportButton({
  targetKind,
  targetTable,
  targetId,
  targetLabel,
  variant = "link",
  className = "",
}: Props) {
  const [open, setOpen] = React.useState(false);

  const baseClass =
    variant === "icon"
      ? "inline-flex items-center justify-center h-7 w-7 rounded-full text-ink3 hover:text-crisis hover:bg-crisis/5 transition"
      : variant === "menu-item"
      ? "inline-flex items-center gap-1.5 text-xs text-ink3 hover:text-crisis transition"
      : "inline-flex items-center gap-1 text-xs text-ink3 hover:text-crisis transition";

  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpen(true); }}
        className={`${baseClass} ${className}`}
        aria-label={`Report ${targetLabel ?? "content"}`}
        title="Report"
      >
        {variant === "icon" ? (
          <Icon name="shield" size={14} />
        ) : (
          <>
            <Icon name="shield" size={12} aria-hidden />
            <span>Report</span>
          </>
        )}
      </button>
      <ReportDialog
        open={open}
        onClose={() => setOpen(false)}
        targetKind={targetKind}
        targetTable={targetTable}
        targetId={targetId}
        targetLabel={targetLabel}
      />
    </>
  );
}
