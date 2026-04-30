-- ============================================================
-- Unicup 입지·매출 의사결정 도구  |  Supabase SQL Schema
-- Supabase SQL Editor에서 순서대로 실행하세요.
-- ============================================================

-- 1. evaluations 테이블 생성
CREATE TABLE IF NOT EXISTS public.evaluations (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  input       jsonb       NOT NULL,   -- EvaluationInput
  result      jsonb       NOT NULL,   -- CalculationResult
  scenarios   jsonb       NOT NULL    -- ScenarioResult[]
);

-- 2. updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_evaluations_updated_at ON public.evaluations;
CREATE TRIGGER set_evaluations_updated_at
  BEFORE UPDATE ON public.evaluations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Row Level Security 활성화
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책: 본인 데이터만 조회/삽입/수정/삭제
CREATE POLICY "본인 평가만 조회"
  ON public.evaluations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "본인 평가 삽입"
  ON public.evaluations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "본인 평가 수정"
  ON public.evaluations
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "본인 평가 삭제"
  ON public.evaluations
  FOR DELETE
  USING (auth.uid() = user_id);

-- 5. 인덱스 (조회 성능)
CREATE INDEX IF NOT EXISTS idx_evaluations_user_id
  ON public.evaluations (user_id);

CREATE INDEX IF NOT EXISTS idx_evaluations_created_at
  ON public.evaluations (created_at DESC);
