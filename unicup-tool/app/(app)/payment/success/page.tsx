'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type State = 'confirming' | 'success' | 'error';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<State>('confirming');
  const [errorMsg, setErrorMsg] = useState('');
  const confirmed = useRef(false); // prevent double-fire in strict mode

  useEffect(() => {
    if (confirmed.current) return;
    confirmed.current = true;

    const paymentKey = searchParams.get('paymentKey');
    const orderId = searchParams.get('orderId');
    const amount = Number(searchParams.get('amount'));

    if (!paymentKey || !orderId || !amount) {
      setState('error');
      setErrorMsg('결제 정보가 올바르지 않습니다.');
      return;
    }

    (async () => {
      try {
        const res = await fetch('/api/payments/toss/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentKey, orderId, amount }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? '결제 확인에 실패했습니다.');
        }

        setState('success');

        // Redirect to dashboard after 3 seconds
        setTimeout(() => router.push('/'), 3000);
      } catch (e) {
        setState('error');
        setErrorMsg(e instanceof Error ? e.message : '오류가 발생했습니다.');
      }
    })();
  }, [searchParams, router]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center py-12 text-center gap-5">
          {state === 'confirming' && (
            <>
              <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
              <div>
                <h2 className="text-lg font-semibold text-slate-900">결제 확인 중</h2>
                <p className="text-sm text-slate-500 mt-1">잠시만 기다려 주세요...</p>
              </div>
            </>
          )}

          {state === 'success' && (
            <>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Pro 플랜 결제 완료!</h2>
                <p className="text-sm text-slate-500 mt-1">
                  이제 무제한으로 후보지 평가를 저장할 수 있습니다.
                </p>
                <p className="text-xs text-slate-400 mt-3">3초 후 대시보드로 이동합니다...</p>
              </div>
              <Button asChild className="w-full">
                <Link href="/">대시보드로 이동</Link>
              </Button>
            </>
          )}

          {state === 'error' && (
            <>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">결제 처리 실패</h2>
                <p className="text-sm text-red-600 mt-1">{errorMsg}</p>
              </div>
              <div className="flex gap-3 w-full">
                <Button asChild variant="outline" className="flex-1">
                  <Link href="/pricing">요금제로 돌아가기</Link>
                </Button>
                <Button asChild className="flex-1">
                  <Link href="/">대시보드</Link>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
