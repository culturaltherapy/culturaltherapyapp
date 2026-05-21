"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/hooks/useSession";
import { useProfiles } from "@/lib/hooks/useProfiles";
import { useMyTribes } from "@/lib/hooks/useTribes";
import { useDiscussionRooms } from "@/lib/hooks/useDiscussions";
import { Avatar } from "@/components/ui/Avatar";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { Ubuntu, Sankofa, Pyramid } from "@/components/motifs/Motifs";
import { Icon } from "@/components/ui/Icon";

export default function HomePage() {
  const router = useRouter();
  const { profile, loading } = useSession();
  const { data: networkProfiles = [] } = useProfiles("");
  const { data: myTribes = [] } = useMyTribes();
  const { data: rooms = [] } = useDiscussionRooms();

  // Onboarding gate: if signed in but profile is incomplete, send to onboarding
  React.useEffect(() => {
    if (loading) return;
    if (profile && !profile.alias) {
      router.replace("/onboarding");
    }
  }, [loading, profile, router]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-6 w-6 rounded-full border-2 border-terracotta border-t-transparent animate-spin" />
      </div>
    );
  }

  const alias = profile?.alias ?? "friend";
  const firstName = alias.split(" ")[0];
  const tags = Array.isArray(profile?.experience_tags) ? profile.experience_tags : [];

  return (
    <div>
      {/* Greeting */}
      <section className="relative">
        <p className="eyebrow">Home · Foundation</p>
        <h1 className="font-display text-4xl sm:text-5xl mt-2 leading-tight max-w-[18ch]">
          Hello {firstName}. Here's the room today.
        </h1>
      </section>

      <section className="mt-8 grid lg:grid-cols-3 gap-5">
        {/* Suggested matches */}
        <article className="surface p-5 lg:col-span-2">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="eyebrow">Suggested for you</p>
              <h2 className="font-display text-2xl">People who've been where you've been</h2>
            </div>
            {networkProfiles.length > 0 && (
              <Link href="/network" className="text-sm text-terracotta hover:underline">See all</Link>
            )}
          </div>
          {networkProfiles.length === 0 ? (
            <div className="mt-5 p-6 text-center border border-dashed border-line rounded-lg">
              <div className="text-terracotta mx-auto inline-block mb-2"><Sankofa size={32} /></div>
              <p className="text-ink2 text-sm max-w-md mx-auto">
                You're early — the network is still growing. As more members complete onboarding, your suggested matches will appear here.
              </p>
              <Link href="/network" className="mt-3 inline-flex items-center gap-1 text-terracotta text-sm hover:underline">
                Open the network <Icon name="arrow" size={14} />
              </Link>
            </div>
          ) : (
            <div className="mt-4 grid sm:grid-cols-2 gap-3">
              {networkProfiles.slice(0, 4).map((p: any) => (
                <Link
                  key={p.id}
                  href={`/profile/${p.id}`}
                  className="rounded-lg border border-line p-3 hover:bg-ink/[.02] transition flex gap-3"
                >
                  <Avatar name={p.alias} color={p.avatarColor ?? "#b3563a"} size={44} src={p.src} />
                  <div className="min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <strong className="truncate">{p.alias}</strong>
                      {p.matchPct != null && (
                        <span className="text-[11px] font-mono text-terracotta whitespace-nowrap">{p.matchPct}%</span>
                      )}
                    </div>
                    {(p.city || p.country) && (
                      <p className="text-xs text-ink3 truncate">{[p.city, p.country].filter(Boolean).join(", ")}</p>
                    )}
                    {p.prompt?.answer && (
                      <p className="mt-1 text-sm text-ink2 line-clamp-2">"{p.prompt.answer}"</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </article>

        {/* My Tribes */}
        <aside className="surface p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-xl">My Tribes</h2>
            {myTribes.length > 0 && (
              <Link href="/tribes" className="text-sm text-terracotta hover:underline">All</Link>
            )}
          </div>
          {myTribes.length === 0 ? (
            <div className="mt-3 p-4 text-center border border-dashed border-line rounded-lg">
              <p className="text-ink2 text-sm">You haven't joined a Tribe yet.</p>
              <Link href="/tribes" className="mt-2 inline-block text-terracotta text-sm hover:underline">
                Start or join one →
              </Link>
            </div>
          ) : (
            <ul className="mt-3 space-y-2">
              {myTribes.slice(0, 4).map((t: any) => (
                <li key={t.id}>
                  <Link
                    href={`/tribes/${t.id}`}
                    className="flex items-center gap-3 rounded-md p-2 hover:bg-ink/[.03]"
                  >
                    <span
                      className="h-9 w-9 rounded-md inline-flex items-center justify-center text-bone"
                      style={{ background: t.color ?? "#2f4a32" }}
                    >
                      <Ubuntu size={20} />
                    </span>
                    <div className="min-w-0">
                      <strong className="block truncate">{t.name}</strong>
                      <span className="text-xs text-ink3 truncate">
                        {t.member_count ?? ""} {(t.member_count ?? 0) === 1 ? "member" : "members"}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </section>

      {/* Discussions + Quick start */}
      <section className="mt-6 grid lg:grid-cols-2 gap-5">
        <article className="surface p-5">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="eyebrow">In Discussions</p>
              <h2 className="font-display text-2xl">Rooms open now</h2>
            </div>
            <Link href="/discussions" className="text-sm text-terracotta hover:underline">Open</Link>
          </div>
          {rooms.length === 0 ? (
            <p className="mt-3 text-sm text-ink3">Discussion rooms are warming up.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {rooms.slice(0, 4).map((r: any) => (
                <li key={r.id} className="py-2.5">
                  <Link
                    href="/discussions"
                    className="flex items-center justify-between gap-3 hover:text-terracotta"
                  >
                    <div className="min-w-0">
                      <span className="text-[15px] block truncate">{r.title}</span>
                      {r.blurb && <span className="text-xs text-ink3 block truncate">{r.blurb}</span>}
                    </div>
                    {r.isChat && (
                      <span className="text-[10px] font-mono bg-crisis text-bone rounded-pill px-2 py-0.5 whitespace-nowrap">
                        LIVE
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="surface p-5">
          <div className="text-terracotta mb-2"><Pyramid size={32} /></div>
          <p className="eyebrow">Quick start</p>
          <h2 className="font-display text-2xl">Find your people.</h2>
          <p className="text-ink2 text-sm mt-2 max-w-prose">
            The network is where lived experience meets lived experience. Filter, search, and send a Tribe request when you feel ready.
          </p>
          <div className="mt-4 flex gap-2 flex-wrap">
            <Link href="/network"><Button size="sm">Open the network</Button></Link>
            <Link href="/profile"><Button size="sm" variant="outline">My profile</Button></Link>
          </div>
        </article>
      </section>

      <div className="mt-10 flex flex-wrap items-center gap-2 text-sm">
        <Chip>Pyramid · Foundation</Chip>
        <span className="text-ink3">·</span>
        <Chip>
          {tags.length} lived-experience {tags.length === 1 ? "tag" : "tags"}
        </Chip>
        <span className="text-ink3">·</span>
        <Chip>
          {myTribes.length} {myTribes.length === 1 ? "Tribe" : "Tribes"}
        </Chip>
      </div>
    </div>
  );
}
