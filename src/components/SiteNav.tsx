import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";

export function SiteNav() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="mx-auto max-w-7xl px-6 py-6 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2 group">
        <div className="size-8 bg-primary rounded-lg ring-1 ring-black/5 group-hover:rotate-6 transition-transform" />
        <span className="font-display text-xl font-semibold tracking-tight">Loophole</span>
      </Link>
      <div className="hidden sm:flex items-center gap-8 text-sm font-medium text-muted-foreground">
        <Link to="/rooms" className="hover:text-primary transition-colors">Rooms</Link>
        <Link to="/messages" className="hover:text-primary transition-colors">Messages</Link>
        <Link to="/" hash="features" className="hover:text-primary transition-colors">Features</Link>
        <Link to="/premium" className="hover:text-primary transition-colors">Premium</Link>
      </div>
      {user ? (
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-sm text-muted-foreground">
            {profile?.display_name ?? "you"}
            {profile?.is_premium && (
              <span className="ml-2 text-[10px] uppercase tracking-widest bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Pro</span>
            )}
          </span>
          <button
            onClick={async () => { await signOut(); navigate({ to: "/" }); }}
            className="bg-foreground text-background text-sm font-medium py-2 px-4 rounded-full hover:opacity-90 transition"
          >Sign out</button>
        </div>
      ) : (
        <Link
          to="/auth"
          className="bg-primary text-primary-foreground text-sm font-medium py-2 px-4 rounded-full ring-1 ring-primary hover:bg-primary-dark active:scale-95 transition"
        >Get Started</Link>
      )}
    </nav>
  );
}
