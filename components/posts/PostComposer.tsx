"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { useCreatePost, VIS_OPTIONS, type Visibility } from "@/lib/hooks/useWallPosts";

const MAX = 500;

export function PostComposer({
  fixedVisibility,
  placeholder = "Share a thought, a quote, or a moment of your week…",
}: {
  /** When set, hides the visibility picker and always posts at this
   *  visibility — used on the Community Wall, where posting anything other
   *  than "public" would just vanish from the screen you posted it on. */
  fixedVisibility?: Visibility;
  placeholder?: string;
}) {
  const [body, setBody] = React.useState("");
  const [visibility, setVisibility] = React.useState<Visibility>(fixedVisibility ?? "tribe");
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
        placeholder={placeholder}
        rows={3}
        maxLength={MAX + 50}
        className="w-full bg-transparent border-0 outline-none resize-none text-[15px] placeholder:text-ink3"
      />
      <div className="mt-3 flex flex-wrap items-center gap-3 justify-between border-t border-line pt-3">
        {fixedVisibility ? (
          <span className="text-xs text-ink3">
            {VIS_OPTIONS.find((v) => v.value === fixedVisibility)?.description ?? "Visible per this wall's rules."}
          </span>
        ) : (
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
        )}

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
