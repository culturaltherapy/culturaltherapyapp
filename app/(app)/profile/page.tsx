import Link from "next/link";
import { me, wallPosts } from "@/lib/mock-data";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { EyeOfHorus } from "@/components/motifs/Motifs";
import { timeAgo } from "@/lib/utils";

// "My profile — what others see" — public-style view of yourself.
export default function MyPublicProfile() {
  return (
    <div>
      {/* Hero */}
      <section className="surface p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute -top-8 -right-8 opacity-10 text-terracotta">
          <EyeOfHorus size={220} />
        </div>
        <div className="relative flex flex-col sm:flex-row gap-5 sm:items-end">
          <Avatar name={me.alias} color={me.avatarColor} size={96} />
          <div className="flex-1">
            <p className="eyebrow">My profile · what others see</p>
            <h1 className="font-display text-4xl mt-1 leading-tight">{me.alias}</h1>
            <p className="text-ink2 mt-1">
              {me.city}, {me.country} · {me.descent.join(" · ")}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {me.experienceTags.map((t) => (
                <Chip key={t}>{t}</Chip>
              ))}
              {me.idVerified && <Chip className="border-forest text-forest">ID verified</Chip>}
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/profile/edit"><Button variant="outline">Edit profile</Button></Link>
            <Button variant="primary">Send Tribe request</Button>
          </div>
        </div>
      </section>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6 mt-6">
        {/* Wall */}
        <section>
          <header className="flex items-baseline justify-between">
            <h2 className="font-display text-2xl">Wall</h2>
            <span className="text-xs text-ink3">{wallPosts.length} posts</span>
          </header>
          <ul className="mt-3 space-y-3">
            {wallPosts.map((p) => (
              <li key={p.id} className="surface p-4">
                <div className="flex items-baseline justify-between text-xs text-ink3">
                  <span>{timeAgo(p.createdAt)}</span>
                  <span className="font-mono uppercase">{p.visibility}</span>
                </div>
                <p className="mt-2 text-[15px] leading-relaxed">{p.body}</p>
                <div className="mt-3 flex items-center gap-4 text-xs text-ink3">
                  <span>♥ {p.likes}</span>
                  <span>💬 {p.comments}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Sidebar prompts */}
        <aside className="space-y-5">
          <div className="surface p-5">
            <p className="eyebrow">{me.prompt.question}</p>
            <p className="font-display text-xl mt-1 italic leading-snug">"{me.prompt.answer}"</p>
          </div>
          <div className="surface p-5">
            <h3 className="font-display text-lg">Languages</h3>
            <p className="text-ink2 mt-1 text-sm">English · Twi</p>
          </div>
          <div className="surface p-5">
            <h3 className="font-display text-lg">Open to</h3>
            <ul className="mt-2 text-sm text-ink2 space-y-1">
              <li>Tribe requests</li>
              <li>Direct messages</li>
              <li className="text-ink3">Calls & video — off</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
