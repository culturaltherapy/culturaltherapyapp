"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { useCreatePost, type Visibility } from "@/lib/hooks/useWallPosts";

const MAX = 500;

const VIS_OPTIONS: { value: Visibility; label: string; description: string }[] = [
  { value: "public",  label: "Public",   description: "Anyone on Cultural Therapy can see." },
  { value: "tribe",   label: "My Tribes", description: "Only people in your Tribes." },
  { value: "private", label: "Just me",   description: "Only you can see this." },
];

export function PostComposer() {
  const [body, setBody] = React.useState("");
  const [visibility, setVisibility] = React.useState<Visibility>("tribe");
  const [err, setErr] = React.useState<string | null>(null);
  const create = useCreatePost();

  async function submit() {
    setErr(null);
    if (!body.trim()) return;
    try {
      await create.mutateAsync({ body: body.trim(), visibility });
      setBody("");
    } catch (e: any) {
      setErr(e?.message ?? "Couldn't post. Try again.");
    }
  }

  const remaining = MAX - body.length;
  const tooLong = remaining < 0;

  return (
    <div className="surface p-4">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Share a thought, a quote, or a moment of your week…"
        rows={3}
        maxLength={MAX + 50}
        className="w-full bg-transparent border-0 outline-none resize-none text-[15px] placeholder:text-ink3"
      />
      <div className="mt-3 flex flex-wrap items-center gap-3 justify-between border-t border-line pt-3">
        <div className="flex items-center gap-2 text-sm">
          <label className="text-ink3" htmlFor="post-vis">Visibility</label>
          <select
            id="post-vis"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as Visibility)}
            className="rounded-md border border-line bg-bone px-2 py-1.5 text-sm"
          >
            {VIS_OPTIONS.map((v) => (
              <option key={v.value} value={v.value}>{v.label}</option>
            ))}
          </select>
          <span className="text-xs text-ink3 hidden sm:inline">
            {VIS_OPTIONS.find((v) => v.value === visibility)?.description}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className={`text-xs ${tooLong ? "text-crisis" : "text-ink3"}`}>
            {remaining}
          </span>
          <Button
            size="sm"
            onClick={submit}
            disabled={create.isPending || !body.trim() || tooLong}
          >
            {create.isPending ? "Posting…" : "Post"}
          </Button>
        </div>
      </div>
      {err && <p className="mt-2 text-sm text-crisis">{err}</p>}
    </div>
  );
}
