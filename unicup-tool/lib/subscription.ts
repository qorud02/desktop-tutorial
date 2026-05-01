// Client-side subscription helpers (browser only)
import { createClient } from './supabase/client';

export type Plan = 'free' | 'pro';

export interface Subscription {
  id: string;
  userId: string;
  plan: Plan;
  status: string;
  paidAt: string | null;
}

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

/** Client-side: fetch current user's subscription */
export async function getCurrentUserSubscription(): Promise<Subscription | null> {
  const supabase = createClient();
  const { data } = await supabase.from('subscriptions').select('*').single();
  return data ? rowToSubscription(data) : null;
}

/** Client-side: check if current user is on active Pro plan */
export async function isProUser(): Promise<boolean> {
  const sub = await getCurrentUserSubscription();
  return sub?.plan === 'pro' && sub?.status === 'active';
}

export const FREE_EVALUATION_LIMIT = 3;

/** Returns max evaluations allowed for the user's plan */
export async function getEvaluationLimitForUser(): Promise<number> {
  const pro = await isProUser();
  return pro ? Infinity : FREE_EVALUATION_LIMIT;
}
