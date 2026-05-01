# Unicup 입지·매출 의사결정 도구

유니컵 프랜차이즈 본사의 후보 입지 평가 및 의사결정을 위한 내부 MVP 웹 애플리케이션입니다.

---

## 주요 기능

- **이메일/비밀번호 로그인 & 회원가입** (Supabase Auth)
- **사용자별 데이터 격리** (RLS)
- **Free / Pro 요금제** (Toss Payments 테스트 모드)
- 4단계 평가 입력 폼, 자동 수익성 계산
- 보수적/기본/공격적 3개 시나리오 자동 생성
- 1페이지 인쇄용 의사결정 리포트

---

## 플랜 구조

| 기능 | Free | Pro |
|------|------|-----|
| 후보지 평가 저장 | 최대 3개 | 무제한 |
| 자동 계산 | ✅ | ✅ |
| 1페이지 리포트 | ✅ | ✅ |
| 시나리오 비교 | ✅ | ✅ |
| 요금 | 무료 | ₩29,000/월 |

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router) |
| 언어 | TypeScript |
| 스타일 | Tailwind CSS |
| 인증/DB | Supabase (Auth + PostgreSQL + RLS) |
| 결제 | Toss Payments (테스트 모드) |
| 배포 | Vercel |

---

## 로컬 실행 방법

### 1단계 — Supabase 설정

1. [supabase.com](https://supabase.com) → New Project 생성
2. **Settings → API** 에서 아래 값 복사:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` 키 → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` 키 → `SUPABASE_SERVICE_ROLE_KEY` (절대 클라이언트에 노출 금지)

### 2단계 — DB 스키마 적용 (SQL Editor에서 순서대로 실행)

```sql
-- 1. evaluations 테이블 (supabase/schema.sql)
-- 2. subscriptions 테이블 (supabase/subscriptions.sql)
```

Supabase 대시보드 → **SQL Editor** → 각 파일 내용 붙여넣기 → Run

이메일 인증을 끄려면:
**Authentication → Providers → Email → Confirm email** OFF

### 3단계 — Toss Payments 테스트 키 발급

1. [developers.tosspayments.com](https://developers.tosspayments.com) 회원가입
2. 대시보드 → **개발 연동 키** 탭
3. **테스트 클라이언트 키** (`test_ck_...`) 복사 → `NEXT_PUBLIC_TOSS_CLIENT_KEY`
4. **테스트 시크릿 키** (`test_sk_...`) 복사 → `TOSS_SECRET_KEY`

> ⚠️ `TOSS_SECRET_KEY`는 서버 전용입니다. 클라이언트에 절대 노출하지 마세요.

### 4단계 — 환경 변수 설정

```bash
cp .env.local.example .env.local
```

`.env.local` 파일에 모든 값 입력:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_...
TOSS_SECRET_KEY=test_sk_...

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5단계 — 실행

```bash
npm install
npm run dev
```

→ [http://localhost:3000](http://localhost:3000) 접속 (미로그인 시 `/login` 자동 이동)

### 테스트 결제 방법

1. 회원가입 → 로그인
2. 3개 이상 평가 저장 시 Free 한도 안내 화면 표시
3. 사이드바 **업그레이드 →** 클릭 또는 `/pricing` 이동
4. **Pro 플랜 테스트 결제** 클릭
5. 테스트 카드 번호 입력: `4242 4242 4242 4242` / 유효기간: `12/28` / CVV: `123`
6. 결제 완료 → `/payment/success` → 대시보드 리디렉션
7. 사이드바 배지가 **Pro 플랜** 으로 변경 확인

---

## Vercel 배포 방법

1. GitHub에 저장소 push
2. [vercel.com](https://vercel.com) → **Add New Project** → 저장소 선택
3. **Root Directory** → `unicup-tool`
4. **Environment Variables** 탭에서 아래 변수 모두 추가:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_TOSS_CLIENT_KEY`
   - `TOSS_SECRET_KEY`
   - `NEXT_PUBLIC_APP_URL` (예: `https://your-app.vercel.app`)
5. **Deploy** 클릭

배포 후 Supabase 대시보드 → **Authentication → URL Configuration**:
```
Site URL: https://your-app.vercel.app
Redirect URLs: https://your-app.vercel.app/**
```

---

## 폴더 구조

```
unicup-tool/
├── app/
│   ├── layout.tsx                         # 루트 레이아웃 (HTML shell)
│   ├── api/payments/toss/confirm/
│   │   └── route.ts                       # 결제 확인 API (서버 전용)
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   └── (app)/
│       ├── layout.tsx                     # 세션 검증 + 구독 조회
│       ├── page.tsx                       # 대시보드
│       ├── pricing/page.tsx               # 요금제 (Toss 결제)
│       ├── payment/
│       │   ├── success/page.tsx           # 결제 성공 + 확인 호출
│       │   └── fail/page.tsx              # 결제 실패
│       └── evaluations/...
├── components/layout/
│   ├── sidebar.tsx                        # 플랜 배지 + 업그레이드 링크
│   ├── topbar.tsx
│   └── logout-button.tsx
├── lib/
│   ├── supabase/client.ts
│   ├── supabase/server.ts
│   ├── subscription.ts                    # isProUser(), getCurrentUserSubscription()
│   ├── storage.ts                         # Supabase CRUD
│   ├── calculations.ts                    # 계산 로직 (변경 없음)
│   └── utils.ts
├── proxy.ts                               # 라우트 보호
├── supabase/
│   ├── schema.sql                         # evaluations 테이블
│   └── subscriptions.sql                 # subscriptions 테이블 + RLS
└── .env.local.example
```

---

## 보안 설계

| 키 | 위치 | 용도 |
|----|------|------|
| `NEXT_PUBLIC_TOSS_CLIENT_KEY` | 클라이언트 | 결제 창 호출 |
| `TOSS_SECRET_KEY` | 서버 전용 | Toss 결제 확인 API 호출 |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버 전용 | RLS 우회하여 subscriptions 업데이트 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 클라이언트 | RLS 적용된 일반 쿼리 |

클라이언트는 절대로 자신을 Pro로 직접 변경할 수 없습니다.
결제 확인은 반드시 서버 API(`/api/payments/toss/confirm`)를 통해서만 이루어집니다.

---

## 주의사항

- 현재 **테스트 결제 모드**입니다. 실제 과금 전환 전 별도 PG 계약이 필요합니다.
- `.env.local` 파일은 절대 Git에 커밋하지 마세요.
- `lib/calculations.ts` 계산 로직은 변경되지 않았습니다.
