"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTribe, useVillageThreads, usePostThread } from "@/lib/hooks/useTribes";
import { tribes as mockTribes } from "@/lib/mock-data";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Motif } from "@/components/motifs/Motifs";
import { Icon } from "@/components/ui/Icon";

export default function VillagePage() {
  const params = useParams<{ id: string }>();
  const { data: tribe, isLoading: tribeLoading } = useTribe(params.id);
  const { data: rawThreads = [] } = useVillageThreads(params.id);
  const postThread = usePostThread();
  const [composing, setComposing] = React.useState(false);
  const [draft, setDraft] = React.useState("");

  const fallbackTribe = mockTribes[0];
  const t = tribe ?? fallbackTribe;

  const members: any[] = (t as any).tribe_members
    ? (t as any).tribe_members.map((m: any) => m.profiles).filter(Boolean)
    : [];

  const threads = rawThreads.length > 0 ? rawThreads : [
    { id: "vt1", author_id: null, profiles: { alias: "Adwoa K." }, title: "How do you tell your mum you see a therapist?", body: "Looking for words that don't make her think it's a Western thing.", reply_count: 12, created_at: "8m" },
    { id: "vt2", author_id: null, profiles: { alias: "Marcus O." }, title: "Sleep tracker recs?", body: "Mine just guilt-trips me. Anyone using something less judgey?", reply_count: 6, created_at: "1h" },
    { id: "vt3", author_id: null, profiles: { alias: "Tendai R." }, title: "Audio room Tuesday 7pm GMT", body: "We'll talk about meds and music. Bring both.", reply_count: 21, created_at: "3h" },
  ];

  async function handlePost() {
    if (!draft.trim()) return;
    try {
      await postThread.mutateAsync({ tribeId: params.id, title: draft.trim().slice(0, 80), body: draft.trim() });
      setDraft("");
      setComposing(false);
    } catch (_) {}
  }

  if (tribeLoading) {
    return <div className="flex justify-center py-20"><div className="h-6 w-6 rounded-full border-2 border-terracotta border-t-transparent animate-spin" /></div>;
  }

  return (
    <div>
      <Link href="/tribes" className="text-sm text-ink3 hover:text-ink inline-flex items-center gap-1.5">
        <Icon name="arrowLeft" size={14} /> Back to my Tribes
      </Link>

      <section
        className="mt-3 rounded-2xl p-7 sm:p-9 relative overflow-hidden text-bone"
        style={{ background: (t as any).color ?? "#2f4a32" }}
      >
        <div className="absolute -bottom-10 -right-10 opacity-25">
          <Motif name={(t as any).motif} size={260} />
        </div>
        <div className="relative">
          <p className="font-mono text-[10px] tracking-widest opacity-70">VILLAGE OF</p>
          <h1 className="font-display text-4xl sm:text-5xl mt-1 leading-tight">{t.name}</h1>
          <p className="mt-2 text-bone/90 max-w-xl italic">"{t.blurb}"</p>
          <div className="mt-4 flex flex-wrap gap-2 text-bone">
            <span className="rounded-pill bg-bone/10 px-3 py-1 text-xs font-mono">{(t as any).member_count ?? (t as any).memberCount ?? members.length} MEMBERS</span>
            <span className="rounded-pill bg-bone/10 px-3 py-1 text-xs font-mono">{threads.length} THREADS</span>
            <span className="rounded-pill bg-bone/10 px-3 py-1 text-xs font-mono">AUDIO ROOM TUE 7PM</span>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
        <div>
          <article className="surface p-5">
            <div className="flex items-baseline justify-between">
              <div>
                <p className="eyebrow flex items-center gap-2"><Icon name="mic" size={12} /> AUDIO ROOM</p>
                <h2 className="font-display text-2xl mt-1">Meds & music — Tuesday 7pm GMT</h2>
                <p className="text-ink2 text-sm">Hosted by Tendai R. · Recording opt-in. Mods may join silently.</p>
              </div>
              <Button variant="secondary">Join</Button>
            </div>
            {members.length > 0 && (
              <div className="mt-4 flex -space-x-2">
                {members.slice(0, 5).map((m: any, i: number) => (
                  <Avatar key={i} name={m.alias ?? "?"} color="#b3563a" size={32} className="ring-2 ring-bone" />
                ))}
              </div>
            )}
          </article>

          <div className="surface p-4 mt-5">
            <textarea
              value={draft}
              onChange={(e) => { setDraft(e.target.value); setComposing(true); }}
              placeholder={`Start a thread in ${t.name}…`}
              className="w-full bg-transparent border-0 outline-none resize-none text-[15px] placeholder:text-ink3"
              rows={2}
            />
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-ink3">
                <Icon name="camera" size={16} />
                <Icon name="mic" size={16} />
              </div>
              <Button size="sm" onClick={handlePost} disabled={postThread.isPending || !draft.trim()}>
                Post to Village
              </Button>
            </div>
          </div>

          <ul className="mt-5 space-y-3">
            {threads.map((th: any) => (
              <li key={th.id} className="surface p-4 hover:shadow-soft transition">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-display text-xl">{th.title}</h3>
                  <span className="text-xs text-ink3 whitespace-nowrap">{th.created_at}</span>
                </div>
                <p className="text-ink2 text-[15px] mt-1">{th.body}</p>
                <div className="mt-3 flex items-center justify-between text-sm text-ink3">
                  <span>by {th.profiles?.alias ?? "Member"}</span>
                  <span className="inline-flex items-center gap-1"><Icon name="message" size={14} /> {th.reply_count ?? 0} replies</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <aside className="space-y-5">
          {members.length > 0 && (
            <div className="surface p-4">
              <h3 className="font-display text-lg">Members</h3>
              <ul className="mt-3 grid grid-cols-3 gap-2">
                {members.slice(0, 6).map((m: any, i: number) => (
                  <li key={i} className="text-center">
                    <Avatar name={m.alias ?? "?"} color="#b3563a" size={40} className="mx-auto" />
                    <p className="text-[11px] text-ink2 mt-1 truncate">{(m.alias ?? "?").split(" ")[0]}</p>
                  </li>
                ))}
              </ul>
              <Button variant="outline" size="sm" full className="mt-3">See all</Button>
            </div>
          )}

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
