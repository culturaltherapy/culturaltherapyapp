"use client";

import Link from "next/link";
import { me, profiles as mockProfiles, tribes as mockTribes, discussionThreads, courses } from "@/lib/mock-data";
import { useSession } from "@/lib/hooks/useSession";
import { useProfiles } from "@/lib/hooks/useProfiles";
import { useMyTribes } from "@/lib/hooks/useTribes";
import { Avatar } from "@/components/ui/Avatar";
import { Chip } from "@/components/ui/Chip";
import { Ubuntu } from "@/components/motifs/Motifs";
import { Icon } from "@/components/ui/Icon";

export default function HomePage() {
  const { profile, loading } = useSession();
  const { data: networkProfiles = [] } = useProfiles("");
  const { data: myTribes = [] } = useMyTribes();

  const alias = profile?.alias ?? me.alias;
  const firstName = alias.split(" ")[0];
  const tags = profile?.experience_tags ?? me.experienceTags;

  const displayProfiles = networkProfiles.length > 0 ? networkProfiles : mockProfiles;
  const displayTribes = myTribes.length > 0 ? myTribes : mockTribes;

  return (
    <div>
      <section className="relative">
        <p className="eyebrow">Home · Foundation</p>
        <h1 className="font-display text-4xl sm:text-5xl mt-2 leading-tight max-w-[18ch]">
          {loading ? "Welcome back." : `Hello ${firstName}. Here's the room today.`}
        </h1>
      </section>

      <section className="mt-8 grid lg:grid-cols-3 gap-5">
        <article className="surface p-5 lg:col-span-2">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="eyebrow">Suggested for you</p>
              <h2 className="font-display text-2xl">People who've been where you've been</h2>
            </div>
            <Link href="/network" className="text-sm text-terracotta hover:underline">See all</Link>
          </div>
          <div className="mt-4 grid sm:grid-cols-2 gap-3">
            {displayProfiles.slice(0, 4).map((p: any) => (
              <Link key={p.id} href={`/profile/${p.id}`} className="rounded-lg border border-line p-3 hover:bg-ink/[.02] transition flex gap-3">
                <Avatar name={p.alias} color={p.avatarColor ?? p.avatar_color ?? "#b3563a"} size={44} />
                <div className="min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <strong className="truncate">{p.alias}</strong>
                    <span className="text-[11px] font-mono text-terracotta whitespace-nowrap">{p.matchPct ?? "—"}%</span>
                  </div>
                  <p className="text-xs text-ink3">{p.city}, {p.country} · {p.distanceKm ?? "?"} km</p>
                  {p.prompt?.answer && <p className="mt-1 text-sm text-ink2 line-clamp-2">"{p.prompt.answer}"</p>}
                </div>
              </Link>
            ))}
          </div>
        </article>

        <aside className="surface p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-xl">My Tribes</h2>
            <Link href="/tribes" className="text-sm text-terracotta hover:underline">All</Link>
          </div>
          <ul className="mt-3 space-y-2">
            {displayTribes.slice(0, 4).map((t: any) => (
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
                    <span className="text-xs text-ink3">{t.member_count ?? t.memberCount ?? ""} members · {t.preview ?? t.blurb ?? ""}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </section>

      <section className="mt-6 grid lg:grid-cols-2 gap-5">
        <article className="surface p-5">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="eyebrow">Continue learning</p>
              <h2 className="font-display text-2xl">{courses[0].title}</h2>
            </div>
            <span className="text-terracotta font-mono text-sm">{courses[0].progress}%</span>
          </div>
          <div className="mt-3 h-1.5 w-full rounded-pill bg-line">
            <div className="h-1.5 rounded-pill bg-terracotta" style={{ width: `${courses[0].progress}%` }} />
          </div>
          <Link href={`/academy/${courses[0].id}`} className="mt-4 inline-flex items-center gap-1 text-terracotta text-sm hover:underline">
            Pick up where you left off <Icon name="arrow" size={14} />
          </Link>
        </article>

        <article className="surface p-5">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="eyebrow">In Discussions</p>
              <h2 className="font-display text-2xl">Conversations alive now</h2>
            </div>
            <Link href="/discussions" className="text-sm text-terracotta hover:underline">Open</Link>
          </div>
          <ul className="mt-3 divide-y divide-line">
            {discussionThreads.slice(0, 3).map((t) => (
              <li key={t.id} className="py-2.5">
                <Link href="/discussions" className="flex items-baseline justify-between gap-3 hover:text-terracotta">
                  <span className="text-[15px]">{t.title}</span>
                  <span className="text-xs text-ink3 whitespace-nowrap">{t.replies} · {t.last}</span>
                </Link>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <div className="mt-10 flex flex-wrap items-center gap-2 text-sm">
        <Chip>Pyramid · Foundation</Chip>
        <span className="text-ink3">·</span>
        <Chip>{Array.isArray(tags) ? tags.length : 0} lived-experience tags</Chip>
        <span className="text-ink3">·</span>
        <Chip>{displayTribes.length} Tribes</Chip>
      </div>
    </div>
  );
}
