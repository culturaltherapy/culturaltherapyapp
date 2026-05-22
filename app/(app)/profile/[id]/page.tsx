"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useProfile } from "@/lib/hooks/useProfile";
import { useUserPrompts } from "@/lib/hooks/useMyPrompts";
import { useWallPosts } from "@/lib/hooks/useWallPosts";
import { useProfileMedia } from "@/lib/hooks/useProfileMedia";
import { useSharesTribeWith } from "@/lib/hooks/useTribes";
import { PostCard } from "@/components/posts/PostCard";
import { MediaGallery } from "@/components/media/MediaGallery";
import { ProfileTabs, useTabParam } from "@/components/profile/ProfileTabs";
import { useSession } from "@/lib/hooks/useSession";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { EyeOfHorus } from "@/components/motifs/Motifs";
import { Icon } from "@/components/ui/Icon";
import { InviteToTribeModal } from "@/components/tribes/InviteToTribeModal";
import {
  useConnectionWith,
  useSendConnectionRequest,
  useAcceptConnection,
} from "@/lib/hooks/useConnections";

export default function ViewProfile() {
  const params = useParams<{ id: string }>();
  const { userId: currentUserId } = useSession();
  const { data: profile, isLoading } = useProfile(params.id);
  const { data: prompts = [] } = useUserPrompts(params.id);
  const { data: posts = [] } = useWallPosts(params.id);
  const { data: media = [] } = useProfileMedia(params.id);
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const isOwnProfile = !!currentUserId && currentUserId === params.id;
  const { data: connection } = useConnectionWith(isOwnProfile ? null : params.id);
  const { data: sharesTribe = false } = useSharesTribeWith(isOwnProfile ? null : params.id);
  const sendConnection = useSendConnectionRequest();
  const acceptConnection = useAcceptConnection();
  const [tab, setTab] = useTabParam("about");

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-6 w-6 rounded-full border-2 border-terracotta border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="py-20 text-center">
        <p className="font-display text-xl">Profile not found.</p>
        <Link href="/network" className="mt-3 inline-block text-terracotta hover:underline">
          Back to network
        </Link>
      </div>
    );
  }

  const alias = (profile as any).alias ?? "Member";
  const bio: string | null = (profile as any).bio ?? null;
  const city = (profile as any).city ?? "";
  const country = (profile as any).country ?? "";
  const descent: string[] = (profile as any).descent ?? [];
  const languages: string[] = (profile as any).languages ?? [];
  const languagesUnderstood: string[] = (profile as any).languages_understood ?? [];
  const tags: string[] = (profile as any).experience_tags ?? [];
  const verified = (profile as any).id_verified ?? false;
  const avatarColor = (profile as any).avatar_color ?? "#b3563a";
  const avatarUrl = (profile as any).avatar_url ?? null;
  const acceptsTribe = (profile as any).accepts_tribe_requests !== false;
  const acceptsDms = (profile as any).accepts_dms !== false;
  const acceptsCalls = (profile as any).accepts_calls === true;
  const acceptsVideo = (profile as any).accepts_video === true;
  const birthYear: number | null = (profile as any).birth_year ?? null;
  const socialLinks: { platform: string; url: string }[] =
    (profile as any).social_links ?? [];
  const connectionsVisibility: "public" | "tribe" | "private" =
    ((profile as any).connections_visibility as any) ?? "tribe";
  const age = birthYear ? new Date().getFullYear() - birthYear : null;

  const locationLine = [
    age ? `${age}` : null,
    [city, country].filter(Boolean).join(", "),
    descent.join(" · "),
  ].filter(Boolean).join(" · ");

  // Should the viewer see the Connections tab on this profile?
  const showConnectionsTab =
    connectionsVisibility === "public" ||
    (connectionsVisibility === "tribe" && sharesTribe);

  return (
    <div>
      <Link href="/network" className="text-sm text-ink3 hover:text-ink inline-flex items-center gap-1.5">
        <Icon name="arrowLeft" size={14} /> Back to network
      </Link>

      <section className="mt-3 surface p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute -top-8 -right-8 opacity-10 text-terracotta">
          <EyeOfHorus size={220} />
        </div>
        <div className="relative flex flex-col sm:flex-row gap-5 sm:items-end">
          <Avatar name={alias} color={avatarColor} size={96} src={avatarUrl} />
          <div className="flex-1">
            <h1 className="font-display text-4xl mt-1 leading-tight">{alias}</h1>
            {locationLine && <p className="text-ink2 mt-1">{locationLine}</p>}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tags.map((t) => <Chip key={t}>{t}</Chip>)}
              {verified && <Chip className="border-forest text-forest">ID verified</Chip>}
            </div>
          </div>
          {!isOwnProfile && currentUserId && (
            <div className="flex flex-col items-stretch sm:items-end gap-2">
              <ConnectAction
                connection={connection}
                pending={sendConnection.isPending || acceptConnection.isPending}
                onSend={async () => {
                  try { await sendConnection.mutateAsync({ recipientId: params.id }); } catch (_) {}
                }}
                onAccept={async () => {
                  if (connection?.id) {
                    try { await acceptConnection.mutateAsync(connection.id); } catch (_) {}
                  }
                }}
                alias={alias}
              />

              {acceptsTribe && (
                <button
                  onClick={() => setInviteOpen(true)}
                  className="text-xs text-terracotta hover:underline self-end"
                >
                  Invite {alias.split(" ")[0]} to one of your Tribes
                </button>
              )}

              <button
                className="text-xs text-ink3 cursor-not-allowed self-end"
                title="Direct messaging is coming soon"
                disabled
              >
                Message · coming soon
              </button>
            </div>
          )}
        </div>
      </section>

      <ProfileTabs
        active={tab}
        onChange={setTab}
        showConnections={showConnectionsTab}
        postCount={posts.length}
        mediaCount={media.length}
      />

      <section className="mt-6 grid lg:grid-cols-[1fr_320px] gap-6">
        <div>
          {tab === "about" && (
            <ViewAboutTab bio={bio} media={media} ownerId={params.id} prompts={prompts} alias={alias} />
          )}

          {tab === "wall" && (
            <div>
              <h2 className="font-display text-2xl mb-3">Wall</h2>
              {posts.length === 0 ? (
                <div className="surface p-6 text-center">
                  <p className="text-ink3 text-sm">{alias} hasn't posted anything visible to you.</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {posts.map((p) => (
                    <PostCard key={p.id} post={p} canDelete={false} />
                  ))}
                </ul>
              )}
            </div>
          )}

          {tab === "connections" && showConnectionsTab && (
            <ViewConnectionsTab profileId={params.id} alias={alias} />
          )}
        </div>

        <InviteToTribeModal
          open={inviteOpen}
          onClose={() => setInviteOpen(false)}
          targetUserId={params.id}
          targetAlias={alias}
        />

        <aside className="space-y-5">
          {(languages.length > 0 || languagesUnderstood.length > 0) && (
            <div className="surface p-5">
              <h3 className="font-display text-lg">Languages</h3>
              {languages.length > 0 && (
                <p className="text-ink2 mt-1 text-sm">
                  <span className="text-ink3 text-xs">Speaks: </span>
                  {languages.join(" · ")}
                </p>
              )}
              {languagesUnderstood.length > 0 && (
                <p className="text-ink2 mt-1 text-sm">
                  <span className="text-ink3 text-xs">Understands: </span>
                  {languagesUnderstood.join(" · ")}
                </p>
              )}
            </div>
          )}

          {socialLinks.length > 0 && (
            <div className="surface p-5">
              <h3 className="font-display text-lg">Find them elsewhere</h3>
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

          <div className="surface p-5">
            <h3 className="font-display text-lg">Open to</h3>
            <ul className="mt-2 text-sm text-ink2 space-y-1">
              {acceptsTribe && <li>Tribe requests</li>}
              {acceptsDms && <li>Direct messages</li>}
              {acceptsCalls && <li>Voice calls (peer-supporter)</li>}
              {acceptsVideo && <li>Video calls (peer-supporter)</li>}
              {!acceptsCalls && !acceptsVideo && (
                <li className="text-ink3">Calls & video — off</li>
              )}
            </ul>
          </div>
        </aside>
      </section>
    </div>
  );
}

