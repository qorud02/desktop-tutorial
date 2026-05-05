export type AreaType =
  | 'office'
  | 'station'
  | 'residential'
  | 'mixed_mall'
  | 'university';

export const AREA_TYPE_LABELS: Record<AreaType, string> = {
  office: '오피스 상권',
  station: '역세권',
  residential: '주거지',
  mixed_mall: '복합몰',
  university: '대학가',
};

export interface EvaluationInput {
  locationName: string;
  areaType: AreaType;
  address?: string;          // 카카오 주소 검색으로 선택된 도로명/지번 주소
  operatingDays: number;
  dailyVisitors: number;
  avgTransactionValue: number;
  grossMarginRate: number;
  monthlyRent: number;
  monthlyLaborCost: number;
  otherFixedCosts: number;
  initialInvestment: number;
  nearbyCafes: number;
  frontVisibilityScore: number;
  trafficAccessibilityScore: number;
  groupOrderScore: number;
  operationDifficultyScore: number;
  locationMemo: string;
}

export interface CalculationResult {
  monthlyExpectedSales: number;
  monthlyGrossProfit: number;
  monthlyOperatingProfit: number;
  rentBurdenRatio: number;
  breakEvenDailyVisitors: number;
  breakEvenDailySales: number;
  operatingProfitMargin: number;
  paybackPeriod: number;
  totalScore: number;
  decision: '우선검토' | '조건부검토' | '보류';
  risks: string[];
  interpretations: Record<string, string>;
}

export interface ScenarioResult {
  name: string;
  nameKo: string;
  dailyVisitorsAdj: number;
  avgTransactionAdj: number;
  rentAdj: number;
  dailyVisitors: number;
  avgTransactionValue: number;
  monthlyExpectedSales: number;
  monthlyGrossProfit: number;
  totalFixedCosts: number;
  monthlyOperatingProfit: number;
  rentBurdenRatio: number;
  paybackPeriod: number;
  scenarioDecision: string;
}

export interface Evaluation {
  id: string;
  createdAt: string;
  updatedAt: string;
  input: EvaluationInput;
  result: CalculationResult;
  scenarios: ScenarioResult[];
}
