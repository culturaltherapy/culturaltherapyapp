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
  /** Skip the "are you ready" prejoin/lobby screen. */
  prejoinDisabled?: boolean;
};

/** Build a meet.jit.si URL with sensible defaults pre-filled.
 *  All config flags + the displayName are passed via the URL hash, which
 *  is the format Jitsi's in-app config reader expects.
 */
export function roomUrl(roomName: string, opts: RoomOptions = {}): string {
  const flags: Record<string, string> = {
    // Skip the "Join meeting" lobby when prejoinDisabled is true.
    "config.prejoinPageEnabled": opts.prejoinDisabled ? "false" : "true",
    "config.startWithAudioMuted": "false",
    "config.startWithVideoMuted": opts.withVideo ? "false" : "true",
    "config.disableDeepLinking": "true",
  };
  if (opts.displayName) {
    // Jitsi expects the displayName quoted inside the URL hash.
    flags["userInfo.displayName"] = `"${opts.displayName.replace(/"/g, "")}"`;
  }
  const hash = Object.entries(flags)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
  return `https://meet.jit.si/${encodeURIComponent(roomName)}#${hash}`;
}
