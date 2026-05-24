"use client";

import * as React from "react";
import { Sankofa, Dwennimmen, EyeOfHorus } from "@/components/motifs/Motifs";
import { Avatar } from "@/components/ui/Avatar";

// Static mock data — all decorative, no interactions wire to anything real.
const COURSE = {
  title: "Foundations of Lived Experience Practice",
  blurb: "A six-week introduction to peer support that doesn't try to fix.",
  instructor: { name: "Adwoa Mensah", role: "Lead facilitator · Lived experience" },
  weeks: 6,
  enrolled: 142,
  rating: 4.8,
  modules: [
    {
      title: "Module 1 · Listening that doesn't fix",
      lessons: [
        { title: "Listening as a practice",     duration: "12 min", status: "done" },
        { title: "Mirroring vs solving",        duration: "18 min", status: "current" },
        { title: "Holding silence",             duration: "9 min",  status: "locked" },
      ],
    },
    {
      title: "Module 2 · Scope and ethics",
      lessons: [
        { title: "Knowing your limits",         duration: "14 min", status: "locked" },
        { title: "When to escalate",            duration: "11 min", status: "locked" },
        { title: "Confidentiality in practice", duration: "16 min", status: "locked" },
      ],
    },
    {
      title: "Module 3 · Culturally-rooted care",
      lessons: [
        { title: "What 'culture' means in care", duration: "20 min", status: "locked" },
        { title: "Family dynamics across diaspora", duration: "22 min", status: "locked" },
        { title: "Naming stigma without judging it", duration: "15 min", status: "locked" },
      ],
    },
    {
      title: "Module 4 · Holding hard conversations",
      lessons: [
        { title: "Distress signals", duration: "18 min", status: "locked" },
        { title: "Crisis vs urgent vs important", duration: "13 min", status: "locked" },
      ],
    },
  ],
};

