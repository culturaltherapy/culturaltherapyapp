"use client";

import { useSession } from "@/lib/hooks/useSession";

/**
 * True when the signed-in user has `profiles.is_moderator = true`.
 * Returns false while the session is loading.
 */
export function useIsModerator(): boolean {
  const { profile } = useSession();
  return (profile as any)?.is_moderator === true;
}
