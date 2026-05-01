'use client';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  PlusCircle, Trash2, Eye, FileText, GitCompare,
  Search, Download, SlidersHorizontal, X,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { getEvaluations, deleteEvaluation } from '@/lib/storage';
import { formatKRW, formatPercent, formatMonths } from '@/lib/utils';
import { AREA_TYPE_LABELS } from '@/lib/types';
import { useToast } from '@/components/ui/toast';
import { CardSkeleton } from '@/components/ui/skeleton';
import type { Evaluation, AreaType } from '@/lib/types';

type SortKey = 'date' | 'score' | 'sales' | 'name';
type DecisionFilter = 'all' | '우선검토' | '조건부검토' | '보류';
type AreaFilter = 'all' | AreaType;

function DecisionBadge({ decision }: { decision: string }) {
  if (decision === '우선검토') return <Badge variant="priority">{decision}</Badge>;
  if (decision === '조건부검토') return <Badge variant="conditional">{decision}</Badge>;
  return <Badge variant="hold">{decision}</Badge>;
}

function exportCSV(evaluations: Evaluation[]) {
  const headers = [
    '후보입지명', '상권유형', '판정', '종합점수',
    '월예상매출', '월영업이익', '임차료비율', '투자회수기간(개월)',
    '일방문객', '객단가', '월임차료', '월인건비',
    '평가일',
  ];
  const rows = evaluations.map((e) => [
    e.input.locationName,
    AREA_TYPE_LABELS[e.input.areaType],
    e.result.decision,
    e.result.totalScore.toFixed(1),
    e.result.monthlyExpectedSales,
    e.result.monthlyOperatingProfit,
    (e.result.rentBurdenRatio * 100).toFixed(1) + '%',
    e.result.paybackPeriod === 999 ? '-' : e.result.paybackPeriod.toFixed(1),
    e.input.dailyVisitors,
    e.input.avgTransactionValue,
    e.input.monthlyRent,
    e.input.monthlyLaborCost,
    new Date(e.createdAt).toLocaleDateString('ko-KR'),
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const bom = '﻿';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `unicup-evaluations-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function EvaluationsPage() {
  const { toast } = useToast();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [decisionFilter, setDecisionFilter] = useState<DecisionFilter>('all');
  const [areaFilter, setAreaFilter] = useState<AreaFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const reload = () =>
    getEvaluations().then((data) => {
      setEvaluations(data);
      setLoading(false);
    });

  useEffect(() => { reload(); }, []);

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`"${name}" 평가를 삭제하시겠습니까?`)) {
      await deleteEvaluation(id);
      reload();
      toast(`"${name}" 평가가 삭제되었습니다.`, 'success');
    }
  };

  const filtered = useMemo(() => {
    let list = [...evaluations];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((e) => e.input.locationName.toLowerCase().includes(q));
    }
    if (decisionFilter !== 'all') {
      list = list.filter((e) => e.result.decision === decisionFilter);
    }
    if (areaFilter !== 'all') {
      list = list.filter((e) => e.input.areaType === areaFilter);
    }
    list.sort((a, b) => {
      if (sortKey === 'date') return b.updatedAt.localeCompare(a.updatedAt);
      if (sortKey === 'score') return b.result.totalScore - a.result.totalScore;
      if (sortKey === 'sales') return b.result.monthlyExpectedSales - a.result.monthlyExpectedSales;
      if (sortKey === 'name') return a.input.locationName.localeCompare(b.input.locationName, 'ko');
      return 0;
    });
    return list;
  }, [evaluations, search, decisionFilter, areaFilter, sortKey]);

  const hasFilters = search || decisionFilter !== 'all' || areaFilter !== 'all';

  const clearFilters = () => {
    setSearch('');
    setDecisionFilter('all');
    setAreaFilter('all');
  };

  const handleExportCSV = () => {
    exportCSV(filtered);
    toast(`${filtered.length}건의 평가를 CSV로 내보냈습니다.`, 'success');
  };

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">저장된 평가 목록</h1>
          <p className="text-sm text-slate-500 mt-1">
            {loading ? '불러오는 중...' : `전체 ${evaluations.length}건${filtered.length !== evaluations.length ? ` · 필터 ${filtered.length}건` : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {evaluations.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5">
              <Download className="h-3.5 w-3.5" />
              CSV 내보내기
            </Button>
          )}
          <Button asChild>
            <Link href="/evaluations/new" className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              신규 평가
            </Link>
          </Button>
        </div>
      </div>

      {/* Search + filter bar */}
      {(evaluations.length > 0 || hasFilters) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="입지명 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setFiltersOpen((o) => !o)}
            className={`gap-1.5 ${filtersOpen ? 'bg-slate-100' : ''}`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            필터 및 정렬
            {hasFilters && <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />}
          </Button>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5 text-slate-500">
              <X className="h-3.5 w-3.5" /> 초기화
            </Button>
          )}
        </div>
      )}

      {/* Filter panel */}
      {filtersOpen && (
        <div className="flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500">판정</p>
            <Select value={decisionFilter} onValueChange={(v) => setDecisionFilter(v as DecisionFilter)}>
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="우선검토">우선검토</SelectItem>
                <SelectItem value="조건부검토">조건부검토</SelectItem>
                <SelectItem value="보류">보류</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500">상권 유형</p>
            <Select value={areaFilter} onValueChange={(v) => setAreaFilter(v as AreaFilter)}>
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {(Object.entries(AREA_TYPE_LABELS) as [AreaType, string][]).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500">정렬</p>
            <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">최근 수정순</SelectItem>
                <SelectItem value="score">점수 높은순</SelectItem>
                <SelectItem value="sales">매출 높은순</SelectItem>
                <SelectItem value="name">이름순</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center py-16 text-center">
            {evaluations.length === 0 ? (
              <>
                <p className="text-slate-500">저장된 평가가 없습니다.</p>
                <Button asChild className="mt-4">
                  <Link href="/evaluations/new">첫 평가 시작하기</Link>
                </Button>
              </>
            ) : (
              <>
                <p className="text-slate-500">검색 결과가 없습니다.</p>
                <Button variant="outline" className="mt-4" onClick={clearFilters}>
                  필터 초기화
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map((e) => (
            <EvaluationRow
              key={e.id}
              evaluation={e}
              onDelete={() => handleDelete(e.id, e.input.locationName)}
            />
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
