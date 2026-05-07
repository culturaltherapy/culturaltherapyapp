"use client";
import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Ankh } from "@/components/motifs/Motifs";
import { crisisResources } from "@/lib/mock-data";
import { Icon } from "@/components/ui/Icon";

type Country = keyof typeof crisisResources;

export function CrisisBanner() {
  const [open, setOpen] = React.useState(false);
  const [country, setCountry] = React.useState<Country>("GB");
  const list = crisisResources[country];

  return (
    <>
      <div className="w-full bg-crisis text-bone">
        <div className="mx-auto max-w-shell flex items-center justify-between gap-3 px-4 py-2 text-sm">
          <span className="font-medium">
            If you are in crisis or unsafe right now
          </span>
          <span className="hidden sm:inline opacity-80">
            — you don't have to use the app to get help.
          </span>
          <button
            onClick={() => setOpen(true)}
            className="ml-auto rounded-pill bg-bone text-crisis px-3 py-1 text-sm font-medium hover:bg-bone/90"
          >
            Get help now
          </button>
        </div>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="You are not alone."
        size="md"
        footer={
          <div className="flex items-center justify-between text-xs text-ink3">
            <span>You can keep this banner open while you call.</span>
            <button
              className="text-terracotta hover:underline"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </div>
        }
      >
        <div className="flex items-start gap-3">
          <div className="text-terracotta">
            <Ankh size={36} />
          </div>
          <p className="text-ink2 text-sm leading-relaxed">
            Whatever you choose now, we'll be here when you come back. Pick a
            resource below — they're free, confidential, and answered by people
            trained to listen.
          </p>
        </div>

        <div className="mt-5">
          <label className="text-sm text-ink3">Country</label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value as Country)}
            className="mt-1 w-full rounded-md border border-line bg-bone px-3 py-2 text-sm"
          >
            <option value="GB">United Kingdom</option>
            <option value="US">United States</option>
            <option value="NG">Nigeria</option>
            <option value="GH">Ghana</option>
            <option value="CA">Canada</option>
          </select>
        </div>

        <ul className="mt-4 divide-y divide-line border border-line rounded-lg overflow-hidden">
          {list.map((r) => (
            <li key={r.name} className="px-4 py-3 bg-bone/60">
              <div className="flex items-baseline justify-between gap-3">
                <strong className="text-ink">{r.name}</strong>
                <span className="text-xs text-ink3">{r.hours}</span>
              </div>
              <div className="mt-1 flex items-center gap-3">
                <a
                  href={r.phone.startsWith("Text") ? "#" : `tel:${r.phone.replace(/\s/g, "")}`}
                  className="text-terracotta font-medium"
                >
                  {r.phone}
                </a>
                {r.url && r.url !== "#" && (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-ink3 hover:underline inline-flex items-center gap-1"
                  >
                    Visit site <Icon name="arrow" size={12} />
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Modal>
    </>
  );
}
