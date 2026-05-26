"use client";

import * as React from "react";
import Link from "next/link";
import { useSession } from "@/lib/hooks/useSession";
import { useUserPrompts } from "@/lib/hooks/useMyPrompts";
import { useWallPosts } from "@/lib/hooks/useWallPosts";
import { useProfileMedia } from "@/lib/hooks/useProfileMedia";
import { useMyConnections } from "@/lib/hooks/useConnections";
import { PostComposer } from "@/components/posts/PostComposer";
import { PostCard } from "@/components/posts/PostCard";
import { MediaGallery } from "@/components/media/MediaGallery";
import { ProfileTabs, useTabParam } from "@/components/profile/ProfileTabs";
import { PromptCard } from "@/components/profile/PromptCard";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { EyeOfHorus } from "@/components/motifs/Motifs";

export default function MyPublicProfile() {
  const { userId, profile, loading } = useSession();
  const { data: prompts = [], isLoading: promptsLoading } = useUserPrompts(userId);
  const { data: posts = [] } = useWallPosts(userId);
  const { data: media = [] } = useProfileMedia(userId);
  const { data: connections = [] } = useMyConnections();
  const [tab, setTab] = useTabParam("about");

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-6 w-6 rounded-full border-2 border-terracotta border-t-transparent animate-spin" />
      </div>
    );
  }

  const alias = profile?.alias ?? "Friend";
  const bio: string | null = (profile as any)?.bio ?? null;
  const city = profile?.city ?? "";
  const country = profile?.country ?? "";
  const descent: string[] = (profile as any)?.descent ?? [];
  const languages: string[] = (profile as any)?.languages ?? [];
  const languagesUnderstood: string[] = (profile as any)?.languages_understood ?? [];
  const tags: string[] = profile?.experience_tags ?? [];
  const verified = (profile as any)?.id_verified ?? false;
  const avatarColor = (profile as any)?.avatar_color ?? "var(--ct-rust)";
  const avatarUrl = (profile as any)?.avatar_url ?? null;
  const birthYear: number | null = (profile as any)?.birth_year ?? null;
  const socialLinks: { platform: string; url: string }[] =
    (profile as any)?.social_links ?? [];
  const age = birthYear ? new Date().getFullYear() - birthYear : null;

  const locationLine = [
    age ? `${age}` : null,
    [city, country].filter(Boolean).join(", "),
    descent.join(" · "),
  ].filter(Boolean).join(" · ");

  const acceptedConnections = connections.filter((c) => c.status === "accepted");

  return (
    <div>
      {/* Hero */}
      <section className="surface p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute -top-8 -right-8 opacity-10 text-terracotta">
          <EyeOfHorus size={220} />
        </div>
        <div className="relative flex flex-col sm:flex-row gap-5 sm:items-end">
          <Avatar name={alias} color={avatarColor} size={96} src={avatarUrl} />
          <div className="flex-1">
            <p className="eyebrow">My profile · what others see</p>
            <h1 className="font-display text-4xl mt-1 leading-tight">{alias}</h1>
            {locationLine && <p className="text-ink2 mt-1">{locationLine}</p>}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tags.map((t) => <Chip key={t}>{t}</Chip>)}
              {verified && <Chip className="border-forest text-forest">ID verified</Chip>}
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/profile/edit"><Button variant="outline">Edit profile</Button></Link>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <ProfileTabs
        active={tab}
        onChange={setTab}
        showConnections
        postCount={posts.length}
        connectionCount={acceptedConnections.length}
        mediaCount={media.length}
      />

      {/* Tab content */}
      <div className="grid lg:grid-cols-[1fr_320px] gap-6 mt-6">
        <section>
          {tab === "about" && (
            <AboutTab
              bio={bio}
              media={media}
              ownerId={userId!}
              canEdit
              prompts={prompts}
              promptsLoading={promptsLoading}
            />
          )}

          {tab === "wall" && (
            <div>
              <header className="flex items-baseline justify-between">
                <h2 className="font-display text-2xl">Wall</h2>
                <span className="text-xs text-ink3">
                  {posts.length} {posts.length === 1 ? "post" : "posts"}
                </span>
              </header>
              <div className="mt-3">
                <PostComposer />
              </div>
              {posts.length === 0 ? (
                <div className="mt-4 surface p-6 text-center">
                  <p className="text-ink2 text-sm">
                    Your wall is empty. Share a thought above — your Tribe will see it.
                  </p>
                </div>
              ) : (
                <ul className="mt-4 space-y-3">
                  {posts.map((p) => <PostCard key={p.id} post={p} canDelete />)}
                </ul>
              )}
            </div>
          )}

          {tab === "connections" && (
            <ConnectionsTab connections={acceptedConnections} />
          )}
        </section>

        {/* Sidebar (always visible across all tabs) */}
        <aside className="space-y-5">
          {/* Languages */}
          <div className="surface p-5">
            <h3 className="font-display text-lg">Languages</h3>
            {languages.length > 0 ? (
              <p className="text-ink2 mt-1 text-sm">
                <span className="text-ink3 text-xs">Speaks: </span>
                {languages.join(" · ")}
              </p>
            ) : (
              <p className="text-ink3 mt-1 text-sm">—</p>
            )}
            {languagesUnderstood.length > 0 && (
              <p className="text-ink2 mt-1 text-sm">
                <span className="text-ink3 text-xs">Understands: </span>
                {languagesUnderstood.join(" · ")}
              </p>
            )}
          </div>

          {/* Social links */}
          {socialLinks.length > 0 && (
            <div className="surface p-5">
              <h3 className="font-display text-lg">Find me elsewhere</h3>
              <ul className="mt-2 space-y-1.5 text-sm">
                {socialLinks.map((l, i) => (
                  <li key={i}>
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-terracotta hover:underline inline-flex items-center gap-1.5 break-all"
                    >
                      <span className="capitalize text-ink3 text-xs font-mono">{l.platform}</span>
                      <span>{l.url.replace(/^https?:\/\//, "")}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Open to */}
          <div className="surface p-5">
            <h3 className="font-display text-lg">Open to</h3>
            <ul className="mt-2 text-sm text-ink2 space-y-1">
              {(profile as any)?.accepts_tribe_requests !== false && <li>Tribe requests</li>}
              {(profile as any)?.accepts_dms !== false && <li>Direct messages</li>}
              {(profile as any)?.accepts_calls === true && <li>Voice calls (peer-supporter)</li>}
              {(profile as any)?.accepts_video === true && <li>Video calls (peer-supporter)</li>}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab content components
// ─────────────────────────────────────────────────────────────────────────────

function AboutTab({
  bio,
  media,
  ownerId,
  canEdit,
  prompts,
  promptsLoading,
}: {
  bio: string | null;
  media: any[];
  ownerId: string;
  canEdit: boolean;
  prompts: any[];
  promptsLoading: boolean;
}) {
  return (
    <div className="space-y-6">
      {bio ? (
        <div className="surface p-5 sm:p-6">
          <p className="eyebrow mb-2">About me</p>
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{bio}</p>
        </div>
      ) : canEdit ? (
        <div className="surface p-5 sm:p-6 text-center">
          <p className="text-ink2 text-sm">
            Your bio is empty.{" "}
            <Link href="/profile/edit" className="text-terracotta hover:underline">
              Add a few sentences
            </Link>{" "}
            so people get a feel for who you are.
          </p>
        </div>
      ) : null}

      <div>
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="font-display text-xl">Photos & videos</h3>
          {canEdit && (
            <Link href="/profile/edit?section=media" className="text-sm text-terracotta hover:underline">
              Manage
            </Link>
          )}
        </div>
        {media.length === 0 && canEdit ? (
          <div className="surface p-6 text-center">
            <p className="text-ink2 text-sm">
              No photos or videos yet.{" "}
              <Link href="/profile/edit?section=media" className="text-terracotta hover:underline">
                Add some
              </Link>{" "}
              to bring your profile to life.
            </p>
          </div>
        ) : (
          <MediaGallery items={media} ownerId={ownerId} canEdit={false} />
        )}
      </div>

      <div>
        <h3 className="font-display text-xl mb-3">Prompts</h3>
        {promptsLoading ? (
          <div className="surface p-5">
            <div className="h-3 w-24 bg-line rounded animate-pulse" />
            <div className="mt-2 h-6 bg-line rounded animate-pulse" />
          </div>
        ) : prompts.length > 0 ? (
          <ul className="grid sm:grid-cols-2 gap-3">
            {prompts.map((p: any) => (
              <PromptCard key={p.id} prompt={p} />
            ))}
          </ul>
        ) : canEdit ? (
          <div className="surface p-5">
            <p className="text-ink3 text-sm">
              You haven't answered any prompts yet.{" "}
              <Link href="/profile/edit" className="text-terracotta hover:underline">
                Add some
              </Link>.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ConnectionsTab({ connections }: { connections: any[] }) {
  if (connections.length === 0) {
    return (
      <div className="surface p-8 text-center">
        <p className="text-ink2 text-sm">You haven't accepted any connections yet.</p>
        <Link href="/network" className="mt-3 inline-block text-terracotta hover:underline">
          Browse the network
        </Link>
      </div>
    );
  }

  return (
    <ul className="grid sm:grid-cols-2 gap-3">
      {connections.map((c) => {
        const other = c.other;
        return (
          <li key={c.id} className="surface p-4">
            <Link href={other?.id ? `/profile/${other.id}` : "#"} className="flex items-center gap-3">
              <Avatar name={other?.alias ?? "Member"} src={other?.avatar_url} size={48} />
              <div className="min-w-0">
                <strong className="block truncate">{other?.alias ?? "Member"}</strong>
                <span className="text-xs text-ink3">Connected</span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
