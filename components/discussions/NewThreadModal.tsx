"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { useCreateThread } from "@/lib/hooks/useDiscussions";

export function NewThreadModal({
  open, onClose, roomId, roomTitle,
}: {
  open: boolean;
  onClose: () => void;
  roomId: string;
  roomTitle: string;
}) {
  const router = useRouter();
  const createThread = useCreateThread();
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [err, setErr] = React.useState<string | null>(null);

  function reset() {
    setTitle(""); setBody(""); setErr(null);
  }

  async function submit() {
    setErr(null);
    if (!body.trim()) return;
    try {
      const created = await createThread.mutateAsync({
        roomId,
        title,
        body,
      });
      reset();
      onClose();
      router.push(`/discussions/${created.id}`);
    } catch (e: any) {
      setErr(e?.message ?? "Couldn't post.");
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose(); }}
      title={`Start a thread in ${roomTitle}`}
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => { reset(); onClose(); }}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={submit}
            disabled={createThread.isPending || !body.trim()}
          >
            {createThread.isPending ? "Posting…" : "Post thread"}
          </Button>
        </div>
      }
    >
      <Field label="Title (optional)" hint="A short prompt or question.">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. How do you tell your mum you see a therapist?"
          maxLength={120}
        />
      </Field>
      <div className="h-4" />
      <Field label="Your post" required hint="Be specific. Others lean in to honest, particular stories.">
        <Textarea
          rows={6}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Take your time."
          maxLength={5000}
        />
      </Field>
      {err && <p className="mt-3 text-sm text-crisis">{err}</p>}
    </Modal>
  );
}
