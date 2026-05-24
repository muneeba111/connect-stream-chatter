import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import chatPreview from "@/assets/chat-preview.jpg";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Loophole — Talk to anyone, anywhere, about anything" },
      { name: "description", content: "A community-driven chat space for hobbyists, late-night thinkers, and creative circles. Real-time rooms, DMs, and premium video chat." },
    ],
  }),
});

const CATEGORY_STYLE: Record<string, string> = {
  Music: "bg-green-100 text-green-700",
  Tech: "bg-blue-100 text-blue-700",
  Lifestyle: "bg-emerald-100 text-emerald-700",
  Focus: "bg-violet-100 text-violet-700",
  Entertainment: "bg-orange-100 text-orange-700",
  General: "bg-neutral-100 text-neutral-700",
};

function Index() {
  const { data: rooms } = useQuery({
    queryKey: ["rooms-preview"],
    queryFn: async () => {
      const { data } = await supabase.from("rooms").select("*").limit(3);
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 pt-16 pb-24">
        <div className="max-w-[70ch]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-tint ring-1 ring-border text-xs font-medium mb-6">
            <span className="size-2 bg-primary rounded-full animate-pulse" />
            12,482 people chatting right now
          </div>
          <h1 className="font-display text-5xl sm:text-7xl font-semibold leading-[0.95] tracking-tight text-balance mb-8">
            Talk to anyone, <span className="text-primary">anywhere</span>, about anything.
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-10 text-pretty max-w-[56ch]">
            A community-driven space for hobbyists, late-night thinkers, and creative circles.
            No algorithms, just human conversation in real-time.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/auth" className="bg-primary text-primary-foreground text-sm font-medium py-3 px-6 rounded-full ring-1 ring-primary hover:bg-primary-dark transition active:scale-95">
              Create Your Account
            </Link>
            <Link to="/rooms" className="bg-surface text-foreground text-sm font-medium py-3 px-6 rounded-full ring-1 ring-border hover:bg-accent transition">
              Explore Public Chat
            </Link>
          </div>
        </div>
      </section>

      {/* Rooms */}
      <section className="bg-surface border-y border-border py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-end justify-between mb-12">
            <div className="max-w-[48ch]">
              <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-balance mb-4">
                Happening right now
              </h2>
              <p className="text-muted-foreground">Join thousands of people across hundreds of active interests.</p>
            </div>
            <Link to="/rooms" className="hidden sm:inline text-sm font-medium text-primary hover:underline">
              See all rooms →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(rooms ?? []).map((r) => (
              <Link
                key={r.id}
                to="/rooms/$roomId"
                params={{ roomId: r.id }}
                className="group p-6 bg-surface-tint rounded-2xl ring-1 ring-border flex flex-col justify-between h-48 hover:ring-primary/40 hover:-translate-y-0.5 transition"
              >
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${CATEGORY_STYLE[r.category] ?? CATEGORY_STYLE.General}`}>
                      {r.category}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">Live</span>
                  </div>
                  <h3 className="text-xl font-medium">{r.name}</h3>
                </div>
                <span className="text-sm font-medium text-primary inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Jump in →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-24 scroll-mt-12">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-balance mb-8">
              Everything you need for genuine connection
            </h2>
            <div className="space-y-8">
              {[
                ["Public Hubs", "Searchable communities indexed by interest. Find your niche in seconds."],
                ["Direct Messages", "Private threads for when the conversation gets personal."],
                ["Media First", "Rich link previews, native image hosting, and seamless voice notes."],
              ].map(([title, body]) => (
                <div key={title} className="flex gap-4">
                  <div className="size-10 rounded-full bg-surface-tint shrink-0 flex items-center justify-center ring-1 ring-border">
                    <div className="size-4 bg-primary rounded-sm" />
                  </div>
                  <div>
                    <h4 className="font-medium text-lg mb-1">{title}</h4>
                    <p className="text-muted-foreground text-pretty max-w-[48ch]">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="w-full aspect-square rounded-3xl ring-1 ring-border overflow-hidden bg-surface">
            <img src={chatPreview} alt="Loophole chat interface preview" className="w-full h-full object-cover" />
          </div>
        </div>
      </section>

      {/* Premium */}
      <section className="bg-ink text-white py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid lg:grid-cols-5 gap-12 items-center">
            <div className="lg:col-span-3">
              <span className="inline-block px-3 py-1 bg-primary rounded-full text-[10px] font-semibold uppercase tracking-wider mb-6">Loophole Pro</span>
              <h2 className="font-display text-4xl sm:text-6xl font-semibold leading-tight text-balance mb-6">
                Face-to-face moments with HD video chat.
              </h2>
              <p className="text-white/60 text-lg text-pretty max-w-[48ch] mb-10">
                Take your community further with high-definition video calls, custom room themes, and priority support.
              </p>
              <ul className="space-y-4 mb-10 text-sm">
                {["100-person video capacity", "Animated profile avatars", "Global custom emoji sets", "Priority room queuing"].map((f) => (
                  <li key={f} className="flex items-center gap-3">
                    <div className="size-4 bg-primary/20 rounded border border-primary/50" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="lg:col-span-2">
              <div className="bg-white/5 p-8 rounded-3xl ring-1 ring-white/10 backdrop-blur">
                <div className="mb-8">
                  <span className="text-white/60 text-sm">Monthly plan</span>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-5xl font-display font-semibold">$8</span>
                    <span className="text-white/50">/mo</span>
                  </div>
                </div>
                <Link to="/premium" className="block text-center w-full bg-white text-ink font-medium py-3 rounded-xl hover:bg-white/90 active:scale-[0.98] mb-4 transition">
                  Go Premium
                </Link>
                <p className="text-[11px] text-center text-white/50">Cancel anytime. No hidden fees.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
