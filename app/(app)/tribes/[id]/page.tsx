"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { tribes, profiles } from "@/lib/mock-data";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Motif } from "@/components/motifs/Motifs";
import { Icon } from "@/components/ui/Icon";

const threads = [
  { id: "vt1", author: "Adwoa K.", title: "How do you tell your mum you see a therapist?", body: "Looking for words that don't make her think it's a Western thing.", replies: 12, last: "8m" },
  { id: "vt2", author: "Marcus O.", title: "Sleep tracker recs?", body: "Mine just guilt-trips me. Anyone using something less judgey?", replies: 6, last: "1h" },
  { id: "vt3", author: "Tendai R.", title: "Audio room Tuesday 7pm GMT", body: "We'll talk about meds and music. Bring both.", replies: 21, last: "3h" }
];

export default function VillagePage() {
  const params = useParams<{ id: string }>();
  const tribe = tribes.find((t) => t.id === params.id) ?? tribes[0];
  const members = profiles.slice(0, 6);

  return (
    <div>
      <Link href="/tribes" className="text-sm text-ink3 hover:text-ink inline-flex items-center gap-1.5">
        <Icon name="arrowLeft" size={14} /> Back to my Tribes
      </Link>

      {/* Hero */}
      <section
        className="mt-3 rounded-2xl p-7 sm:p-9 relative overflow-hidden text-bone"
        style={{ background: tribe.color }}
      >
        <div className="absolute -bottom-10 -right-10 opacity-25">
          <Motif name={tribe.motif} size={260} />
        </div>
        <div className="relative">
          <p className="font-mono text-[10px] tracking-widest opacity-70">VILLAGE OF</p>
          <h1 className="font-display text-4xl sm:text-5xl mt-1 leading-tight">{tribe.name}</h1>
          <p className="mt-2 text-bone/90 max-w-xl italic">"{tribe.blurb}"</p>
          <div className="mt-4 flex flex-wrap gap-2 text-bone">
            <span className="rounded-pill bg-bone/10 px-3 py-1 text-xs font-mono">{tribe.memberCount} MEMBERS</span>
            <span className="rounded-pill bg-bone/10 px-3 py-1 text-xs font-mono">{threads.length} THREADS</span>
            <span className="rounded-pill bg-bone/10 px-3 py-1 text-xs font-mono">AUDIO ROOM TUE 7PM</span>
          </div>
        </div>
      </section>

      {/* Layout */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* Threads + audio */}
        <div>
          {/* Audio room */}
          <article className="surface p-5">
            <div className="flex items-baseline justify-between">
              <div>
                <p className="eyebrow flex items-center gap-2"><Icon name="mic" size={12} /> AUDIO ROOM</p>
                <h2 className="font-display text-2xl mt-1">Meds & music — Tuesday 7pm GMT</h2>
                <p className="text-ink2 text-sm">Hosted by Tendai R. · Recording opt-in. Mods may join silently.</p>
              </div>
              <Button variant="secondary">Join</Button>
            </div>
            <div className="mt-4 flex -space-x-2">
              {members.slice(0, 5).map((m) => (
                <Avatar key={m.id} name={m.alias} color={m.avatarColor} size={32} className="ring-2 ring-bone" />
              ))}
              <span className="ml-3 text-xs text-ink3 self-center">+{members.length - 5} others may attend</span>
            </div>
          </article>

          {/* Compose */}
          <div className="surface p-4 mt-5">
            <textarea
              placeholder={`Start a thread in ${tribe.name}…`}
              className="w-full bg-transparent border-0 outline-none resize-none text-[15px] placeholder:text-ink3"
              rows={2}
            />
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-ink3">
                <Icon name="camera" size={16} />
                <Icon name="mic" size={16} />
              </div>
              <Button size="sm">Post to Village</Button>
            </div>
          </div>

          {/* Threads */}
          <ul className="mt-5 space-y-3">
            {threads.map((t) => (
              <li key={t.id} className="surface p-4 hover:shadow-soft transition">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-display text-xl">{t.title}</h3>
                  <span className="text-xs text-ink3 whitespace-nowrap">{t.last}</span>
                </div>
                <p className="text-ink2 text-[15px] mt-1">{t.body}</p>
                <div className="mt-3 flex items-center justify-between text-sm text-ink3">
                  <span>by {t.author}</span>
                  <span className="inline-flex items-center gap-1"><Icon name="message" size={14} /> {t.replies} replies</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Sidebar */}
        <aside className="space-y-5">
          <div className="surface p-4">
            <h3 className="font-display text-lg">Members</h3>
            <ul className="mt-3 grid grid-cols-3 gap-2">
              {members.map((m) => (
                <li key={m.id} className="text-center">
                  <Avatar name={m.alias} color={m.avatarColor} size={40} className="mx-auto" />
                  <p className="text-[11px] text-ink2 mt-1 truncate">{m.alias.split(" ")[0]}</p>
                </li>
              ))}
            </ul>
            <Button variant="outline" size="sm" full className="mt-3">See all</Button>
          </div>

          <div className="surface p-4">
            <h3 className="font-display text-lg">Tribe rules</h3>
            <ul className="mt-2 text-sm text-ink2 space-y-1.5 list-disc pl-4">
              <li>What's said here, stays here.</li>
              <li>Crisis is one tap. Not a debate.</li>
              <li>Mods may join audio rooms silently.</li>
            </ul>
          </div>

          <div className="surface p-4">
            <h3 className="font-display text-lg">My settings</h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Chip>Notifs: priority</Chip>
              <Chip>DMs: on</Chip>
              <Chip>Audio: opt-in</Chip>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
