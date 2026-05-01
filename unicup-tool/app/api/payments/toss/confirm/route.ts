import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// ---------------------------------------------------------------------------
// TODO (production): replace test keys with live keys in your hosting env.
// Test secret key starts with "test_sk_"
// Live secret key starts with "live_sk_"  ← add this to Vercel env vars
// ---------------------------------------------------------------------------
const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY ?? '';
const TOSS_CONFIRM_URL = 'https://api.tosspayments.com/v1/payments/confirm';

export async function POST(request: NextRequest) {
  // 1. Parse body
  let paymentKey: string, orderId: string, amount: number;
  try {
    ({ paymentKey, orderId, amount } = await request.json());
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }

  if (!paymentKey || !orderId || !amount) {
    return NextResponse.json({ error: '필수 파라미터가 누락되었습니다.' }, { status: 400 });
  }

  // 2. Verify session (normal Supabase client via cookies)
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => {
          try { list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); }
          catch { /* server component context */ }
        },
      },
    }
  );
  const { data: { session } } = await supabaseAuth.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  // 3. Confirm with Toss Payments API (server-side only — TOSS_SECRET_KEY never reaches the client)
  const basicAuth = Buffer.from(`${TOSS_SECRET_KEY}:`).toString('base64');
  let tossResponse: Response;
  try {
    tossResponse = await fetch(TOSS_CONFIRM_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });
  } catch {
    return NextResponse.json({ error: '결제 서버 연결에 실패했습니다.' }, { status: 502 });
  }

  if (!tossResponse.ok) {
    const err = await tossResponse.json().catch(() => ({}));
    return NextResponse.json(
      { error: err.message ?? '결제 확인에 실패했습니다.', code: err.code },
      { status: tossResponse.status }
    );
  }

  // 4. Update subscription using service role key (bypasses RLS — client can never do this)
  // TODO (production): replace SUPABASE_SERVICE_ROLE_KEY with your live service role key
  const supabaseAdmin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  const now = new Date().toISOString();
  const { error: upsertError } = await supabaseAdmin
    .from('subscriptions')
    .upsert(
      {
        user_id: session.user.id,
        plan: 'pro',
        status: 'active',
        provider: 'toss',
        payment_key: paymentKey,
        order_id: orderId,
        amount,
        paid_at: now,
        updated_at: now,
      },
      { onConflict: 'user_id' }
    );

  if (upsertError) {
    console.error('Subscription upsert failed:', upsertError);
    return NextResponse.json({ error: '구독 정보 저장에 실패했습니다.' }, { status: 500 });
  }

  return NextResponse.json({ success: true, plan: 'pro' });
}
