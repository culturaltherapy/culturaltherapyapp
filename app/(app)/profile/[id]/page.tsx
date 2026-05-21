"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useProfile } from "@/lib/hooks/useProfile";
import { useUserPrompts } from "@/lib/hooks/useMyPrompts";
import { useSession } from "@/lib/hooks/useSession";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { EyeOfHorus } from "@/components/motifs/Motifs";
import { Icon } from "@/components/ui/Icon";
import { InviteToTribeModal } from "@/components/tribes/InviteToTribeModal";

export default function ViewProfile() {
  const params = useParams<{ id: string }>();
  const { userId: currentUserId } = useSession();
  const { data: profile, isLoading } = useProfile(params.id);
  const { data: prompts = [] } = useUserPrompts(params.id);
  const [inviteOpen, setInviteOpen] = React.useState(false);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-6 w-6 rounded-full border-2 border-terracotta border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="py-20 text-center">
        <p className="font-display text-xl">Profile not found.</p>
        <Link href="/network" className="mt-3 inline-block text-terracotta hover:underline">
          Back to network
        </Link>
      </div>
    );
  }

  const alias = (profile as any).alias ?? "Member";
  const city = (profile as any).city ?? "";
  const country = (profile as any).country ?? "";
  const descent: string[] = (profile as any).descent ?? [];
  const languages: string[] = (profile as any).languages ?? [];
  const tags: string[] = (profile as any).experience_tags ?? [];
  const verified = (profile as any).id_verified ?? false;
  const avatarColor = (profile as any).avatar_color ?? "#b3563a";
  const avatarUrl = (profile as any).avatar_url ?? null;
  const acceptsTribe = (profile as any).accepts_tribe_requests !== false;
  const acceptsDms = (profile as any).accepts_dms !== false;

  const locationLine = [
    [city, country].filter(Boolean).join(", "),
    descent.join(" · "),
  ].filter(Boolean).join(" · ");

  return (
    <div>
      <Link href="/network" className="text-sm text-ink3 hover:text-ink inline-flex items-center gap-1.5">
        <Icon name="arrowLeft" size={14} /> Back to network
      </Link>

      <section className="mt-3 surface p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute -top-8 -right-8 opacity-10 text-terracotta">
          <EyeOfHorus size={220} />
        </div>
        <div className="relative flex flex-col sm:flex-row gap-5 sm:items-end">
          <Avatar name={alias} color={avatarColor} size={96} src={avatarUrl} />
          <div className="flex-1">
            <h1 className="font-display text-4xl mt-1 leading-tight">{alias}</h1>
            {locationLine && <p className="text-ink2 mt-1">{locationLine}</p>}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tags.map((t) => <Chip key={t}>{t}</Chip>)}
              {verified && <Chip className="border-forest text-forest">ID verified</Chip>}
            </div>
          </div>
          <div className="flex gap-2">
            {acceptsDms && currentUserId && currentUserId !== params.id && (
              <Button variant="outline">Message</Button>
            )}
            {acceptsTribe && currentUserId && currentUserId !== params.id && (
              <Button onClick={() => setInviteOpen(true)}>Send Tribe request</Button>
            )}
          </div>
        </div>
      </section>

      <section className="mt-6 grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-4">
          {prompts.length > 0 ? (
            prompts.map((p) => (
              <div key={p.id} className="surface p-6">
                <p className="eyebrow">{p.question}</p>
                <p className="font-display text-xl mt-2 leading-snug">"{p.answer}"</p>
              </div>
            ))
          ) : (
            <div className="surface p-6 text-center">
              <p className="text-ink3 text-sm">This member hasn't answered any prompts yet.</p>
            </div>
          )}
        </div>

        <InviteToTribeModal
          open={inviteOpen}
          onClose={() => setInviteOpen(false)}
          targetUserId={params.id}
          targetAlias={alias}
        />
        <aside className="space-y-5">
          {languages.length > 0 && (
            <div className="surface p-5">
              <h3 className="font-display text-lg">Languages</h3>
              <p className="text-ink2 mt-1 text-sm">{languages.join(" · ")}</p>
            </div>
          )}
          <div className="surface p-5">
            <h3 className="font-display text-lg">Open to</h3>
            <ul className="mt-2 text-sm text-ink2 space-y-1">
              {acceptsTribe && <li>Tribe requests</li>}
              {acceptsDms && <li>Direct messages</li>}
              <li className="text-ink3">Calls & video — off</li>
            </ul>
          </div>
        </aside>
      </section>
    </div>
  );
}
