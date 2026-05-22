"use client";

import * as React from "react";
import { LANGUAGE_OPTIONS } from "@/lib/mock-data";
import { Input } from "@/components/ui/Field";
import { Chip } from "@/components/ui/Chip";
import { validateShortLabel } from "@/lib/validation";

export function LanguagePicker({
  value,
  onChange,
  placeholder = "Type to search…",
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
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
    if (!q) {
      return LANGUAGE_OPTIONS.filter((l) => !value.includes(l)).slice(0, 12);
    }
    return LANGUAGE_OPTIONS
      .filter((l) => l.toLowerCase().includes(q) && !value.includes(l))
      .slice(0, 12);
  }, [q, value]);

  const exactMatch = filtered.some((l) => l.toLowerCase() === q);
  const canAddCustom =
    q.length >= 2 &&
    !exactMatch &&
    !value.some((l) => l.toLowerCase() === q) &&
    validateShortLabel(q, { min: 2, max: 40, label: "Language" }).ok;

  function add(lang: string) {
    if (value.includes(lang)) return;
    onChange([...value, lang]);
    setQuery("");
  }

  function remove(lang: string) {
    onChange(value.filter((l) => l !== lang));
  }

  function addCustom() {
    const v = query.trim();
    if (!canAddCustom) return;
    add(v);
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
          {value.map((l) => (
            <Chip key={l} as="button" active onClick={() => remove(l)}>
              {l} <span className="ml-1 opacity-70">×</span>
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
            {filtered.map((l) => (
              <li key={l}>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); add(l); }}
                  className="block w-full text-left px-3 py-2 text-[15px] hover:bg-ink/5"
                >
                  {l}
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
                  + Add "{query.trim()}" as a custom language
                </button>
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
