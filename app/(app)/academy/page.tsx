import { courses } from "@/lib/mock-data";
import { Motif, Dwennimmen } from "@/components/motifs/Motifs";
import { PeerSupporterSignupForm } from "@/components/academy/PeerSupporterSignupForm";

export default function AcademyPage() {
  return (
    <div>
      {/* CALLOUT — co-production pitch */}
      <section className="relative overflow-hidden surface p-6 sm:p-10">
        <div className="absolute -top-12 -right-12 opacity-10 text-terracotta">
          <Dwennimmen size={280} />
        </div>
        <div className="relative max-w-3xl">
          <p className="eyebrow flex items-center gap-2">
            Coming in v2 · Peer Support Academy
          </p>
          <h1 className="font-display text-4xl sm:text-5xl mt-3 leading-tight">
            We're building the Academy <em>with</em> you — not for you.
          </h1>
          <p className="text-ink2 mt-4 max-w-prose text-[15px] leading-relaxed">
            Most peer-support training was written by people who've never sat on
            the other side of it. We want to do this differently. If you have
            lived experience of mental health, or you're an accredited peer
            supporter trained elsewhere, we want to hear from you. Co-produce
            curriculum, shape modules, sit on the steering group.
          </p>
          <p className="text-ink2 mt-3 max-w-prose text-[15px] leading-relaxed">
            Sign up below and we'll be in touch — probably with a short call to
            understand what good training looks like to you.
          </p>
        </div>
      </section>

      {/* SIGNUP FORM */}
      <section className="mt-6">
        <PeerSupporterSignupForm />
      </section>

      {/* MOCKUP PREVIEW — clearly labelled */}
      <section className="mt-12 sm:mt-16">
        <div className="rounded-md bg-ochre/10 border border-ochre/30 px-4 py-3 mb-5 text-sm text-ink2">
          <strong className="text-ink">Preview only.</strong>{" "}
          What's below is a mockup of what the Academy will look like when it
          launches in v2. None of these courses are live yet — the cards stay
          here so you can get a feel for the experience while we build the real
          thing.
        </div>

        <header className="mt-6">
          <p className="eyebrow">What's coming · Dwennimmen</p>
          <h2 className="font-display text-3xl sm:text-4xl mt-2 leading-tight max-w-[20ch]">
            Train the way you wish you'd been trained.
          </h2>
          <p className="text-ink2 mt-2 max-w-prose">
            Accredited courses for people supporting people. Audit any course;
            certification will require enrolment and a peer-call review.
          </p>
        </header>

        <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 opacity-80">
          {courses.map((c) => (
            <li key={c.id}>
              <div className="block surface p-5 relative overflow-hidden">
                <div className="absolute -bottom-6 -right-6 opacity-10 text-terracotta">
                  <Motif name={c.motif as any} size={180} />
                </div>
                <div className="flex items-center justify-between">
                  <p className="eyebrow">
                    {c.id === "c1" ? "Foundation · 6 weeks" : c.id === "c2" ? "Critical · 4 weeks" : "Specialist · 5 weeks"}
                  </p>
                  <span className="text-[10px] font-mono uppercase tracking-widest bg-ink/10 text-ink2 rounded-pill px-2 py-0.5">
                    Coming soon
                  </span>
                </div>
                <h3 className="font-display text-2xl mt-2 leading-snug">{c.title}</h3>
                <p className="text-ink2 text-sm mt-2">{c.blurb}</p>
                <div className="mt-4 h-1.5 w-full rounded-pill bg-line">
                  <div className="h-1.5 rounded-pill bg-line" style={{ width: "0%" }} />
                </div>
                <p className="mt-2 text-xs text-ink3 font-mono">Locked · Academy v2</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
