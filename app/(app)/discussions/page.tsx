"use client";

import * as React from "react";
import { useDiscussionRooms, useDiscussionPosts, usePostToDiscussion } from "@/lib/hooks/useDiscussions";
import { Button } from "@/components/ui/Button";
import { Funtunfunefu } from "@/components/motifs/Motifs";
import { Icon } from "@/components/ui/Icon";

export default function DiscussionsPage() {
  const { data: rooms = [], isLoading: roomsLoading } = useDiscussionRooms();
  const [activeRoomId, setActiveRoomId] = React.useState<string | null>(null);

  const roomId = activeRoomId ?? rooms[0]?.id ?? "";
  const room = rooms.find((r) => r.id === roomId) ?? rooms[0];
  const { data: threads = [] } = useDiscussionPosts(roomId);

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
        <aside className="surface p-3">
          <p className="eyebrow px-2 pt-1">Rooms</p>
          {roomsLoading ? (
            <div className="px-2 py-4 text-sm text-ink3">Loading rooms…</div>
          ) : (
            <ul className="mt-2 space-y-1">
              {rooms.map((r) => {
                const active = r.id === roomId;
                return (
                  <li key={r.id}>
                    <button onClick={() => setActiveRoomId(r.id)}
                      className={`w-full text-left p-2.5 rounded-md flex items-start justify-between gap-2 ${active ? "bg-bone shadow-soft border border-line" : "hover:bg-ink/[.03]"}`}>
                      <div>
                        <div className="font-medium text-ink flex items-center gap-2">
                          {r.title}
                          {r.isChat && <span className="text-[10px] font-mono bg-crisis text-bone rounded-pill px-2 py-0.5">LIVE</span>}
                        </div>
                        <p className="text-xs text-ink3 mt-0.5">{r.blurb}</p>
                      </div>
                      <span className="text-[11px] text-ink3 font-mono whitespace-nowrap">{r.count || ""}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        <section>
          {room && (
            <>
              <div className="flex items-baseline justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl">{room.title}</h2>
                  <p className="text-ink3 text-sm">{room.blurb}</p>
                </div>
                <Button>+ Start a thread</Button>
              </div>

              {room.isChat ? (
                <ChatRoom roomId={room.id} />
              ) : (
                <ul className="mt-5 surface divide-y divide-line">
                  {threads.map((t) => (
                    <li key={t.id} className="px-4 py-3 hover:bg-ink/[.02] cursor-pointer">
                      <div className="flex items-baseline justify-between gap-3">
                        <h3 className="font-display text-lg">{t.title}</h3>
                        <span className="text-xs text-ink3 whitespace-nowrap">{t.last}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-ink3">
                        <span>{t.replies} replies</span>
                        <span>·</span>
                        <span>Room: {room.title}</span>
                      </div>
                    </li>
                  ))}
                  {threads.length === 0 && (
                    <li className="px-4 py-6 text-center text-ink3 text-sm">
                      No threads yet — start the first one.
                    </li>
                  )}
                </ul>
              )}
            </>
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

function ChatRoom({ roomId }: { roomId: string }) {
  const { data: serverPosts = [] } = useDiscussionPosts(roomId);
  const postMutation = usePostToDiscussion();
  const [msgs, setMsgs] = React.useState([
    { id: "seed1", who: "Adwoa K.", text: "Just finished therapy — it was a lot.", t: "2m" },
    { id: "seed2", who: "Marcus O.", text: "Proud of you. What helped?", t: "1m" },
    { id: "seed3", who: "Tendai R.", text: "Take a breath. We're here.", t: "30s" }
  ]);
  const [text, setText] = React.useState("");
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  async function send() {
    if (!text.trim()) return;
    const optimistic = { id: String(Date.now()), who: "You", text, t: "now" };
    setMsgs((m) => [...m, optimistic]);
    setText("");
    try {
      await postMutation.mutateAsync({ roomId, body: text.trim() });
    } catch (_) {
      // optimistic update stays visible
    }
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
        <div ref={bottomRef} />
      </ul>
      <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
        <input value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Say something kind."
          className="flex-1 bg-transparent border-0 outline-none text-[15px]"
          enterKeyHint="send" />
        <Button size="sm" onClick={send} disabled={postMutation.isPending}>Send</Button>
      </div>
    </div>
  );
}
