import { Dwennimmen } from "@/components/motifs/Motifs";
import { PeerSupporterSignupForm } from "@/components/academy/PeerSupporterSignupForm";
import { AcademyDemo } from "@/components/academy/AcademyDemo";

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

      {/* LIVE PREVIEW — full course demo */}
      <section className="mt-12 sm:mt-16">
        <div className="rounded-md bg-ochre/10 border border-ochre/30 px-4 py-3 mb-5 text-sm text-ink2">
          <strong className="text-ink">A taste of what's coming.</strong>{" "}
          The mockup below shows the kind of experience the Academy will offer
          — modules, lessons, reflection prompts, cohort discussion. None of
          the content is final; we're sharing it so you can feel the shape of
          the thing before we build it with you.
        </div>

        <AcademyDemo />
      </section>
    </div>
  );
}
