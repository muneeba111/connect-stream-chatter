import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { SiteNav } from "@/components/SiteNav";

export const Route = createFileRoute("/rooms/$roomId")({
  component: RoomChat,
});

type Room = { id: string; name: string; topic: string | null; category: string };
type MsgRow = { id: string; room_id: string; user_id: string; content: string; created_at: string };
type Msg = MsgRow & { display_name?: string; is_premium?: boolean };

function RoomChat() {
  const { roomId } = Route.useParams();
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [profileMap, setProfileMap] = useState<Record<string, { display_name: string; is_premium: boolean }>>({});
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  // Load room + messages
  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: r }, { data: msgs }] = await Promise.all([
        supabase.from("rooms").select("*").eq("id", roomId).maybeSingle(),
        supabase.from("messages").select("*").eq("room_id", roomId).order("created_at").limit(200),
      ]);
      setRoom(r as Room | null);
      const m = (msgs ?? []) as MsgRow[];
      setMessages(m);
      // load profiles
      const ids = Array.from(new Set(m.map((x) => x.user_id)));
      if (ids.length) {
        const { data: ps } = await supabase.from("profiles").select("user_id, display_name, is_premium").in("user_id", ids);
        const map: Record<string, { display_name: string; is_premium: boolean }> = {};
        (ps ?? []).forEach((p: any) => { map[p.user_id] = { display_name: p.display_name, is_premium: p.is_premium }; });
        setProfileMap(map);
      }
    })();
  }, [roomId, user]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `room_id=eq.${roomId}` },
        async (payload) => {
          const m = payload.new as MsgRow;
          setMessages((prev) => (prev.some((p) => p.id === m.id) ? prev : [...prev, m]));
          if (!profileMap[m.user_id]) {
            const { data } = await supabase.from("profiles").select("user_id, display_name, is_premium").eq("user_id", m.user_id).maybeSingle();
            if (data) setProfileMap((pm) => ({ ...pm, [data.user_id]: { display_name: data.display_name, is_premium: data.is_premium } }));
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [roomId, user, profileMap]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user) return;
    setSending(true);
    const content = text.trim();
    setText("");
    const { error } = await supabase.from("messages").insert({ room_id: roomId, user_id: user.id, content });
    if (error) console.error(error);
    setSending(false);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteNav />
      <div className="mx-auto max-w-4xl w-full px-6 pt-4 pb-2">
        <Link to="/rooms" className="text-sm text-muted-foreground hover:text-primary">← All rooms</Link>
      </div>
      <div className="mx-auto max-w-4xl w-full px-6 flex-1 flex flex-col">
        <div className="bg-surface ring-1 ring-border rounded-3xl flex flex-col flex-1 overflow-hidden">
          <header className="px-6 py-5 border-b border-border flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-semibold tracking-tight">{room?.name ?? "Loading..."}</h1>
              {room?.topic && <p className="text-sm text-muted-foreground mt-1">{room.topic}</p>}
            </div>
            <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <span className="size-2 rounded-full bg-green-500 animate-pulse" /> Live
            </span>
          </header>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 min-h-[50vh] max-h-[60vh]">
            {messages.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">No messages yet. Say hi 👋</p>
            )}
            {messages.map((m) => {
              const me = m.user_id === user.id;
              const p = profileMap[m.user_id];
              const startDM = async () => {
                if (me) return;
                const { data, error } = await supabase.rpc("get_or_create_conversation", { _other: m.user_id });
                if (error) { console.error(error); return; }
                navigate({ to: "/messages/$conversationId", params: { conversationId: data as string } });
              };
              return (
                <div key={m.id} className={`flex ${me ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] ${me ? "bg-primary text-primary-foreground" : "bg-surface-tint text-foreground"} px-4 py-2.5 rounded-2xl ring-1 ring-border`}>
                    <div className={`text-[11px] font-medium mb-1 flex items-center gap-1.5 ${me ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                      <button
                        type="button"
                        onClick={startDM}
                        disabled={me}
                        className={me ? "" : "hover:underline hover:text-primary cursor-pointer"}
                        title={me ? "" : "Send direct message"}
                      >
                        {me ? "You" : p?.display_name ?? "user"}
                      </button>
                      {p?.is_premium && <span className="text-[9px] uppercase tracking-widest bg-white/20 px-1.5 py-0.5 rounded">Pro</span>}
                    </div>
                    <div className="text-sm whitespace-pre-wrap break-words">{m.content}</div>
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>

          <form onSubmit={send} className="border-t border-border p-4 flex gap-3 bg-background">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Message ${room?.name ?? ""}`}
              maxLength={2000}
              className="flex-1 px-4 py-3 rounded-full bg-surface ring-1 ring-border focus:ring-2 focus:ring-primary outline-none text-sm"
            />
            <button
              type="submit"
              disabled={sending || !text.trim()}
              className="bg-primary text-primary-foreground px-6 rounded-full font-medium hover:bg-primary-dark disabled:opacity-50 transition"
            >
              Send
            </button>
          </form>
          {profile?.is_premium ? (
            <div className="border-t border-border px-4 py-2 text-xs text-center text-primary bg-primary/5">
              🎥 Premium video chat coming online soon — you're on the list.
            </div>
          ) : (
            <div className="border-t border-border px-4 py-2 text-xs text-center text-muted-foreground">
              <Link to="/premium" className="text-primary font-medium hover:underline">Go Premium</Link> to unlock video chat
            </div>
          )}
        </div>
        <div className="h-6" />
      </div>
    </div>
  );
}
