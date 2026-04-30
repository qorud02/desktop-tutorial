import type { Evaluation, EvaluationInput } from './types';
import { calculate, calculateScenarios } from './calculations';

const STORAGE_KEY = 'unicup_evaluations';

export function getEvaluations(): Evaluation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getEvaluation(id: string): Evaluation | null {
  return getEvaluations().find((e) => e.id === id) ?? null;
}

export function saveEvaluation(input: EvaluationInput, existingId?: string): Evaluation {
  const evaluations = getEvaluations();
  const result = calculate(input);
  const scenarios = calculateScenarios(input);
  const now = new Date().toISOString();

  if (existingId) {
    const idx = evaluations.findIndex((e) => e.id === existingId);
    if (idx !== -1) {
      const updated: Evaluation = {
        ...evaluations[idx],
        updatedAt: now,
        input,
        result,
        scenarios,
      };
      evaluations[idx] = updated;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(evaluations));
      return updated;
    }
  }

  const evaluation: Evaluation = {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    input,
    result,
    scenarios,
  };
  evaluations.push(evaluation);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(evaluations));
  return evaluation;
}

export function deleteEvaluation(id: string): void {
  const evaluations = getEvaluations().filter((e) => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(evaluations));
}
