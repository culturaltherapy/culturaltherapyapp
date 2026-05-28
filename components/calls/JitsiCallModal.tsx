"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { roomUrl } from "@/lib/jitsi";
import { useUpdateCallStatus, type ModCall } from "@/lib/hooks/useModCalls";

type Props = {
  call: ModCall;
  /** Display name for the Jitsi participant (defaults to "Member"). */
  myAlias: string;
  onClose: () => void;
};

/**
 * Full-screen overlay that embeds the meet.jit.si room for an accepted
 * call. Renders a Hang up button that marks the call as 'ended' and
 * dismisses the overlay.
 */
export function JitsiCallModal({ call, myAlias, onClose }: Props) {
  const updateStatus = useUpdateCallStatus();
  const url = React.useMemo(
    () => roomUrl(call.room_name, {
      displayName: myAlias,
      withVideo: call.kind === "video",
      prejoinDisabled: true,
    }),
    [call.room_name, call.kind, myAlias],
  );

  async function hangUp() {
    try { await updateStatus.mutateAsync({ callId: call.id, status: "ended" }); }
    catch (_) {}
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] bg-ink flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b border-ink2 text-bone">
        <div className="flex items-center gap-2">
          <Icon name="shield" size={16} />
          <p className="text-sm">
            {call.kind === "video" ? "Video call" : "Voice call"} with{" "}
            <strong>{call.initiator?.alias ?? "moderator"}</strong>
          </p>
        </div>
        <Button size="sm" variant="danger" onClick={hangUp} disabled={updateStatus.isPending}>
          Hang up
        </Button>
      </header>
      <div className="flex-1 bg-ink">
        <iframe
          src={url}
          title="Jitsi Meet call"
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          className="w-full h-full border-0"
        />
      </div>
    </div>
  );
}
