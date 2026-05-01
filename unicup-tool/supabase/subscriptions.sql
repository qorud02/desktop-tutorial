-- ============================================================
-- subscriptions 테이블  |  Supabase SQL Editor에서 실행하세요.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan        text        NOT NULL DEFAULT 'free',    -- 'free' | 'pro'
  status      text        NOT NULL DEFAULT 'inactive', -- 'inactive' | 'active' | 'canceled'
  provider    text        DEFAULT 'toss',
  payment_key text,
  order_id    text,
  amount      numeric,
  paid_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)  -- 사용자당 1개 구독 행
);

-- updated_at 자동 갱신 (이미 set_updated_at 함수가 있으면 재사용)
DROP TRIGGER IF EXISTS set_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER set_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Row Level Security
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 클라이언트: 본인 구독만 조회 가능
CREATE POLICY "본인 구독 조회"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- 클라이언트에서 직접 INSERT/UPDATE/DELETE 불가
-- (서버 API가 service_role 키로 처리)

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id
  ON public.subscriptions (user_id);
