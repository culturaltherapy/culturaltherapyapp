import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import { Sankofa, Ubuntu, Dwennimmen, EyeOfHorus } from "@/components/motifs/Motifs";
import { Button } from "@/components/ui/Button";

export default function Landing() {
  return (
    <div className="min-h-dvh bg-parchment text-ink">
      {/* Top */}
      <header className="border-b border-line">
        <div className="mx-auto max-w-shell px-4 sm:px-6 py-4 flex items-center justify-between">
          <Logo size={28} />
          <nav className="flex items-center gap-2">
            <Link
              href="/signin"
              className="px-3 py-2 text-sm text-ink2 hover:text-ink"
            >
              Sign in
            </Link>
            <Link href="/onboarding">
              <Button variant="primary" size="sm">
                Join
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute -top-12 -right-16 text-terracotta">
          <Sankofa size={420} ambient />
        </div>
        <div className="absolute -bottom-20 -left-20 text-forest">
          <Ubuntu size={360} ambient />
        </div>

        <div className="relative mx-auto max-w-shell px-4 sm:px-6 pt-20 pb-24 sm:pt-28 sm:pb-32">
          <p className="eyebrow">B.L.E.S.S · Building Lived Experience Support Systems</p>
          <h1 className="font-display text-[40px] sm:text-6xl lg:text-7xl mt-3 leading-[1.05] max-w-[14ch]">
            Find people who've been where you've been.
          </h1>
          <p className="mt-5 text-ink2 text-lg max-w-prose">
            Cultural Therapy is a peer network for the diaspora. Build a Tribe.
            Host conversations in your Village. Train as a peer supporter.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/onboarding">
              <Button variant="primary" size="lg">
                Start onboarding
              </Button>
            </Link>
            <Link href="/signin">
              <Button variant="outline" size="lg">
                I already have an account
              </Button>
            </Link>
          </div>

          <p className="mt-5 text-xs text-ink3">
            ID-verified members · Crisis support on every screen · Moderators on call 24/7
          </p>
        </div>
      </section>

      {/* Three pillars */}
      <section className="border-t border-line bg-bone/40">
        <div className="mx-auto max-w-shell px-4 sm:px-6 py-16 grid gap-8 sm:grid-cols-3">
          <Pillar
            icon={<Sankofa size={48} />}
            kicker="Lived Experience Network"
            title="People who get it."
            body="Discovery built around cultural and lived-experience match. Not friends. Tribe."
          />
          <Pillar
            icon={<Dwennimmen size={48} />}
            kicker="Peer Support Academy"
            title="Train the way you wish you'd been trained."
            body="Accredited courses on listening, scope, ethics, and culturally-rooted care."
          />
          <Pillar
            icon={<EyeOfHorus size={48} />}
            kicker="Discussions"
            title="Spaces that are moderated by people who've been there."
            body="Forums and live rooms by topic. Crisis escalation is one tap."
          />
        </div>
      </section>

      {/* Foot */}
      <footer className="border-t border-line">
        <div className="mx-auto max-w-shell px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="text-sm text-ink3">
            © {new Date().getFullYear()} Cultural Therapy · B.L.E.S.S
          </div>
          <div className="flex gap-4 text-sm text-ink3">
            <a href="#" className="hover:text-ink">Code of conduct</a>
            <a href="#" className="hover:text-ink">Privacy</a>
            <a href="#" className="hover:text-ink">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Pillar({
  icon,
  kicker,
  title,
  body
}: {
  icon: React.ReactNode;
  kicker: string;
  title: string;
  body: string;
}) {
  return (
    <article className="surface p-6">
      <div className="text-terracotta">{icon}</div>
      <p className="eyebrow mt-3">{kicker}</p>
      <h3 className="font-display text-2xl mt-1">{title}</h3>
      <p className="text-ink2 mt-2 text-[15px] leading-relaxed">{body}</p>
    </article>
  );
}
