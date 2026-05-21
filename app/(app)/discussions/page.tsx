"use client";

import * as React from "react";
import Link from "next/link";
import { useDiscussionRooms, useDiscussionThreads, usePostToDiscussion } from "@/lib/hooks/useDiscussions";
import { Button } from "@/components/ui/Button";
import { Funtunfunefu } from "@/components/motifs/Motifs";
import { Avatar } from "@/components/ui/Avatar";
import { NewThreadModal } from "@/components/discussions/NewThreadModal";
import { timeAgo } from "@/lib/utils";

export default function DiscussionsPage() {
  const { data: rooms = [], isLoading: roomsLoading } = useDiscussionRooms();
  const [activeRoomId, setActiveRoomId] = React.useState<string | null>(null);
  const [showNewThread, setShowNewThread] = React.useState(false);

  const roomId = activeRoomId ?? rooms[0]?.id ?? "";
  const room = rooms.find((r) => r.id === roomId) ?? rooms[0];
  const { data: threads = [] } = useDiscussionThreads(roomId);

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
                {!room.isChat && (
                  <Button onClick={() => setShowNewThread(true)}>+ Start a thread</Button>
                )}
              </div>

              {room.isChat ? (
                <ChatRoom roomId={room.id} />
              ) : (
                <ul className="mt-5 surface divide-y divide-line">
                  {threads.map((t: any) => (
                    <li key={t.id}>
                      <Link
                        href={`/discussions/${t.id}`}
                        className="block px-4 py-3 hover:bg-ink/[.02] transition"
                      >
                        <div className="flex items-baseline justify-between gap-3">
                          <h3 className="font-display text-lg">
                            {t.title || (t.body ?? "").slice(0, 80) + ((t.body ?? "").length > 80 ? "…" : "")}
                          </h3>
                          <span className="text-xs text-ink3 whitespace-nowrap">{timeAgo(t.created_at)}</span>
                        </div>
                        {t.title && t.body && (
                          <p className="text-ink2 text-sm mt-1 line-clamp-2">{t.body}</p>
                        )}
                        <div className="mt-2 flex items-center gap-3 text-xs text-ink3">
                          <div className="flex items-center gap-1.5">
                            <Avatar
                              name={t.author?.alias ?? "Member"}
                              src={t.author?.avatar_url}
                              size={18}
                            />
                            <span>{t.author?.alias ?? "Member"}</span>
                          </div>
                          <span>·</span>
                          <span>{t.reply_count} {t.reply_count === 1 ? "reply" : "replies"}</span>
                        </div>
                      </Link>
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

      {room && !room.isChat && (
        <NewThreadModal
          open={showNewThread}
          onClose={() => setShowNewThread(false)}
          roomId={room.id}
          roomTitle={room.title}
        />
      )}
    </div>
  );
}

function ChatRoom({ roomId }: { roomId: string }) {
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
