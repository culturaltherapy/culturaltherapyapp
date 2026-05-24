"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { getSupabaseBrowser } from "@/lib/supabase/client";

export function UserMenu({
  alias,
  avatarColor,
  avatarUrl,
}: {
  alias: string;
  avatarColor: string;
  avatarUrl: string | null;
}) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener("mousedown", onDocClick);
    return () => window.removeEventListener("mousedown", onDocClick);
  }, [open]);

  async function signOut() {
    const supa = getSupabaseBrowser();
    if (supa) await supa.auth.signOut();
    router.push("/signin");
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="My account"
        aria-expanded={open}
        className="block rounded-full focus-visible:ring-2 focus-visible:ring-terracotta"
      >
        <Avatar name={alias} color={avatarColor} size={36} src={avatarUrl} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-bone border border-line shadow-soft rounded-xl z-40 overflow-hidden">
          <div className="px-4 py-3 border-b border-line">
            <p className="font-display text-sm truncate">{alias}</p>
          </div>
          <ul className="py-1 text-sm">
            <MenuItem href="/profile" onSelect={() => setOpen(false)}>My profile</MenuItem>
            <MenuItem href="/profile/edit" onSelect={() => setOpen(false)}>Edit profile</MenuItem>
            <MenuItem href="/settings" onSelect={() => setOpen(false)}>Account settings</MenuItem>
          </ul>
          <div className="border-t border-line py-1">
            <button
              onClick={signOut}
              className="w-full text-left px-4 py-2 text-sm hover:bg-ink/5 inline-flex items-center gap-2"
            >
              <Icon name="arrowLeft" size={14} />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({ href, onSelect, children }: { href: string; onSelect: () => void; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        onClick={onSelect}
        className="block px-4 py-2 hover:bg-ink/5"
      >
        {children}
      </Link>
    </li>
  );
}
