"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { useUploadMedia, MAX_MEDIA_ITEMS, type ProfileMedia } from "@/lib/hooks/useProfileMedia";

const ACCEPTED = "image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm";
const MAX_BYTES = 25 * 1024 * 1024;

type Pending = {
  file: File;
  caption: string;
  previewUrl: string;
  kind: "image" | "video";
  status: "queued" | "uploading" | "done" | "error";
  error?: string;
};

export function MediaUploader({
  existing,
  ownerId,
}: {
  existing: ProfileMedia[];
  ownerId: string;
}) {
  const [pending, setPending] = React.useState<Pending[]>([]);
  const upload = useUploadMedia();

  const remaining = MAX_MEDIA_ITEMS - existing.length;
  const atLimit = remaining <= 0;

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // allow re-selecting the same file

    const valid: Pending[] = [];
    for (const file of files) {
      if (file.size > MAX_BYTES) continue; // silently skip > 25MB
      const kind: "image" | "video" = file.type.startsWith("video/") ? "video" : "image";
      valid.push({
        file,
        caption: "",
        previewUrl: URL.createObjectURL(file),
        kind,
        status: "queued",
      });
    }

    // Don't exceed remaining slots
    const allowed = valid.slice(0, Math.max(0, remaining - pending.length));
    setPending((cur) => [...cur, ...allowed]);
  }

  async function uploadAll() {
    for (let i = 0; i < pending.length; i++) {
      if (pending[i].status === "done") continue;
      setPending((cur) =>
        cur.map((p, idx) => (idx === i ? { ...p, status: "uploading" } : p))
      );
      try {
        await upload.mutateAsync({
          file: pending[i].file,
          caption: pending[i].caption,
        });
        setPending((cur) =>
          cur.map((p, idx) => (idx === i ? { ...p, status: "done" } : p))
        );
      } catch (e: any) {
        setPending((cur) =>
          cur.map((p, idx) => (idx === i ? { ...p, status: "error", error: e?.message } : p))
        );
      }
    }
    // After all uploaded, clear the done ones
    setTimeout(() => {
      setPending((cur) => cur.filter((p) => p.status !== "done"));
    }, 800);
  }

  function remove(i: number) {
    setPending((cur) => {
      URL.revokeObjectURL(cur[i].previewUrl);
      return cur.filter((_, idx) => idx !== i);
    });
  }

  function setCaption(i: number, v: string) {
    setPending((cur) =>
      cur.map((p, idx) => (idx === i ? { ...p, caption: v } : p))
    );
  }

  return (
    <div>
      {atLimit ? (
        <p className="text-sm text-ink2 bg-ochre/10 border border-ochre/30 rounded-md px-3 py-2">
          You've reached the {MAX_MEDIA_ITEMS}-item limit. Delete something below
          to make room for new uploads.
        </p>
      ) : (
        <label className="inline-flex items-center gap-2 rounded-md border border-line bg-bone px-4 py-2.5 text-sm cursor-pointer hover:bg-ink/5">
          <Icon name="plus" size={16} />
          Choose photos or videos ({remaining} left)
          <input
            type="file"
            accept={ACCEPTED}
            multiple
            className="hidden"
            onChange={onPick}
          />
        </label>
      )}

      {pending.length > 0 && (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {pending.map((p, i) => (
            <li key={i} className="surface p-3">
              <div className="aspect-[4/3] rounded-md overflow-hidden bg-ink/5 flex items-center justify-center">
                {p.kind === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.previewUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <video src={p.previewUrl} className="h-full w-full object-cover" muted />
                )}
              </div>
              <Field label="Caption (optional)">
                <Input
                  value={p.caption}
                  onChange={(e) => setCaption(i, e.target.value)}
                  placeholder="e.g. Sunday market with my sister"
                  maxLength={140}
                  disabled={p.status === "uploading" || p.status === "done"}
                />
              </Field>
              <div className="mt-2 flex items-center justify-between text-xs text-ink3">
                <span>
                  {p.status === "queued" && "Queued"}
                  {p.status === "uploading" && "Uploading…"}
                  {p.status === "done" && "✓ Uploaded"}
                  {p.status === "error" && <span className="text-crisis">Error: {p.error}</span>}
                </span>
                {p.status !== "uploading" && p.status !== "done" && (
                  <button onClick={() => remove(i)} className="hover:text-crisis">
                    Remove
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {pending.length > 0 && (
        <div className="mt-4 flex justify-end gap-2">
          <Button
            size="sm"
            onClick={uploadAll}
            disabled={upload.isPending || pending.every((p) => p.status === "done")}
          >
            {upload.isPending ? "Uploading…" : `Upload ${pending.filter((p) => p.status !== "done").length} item(s)`}
          </Button>
        </div>
      )}
    </div>
  );
}
