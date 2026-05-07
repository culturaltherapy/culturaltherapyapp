"use client";

import * as React from "react";
import { discussionRooms, discussionThreads } from "@/lib/mock-data";
import { Button } from "@/components/ui/Button";
import { Funtunfunefu } from "@/components/motifs/Motifs";
import { Icon } from "@/components/ui/Icon";

export default function DiscussionsPage() {
  const [activeRoom, setActiveRoom] = React.useState(discussionRooms[0].id);
  const room = discussionRooms.find((r) => r.id === activeRoom)!;
  const threads = discussionThreads.filter((t) => t.roomId === activeRoom);

  return (
    <div>
      <header>
        <p className="eyebrow">Discussions · Funtunfunefu</p>
        <h1 className="font-display text-4xl sm:text-5xl mt-2 leading-tight max-w-[24ch]">
          Spaces to talk. Moderated by people who've been here.
        </h1>
        <p className="text-ink2 mt-2 max-w-prose">
          Each room has a peer-trained moderator on call. Crisis escalation is one tap.
        </p>
      </header>

      <div className="mt-6 grid gap-5 lg:grid-cols-[300px_1fr]">
        {/* Rooms */}
        <aside className="surface p-3">
          <p className="eyebrow px-2 pt-1">Rooms</p>
          <ul className="mt-2 space-y-1">
            {discussionRooms.map((r) => {
              const active = r.id === activeRoom;
              return (
                <li key={r.id}>
                  <button
                    onClick={() => setActiveRoom(r.id)}
                    className={`w-full text-left p-2.5 rounded-md flex items-start justify-between gap-2 ${
                      active ? "bg-bone shadow-soft border border-line" : "hover:bg-ink/[.03]"
                    }`}
                  >
                    <div>
                      <div className="font-medium text-ink flex items-center gap-2">
                        {r.title}
                        {r.isChat && <span className="text-[10px] font-mono bg-crisis text-bone rounded-pill px-2 py-0.5">LIVE</span>}
                      </div>
                      <p className="text-xs text-ink3 mt-0.5">{r.blurb}</p>
                    </div>
                    <span className="text-[11px] text-ink3 font-mono whitespace-nowrap">{r.count}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Threads */}
        <section>
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl">{room.title}</h2>
              <p className="text-ink3 text-sm">{room.blurb}</p>
            </div>
            <Button>+ Start a thread</Button>
          </div>

          {room.isChat ? (
            <ChatRoom />
          ) : (
            <ul className="mt-5 surface divide-y divide-line">
              {threads.map((t) => (
                <li key={t.id} className="px-4 py-3 hover:bg-ink/[.02]">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-display text-lg">{t.title}</h3>
                    <span className="text-xs text-ink3 whitespace-nowrap">{t.last}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-ink3">
                    <span>{t.replies} replies</span>
                    <span>·</span>
                    <span>Room: {room.title}</span>
                    <span className="ml-auto inline-flex gap-1.5">
                      <span className="h-5 w-5 rounded-full bg-terracotta" />
                      <span className="h-5 w-5 rounded-full bg-forest" />
                      <span className="h-5 w-5 rounded-full bg-ochre" />
                    </span>
                  </div>
                </li>
              ))}
              {threads.length === 0 && (
                <li className="px-4 py-6 text-center text-ink3 text-sm">No threads yet — start the first one.</li>
              )}
            </ul>
          )}

          <div className="mt-6 flex items-center gap-3 text-ink3">
            <Funtunfunefu size={28} />
            <p className="text-xs">Mods on call: 24/7. Reports route to a human within 15 minutes.</p>
          </div>
        </section>
      </div>
    </div>
  );
}

function ChatRoom() {
  const [msgs, setMsgs] = React.useState([
    { id: "m1", who: "Adwoa K.", text: "Just finished therapy — it was a lot.", t: "2m" },
    { id: "m2", who: "Marcus O.", text: "Proud of you. What helped?", t: "1m" },
    { id: "m3", who: "Tendai R.", text: "Take a breath. We're here.", t: "30s" }
  ]);
  const [text, setText] = React.useState("");
  function send() {
    if (!text.trim()) return;
    setMsgs([...msgs, { id: String(Date.now()), who: "You", text, t: "now" }]);
    setText("");
  }
  return (
    <div className="mt-5 surface p-4 flex flex-col h-[60dvh] min-h-[400px]">
      <ul className="flex-1 overflow-y-auto space-y-3 pr-1">
        {msgs.map((m) => (
          <li key={m.id} className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <strong className="text-sm">{m.who}</strong>
              <span className="text-xs text-ink3">{m.t}</span>
            </div>
            <p className="text-[15px] text-ink2">{m.text}</p>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Say something kind."
          className="flex-1 bg-transparent border-0 outline-none text-[15px]"
        />
        <Button size="sm" onClick={send}>Send</Button>
      </div>
    </div>
  );
}
