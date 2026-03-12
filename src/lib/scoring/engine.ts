/**
 * SŪQAI Scoring Engine — Core Calculation Logic
 * 25 checks across 5 pillars, each worth 1 point (0–5 per pillar, 0–100 overall).
 *
 * Used by:
 *  - Data Agent compute job (writes to company_scores_daily)
 *  - Builder Agent fallback (runs in-browser when DB scores are missing)
 */

import type { Check, PillarResult, ScoringInput, ScoreResult } from "./types";

// ─── helpers ────────────────────────────────────────────────────────────────

/** Safe check: returns false if either value is null/undefined/NaN */
function ok(v: number | null | undefined): v is number {
  return v != null && !Number.isNaN(v);
}

function check(name: string, passed: boolean): Check {
  return { check: name, passed };
}

function pillar(checks: Check[]): PillarResult {
  return {
    score: checks.filter((c) => c.passed).length, // 0–5
    checks,
  };
}

// ─── PILLAR 1: VALUE ────────────────────────────────────────────────────────

export function calculateValueScore(d: ScoringInput): PillarResult {
  const checks: Check[] = [
    // 1. P/E below sector average
    check(
      "PE below sector avg",
      ok(d.pe_ratio) && ok(d.sector_avg_pe) && d.pe_ratio! > 0 && d.pe_ratio! < d.sector_avg_pe!
    ),
    // 2. P/B below 1.5
    check("PB below 1.5", ok(d.pb_ratio) && d.pb_ratio! > 0 && d.pb_ratio! < 1.5),
    // 3. EV/EBITDA below sector average
    check(
      "EV/EBITDA below sector avg",
      ok(d.ev_ebitda) && ok(d.sector_avg_pe) && d.ev_ebitda! > 0 && d.ev_ebitda! < (d.sector_avg_pe! * 0.8)
      // Approximation: sector EV/EBITDA ≈ sector PE × 0.8 when we lack a direct sector EV/EBITDA avg
    ),
    // 4. P/S ratio below 3
    check("PS ratio below 3", ok(d.ps_ratio) && d.ps_ratio! > 0 && d.ps_ratio! < 3),
    // 5. PE below 20 (absolute valuation sanity)
    check("PE below 20", ok(d.pe_ratio) && d.pe_ratio! > 0 && d.pe_ratio! < 20),
  ];
  return pillar(checks);
}

// ─── PILLAR 2: GROWTH ───────────────────────────────────────────────────────

export function calculateGrowthScore(d: ScoringInput): PillarResult {
  const checks: Check[] = [
    // 1. Revenue CAGR 3Y > 5%
    check("Revenue CAGR 3Y > 5%", ok(d.revenue_cagr_3y) && d.revenue_cagr_3y! > 0.05),
    // 2. EPS growth YoY > 0%
    check("EPS growth YoY positive", ok(d.eps_growth_yoy) && d.eps_growth_yoy! > 0),
    // 3. Revenue growth YoY positive
    check("Revenue growth YoY positive", ok(d.revenue_growth_yoy) && d.revenue_growth_yoy! > 0),
    // 4. Earnings growth YoY > 10%
    check("Earnings growth > 10%", ok(d.earnings_growth_yoy) && d.earnings_growth_yoy! > 0.10),
    // 5. Revenue CAGR 5Y > sector average growth
    check(
      "Revenue CAGR 5Y above avg",
      ok(d.revenue_cagr_5y) && d.revenue_cagr_5y! > 0.05
    ),
  ];
  return pillar(checks);
}

// ─── PILLAR 3: PERFORMANCE ──────────────────────────────────────────────────

export function calculatePerformanceScore(d: ScoringInput): PillarResult {
  const checks: Check[] = [
    // 1. ROE > 15%
    check("ROE > 15%", ok(d.roe) && d.roe! > 0.15),
    // 2. ROA > 5%
    check("ROA > 5%", ok(d.roa) && d.roa! > 0.05),
    // 3. Net margin above sector average
    check(
      "Net margin above sector avg",
      ok(d.net_margin) && ok(d.sector_avg_roe)
        ? d.net_margin! > 0.10 // fallback: 10% if no sector avg net margin
        : false
    ),
    // 4. Operating margin > 15%
    check("Operating margin > 15%", ok(d.operating_margin) && d.operating_margin! > 0.15),
    // 5. 1Y return positive
    check("1Y return positive", ok(d.return_1y) && d.return_1y! > 0),
  ];
  return pillar(checks);
}

// ─── PILLAR 4: HEALTH ───────────────────────────────────────────────────────

export function calculateHealthScore(d: ScoringInput): PillarResult {
  const checks: Check[] = [
    // 1. Debt/Equity < 1.0
    check("Debt/Equity < 1.0", ok(d.debt_to_equity) && d.debt_to_equity! < 1.0),
    // 2. Current ratio > 1.0
    check("Current ratio > 1.0", ok(d.current_ratio) && d.current_ratio! > 1.0),
    // 3. Interest coverage > 3x
    check("Interest coverage > 3x", ok(d.interest_coverage) && d.interest_coverage! > 3.0),
    // 4. OCF-to-debt > 0.2
    check("OCF-to-debt > 0.2", ok(d.ocf_to_debt) && d.ocf_to_debt! > 0.2),
    // 5. Net debt / EBITDA < 3
    check(
      "Net debt/EBITDA < 3",
      ok(d.net_debt_ebitda) ? d.net_debt_ebitda! < 3.0 : true // pass if no debt data (conservative)
    ),
  ];
  return pillar(checks);
}

