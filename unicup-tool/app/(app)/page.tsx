'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  PlusCircle,
  TrendingUp,
  Store,
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getEvaluations } from '@/lib/storage';
import { formatKRW } from '@/lib/utils';
import type { Evaluation } from '@/lib/types';
import { AREA_TYPE_LABELS } from '@/lib/types';

function DecisionBadge({ decision }: { decision: string }) {
  if (decision === '우선검토') return <Badge variant="priority">{decision}</Badge>;
  if (decision === '조건부검토') return <Badge variant="conditional">{decision}</Badge>;
  return <Badge variant="hold">{decision}</Badge>;
}

export default function DashboardPage() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);

  useEffect(() => {
    getEvaluations().then(setEvaluations);
  }, []);

  const total = evaluations.length;
  const priority = evaluations.filter((e) => e.result.decision === '우선검토').length;
  const conditional = evaluations.filter((e) => e.result.decision === '조건부검토').length;
  const hold = evaluations.filter((e) => e.result.decision === '보류').length;
  const avgSales =
    total > 0
      ? evaluations.reduce((s, e) => s + e.result.monthlyExpectedSales, 0) / total
      : 0;
  const avgProfit =
    total > 0
      ? evaluations.reduce((s, e) => s + e.result.monthlyOperatingProfit, 0) / total
      : 0;

  const recent = [...evaluations]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  const kpis = [
    { label: '전체 평가', value: `${total}건`, Icon: Store, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: '평균 월매출', value: formatKRW(avgSales), Icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    {
      label: '평균 영업이익',
      value: avgProfit < 0 ? `-${formatKRW(Math.abs(avgProfit))}` : formatKRW(avgProfit),
      Icon: TrendingUp,
      color: avgProfit >= 0 ? 'text-emerald-600' : 'text-red-600',
      bg: avgProfit >= 0 ? 'bg-emerald-50' : 'bg-red-50',
    },
    { label: '우선검토', value: `${priority}건`, Icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: '조건부검토', value: `${conditional}건`, Icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: '보류', value: `${hold}건`, Icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">입지 평가 대시보드</h1>
          <p className="text-sm text-slate-500 mt-1">유니컵 프랜차이즈 후보 입지 현황 요약</p>
        </div>
        <Button asChild>
          <Link href="/evaluations/new" className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            신규 평가 시작
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <div className={`inline-flex rounded-lg p-2 ${k.bg} mb-3`}>
                <k.Icon className={`h-4 w-4 ${k.color}`} />
              </div>
              <p className="text-xs text-slate-500">{k.label}</p>
              <p className={`text-xl font-bold mt-1 tabular ${k.color}`}>{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {total === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Store className="h-12 w-12 text-slate-200 mb-4" />
            <h3 className="font-semibold text-slate-600 text-lg">저장된 평가가 없습니다</h3>
            <p className="text-sm text-slate-400 mt-2">
              신규 평가를 시작하여 후보 입지를 분석해보세요.
            </p>
            <Button asChild className="mt-5">
              <Link href="/evaluations/new">첫 평가 시작하기</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>최근 평가 내역</CardTitle>
            <Link
              href="/evaluations"
              className="text-xs text-blue-600 hover:underline flex items-center gap-0.5"
            >
              전체 보기 <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {recent.map((e) => (
                <Link
                  key={e.id}
                  href={`/evaluations/${e.id}`}
                  className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{e.input.locationName}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {AREA_TYPE_LABELS[e.input.areaType]} ·{' '}
                      {new Date(e.createdAt).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-5">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-semibold text-slate-800 tabular">
                        {formatKRW(e.result.monthlyExpectedSales)}
                      </p>
                      <p
                        className={`text-xs tabular ${
                          e.result.monthlyOperatingProfit >= 0
                            ? 'text-emerald-600'
                            : 'text-red-500'
                        }`}
                      >
                        영업이익{' '}
                        {e.result.monthlyOperatingProfit >= 0 ? '+' : ''}
                        {formatKRW(e.result.monthlyOperatingProfit)}
                      </p>
                    </div>
                    <div className="text-right hidden md:block w-16">
                      <p className="text-xs text-slate-400">종합점수</p>
                      <p className="text-sm font-bold text-[#1e3a5f] tabular">
                        {e.result.totalScore.toFixed(0)}점
                      </p>
                    </div>
                    <DecisionBadge decision={e.result.decision} />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
