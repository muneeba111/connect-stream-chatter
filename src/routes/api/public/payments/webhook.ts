import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createStripeClient, getWebhookSecret, type StripeEnv } from "@/lib/stripe.server";
import type Stripe from "stripe";

function isValidEnv(v: string | null): v is StripeEnv {
  return v === "sandbox" || v === "live";
}

async function upsertSubscription(env: StripeEnv, sub: Stripe.Subscription) {
  const customerMeta = typeof sub.customer === "object" && !sub.customer.deleted ? sub.customer.metadata : undefined;
  const userId = sub.metadata?.userId || customerMeta?.userId;

  let resolvedUserId = userId;
  if (!resolvedUserId && typeof sub.customer === "string") {
    const stripe = createStripeClient(env);
    const customer = await stripe.customers.retrieve(sub.customer);
    if (!customer.deleted) resolvedUserId = customer.metadata?.userId;
  }
  if (!resolvedUserId) {
    console.warn("No userId on subscription", sub.id);
    return;
  }

  const item = sub.items.data[0];
  const stripe = createStripeClient(env);
  const price = item?.price ? await stripe.prices.retrieve(item.price.id) : null;
  const priceId = price?.lookup_key ?? item?.price?.id ?? null;
  const productId = typeof price?.product === "string" ? price.product : price?.product?.id ?? null;
  const periodEnd = (item as unknown as { current_period_end?: number } | undefined)?.current_period_end;

  await supabaseAdmin.from("subscriptions").upsert(
    {
      user_id: resolvedUserId,
      stripe_customer_id: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
      stripe_subscription_id: sub.id,
      status: sub.status,
      price_id: priceId,
      product_id: productId,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: sub.cancel_at_period_end,
      environment: env,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" },
  );
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const envParam = url.searchParams.get("env");
        if (!isValidEnv(envParam)) return new Response("Invalid env", { status: 400 });
        const env: StripeEnv = envParam;

        const signature = request.headers.get("stripe-signature");
        if (!signature) return new Response("Missing signature", { status: 400 });

        const body = await request.text();
        const stripe = createStripeClient(env);

        let event: Stripe.Event;
        try {
          event = await stripe.webhooks.constructEventAsync(body, signature, getWebhookSecret(env));
        } catch (e) {
          console.error("Webhook signature verification failed", e);
          return new Response("Invalid signature", { status: 401 });
        }

        try {
          switch (event.type) {
            case "checkout.session.completed": {
              const session = event.data.object as Stripe.Checkout.Session;
              if (session.mode === "subscription" && session.subscription) {
                const subId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
                const sub = await stripe.subscriptions.retrieve(subId);
                await upsertSubscription(env, sub);
              }
              break;
            }
            case "customer.subscription.created":
            case "customer.subscription.updated":
            case "customer.subscription.deleted": {
              await upsertSubscription(env, event.data.object as Stripe.Subscription);
              break;
            }
          }
        } catch (e) {
          console.error("Webhook handler error", e);
          return new Response("Handler error", { status: 500 });
        }

        return new Response("ok");
      },
    },
  },
});
