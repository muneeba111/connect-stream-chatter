import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { SiteNav } from "@/components/SiteNav";

export const Route = createFileRoute("/rooms")({
  component: RoomsPage,
  head: () => ({ meta: [{ title: "Rooms — Loophole" }] }),
});

const CATEGORY_STYLE: Record<string, string> = {
  Music: "bg-green-100 text-green-700",
  Tech: "bg-blue-100 text-blue-700",
  Lifestyle: "bg-emerald-100 text-emerald-700",
  Focus: "bg-violet-100 text-violet-700",
  Entertainment: "bg-orange-100 text-orange-700",
  General: "bg-neutral-100 text-neutral-700",
};

function RoomsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const { data: rooms } = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const { data } = await supabase.from("rooms").select("*").order("created_at");
      return data ?? [];
    },
    enabled: !!user,
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-10">
          <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight mb-3">All rooms</h1>
          <p className="text-muted-foreground">Pick a room and start chatting in real-time.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {(rooms ?? []).map((r) => (
            <Link
              key={r.id}
              to="/rooms/$roomId"
              params={{ roomId: r.id }}
              className="group p-6 bg-surface rounded-2xl ring-1 ring-border hover:ring-primary/40 hover:-translate-y-0.5 transition flex flex-col h-48 justify-between"
            >
              <div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${CATEGORY_STYLE[r.category] ?? CATEGORY_STYLE.General}`}>
                  {r.category}
                </span>
                <h3 className="mt-4 text-xl font-medium">{r.name}</h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{r.topic}</p>
              </div>
              <span className="text-sm font-medium text-primary inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Enter room →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
