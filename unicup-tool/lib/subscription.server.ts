// Server-side subscription helpers (uses next/headers — do NOT import in client components)
import { createClient } from './supabase/server';
import type { Plan, Subscription } from './subscription';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToSubscription(row: any): Subscription {
  return {
    id: row.id,
    userId: row.user_id,
    plan: row.plan as Plan,
    status: row.status,
    paidAt: row.paid_at,
  };
}

/** Server-side: fetch subscription for a given userId */
export async function getSubscriptionServer(userId: string): Promise<Subscription | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();
  return data ? rowToSubscription(data) : null;
}