export function AcademyDemo() {
  const [openModule, setOpenModule] = React.useState(0);

  // Compute progress from done lessons
  const totalLessons = COURSE.modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const doneLessons = COURSE.modules.reduce(
    (sum, m) => sum + m.lessons.filter((l) => l.status === "done").length,
    0,
  );
  const progress = Math.round((doneLessons / totalLessons) * 100);

  return (
    <div className="rounded-2xl border border-line bg-bone shadow-soft overflow-hidden">
      {/* "Demo" header band */}
      <div className="bg-ink text-bone/90 px-5 py-2.5 text-xs font-mono uppercase tracking-widest flex items-center justify-between">
        <span>Live preview · Academy v2 mockup</span>
        <span className="hidden sm:inline opacity-60">For illustration only</span>
      </div>

      {/* Course hero */}
      <div className="relative overflow-hidden p-6 sm:p-8 border-b border-line">
        <div className="absolute -top-8 -right-8 opacity-10 text-terracotta">
          <Dwennimmen size={220} />
        </div>
        <div className="relative">
          <p className="eyebrow">Foundation · {COURSE.weeks} weeks</p>
          <h2 className="font-display text-3xl sm:text-4xl mt-2 leading-tight max-w-[24ch]">
            {COURSE.title}
          </h2>
          <p className="text-ink2 mt-2 max-w-prose">{COURSE.blurb}</p>

          <div className="mt-5 flex items-center gap-4">
            <Avatar name={COURSE.instructor.name} color="var(--ct-rust)" size={44} />
            <div>
              <strong className="text-sm">{COURSE.instructor.name}</strong>
              <p className="text-xs text-ink3">{COURSE.instructor.role}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-5 text-sm text-ink3">
            <span><strong className="text-ink">{COURSE.enrolled}</strong> enrolled</span>
            <span>★ <strong className="text-ink">{COURSE.rating}</strong></span>
            <span><strong className="text-ink">{progress}%</strong> complete</span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-pill bg-line max-w-md">
            <div className="h-1.5 rounded-pill bg-terracotta" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* Two-column lesson layout */}
      <div className="grid lg:grid-cols-[280px_1fr]">
        {/* Module sidebar */}
        <aside className="border-b lg:border-b-0 lg:border-r border-line p-4">
          <p className="eyebrow mb-3">Course outline</p>
          <ul className="space-y-1">
            {COURSE.modules.map((m, i) => {
              const isOpen = openModule === i;
              return (
                <li key={i}>
                  <button
                    onClick={() => setOpenModule(isOpen ? -1 : i)}
                    className={`w-full text-left rounded-md p-2.5 text-sm transition ${
                      isOpen ? "bg-ink/[.04]" : "hover:bg-ink/[.03]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <strong className="text-[13px]">{m.title}</strong>
                      <span className="text-ink3 text-xs">{isOpen ? "▾" : "▸"}</span>
                    </div>
                  </button>
                  {isOpen && (
                    <ul className="mt-1 mb-2 ml-2 space-y-0.5">
                      {m.lessons.map((l, j) => {
                        const dot = l.status === "done" ? "✓" : l.status === "current" ? "▶" : "○";
                        const cls =
                          l.status === "done" ? "text-forest" :
                          l.status === "current" ? "text-terracotta font-medium" :
                          "text-ink3";
                        return (
                          <li key={j} className={`text-xs flex items-baseline justify-between gap-2 px-2.5 py-1.5 rounded ${cls}`}>
                            <span className="truncate flex items-baseline gap-1.5">
                              <span aria-hidden>{dot}</span>
                              {l.title}
                            </span>
                            <span className="text-ink3 font-mono text-[10px]">{l.duration}</span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Main lesson area */}
        <main className="p-5 sm:p-6">
          {/* Video placeholder */}
          <div className="aspect-video rounded-lg overflow-hidden bg-ink relative flex items-center justify-center">
            <div className="text-bone/80 text-center">
              <div className="h-14 w-14 rounded-full bg-bone/10 mx-auto flex items-center justify-center">
                <span className="text-2xl ml-1" aria-hidden>▶</span>
              </div>
              <p className="text-xs font-mono uppercase tracking-widest mt-3 opacity-70">
                Lesson video · 18:24
              </p>
            </div>
            {/* Subtle motif behind */}
            <div className="absolute -bottom-6 -right-6 opacity-10 text-bone">
              <EyeOfHorus size={140} />
            </div>
          </div>

          {/* Lesson body */}
          <div className="mt-5">
            <p className="eyebrow">Module 1 · Lesson 2</p>
            <h3 className="font-display text-2xl mt-1">Mirroring vs solving</h3>
            <p className="text-ink2 text-[15px] leading-relaxed mt-3 max-w-prose">
              The instinct to fix is human — but in peer support, sitting <em>with</em> someone is
              often more powerful than offering a solution. In this lesson we break down the
              difference between <strong>mirroring</strong> (reflecting what someone said back to them so they
              feel heard) and <strong>solving</strong> (jumping to advice). Both have a place. Knowing which
              the moment is asking for is the craft.
            </p>

            <details className="mt-4 group">
              <summary className="cursor-pointer text-sm text-terracotta hover:underline">
                Show transcript
              </summary>
              <div className="mt-3 text-sm text-ink2 leading-relaxed space-y-3 max-w-prose">
                <p>
                  <strong>[00:00]</strong> When someone tells you something hard, your first move
                  matters. Not because there's a perfect response — there isn't — but because
                  what you do first shapes what happens next.
                </p>
                <p>
                  <strong>[01:24]</strong> Mirroring sounds simple. "It sounds like you've been
                  carrying that on your own for a while." But it lands different than "Have you
                  tried meditation?" Both are well-meant. One opens a door. The other closes it.
                </p>
                <p>
                  <strong>[02:48]</strong> Try this: next time someone shares something hard with
                  you, before saying anything, mirror back the feeling underneath the words…
                </p>
                <p className="text-ink3 italic">[Transcript continues — full text in the v2 launch.]</p>
              </div>
            </details>

            {/* Action bar */}
            <div className="mt-6 pt-5 border-t border-line flex flex-wrap items-center justify-between gap-3">
              <button className="text-sm text-ink3 hover:text-ink inline-flex items-center gap-1.5">
                ← Previous lesson
              </button>
              <div className="flex items-center gap-2">
                <button className="rounded-md border border-line bg-bone px-3 py-1.5 text-sm hover:bg-ink/5">
                  Save notes
                </button>
                <button className="rounded-md bg-ink text-bone px-3 py-1.5 text-sm hover:opacity-90">
                  Mark complete →
                </button>
              </div>
            </div>

            {/* Reflection prompt */}
            <div className="mt-6 rounded-md bg-forest/5 border border-forest/20 p-4">
              <p className="eyebrow text-forest">Reflection · 2 min</p>
              <p className="text-[15px] mt-2 text-ink">
                Think of the last time someone tried to fix something you said. How did it feel?
                Write 2–3 sentences below.
              </p>
              <textarea
                disabled
                rows={2}
                placeholder="Your reflection (saved privately to your Academy notes)…"
                className="mt-3 w-full rounded-md border border-line bg-bone/60 px-3 py-2 text-sm placeholder:text-ink3 resize-none cursor-not-allowed"
              />
            </div>

            {/* Discussion preview */}
            <div className="mt-6">
              <p className="eyebrow mb-2">Cohort discussion</p>
              <ul className="space-y-3">
                <li className="surface p-3">
                  <div className="flex items-center gap-2 text-xs text-ink3">
                    <Avatar name="Marcus O" color="#2f4a32" size={22} />
                    <strong className="text-ink">Marcus O.</strong>
                    <span>· 2h</span>
                  </div>
                  <p className="text-sm mt-1.5">
                    The "solving" reflex is so wired in for me. I caught myself doing it three
                    times yesterday — and twice the person actually wanted the silence, not the
                    advice. Wild.
                  </p>
                </li>
                <li className="surface p-3">
                  <div className="flex items-center gap-2 text-xs text-ink3">
                    <Avatar name="Tendai R" color="#b3563a" size={22} />
                    <strong className="text-ink">Tendai R.</strong>
                    <span>· 5h</span>
                  </div>
                  <p className="text-sm mt-1.5">
                    Reading this back-to-back with the &quot;holding silence&quot; lesson is going
                    to be a lot for me. Bring it on.
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </main>
      </div>

      {/* Footer band */}
      <div className="bg-parchment/60 border-t border-line px-5 py-3 flex items-center justify-between gap-3 text-xs text-ink3">
        <span className="inline-flex items-center gap-1.5">
          <Sankofa size={14} /> Co-produced with peer supporters & lived-experience practitioners
        </span>
        <span className="font-mono">Demo · Academy v2 · TBD</span>
      </div>
    </div>
  );
}
