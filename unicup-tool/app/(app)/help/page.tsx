import { BookOpen, HelpCircle, MessageSquare, Zap, BarChart2, FileText, GitCompare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

const faqs = [
  {
    q: '후보지 평가는 어떻게 시작하나요?',
    a: '사이드바에서 "신규 평가"를 클릭하거나 상단의 신규 평가 버튼을 눌러 4단계 입력 폼을 완성하세요. 매출 가정 → 비용 구조 → 정성 평가 순서로 입력하면 자동으로 수익성이 계산됩니다.',
  },
  {
    q: '종합 점수는 어떻게 계산되나요?',
    a: '총 100점 기준으로 6개 항목을 평가합니다: 월 예상매출(25점), 월 영업이익(20점), 임차료 비율(15점), 투자회수기간(15점), 경쟁강도(10점), 정성 평가(15점). 80점 이상이면 우선검토, 65점 이상이면 조건부검토, 그 미만은 보류입니다.',
  },
  {
    q: 'Free 플랜의 한도는 무엇인가요?',
    a: 'Free 플랜은 최대 3개의 후보지 평가를 저장할 수 있습니다. 4번째 평가부터는 Pro 플랜으로 업그레이드하거나 기존 평가를 삭제해야 합니다.',
  },
  {
    q: '시나리오 비교는 어떻게 사용하나요?',
    a: '평가 결과 페이지에서 "시나리오" 버튼을 클릭하세요. 보수적(방문객 -20%, 객단가 -5%), 기본(입력값 그대로), 공격적(방문객 +20%, 객단가 +5%, 임차료 +10%) 3가지 시나리오를 자동 비교합니다.',
  },
  {
    q: '1페이지 리포트는 어떻게 인쇄하나요?',
    a: '평가 결과 페이지에서 "1페이지 리포트" 버튼을 클릭 후, 브라우저의 인쇄 기능(Ctrl+P 또는 Cmd+P)을 사용하세요. A4 세로 방향에 최적화되어 있습니다.',
  },
  {
    q: 'CSV 내보내기는 어떻게 하나요?',
    a: '"저장된 평가" 목록 페이지 상단에서 "CSV 내보내기" 버튼을 클릭하면 현재 필터링/정렬된 모든 평가를 엑셀에서 열 수 있는 CSV 파일로 다운로드합니다.',
  },
  {
    q: '결제는 안전한가요?',
    a: '결제는 Toss Payments를 통해 처리됩니다. 카드 정보는 Toss 측에서만 처리하며, 본 시스템에는 저장되지 않습니다. 현재는 테스트 모드로 운영 중입니다.',
  },
  {
    q: '입력한 데이터는 어디에 저장되나요?',
    a: '모든 평가 데이터는 Supabase PostgreSQL 데이터베이스에 저장됩니다. Row Level Security(RLS) 정책으로 자신의 데이터만 조회 가능하며, 다른 사용자와 공유되지 않습니다.',
  },
];

const guides = [
  {
    icon: BarChart2,
    title: '대시보드',
    desc: '저장된 평가의 KPI 요약 (전체 건수, 평균 매출/이익, 판정 분포)과 최근 평가 내역을 한눈에 확인합니다.',
  },
  {
    icon: BookOpen,
    title: '신규 평가',
    desc: '4단계 폼(기본정보 → 매출가정 → 비용구조 → 정성평가)으로 후보지를 입력하면 자동으로 100점 종합 점수와 판정 결과가 생성됩니다.',
  },
  {
    icon: GitCompare,
    title: '시나리오 비교',
    desc: '동일 입지에 대해 보수적·기본·공격적 3가지 시나리오의 매출, 이익, 임차료 비율을 자동 비교하여 리스크를 점검합니다.',
  },
  {
    icon: FileText,
    title: '1페이지 리포트',
    desc: '의사결정 회의에서 사용할 수 있는 인쇄용 요약 리포트를 생성합니다. 체크리스트 항목은 체크 상태가 유지됩니다.',
  },
  {
    icon: Zap,
    title: 'Pro 업그레이드',
    desc: '무제한 평가 저장이 필요하면 Pro 플랜으로 업그레이드하세요. Toss Payments 테스트 카드: 4242 4242 4242 4242 / 12/28 / 123',
  },
];

export default function HelpPage() {
  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">도움말</h1>
        <p className="text-sm text-slate-500 mt-1">유니컵 입지·매출 의사결정 도구 사용 안내</p>
      </div>

      {/* Quick guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4 text-blue-600" />
            주요 기능 가이드
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {guides.map((g) => (
            <div key={g.title} className="flex gap-3">
              <div className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                <g.icon className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{g.title}</p>
                <p className="text-sm text-slate-500 mt-0.5">{g.desc}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Score breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart2 className="h-4 w-4 text-blue-600" />
            100점 평가 기준표
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 pr-4 font-semibold text-slate-700">항목</th>
                  <th className="text-right py-2 px-2 font-semibold text-slate-700">배점</th>
                  <th className="text-left py-2 pl-4 font-semibold text-slate-700">기준</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {[
                  ['월 예상매출', '25점', '3천만원↑: 25 / 2천5백만↑: 20 / 2천만↑: 15 / 1천5백만↑: 10 / 그 외: 5'],
                  ['월 영업이익', '20점', '700만↑: 20 / 500만↑: 16 / 300만↑: 12 / 0↑: 8 / 적자: 0'],
                  ['임차료 비율', '15점', '8%이하: 15 / 10%이하: 12 / 13%이하: 8 / 초과: 3'],
                  ['투자회수기간', '15점', '18개월이하: 15 / 24개월이하: 10 / 36개월이하: 5 / 초과: 0'],
                  ['경쟁강도', '10점', '인근카페 3개이하: 10 / 7개이하: 6 / 초과: 2'],
                  ['정성 평가', '15점', '가시성·접근성·B2B잠재력·운영난이도 평균 × 3'],
                ].map(([item, score, criteria]) => (
                  <tr key={item}>
                    <td className="py-2.5 pr-4 font-medium text-slate-700">{item}</td>
                    <td className="py-2.5 px-2 text-right font-semibold text-blue-700">{score}</td>
                    <td className="py-2.5 pl-4 text-slate-500 text-xs">{criteria}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { label: '우선검토', score: '80점 이상', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
              { label: '조건부검토', score: '65~79점', color: 'bg-amber-50 text-amber-700 border-amber-200' },
              { label: '보류', score: '64점 이하', color: 'bg-red-50 text-red-700 border-red-200' },
            ].map((d) => (
              <div key={d.label} className={`rounded-lg border p-3 text-center ${d.color}`}>
                <p className="text-xs font-semibold">{d.label}</p>
                <p className="text-xs mt-0.5 opacity-80">{d.score}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <HelpCircle className="h-4 w-4 text-blue-600" />
            자주 묻는 질문
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {faqs.map((faq) => (
            <div key={faq.q} className="border-b border-slate-50 last:border-0 pb-5 last:pb-0">
              <p className="text-sm font-semibold text-slate-800">{faq.q}</p>
              <p className="text-sm text-slate-500 mt-1.5">{faq.a}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Contact */}
      <Card className="bg-slate-50 border-slate-100">
        <CardContent className="p-5 flex items-start gap-3">
          <MessageSquare className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-slate-700">추가 문의</p>
            <p className="text-sm text-slate-500 mt-1">
              시스템 오류나 기타 문의 사항은 내부 슬랙 채널 <strong>#unicup-tool</strong>로 연락해 주세요.
            </p>
            <div className="flex gap-3 mt-3">
              <Link href="/" className="text-xs text-blue-600 hover:underline">← 대시보드로 돌아가기</Link>
              <Link href="/evaluations/new" className="text-xs text-blue-600 hover:underline">신규 평가 시작 →</Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
