"use client";

import * as React from "react";
import Link from "next/link";
import { me } from "@/lib/mock-data";
import { Icon } from "@/components/ui/Icon";

const sections = [
  { id: "identity", title: "Identity", note: "Alias, pronouns, country, city", status: "✓" },
  { id: "roots", title: "Roots", note: "Heritage and languages", status: "✓" },
  { id: "experience", title: "Lived experience", note: "Tags Tribes use to find you", status: "✓" },
  { id: "diagnosis", title: "Self-description", note: "Optional · private by default", status: "✓" },
  { id: "prompts", title: "Hinge-style prompts", note: "0 answered · 15 available", status: "TODO" },
  { id: "socials", title: "Social links", note: "0 linked", status: "TODO" },
  { id: "contact", title: "Contact preferences", note: "Tribe · DM", status: "✓" },
  { id: "wall", title: "Wall", note: "On · 3 post(s)", status: "✓" }
];

const gallery = [
  { id: "g1", caption: "Sunday market with my sister", kind: "PHOTO" },
  { id: "g2", caption: "The view that resets me", kind: "PHOTO" },
  { id: "g3", caption: "Two-minute talk about why I joined", kind: "VIDEO", dur: "2:14" },
  { id: "g4", caption: "Grandma's handwriting", kind: "PHOTO" }
];

export default function EditProfile() {
  const [wallOn, setWallOn] = React.useState(true);
  return (
    <div>
      <Link href="/profile" className="text-sm text-ink3 hover:text-ink inline-flex items-center gap-1.5">
        <Icon name="arrowLeft" size={14} /> Back to my profile
      </Link>
      <header className="mt-3">
        <p className="eyebrow">Editing profile</p>
        <h1 className="font-display text-4xl sm:text-5xl mt-1 leading-tight max-w-[20ch]">
          What do you want others to see?
        </h1>
        <p className="text-ink2 mt-2 max-w-prose">
          Each section has its own visibility. Edit one at a time — your changes
          are saved as you go.
        </p>
      </header>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {sections.map((s) => (
          <li key={s.id} className="surface p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-display text-xl">{s.title}</h2>
              <span className={`font-mono text-[11px] tracking-wider ${s.status === "TODO" ? "text-terracotta" : "text-forest"}`}>
                {s.status}
              </span>
            </div>
            <p className="text-ink2 text-sm mt-1">{s.note}</p>
            <button className="mt-3 inline-flex items-center gap-1 text-terracotta text-sm hover:underline">
              Edit <Icon name="arrow" size={12} />
            </button>
          </li>
        ))}
      </ul>

      {/* Gallery */}
      <section className="mt-10">
        <h2 className="font-display text-3xl">Gallery</h2>
        <ul className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {gallery.map((g) => (
            <li
              key={g.id}
              className="aspect-[3/4] rounded-lg surface relative overflow-hidden flex items-center justify-center text-ink3 group"
            >
              <button className="absolute top-2 right-2 h-6 w-6 rounded-full bg-ink/70 text-bone text-xs">×</button>
              <div className="text-center">
                <p className="text-[10px] font-mono tracking-widest">{g.kind}</p>
                {g.dur && <p className="text-xs mt-1">▶ {g.dur}</p>}
              </div>
              <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-ink/80 to-transparent text-bone text-xs">
                {g.caption}
              </div>
            </li>
          ))}
          <li className="aspect-[3/4] rounded-lg border-2 border-dashed border-line flex items-center justify-center text-ink3 hover:bg-ink/[.03] cursor-pointer">
            <div className="text-center">
              <Icon name="plus" size={20} className="mx-auto" />
              <p className="text-sm mt-1">Add photo or video</p>
            </div>
          </li>
        </ul>
        <p className="mt-3 text-xs text-ink3">Drag to reorder. Captions are required so context travels with the image.</p>
      </section>

      {/* Wall */}
      <section className="mt-10 flex items-center justify-between">
        <h2 className="font-display text-3xl">My wall</h2>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-ink3">Wall is</span>
          <span className="text-ink">{wallOn ? "on" : "off"}</span>
          <button
            onClick={() => setWallOn(!wallOn)}
            className={`relative h-7 w-12 rounded-pill transition ${wallOn ? "bg-terracotta" : "bg-line"}`}
            aria-label="Toggle wall"
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-bone transition ${wallOn ? "left-5" : "left-0.5"}`}
            />
          </button>
        </label>
      </section>
    </div>
  );
}
