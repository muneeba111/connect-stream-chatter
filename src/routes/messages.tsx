import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { SiteNav } from "@/components/SiteNav";

export const Route = createFileRoute("/messages")({
  component: MessagesInbox,
});

type ConvRow = {
  id: string;
  user_a: string;
  user_b: string;
  updated_at: string;
};

type ConvItem = ConvRow & {
  other_id: string;
  other_name: string;
  other_premium: boolean;
  last_message?: string;
};

function MessagesInbox() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<ConvItem[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: convs } = await supabase
        .from("conversations")
        .select("id,user_a,user_b,updated_at")
        .order("updated_at", { ascending: false });
      const rows = (convs ?? []) as ConvRow[];
      const otherIds = Array.from(
        new Set(rows.map((c) => (c.user_a === user.id ? c.user_b : c.user_a))),
      );
      const profMap: Record<string, { display_name: string; is_premium: boolean }> = {};
      if (otherIds.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id, display_name, is_premium")
          .in("user_id", otherIds);
        (profs ?? []).forEach((p: any) => {
          profMap[p.user_id] = { display_name: p.display_name, is_premium: p.is_premium };
        });
      }
      // last message per convo
      const lastMap: Record<string, string> = {};
      if (rows.length) {
        const { data: lasts } = await supabase
          .from("direct_messages")
          .select("conversation_id, content, created_at")
          .in("conversation_id", rows.map((r) => r.id))
          .order("created_at", { ascending: false })
          .limit(500);
        (lasts ?? []).forEach((m: any) => {
          if (!lastMap[m.conversation_id]) lastMap[m.conversation_id] = m.content;
        });
      }
      setItems(
        rows.map((c) => {
          const other_id = c.user_a === user.id ? c.user_b : c.user_a;
          const p = profMap[other_id];
          return {
            ...c,
            other_id,
            other_name: p?.display_name ?? "user",
            other_premium: !!p?.is_premium,
            last_message: lastMap[c.id],
          };
        }),
      );
      setBusy(false);
    })();
  }, [user]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteNav />
      <div className="mx-auto max-w-3xl w-full px-6 py-6 flex-1">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-3xl font-semibold tracking-tight">Direct messages</h1>
          <Link to="/rooms" className="text-sm text-muted-foreground hover:text-primary">
            Find people in rooms →
          </Link>
        </div>

        <div className="bg-surface ring-1 ring-border rounded-3xl overflow-hidden">
          {busy ? (
            <p className="p-8 text-center text-sm text-muted-foreground">Loading…</p>
          ) : items.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-muted-foreground mb-4">No conversations yet.</p>
              <Link
                to="/rooms"
                className="inline-block bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-medium hover:bg-primary-dark transition"
              >
                Browse rooms
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((c) => (
                <li key={c.id}>
                  <Link
                    to="/messages/$conversationId"
                    params={{ conversationId: c.id }}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-surface-tint transition"
                  >
                    <div className="size-11 rounded-full bg-primary/15 text-primary font-semibold flex items-center justify-center">
                      {c.other_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{c.other_name}</span>
                        {c.other_premium && (
                          <span className="text-[9px] uppercase tracking-widest bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                            Pro
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {c.last_message ?? "Start the conversation"}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(c.updated_at).toLocaleDateString()}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
