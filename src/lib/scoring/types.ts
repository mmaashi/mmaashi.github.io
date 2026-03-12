/**
 * SŪQAI Scoring Engine — Type Definitions
 * Used by both the Data Agent (compute job) and Builder Agent (fallback display).
 */

export interface Check {
  check: string;
  passed: boolean;
}

export interface PillarResult {
  score: number; // 0.0–5.0
  checks: Check[];
}

export interface ScoringInput {
  // Price
  close_price: number | null;
  market_cap: number | null;

  // Valuation
  pe_ratio: number | null;
  pb_ratio: number | null;
  ps_ratio: number | null;
  ev_ebitda: number | null;

  // Sector averages for comparison
  sector_avg_pe: number | null;
  sector_avg_pb: number | null;
  sector_avg_roe: number | null;
  sector_avg_dividend_yield: number | null;
  sector_avg_debt_to_equity: number | null;

  // Growth
  revenue_growth_yoy: number | null;  // decimal (0.12 = 12%)
  earnings_growth_yoy: number | null;
  eps_growth_yoy: number | null;
  revenue_cagr_3y: number | null;
  revenue_cagr_5y: number | null;

  // Profitability
  roe: number | null;           // decimal
  roa: number | null;           // decimal
  net_margin: number | null;    // decimal
  operating_margin: number | null; // decimal

  // Health
  debt_to_equity: number | null;
  current_ratio: number | null;
  interest_coverage: number | null;
  ocf_to_debt: number | null;
  net_debt_ebitda: number | null;

  // Dividends
  dividend_yield: number | null;  // decimal (0.035 = 3.5%)
  payout_ratio: number | null;    // decimal
  cash_payout_ratio: number | null;
  dividend_cagr_3y: number | null;
  years_of_dividends: number | null;

  // Returns
  return_1y: number | null;
  return_3y: number | null;
}

export interface ScoreResult {
  value_score: number;
  growth_score: number;
  performance_score: number;
  health_score: number;
  dividend_score: number;
  overall_score: number;

  value_checks: Check[];
  growth_checks: Check[];
  performance_checks: Check[];
  health_checks: Check[];
  dividend_checks: Check[];

  risk_flags: string[];
  insight_badges: string[];
}