function ViewAboutTab({ bio, media, ownerId, prompts, alias }: {
  bio: string | null;
  media: any[];
  ownerId: string;
  prompts: any[];
  alias: string;
}) {
  return (
    <div className="space-y-6">
      {bio ? (
        <div className="surface p-5 sm:p-6">
          <p className="eyebrow mb-2">About {alias.split(" ")[0]}</p>
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{bio}</p>
        </div>
      ) : (
        <div className="surface p-5 text-center text-ink3 text-sm">
          {alias} hasn't written a bio yet.
        </div>
      )}

      {media.length > 0 && (
        <div>
          <h3 className="font-display text-xl mb-3">Photos & videos</h3>
          <MediaGallery items={media} ownerId={ownerId} canEdit={false} />
        </div>
      )}

      {prompts.length > 0 && (
        <div>
          <h3 className="font-display text-xl mb-3">Prompts</h3>
          <ul className="grid sm:grid-cols-2 gap-3">
            {prompts.map((p: any) => (
              <li key={p.id} className="surface p-5">
                <p className="eyebrow">{p.question}</p>
                <p className="font-display text-lg mt-1 italic leading-snug">"{p.answer}"</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ViewConnectionsTab({ profileId, alias }: { profileId: string; alias: string }) {
  // For chunk 2 we just show a placeholder note — viewing other users'
  // connection lists isn't wired yet because connections RLS only exposes
  // rows involving the viewer themselves. Chunk 3 expands this.
  return (
    <div className="surface p-6 text-center">
      <p className="text-ink2 text-sm">
        {alias}'s connections will appear here. (Connection list rendering for
        other users is being finished — coming next push.)
      </p>
    </div>
  );
}

function ConnectAction({
  connection, onSend, onAccept, pending, alias,
}: {
  connection: any;
  onSend: () => void;
  onAccept: () => void;
  pending: boolean;
  alias: string;
}) {
  if (!connection) {
    return (
      <Button onClick={onSend} disabled={pending}>
        {pending ? "Sending…" : `Connect with ${alias.split(" ")[0]}`}
      </Button>
    );
  }

  if (connection.status === "accepted") {
    return (
      <Button variant="outline" disabled>
        ✓ Connected
      </Button>
    );
  }

  if (connection.status === "pending") {
    if (connection.direction === "incoming") {
      return (
        <Button onClick={onAccept} disabled={pending}>
          {pending ? "Accepting…" : `Accept ${alias.split(" ")[0]}'s request`}
        </Button>
      );
    }
    return (
      <Button variant="outline" disabled>
        ✓ Request sent
      </Button>
    );
  }

  return (
    <Button onClick={onSend} disabled={pending}>
      {pending ? "Sending…" : `Connect with ${alias.split(" ")[0]}`}
    </Button>
  );
}
