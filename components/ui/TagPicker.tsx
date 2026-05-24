"use client";

import * as React from "react";
import { Input } from "@/components/ui/Field";
import { Chip } from "@/components/ui/Chip";
import { validateShortLabel } from "@/lib/validation";

/**
 * Generic searchable multi-select with optional custom add.
 * Used for languages and heritages — anywhere a long list of options
 * with possible "not listed" entries makes a chip grid unwieldy.
 */
export function TagPicker({
  value,
  onChange,
  options,
  placeholder = "Type to search…",
  itemLabel = "Item",
  allowCustom = true,
  maxSuggestions = 14,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  options: string[];
  placeholder?: string;
  itemLabel?: string;
  allowCustom?: boolean;
  maxSuggestions?: number;
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
    // No dropdown until the user starts typing — avoids the
    // "random list of African countries" first-look problem.
    if (!q) return [];
    const remaining = options.filter((o) => !value.includes(o));
    return remaining
      .filter((o) => o.toLowerCase().includes(q))
      .slice(0, maxSuggestions);
  }, [q, value, options, maxSuggestions]);

  const exactMatch = filtered.some((o) => o.toLowerCase() === q);
  const canAddCustom =
    allowCustom &&
    q.length >= 2 &&
    !exactMatch &&
    !value.some((o) => o.toLowerCase() === q) &&
    validateShortLabel(q, { min: 2, max: 60, label: itemLabel }).ok;

  function add(item: string) {
    if (value.includes(item)) return;
    onChange([...value, item]);
    setQuery("");
  }
  function remove(item: string) {
    onChange(value.filter((o) => o !== item));
  }
  function addCustom() {
    if (!canAddCustom) return;
    add(query.trim());
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (filtered.length > 0) add(filtered[0]);
      else if (canAddCustom) addCustom();
    }
  }

  return (
    <div ref={containerRef}>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {value.map((o) => (
            <Chip key={o} as="button" active onClick={() => remove(o)}>
              {o} <span className="ml-1 opacity-70">×</span>
            </Chip>
          ))}
        </div>
      )}

      <div className="relative">
        <Input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
        />

        {open && (filtered.length > 0 || canAddCustom) && (
          <ul className="absolute z-20 left-0 right-0 mt-1 bg-bone border border-line rounded-md shadow-soft max-h-60 overflow-y-auto">
            {filtered.map((o) => (
              <li key={o}>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); add(o); }}
                  className="block w-full text-left px-3 py-2 text-[15px] hover:bg-ink/5"
                >
                  {o}
                </button>
              </li>
            ))}
            {canAddCustom && (
              <li>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); addCustom(); }}
                  className="block w-full text-left px-3 py-2 text-[15px] hover:bg-ink/5 text-terracotta border-t border-line"
                >
                  + Add &quot;{query.trim()}&quot; ({itemLabel.toLowerCase()})
                </button>
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
