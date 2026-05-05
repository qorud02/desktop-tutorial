import type { Evaluation, EvaluationInput } from './types';
import { calculate, calculateScenarios } from './calculations';
import { createClient } from './supabase/client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToEvaluation(row: any): Evaluation {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    input: row.input as EvaluationInput,
    result: row.result,
    scenarios: row.scenarios,
  };
}

export async function getEvaluations(): Promise<Evaluation[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('evaluations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data.map(rowToEvaluation);
}

export async function getEvaluation(id: string): Promise<Evaluation | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('evaluations')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return rowToEvaluation(data);
}

export async function saveEvaluation(
  input: EvaluationInput,
  existingId?: string
): Promise<Evaluation> {
  const supabase = createClient();
  const result = calculate(input);
  const scenarios = calculateScenarios(input);
  const now = new Date().toISOString();

  if (existingId) {
    const { data } = await supabase
      .from('evaluations')
      .update({ input, result, scenarios, updated_at: now })
      .eq('id', existingId)
      .select()
      .single();
    if (data) return rowToEvaluation(data);
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다.');

  const { data, error } = await supabase
    .from('evaluations')
    .insert({ user_id: user.id, input, result, scenarios })
    .select()
    .single();

  if (error || !data) throw new Error('평가 저장에 실패했습니다.');
  return rowToEvaluation(data);
}

export async function deleteEvaluation(id: string): Promise<void> {
  const supabase = createClient();
  await supabase.from('evaluations').delete().eq('id', id);
}
