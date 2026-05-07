"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { profiles } from "@/lib/mock-data";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { EyeOfHorus } from "@/components/motifs/Motifs";
import { Icon } from "@/components/ui/Icon";

export default function ViewProfile() {
  const params = useParams<{ id: string }>();
  const p = profiles.find((x) => x.id === params.id) ?? profiles[0];
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
          <Avatar name={p.alias} color={p.avatarColor} size={96} />
          <div className="flex-1">
            <p className="eyebrow">{p.matchPct}% match · {p.distanceKm} km away</p>
            <h1 className="font-display text-4xl mt-1 leading-tight">{p.alias}</h1>
            <p className="text-ink2 mt-1">{p.city}, {p.country} · {p.descent.join(" · ")}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {p.experienceTags.map((t) => (
                <Chip key={t}>{t}</Chip>
              ))}
              {p.idVerified && <Chip className="border-forest text-forest">ID verified</Chip>}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">Message</Button>
            <Button>Send Tribe request</Button>
          </div>
        </div>
      </section>

      <section className="mt-6 grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="surface p-6">
          <p className="eyebrow">{p.prompt.question}</p>
          <p className="font-display text-2xl mt-2 leading-snug">"{p.prompt.answer}"</p>
        </div>
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
