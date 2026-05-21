"use client";

import * as React from "react";
import Link from "next/link";
import {
  useMyTribes,
  useDiscoverTribes,
  usePendingTribeRequests,
  useAcceptTribeRequest,
  useDeclineTribeRequest,
  useSendTribeRequest,
} from "@/lib/hooks/useTribes";
import { useSession } from "@/lib/hooks/useSession";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Motif } from "@/components/motifs/Motifs";
import { CreateTribeModal } from "@/components/tribes/CreateTribeModal";

export default function TribesPage() {
  const { userId } = useSession();
  const { data: tribes = [], isLoading } = useMyTribes();
  const { data: discover = [] } = useDiscoverTribes();
  const { data: requests = [] } = usePendingTribeRequests();
  const accept = useAcceptTribeRequest();
  const decline = useDeclineTribeRequest();
  const sendRequest = useSendTribeRequest();

  const [showCreate, setShowCreate] = React.useState(false);

  // Split requests into "things I need to respond to" vs "things I'm waiting on"
  const inbox = requests.filter((r: any) => {
    // I own the tribe (someone is asking to join it) OR I am the invitee
    const isInvitee = r.user_id === userId && r.initiated_by !== userId;
    const ownsTribe = r.tribes?.owner_id === userId && r.initiated_by !== userId;
    return isInvitee || ownsTribe;
  });

  const outbox = requests.filter((r: any) => r.initiated_by === userId);

  return (
    <div>
      <header className="flex flex-col gap-2">
        <p className="eyebrow">My Tribes · Bantu · Ubuntu</p>
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-4xl sm:text-5xl leading-tight max-w-[20ch]">
              You can belong to more than one circle.
            </h1>
            <p className="text-ink2 mt-2 max-w-prose">
              Each Tribe has its own Village — a private text forum and audio room.
              We cap suggested Tribe size at 30.
            </p>
          </div>
          <Button variant="primary" onClick={() => setShowCreate(true)}>
            + Start a Tribe
          </Button>
        </div>
      </header>

      {/* Things I need to respond to */}
      {inbox.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-2xl">Pending requests ({inbox.length})</h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {inbox.map((r: any) => {
              const owner = r.tribes?.owner_id === userId;
              return (
                <li key={r.id} className="surface p-4 flex items-start gap-3">
                  <Avatar
                    name={r.requester?.alias ?? "Member"}
                    color={r.requester?.avatar_color ?? "#b3563a"}
                    src={r.requester?.avatar_url}
                    size={44}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <strong className="truncate">{r.requester?.alias ?? "Member"}</strong>
                      <span className="text-xs text-ink3 whitespace-nowrap">
                        {owner ? "wants to join" : "invited you to"} <strong>{r.tribes?.name}</strong>
                      </span>
                    </div>
                    {r.requester?.city && (
                      <p className="text-xs text-ink3">{r.requester.city}, {r.requester.country}</p>
                    )}
                    {r.message && <p className="mt-1 text-sm text-ink2 italic">"{r.message}"</p>}
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => accept.mutate(r.id)}
                        disabled={accept.isPending}
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => decline.mutate(r.id)}
                        disabled={decline.isPending}
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* My tribes */}
      <section className="mt-10">
        <h2 className="font-display text-2xl">
          {isLoading ? "Your Tribes" : `Your Tribes (${tribes.length})`}
        </h2>
        {isLoading ? (
          <div className="mt-6 flex justify-center">
            <div className="h-6 w-6 rounded-full border-2 border-terracotta border-t-transparent animate-spin" />
          </div>
        ) : tribes.length === 0 ? (
          <div className="mt-4 surface p-8 text-center">
            <p className="font-display text-xl">No Tribes yet.</p>
            <p className="text-ink2 text-sm mt-2 max-w-sm mx-auto">
              Start your first Tribe to host a Village — a small private space for the people you choose.
            </p>
            <Button className="mt-4" onClick={() => setShowCreate(true)}>
              + Start a Tribe
            </Button>
          </div>
        ) : (
          <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tribes.map((t: any) => (
              <li key={t.id}>
                <Link
                  href={`/tribes/${t.id}`}
                  className="block aspect-[5/4] rounded-xl p-5 flex flex-col justify-between text-bone overflow-hidden relative hover:translate-y-[-2px] transition"
                  style={{ background: t.color ?? "#2f4a32" }}
                >
                  <div className="absolute -bottom-6 -right-6 opacity-25">
                    <Motif name={(t.motif ?? "Ubuntu") as any} size={180} />
                  </div>
                  <div className="relative">
                    <p className="font-mono text-[10px] tracking-widest opacity-70">TRIBE</p>
                    <h3 className="font-display text-3xl mt-1 leading-tight">{t.name}</h3>
                  </div>
                  <div className="relative">
                    {t.blurb && <p className="text-sm opacity-90 italic line-clamp-2">"{t.blurb}"</p>}
                    <p className="mt-3 text-[11px] font-mono opacity-80 uppercase">
                      Live in the village →
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Discover */}
      {discover.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-2xl">Discover Tribes</h2>
          <p className="text-ink3 text-sm mt-1">
            Spaces other members have built. Send a request to ask to join.
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {discover.map((t: any) => {
              const pending = outbox.some((r: any) => r.tribe_id === t.id);
              return (
                <li key={t.id} className="surface overflow-hidden">
                  <Link
                    href={`/tribes/${t.id}`}
                    className="block aspect-[5/3] p-4 text-bone relative overflow-hidden"
                    style={{ background: t.color ?? "#2f4a32" }}
                  >
                    <div className="absolute -bottom-6 -right-6 opacity-25">
                      <Motif name={(t.motif ?? "Ubuntu") as any} size={120} />
                    </div>
                    <div className="relative">
                      <h3 className="font-display text-xl leading-tight">{t.name}</h3>
                      {t.blurb && <p className="text-sm opacity-90 italic line-clamp-2 mt-1">"{t.blurb}"</p>}
                    </div>
                  </Link>
                  <div className="p-3 flex justify-end">
                    {pending ? (
                      <span className="text-xs font-mono text-ink3 uppercase">Request sent</span>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => sendRequest.mutate({ tribeId: t.id })}
                        disabled={sendRequest.isPending}
                      >
                        Request to join
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Outbox — invitations I've sent or join-requests I'm waiting on */}
      {outbox.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-xl">Waiting on a response ({outbox.length})</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {outbox.map((r: any) => (
              <li key={r.id} className="surface p-3 flex items-center gap-3 text-sm">
                <span className="text-ink3">→</span>
                <div className="flex-1 min-w-0">
                  <div className="truncate">
                    {r.user_id === userId
                      ? <>You asked to join <strong>{r.tribes?.name}</strong></>
                      : <>Invitation to <strong>{r.requester?.alias ?? "member"}</strong> for <strong>{r.tribes?.name}</strong></>
                    }
                  </div>
                </div>
                <span className="text-xs text-ink3 font-mono uppercase whitespace-nowrap">Pending</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <CreateTribeModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
