"use client";

import Link from "next/link";
import { useMyTribes } from "@/lib/hooks/useTribes";
import { tribeRequests } from "@/lib/mock-data";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Motif } from "@/components/motifs/Motifs";

export default function TribesPage() {
  const { data: tribes = [], isLoading } = useMyTribes();

  return (
    <div>
      <header className="flex flex-col gap-2">
        <p className="eyebrow">My Tribes · Bantu · Ubuntu</p>
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-4xl sm:text-5xl leading-tight max-w-[20ch]">
              You can belong to more than one circle.
            </h1>
            <p className="text-ink2 mt-2 max-w-prose">
              Each Tribe has its own Village — a private text forum and audio room.
              We cap suggested Tribe size at 30.
            </p>
          </div>
          <Button variant="primary">+ Start a Tribe</Button>
        </div>
      </header>

      {tribeRequests.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-2xl">Pending requests ({tribeRequests.length})</h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {tribeRequests.map((r) => (
              <li key={r.id} className="surface p-4 flex items-start gap-3">
                <Avatar name={r.requester.alias} color={r.requester.avatarColor} size={44} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <strong>{r.requester.alias}</strong>
                    <span className="text-xs text-ink3">{r.requester.city}, {r.requester.country} · {r.requester.matchPct}% match</span>
                  </div>
                  <p className="mt-1 text-sm text-ink2 italic">"{r.message}"</p>
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="primary">Accept</Button>
                    <Button size="sm" variant="outline">Decline</Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10">
        <h2 className="font-display text-2xl">
          {isLoading ? "Your Tribes" : `Your Tribes (${tribes.length})`}
        </h2>
        {isLoading ? (
          <div className="mt-6 flex justify-center">
            <div className="h-6 w-6 rounded-full border-2 border-terracotta border-t-transparent animate-spin" />
          </div>
        ) : (
          <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tribes.map((t: any) => (
              <li key={t.id}>
                <Link href={`/tribes/${t.id}`}
                  className="block aspect-[5/4] rounded-xl p-5 flex flex-col justify-between text-bone overflow-hidden relative hover:translate-y-[-2px] transition"
                  style={{ background: t.color ?? "#2f4a32" }}>
                  <div className="absolute -bottom-6 -right-6 opacity-25">
                    <Motif name={t.motif as any} size={180} />
                  </div>
                  <div className="relative">
                    <p className="font-mono text-[10px] tracking-widest opacity-70">TRIBE</p>
                    <h3 className="font-display text-3xl mt-1 leading-tight">{t.name}</h3>
                    <p className="mt-1 text-sm opacity-90">{t.member_count ?? t.memberCount ?? ""} members</p>
                  </div>
                  <div className="relative">
                    <p className="text-sm opacity-90 italic">"{t.blurb}"</p>
                    <p className="mt-3 text-[11px] font-mono opacity-80 uppercase">Live in the village →</p>
                  </div>
                </Link>
              </li>
            ))}
            {tribes.length === 0 && (
              <li className="col-span-full py-10 text-center text-ink3 text-sm">
                You haven't joined any Tribes yet.
              </li>
            )}
          </ul>
        )}
      </section>
    </div>
  );
}
