"use client";

import Link from "next/link";
import { useMyConnections } from "@/lib/hooks/useConnections";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Ubuntu } from "@/components/motifs/Motifs";
import { timeAgo } from "@/lib/utils";
import { useOnlineStatus } from "@/lib/hooks/useOnlineStatus";

export default function ConnectionsPage() {
  const { data: connections = [], isLoading } = useMyConnections();

  const accepted = connections.filter((c) => c.status === "accepted");
  const incoming = connections.filter((c) => c.status === "pending" && c.direction === "incoming");
  const outgoing = connections.filter((c) => c.status === "pending" && c.direction === "outgoing");

  return (
    <div>
      <header>
        <p className="eyebrow flex items-center gap-2">
          <span className="text-forest"><Ubuntu size={14} /></span> My Connections
        </p>
        <h1 className="font-display text-4xl sm:text-5xl mt-2 leading-tight max-w-[20ch]">
          The people you've chosen to be in your circle.
        </h1>
        <p className="text-ink2 mt-2 max-w-prose">
          Connections are 1:1 — separate from Tribes. Connect with members whose
          story echoes yours.
        </p>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="h-6 w-6 rounded-full border-2 border-terracotta border-t-transparent animate-spin" />
        </div>
      ) : (
        <>
          {/* Incoming requests */}
          {incoming.length > 0 && (
            <section className="mt-8">
              <h2 className="font-display text-2xl">Requests waiting for you ({incoming.length})</h2>
              <p className="text-ink3 text-sm mt-1">
                Open the request on the person's profile to accept or decline.
              </p>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {incoming.map((c) => (
                  <ConnectionCard key={c.id} c={c} />
                ))}
              </ul>
            </section>
          )}

          {/* Accepted connections */}
          <section className="mt-8">
            <h2 className="font-display text-2xl">
              {accepted.length === 0 ? "No connections yet" : `Your connections (${accepted.length})`}
            </h2>
            {accepted.length === 0 ? (
              <div className="mt-4 surface p-8 text-center">
                <p className="text-ink2 text-sm max-w-md mx-auto">
                  Browse the Lived Experience network and send a connection
                  request to anyone whose story you'd like to know better.
                </p>
                <Link href="/network">
                  <Button className="mt-4">Open the network</Button>
                </Link>
              </div>
            ) : (
              <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {accepted.map((c) => (
                  <ConnectionCard key={c.id} c={c} />
                ))}
              </ul>
            )}
          </section>

          {/* Outgoing pending */}
          {outgoing.length > 0 && (
            <section className="mt-10">
              <h2 className="font-display text-xl">Waiting on a response ({outgoing.length})</h2>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {outgoing.map((c) => (
                  <ConnectionCard key={c.id} c={c} muted />
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function ConnectionCard({ c, muted }: { c: any; muted?: boolean }) {
  const other = c.other;
  const online = useOnlineStatus(other?.last_seen_at);
  return (
    <li className={`surface p-4 ${muted ? "opacity-80" : ""}`}>
      <Link href={other?.id ? `/profile/${other.id}` : "#"} className="flex items-center gap-3">
        <Avatar
          name={other?.alias ?? "Member"}
          src={other?.avatar_url}
          size={48}
          online={online}
        />
        <div className="flex-1 min-w-0">
          <strong className="block truncate">{other?.alias ?? "Member"}</strong>
          <span className="text-xs text-ink3">
            {c.status === "accepted" ? `Connected · ${timeAgo(c.responded_at ?? c.created_at)}` : `Pending · ${timeAgo(c.created_at)}`}
          </span>
        </div>
      </Link>
    </li>
  );
}
