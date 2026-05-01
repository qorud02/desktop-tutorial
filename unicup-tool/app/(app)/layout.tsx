import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSubscriptionServer } from '@/lib/subscription.server';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import type { Plan } from '@/lib/subscription';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect('/login');

  // Fetch subscription for sidebar badge (defaults to free if no row)
  const subscription = await getSubscriptionServer(session.user.id);
  const plan: Plan =
    subscription?.plan === 'pro' && subscription?.status === 'active' ? 'pro' : 'free';

  return (
    <>
      <Sidebar userEmail={session.user.email ?? ''} plan={plan} />
      <Topbar />
      <main className="ml-60 pt-16 min-h-screen">
        <div className="p-6">{children}</div>
      </main>
    </>
  );
}
