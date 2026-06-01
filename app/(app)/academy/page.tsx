import { Dwennimmen } from "@/components/motifs/Motifs";
import { PeerSupporterSignupForm } from "@/components/academy/PeerSupporterSignupForm";
import { CourseCard } from "@/components/academy/CourseCard";
import { ACADEMY_COURSES } from "@/lib/academy/foundations";

export default function AcademyPage() {
  return (
    <div>
      {/* COURSES — first real content in the Academy */}
      <section>
        <header>
          <p className="eyebrow flex items-center gap-2">
            Peer Support Academy
          </p>
          <h1 className="font-display text-4xl sm:text-5xl mt-2 leading-tight max-w-[22ch]">
            Courses you can start now.
          </h1>
          <p className="text-ink2 mt-2 max-w-prose">
            We're building these together with people who've been there. Some
            courses are still in progress — open them anyway and tell us what
            you'd change. Lessons open in a new tab on Teachable.
          </p>
        </header>

        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ACADEMY_COURSES.map((course) => (
            <li key={course.id}>
              <CourseCard course={course} />
            </li>
          ))}
        </ul>
      </section>

      {/* CALLOUT — co-production pitch */}
      <section className="mt-12 relative overflow-hidden surface p-6 sm:p-10">
        <div className="absolute -top-12 -right-12 opacity-10 text-terracotta">
          <Dwennimmen size={280} />
        </div>
        <div className="relative max-w-3xl">
          <p className="eyebrow flex items-center gap-2">
            Co-produce with us
          </p>
          <h2 className="font-display text-3xl sm:text-4xl mt-3 leading-tight">
            We're building the Academy <em>with</em> you — not for you.
          </h2>
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
    </div>
  );
}
