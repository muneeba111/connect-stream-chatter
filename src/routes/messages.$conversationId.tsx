import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { SiteNav } from "@/components/SiteNav";

export const Route = createFileRoute("/messages/$conversationId")({
  component: DMThread,
});

type DM = { id: string; conversation_id: string; sender_id: string; content: string; created_at: string };
type Conv = { id: string; user_a: string; user_b: string };

function DMThread() {
  const { conversationId } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [conv, setConv] = useState<Conv | null>(null);
  const [other, setOther] = useState<{ display_name: string; is_premium: boolean } | null>(null);
  const [messages, setMessages] = useState<DM[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: c } = await supabase
        .from("conversations")
        .select("id,user_a,user_b")
        .eq("id", conversationId)
        .maybeSingle();
      if (!c) return;
      setConv(c as Conv);
      const otherId = c.user_a === user.id ? c.user_b : c.user_a;
      const { data: p } = await supabase
        .from("profiles")
        .select("display_name, is_premium")
        .eq("user_id", otherId)
        .maybeSingle();
      setOther((p as any) ?? null);
      const { data: msgs } = await supabase
        .from("direct_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at")
        .limit(500);
      setMessages((msgs ?? []) as DM[]);
    })();
  }, [conversationId, user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`dm-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const m = payload.new as DM;
          setMessages((prev) => (prev.some((p) => p.id === m.id) ? prev : [...prev, m]));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user) return;
    setSending(true);
    const content = text.trim();
    setText("");
    const { error } = await supabase
      .from("direct_messages")
      .insert({ conversation_id: conversationId, sender_id: user.id, content });
    if (error) console.error(error);
    setSending(false);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteNav />
      <div className="mx-auto max-w-3xl w-full px-6 pt-4 pb-2">
        <Link to="/messages" className="text-sm text-muted-foreground hover:text-primary">
          ← All conversations
        </Link>
      </div>
      <div className="mx-auto max-w-3xl w-full px-6 flex-1 flex flex-col">
        <div className="bg-surface ring-1 ring-border rounded-3xl flex flex-col flex-1 overflow-hidden">
          <header className="px-6 py-5 border-b border-border flex items-center gap-3">
            <div className="size-10 rounded-full bg-primary/15 text-primary font-semibold flex items-center justify-center">
              {(other?.display_name ?? "?").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="font-display text-xl font-semibold tracking-tight flex items-center gap-2">
                {other?.display_name ?? "Conversation"}
                {other?.is_premium && (
                  <span className="text-[9px] uppercase tracking-widest bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                    Pro
                  </span>
                )}
              </h1>
              <p className="text-xs text-muted-foreground">Direct message · end-to-private</p>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-3 min-h-[50vh] max-h-[60vh]">
            {messages.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">
                No messages yet. Break the ice 👋
              </p>
            )}
            {messages.map((m) => {
              const me = m.sender_id === user.id;
              return (
                <div key={m.id} className={`flex ${me ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] ${
                      me ? "bg-primary text-primary-foreground" : "bg-surface-tint text-foreground"
                    } px-4 py-2.5 rounded-2xl ring-1 ring-border`}
                  >
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
              placeholder={`Message ${other?.display_name ?? ""}`}
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
        </div>
        <div className="h-6" />
      </div>
    </div>
  );
}
