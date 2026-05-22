"use client";

import * as React from "react";

export type TabKey = "about" | "wall" | "connections";

export function ProfileTabs({
  active,
  onChange,
  showConnections,
  postCount,
  connectionCount,
  mediaCount,
}: {
  active: TabKey;
  onChange: (k: TabKey) => void;
  showConnections: boolean;
  postCount?: number;
  connectionCount?: number;
  mediaCount?: number;
}) {
  const tabs: { key: TabKey; label: string; meta?: string }[] = [
    { key: "about", label: "About", meta: mediaCount != null && mediaCount > 0 ? `${mediaCount}` : undefined },
    { key: "wall",  label: "Wall",  meta: postCount  != null && postCount  > 0 ? `${postCount}`  : undefined },
    ...(showConnections
      ? [{ key: "connections" as const, label: "Connections", meta: connectionCount != null && connectionCount > 0 ? `${connectionCount}` : undefined }]
      : []),
  ];

  return (
    <div className="border-b border-line mt-4">
      <nav className="flex gap-1">
        {tabs.map((t) => {
          const isActive = t.key === active;
          return (
            <button
              key={t.key}
              onClick={() => onChange(t.key)}
              className={`relative px-4 py-3 text-sm font-medium transition ${
                isActive ? "text-ink" : "text-ink3 hover:text-ink2"
              }`}
            >
              <span>{t.label}</span>
              {t.meta && (
                <span className="ml-1.5 text-xs text-ink3 font-mono">{t.meta}</span>
              )}
              {isActive && (
                <span className="absolute left-3 right-3 -bottom-px h-[2px] bg-terracotta" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

/** Read/write tab via URL search param so deep-links can land on a specific tab. */
export function useTabParam(defaultTab: TabKey = "about"): [TabKey, (k: TabKey) => void] {
  const [tab, setTab] = React.useState<TabKey>(defaultTab);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("tab") as TabKey | null;
    if (fromUrl === "about" || fromUrl === "wall" || fromUrl === "connections") {
      setTab(fromUrl);
    }
  }, []);

  function update(k: TabKey) {
    setTab(k);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (k === "about") url.searchParams.delete("tab");
      else url.searchParams.set("tab", k);
      window.history.replaceState({}, "", url.toString());
    }
  }

  return [tab, update];
}
