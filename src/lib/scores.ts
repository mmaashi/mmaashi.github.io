/**
 * SŪQAI Score calculation utilities
 * Pure server-safe functions — NO "use client" directive.
 * Imported by the stock page (server component) to compute scores
 * which are then passed as props to the SuqaiScore client component.
 */

export function calculateScores(data: {
  pe: number | null;
  eps: number | null;
  divYield: number | null;
  revenue: number | null;
  netIncome: number | null;
  changePct: number | null;
  currentPrice: number | null;
  fiftyTwoHigh: number | null;
  fiftyTwoLow: number | null;
  debtToEquity?: number | null;
  roe?: number | null;
}) {
  // Value score (based on P/E — lower is better)
  let valueScore = 2.5;
  if (data.pe !== null) {
    const pe = parseFloat(String(data.pe));
    if (pe <= 0) valueScore = 1;
    else if (pe < 10) valueScore = 5;
    else if (pe < 15) valueScore = 4;
    else if (pe < 20) valueScore = 3;
    else if (pe < 30) valueScore = 2;
    else valueScore = 1;
  }

  // Growth score (based on EPS positivity and revenue)
  let growthScore = 2.5;
  if (data.eps !== null) {
    const eps = parseFloat(String(data.eps));
    if (eps > 5) growthScore = 5;
    else if (eps > 2) growthScore = 4;
    else if (eps > 0.5) growthScore = 3;
    else if (eps > 0) growthScore = 2;
    else growthScore = 1;
  }

  // Dividend score (based on yield)
  let dividendScore = 0;
  if (data.divYield !== null) {
    const dy = parseFloat(String(data.divYield));
    if (dy >= 6) dividendScore = 5;
    else if (dy >= 4) dividendScore = 4;
    else if (dy >= 2) dividendScore = 3;
    else if (dy >= 1) dividendScore = 2;
    else if (dy > 0) dividendScore = 1;
  }

  // Health score (based on profitability, leverage, and ROE)
  let healthScore = 2.5;
  let healthFactors = 0;
  let healthSum = 0;

  // Factor 1: Net margin
  if (data.netIncome !== null && data.revenue !== null && data.revenue > 0) {
    const margin = (data.netIncome / data.revenue) * 100;
    let marginScore = 2.5;
    if (margin > 30) marginScore = 5;
    else if (margin > 20) marginScore = 4;
    else if (margin > 10) marginScore = 3;
    else if (margin > 0) marginScore = 2;
    else marginScore = 1;
    healthSum += marginScore;
    healthFactors++;
  }

  // Factor 2: Debt-to-Equity (lower is healthier)
  if (data.debtToEquity !== null && data.debtToEquity !== undefined) {
    let deScore = 2.5;
    if (data.debtToEquity < 0.3) deScore = 5;
    else if (data.debtToEquity < 0.5) deScore = 4;
    else if (data.debtToEquity < 1) deScore = 3;
    else if (data.debtToEquity < 2) deScore = 2;
    else deScore = 1;
    healthSum += deScore;
    healthFactors++;
  }

  // Factor 3: ROE (higher is better)
  if (data.roe !== null && data.roe !== undefined) {
    let roeScore = 2.5;
    if (data.roe > 25) roeScore = 5;
    else if (data.roe > 15) roeScore = 4;
    else if (data.roe > 10) roeScore = 3;
    else if (data.roe > 0) roeScore = 2;
    else roeScore = 1;
    healthSum += roeScore;
    healthFactors++;
  }

  if (healthFactors > 0) {
    healthScore = healthSum / healthFactors;
  }

  // Momentum score (based on price position within 52W range)
  let momentumScore = 2.5;
  if (data.currentPrice !== null && data.fiftyTwoHigh !== null && data.fiftyTwoLow !== null) {
    const range = data.fiftyTwoHigh - data.fiftyTwoLow;
    if (range > 0) {
      const position = (data.currentPrice - data.fiftyTwoLow) / range;
      momentumScore = Math.max(0.5, Math.min(5, position * 5));
    }
  }
  if (data.changePct !== null) {
    if (data.changePct > 3) momentumScore = Math.min(5, momentumScore + 1);
    else if (data.changePct < -3) momentumScore = Math.max(0.5, momentumScore - 1);
  }

  return {
    value: Math.round(valueScore * 10) / 10,
    growth: Math.round(growthScore * 10) / 10,
    dividend: Math.round(dividendScore * 10) / 10,
    health: Math.round(healthScore * 10) / 10,
    momentum: Math.round(momentumScore * 10) / 10,
  };
}
