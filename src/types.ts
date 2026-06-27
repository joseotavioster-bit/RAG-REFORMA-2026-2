export interface IndicatorItem {
  value: number;
  explanation: string;
}

export interface IndicatorsGroup {
  current: IndicatorItem;
  general: IndicatorItem;
  dry: IndicatorItem;
}

export interface ProfitabilityGroup {
  grossMargin: IndicatorItem;
  operatingMargin: IndicatorItem;
  netMargin: IndicatorItem;
  roa: IndicatorItem;
  roe: IndicatorItem;
}

export interface IndebtednessGroup {
  debtRatio: IndicatorItem;
  thirdCapitalParticipation: IndicatorItem;
}

export interface Indicators {
  liquidity: IndicatorsGroup;
  profitability: ProfitabilityGroup;
  indebtedness: IndebtednessGroup;
}

export interface RevenueProfitData {
  year: string;
  revenue: number;
  netProfit: number;
}

export interface AssetLiabilityData {
  category: string;
  value: number;
}

export interface MetricComparisonData {
  metric: string;
  currentYear: number;
  previousYear: number;
}

export interface ChartData {
  revenueProfit: RevenueProfitData[];
  assetsLiabilities: AssetLiabilityData[];
  liquidityEvolution: MetricComparisonData[];
  profitabilityEvolution: MetricComparisonData[];
}

export interface AnalysisResponse {
  companyName: string;
  year: string;
  sector: string;
  executiveSummary: string;
  strengths: string[];
  challenges: string[];
  recommendations: string[];
  indicators: Indicators;
  balanceSheetReport: string;
  dreReport: string;
  dfcReport: string;
  notesReport: string;
  charts: ChartData;
}
