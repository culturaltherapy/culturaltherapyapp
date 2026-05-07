"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useProfile } from "@/lib/hooks/useProfile";
import { profiles as mockProfiles } from "@/lib/mock-data";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { EyeOfHorus } from "@/components/motifs/Motifs";
import { Icon } from "@/components/ui/Icon";

export default function ViewProfile() {
  const params = useParams<{ id: string }>();
  const { data: profile, isLoading } = useProfile(params.id);

  const fallback = mockProfiles.find((x) => x.id === params.id) ?? mockProfiles[0];
  const p = profile ?? fallback;
  const alias = (p as any).alias ?? "Member";
  const city = (p as any).city ?? "";
  const country = (p as any).country ?? "";
  const descent = (p as any).descent ?? [];
  const tags = (p as any).experience_tags ?? (p as any).experienceTags ?? [];
  const verified = (p as any).id_verified ?? (p as any).idVerified ?? false;
  const avatarColor = (p as any).avatar_color ?? (p as any).avatarColor ?? "#b3563a";
  const matchPct = (p as any).matchPct ?? null;
  const distanceKm = (p as any).distanceKm ?? null;
  const prompt = (p as any).prompt ?? null;

  if (isLoading) {
    return <div className="flex justify-center py-20"><div className="h-6 w-6 rounded-full border-2 border-terracotta border-t-transparent animate-spin" /></div>;
  }

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
          <Avatar name={alias} color={avatarColor} size={96} />
          <div className="flex-1">
            <p className="eyebrow">
              {matchPct != null ? `${matchPct}% match · ` : ""}
              {distanceKm != null ? `${distanceKm} km away` : ""}
            </p>
            <h1 className="font-display text-4xl mt-1 leading-tight">{alias}</h1>
            <p className="text-ink2 mt-1">{city}, {country} · {Array.isArray(descent) ? descent.join(" · ") : descent}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(Array.isArray(tags) ? tags : []).map((t: string) => (
                <Chip key={t}>{t}</Chip>
              ))}
              {verified && <Chip className="border-forest text-forest">ID verified</Chip>}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">Message</Button>
            <Button>Send Tribe request</Button>
          </div>
        </div>
      </section>

      <section className="mt-6 grid lg:grid-cols-[1fr_320px] gap-6">
        {prompt?.answer && (
          <div className="surface p-6">
            <p className="eyebrow">{prompt.question}</p>
            <p className="font-display text-2xl mt-2 leading-snug">"{prompt.answer}"</p>
          </div>
        )}
        <aside className="surface p-5">
          <h3 className="font-display text-lg">Open to</h3>
          <ul className="mt-2 text-sm text-ink2 space-y-1">
            <li>Tribe requests</li>
            <li>Direct messages</li>
            <li className="text-ink3">Calls & video — off</li>
          </ul>
        </aside>
      </section>
    </div>
  );
}
