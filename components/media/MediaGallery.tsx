"use client";

import * as React from "react";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icon";
import {
  useDeleteMedia,
  useReorderMedia,
  type ProfileMedia,
} from "@/lib/hooks/useProfileMedia";

export function MediaGallery({
  items,
  ownerId,
  canEdit,
}: {
  items: ProfileMedia[];
  ownerId: string;
  canEdit: boolean;
}) {
  const [openIdx, setOpenIdx] = React.useState<number | null>(null);
  const del = useDeleteMedia();
  const reorder = useReorderMedia();
  const [localItems, setLocalItems] = React.useState(items);

  // Keep local order in sync with server
  React.useEffect(() => setLocalItems(items), [items]);

  if (items.length === 0) {
    if (!canEdit) {
      return (
        <div className="surface p-6 text-center">
          <p className="text-ink3 text-sm">No photos or videos yet.</p>
        </div>
      );
    }
    return null;
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= localItems.length) return;
    const next = [...localItems];
    [next[i], next[j]] = [next[j], next[i]];
    setLocalItems(next);
    reorder.mutate({ items: next, ownerId });
  }

  return (
    <div>
      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {localItems.map((m, i) => (
          <li
            key={m.id}
            className="group relative aspect-[4/3] rounded-lg overflow-hidden bg-ink/5 surface"
          >
            <button
              onClick={() => setOpenIdx(i)}
              className="block h-full w-full"
              aria-label={m.caption || "Open media"}
            >
              {m.kind === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.url} alt={m.caption ?? ""} className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <>
                  <video
                    src={m.url}
                    className="h-full w-full object-cover"
                    muted
                    playsInline
                    preload="metadata"
                  />
                  <span className="absolute inset-0 flex items-center justify-center bg-ink/30 text-bone">
                    <Icon name="play" size={32} />
                  </span>
                </>
              )}
            </button>

            {m.caption && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent text-bone text-xs p-2 line-clamp-2 pointer-events-none">
                {m.caption}
              </div>
            )}

            {canEdit && (
              <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                {i > 0 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); move(i, -1); }}
                    className="h-6 w-6 rounded-full bg-ink/70 text-bone text-xs hover:bg-ink"
                    aria-label="Move left"
                  >
                    ‹
                  </button>
                )}
                {i < localItems.length - 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); move(i, 1); }}
                    className="h-6 w-6 rounded-full bg-ink/70 text-bone text-xs hover:bg-ink"
                    aria-label="Move right"
                  >
                    ›
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm("Delete this item?")) del.mutate(m);
                  }}
                  className="h-6 w-6 rounded-full bg-crisis text-bone text-xs hover:opacity-90"
                  aria-label="Delete"
                >
                  ×
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      <Modal
        open={openIdx !== null}
        onClose={() => setOpenIdx(null)}
        size="lg"
        title={openIdx !== null ? (localItems[openIdx].caption || "Media") : ""}
      >
        {openIdx !== null && (
          <div>
            <div className="bg-ink rounded-md overflow-hidden flex items-center justify-center max-h-[70dvh]">
              {localItems[openIdx].kind === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={localItems[openIdx].url}
                  alt={localItems[openIdx].caption ?? ""}
                  className="max-h-[70dvh] max-w-full object-contain"
                />
              ) : (
                <video
                  src={localItems[openIdx].url}
                  controls
                  className="max-h-[70dvh] max-w-full"
                />
              )}
            </div>
            {localItems[openIdx].caption && (
              <p className="mt-3 text-sm text-ink2">{localItems[openIdx].caption}</p>
            )}
            <div className="mt-3 flex items-center justify-between text-xs text-ink3">
              <span>{openIdx + 1} / {localItems.length}</span>
              <div className="flex gap-2">
                <button
                  disabled={openIdx === 0}
                  onClick={() => setOpenIdx((openIdx ?? 0) - 1)}
                  className="px-3 py-1 rounded-md hover:bg-ink/5 disabled:opacity-30"
                >
                  ‹ Previous
                </button>
                <button
                  disabled={openIdx >= localItems.length - 1}
                  onClick={() => setOpenIdx((openIdx ?? 0) + 1)}
                  className="px-3 py-1 rounded-md hover:bg-ink/5 disabled:opacity-30"
                >
                  Next ›
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
