// Helpers for embedding a Jitsi Meet room (https://meet.jit.si — the free
// public instance). We use a long, unguessable room name so the URL itself
// is the access token; anyone with it can join.

/** Generates a long, random room name that's prefixed so it shows up clearly
 *  in any Jitsi-side logs. Pure browser-side — uses crypto.randomUUID(). */
export function newRoomName(): string {
  const uuid = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  // Strip dashes so the URL stays compact; prefix so it's clearly ours.
  return `CT-${uuid.replace(/-/g, "")}`;
}

type RoomOptions = {
  /** Display name the participant joins under (e.g. their alias). */
  displayName?: string;
  /** When true, video is on by default; otherwise audio-only. */
  withVideo?: boolean;
  /** Skip the "are you ready" lobby screen. */
  prejoinDisabled?: boolean;
};

/** Build a meet.jit.si URL with sensible defaults pre-filled. */
export function roomUrl(roomName: string, opts: RoomOptions = {}): string {
  const params = new URLSearchParams();
  if (opts.displayName) params.set("userInfo.displayName", opts.displayName);
  // # is required by Jitsi to pass these as in-app config flags
  const hashParams = new URLSearchParams();
  hashParams.set("config.prejoinPageEnabled", String(!opts.prejoinDisabled === false));
  hashParams.set("config.startWithAudioMuted", "false");
  hashParams.set("config.startWithVideoMuted", String(!opts.withVideo));
  hashParams.set("config.disableDeepLinking", "true");
  return `https://meet.jit.si/${encodeURIComponent(roomName)}#${hashParams.toString()}`;
}
