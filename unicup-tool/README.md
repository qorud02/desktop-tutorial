# Unicup 입지·매출 의사결정 도구

유니컵 프랜차이즈 본사의 후보 입지 평가 및 의사결정을 위한 내부 MVP 웹 애플리케이션입니다.

---

## 주요 기능

- **이메일/비밀번호 로그인 & 회원가입** (Supabase Auth)
- **사용자별 데이터 격리** (RLS - 본인 평가만 조회/수정/삭제)
- 4단계 평가 입력 폼, 자동 계산 (매출·이익·회수기간·점수)
- 보수적/기본/공격적 3개 시나리오 자동 생성
- 1페이지 인쇄용 의사결정 리포트

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router) |
| 언어 | TypeScript |
| 스타일 | Tailwind CSS |
| 인증/DB | Supabase (Auth + PostgreSQL + RLS) |
| 배포 | Vercel |

---

## 로컬 실행 방법

### 1단계 — Supabase 프로젝트 생성

1. [supabase.com](https://supabase.com) 접속 → 무료 계정 생성
2. **New Project** 클릭 → 프로젝트 이름, 비밀번호, 리전(Northeast Asia) 설정
3. 프로젝트 생성 완료 후 **Settings → API** 로 이동
4. 아래 두 값을 복사해둡니다:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` 키 → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2단계 — DB 스키마 적용

1. Supabase 대시보드 → **SQL Editor** 탭 클릭
2. `supabase/schema.sql` 파일 내용을 전체 복사
3. SQL Editor에 붙여넣기 → **Run** 클릭
4. `evaluations` 테이블과 RLS 정책이 생성됩니다.

### 3단계 — 이메일 인증 설정 (선택)

- 개발 중 이메일 인증을 끄려면:
  Supabase 대시보드 → **Authentication → Providers → Email** →
  **Confirm email** 토글을 **OFF** 로 변경

### 4단계 — 환경 변수 설정

```bash
cd unicup-tool
cp .env.local.example .env.local
```

`.env.local` 파일을 열어 Supabase 값 입력:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 5단계 — 로컬 실행

```bash
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속
→ `/login` 으로 자동 리디렉션 됩니다.

---

## Vercel 배포 방법

1. GitHub에 저장소 push
2. [vercel.com](https://vercel.com) → **Add New Project** → 저장소 선택
3. **Root Directory** 를 `unicup-tool` 로 설정
4. **Environment Variables** 탭에서 아래 두 변수 추가:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. **Deploy** 클릭

배포 완료 후 Supabase 대시보드 → **Authentication → URL Configuration** 에서
`Site URL` 과 `Redirect URLs` 에 Vercel 도메인 추가:
```
https://your-app.vercel.app
https://your-app.vercel.app/**
```

---

## 폴더 구조

```
unicup-tool/
├── app/
│   ├── layout.tsx                     # 루트 레이아웃 (HTML shell)
│   ├── (auth)/
│   │   ├── login/page.tsx             # 로그인 페이지
│   │   └── signup/page.tsx            # 회원가입 페이지
│   └── (app)/
│       ├── layout.tsx                 # 사이드바+탑바+세션 검증
│       ├── page.tsx                   # 대시보드
│       └── evaluations/
│           ├── page.tsx               # 저장된 평가 목록
│           ├── new/page.tsx           # 신규 평가 입력 폼
│           └── [id]/
│               ├── page.tsx           # 평가 결과 상세
│               ├── scenarios/page.tsx # 시나리오 비교
│               └── report/page.tsx   # 1페이지 리포트
├── components/
│   ├── layout/
│   │   ├── sidebar.tsx                # 좌측 내비게이션
│   │   ├── topbar.tsx                 # 상단 브레드크럼
│   │   └── logout-button.tsx          # 로그아웃 버튼 (client)
│   └── ui/                            # 재사용 UI 컴포넌트
├── lib/
│   ├── supabase/
│   │   ├── client.ts                  # 브라우저 Supabase 클라이언트
│   │   └── server.ts                  # 서버 Supabase 클라이언트
│   ├── calculations.ts                # 계산 로직 (순수 함수, 변경 없음)
│   ├── storage.ts                     # Supabase CRUD (async)
│   ├── types.ts                       # TypeScript 타입 정의
│   └── utils.ts                       # KRW·%·월 포맷 유틸
├── proxy.ts                           # 라우트 보호 (미들웨어)
├── supabase/
│   └── schema.sql                     # DB 스키마 + RLS 정책
└── .env.local.example                 # 환경변수 템플릿
```

---

## 인증 흐름

```
미로그인 사용자 → 모든 페이지 → /login 리디렉션
로그인 사용자  → /login, /signup → / 리디렉션
```

`proxy.ts` 가 모든 요청을 가로채 Supabase 세션 쿠키를 검사합니다.
`(app)/layout.tsx` 서버 컴포넌트에서 세션을 2차 검증합니다.

---

## 주의사항

- `.env.local` 파일은 절대 Git에 커밋하지 마세요.
- 결제, AI 예측, 팀 관리 기능은 포함되지 않습니다.
- `lib/calculations.ts` 의 계산 로직은 변경되지 않았습니다.
