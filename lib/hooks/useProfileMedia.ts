"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export const MAX_MEDIA_ITEMS = 20;

export type ProfileMedia = {
  id: string;
  owner_id: string;
  url: string;
  kind: "image" | "video";
  caption: string | null;
  sort_order: number;
  flagged: boolean;
  created_at: string;
};

export function useProfileMedia(ownerId: string | null | undefined) {
  return useQuery({
    queryKey: ["profile_media", ownerId],
    enabled: !!ownerId,
    queryFn: async (): Promise<ProfileMedia[]> => {
      const supa = getSupabaseBrowser();
      if (!supa || !ownerId) return [];

      const { data, error } = await (supa as any)
        .from("profile_media")
        .select("*")
        .eq("owner_id", ownerId)
        .eq("flagged", false)
        .order("sort_order", { ascending: true });

      if (error) {
        console.error("useProfileMedia error:", error.message);
        return [];
      }
      return (data ?? []) as ProfileMedia[];
    },
  });
}

export function useUploadMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, caption }: { file: File; caption?: string }) => {
      const supa = getSupabaseBrowser();
      if (!supa) throw new Error("Not configured");
      const { data: { session } } = await supa.auth.getSession();
      if (!session) throw new Error("Not signed in");

      const userId = session.user.id;
      const kind: "image" | "video" = file.type.startsWith("video/") ? "video" : "image";
      const ext = (file.name.split(".").pop() || (kind === "video" ? "mp4" : "jpg"))
        .toLowerCase().replace(/[^a-z0-9]/g, "");
      const safeExt = ext || (kind === "video" ? "mp4" : "jpg");
      // Unique path so re-uploads with the same name don't collide
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`;

      const { error: uploadError } = await supa.storage
        .from("profile-media")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;

      const { data: pub } = supa.storage.from("profile-media").getPublicUrl(path);
      const publicUrl = pub.publicUrl;

      // Append to end of gallery
      const { data: existing } = await (supa as any)
        .from("profile_media")
        .select("sort_order")
        .eq("owner_id", userId)
        .order("sort_order", { ascending: false })
        .limit(1);
      const nextOrder = existing && existing[0] ? (existing[0].sort_order + 1) : 0;

      const { data, error } = await (supa as any)
        .from("profile_media")
        .insert({
          owner_id: userId,
          url: publicUrl,
          kind,
          caption: caption?.trim() || null,
          sort_order: nextOrder,
        })
        .select()
        .single();
      if (error) throw error;

      return data as ProfileMedia;
    },
    onSuccess: (media) => {
      qc.invalidateQueries({ queryKey: ["profile_media", media.owner_id] });
    },
  });
}

export function useDeleteMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: ProfileMedia) => {
      const supa = getSupabaseBrowser();
      if (!supa) throw new Error("Not configured");

      // Extract storage path: ".../profile-media/{path}"
      const m = item.url.match(/\/profile-media\/(.+?)(\?|$)/);
      const storagePath = m ? m[1] : null;

      if (storagePath) {
        await supa.storage.from("profile-media").remove([storagePath]);
      }
      const { error } = await (supa as any)
        .from("profile_media")
        .delete()
        .eq("id", item.id);
      if (error) throw error;
      return item;
    },
    onSuccess: (item) => {
      qc.invalidateQueries({ queryKey: ["profile_media", item.owner_id] });
    },
  });
}

export function useUpdateCaption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, caption, ownerId }: { id: string; caption: string; ownerId: string }) => {
      const supa = getSupabaseBrowser();
      if (!supa) throw new Error("Not configured");
      const { error } = await (supa as any)
        .from("profile_media")
        .update({ caption: caption.trim() || null })
        .eq("id", id);
      if (error) throw error;
      return { ownerId };
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["profile_media", res.ownerId] });
    },
  });
}

/** Move an item up or down in sort order by swapping with its neighbour. */
export function useReorderMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ items, ownerId }: { items: ProfileMedia[]; ownerId: string }) => {
      const supa = getSupabaseBrowser();
      if (!supa) throw new Error("Not configured");

      // Renumber sort_order to be dense starting at 0
      const updates = items.map((m, i) => ({ id: m.id, sort_order: i }));
      // Upsert each individually — small list (≤20)
      for (const u of updates) {
        await (supa as any)
          .from("profile_media")
          .update({ sort_order: u.sort_order })
          .eq("id", u.id);
      }
      return { ownerId };
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["profile_media", res.ownerId] });
    },
  });
}
