"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import {
  useInitiateModCall,
  type ModCall,
  type ModCallKind,
} from "@/lib/hooks/useModCalls";
import { JitsiCallModal } from "./JitsiCallModal";
import { useSession } from "@/lib/hooks/useSession";

type Props = {
  recipientId: string;
  recipientAlias?: string | null;
  reportId?: string | null;
  /** Optional label that appears in the small button group header. */
  label?: string;
};

/**
 * The moderator-side trigger. Two buttons: voice + video. Clicking either
 * inserts a mod_calls row (status='ringing') and pops the Jitsi modal
 * immediately on the initiator's side. The recipient's IncomingCallModal
 * picks up the ring via Realtime.
 */
export function CallControls({ recipientId, recipientAlias, reportId, label }: Props) {
  const { profile } = useSession();
  const myAlias = profile?.alias ?? "Moderator";
  const initiate = useInitiateModCall();
  const [activeCall, setActiveCall] = React.useState<ModCall | null>(null);

  async function start(kind: ModCallKind) {
    try {
      const call = await initiate.mutateAsync({
        recipientId,
        reportId: reportId ?? null,
        kind,
      });
      // Open the Jitsi modal on our side immediately — we're already in the
      // room, waiting for the recipient to accept and join.
      setActiveCall(call);
    } catch (e: any) {
      alert(e?.message ?? "Couldn't start the call.");
    }
  }

  return (
    <>
      <div className="inline-flex flex-col gap-1">
        {label && (
          <p className="text-[10px] font-mono uppercase tracking-wider text-ink3">
            {label}{recipientAlias ? ` · ${recipientAlias}` : ""}
          </p>
        )}
        <div className="inline-flex gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={() => start("audio")}
            disabled={initiate.isPending}
            title="Voice call"
          >
            <Icon name="mic" size={14} /> Voice
          </Button>
          <Button
            size="sm"
            onClick={() => start("video")}
            disabled={initiate.isPending}
            title="Video call"
          >
            <Icon name="camera" size={14} /> Video
          </Button>
        </div>
      </div>

      {activeCall && (
        <JitsiCallModal
          call={activeCall}
          myAlias={myAlias}
          onClose={() => setActiveCall(null)}
        />
      )}
    </>
  );
}
