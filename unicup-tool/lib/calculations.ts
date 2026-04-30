import type {
  EvaluationInput,
  CalculationResult,
  ScenarioResult,
} from './types';

export function calculate(input: EvaluationInput): CalculationResult {
  const {
    operatingDays,
    dailyVisitors,
    avgTransactionValue,
    grossMarginRate,
    monthlyRent,
    monthlyLaborCost,
    otherFixedCosts,
    initialInvestment,
    nearbyCafes,
    frontVisibilityScore,
    trafficAccessibilityScore,
    groupOrderScore,
    operationDifficultyScore,
  } = input;

  const margin = grossMarginRate / 100;
  const totalFixedCosts = monthlyRent + monthlyLaborCost + otherFixedCosts;

  const monthlyExpectedSales = operatingDays * dailyVisitors * avgTransactionValue;
  const monthlyGrossProfit = monthlyExpectedSales * margin;
  const monthlyOperatingProfit = monthlyGrossProfit - totalFixedCosts;
  const rentBurdenRatio = monthlyExpectedSales > 0 ? monthlyRent / monthlyExpectedSales : 0;
  const breakEvenDailyVisitors =
    avgTransactionValue * margin * operatingDays > 0
      ? totalFixedCosts / (avgTransactionValue * margin * operatingDays)
      : 999;
  const breakEvenDailySales =
    margin * operatingDays > 0
      ? totalFixedCosts / (margin * operatingDays)
      : 999;
  const operatingProfitMargin =
    monthlyExpectedSales > 0 ? monthlyOperatingProfit / monthlyExpectedSales : 0;
  const paybackPeriod =
    monthlyOperatingProfit > 0 ? initialInvestment / monthlyOperatingProfit : 999;

  // Scoring
  const salesScore = scoreSales(monthlyExpectedSales);
  const profitScore = scoreProfit(monthlyOperatingProfit);
  const rentScore = scoreRent(rentBurdenRatio);
  const paybackScore = scorePayback(paybackPeriod);
  const competitionScore = scoreCompetition(nearbyCafes);
  const qualitativeAvg =
    (frontVisibilityScore + trafficAccessibilityScore + groupOrderScore + operationDifficultyScore) /
    4;
  const qualitativeScore = (qualitativeAvg / 5) * 15;

  const totalScore =
    salesScore + profitScore + rentScore + paybackScore + competitionScore + qualitativeScore;

  let decision: CalculationResult['decision'];
  if (totalScore >= 80) decision = '우선검토';
  else if (totalScore >= 65) decision = '조건부검토';
  else decision = '보류';

  const risks: string[] = [];
  if (monthlyOperatingProfit <= 0) risks.push('적자 구조');
  if (rentBurdenRatio > 0.13) risks.push('임차료 부담');
  if (paybackPeriod > 24) risks.push('과도한 회수 기간');
  if (risks.length === 0) risks.push('정상 범위');

  const interpretations: Record<string, string> = {
    monthlyExpectedSales:
      monthlyExpectedSales >= 30_000_000
        ? '양호한 상권 규모'
        : monthlyExpectedSales >= 20_000_000
          ? '검토 가능'
          : '매출 가정 취약',
    monthlyOperatingProfit:
      monthlyOperatingProfit >= 7_000_000
        ? '우수한 영업이익'
        : monthlyOperatingProfit > 0
          ? '흑자이나 미약'
          : '적자 위험',
    rentBurdenRatio:
      rentBurdenRatio <= 0.1
        ? '양호'
        : rentBurdenRatio <= 0.13
          ? '주의 필요'
          : '위험 수준',
    operatingProfitMargin:
      operatingProfitMargin >= 0.15
        ? '양호'
        : operatingProfitMargin >= 0.1
          ? '주의 필요'
          : '낮은 수익률',
    paybackPeriod:
      paybackPeriod <= 18
        ? '양호'
        : paybackPeriod <= 24
          ? '주의 필요'
          : '위험 수준',
  };

  return {
    monthlyExpectedSales,
    monthlyGrossProfit,
    monthlyOperatingProfit,
    rentBurdenRatio,
    breakEvenDailyVisitors,
    breakEvenDailySales,
    operatingProfitMargin,
    paybackPeriod,
    totalScore,
    decision,
    risks,
    interpretations,
  };
}

