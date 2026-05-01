'use client';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function PaymentFailPage() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code') ?? '';
  const message = searchParams.get('message') ?? '결제가 취소되었거나 실패했습니다.';

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center py-12 text-center gap-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">결제 실패</h2>
            <p className="text-sm text-slate-600 mt-1">{message}</p>
            {code && (
              <p className="text-xs text-slate-400 mt-2 font-mono bg-slate-50 rounded px-2 py-1">
                오류 코드: {code}
              </p>
            )}
          </div>
          <div className="flex gap-3 w-full">
            <Button asChild variant="outline" className="flex-1">
              <Link href="/">대시보드</Link>
            </Button>
            <Button asChild className="flex-1">
              <Link href="/pricing">다시 시도</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
