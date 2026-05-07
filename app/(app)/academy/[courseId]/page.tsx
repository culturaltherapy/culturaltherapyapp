"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { courses } from "@/lib/mock-data";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { EyeOfHorus } from "@/components/motifs/Motifs";

export default function CoursePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const course = courses.find((c) => c.id === courseId) ?? courses[0];
  const lessons = course.modules[0]?.lessons ?? [];
  const [activeId, setActiveId] = React.useState(
    lessons.find((l) => l.current)?.id ?? lessons[0]?.id
  );
  const lesson = lessons.find((l) => l.id === activeId) ?? lessons[0];

  return (
    <div>
      <Link href="/academy" className="text-sm text-ink3 hover:text-ink inline-flex items-center gap-1.5">
        <Icon name="arrowLeft" size={14} /> Back to Academy
      </Link>

      <div className="mt-3 grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Sidebar */}
        <aside>
          <p className="eyebrow">Foundation · 6 weeks</p>
          <h1 className="font-display text-3xl mt-1 leading-tight">{course.title}</h1>
          <div className="mt-3">
            <div className="flex items-baseline justify-between text-xs text-ink3 font-mono">
              <span>Progress</span>
              <span>{course.progress}%</span>
            </div>
            <div className="mt-1 h-1.5 w-full rounded-pill bg-line">
              <div className="h-1.5 rounded-pill bg-terracotta" style={{ width: `${course.progress}%` }} />
            </div>
          </div>

          <ul className="mt-5 space-y-1">
            {lessons.map((l) => {
              const active = l.id === activeId;
              return (
                <li key={l.id}>
                  <button
                    onClick={() => setActiveId(l.id)}
                    className={`w-full text-left rounded-md p-2.5 flex items-start gap-2.5 ${
                      active ? "bg-bone shadow-soft border border-line" : "hover:bg-ink/[.03]"
                    }`}
                  >
                    <span
                      className={`mt-0.5 h-5 w-5 shrink-0 rounded-full inline-flex items-center justify-center text-[11px] ${
                        l.done ? "bg-forest text-bone" : active ? "bg-terracotta text-bone" : "border border-line text-ink3"
                      }`}
                    >
                      {l.done ? "✓" : ""}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[14px] leading-snug">{l.title}</div>
                      <div className="text-[11px] text-ink3 font-mono">{l.min} min</div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Main */}
        {lesson && (
          <section>
            {/* Video frame */}
            <div className="aspect-[16/9] rounded-xl bg-ink relative overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 opacity-20 text-terracotta flex items-center justify-center">
                <EyeOfHorus size={220} />
              </div>
              <button className="relative h-16 w-16 rounded-full bg-terracotta text-bone flex items-center justify-center shadow-soft">
                <Icon name="play" size={28} />
              </button>
            </div>

            <div className="mt-5">
              <p className="eyebrow">Lesson · {lesson.min} min</p>
              <h2 className="font-display text-3xl mt-1 leading-tight">{lesson.title}</h2>
            </div>

            <nav className="mt-5 border-b border-line flex gap-5 text-sm text-ink3">
              <button className="py-2 text-ink border-b-2 border-terracotta -mb-px">Notes</button>
              <button className="py-2 hover:text-ink">Transcript</button>
              <button className="py-2 hover:text-ink">Discussion (12)</button>
              <button className="py-2 hover:text-ink">Reflection</button>
            </nav>

            <div className="prose prose-stone mt-4 max-w-prose text-ink2 text-[15px] leading-relaxed">
              <p>
                Some stories aren't withheld because we're afraid. They're
                withheld because we haven't found the listener who can hold
                them. This lesson is about that.
              </p>
              <p>
                We'll cover three things: how to recognise when your own story
                is asking to stay yours; how to share without performing; and
                how to listen for the moment a friend's story turns.
              </p>
              <ul>
                <li>Distinguish between context and confession.</li>
                <li>Notice your own bandwidth before you offer your story.</li>
                <li>Name what you don't share, instead of pretending it isn't there.</li>
              </ul>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <Button variant="outline">Save reflection</Button>
              <Button>Mark complete →</Button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
