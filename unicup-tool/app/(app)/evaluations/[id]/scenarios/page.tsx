'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getEvaluation } from '@/lib/storage';
import { formatKRW, formatKRWFull, formatPercent, formatMonths } from '@/lib/utils';
import type { Evaluation, ScenarioResult } from '@/lib/types';

export default function ScenariosPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [ev, setEv] = useState<Evaluation | null>(null);

  useEffect(() => {
    getEvaluation(id).then((data) => {
      if (!data) router.push('/evaluations');
      else setEv(data);
    });
  }, [id, router]);

  if (!ev) return <div className="text-slate-400 text-sm">불러오는 중...</div>;

  const { scenarios } = ev;
  const base = scenarios.find((s) => s.name === 'base')!;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
            <Link href={`/evaluations/${id}`} className="hover:text-slate-600">
              {ev.input.locationName}
            </Link>
            <span>/</span>
            <span>시나리오 비교</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">시나리오 비교 분석</h1>
          <p className="text-sm text-slate-500 mt-1">
            보수적·기본·공격적 3가지 시나리오로 수익성을 비교합니다.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/evaluations/${id}`}>
              <ArrowLeft className="h-3.5 w-3.5 mr-1" /> 결과로 돌아가기
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href={`/evaluations/${id}/report`}>
              <FileText className="h-3.5 w-3.5 mr-1" /> 리포트
            </Link>
          </Button>
        </div>
      </div>

      {/* Scenario Assumption Header */}
      <div className="grid grid-cols-3 gap-4">
        {scenarios.map((s) => (
          <ScenarioHeaderCard key={s.name} scenario={s} isBase={s.name === 'base'} />
        ))}
      </div>

      {/* Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>시나리오별 주요 지표 비교</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left text-xs text-slate-500 font-medium px-5 py-3 w-40">지표</th>
                  {scenarios.map((s) => (
                    <th
                      key={s.name}
                      className={`text-right text-xs font-semibold px-5 py-3 ${
                        s.name === 'base' ? 'text-[#1e3a5f] bg-blue-50/50' : 'text-slate-600'
                      }`}
                    >
                      {s.nameKo}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <TableRow
                  label="일 예상 방문객"
                  scenarios={scenarios}
                  base={base}
                  getValue={(s) => `${s.dailyVisitors.toFixed(0)}명`}
                  getNum={(s) => s.dailyVisitors}
                />
                <TableRow
                  label="평균 객단가"
                  scenarios={scenarios}
                  base={base}
                  getValue={(s) => formatKRWFull(s.avgTransactionValue)}
                  getNum={(s) => s.avgTransactionValue}
                />
                <TableRow
                  label="월 예상매출"
                  scenarios={scenarios}
                  base={base}
                  getValue={(s) => formatKRW(s.monthlyExpectedSales)}
                  getNum={(s) => s.monthlyExpectedSales}
                  highlight
                />
                <TableRow
                  label="월 매출총이익"
                  scenarios={scenarios}
                  base={base}
                  getValue={(s) => formatKRW(s.monthlyGrossProfit)}
                  getNum={(s) => s.monthlyGrossProfit}
                />
                <TableRow
                  label="월 고정비 합계"
                  scenarios={scenarios}
                  base={base}
                  getValue={(s) => formatKRW(s.totalFixedCosts)}
                  getNum={(s) => -s.totalFixedCosts}
                />
                <TableRow
                  label="월 영업이익"
                  scenarios={scenarios}
                  base={base}
                  getValue={(s) => formatKRW(s.monthlyOperatingProfit)}
                  getNum={(s) => s.monthlyOperatingProfit}
                  highlight
                />
                <TableRow
                  label="임차료 비율"
                  scenarios={scenarios}
                  base={base}
                  getValue={(s) => formatPercent(s.rentBurdenRatio)}
                  getNum={(s) => -s.rentBurdenRatio}
                />
                <TableRow
                  label="투자 회수기간"
                  scenarios={scenarios}
                  base={base}
                  getValue={(s) => formatMonths(s.paybackPeriod)}
                  getNum={(s) => -s.paybackPeriod}
                />
                <tr>
                  <td className="px-5 py-3 text-xs text-slate-500 font-medium">시나리오 판정</td>
                  {scenarios.map((s) => (
                    <td key={s.name} className={`px-5 py-3 text-right ${s.name === 'base' ? 'bg-blue-50/30' : ''}`}>
                      <ScenarioDecisionBadge decision={s.scenarioDecision} />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Insight Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {scenarios.map((s) => (
          <InsightCard key={s.name} scenario={s} />
        ))}
      </div>
    </div>
  );
}

function ScenarioHeaderCard({
  scenario: s,
  isBase,
}: {
  scenario: ScenarioResult;
  isBase: boolean;
}) {
  return (
    <Card className={isBase ? 'border-[#1e3a5f]/30 ring-1 ring-[#1e3a5f]/20' : ''}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className={`font-semibold text-sm ${isBase ? 'text-[#1e3a5f]' : 'text-slate-700'}`}>
            {s.nameKo} 시나리오
          </h3>
          {isBase && (
            <span className="text-xs bg-[#1e3a5f] text-white rounded px-1.5 py-0.5">기준</span>
          )}
        </div>
        <div className="space-y-1 text-xs">
          <AdjRow label="방문객" adj={s.dailyVisitorsAdj} />
          <AdjRow label="객단가" adj={s.avgTransactionAdj} />
          <AdjRow label="임차료" adj={s.rentAdj} />
        </div>
      </CardContent>
    </Card>
  );
}

function AdjRow({ label, adj }: { label: string; adj: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label} 조정</span>
      <span
        className={`font-semibold ${adj > 0 ? 'text-blue-600' : adj < 0 ? 'text-red-600' : 'text-slate-500'}`}
      >
        {adj > 0 ? '+' : ''}
        {adj.toFixed(0)}%
      </span>
    </div>
  );
}

function TableRow({
  label,
  scenarios,
  base,
  getValue,
  getNum,
  highlight,
}: {
  label: string;
  scenarios: ScenarioResult[];
  base: ScenarioResult;
  getValue: (s: ScenarioResult) => string;
  getNum: (s: ScenarioResult) => number;
  highlight?: boolean;
}) {
  const baseNum = getNum(base);
  return (
    <tr className={highlight ? 'bg-slate-50/50' : ''}>
      <td className="px-5 py-2.5 text-xs text-slate-500 font-medium">{label}</td>
      {scenarios.map((s) => {
        const num = getNum(s);
        const diff = baseNum !== 0 ? (num - baseNum) / Math.abs(baseNum) : 0;
        const isBase = s.name === 'base';
        return (
          <td
            key={s.name}
            className={`px-5 py-2.5 text-right tabular ${isBase ? 'bg-blue-50/30' : ''}`}
          >
            <span className={`text-sm ${highlight ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
              {getValue(s)}
            </span>
            {!isBase && baseNum !== 0 && (
              <span
                className={`ml-1 text-xs ${
                  diff > 0 ? 'text-emerald-500' : diff < 0 ? 'text-red-500' : 'text-slate-400'
                }`}
              >
                ({diff > 0 ? '+' : ''}{(diff * 100).toFixed(0)}%)
              </span>
            )}
          </td>
        );
      })}
    </tr>
  );
}

