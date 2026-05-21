"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { useCreateTribe } from "@/lib/hooks/useTribes";
import { Motif } from "@/components/motifs/Motifs";

const COLOR_OPTIONS = [
  { label: "Forest",    value: "#2f4a32" },
  { label: "Terracotta", value: "#b3563a" },
  { label: "Indigo",    value: "#3b3a78" },
  { label: "Plum",      value: "#5a2a3a" },
  { label: "Ochre",     value: "#a86a2c" },
  { label: "Slate",     value: "#3a4554" },
];

const MOTIF_OPTIONS = ["Sankofa", "Ubuntu", "Dwennimmen", "Funtunfunefu", "EyeOfHorus", "Pyramid", "Ankh"];

export function CreateTribeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const createTribe = useCreateTribe();

  const [name, setName] = React.useState("");
  const [blurb, setBlurb] = React.useState("");
  const [color, setColor] = React.useState(COLOR_OPTIONS[0].value);
  const [motif, setMotif] = React.useState(MOTIF_OPTIONS[0]);
  const [err, setErr] = React.useState<string | null>(null);

  function reset() {
    setName(""); setBlurb(""); setColor(COLOR_OPTIONS[0].value);
    setMotif(MOTIF_OPTIONS[0]); setErr(null);
  }

  async function submit() {
    setErr(null);
    try {
      const id = await createTribe.mutateAsync({ name, blurb, color, motif });
      reset();
      onClose();
      router.push(`/tribes/${id}`);
    } catch (e: any) {
      setErr(e?.message ?? "Couldn't create tribe.");
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose(); }}
      title="Start a Tribe"
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => { reset(); onClose(); }}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={submit}
            disabled={createTribe.isPending || name.trim().length < 2}
          >
            {createTribe.isPending ? "Creating…" : "Create Tribe"}
          </Button>
        </div>
      }
    >
      <p className="text-ink2 text-sm mb-4">
        A Tribe is a small, private group with its own Village (forum + audio room).
        You'll be the founding member — invite others once it exists.
      </p>

      {/* Live preview */}
      <div
        className="rounded-xl p-5 mb-5 relative overflow-hidden text-bone aspect-[5/3] flex flex-col justify-between"
        style={{ background: color }}
      >
        <div className="absolute -bottom-6 -right-6 opacity-25">
          <Motif name={motif as any} size={140} />
        </div>
        <div className="relative">
          <p className="font-mono text-[10px] tracking-widest opacity-70">TRIBE</p>
          <h3 className="font-display text-2xl mt-1 leading-tight">
            {name.trim() || "Your Tribe name"}
          </h3>
        </div>
        <p className="relative text-sm opacity-90 italic line-clamp-2">
          "{blurb.trim() || "What this Tribe is for, in one breath."}"
        </p>
      </div>

      <div className="space-y-4">
        <Field label="Tribe name" required hint="2–60 characters">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Diaspora London"
            maxLength={60}
          />
        </Field>

        <Field label="Blurb" hint="One sentence — what this Tribe holds space for.">
          <Textarea
            rows={2}
            value={blurb}
            onChange={(e) => setBlurb(e.target.value)}
            placeholder="e.g. For Black Londoners holding two homes."
            maxLength={200}
          />
        </Field>

        <Field label="Color">
          <div className="flex flex-wrap gap-2">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c.value}
                onClick={() => setColor(c.value)}
                aria-label={c.label}
                className={`h-10 w-10 rounded-full transition ${color === c.value ? "ring-2 ring-offset-2 ring-ink" : "opacity-80 hover:opacity-100"}`}
                style={{ background: c.value }}
              />
            ))}
          </div>
        </Field>

        <Field label="Motif">
          <div className="flex flex-wrap gap-2">
            {MOTIF_OPTIONS.map((m) => {
              const active = motif === m;
              return (
                <button
                  key={m}
                  onClick={() => setMotif(m)}
                  className={`h-12 w-12 rounded-lg border flex items-center justify-center transition ${
                    active ? "border-ink bg-ink text-bone" : "border-line bg-bone hover:bg-ink/5 text-ink"
                  }`}
                  aria-label={m}
                  title={m}
                >
                  <Motif name={m as any} size={24} />
                </button>
              );
            })}
          </div>
        </Field>

        {err && <p className="text-sm text-crisis">{err}</p>}
      </div>
    </Modal>
  );
}
