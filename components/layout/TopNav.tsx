"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import { me } from "@/lib/mock-data";
import { useSession } from "@/lib/hooks/useSession";

const navItems = [
  { href: "/home", label: "Home" },
  { href: "/network", label: "Lived Experience" },
  { href: "/academy", label: "Academy" },
  { href: "/discussions", label: "Discussions" },
  { href: "/tribes", label: "My Tribe" }
];

export function TopNav() {
  const pathname = usePathname();
  const { profile } = useSession();
  const alias = profile?.alias ?? me.alias;
  const avatarColor = (profile as any)?.avatar_color ?? me.avatarColor;
  const avatarUrl = (profile as any)?.avatar_url ?? null;

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-parchment/85 backdrop-blur supports-[backdrop-filter]:bg-parchment/70">
      <div className="mx-auto flex max-w-shell items-center justify-between px-4 py-3">
        <Link href="/home" className="shrink-0">
          <Logo size={26} />
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-2 rounded-md text-[15px]",
                  active
                    ? "text-ink font-medium"
                    : "text-ink2 hover:text-ink hover:bg-ink/5"
                )}
              >
                {item.label}
                {active && (
                  <span className="block h-[2px] mt-1 bg-terracotta" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <button className="hidden sm:inline-flex items-center gap-1.5 rounded-pill border border-terracotta text-terracotta px-3.5 py-1.5 text-sm font-medium hover:bg-terracotta hover:text-bone">
            <Icon name="shield" size={14} />
            Help now
          </button>
          <button
            aria-label="Notifications"
            className="text-ink2 hover:text-ink p-1.5"
          >
            <Icon name="bell" size={20} />
          </button>
          <Link href="/profile" aria-label="My profile">
            <Avatar name={alias} color={avatarColor} size={36} src={avatarUrl} />
          </Link>
        </div>
      </div>
    </header>
  );
}
