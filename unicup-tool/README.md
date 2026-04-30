# Unicup 입지·매출 의사결정 도구

유니컵 프랜차이즈 본사의 후보 입지 평가 및 의사결정을 위한 내부 MVP 웹 애플리케이션입니다.

## 주요 기능

- **신규 평가 입력**: 4단계 폼으로 후보 입지 정보 입력
- **자동 계산**: 월 예상매출, 영업이익, 임차료 비율, 투자회수기간, 손익분기점 자동 산출
- **100점 종합 점수**: 매출 규모, 수익성, 임차료, 회수기간, 경쟁강도, 정성평가 가중 채점
- **판정**: 우선검토 / 조건부검토 / 보류 자동 판정
- **시나리오 비교**: 보수적 / 기본 / 공격적 3개 시나리오 자동 생성 및 비교
- **1페이지 리포트**: 투자자·정책자금 심사자용 인쇄 가능 리포트
- **데이터 관리**: localStorage 기반 저장, 조회, 삭제

## 기술 스택

- **프레임워크**: Next.js 16 (App Router)
- **언어**: TypeScript
- **스타일**: Tailwind CSS
- **UI**: Radix UI primitives + 커스텀 컴포넌트
- **데이터**: Browser localStorage (Supabase 마이그레이션 준비 완료)
- **배포**: Vercel

## 로컬 실행 방법

### 사전 요구사항
- Node.js 18 이상
- npm 또는 yarn

### 설치 및 실행

```bash
# 프로젝트 클론 후 디렉터리 이동
cd unicup-tool

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

### 프로덕션 빌드

```bash
npm run build
npm start
```

## Vercel 배포 방법

1. [Vercel](https://vercel.com)에 GitHub 저장소 연결
2. `unicup-tool` 폴더를 **Root Directory**로 설정
3. Framework Preset: **Next.js** 선택
4. 환경 변수 없음 (localStorage 사용)
5. Deploy 클릭

또는 Vercel CLI 사용:

```bash
npm install -g vercel
cd unicup-tool
vercel --prod
```

## 폴더 구조

```
unicup-tool/
├── app/
│   ├── layout.tsx                  # 루트 레이아웃 (사이드바, 탑바 포함)
│   ├── page.tsx                    # 대시보드
│   └── evaluations/
│       ├── page.tsx                # 저장된 평가 목록
│       ├── new/
│       │   └── page.tsx            # 신규 평가 입력 폼
│       └── [id]/
│           ├── page.tsx            # 평가 결과 상세
│           ├── scenarios/
│           │   └── page.tsx        # 시나리오 비교
│           └── report/
│               └── page.tsx        # 1페이지 의사결정 리포트
├── components/
│   ├── layout/
│   │   ├── sidebar.tsx             # 좌측 내비게이션
│   │   └── topbar.tsx              # 상단 브레드크럼
│   └── ui/                         # 재사용 UI 컴포넌트
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── select.tsx
│       ├── separator.tsx
│       └── textarea.tsx
├── lib/
│   ├── types.ts                    # TypeScript 타입 정의
│   ├── calculations.ts             # 핵심 계산 로직 (순수 함수)
│   ├── storage.ts                  # localStorage CRUD
│   └── utils.ts                    # 포맷팅 유틸 (KRW, %, 월)
└── public/
```

## 계산 로직

모든 계산은 `lib/calculations.ts`에 순수 함수로 구현되어 있습니다. 외부 API 의존성이 없어 즉시 결정론적 결과를 반환합니다.

### 핵심 계산식

| 지표 | 계산식 |
|------|--------|
| 월 예상매출 | 영업일 × 일 방문객 × 객단가 |
| 월 매출총이익 | 월 예상매출 × 매출총이익률 |
| 월 영업이익 | 월 매출총이익 - 임차료 - 인건비 - 기타고정비 |
| 임차료 비율 | 월 임차료 / 월 예상매출 |
| 투자 회수기간 | 초기투자비용 / 월 영업이익 |

## Supabase 마이그레이션 준비

`lib/storage.ts`의 함수 시그니처를 유지하면서 구현만 교체하면 됩니다:

```typescript
// 현재: localStorage
export function getEvaluations(): Evaluation[] { ... }
export function saveEvaluation(...): Evaluation { ... }
export function deleteEvaluation(id: string): void { ... }

// 향후: Supabase (인터페이스 동일, 구현만 교체)
export async function getEvaluations(): Promise<Evaluation[]> { ... }
```

## 주의사항

- 이 MVP는 인증, 결제, AI 예측 기능을 포함하지 않습니다.
- 데이터는 브라우저 localStorage에 저장됩니다. 브라우저 데이터를 삭제하면 평가 내역이 초기화됩니다.
- 내부 전용 시스템입니다.
