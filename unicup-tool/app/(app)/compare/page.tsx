'use client';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { BarChart2, CheckSquare, Square, ChevronRight, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getEvaluations } from '@/lib/storage';
import { formatKRW, formatPercent, formatMonths } from '@/lib/utils';
import { AREA_TYPE_LABELS } from '@/lib/types';
import type { Evaluation } from '@/lib/types';

const MAX_COMPARE = 3;

function DecisionColor(decision: string) {
  if (decision === '우선검토') return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (decision === '조건부검토') return 'text-amber-700 bg-amber-50 border-amber-200';
  return 'text-red-700 bg-red-50 border-red-200';
}

function Good({ ok }: { ok: boolean }) {
  return <span className={ok ? 'text-emerald-500' : 'text-red-500'}>{ok ? '✓' : '✗'}</span>;
}

export default function ComparePage() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEvaluations().then((data) => { setEvaluations(data); setLoading(false); });
  }, []);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); return next; }
      if (next.size >= MAX_COMPARE) return prev;
      next.add(id);
      return next;
    });
  };

  const compared = useMemo(
    () => evaluations.filter((e) => selected.has(e.id)),
    [evaluations, selected]
  );

  const sorted = useMemo(
    () => [...evaluations].sort((a, b) => b.result.totalScore - a.result.totalScore),
    [evaluations]
  );

  const rows: { label: string; getValue: (e: Evaluation) => string; isGood: (e: Evaluation) => boolean }[] = [
    {
      label: '종합 점수',
      getValue: (e) => `${e.result.totalScore.toFixed(0)}점`,
      isGood: (e) => e.result.totalScore >= 80,
    },
    {
      label: '판정',
      getValue: (e) => e.result.decision,
      isGood: (e) => e.result.decision === '우선검토',
    },
    {
      label: '월 예상매출',
      getValue: (e) => formatKRW(e.result.monthlyExpectedSales),
      isGood: (e) => e.result.monthlyExpectedSales >= 20_000_000,
    },
    {
      label: '월 영업이익',
      getValue: (e) => formatKRW(e.result.monthlyOperatingProfit),
      isGood: (e) => e.result.monthlyOperatingProfit > 0,
    },
    {
      label: '영업이익률',
      getValue: (e) => formatPercent(e.result.operatingProfitMargin),
      isGood: (e) => e.result.operatingProfitMargin >= 0.1,
    },
    {
      label: '임차료 비율',
      getValue: (e) => formatPercent(e.result.rentBurdenRatio),
      isGood: (e) => e.result.rentBurdenRatio <= 0.13,
    },
    {
      label: '투자회수기간',
      getValue: (e) => formatMonths(e.result.paybackPeriod),
      isGood: (e) => e.result.paybackPeriod <= 24,
    },
    {
      label: '손익분기 일방문객',
      getValue: (e) => `${e.result.breakEvenDailyVisitors.toFixed(0)}명`,
      isGood: (e) => e.input.dailyVisitors >= e.result.breakEvenDailyVisitors,
    },
    {
      label: '상권 유형',
      getValue: (e) => AREA_TYPE_LABELS[e.input.areaType],
      isGood: () => true,
    },
    {
      label: '인근 카페 수',
      getValue: (e) => `${e.input.nearbyCafes}개`,
      isGood: (e) => e.input.nearbyCafes <= 7,
    },
    {
      label: '월 임차료',
      getValue: (e) => formatKRW(e.input.monthlyRent),
      isGood: (e) => e.result.rentBurdenRatio <= 0.13,
    },
    {
      label: '초기 투자비용',
      getValue: (e) => formatKRW(e.input.initialInvestment),
      isGood: (e) => e.result.paybackPeriod <= 24,
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">후보지 비교 분석</h1>
          <p className="text-sm text-slate-500 mt-1">
            최대 {MAX_COMPARE}개 후보지를 선택하여 핵심 지표를 나란히 비교하세요.
          </p>
        </div>
      </div>

      {/* Selection panel */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <BarChart2 className="h-4 w-4 text-blue-600" />
            비교할 평가 선택
            <span className="ml-auto text-xs font-normal text-slate-400">
              {selected.size}/{MAX_COMPARE}개 선택됨
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <p className="text-sm text-slate-400">불러오는 중...</p>
          ) : sorted.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-slate-400">저장된 평가가 없습니다.</p>
              <Button asChild className="mt-3">
                <Link href="/evaluations/new">신규 평가 시작</Link>
              </Button>
            </div>
          ) : (
            sorted.map((e) => {
              const isSelected = selected.has(e.id);
              const disabled = !isSelected && selected.size >= MAX_COMPARE;
              return (
                <button
                  key={e.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => toggle(e.id)}
                  className={`w-full flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-all ${
                    isSelected
                      ? 'border-blue-300 bg-blue-50'
                      : disabled
                        ? 'border-slate-100 bg-slate-50 opacity-40 cursor-not-allowed'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {isSelected
                    ? <CheckSquare className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    : <Square className="h-4 w-4 text-slate-300 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{e.input.locationName}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {AREA_TYPE_LABELS[e.input.areaType]} · {new Date(e.createdAt).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-sm font-bold text-[#1e3a5f] tabular hidden sm:block">
                      {e.result.totalScore.toFixed(0)}점
                    </span>
                    <span className={`text-xs font-semibold rounded-full border px-2 py-0.5 ${DecisionColor(e.result.decision)}`}>
                      {e.result.decision}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Comparison table */}
      {compared.length >= 2 ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">비교 결과</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-3 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider w-40">항목</th>
                  {compared.map((e) => (
                    <th key={e.id} className="text-center py-3 px-4 min-w-44">
                      <Link
                        href={`/evaluations/${e.id}`}
                        className="group flex flex-col items-center gap-1"
                      >
                        <span className="font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">
                          {e.input.locationName}
                        </span>
                        <span className={`text-xs font-semibold rounded-full border px-2 py-0.5 ${DecisionColor(e.result.decision)}`}>
                          {e.result.decision}
                        </span>
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.map((row) => {
                  const values = compared.map((e) => row.getValue(e));
                  const best = row.label === '종합 점수'
                    ? Math.max(...compared.map((e) => e.result.totalScore)).toFixed(0) + '점'
                    : null;

                  return (
                    <tr key={row.label} className="hover:bg-slate-50/50">
                      <td className="py-3 px-6 text-xs text-slate-500 font-medium">{row.label}</td>
                      {compared.map((e, i) => {
                        const val = values[i];
                        const good = row.isGood(e);
                        const isBest = best !== null && val === best;
                        return (
                          <td key={e.id} className="py-3 px-4 text-center">
                            <span className={`tabular font-medium ${
                              isBest ? 'text-blue-700' : good ? 'text-slate-800' : 'text-red-600'
                            }`}>
                              {val}
                            </span>
                            {row.label !== '상권 유형' && row.label !== '판정' && (
                              <span className="ml-1.5">
                                <Good ok={good} />
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Risk summary */}
            <div className="px-6 py-4 border-t border-slate-100 grid gap-3"
              style={{ gridTemplateColumns: `160px repeat(${compared.length}, 1fr)` }}>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider self-start pt-1">주요 리스크</p>
              {compared.map((e) => {
                const risks = e.result.risks.filter((r) => r !== '정상 범위');
                return (
                  <div key={e.id} className="space-y-1">
                    {risks.length === 0 ? (
                      <span className="text-xs text-emerald-600 font-medium">✓ 정상 범위</span>
                    ) : (
                      risks.map((r) => (
                        <div key={r} className="flex items-center gap-1 text-xs text-red-600">
                          <AlertCircle className="h-3 w-3 flex-shrink-0" /> {r}
                        </div>
                      ))
                    )}
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="px-6 py-4 border-t border-slate-100 grid gap-3"
              style={{ gridTemplateColumns: `160px repeat(${compared.length}, 1fr)` }}>
              <div />
              {compared.map((e) => (
                <div key={e.id} className="flex flex-col gap-2">
                  <Button asChild size="sm" variant="outline" className="w-full">
                    <Link href={`/evaluations/${e.id}`} className="flex items-center gap-1.5">
                      결과 보기 <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="w-full">
                    <Link href={`/evaluations/${e.id}/report`}>리포트</Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : selected.size === 1 ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
          <p className="text-sm text-slate-400">평가를 1개 더 선택하면 비교 결과가 표시됩니다.</p>
        </div>
      ) : null}
    </div>
  );
}
