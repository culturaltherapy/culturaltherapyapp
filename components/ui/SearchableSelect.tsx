"use client";

import * as React from "react";
import { Input } from "@/components/ui/Field";
import { Chip } from "@/components/ui/Chip";

/**
 * Single-value type-to-search picker. Like TagPicker but stores one value.
 * Empty query → no dropdown (you have to type to see options).
 */
export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Type to search…",
  maxSuggestions = 14,
  emptyHint,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  maxSuggestions?: number;
  emptyHint?: string;
}) {
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    window.addEventListener("mousedown", onDocClick);
    return () => window.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const q = query.trim().toLowerCase();
  const filtered = React.useMemo(() => {
    if (!q) return [];
    return options
      .filter((o) => o.toLowerCase().includes(q) && o !== value)
      .slice(0, maxSuggestions);
  }, [q, value, options, maxSuggestions]);

  function select(item: string) {
    onChange(item);
    setQuery("");
    setOpen(false);
  }
  function clear() {
    onChange("");
    setQuery("");
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && filtered.length > 0) {
      e.preventDefault();
      select(filtered[0]);
    }
  }

  return (
    <div ref={containerRef}>
      {value && (
        <div className="flex flex-wrap gap-2 mb-2">
          <Chip as="button" active onClick={clear}>
            {value} <span className="ml-1 opacity-70">×</span>
          </Chip>
        </div>
      )}

      <div className="relative">
        <Input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={value ? `Search to change from "${value}"` : placeholder}
        />

        {open && filtered.length > 0 && (
          <ul className="absolute z-20 left-0 right-0 mt-1 bg-bone border border-line rounded-md shadow-soft max-h-60 overflow-y-auto">
            {filtered.map((o) => (
              <li key={o}>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); select(o); }}
                  className="block w-full text-left px-3 py-2 text-[15px] hover:bg-ink/5"
                >
                  {o}
                </button>
              </li>
            ))}
          </ul>
        )}

        {open && q && filtered.length === 0 && (
          <p className="absolute z-20 left-0 right-0 mt-1 bg-bone border border-line rounded-md px-3 py-2 text-sm text-ink3">
            No matches.
          </p>
        )}

        {!value && !q && emptyHint && (
          <p className="mt-2 text-xs text-ink3">{emptyHint}</p>
        )}
      </div>
    </div>
  );
}