function scoreSales(sales: number): number {
  if (sales >= 30_000_000) return 25;
  if (sales >= 25_000_000) return 20;
  if (sales >= 20_000_000) return 15;
  if (sales >= 15_000_000) return 10;
  return 5;
}

function scoreProfit(profit: number): number {
  if (profit >= 7_000_000) return 20;
  if (profit >= 5_000_000) return 16;
  if (profit >= 3_000_000) return 12;
  if (profit > 0) return 8;
  return 0;
}

function scoreRent(ratio: number): number {
  if (ratio <= 0.08) return 15;
  if (ratio <= 0.10) return 12;
  if (ratio <= 0.13) return 8;
  return 3;
}

function scorePayback(months: number): number {
  if (months <= 18) return 15;
  if (months <= 24) return 10;
  if (months <= 36) return 5;
  return 0;
}

function scoreCompetition(nearbyCafes: number): number {
  if (nearbyCafes <= 3) return 10;
  if (nearbyCafes <= 7) return 6;
  return 2;
}

export function calculateScenarios(input: EvaluationInput): ScenarioResult[] {
  const scenarios = [
    { name: 'conservative', nameKo: '보수적', dailyVisitorsAdj: -0.2, avgTransactionAdj: -0.05, rentAdj: 0 },
    { name: 'base', nameKo: '기본', dailyVisitorsAdj: 0, avgTransactionAdj: 0, rentAdj: 0 },
    { name: 'aggressive', nameKo: '공격적', dailyVisitorsAdj: 0.2, avgTransactionAdj: 0.05, rentAdj: 0.1 },
  ];

  return scenarios.map((s) => {
    const dailyVisitors = input.dailyVisitors * (1 + s.dailyVisitorsAdj);
    const avgTransactionValue = input.avgTransactionValue * (1 + s.avgTransactionAdj);
    const monthlyRent = input.monthlyRent * (1 + s.rentAdj);
    const margin = input.grossMarginRate / 100;
    const totalFixedCosts =
      monthlyRent + input.monthlyLaborCost + input.otherFixedCosts;
    const monthlyExpectedSales =
      input.operatingDays * dailyVisitors * avgTransactionValue;
    const monthlyGrossProfit = monthlyExpectedSales * margin;
    const monthlyOperatingProfit = monthlyGrossProfit - totalFixedCosts;
    const rentBurdenRatio =
      monthlyExpectedSales > 0 ? monthlyRent / monthlyExpectedSales : 0;
    const paybackPeriod =
      monthlyOperatingProfit > 0
        ? input.initialInvestment / monthlyOperatingProfit
        : 999;

    let scenarioDecision: string;
    if (monthlyOperatingProfit < 0) scenarioDecision = '사업 불가';
    else if (rentBurdenRatio > 0.13) scenarioDecision = '임차 위험';
    else if (paybackPeriod > 24) scenarioDecision = '회수 지연';
    else scenarioDecision = '검토 가능';

    return {
      name: s.name,
      nameKo: s.nameKo,
      dailyVisitorsAdj: s.dailyVisitorsAdj * 100,
      avgTransactionAdj: s.avgTransactionAdj * 100,
      rentAdj: s.rentAdj * 100,
      dailyVisitors,
      avgTransactionValue,
      monthlyExpectedSales,
      monthlyGrossProfit,
      totalFixedCosts,
      monthlyOperatingProfit,
      rentBurdenRatio,
      paybackPeriod,
      scenarioDecision,
    };
  });
}
