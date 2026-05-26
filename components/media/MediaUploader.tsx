"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import {
  useUploadMedia,
  MAX_MEDIA_ITEMS,
  MAX_FILE_BYTES,
  type ProfileMedia,
} from "@/lib/hooks/useProfileMedia";

const ACCEPTED = "image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm";

type Pending = {
  file: File;
  caption: string;
  previewUrl: string;
  kind: "image" | "video";
  status: "queued" | "uploading" | "done" | "error";
  progress: number; // 0-100
  error?: string;
};

function fmtMB(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(0)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

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
    const rejected: { name: string; size: number }[] = [];
    for (const file of files) {
      if (file.size > MAX_FILE_BYTES) {
        rejected.push({ name: file.name, size: file.size });
        continue;
      }
      const kind: "image" | "video" = file.type.startsWith("video/") ? "video" : "image";
      valid.push({
        file,
        caption: "",
        previewUrl: URL.createObjectURL(file),
        kind,
        status: "queued",
        progress: 0,
      });
    }
    if (rejected.length > 0) {
      const names = rejected.map((r) => `${r.name} (${fmtMB(r.size)})`).join(", ");
      alert(
        `These files are larger than 500 MB and weren't added:\n\n${names}\n\n` +
        `For long videos, please compress first (e.g. handbrake.fr) or trim them.`
      );
    }

    // Don't exceed remaining slots
    const allowed = valid.slice(0, Math.max(0, remaining - pending.length));
    setPending((cur) => [...cur, ...allowed]);
  }

  async function uploadAll() {
    for (let i = 0; i < pending.length; i++) {
      if (pending[i].status === "done") continue;
      setPending((cur) =>
        cur.map((p, idx) => (idx === i ? { ...p, status: "uploading", progress: 0 } : p))
      );
      try {
        await upload.mutateAsync({
          file: pending[i].file,
          caption: pending[i].caption,
          onProgress: (pct) => {
            setPending((cur) =>
              cur.map((p, idx) => (idx === i ? { ...p, progress: Math.round(pct) } : p))
            );
          },
        });
        setPending((cur) =>
          cur.map((p, idx) => (idx === i ? { ...p, status: "done", progress: 100 } : p))
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
    }, 1200);
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
        <div>
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
          <p className="mt-2 text-xs text-ink3">
            Up to 500 MB per file. Large videos upload in chunks and resume if your network drops.
          </p>
        </div>
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
                  {p.status === "queued" && `Queued · ${fmtMB(p.file.size)}`}
                  {p.status === "uploading" && `Uploading ${p.progress}% · ${fmtMB(p.file.size)}`}
                  {p.status === "done" && "✓ Uploaded"}
                  {p.status === "error" && <span className="text-crisis">Error: {p.error}</span>}
                </span>
                {p.status !== "uploading" && p.status !== "done" && (
                  <button onClick={() => remove(i)} className="hover:text-crisis">
                    Remove
                  </button>
                )}
              </div>

              {(p.status === "uploading" || p.status === "done") && (
                <div className="mt-2 h-1.5 w-full rounded-pill bg-line overflow-hidden">
                  <div
                    className={`h-full rounded-pill transition-[width] duration-200 ${
                      p.status === "done" ? "bg-forest" : "bg-terracotta"
                    }`}
                    style={{ width: `${p.progress}%` }}
                  />
                </div>
              )}
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