function ScenarioDecisionBadge({ decision }: { decision: string }) {
  const map: Record<string, string> = {
    '검토 가능': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    '임차 위험': 'bg-amber-50 text-amber-700 border-amber-200',
    '회수 지연': 'bg-amber-50 text-amber-700 border-amber-200',
    '사업 불가': 'bg-red-50 text-red-700 border-red-200',
  };
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold border ${map[decision] ?? 'bg-slate-50 text-slate-600 border-slate-200'}`}>
      {decision}
    </span>
  );
}

function InsightCard({ scenario: s }: { scenario: ScenarioResult }) {
  const Icon = s.name === 'conservative' ? TrendingDown : s.name === 'aggressive' ? TrendingUp : Minus;
  const colors = {
    conservative: 'text-red-600 bg-red-50',
    base: 'text-blue-600 bg-blue-50',
    aggressive: 'text-emerald-600 bg-emerald-50',
  };
  const color = colors[s.name as keyof typeof colors];

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className={`rounded-lg p-1.5 ${color.split(' ')[1]}`}>
            <Icon className={`h-4 w-4 ${color.split(' ')[0]}`} />
          </div>
          <span className="font-semibold text-sm text-slate-700">{s.nameKo}</span>
        </div>
        <div className="space-y-1.5">
          <StatLine label="월 영업이익" value={formatKRW(s.monthlyOperatingProfit)} negative={s.monthlyOperatingProfit < 0} />
          <StatLine label="임차료 비율" value={formatPercent(s.rentBurdenRatio)} negative={s.rentBurdenRatio > 0.13} />
          <StatLine label="투자 회수기간" value={formatMonths(s.paybackPeriod)} negative={s.paybackPeriod > 24} />
        </div>
        <ScenarioDecisionBadge decision={s.scenarioDecision} />
      </CardContent>
    </Card>
  );
}

function StatLine({ label, value, negative }: { label: string; value: string; negative: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-slate-400">{label}</span>
      <span className={`text-xs font-semibold tabular ${negative ? 'text-red-600' : 'text-emerald-600'}`}>
        {value}
      </span>
    </div>
  );
}
