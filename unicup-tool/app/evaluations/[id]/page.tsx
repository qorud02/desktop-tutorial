'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Edit,
  GitCompare,
  FileText,
  Trash2,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getEvaluation, deleteEvaluation } from '@/lib/storage';
import { formatKRW, formatKRWFull, formatPercent, formatMonths } from '@/lib/utils';
import { AREA_TYPE_LABELS } from '@/lib/types';
import type { Evaluation } from '@/lib/types';

export default function EvaluationResultPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [ev, setEv] = useState<Evaluation | null>(null);

  useEffect(() => {
    const data = getEvaluation(id);
    if (!data) router.push('/evaluations');
    else setEv(data);
  }, [id, router]);

  if (!ev) return <div className="text-slate-400 text-sm">불러오는 중...</div>;

  const { input, result } = ev;

  const handleDelete = () => {
    if (confirm('이 평가를 삭제하시겠습니까?')) {
      deleteEvaluation(id);
      router.push('/evaluations');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900">{input.locationName}</h1>
            <DecisionBadge decision={result.decision} large />
          </div>
          <p className="text-sm text-slate-400 mt-1">
            {AREA_TYPE_LABELS[input.areaType]} ·{' '}
            평가일: {new Date(ev.createdAt).toLocaleDateString('ko-KR')}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button asChild variant="outline" size="sm">
            <Link href={`/evaluations/new?edit=${id}`} className="flex items-center gap-1.5">
              <Edit className="h-3.5 w-3.5" /> 수정
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/evaluations/${id}/scenarios`} className="flex items-center gap-1.5">
              <GitCompare className="h-3.5 w-3.5" /> 시나리오
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href={`/evaluations/${id}/report`} className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" /> 1페이지 리포트
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Risk Badges */}
      <div className="flex gap-2 flex-wrap">
        {result.risks.map((r) => (
          <div
            key={r}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium border ${
              r === '정상 범위'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}
          >
            {r === '정상 범위' ? (
              <CheckCircle className="h-3.5 w-3.5" />
            ) : (
              <AlertCircle className="h-3.5 w-3.5" />
            )}
            {r}
          </div>
        ))}
      </div>

      {/* Score Banner */}
      <Card className="border-[#1e3a5f]/20 bg-[#0f2744] text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-blue-200 text-sm">종합 평가 점수</p>
              <p className="text-5xl font-bold tabular mt-1">{result.totalScore.toFixed(0)}</p>
              <p className="text-blue-300 text-sm mt-1">/ 100점 기준</p>
            </div>
            <div className="flex-1 min-w-48 max-w-sm">
              <div className="h-3 rounded-full bg-white/10">
                <div
                  className="h-3 rounded-full bg-blue-400 transition-all"
                  style={{ width: `${Math.min(result.totalScore, 100)}%` }}
                />
              </div>
              <div className="flex justify-between mt-1 text-xs text-blue-300">
                <span>0</span>
                <span>65 조건부</span>
                <span>80 우선</span>
                <span>100</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-blue-200 text-xs">판정</p>
              <p className="text-2xl font-bold mt-1">{result.decision}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="월 예상매출"
          value={formatKRW(result.monthlyExpectedSales)}
          sub={result.interpretations.monthlyExpectedSales}
          positive={result.monthlyExpectedSales >= 20_000_000}
        />
        <KpiCard
          label="월 영업이익"
          value={formatKRW(result.monthlyOperatingProfit)}
          sub={result.interpretations.monthlyOperatingProfit}
          positive={result.monthlyOperatingProfit > 0}
        />
        <KpiCard
          label="임차료 비율"
          value={formatPercent(result.rentBurdenRatio)}
          sub={result.interpretations.rentBurdenRatio}
          positive={result.rentBurdenRatio <= 0.13}
        />
        <KpiCard
          label="투자 회수기간"
          value={formatMonths(result.paybackPeriod)}
          sub={result.interpretations.paybackPeriod}
          positive={result.paybackPeriod <= 24}
        />
      </div>

      {/* Detail Table */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>손익 계산 상세</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <DetailRow label="월 영업일" value={`${input.operatingDays}일`} />
            <DetailRow label="일 예상 방문객" value={`${input.dailyVisitors.toLocaleString()}명`} />
            <DetailRow label="평균 객단가" value={formatKRWFull(input.avgTransactionValue)} />
            <Separator />
            <DetailRow label="월 예상매출" value={formatKRWFull(result.monthlyExpectedSales)} bold />
            <DetailRow label="매출총이익률" value={`${input.grossMarginRate}%`} />
            <DetailRow label="월 매출총이익" value={formatKRWFull(result.monthlyGrossProfit)} />
            <Separator />
            <DetailRow label="월 임차료" value={`- ${formatKRWFull(input.monthlyRent)}`} />
            <DetailRow label="월 인건비" value={`- ${formatKRWFull(input.monthlyLaborCost)}`} />
            <DetailRow label="기타 고정비" value={`- ${formatKRWFull(input.otherFixedCosts)}`} />
            <Separator />
            <DetailRow
              label="월 영업이익"
              value={formatKRWFull(result.monthlyOperatingProfit)}
              bold
              color={result.monthlyOperatingProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}
            />
            <DetailRow
              label="영업이익률"
              value={formatPercent(result.operatingProfitMargin)}
              color={result.operatingProfitMargin >= 0 ? 'text-emerald-600' : 'text-red-600'}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>손익분기 분석</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <DetailRow
              label="손익분기 일 방문객"
              value={`${result.breakEvenDailyVisitors.toFixed(0)}명/일`}
            />
            <DetailRow
              label="손익분기 일 매출"
              value={formatKRWFull(result.breakEvenDailySales)}
            />
            <DetailRow
              label="현재 대비 여유"
              value={`${(input.dailyVisitors - result.breakEvenDailyVisitors).toFixed(0)}명`}
              color={
                input.dailyVisitors >= result.breakEvenDailyVisitors
                  ? 'text-emerald-600'
                  : 'text-red-600'
              }
            />
            <Separator />
            <DetailRow label="초기 투자비용" value={formatKRWFull(input.initialInvestment)} />
            <DetailRow
              label="투자 회수기간"
              value={formatMonths(result.paybackPeriod)}
              bold
              color={result.paybackPeriod <= 24 ? 'text-emerald-600' : 'text-red-600'}
            />
            <Separator />
            <DetailRow label="임차료 비율" value={formatPercent(result.rentBurdenRatio)} />
            <DetailRow label="임차료 평가" value={result.interpretations.rentBurdenRatio} />
            <Separator />
            <div className="py-3">
              <p className="text-xs text-slate-500 mb-2">정성 점수 (1-5)</p>
              <div className="grid grid-cols-2 gap-2">
                <ScoreItem label="전면 가시성" score={input.frontVisibilityScore} />
                <ScoreItem label="유동/접근성" score={input.trafficAccessibilityScore} />
                <ScoreItem label="B2B 잠재력" score={input.groupOrderScore} />
                <ScoreItem label="운영 용이성" score={input.operationDifficultyScore} />
              </div>
            </div>
            <DetailRow label="인근 카페 수" value={`${input.nearbyCafes}개`} />
          </CardContent>
        </Card>
      </div>

      {input.locationMemo && (
        <Card>
          <CardHeader>
            <CardTitle>현장 메모</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 whitespace-pre-wrap">{input.locationMemo}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Button asChild variant="outline">
          <Link href={`/evaluations/${id}/scenarios`}>
            <GitCompare className="h-4 w-4 mr-2" /> 시나리오 비교 보기
          </Link>
        </Button>
        <Button asChild>
          <Link href={`/evaluations/${id}/report`}>
            <FileText className="h-4 w-4 mr-2" /> 1페이지 리포트 생성
          </Link>
        </Button>
      </div>
    </div>
  );
}

function DecisionBadge({ decision, large }: { decision: string; large?: boolean }) {
  const size = large ? 'px-3 py-1 text-sm' : 'px-2.5 py-0.5 text-xs';
  if (decision === '우선검토')
    return <span className={`${size} rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold`}>{decision}</span>;
  if (decision === '조건부검토')
    return <span className={`${size} rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold`}>{decision}</span>;
  return <span className={`${size} rounded-full bg-red-50 text-red-700 border border-red-200 font-semibold`}>{decision}</span>;
}

function KpiCard({
  label,
  value,
  sub,
  positive,
}: {
  label: string;
  value: string;
  sub: string;
  positive: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-slate-500">{label}</p>
        <p className={`text-xl font-bold mt-1 tabular ${positive ? 'text-slate-900' : 'text-red-600'}`}>
          {value}
        </p>
        <p className={`text-xs mt-1 ${positive ? 'text-emerald-600' : 'text-red-500'}`}>{sub}</p>
      </CardContent>
    </Card>
  );
}

function DetailRow({
  label,
  value,
  bold,
  color,
}: {
  label: string;
  value: string;
  bold?: boolean;
  color?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className={`text-sm tabular ${bold ? 'font-semibold' : ''} ${color ?? 'text-slate-800'}`}>
        {value}
      </span>
    </div>
  );
}

function ScoreItem({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-500">{label}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <div
            key={n}
            className={`w-3 h-3 rounded-sm ${n <= score ? 'bg-[#1e3a5f]' : 'bg-slate-100'}`}
          />
        ))}
      </div>
    </div>
  );
}
