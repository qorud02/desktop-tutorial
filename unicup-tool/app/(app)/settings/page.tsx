'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { User, CreditCard, Shield, Zap, ChevronRight, LogOut } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { createClient } from '@/lib/supabase/client';
import { getCurrentUserSubscription } from '@/lib/subscription';
import { useRouter } from 'next/navigation';
import type { Subscription } from '@/lib/subscription';

export default function SettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setEmail(user.email ?? '');
      const sub = await getCurrentUserSubscription();
      setSubscription(sub);
      setLoading(false);
    })();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const isPro = subscription?.plan === 'pro' && subscription?.status === 'active';

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">설정</h1>
        <p className="text-sm text-slate-500 mt-1">계정 정보 및 요금제를 확인합니다.</p>
      </div>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4 text-slate-500" />
            계정 정보
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          <div className="flex items-center justify-between py-3 border-b border-slate-50">
            <div>
              <p className="text-sm font-medium text-slate-700">이메일</p>
              <p className="text-sm text-slate-500 mt-0.5">{loading ? '불러오는 중...' : email}</p>
            </div>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-slate-700">계정 유형</p>
              <p className="text-sm text-slate-500 mt-0.5">이메일/비밀번호</p>
            </div>
            <Shield className="h-4 w-4 text-slate-300" />
          </div>
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4 text-slate-500" />
            요금제
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          <div className="flex items-center justify-between py-3 border-b border-slate-50">
            <div>
              <p className="text-sm font-medium text-slate-700">현재 플랜</p>
              {loading ? (
                <p className="text-sm text-slate-400 mt-0.5">불러오는 중...</p>
              ) : isPro ? (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Zap className="h-3.5 w-3.5 text-blue-600" />
                  <p className="text-sm font-semibold text-blue-700">Pro 플랜 (활성)</p>
                </div>
              ) : (
                <p className="text-sm text-slate-500 mt-0.5">Free 플랜 · 최대 3개 평가</p>
              )}
            </div>
            {!isPro && (
              <Button asChild size="sm" className="gap-1.5">
                <Link href="/pricing">
                  <Zap className="h-3.5 w-3.5" />
                  업그레이드
                </Link>
              </Button>
            )}
          </div>

          {isPro && subscription?.paidAt && (
            <div className="flex items-center justify-between py-3 border-b border-slate-50">
              <div>
                <p className="text-sm font-medium text-slate-700">결제일</p>
                <p className="text-sm text-slate-500 mt-0.5">
                  {new Date(subscription.paidAt).toLocaleDateString('ko-KR', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between py-3">
            <p className="text-sm text-slate-700">요금제 상세 보기</p>
            <Link href="/pricing" className="flex items-center gap-0.5 text-sm text-blue-600 hover:underline">
              요금제 페이지 <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Free plan feature table */}
      {!isPro && !loading && (
        <Card className="border-amber-100 bg-amber-50/40">
          <CardContent className="p-5">
            <p className="text-sm font-semibold text-amber-800 mb-3">Free → Pro 비교</p>
            <div className="space-y-2">
              {[
                ['후보지 평가 저장', '최대 3개', '무제한'],
                ['자동 수익성 계산', '✅', '✅'],
                ['1페이지 리포트', '✅', '✅'],
                ['시나리오 비교', '✅', '✅'],
                ['CSV 내보내기', '✅', '✅'],
                ['요금', '무료', '₩29,000/월'],
              ].map(([feature, free, pro]) => (
                <div key={feature} className="grid grid-cols-3 gap-2 text-xs">
                  <span className="text-slate-600 font-medium">{feature}</span>
                  <span className="text-slate-500">{free}</span>
                  <span className="text-blue-700 font-semibold">{pro}</span>
                </div>
              ))}
            </div>
            <Button asChild className="w-full mt-4 gap-1.5">
              <Link href="/pricing">
                <Zap className="h-4 w-4" /> Pro로 업그레이드 (₩29,000/월)
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Sign out */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={handleSignOut} className="text-red-600 border-red-200 hover:bg-red-50 gap-2">
          <LogOut className="h-4 w-4" />
          로그아웃
        </Button>
      </div>
    </div>
  );
}
