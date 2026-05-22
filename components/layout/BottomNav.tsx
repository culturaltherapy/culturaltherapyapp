"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

const items: { href: string; label: string; icon: IconName }[] = [
  { href: "/home",        label: "Home",     icon: "home" },
  { href: "/network",     label: "Network",  icon: "users" },
  { href: "/connections", label: "Connect",  icon: "heart" },
  { href: "/tribes",      label: "Tribe",    icon: "shield" },
  { href: "/discussions", label: "Discuss",  icon: "message" },
  { href: "/academy",     label: "Academy",  icon: "book" },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-line bg-parchment/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-6">
        {items.map((it) => {
          const active = pathname?.startsWith(it.href);
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] tracking-tight",
                  active ? "text-terracotta" : "text-ink3"
                )}
              >
                <Icon name={it.icon} size={20} strokeWidth={active ? 2 : 1.6} />
                <span>{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
