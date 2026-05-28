"use client";

import * as React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Select, Textarea } from "@/components/ui/Field";
import { useFileReport, type ReportTargetKind } from "@/lib/hooks/useReports";

type Props = {
  open: boolean;
  onClose: () => void;
  targetKind: ReportTargetKind;
  /**
   * Precise table name in the public schema — e.g. 'posts', 'post_comments',
   * 'profile_media', 'prompt_comments'. Stored on the report row so the
   * moderator dashboard knows where to fetch context + where to apply
   * mod_hide_content.
   */
  targetTable: string;
  targetId: string;
  /** Optional human-readable label of the thing being reported (shown in
   *  the modal header). Falls back to a generic phrase. */
  targetLabel?: string;
};

type Reason = "safety" | "abuse" | "spam" | "crisis" | "other";
type Severity = "normal" | "high" | "crisis";

export function ReportDialog({ open, onClose, targetKind, targetTable, targetId, targetLabel }: Props) {
  const [reason, setReason] = React.useState<Reason>("safety");
  const [severity, setSeverity] = React.useState<Severity>("normal");
  const [notes, setNotes] = React.useState("");
  const [submittedOk, setSubmittedOk] = React.useState(false);

  const file = useFileReport();

  // When the user picks "Crisis" as the reason, auto-bump severity to Crisis
  // (they can still downgrade if they realise it's not actually crisis).
  React.useEffect(() => {
    if (reason === "crisis") setSeverity("crisis");
  }, [reason]);

  // Reset the form when the dialog re-opens
  React.useEffect(() => {
    if (open) {
      setReason("safety");
      setSeverity("normal");
      setNotes("");
      setSubmittedOk(false);
    }
  }, [open]);

  async function submit() {
    try {
      await file.mutateAsync({
        targetKind,
        targetTable,
        targetId,
        reason,
        severity,
        notes: notes.trim() || null,
      });
      setSubmittedOk(true);
    } catch (e: any) {
      alert(e?.message ?? "Couldn't file the report. Please try again.");
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={submittedOk ? "Thanks." : `Report ${targetLabel ?? "this"}`}
    >
      {submittedOk ? (
        <div>
          <p className="text-sm text-ink2 leading-relaxed">
            A moderator will take a look. We aim to respond within 15 minutes
            for crisis reports, and within 24 hours otherwise.
          </p>
          {severity === "crisis" && (
            <p className="mt-4 rounded-md border border-crisis/30 bg-crisis/5 px-3 py-3 text-sm text-ink2">
              <strong className="text-ink">If you or someone is in immediate danger</strong>{" "}
              please also tap <em>Get help now</em> at the top of any screen —
              that opens the crisis-line directory for your country.
            </p>
          )}
          <div className="mt-5 flex justify-end">
            <Button size="sm" onClick={onClose}>Close</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-ink2">
            What's going on? This stays private — only moderators see reports.
          </p>

          <Field label="Reason" required>
            <Select value={reason} onChange={(e) => setReason(e.target.value as Reason)}>
              <option value="safety">Safety — someone feels unsafe</option>
              <option value="abuse">Abuse — bullying, harassment, hate</option>
              <option value="spam">Spam or scam</option>
              <option value="crisis">Crisis — self-harm, suicide, immediate danger</option>
              <option value="other">Other</option>
            </Select>
          </Field>

          <Field
            label="Severity"
            hint={
              reason === "crisis"
                ? "Crisis reports page our moderators immediately."
                : "Only mark high or crisis if it's genuinely urgent."
            }
          >
            <Select value={severity} onChange={(e) => setSeverity(e.target.value as Severity)}>
              <option value="normal">Normal — review within 24 h</option>
              <option value="high">High — review within an hour</option>
              <option value="crisis">Crisis — page moderators now (≤15 min)</option>
            </Select>
          </Field>

          <Field label="Notes (optional)" hint="Anything that would help the moderator triage.">
            <Textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={1000}
              placeholder="What happened? Link or context if relevant."
            />
            <div className="mt-1 text-xs text-ink3 text-right">{notes.length}/1000</div>
          </Field>

          <p className="text-xs text-ink3 leading-relaxed">
            For an emergency, please also tap <em>Get help now</em> at the top
            of any screen — that opens the crisis-line directory for your
            country.
          </p>

          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={onClose} disabled={file.isPending}>
              Cancel
            </Button>
            <Button size="sm" onClick={submit} disabled={file.isPending}>
              {file.isPending ? "Sending…" : "Submit report"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
