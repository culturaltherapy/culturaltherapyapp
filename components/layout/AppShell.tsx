import * as React from "react";
import { CrisisBanner } from "./CrisisBanner";
import { TopNav } from "./TopNav";
import { BottomNav } from "./BottomNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-parchment">
      <CrisisBanner />
      <TopNav />
      <main className="mx-auto max-w-shell px-4 sm:px-6 py-6 has-bottom-nav">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
