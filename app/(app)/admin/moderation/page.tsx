"use client";

import * as React from "react";
import { modReports } from "@/lib/mock-data";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";

export default function ModerationPage() {
  const sorted = [...modReports].sort((a, b) => {
    const order = { crisis: 0, high: 1, normal: 2 } as const;
    return order[a.severity] - order[b.severity];
  });

  return (
    <div>
      <header>
        <p className="eyebrow flex items-center gap-2">
          Moderation queue · gated
          <span className="rounded-pill bg-crisis text-bone px-2 py-0.5 text-[10px] font-mono">SLA 15M</span>
        </p>
        <h1 className="font-display text-4xl sm:text-5xl mt-2 leading-tight max-w-[24ch]">
          The work that keeps this place safe.
        </h1>
        <p className="text-ink2 mt-2 max-w-prose">
          Reports route here. Crisis severity pages on-call within 15 minutes.
          Every action is written to the audit log.
        </p>
      </header>

      <div className="mt-6 flex flex-wrap gap-2">
        <Chip active>Open · {sorted.filter((r) => r.status === "open").length}</Chip>
        <Chip>Triaged · {sorted.filter((r) => r.status === "triaged").length}</Chip>
        <Chip>Actioned · 0</Chip>
        <Chip>Dismissed · 0</Chip>
      </div>

      <ul className="mt-5 surface divide-y divide-line">
        {sorted.map((r) => (
          <li key={r.id} className="px-4 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-[11px] font-mono uppercase tracking-wider w-fit ${
                r.severity === "crisis"
                  ? "bg-crisis text-bone"
                  : r.severity === "high"
                  ? "bg-ochre text-bone"
                  : "bg-line text-ink2"
              }`}
            >
              <Icon name="shield" size={12} /> {r.severity}
            </span>
            <div className="flex-1 min-w-0">
              <strong>{r.targetTitle}</strong>
              <p className="text-sm text-ink3">
                Reason: <span className="font-mono uppercase">{r.reason}</span> · Kind: <span className="font-mono uppercase">{r.targetKind}</span>
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="outline">Open</Button>
              <Button size="sm" variant="outline">Hide</Button>
              <Button size="sm" variant="danger">Suspend</Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
