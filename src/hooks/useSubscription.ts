import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";

export type SubscriptionRow = {
  id: string;
  status: string;
  price_id: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  stripe_customer_id: string | null;
};

export function useSubscription(userId: string | undefined) {
  const [sub, setSub] = useState<SubscriptionRow | null>(null);
  const [loading, setLoading] = useState(true);

  const env = getStripeEnvironment();

  const fetchSub = async () => {
    if (!userId) {
      setSub(null);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("subscriptions")
      .select("id,status,price_id,current_period_end,cancel_at_period_end,stripe_customer_id")
      .eq("user_id", userId)
      .eq("environment", env)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setSub((data as SubscriptionRow | null) ?? null);
    setLoading(false);
  };

  useEffect(() => {
    fetchSub();
    if (!userId) return;
    const channel = supabase
      .channel(`subs-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${userId}` },
        () => fetchSub(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const isActive = !!sub && (
    (["active", "trialing", "past_due"].includes(sub.status) &&
      (!sub.current_period_end || new Date(sub.current_period_end) > new Date())) ||
    (sub.status === "canceled" && sub.current_period_end && new Date(sub.current_period_end) > new Date())
  );

  return { subscription: sub, isActive: !!isActive, loading, refetch: fetchSub };
}
