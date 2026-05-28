"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { getSupabaseBrowser } from "@/lib/supabase/client";

type Props = {
  targetTable: string | null;
  targetId: string | null;
};

/**
 * Fetch the row that a moderation report points at and render a compact
 * preview, so the moderator can read the reported content without
 * leaving the queue. Falls back to a small "(can't preview)" line if the
 * target_table isn't one we know how to render.
 */
export function ReportTargetPreview({ targetTable, targetId }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["report_target", targetTable, targetId],
    enabled: !!targetTable && !!targetId,
    queryFn: async () => fetchTarget(targetTable!, targetId!),
    staleTime: 30_000,
  });

  if (!targetTable || !targetId) return null;

  if (isLoading) {
    return (
      <div className="mt-2 rounded-md bg-bone border border-line px-3 py-2">
        <div className="h-3 w-20 bg-line rounded animate-pulse" />
        <div className="h-3 w-3/4 mt-2 bg-line rounded animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mt-2 rounded-md bg-bone border border-line px-3 py-2 text-xs text-ink3 italic">
        Couldn't load the reported content — it may have been deleted.
      </div>
    );
  }

  return (
    <div className="mt-2 rounded-md bg-bone border border-line px-3 py-2 text-sm text-ink2">
      {data.eyebrow && (
        <p className="text-[10px] font-mono uppercase tracking-wider text-ink3 mb-1">
          {data.eyebrow}
        </p>
      )}
      {data.title && (
        <p className="font-display text-base text-ink leading-tight mb-1">
          {data.title}
        </p>
      )}
      {data.body && (
        <p className="whitespace-pre-wrap line-clamp-6">{data.body}</p>
      )}
      {data.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={data.imageUrl}
          alt="Reported media"
          className="mt-2 max-h-40 rounded-md border border-line object-cover"
          loading="lazy"
        />
      )}
      {data.byline && (
        <p className="text-xs text-ink3 mt-1.5">— {data.byline}</p>
      )}
    </div>
  );
}

type Preview = {
  eyebrow?: string;
  title?: string;
  body?: string;
  imageUrl?: string;
  byline?: string;
};

async function fetchTarget(table: string, id: string): Promise<Preview | null> {
  const supa = getSupabaseBrowser();
  if (!supa) return null;

  switch (table) {
    case "posts": {
      const { data } = await (supa as any)
        .from("posts")
        .select("body, visibility, owner_id, created_at")
        .eq("id", id)
        .maybeSingle();
      if (!data) return null;
      const owner = await aliasFor(data.owner_id);
      return {
        eyebrow: `Wall post · ${data.visibility ?? "?"}`,
        body: data.body,
        byline: owner ? `@${owner}` : undefined,
      };
    }
    case "post_comments": {
      const { data } = await (supa as any)
        .from("post_comments")
        .select("body, author_id, post_id, created_at")
        .eq("id", id)
        .maybeSingle();
      if (!data) return null;
      const author = await aliasFor(data.author_id);
      return {
        eyebrow: "Wall comment",
        body: data.body,
        byline: author ? `@${author}` : undefined,
      };
    }
    case "profile_prompts": {
      const { data } = await (supa as any)
        .from("profile_prompts")
        .select("question, answer, user_id, visibility")
        .eq("id", id)
        .maybeSingle();
      if (!data) return null;
      const owner = await aliasFor(data.user_id);
      return {
        eyebrow: `Profile prompt · ${data.visibility ?? "?"}`,
        title: data.question,
        body: `"${data.answer}"`,
        byline: owner ? `@${owner}` : undefined,
      };
    }
    case "prompt_comments": {
      const { data } = await (supa as any)
        .from("prompt_comments")
        .select("body, author_id")
        .eq("id", id)
        .maybeSingle();
      if (!data) return null;
      const author = await aliasFor(data.author_id);
      return {
        eyebrow: "Prompt comment",
        body: data.body,
        byline: author ? `@${author}` : undefined,
      };
    }
    case "media_comments": {
      const { data } = await (supa as any)
        .from("media_comments")
        .select("body, author_id")
        .eq("id", id)
        .maybeSingle();
      if (!data) return null;
      const author = await aliasFor(data.author_id);
      return {
        eyebrow: "Media comment",
        body: data.body,
        byline: author ? `@${author}` : undefined,
      };
    }
    case "profile_media": {
      const { data } = await (supa as any)
        .from("profile_media")
        .select("url, caption, kind, owner_id")
        .eq("id", id)
        .maybeSingle();
      if (!data) return null;
      const owner = await aliasFor(data.owner_id);
      const isVideo = data.kind === "video";
      return {
        eyebrow: `Gallery ${isVideo ? "video" : "photo"}`,
        body: data.caption ?? "(no caption)",
        imageUrl: isVideo ? undefined : data.url,
        byline: owner ? `@${owner}` : undefined,
      };
    }
    case "discussion_posts": {
      const { data } = await (supa as any)
        .from("discussion_posts")
        .select("title, body, author_id, parent_id, created_at")
        .eq("id", id)
        .maybeSingle();
      if (!data) return null;
      const author = await aliasFor(data.author_id);
      const isReply = data.parent_id != null;
      return {
        eyebrow: isReply ? "Discussion reply" : "Discussion thread",
        title: data.title ?? undefined,
        body: data.body,
        byline: author ? `@${author}` : undefined,
      };
    }
    case "dm_threads": {
      // Sensitive — don't preview message bodies, just say who's in the
      // thread. The moderator can open it manually if they need to.
      const { data } = await (supa as any)
        .from("dm_threads")
        .select("user_a, user_b, last_message_at")
        .eq("id", id)
        .maybeSingle();
      if (!data) return null;
      const [a, b] = await Promise.all([aliasFor(data.user_a), aliasFor(data.user_b)]);
      return {
        eyebrow: "Direct message thread",
        body: `Between @${a ?? "?"} and @${b ?? "?"}. Open the thread to see the messages — DMs are not previewed here for privacy.`,
      };
    }
    case "profiles": {
      const { data } = await (supa as any)
        .from("profiles")
        .select("alias, bio, country, city, avatar_url")
        .eq("id", id)
        .maybeSingle();
      if (!data) return null;
      return {
        eyebrow: "Profile",
        title: data.alias ?? "(no alias)",
        body: [data.bio, [data.city, data.country].filter(Boolean).join(", ")].filter(Boolean).join("\n"),
        imageUrl: data.avatar_url ?? undefined,
      };
    }
    default:
      return null;
  }
}

async function aliasFor(userId: string | null): Promise<string | null> {
  if (!userId) return null;
  const supa = getSupabaseBrowser();
  if (!supa) return null;
  const { data } = await (supa as any)
    .from("profiles")
    .select("alias")
    .eq("id", userId)
    .maybeSingle();
  return data?.alias ?? null;
}
