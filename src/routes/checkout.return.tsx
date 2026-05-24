import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/checkout/return")({
  validateSearch: (search: Record<string, unknown>): { session_id?: string } => ({
    session_id: typeof search.session_id === "string" ? search.session_id : undefined,
  }),
  component: CheckoutReturn,
});

function CheckoutReturn() {
  const { session_id } = Route.useSearch();
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="font-display text-4xl font-semibold mb-3">You're a Pro member</h1>
        <p className="text-muted-foreground mb-8">
          {session_id ? "Welcome to Loophole Pro — HD video chat is now unlocked." : "All set."}
        </p>
        <Link to="/rooms" className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 transition">
          Jump into a room →
        </Link>
      </div>
    </div>
  );
}
