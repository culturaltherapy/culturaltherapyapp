"use client";

import * as React from "react";
import Link from "next/link";
import { profiles } from "@/lib/mock-data";
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

  const list = React.useMemo(() => {
    let l = [...profiles];
    if (q.trim()) {
      const t = q.toLowerCase();
      l = l.filter(
        (p) =>
          p.alias.toLowerCase().includes(t) ||
          p.descent.join(" ").toLowerCase().includes(t) ||
          p.experienceTags.join(" ").toLowerCase().includes(t) ||
          p.prompt.answer.toLowerCase().includes(t)
      );
    }
    if (sort === "location") l.sort((a, b) => a.distanceKm - b.distanceKm);
    if (sort === "match") l.sort((a, b) => b.matchPct - a.matchPct);
    return l;
  }, [q, sort]);

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

      {/* Search bar */}
      <div className="mt-6 surface p-2.5 flex items-center gap-2">
        <Icon name="search" size={18} className="text-ink3 ml-1.5" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by alias, tag, or context — e.g. 'Yoruba', 'PTSD', 'Marcus'"
          className="flex-1 bg-transparent border-0 outline-none text-[15px] placeholder:text-ink3 px-1 py-1.5"
          inputMode="search"
        />
        <button className="rounded-md border border-line bg-bone px-3 py-1.5 text-sm inline-flex items-center gap-1.5">
          <Icon name="filter" size={14} /> Filters
        </button>
      </div>

      {/* Toolbar */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink3">
          {list.length} people · sorted by {sort}, then context match
        </p>
        <div className="flex items-center gap-2">
          <SortPicker sort={sort} setSort={setSort} />
          <ViewPicker view={view} setView={setView} />
        </div>
      </div>

      {/* Results */}
      {view === "cards" && (
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
            <li key={p.id}>
              <Link
                href={`/profile/${p.id}`}
                className="block surface p-4 hover:shadow-soft transition"
              >
                <header className="flex items-start gap-3">
                  <Avatar name={p.alias} color={p.avatarColor} size={48} />
                  <div className="min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="font-display text-xl truncate">{p.alias}</h3>
                      <span className="text-[11px] font-mono text-terracotta whitespace-nowrap">
                        {p.matchPct}% match
                      </span>
                    </div>
                    <p className="text-xs text-ink3">
                      {p.city}, {p.country} · {p.distanceKm} km
                    </p>
                  </div>
                </header>
                <div className="mt-3">
                  <p className="eyebrow">{p.prompt.question}</p>
                  <p className="mt-1 text-[15px] text-ink2 leading-snug line-clamp-3">
                    "{p.prompt.answer}"
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.experienceTags.slice(0, 3).map((t) => (
                    <Chip key={t}>{t}</Chip>
                  ))}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {view === "list" && (
        <ul className="mt-5 surface divide-y divide-line">
          {list.map((p) => (
            <li key={p.id} className="px-4 py-3 flex items-center gap-3">
              <Avatar name={p.alias} color={p.avatarColor} size={40} />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <strong>{p.alias}</strong>
                  <span className="text-xs text-ink3">{p.city}, {p.country} · {p.distanceKm} km</span>
                </div>
                <p className="text-sm text-ink2 line-clamp-1">"{p.prompt.answer}"</p>
              </div>
              <span className="text-[11px] font-mono text-terracotta">{p.matchPct}%</span>
            </li>
          ))}
        </ul>
      )}

      {view === "mosaic" && (
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {list.map((p) => (
            <Link
              key={p.id}
              href={`/profile/${p.id}`}
              className="aspect-[3/4] rounded-lg p-4 flex flex-col justify-between text-bone overflow-hidden relative"
              style={{ background: p.avatarColor }}
            >
              <div className="absolute -bottom-3 -right-3 opacity-20">
                <Sankofa size={120} />
              </div>
              <div className="relative">
                <p className="font-mono text-[10px] tracking-widest opacity-70">
                  {p.matchPct}% MATCH
                </p>
                <h3 className="font-display text-2xl mt-1 leading-tight">{p.alias}</h3>
              </div>
              <div className="relative">
                <p className="text-xs opacity-80 line-clamp-3">"{p.prompt.answer}"</p>
                <p className="mt-2 text-[10px] font-mono opacity-70 uppercase">
                  {p.city}, {p.country}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {list.length === 0 && (
        <div className="mt-10 text-center text-ink3">
          <p>No matches. Try widening your search.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => setQ("")}>Clear</Button>
        </div>
      )}
    </div>
  );
}

function SortPicker({ sort, setSort }: { sort: "mix" | "location" | "match"; setSort: (s: any) => void }) {
  const opts = [
    { v: "mix", label: "Mix" },
    { v: "location", label: "Location" },
    { v: "match", label: "Match" }
  ] as const;
  return (
    <div className="inline-flex rounded-md border border-line overflow-hidden text-sm">
      {opts.map((o) => (
        <button
          key={o.v}
          onClick={() => setSort(o.v)}
          className={`px-3 py-1.5 ${sort === o.v ? "bg-ink text-bone" : "bg-bone hover:bg-ink/5"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ViewPicker({ view, setView }: { view: "cards" | "list" | "mosaic"; setView: (v: any) => void }) {
  const opts: { v: "cards" | "list" | "mosaic"; icon: any }[] = [
    { v: "cards", icon: "grid" },
    { v: "list", icon: "list" },
    { v: "mosaic", icon: "grid" }
  ];
  return (
    <div className="inline-flex rounded-md border border-line overflow-hidden text-sm">
      {opts.map((o) => (
        <button
          key={o.v}
          onClick={() => setView(o.v)}
          className={`px-2.5 py-1.5 ${view === o.v ? "bg-ink text-bone" : "bg-bone hover:bg-ink/5"}`}
          aria-label={o.v}
        >
          <Icon name={o.icon} size={16} />
        </button>
      ))}
    </div>
  );
}