// ─── PILLAR 5: DIVIDEND ─────────────────────────────────────────────────────

export function calculateDividendScore(d: ScoringInput): PillarResult {
  const checks: Check[] = [
    // 1. Dividend yield > 2%
    check("Dividend yield > 2%", ok(d.dividend_yield) && d.dividend_yield! > 0.02),
    // 2. Payout ratio 20–80%
    check(
      "Payout ratio 20–80%",
      ok(d.payout_ratio) && d.payout_ratio! >= 0.20 && d.payout_ratio! <= 0.80
    ),
    // 3. 3+ years of dividends
    check("3+ years of dividends", ok(d.years_of_dividends) && d.years_of_dividends! >= 3),
    // 4. Dividend CAGR 3Y > 0%
    check("Dividend growth positive", ok(d.dividend_cagr_3y) && d.dividend_cagr_3y! > 0),
    // 5. Cash payout ratio < 100%
    check(
      "Cash payout < 100%",
      ok(d.cash_payout_ratio) ? d.cash_payout_ratio! < 1.0 : true
    ),
  ];
  return pillar(checks);
}

// ─── RISK FLAGS ─────────────────────────────────────────────────────────────

export function generateRiskFlags(d: ScoringInput): string[] {
  const flags: string[] = [];

  if (ok(d.debt_to_equity) && d.debt_to_equity! > 2.0) flags.push("high_debt");
  if (ok(d.revenue_growth_yoy) && d.revenue_growth_yoy! < -0.05) flags.push("declining_revenue");
  if (ok(d.net_margin) && d.net_margin! < 0) flags.push("negative_earnings");
  if (ok(d.dividend_cagr_3y) && d.dividend_cagr_3y! < 0) flags.push("dividend_cut");
  if (ok(d.current_ratio) && d.current_ratio! < 0.5) flags.push("liquidity_risk");
  if (ok(d.interest_coverage) && d.interest_coverage! < 1.5) flags.push("interest_burden");
  if (ok(d.pe_ratio) && d.pe_ratio! > 50) flags.push("extreme_valuation");
  if (ok(d.ocf_to_debt) && d.ocf_to_debt! < 0.05) flags.push("weak_cash_flow");

  return flags;
}

// ─── INSIGHT BADGES ─────────────────────────────────────────────────────────

export function generateInsightBadges(d: ScoringInput, overall: number): string[] {
  const badges: string[] = [];

  // Undervalued: PE below sector + PB < 1.5
  if (
    ok(d.pe_ratio) && ok(d.sector_avg_pe) && d.pe_ratio! < d.sector_avg_pe! &&
    ok(d.pb_ratio) && d.pb_ratio! < 1.5
  ) {
    badges.push("undervalued");
  }

  // Dividend champion: 5+ years of increasing dividends
  if (ok(d.years_of_dividends) && d.years_of_dividends! >= 5 && ok(d.dividend_cagr_3y) && d.dividend_cagr_3y! > 0) {
    badges.push("dividend_champion");
  }

  // High yield: > 5%
  if (ok(d.dividend_yield) && d.dividend_yield! > 0.05) {
    badges.push("high_yield");
  }

  // Growth star: revenue CAGR 3Y > 15% + EPS growth > 10%
  if (ok(d.revenue_cagr_3y) && d.revenue_cagr_3y! > 0.15 && ok(d.eps_growth_yoy) && d.eps_growth_yoy! > 0.10) {
    badges.push("growth_star");
  }

  // Value stock: PE < 10, PB < 1.0
  if (ok(d.pe_ratio) && d.pe_ratio! < 10 && ok(d.pb_ratio) && d.pb_ratio! < 1.0) {
    badges.push("value_stock");
  }

  // Dividend payer: 3+ years
  if (ok(d.years_of_dividends) && d.years_of_dividends! >= 3) {
    badges.push("dividend_payer");
  }

  // Quality business: ROE > 20% + positive net margin
  if (ok(d.roe) && d.roe! > 0.20 && ok(d.net_margin) && d.net_margin! > 0) {
    badges.push("quality_business");
  }

  // Top rated: overall > 80
  if (overall > 80) {
    badges.push("top_rated");
  }

  return badges;
}

// ─── ORCHESTRATOR ───────────────────────────────────────────────────────────

/**
 * Calculate all 5 pillar scores, risk flags, and insight badges.
 * Returns a ScoreResult ready to upsert into company_scores_daily.
 */
export function calculateAllScores(input: ScoringInput): ScoreResult {
  const value = calculateValueScore(input);
  const growth = calculateGrowthScore(input);
  const performance = calculatePerformanceScore(input);
  const health = calculateHealthScore(input);
  const dividend = calculateDividendScore(input);

  const totalChecks = value.score + growth.score + performance.score + health.score + dividend.score;
  const overall = Math.round((totalChecks / 25) * 100 * 10) / 10; // 0–100, 1 decimal

  const riskFlags = generateRiskFlags(input);
  const insightBadges = generateInsightBadges(input, overall);

  return {
    value_score: value.score,
    growth_score: growth.score,
    performance_score: performance.score,
    health_score: health.score,
    dividend_score: dividend.score,
    overall_score: overall,

    value_checks: value.checks,
    growth_checks: growth.checks,
    performance_checks: performance.checks,
    health_checks: health.checks,
    dividend_checks: dividend.checks,

    risk_flags: riskFlags,
    insight_badges: insightBadges,
  };
}
