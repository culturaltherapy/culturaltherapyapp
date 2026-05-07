import Link from "next/link";
import { courses } from "@/lib/mock-data";
import { Motif } from "@/components/motifs/Motifs";
import { Button } from "@/components/ui/Button";

export default function AcademyPage() {
  return (
    <div>
      <header>
        <p className="eyebrow">Peer Support Academy · Dwennimmen</p>
        <h1 className="font-display text-4xl sm:text-5xl mt-2 leading-tight max-w-[20ch]">
          Train the way you wish you'd been trained.
        </h1>
        <p className="text-ink2 mt-2 max-w-prose">
          Accredited courses for people supporting people. You can audit any
          course; certification requires an enrolment and a peer-call review.
        </p>
      </header>

      <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((c) => (
          <li key={c.id}>
            <Link
              href={`/academy/${c.id}`}
              className="block surface p-5 hover:shadow-soft transition relative overflow-hidden"
            >
              <div className="absolute -bottom-6 -right-6 opacity-10 text-terracotta">
                <Motif name={c.motif as any} size={180} />
              </div>
              <p className="eyebrow">{c.id === "c1" ? "Foundation · 6 weeks" : c.id === "c2" ? "Critical · 4 weeks" : "Specialist · 5 weeks"}</p>
              <h3 className="font-display text-2xl mt-2 leading-snug">{c.title}</h3>
              <p className="text-ink2 text-sm mt-2">{c.blurb}</p>
              <div className="mt-4 h-1.5 w-full rounded-pill bg-line">
                <div className="h-1.5 rounded-pill bg-terracotta" style={{ width: `${c.progress}%` }} />
              </div>
              <p className="mt-2 text-xs text-ink3 font-mono">{c.progress}% complete</p>
              <div className="mt-3">
                <Button size="sm" variant={c.progress > 0 ? "primary" : "outline"}>
                  {c.progress > 0 ? "Continue" : "Start course"}
                </Button>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
