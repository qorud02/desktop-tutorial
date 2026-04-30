'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlusCircle, Trash2, Eye, FileText, GitCompare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getEvaluations, deleteEvaluation } from '@/lib/storage';
import { formatKRW, formatPercent, formatMonths } from '@/lib/utils';
import { AREA_TYPE_LABELS } from '@/lib/types';
import type { Evaluation } from '@/lib/types';

function DecisionBadge({ decision }: { decision: string }) {
  if (decision === '우선검토') return <Badge variant="priority">{decision}</Badge>;
  if (decision === '조건부검토') return <Badge variant="conditional">{decision}</Badge>;
  return <Badge variant="hold">{decision}</Badge>;
}

export default function EvaluationsPage() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);

  const reload = () => getEvaluations().then(setEvaluations);

  useEffect(() => { reload(); }, []);

  const handleDelete = async (id: string) => {
    if (confirm('이 평가를 삭제하시겠습니까?')) {
      await deleteEvaluation(id);
      reload();
    }
  };

  const sorted = [...evaluations].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">저장된 평가 목록</h1>
          <p className="text-sm text-slate-500 mt-1">총 {evaluations.length}건의 평가가 저장되어 있습니다.</p>
        </div>
        <Button asChild>
          <Link href="/evaluations/new" className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            신규 평가
          </Link>
        </Button>
      </div>

      {sorted.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <p className="text-slate-500">저장된 평가가 없습니다.</p>
            <Button asChild className="mt-4">
              <Link href="/evaluations/new">첫 평가 시작하기</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sorted.map((e) => (
            <EvaluationRow key={e.id} evaluation={e} onDelete={() => handleDelete(e.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function EvaluationRow({
  evaluation: e,
  onDelete,
}: {
  evaluation: Evaluation;
  onDelete: () => void;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="font-semibold text-slate-900">{e.input.locationName}</h3>
              <DecisionBadge decision={e.result.decision} />
              {e.result.risks.filter((r) => r !== '정상 범위').map((r) => (
                <Badge key={r} variant="risk">{r}</Badge>
              ))}
            </div>
            <p className="text-sm text-slate-400 mt-1">
              {AREA_TYPE_LABELS[e.input.areaType]} · 평가일:{' '}
              {new Date(e.createdAt).toLocaleDateString('ko-KR')}
            </p>

            <div className="mt-3 grid grid-cols-2 gap-x-8 gap-y-1.5 sm:grid-cols-4">
              <Stat label="월 예상매출" value={formatKRW(e.result.monthlyExpectedSales)} />
              <Stat label="월 영업이익" value={formatKRW(e.result.monthlyOperatingProfit)} negative={e.result.monthlyOperatingProfit < 0} />
              <Stat label="임차료 비율" value={formatPercent(e.result.rentBurdenRatio)} />
              <Stat label="투자회수" value={formatMonths(e.result.paybackPeriod)} />
            </div>

            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-slate-100 max-w-xs">
                <div
                  className="h-1.5 rounded-full bg-[#1e3a5f]"
                  style={{ width: `${Math.min(e.result.totalScore, 100)}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-[#1e3a5f] tabular">
                {e.result.totalScore.toFixed(0)}/100점
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <Button asChild variant="outline" size="sm">
              <Link href={`/evaluations/${e.id}`} className="flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5" /> 결과 보기
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/evaluations/${e.id}/scenarios`} className="flex items-center gap-1.5">
                <GitCompare className="h-3.5 w-3.5" /> 시나리오
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/evaluations/${e.id}/report`} className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" /> 리포트
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, negative }: { label: string; value: string; negative?: boolean }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`text-sm font-semibold tabular ${negative ? 'text-red-600' : 'text-slate-800'}`}>
        {value}
      </p>
    </div>
  );
}
