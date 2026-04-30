'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Printer, ArrowLeft, CheckSquare, Square, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getEvaluation } from '@/lib/storage';
import { formatKRW, formatKRWFull, formatPercent, formatMonths } from '@/lib/utils';
import { AREA_TYPE_LABELS } from '@/lib/types';
import type { Evaluation } from '@/lib/types';

const CHECKLIST = [
  '오전 피크 유동인구 실측 완료',
  '점심 피크 유동인구 실측 완료',
  '경쟁 업체 가격 및 대기시간 조사 완료',
  '임차 계약 조건 검토 완료 (보증금, 기간, 옵션)',
  '간판/전면 가시성 현장 확인 완료',
  '인근 B2B/단체주문 대상처 리스트업 완료',
];

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [ev, setEv] = useState<Evaluation | null>(null);
  const [checked, setChecked] = useState<boolean[]>(Array(CHECKLIST.length).fill(false));

  useEffect(() => {
    const data = getEvaluation(id);
    if (!data) router.push('/evaluations');
    else setEv(data);
  }, [id, router]);

  const handlePrint = () => window.print();
  const toggle = (i: number) =>
    setChecked((prev) => prev.map((v, idx) => (idx === i ? !v : v)));

  if (!ev) return <div className="text-slate-400 text-sm">불러오는 중...</div>;

  const { input, result, scenarios } = ev;
  const base = scenarios.find((s) => s.name === 'base')!;
  const conservative = scenarios.find((s) => s.name === 'conservative')!;
  const aggressive = scenarios.find((s) => s.name === 'aggressive')!;
  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const mainRisks = result.risks.filter((r) => r !== '정상 범위');

  const nextActions: string[] = [];
  if (result.decision === '우선검토') {
    nextActions.push('경영진 검토 및 최종 승인 절차 진행');
    nextActions.push('임차 계약 협상 및 법무 검토');
    nextActions.push('인테리어·설비 견적 및 공사 일정 확정');
  } else if (result.decision === '조건부검토') {
    nextActions.push('리스크 항목 개선 가능 여부 재검토');
    nextActions.push('추가 현장 조사 및 유동인구 재실측');
    nextActions.push('임차료 협상 여지 타진');
  } else {
    nextActions.push('현 조건으로는 출점 보류 권고');
    nextActions.push('상권 변화 모니터링 후 재평가');
    nextActions.push('대안 입지 탐색 권고');
  }

  return (
    <div className="max-w-4xl">
      {/* Print controls */}
      <div className="no-print flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href={`/evaluations/${id}`}>
              <ArrowLeft className="h-3.5 w-3.5 mr-1" /> 결과로 돌아가기
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">1페이지 의사결정 리포트</h1>
            <p className="text-sm text-slate-400">{input.locationName} · {today}</p>
          </div>
        </div>
        <Button onClick={handlePrint} className="flex items-center gap-2">
          <Printer className="h-4 w-4" />
          인쇄 / PDF 저장
        </Button>
      </div>

      {/* Report Body */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8 space-y-7 print-body">

        {/* Title */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-[#1e3a5f] tracking-widest uppercase">UNICUP</span>
              <span className="text-xs text-slate-400">|</span>
              <span className="text-xs text-slate-400">입지 의사결정 리포트</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">{input.locationName}</h2>
            <p className="text-sm text-slate-500 mt-1">
              {AREA_TYPE_LABELS[input.areaType]} · 평가일: {new Date(ev.createdAt).toLocaleDateString('ko-KR')} · 출력일: {today}
            </p>
          </div>
          <div className="text-right">
            <DecisionBlock decision={result.decision} />
            <p className="text-2xl font-bold text-[#1e3a5f] tabular mt-2">{result.totalScore.toFixed(0)}<span className="text-sm font-normal text-slate-400">/100점</span></p>
          </div>
        </div>

        {/* Overview Grid */}
        <section>
          <SectionTitle>후보 입지 개요 및 핵심 가정</SectionTitle>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-3 sm:grid-cols-4">
            <OverviewItem label="상권 유형" value={AREA_TYPE_LABELS[input.areaType]} />
            <OverviewItem label="월 영업일" value={`${input.operatingDays}일`} />
            <OverviewItem label="일 예상 방문객" value={`${input.dailyVisitors.toLocaleString()}명`} />
            <OverviewItem label="평균 객단가" value={formatKRWFull(input.avgTransactionValue)} />
            <OverviewItem label="매출총이익률" value={`${input.grossMarginRate}%`} />
            <OverviewItem label="월 임차료" value={formatKRW(input.monthlyRent)} />
            <OverviewItem label="월 인건비" value={formatKRW(input.monthlyLaborCost)} />
            <OverviewItem label="초기 투자비용" value={formatKRW(input.initialInvestment)} />
          </div>
        </section>

        {/* Key Results */}
        <section>
          <SectionTitle>자동 계산 결과</SectionTitle>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <ResultCard label="월 예상매출" value={formatKRW(result.monthlyExpectedSales)} sub={result.interpretations.monthlyExpectedSales} ok={result.monthlyExpectedSales >= 20_000_000} />
            <ResultCard label="월 영업이익" value={formatKRW(result.monthlyOperatingProfit)} sub={result.interpretations.monthlyOperatingProfit} ok={result.monthlyOperatingProfit > 0} />
            <ResultCard label="임차료 비율" value={formatPercent(result.rentBurdenRatio)} sub={result.interpretations.rentBurdenRatio} ok={result.rentBurdenRatio <= 0.13} />
            <ResultCard label="투자 회수기간" value={formatMonths(result.paybackPeriod)} sub={result.interpretations.paybackPeriod} ok={result.paybackPeriod <= 24} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs text-slate-500">
            <OverviewItem label="영업이익률" value={formatPercent(result.operatingProfitMargin)} />
            <OverviewItem label="손익분기 일 방문객" value={`${result.breakEvenDailyVisitors.toFixed(0)}명`} />
            <OverviewItem label="손익분기 일 매출" value={formatKRW(result.breakEvenDailySales)} />
            <OverviewItem label="인근 카페 수" value={`${input.nearbyCafes}개`} />
          </div>
        </section>

        {/* Scenario Summary */}
        <section>
          <SectionTitle>시나리오 요약</SectionTitle>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border border-slate-200">
                  <th className="text-left text-slate-500 font-medium px-3 py-2 border border-slate-200">구분</th>
                  <th className="text-right text-red-600 font-semibold px-3 py-2 border border-slate-200">보수적</th>
                  <th className="text-right text-[#1e3a5f] font-semibold px-3 py-2 border border-slate-200">기본</th>
                  <th className="text-right text-emerald-600 font-semibold px-3 py-2 border border-slate-200">공격적</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: '월 예상매출', getValue: (s: typeof base) => formatKRW(s.monthlyExpectedSales) },
                  { label: '월 영업이익', getValue: (s: typeof base) => formatKRW(s.monthlyOperatingProfit) },
                  { label: '임차료 비율', getValue: (s: typeof base) => formatPercent(s.rentBurdenRatio) },
                  { label: '투자 회수기간', getValue: (s: typeof base) => formatMonths(s.paybackPeriod) },
                  { label: '판정', getValue: (s: typeof base) => s.scenarioDecision },
                ].map((row) => (
                  <tr key={row.label} className="border border-slate-200">
                    <td className="text-slate-500 px-3 py-1.5 border border-slate-200">{row.label}</td>
                    <td className="text-right tabular px-3 py-1.5 border border-slate-200">{row.getValue(conservative)}</td>
                    <td className="text-right tabular font-medium px-3 py-1.5 border border-slate-200 bg-blue-50/30">{row.getValue(base)}</td>
                    <td className="text-right tabular px-3 py-1.5 border border-slate-200">{row.getValue(aggressive)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Decision & Risk */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <section>
            <SectionTitle>최종 판정 및 리스크</SectionTitle>
            <div className="mt-3 rounded-lg border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">최종 판정:</span>
                <DecisionBlock decision={result.decision} />
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1.5">주요 리스크</p>
                {mainRisks.length === 0 ? (
                  <div className="flex items-center gap-1.5 text-emerald-600 text-xs">
                    <CheckCircle className="h-3.5 w-3.5" /> 특이 리스크 없음 (정상 범위)
                  </div>
                ) : (
                  <div className="space-y-1">
                    {mainRisks.map((r) => (
                      <div key={r} className="flex items-center gap-1.5 text-red-600 text-xs">
                        <AlertCircle className="h-3.5 w-3.5" /> {r}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          <section>
            <SectionTitle>Next Action (권고 사항)</SectionTitle>
            <div className="mt-3 space-y-2">
              {nextActions.map((a, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="flex-shrink-0 font-bold text-[#1e3a5f]">{i + 1}.</span>
                  {a}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Checklist */}
        <section>
          <SectionTitle>현장 체크리스트</SectionTitle>
          <div className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {CHECKLIST.map((item, i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggle(i)}
                className="flex items-center gap-2 text-left text-sm rounded px-3 py-2 hover:bg-slate-50 transition-colors group no-print"
              >
                {checked[i] ? (
                  <CheckSquare className="h-4 w-4 flex-shrink-0 text-emerald-600" />
                ) : (
                  <Square className="h-4 w-4 flex-shrink-0 text-slate-300 group-hover:text-slate-400" />
                )}
                <span className={checked[i] ? 'line-through text-slate-400' : 'text-slate-700'}>
                  {item}
                </span>
              </button>
            ))}
            {/* Print version (static) */}
            <div className="print-only col-span-2 grid grid-cols-2 gap-1">
              {CHECKLIST.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-600 py-1">
                  <div className="h-3 w-3 border border-slate-400 rounded-sm flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Memo */}
        {input.locationMemo && (
          <section>
            <SectionTitle>현장 메모</SectionTitle>
            <p className="mt-2 text-sm text-slate-600 whitespace-pre-wrap border-l-2 border-slate-200 pl-4">
              {input.locationMemo}
            </p>
          </section>
        )}

        {/* Footer */}
        <div className="border-t border-slate-100 pt-4 flex items-center justify-between text-xs text-slate-400">
          <span>Unicup Co., Ltd. | 내부 전용 문서</span>
          <span>{today}</span>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
      {children}
    </h3>
  );
}

function OverviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-1">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-medium text-slate-800 tabular">{value}</p>
    </div>
  );
}

function ResultCard({
  label,
  value,
  sub,
  ok,
}: {
  label: string;
  value: string;
  sub: string;
  ok: boolean;
}) {
  return (
    <div className={`rounded-lg border p-3 ${ok ? 'border-emerald-200 bg-emerald-50/30' : 'border-red-200 bg-red-50/30'}`}>
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`text-base font-bold tabular mt-0.5 ${ok ? 'text-slate-900' : 'text-red-700'}`}>
        {value}
      </p>
      <p className={`text-xs mt-0.5 ${ok ? 'text-emerald-600' : 'text-red-500'}`}>{sub}</p>
    </div>
  );
}

function DecisionBlock({ decision }: { decision: string }) {
  const map: Record<string, string> = {
    '우선검토': 'bg-emerald-50 text-emerald-700 border-emerald-300',
    '조건부검토': 'bg-amber-50 text-amber-700 border-amber-300',
    '보류': 'bg-red-50 text-red-700 border-red-300',
  };
  return (
    <span className={`inline-block rounded-lg border px-3 py-1 text-sm font-bold ${map[decision] ?? ''}`}>
      {decision}
    </span>
  );
}
