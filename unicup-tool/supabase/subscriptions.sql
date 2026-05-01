-- ============================================================
-- Unicup  |  subscriptions 테이블 마이그레이션
-- 실행 방법: Supabase 대시보드 → SQL Editor → 전체 붙여넣기 → Run
--
-- 사전 조건:
--   supabase/schema.sql 을 먼저 실행하세요.
--   (set_updated_at 트리거 함수가 schema.sql 에서 생성됩니다.)
-- ============================================================


-- ─── 1. 테이블 생성 ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.subscriptions (
  -- 기본 키
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 사용자 연결 (auth.users 삭제 시 함께 삭제)
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 플랜 정보
  -- plan   : 'free' | 'pro'
  -- status : 'inactive' (결제 전) | 'active' (결제 완료) | 'canceled' (해지)
  plan          text        NOT NULL DEFAULT 'free',
  status        text        NOT NULL DEFAULT 'inactive',

  -- 결제 공급자 정보 (현재: 'toss')
  provider      text        DEFAULT 'toss',

  -- Toss Payments 결제 확인 데이터
  -- /api/payments/toss/confirm 에서 service_role 키로 기록
  payment_key   text,                     -- Toss paymentKey
  order_id      text,                     -- Toss orderId (클라이언트에서 생성)
  amount        numeric,                  -- 결제 금액 (KRW)
  paid_at       timestamptz,             -- 결제 완료 시각

  -- 감사 컬럼
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  -- 사용자당 구독 행은 1개만 허용 (UPSERT ON CONFLICT user_id 로 갱신)
  UNIQUE (user_id)
);


-- ─── 2. updated_at 자동 갱신 트리거 ─────────────────────────
--
-- set_updated_at() 함수는 schema.sql 에서 이미 생성됩니다.
-- 동일 함수를 재사용합니다.

DROP TRIGGER IF EXISTS set_subscriptions_updated_at ON public.subscriptions;

CREATE TRIGGER set_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();


-- ─── 3. Row Level Security 활성화 ────────────────────────────

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;


-- ─── 4. RLS 정책 ─────────────────────────────────────────────
--
-- 설계 원칙:
--   • 클라이언트(anon / authenticated 역할)는 SELECT 만 허용
--   • INSERT / UPDATE / DELETE 는 service_role 키를 사용하는
--     서버 API(/api/payments/toss/confirm)에서만 수행
--   • 이렇게 하면 클라이언트가 스스로 plan = 'pro' 로 변경 불가
--
-- service_role 은 RLS 를 자동으로 우회하므로
-- service_role 전용 정책을 별도로 만들 필요가 없습니다.

-- 기존 정책 제거 후 재생성 (멱등 실행 보장)
DROP POLICY IF EXISTS "본인 구독 조회" ON public.subscriptions;

CREATE POLICY "본인 구독 조회"
  ON public.subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- INSERT / UPDATE / DELETE 정책 없음 → 클라이언트에서 쓰기 불가
-- (서버는 service_role 로 RLS 자체를 우회)


-- ─── 5. 인덱스 ───────────────────────────────────────────────

-- user_id 조회 (가장 빈번한 쿼리: 세션마다 플랜 확인)
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_user_id
  ON public.subscriptions (user_id);

-- 결제 확인 시 order_id 중복 검증용
CREATE INDEX IF NOT EXISTS idx_subscriptions_order_id
  ON public.subscriptions (order_id)
  WHERE order_id IS NOT NULL;

-- paid_at 기준 정렬/통계용
CREATE INDEX IF NOT EXISTS idx_subscriptions_paid_at
  ON public.subscriptions (paid_at DESC)
  WHERE paid_at IS NOT NULL;


-- ─── 6. 검증 쿼리 (실행 후 확인용) ──────────────────────────
--
-- 아래 쿼리를 별도로 실행해 테이블과 정책이 정상 생성되었는지 확인하세요.
--
-- SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'public' AND table_name = 'subscriptions';
--
-- SELECT policyname, cmd, roles
--   FROM pg_policies
--   WHERE tablename = 'subscriptions';
--
-- SELECT indexname FROM pg_indexes
--   WHERE tablename = 'subscriptions';
