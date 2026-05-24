import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { SiteNav } from "@/components/SiteNav";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({ meta: [{ title: "Sign in — Loophole" }] }),
});

function AuthPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/rooms" });
  }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/rooms`,
            data: { display_name: displayName || email.split("@")[0] },
          },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e: any) {
      setErr(e.message ?? "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="mx-auto max-w-md px-6 py-16">
        <h1 className="font-display text-4xl font-semibold mb-2">
          {mode === "signup" ? "Join the conversation" : "Welcome back"}
        </h1>
        <p className="text-muted-foreground mb-8">
          {mode === "signup" ? "Create a free account to start chatting." : "Sign in to jump back into your rooms."}
        </p>

        <form onSubmit={submit} className="space-y-4 bg-surface p-6 rounded-2xl ring-1 ring-border">
          {mode === "signup" && (
            <div>
              <label className="block text-sm font-medium mb-1">Display name</label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="MidnightVinyl"
                className="w-full px-4 py-3 rounded-xl bg-background ring-1 ring-border focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-background ring-1 ring-border focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-background ring-1 ring-border focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
          {err && <p className="text-sm text-destructive">{err}</p>}
          <button
            disabled={busy}
            className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-medium hover:bg-primary-dark transition disabled:opacity-50"
          >
            {busy ? "..." : mode === "signup" ? "Create account" : "Sign in"}
          </button>
        </form>

        <p className="text-sm text-muted-foreground mt-6 text-center">
          {mode === "signup" ? "Already have an account?" : "New to Loophole?"}{" "}
          <button onClick={() => setMode(mode === "signup" ? "signin" : "signup")} className="text-primary font-medium hover:underline">
            {mode === "signup" ? "Sign in" : "Create one"}
          </button>
        </p>
        <p className="text-xs text-muted-foreground mt-4 text-center">
          <Link to="/" className="hover:text-primary">← Back home</Link>
        </p>
      </div>
    </div>
  );
}
