"use client";

import * as React from "react";
import Link from "next/link";
import { useProfiles } from "@/lib/hooks/useProfiles";
import { Avatar } from "@/components/ui/Avatar";
import { Chip } from "@/components/ui/Chip";
import { Sankofa } from "@/components/motifs/Motifs";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";

type Sort = "mix" | "location" | "match";
type View = "cards" | "list" | "mosaic";

export default function NetworkPage() {
  const [q, setQ] = React.useState("");
  const [sort, setSort] = React.useState<Sort>("mix");
  const [view, setView] = React.useState<View>("cards");
  const [debouncedQ, setDebouncedQ] = React.useState("");

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 350);
    return () => clearTimeout(t);
  }, [q]);

  const { data: profiles = [], isLoading } = useProfiles(debouncedQ);

  const list = React.useMemo(() => {
    let l = [...profiles];
    if (sort === "location") l.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
    if (sort === "match") l.sort((a, b) => (b.matchPct ?? 0) - (a.matchPct ?? 0));
    return l;
  }, [profiles, sort]);

  return (
    <div>
      <header>
        <p className="eyebrow flex items-center gap-2">
          Lived Experience Network · B.L.E.S.S
          <span className="text-terracotta"><Sankofa size={14} /></span>
        </p>
        <h1 className="font-display text-4xl sm:text-5xl mt-2 leading-tight max-w-[20ch]">
          Find people who've been where you've been.
        </h1>
        <p className="text-ink2 mt-2 max-w-prose">
          Default sort is by location, then by how closely your context matches.
          Filters narrow the world. Search finds someone specific.
        </p>
      </header>

      <div className="mt-6 surface p-2.5 flex items-center gap-2">
        <Icon name="search" size={18} className="text-ink3 ml-1.5" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by alias, tag, or context — e.g. 'Yoruba', 'PTSD', 'Marcus'"
          className="flex-1 bg-transparent border-0 outline-none text-[15px] placeholder:text-ink3 px-1 py-1.5"
          inputMode="search"
        />
        {q && (
          <button onClick={() => setQ("")} className="text-ink3 hover:text-ink px-2">
            <Icon name="x" size={14} />
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink3">
          {isLoading ? "Loading…" : `${list.length} people · sorted by ${sort}`}
        </p>
        <div className="flex items-center gap-2">
          <SortPicker sort={sort} setSort={setSort} />
          <ViewPicker view={view} setView={setView} />
        </div>
      </div>

      {isLoading && (
        <div className="mt-10 text-center text-ink3">
          <div className="inline-block h-6 w-6 rounded-full border-2 border-terracotta border-t-transparent animate-spin" />
        </div>
      )}

      {!isLoading && view === "cards" && (
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
            <li key={p.id}>
              <Link href={`/profile/${p.id}`} className="block surface p-4 hover:shadow-soft transition">
                <header className="flex items-start gap-3">
                  <Avatar name={p.alias} color={p.avatarColor} size={48} src={(p as any).src} />
                  <div className="min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="font-display text-xl truncate">{p.alias}</h3>
                      <span className="text-[11px] font-mono text-terracotta whitespace-nowrap">{p.matchPct}% match</span>
                    </div>
                    <p className="text-xs text-ink3">{p.city}, {p.country}</p>
                  </div>
                </header>
                {p.prompt?.answer && (
                  <div className="mt-3">
                    <p className="eyebrow">{p.prompt.question}</p>
                    <p className="mt-1 text-[15px] text-ink2 leading-snug line-clamp-3">"{p.prompt.answer}"</p>
                  </div>
                )}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.experienceTags.slice(0, 3).map((tag: string) => <Chip key={tag}>{tag}</Chip>)}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {!isLoading && view === "list" && (
        <ul className="mt-5 surface divide-y divide-line">
          {list.map((p) => (
            <li key={p.id} className="px-4 py-3 flex items-center gap-3">
              <Avatar name={p.alias} color={p.avatarColor} size={40} src={(p as any).src} />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <strong>{p.alias}</strong>
                  <span className="text-xs text-ink3">{p.city}, {p.country}</span>
                </div>
                {p.prompt?.answer && <p className="text-sm text-ink2 line-clamp-1">"{p.prompt.answer}"</p>}
              </div>
              <span className="text-[11px] font-mono text-terracotta">{p.matchPct}%</span>
            </li>
          ))}
        </ul>
      )}

      {!isLoading && view === "mosaic" && (
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {list.map((p) => (
            <Link key={p.id} href={`/profile/${p.id}`}
              className="aspect-[3/4] rounded-lg p-4 flex flex-col justify-between text-bone overflow-hidden relative"
              style={{ background: p.avatarColor }}>
              <div className="absolute -bottom-3 -right-3 opacity-20"><Sankofa size={120} /></div>
              <div className="relative">
                <p className="font-mono text-[10px] tracking-widest opacity-70">{p.matchPct}% MATCH</p>
                <h3 className="font-display text-2xl mt-1 leading-tight">{p.alias}</h3>
              </div>
              <div className="relative">
                {p.prompt?.answer && <p className="text-xs opacity-80 line-clamp-3">"{p.prompt.answer}"</p>}
                <p className="mt-2 text-[10px] font-mono opacity-70 uppercase">{p.city}, {p.country}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!isLoading && list.length === 0 && (
        <div className="mt-12 mx-auto max-w-md text-center">
          <div className="text-terracotta inline-block mb-3"><Sankofa size={40} /></div>
          {debouncedQ ? (
            <>
              <p className="font-display text-xl">No matches for "{debouncedQ}"</p>
              <p className="text-ink3 text-sm mt-2">Try widening your search.</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setQ("")}>
                Clear search
              </Button>
            </>
          ) : (
            <>
              <p className="font-display text-xl">You're early.</p>
              <p className="text-ink3 text-sm mt-2 max-w-sm mx-auto">
                The network is still growing. As more members complete onboarding they'll appear here. Invite people who'd benefit, or come back soon.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SortPicker({ sort, setSort }: { sort: Sort; setSort: (s: Sort) => void }) {
  return (
    <div className="inline-flex rounded-md border border-line overflow-hidden text-sm">
      {(["mix", "location", "match"] as Sort[]).map((v) => (
        <button key={v} onClick={() => setSort(v)}
          className={`px-3 py-1.5 capitalize ${sort === v ? "bg-ink text-bone" : "bg-bone hover:bg-ink/5"}`}>
          {v}
        </button>
      ))}
    </div>
  );
}

function ViewPicker({ view, setView }: { view: View; setView: (v: View) => void }) {
  return (
    <div className="inline-flex rounded-md border border-line overflow-hidden text-sm">
      {(["cards", "list", "mosaic"] as View[]).map((v) => (
        <button key={v} onClick={() => setView(v)} aria-label={v}
          className={`px-2.5 py-1.5 capitalize text-xs ${view === v ? "bg-ink text-bone" : "bg-bone hover:bg-ink/5"}`}>
          {v}
        </button>
      ))}
    </div>
  );
}
