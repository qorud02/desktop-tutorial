'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Users, DollarSign, Star, ArrowRight, ArrowLeft, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { saveEvaluation } from '@/lib/storage';
import type { EvaluationInput, AreaType } from '@/lib/types';
import { AREA_TYPE_LABELS } from '@/lib/types';

const DEFAULT_INPUT: EvaluationInput = {
  locationName: '',
  areaType: 'office',
  operatingDays: 25,
  dailyVisitors: 80,
  avgTransactionValue: 8000,
  grossMarginRate: 65,
  monthlyRent: 2500000,
  monthlyLaborCost: 3500000,
  otherFixedCosts: 500000,
  initialInvestment: 50000000,
  nearbyCafes: 5,
  frontVisibilityScore: 3,
  trafficAccessibilityScore: 3,
  groupOrderScore: 3,
  operationDifficultyScore: 3,
  locationMemo: '',
};

const STEPS = ['기본 정보', '매출 가정', '비용 구조', '정성 평가'];

export default function NewEvaluationPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [input, setInput] = useState<EvaluationInput>(DEFAULT_INPUT);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const set = (field: keyof EvaluationInput, value: string | number) => {
    setInput((prev) => ({ ...prev, [field]: value }));
  };

  const setNum = (field: keyof EvaluationInput) => (e: React.ChangeEvent<HTMLInputElement>) => {
    set(field, Number(e.target.value));
  };

  const handleSubmit = async () => {
    if (!input.locationName.trim()) {
      alert('후보 입지 이름을 입력하세요.');
      setStep(0);
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      const saved = await saveEvaluation(input);
      router.push(`/evaluations/${saved.id}`);
    } catch {
      setSaveError('저장 중 오류가 발생했습니다. 다시 시도해 주세요.');
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">신규 입지 평가</h1>
        <p className="text-sm text-slate-500 mt-1">
          후보 입지 정보를 입력하여 자동으로 매출과 수익성을 분석합니다.
        </p>
      </div>

      <StepIndicator steps={STEPS} current={step} />

      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-600" />
              기본 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <Field label="후보 입지명 *" hint="예: 강남역 10번 출구 앞">
              <Input
                placeholder="후보 입지명을 입력하세요"
                value={input.locationName}
                onChange={(e) => set('locationName', e.target.value)}
              />
            </Field>
            <Field label="상권 유형">
              <Select value={input.areaType} onValueChange={(v) => set('areaType', v as AreaType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(AREA_TYPE_LABELS) as [AreaType, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="메모 / 특이사항" hint="현장 방문 메모, 계약 조건 특이사항 등">
              <Textarea
                placeholder="현장 메모를 입력하세요 (선택)"
                value={input.locationMemo}
                onChange={(e) => set('locationMemo', e.target.value)}
                rows={3}
              />
            </Field>
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              매출 가정
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Field label="월 영업일" hint="일/월">
                <Input type="number" min={1} max={31} value={input.operatingDays} onChange={setNum('operatingDays')} />
              </Field>
              <Field label="일 예상 방문객" hint="명/일">
                <Input type="number" min={0} value={input.dailyVisitors} onChange={setNum('dailyVisitors')} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="평균 객단가" hint="원">
                <Input type="number" min={0} step={500} value={input.avgTransactionValue} onChange={setNum('avgTransactionValue')} />
              </Field>
              <Field label="매출총이익률" hint="% (예: 65)">
                <Input type="number" min={0} max={100} value={input.grossMarginRate} onChange={setNum('grossMarginRate')} />
              </Field>
            </div>
            <SalesPreview input={input} />
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-600" />
              비용 구조
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Field label="월 임차료" hint="원">
                <Input type="number" min={0} step={100000} value={input.monthlyRent} onChange={setNum('monthlyRent')} />
              </Field>
              <Field label="월 인건비" hint="원">
                <Input type="number" min={0} step={100000} value={input.monthlyLaborCost} onChange={setNum('monthlyLaborCost')} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="기타 고정비" hint="원">
                <Input type="number" min={0} step={50000} value={input.otherFixedCosts} onChange={setNum('otherFixedCosts')} />
              </Field>
              <Field label="초기 투자비용" hint="원">
                <Input type="number" min={0} step={1000000} value={input.initialInvestment} onChange={setNum('initialInvestment')} />
              </Field>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-4 w-4 text-blue-600" />
              정성 평가
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <Field label="인근 카페 수" hint="개 (경쟁 강도 기준)">
              <Input type="number" min={0} value={input.nearbyCafes} onChange={setNum('nearbyCafes')} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <ScoreField label="전면 가시성" value={input.frontVisibilityScore} onChange={(v) => set('frontVisibilityScore', v)} />
              <ScoreField label="유동인구/접근성" value={input.trafficAccessibilityScore} onChange={(v) => set('trafficAccessibilityScore', v)} />
              <ScoreField label="단체/B2B 잠재력" value={input.groupOrderScore} onChange={(v) => set('groupOrderScore', v)} />
              <ScoreField label="본사 운영 난이도 (역산)" value={input.operationDifficultyScore} onChange={(v) => set('operationDifficultyScore', v)} hint="5: 매우 용이, 1: 매우 어려움" />
            </div>
          </CardContent>
        </Card>
      )}

      {saveError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
          {saveError}
        </p>
      )}

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
          <ArrowLeft className="h-4 w-4 mr-1" /> 이전
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep((s) => s + 1)}>
            다음 <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={saving}>
            <Save className="h-4 w-4 mr-1" />
            {saving ? '저장 중...' : '평가 저장 및 결과 보기'}
          </Button>
        )}
      </div>
    </div>
  );
}

function StepIndicator({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-center gap-0">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center flex-1 last:flex-none">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold border-2 transition-colors ${
                i < current
                  ? 'border-[#1e3a5f] bg-[#1e3a5f] text-white'
                  : i === current
                    ? 'border-[#1e3a5f] bg-white text-[#1e3a5f]'
                    : 'border-slate-300 bg-white text-slate-400'
              }`}
            >
              {i + 1}
            </div>
            <span className={`text-sm font-medium ${i === current ? 'text-[#1e3a5f]' : 'text-slate-400'}`}>
              {s}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-0.5 flex-1 mx-3 ${i < current ? 'bg-[#1e3a5f]' : 'bg-slate-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {hint && <p className="text-xs text-slate-400 -mt-1">{hint}</p>}
      {children}
    </div>
  );
}

function ScoreField({ label, value, onChange, hint }: { label: string; value: number; onChange: (v: number) => void; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`flex-1 rounded py-1.5 text-sm font-semibold border transition-colors ${
              n <= value
                ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                : 'bg-white text-slate-400 border-slate-200 hover:border-slate-400'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

function SalesPreview({ input }: { input: EvaluationInput }) {
  const sales = input.operatingDays * input.dailyVisitors * input.avgTransactionValue;
  const gross = sales * (input.grossMarginRate / 100);
  return (
    <div className="rounded-lg bg-blue-50 border border-blue-100 p-4">
      <p className="text-xs font-semibold text-blue-600 mb-2">실시간 미리보기</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-blue-500">월 예상매출</p>
          <p className="text-base font-bold text-blue-800 tabular">
            {new Intl.NumberFormat('ko-KR').format(sales)}원
          </p>
        </div>
        <div>
          <p className="text-xs text-blue-500">월 예상 매출총이익</p>
          <p className="text-base font-bold text-blue-800 tabular">
            {new Intl.NumberFormat('ko-KR').format(gross)}원
          </p>
        </div>
      </div>
    </div>
  );
}
