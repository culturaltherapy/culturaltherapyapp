import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Dwennimmen } from "@/components/motifs/Motifs";

export default function CourseComingSoon() {
  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/academy" className="text-sm text-ink3 hover:text-ink">
        ← Back to Academy
      </Link>

      <section className="mt-4 surface p-8 sm:p-12 text-center relative overflow-hidden">
        <div className="absolute -top-12 -right-12 opacity-10 text-terracotta">
          <Dwennimmen size={260} />
        </div>
        <div className="relative">
          <p className="eyebrow">Academy · Coming in v2</p>
          <h1 className="font-display text-3xl sm:text-4xl mt-3 leading-tight max-w-[20ch] mx-auto">
            This lesson is part of the Academy we're co-producing.
          </h1>
          <p className="text-ink2 mt-4 max-w-md mx-auto text-[15px] leading-relaxed">
            We're not shipping placeholder course content. The Academy will be
            built with people who have lived experience and accredited peer
            supporters — so it's real when it lands.
          </p>
          <div className="mt-6 flex justify-center gap-3 flex-wrap">
            <Link href="/academy">
              <Button>Sign up to help build it</Button>
            </Link>
            <Link href="/home">
              <Button variant="outline">Back to home</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
