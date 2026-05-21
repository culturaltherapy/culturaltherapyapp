"use client";

import * as React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Textarea } from "@/components/ui/Field";
import { useMyTribes, useSendTribeRequest } from "@/lib/hooks/useTribes";
import { Motif } from "@/components/motifs/Motifs";

export function InviteToTribeModal({
  open, onClose, targetUserId, targetAlias,
}: {
  open: boolean;
  onClose: () => void;
  targetUserId: string;
  targetAlias: string;
}) {
  const { data: myTribes = [] } = useMyTribes();
  const sendRequest = useSendTribeRequest();
  const [tribeId, setTribeId] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState("");
  const [err, setErr] = React.useState<string | null>(null);
  const [sent, setSent] = React.useState(false);

  // Default to first tribe when modal opens
  React.useEffect(() => {
    if (open && !tribeId && myTribes.length > 0) {
      setTribeId(myTribes[0].id);
    }
  }, [open, myTribes, tribeId]);

  async function submit() {
    if (!tribeId) return;
    setErr(null);
    try {
      await sendRequest.mutateAsync({ tribeId, targetUserId, message });
      setSent(true);
    } catch (e: any) {
      // Friendlier message for the duplicate-pending unique index
      const msg = e?.message ?? "Couldn't send invitation.";
      if (msg.includes("tribe_requests_unique_pending")) {
        setErr(`${targetAlias} already has a pending invitation to this Tribe.`);
      } else {
        setErr(msg);
      }
    }
  }

  function close() {
    setMessage("");
    setErr(null);
    setSent(false);
    onClose();
  }

  if (myTribes.length === 0) {
    return (
      <Modal open={open} onClose={close} title="Invite to a Tribe" size="sm"
        footer={<Button size="sm" variant="outline" onClick={close}>Close</Button>}>
        <p className="text-ink2 text-sm">
          You're not in any Tribes yet. Start one first, then invite {targetAlias} to it.
        </p>
      </Modal>
    );
  }

  if (sent) {
    return (
      <Modal open={open} onClose={close} title="Invitation sent" size="sm"
        footer={<Button size="sm" onClick={close}>Done</Button>}>
        <p className="text-ink2 text-sm">
          {targetAlias} has been invited. You'll see them in your Tribe once they accept.
        </p>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title={`Invite ${targetAlias} to a Tribe`}
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={close}>Cancel</Button>
          <Button size="sm" onClick={submit} disabled={!tribeId || sendRequest.isPending}>
            {sendRequest.isPending ? "Sending…" : "Send invitation"}
          </Button>
        </div>
      }
    >
      <Field label="Tribe">
        <ul className="space-y-2">
          {myTribes.map((t: any) => {
            const active = t.id === tribeId;
            return (
              <li key={t.id}>
                <button
                  onClick={() => setTribeId(t.id)}
                  className={`w-full text-left flex items-center gap-3 p-3 rounded-lg border transition ${
                    active ? "border-ink bg-ink/5" : "border-line hover:bg-ink/[.03]"
                  }`}
                >
                  <span
                    className="h-10 w-10 rounded-md flex items-center justify-center text-bone shrink-0"
                    style={{ background: t.color ?? "#2f4a32" }}
                  >
                    <Motif name={(t.motif ?? "Ubuntu") as any} size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <strong className="block truncate">{t.name}</strong>
                    {t.blurb && <span className="text-xs text-ink3 truncate block">{t.blurb}</span>}
                  </div>
                  {active && <span className="text-terracotta">✓</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </Field>

      <div className="mt-4">
        <Field label="Personal note (optional)" hint="Why you want them in this Tribe.">
          <Textarea
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={300}
            placeholder="e.g. Loved your prompt about Sunday mornings — felt familiar."
          />
        </Field>
      </div>

      {err && <p className="text-sm text-crisis mt-3">{err}</p>}
    </Modal>
  );
}
