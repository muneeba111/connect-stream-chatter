import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { useAuth } from "@/lib/auth";
import { useSubscription } from "@/hooks/useSubscription";
import { createPortalSession } from "@/lib/payments.functions";
import { getStripeEnvironment } from "@/lib/stripe";

export const Route = createFileRoute("/premium")({
  component: Premium,
  head: () => ({
    meta: [
      { title: "Loophole Pro — HD video chat & more" },
      { name: "description", content: "Upgrade to Loophole Pro for HD video chat, 100-person rooms, animated avatars, and priority support." },
    ],
  }),
});

function Premium() {
  const { user } = useAuth();
  const { isActive } = useSubscription(user?.id);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const navigate = useNavigate();
  const portalFn = useServerFn(createPortalSession);

  const handleUpgrade = () => {
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    setCheckoutOpen(true);
  };

  const handlePortal = async () => {
    const url = await portalFn({ data: { environment: getStripeEnvironment(), returnUrl: window.location.href } });
    window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen bg-background">
      <PaymentTestModeBanner />
      <SiteNav />
      <section className="bg-ink text-white py-24">
        <div className="mx-auto max-w-5xl px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-block px-3 py-1 bg-primary rounded-full text-[10px] font-semibold uppercase tracking-wider mb-6">Loophole Pro</span>
            <h1 className="font-display text-5xl sm:text-6xl font-semibold leading-tight text-balance mb-6">
              Face-to-face moments with HD video chat.
            </h1>
            <p className="text-white/60 text-lg text-pretty max-w-[48ch] mb-8">
              Premium members unlock real-time video, animated avatars, and the loudest room badges in town.
            </p>
            <ul className="space-y-3 text-sm">
              {["HD video chat in any room","100-person video capacity","Animated profile avatars","Global custom emoji sets","Priority room queuing","Priority support"].map((f) => (
                <li key={f} className="flex items-center gap-3">
                  <div className="size-4 bg-primary/20 rounded border border-primary/50" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white/5 p-8 rounded-3xl ring-1 ring-white/10">
            <div className="mb-8">
              <span className="text-white/60 text-sm">Monthly plan</span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-6xl font-display font-semibold">$8</span>
                <span className="text-white/50">/mo</span>
              </div>
            </div>
            {isActive ? (
              <>
                <div className="text-center py-3 rounded-xl bg-primary/20 text-primary ring-1 ring-primary/40 mb-3">
                  You're a Pro member ✨
                </div>
                <button onClick={handlePortal} className="w-full bg-white text-ink font-medium py-3 rounded-xl hover:opacity-90">
                  Manage subscription
                </button>
              </>
            ) : (
              <button
                onClick={handleUpgrade}
                className="w-full bg-primary text-primary-foreground font-medium py-3 rounded-xl mb-3 hover:opacity-90"
              >
                {user ? "Upgrade to Pro" : "Sign in to upgrade"}
              </button>
            )}
            {!user && (
              <Link to="/auth" className="block text-center text-sm text-white/70 hover:text-white">
                Create an account first →
              </Link>
            )}
            <p className="text-[11px] text-center text-white/50 mt-4">Cancel anytime. No hidden fees.</p>
          </div>
        </div>
      </section>

      {checkoutOpen && user && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-start justify-center overflow-y-auto py-10 px-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="font-display text-xl font-semibold">Complete your upgrade</h2>
              <button onClick={() => setCheckoutOpen(false)} className="text-muted-foreground hover:text-foreground text-2xl leading-none">×</button>
            </div>
            <StripeEmbeddedCheckout
              priceId="loophole_pro_monthly"
              userId={user.id}
              customerEmail={user.email}
              returnUrl={`${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`}
            />
          </div>
        </div>
      )}

      <SiteFooter />
    </div>
  );
}
