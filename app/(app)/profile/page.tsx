"use client";

import Link from "next/link";
import { useSession } from "@/lib/hooks/useSession";
import { useUserPrompts } from "@/lib/hooks/useMyPrompts";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { EyeOfHorus } from "@/components/motifs/Motifs";

export default function MyPublicProfile() {
  const { userId, profile, loading } = useSession();
  const { data: prompts = [], isLoading: promptsLoading } = useUserPrompts(userId);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-6 w-6 rounded-full border-2 border-terracotta border-t-transparent animate-spin" />
      </div>
    );
  }

  const alias = profile?.alias ?? "Friend";
  const city = profile?.city ?? "";
  const country = profile?.country ?? "";
  const descent: string[] = (profile as any)?.descent ?? [];
  const languages: string[] = (profile as any)?.languages ?? [];
  const tags: string[] = profile?.experience_tags ?? [];
  const verified = (profile as any)?.id_verified ?? false;
  const avatarColor = (profile as any)?.avatar_color ?? "var(--ct-rust)";
  const avatarUrl = (profile as any)?.avatar_url ?? null;

  const locationLine = [
    [city, country].filter(Boolean).join(", "),
    descent.join(" · "),
  ].filter(Boolean).join(" · ");

  return (
    <div>
      <section className="surface p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute -top-8 -right-8 opacity-10 text-terracotta">
          <EyeOfHorus size={220} />
        </div>
        <div className="relative flex flex-col sm:flex-row gap-5 sm:items-end">
          <Avatar name={alias} color={avatarColor} size={96} src={avatarUrl} />
          <div className="flex-1">
            <p className="eyebrow">My profile · what others see</p>
            <h1 className="font-display text-4xl mt-1 leading-tight">{alias}</h1>
            {locationLine && <p className="text-ink2 mt-1">{locationLine}</p>}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tags.map((t) => <Chip key={t}>{t}</Chip>)}
              {verified && <Chip className="border-forest text-forest">ID verified</Chip>}
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/profile/edit"><Button variant="outline">Edit profile</Button></Link>
          </div>
        </div>
      </section>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6 mt-6">
        {/* Wall — empty state until posts feature is built */}
        <section>
          <header className="flex items-baseline justify-between">
            <h2 className="font-display text-2xl">Wall</h2>
            <span className="text-xs text-ink3">0 posts</span>
          </header>
          <div className="mt-3 surface p-6 text-center">
            <p className="text-ink2 text-sm">
              Your wall is empty. Share a thought, a quote, or a moment of your week — your Tribe will see it.
            </p>
            <Button variant="outline" size="sm" className="mt-3" disabled>
              New post (coming soon)
            </Button>
          </div>
        </section>

        <aside className="space-y-5">
          {/* Prompts — real answers from onboarding */}
          {promptsLoading ? (
            <div className="surface p-5">
              <div className="h-3 w-24 bg-line rounded animate-pulse" />
              <div className="mt-2 h-6 bg-line rounded animate-pulse" />
            </div>
          ) : prompts.length > 0 ? (
            prompts.map((p) => (
              <div key={p.id} className="surface p-5">
                <p className="eyebrow">{p.question}</p>
                <p className="font-display text-xl mt-1 italic leading-snug">"{p.answer}"</p>
              </div>
            ))
          ) : (
            <div className="surface p-5">
              <p className="eyebrow">Prompts</p>
              <p className="text-ink3 text-sm mt-1">
                You haven't answered any prompts yet.{" "}
                <Link href="/profile/edit" className="text-terracotta hover:underline">
                  Add some
                </Link>.
              </p>
            </div>
          )}

          {/* Languages */}
          <div className="surface p-5">
            <h3 className="font-display text-lg">Languages</h3>
            <p className="text-ink2 mt-1 text-sm">
              {languages.length > 0 ? languages.join(" · ") : "—"}
            </p>
          </div>

          {/* Open to */}
          <div className="surface p-5">
            <h3 className="font-display text-lg">Open to</h3>
            <ul className="mt-2 text-sm text-ink2 space-y-1">
              {(profile as any)?.accepts_tribe_requests !== false && <li>Tribe requests</li>}
              {(profile as any)?.accepts_dms !== false && <li>Direct messages</li>}
              <li className="text-ink3">Calls & video — off</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
