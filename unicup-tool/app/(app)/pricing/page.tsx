'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Zap, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { getCurrentUserSubscription } from '@/lib/subscription';
import type { Subscription } from '@/lib/subscription';

// ---------------------------------------------------------------------------
// TODO (production): set NEXT_PUBLIC_TOSS_CLIENT_KEY to your live client key
// Test key starts with "test_ck_"  |  Live key starts with "live_ck_"
// ---------------------------------------------------------------------------

const PRO_AMOUNT = 29_000; // KRW

const FREE_FEATURES = [
  '최대 3개 후보지 평가 저장',
  '자동 수익성 계산',
  '1페이지 의사결정 리포트',
  '기본 시나리오 비교',
];

const PRO_FEATURES = [
  '무제한 후보지 평가 저장',
  '자동 수익성 계산',
  '1페이지 의사결정 리포트',
  '전체 시나리오 비교',
  '우선 기술 지원',
  '팀/어드민 기능 (출시 예정)',
];

export default function PricingPage() {
  const router = useRouter();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
        setUserEmail(session.user.email ?? '');
      }
      const sub = await getCurrentUserSubscription();
      setSubscription(sub);
      setLoading(false);
    })();
  }, []);

  const isPro = subscription?.plan === 'pro' && subscription?.status === 'active';

  const handleProPayment = async () => {
    setError('');
    const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;

    if (!clientKey) {
      setError('결제 키가 설정되지 않았습니다. .env.local을 확인하세요.');
      return;
    }

    setPaying(true);
    try {
      // Dynamic import — Toss SDK is browser-only
      const { loadTossPayments } = await import('@tosspayments/tosspayments-sdk');
      // TODO (production): use live_ck_... key here for real billing
      const tossPayments = await loadTossPayments(clientKey);

      // customerKey must be stable per user (not per session)
      const payment = tossPayments.payment({ customerKey: userId });

      const orderId = `unicup-pro-${userId.slice(0, 8)}-${Date.now()}`;

      await payment.requestPayment({
        method: 'CARD',
        amount: { currency: 'KRW', value: PRO_AMOUNT },
        orderId,
        orderName: 'Unicup Pro 플랜 (월간)',
        successUrl: `${appUrl}/payment/success`,
        failUrl: `${appUrl}/payment/fail`,
        customerEmail: userEmail,
        customerName: '고객',
        card: {
          useEscrow: false,
          flowMode: 'DEFAULT',
          useCardPoint: false,
          useAppCardOnly: false,
        },
      });
      // requestPayment navigates away — code below won't run on success
    } catch (e: unknown) {
      if (e instanceof Error && e.message?.includes('PAY_PROCESS_CANCELED')) {
        setError('결제가 취소되었습니다.');
      } else {
        setError('결제 창을 여는 데 실패했습니다. 잠시 후 다시 시도해 주세요.');
      }
      setPaying(false);
    }
  };

  if (loading) return <div className="text-slate-400 text-sm">불러오는 중...</div>;

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">요금제</h1>
        <p className="text-sm text-slate-500 mt-1">
          유니컵 입지분석 시스템의 플랜을 선택하세요.
        </p>
      </div>

      {/* Test mode notice */}
      <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
        <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <span className="font-semibold">현재는 테스트 결제 모드입니다.</span>
          {' '}실제 과금 전환 전 별도 PG 계약과 운영 검수가 필요합니다.
          테스트 카드 번호: <code className="font-mono bg-amber-100 px-1 rounded">4242 4242 4242 4242</code>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 max-w-2xl">
        {/* Free Plan */}
        <Card className={`relative ${!isPro ? 'border-[#1e3a5f]/40 ring-2 ring-[#1e3a5f]/20' : ''}`}>
          {!isPro && (
            <div className="absolute -top-3 left-4">
              <span className="bg-slate-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                현재 플랜
              </span>
            </div>
          )}
          <CardHeader className="pt-7">
            <CardTitle>Free</CardTitle>
            <CardDescription>소규모 평가에 적합</CardDescription>
            <div className="mt-2">
              <span className="text-3xl font-bold text-slate-900">₩0</span>
              <span className="text-sm text-slate-400 ml-1">/ 월</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                  <Check className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            <Button variant="outline" className="w-full" disabled>
              {!isPro ? '현재 플랜' : '다운그레이드'}
            </Button>
          </CardContent>
        </Card>

        {/* Pro Plan */}
        <Card className={`relative ${isPro ? 'border-[#1e3a5f]/40 ring-2 ring-[#1e3a5f]/20' : 'border-blue-200'}`}>
          <div className="absolute -top-3 left-4">
            {isPro ? (
              <span className="bg-[#1e3a5f] text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                현재 플랜
              </span>
            ) : (
              <span className="bg-blue-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                추천
              </span>
            )}
          </div>
          <CardHeader className="pt-7">
            <CardTitle className="flex items-center gap-2">
              Pro <Zap className="h-4 w-4 text-blue-600" />
            </CardTitle>
            <CardDescription>프랜차이즈 본사 운영팀용</CardDescription>
            <div className="mt-2">
              <span className="text-3xl font-bold text-slate-900">
                ₩{PRO_AMOUNT.toLocaleString('ko-KR')}
              </span>
              <span className="text-sm text-slate-400 ml-1">/ 월</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                  <Check className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>

            {isPro ? (
              <Button className="w-full" disabled>
                Pro 플랜 이용 중
              </Button>
            ) : (
              <Button className="w-full" onClick={handleProPayment} disabled={paying}>
                {paying ? '결제 창 여는 중...' : 'Pro 플랜 테스트 결제'}
              </Button>
            )}

            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                {error}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-slate-400">
        결제 관련 문의: 유니컵 본사 운영팀 · 내부 전용 시스템
      </p>
    </div>
  );
}
