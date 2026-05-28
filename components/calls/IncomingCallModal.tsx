"use client";

import * as React from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useSession } from "@/lib/hooks/useSession";
import {
  useIncomingCall,
  useUpdateCallStatus,
  type ModCall,
} from "@/lib/hooks/useModCalls";
import { JitsiCallModal } from "./JitsiCallModal";

const RING_TIMEOUT_MS = 30_000;

/**
 * Mounted once at the AppShell so it triggers on every page. Watches for
 * any ringing mod_call addressed to the signed-in user and surfaces the
 * full-screen ring modal. After accept, hands off to JitsiCallModal.
 */
export function IncomingCallModal() {
  const { userId, profile } = useSession();
  const myAlias = profile?.alias ?? "Member";
  const incoming = useIncomingCall(userId);
  const updateStatus = useUpdateCallStatus();

  // Once accepted, hold a reference to the accepted call so JitsiCallModal
  // stays mounted even when the incoming query result changes.
  const [activeCall, setActiveCall] = React.useState<ModCall | null>(null);

  // Auto-decline after RING_TIMEOUT_MS. The timer resets each time a new
  // ring arrives.
  React.useEffect(() => {
    if (!incoming || incoming.status !== "ringing") return;
    const elapsed = Date.now() - new Date(incoming.created_at).getTime();
    const remaining = Math.max(0, RING_TIMEOUT_MS - elapsed);
    const t = setTimeout(() => {
      updateStatus.mutate({ callId: incoming.id, status: "missed" });
    }, remaining);
    return () => clearTimeout(t);
  }, [incoming?.id, incoming?.status, incoming?.created_at]);

  async function accept() {
    if (!incoming) return;
    try {
      await updateStatus.mutateAsync({ callId: incoming.id, status: "accepted" });
      setActiveCall(incoming);
    } catch (e: any) {
      alert(e?.message ?? "Couldn't accept the call.");
    }
  }

  async function decline() {
    if (!incoming) return;
    try {
      await updateStatus.mutateAsync({ callId: incoming.id, status: "declined" });
    } catch (_) {}
  }

  if (activeCall) {
    return (
      <JitsiCallModal
        call={activeCall}
        myAlias={myAlias}
        onClose={() => setActiveCall(null)}
      />
    );
  }

  if (!incoming || incoming.status !== "ringing") return null;

  return (
    <div className="fixed inset-0 z-[60] bg-ink/85 backdrop-blur-md flex flex-col items-center justify-center text-bone px-6">
      <div className="absolute top-6 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-crisis text-bone text-xs font-mono uppercase tracking-wider">
        <Icon name="shield" size={12} /> Moderator
      </div>

      <div className="animate-pulse">
        <Avatar
          name={incoming.initiator?.alias ?? "Mod"}
          src={incoming.initiator?.avatar_url}
          size={160}
        />
      </div>

      <p className="mt-6 text-sm uppercase font-mono tracking-wider opacity-70">
        {incoming.kind === "video" ? "Incoming video call" : "Incoming voice call"}
      </p>
      <h2 className="font-display text-3xl mt-1">
        {incoming.initiator?.alias ?? "A moderator"}
      </h2>
      <p className="mt-2 text-sm opacity-80 max-w-md text-center">
        A Cultural Therapy moderator is calling you. They may have seen a
        report involving you, or want to check in. You can decline — but if
        you're safe, picking up helps them understand the situation.
      </p>

      <div className="mt-10 flex items-center gap-6">
        <button
          onClick={decline}
          disabled={updateStatus.isPending}
          aria-label="Decline call"
          className="flex flex-col items-center gap-1.5 text-bone hover:opacity-80 transition disabled:opacity-50"
        >
          <span className="h-16 w-16 rounded-full bg-crisis inline-flex items-center justify-center text-3xl">
            ✕
          </span>
          <span className="text-xs uppercase tracking-wider font-mono">Decline</span>
        </button>
        <button
          onClick={accept}
          disabled={updateStatus.isPending}
          aria-label="Accept call"
          className="flex flex-col items-center gap-1.5 text-bone hover:opacity-80 transition disabled:opacity-50"
        >
          <span className="h-16 w-16 rounded-full bg-forest inline-flex items-center justify-center text-2xl">
            <Icon name={incoming.kind === "video" ? "camera" : "mic"} size={28} />
          </span>
          <span className="text-xs uppercase tracking-wider font-mono">Accept</span>
        </button>
      </div>
    </div>
  );
}
