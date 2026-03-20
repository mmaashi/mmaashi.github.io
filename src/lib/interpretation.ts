/**
 * SŪQAI Investor Interpretation Engine
 * Translates raw metric data into investor-readable insights.
 *
 * Rules:
 *   - Never fabricate data: if a metric is null, return "insufficient_data"
 *   - Never convert NULL to 0
 *   - All percentages stored as decimals (0.12 = 12%)
 *   - All ratios stored as raw numbers (1.5x = 1.5)
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type Signal = "strong" | "positive" | "neutral" | "caution" | "negative" | "insufficient_data";

export interface Interpretation {
  signal: Signal;
  label: string;       // e.g. "Cheap", "Expensive", "Strong"
  labelAr: string;
  detail: string;      // one-line English explanation
  detailAr: string;    // one-line Arabic explanation
}

export interface MetricDisplay {
  value: string;        // formatted display value
  raw: number | null;   // raw number for sorting/comparison
  signal: Signal;
  hidden: boolean;      // true = should not render at all
  note?: string;        // optional footnote (e.g. "No dividends paid")
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function ok(v: number | null | undefined): v is number {
  return v != null && !Number.isNaN(v) && Number.isFinite(v);
}

function pct(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

function ratio(v: number): string {
  return v.toFixed(2);
}

function x(v: number): string {
  return `${v.toFixed(1)}x`;
}

// ─── VALUATION ──────────────────────────────────────────────────────────────

export function valuationSummary(
  pe: number | null,
  pb: number | null,
  ps: number | null,
  evEbitda: number | null,
  sectorPctilePe: number | null,
  sectorPctilePb: number | null,
): Interpretation {
  const metrics = [pe, pb, ps, evEbitda].filter(ok);
  if (metrics.length === 0) {
    return { signal: "insufficient_data", label: "No Data", labelAr: "لا توجد بيانات", detail: "Valuation metrics unavailable.", detailAr: "مقاييس التقييم غير متوفرة." };
  }

  let cheapSignals = 0;
  let expensiveSignals = 0;

  if (ok(pe)) {
    if (pe < 0) { /* negative earnings — skip */ }
    else if (pe < 12) cheapSignals++;
    else if (pe > 25) expensiveSignals++;
  }
  if (ok(pb)) {
    if (pb < 1.0) cheapSignals++;
    else if (pb > 3.0) expensiveSignals++;
  }
  if (ok(ps)) {
    if (ps < 1.5) cheapSignals++;
    else if (ps > 5.0) expensiveSignals++;
  }
  if (ok(evEbitda)) {
    if (evEbitda < 8) cheapSignals++;
    else if (evEbitda > 18) expensiveSignals++;
  }

  // Sector percentile overlay
  if (ok(sectorPctilePe) && sectorPctilePe < 25) cheapSignals++;
  if (ok(sectorPctilePe) && sectorPctilePe > 75) expensiveSignals++;

  if (cheapSignals >= 3) return { signal: "positive", label: "Cheap", labelAr: "رخيص", detail: "Trading below fair value on multiple metrics.", detailAr: "يتداول أقل من القيمة العادلة بمقاييس متعددة." };
  if (expensiveSignals >= 3) return { signal: "negative", label: "Expensive", labelAr: "مكلف", detail: "Premium valuation across multiple metrics.", detailAr: "تقييم مرتفع عبر مقاييس متعددة." };
  if (cheapSignals > expensiveSignals) return { signal: "positive", label: "Reasonably Valued", labelAr: "تقييم معقول", detail: "Slightly below average valuation.", detailAr: "أقل قليلاً من متوسط التقييم." };
  if (expensiveSignals > cheapSignals) return { signal: "caution", label: "Rich Valuation", labelAr: "تقييم مرتفع", detail: "Slightly above average valuation.", detailAr: "أعلى قليلاً من متوسط التقييم." };
  return { signal: "neutral", label: "Fair Value", labelAr: "قيمة عادلة", detail: "Trading near fair value.", detailAr: "يتداول قرب القيمة العادلة." };
}

export function isCheapRelativeToSector(sectorPctile: number | null): boolean | null {
  if (!ok(sectorPctile)) return null;
  return sectorPctile < 30; // bottom 30% of sector = cheap
}

export function isExpensiveRelativeToSector(sectorPctile: number | null): boolean | null {
  if (!ok(sectorPctile)) return null;
  return sectorPctile > 70; // top 30% of sector = expensive
}

// ─── QUALITY / PROFITABILITY ────────────────────────────────────────────────

export function profitabilityStrength(
  roe: number | null,
  roa: number | null,
  netMargin: number | null,
  opMargin: number | null,
): Interpretation {
  const available = [roe, roa, netMargin, opMargin].filter(ok);
  if (available.length === 0) {
    return { signal: "insufficient_data", label: "No Data", labelAr: "لا توجد بيانات", detail: "Profitability metrics unavailable.", detailAr: "مقاييس الربحية غير متوفرة." };
  }

  let strong = 0;
  let weak = 0;

  if (ok(roe)) { roe > 0.15 ? strong++ : roe < 0.05 ? weak++ : null; }
  if (ok(roa)) { roa > 0.05 ? strong++ : roa < 0.01 ? weak++ : null; }
  if (ok(netMargin)) { netMargin > 0.15 ? strong++ : netMargin < 0 ? weak++ : null; }
  if (ok(opMargin)) { opMargin > 0.15 ? strong++ : opMargin < 0.05 ? weak++ : null; }

  if (strong >= 3) return { signal: "strong", label: "High Quality", labelAr: "جودة عالية", detail: "Strong profitability across key margins and returns.", detailAr: "ربحية قوية عبر الهوامش والعوائد الرئيسية." };
  if (weak >= 3) return { signal: "negative", label: "Weak Profitability", labelAr: "ربحية ضعيفة", detail: "Below-average margins and returns.", detailAr: "هوامش وعوائد أقل من المتوسط." };
  if (strong > weak) return { signal: "positive", label: "Good Quality", labelAr: "جودة جيدة", detail: "Above-average profitability.", detailAr: "ربحية فوق المتوسط." };
  return { signal: "neutral", label: "Average", labelAr: "متوسط", detail: "Profitability in line with peers.", detailAr: "ربحية متماشية مع الأقران." };
}

export function capitalEfficiencySummary(
  roe: number | null,
  roa: number | null,
  roce: number | null,
): Interpretation {
  if (!ok(roe) && !ok(roa) && !ok(roce)) {
    return { signal: "insufficient_data", label: "No Data", labelAr: "لا توجد بيانات", detail: "Capital efficiency metrics unavailable.", detailAr: "مقاييس كفاءة رأس المال غير متوفرة." };
  }
  const avg = [roe, roa, roce].filter(ok).reduce((a, b) => a + b, 0) / [roe, roa, roce].filter(ok).length;
  if (avg > 0.15) return { signal: "strong", label: "Excellent Returns", labelAr: "عوائد ممتازة", detail: `Average return on capital: ${pct(avg)}.`, detailAr: `متوسط العائد على رأس المال: ${pct(avg)}.` };
  if (avg > 0.08) return { signal: "positive", label: "Good Returns", labelAr: "عوائد جيدة", detail: `Average return on capital: ${pct(avg)}.`, detailAr: `متوسط العائد على رأس المال: ${pct(avg)}.` };
  if (avg > 0) return { signal: "neutral", label: "Moderate Returns", labelAr: "عوائد معتدلة", detail: `Average return on capital: ${pct(avg)}.`, detailAr: `متوسط العائد على رأس المال: ${pct(avg)}.` };
  return { signal: "negative", label: "Poor Returns", labelAr: "عوائد ضعيفة", detail: "Returns on capital below expectations.", detailAr: "عوائد على رأس المال أقل من التوقعات." };
}

// ─── SAFETY / BALANCE SHEET ─────────────────────────────────────────────────

export function balanceSheetRiskLevel(
  debtToEquity: number | null,
  currentRatio: number | null,
  interestCoverage: number | null,
  netDebtEbitda: number | null,
  ocfToDebt: number | null,
): Interpretation {
  const available = [debtToEquity, currentRatio, interestCoverage, netDebtEbitda, ocfToDebt].filter(ok);
  if (available.length === 0) {
    return { signal: "insufficient_data", label: "No Data", labelAr: "لا توجد بيانات", detail: "Balance sheet metrics unavailable.", detailAr: "مقاييس الميزانية العمومية غير متوفرة." };
  }

  let safe = 0;
  let risky = 0;

  if (ok(debtToEquity)) { debtToEquity < 0.5 ? safe++ : debtToEquity > 2.0 ? risky++ : null; }
  if (ok(currentRatio)) { currentRatio > 1.5 ? safe++ : currentRatio < 1.0 ? risky++ : null; }
  if (ok(interestCoverage)) { interestCoverage > 5 ? safe++ : interestCoverage < 2 ? risky++ : null; }
  if (ok(netDebtEbitda)) { netDebtEbitda < 2 ? safe++ : netDebtEbitda > 4 ? risky++ : null; }
  if (ok(ocfToDebt)) { ocfToDebt > 0.3 ? safe++ : ocfToDebt < 0.1 ? risky++ : null; }

  if (safe >= 3) return { signal: "strong", label: "Strong Balance Sheet", labelAr: "ميزانية قوية", detail: "Low leverage with comfortable liquidity.", detailAr: "رافعة مالية منخفضة مع سيولة مريحة." };
  if (risky >= 3) return { signal: "negative", label: "Leveraged", labelAr: "مديونية عالية", detail: "Elevated debt levels with potential liquidity pressure.", detailAr: "مستويات ديون مرتفعة مع ضغط محتمل على السيولة." };
  if (safe > risky) return { signal: "positive", label: "Healthy", labelAr: "صحي", detail: "Manageable debt with adequate liquidity.", detailAr: "ديون قابلة للإدارة مع سيولة كافية." };
  if (risky > safe) return { signal: "caution", label: "Watch Debt", labelAr: "راقب الديون", detail: "Some leverage metrics warrant monitoring.", detailAr: "بعض مقاييس الرافعة المالية تستدعي المراقبة." };
  return { signal: "neutral", label: "Average", labelAr: "متوسط", detail: "Balance sheet in line with sector norms.", detailAr: "ميزانية عمومية متماشية مع معايير القطاع." };
}

export function liquidityStatus(currentRatio: number | null): Interpretation {
  if (!ok(currentRatio)) return { signal: "insufficient_data", label: "No Data", labelAr: "لا توجد بيانات", detail: "Current ratio unavailable.", detailAr: "نسبة التداول غير متوفرة." };
  if (currentRatio > 2.0) return { signal: "strong", label: "Very Liquid", labelAr: "سيولة عالية جداً", detail: `Current ratio: ${ratio(currentRatio)}`, detailAr: `نسبة التداول: ${ratio(currentRatio)}` };
  if (currentRatio > 1.2) return { signal: "positive", label: "Adequate Liquidity", labelAr: "سيولة كافية", detail: `Current ratio: ${ratio(currentRatio)}`, detailAr: `نسبة التداول: ${ratio(currentRatio)}` };
  if (currentRatio > 1.0) return { signal: "neutral", label: "Tight Liquidity", labelAr: "سيولة محدودة", detail: `Current ratio: ${ratio(currentRatio)}`, detailAr: `نسبة التداول: ${ratio(currentRatio)}` };
  return { signal: "negative", label: "Liquidity Risk", labelAr: "خطر سيولة", detail: `Current ratio below 1.0 (${ratio(currentRatio)}).`, detailAr: `نسبة التداول أقل من 1.0 (${ratio(currentRatio)}).` };
}

export function debtBurdenSummary(debtToEquity: number | null, netDebtEbitda: number | null): Interpretation {
  if (!ok(debtToEquity) && !ok(netDebtEbitda)) return { signal: "insufficient_data", label: "No Data", labelAr: "لا توجد بيانات", detail: "Debt metrics unavailable.", detailAr: "مقاييس الديون غير متوفرة." };

  let level: Signal = "neutral";
  if (ok(debtToEquity)) {
    if (debtToEquity < 0.3) level = "strong";
    else if (debtToEquity < 1.0) level = "positive";
    else if (debtToEquity > 2.0) level = "negative";
    else if (debtToEquity > 1.0) level = "caution";
  }
  if (ok(netDebtEbitda) && netDebtEbitda > 4) level = "negative";

  const labels: Record<Signal, [string, string]> = {
    strong: ["Very Low Debt", "ديون منخفضة جداً"],
    positive: ["Low Debt", "ديون منخفضة"],
    neutral: ["Moderate Debt", "ديون معتدلة"],
    caution: ["Elevated Debt", "ديون مرتفعة"],
    negative: ["High Debt", "ديون عالية"],
    insufficient_data: ["No Data", "لا توجد بيانات"],
  };

  return { signal: level, label: labels[level][0], labelAr: labels[level][1], detail: `D/E: ${ok(debtToEquity) ? ratio(debtToEquity) : "—"}${ok(netDebtEbitda) ? ` | ND/EBITDA: ${x(netDebtEbitda)}` : ""}`, detailAr: `الدين/حقوق الملكية: ${ok(debtToEquity) ? ratio(debtToEquity) : "—"}${ok(netDebtEbitda) ? ` | صافي الدين/الأرباح: ${x(netDebtEbitda)}` : ""}` };
}

// ─── DIVIDEND ───────────────────────────────────────────────────────────────

export function dividendProfile(
  divYield: number | null,
  payoutRatio: number | null,
  divCagr3y: number | null,
  yearsOfDiv: number | null,
): Interpretation {
  // No dividend at all
  if ((!ok(divYield) || divYield === 0) && (!ok(yearsOfDiv) || yearsOfDiv === 0)) {
    return { signal: "neutral", label: "No Dividend", labelAr: "لا توزيعات", detail: "This company does not currently pay dividends.", detailAr: "هذه الشركة لا توزع أرباحاً حالياً." };
  }

  let score = 0;
  if (ok(divYield) && divYield > 0.03) score++;
  if (ok(divYield) && divYield > 0.05) score++;
  if (ok(payoutRatio) && payoutRatio >= 0.20 && payoutRatio <= 0.70) score++;
  if (ok(divCagr3y) && divCagr3y > 0) score++;
  if (ok(yearsOfDiv) && yearsOfDiv >= 5) score++;
  if (ok(yearsOfDiv) && yearsOfDiv >= 10) score++;

  if (score >= 5) return { signal: "strong", label: "Dividend Champion", labelAr: "بطل التوزيعات", detail: `${pct(divYield!)} yield, ${yearsOfDiv}+ years of payouts, growing dividends.`, detailAr: `عائد ${pct(divYield!)}، ${yearsOfDiv}+ سنوات من التوزيعات، توزيعات متنامية.` };
  if (score >= 3) return { signal: "positive", label: "Income Stock", labelAr: "سهم دخل", detail: `${ok(divYield) ? pct(divYield) : "—"} yield with consistent payouts.`, detailAr: `عائد ${ok(divYield) ? pct(divYield) : "—"} مع توزيعات منتظمة.` };
  if (score >= 1) return { signal: "neutral", label: "Moderate Dividend", labelAr: "توزيعات معتدلة", detail: "Pays dividends but with limited track record or low yield.", detailAr: "يوزع أرباحاً لكن بسجل محدود أو عائد منخفض." };
  return { signal: "caution", label: "Weak Dividend", labelAr: "توزيعات ضعيفة", detail: "Dividend history or yield below expectations.", detailAr: "تاريخ التوزيعات أو العائد أقل من التوقعات." };
}

export function payoutSustainability(payoutRatio: number | null): Interpretation {
  if (!ok(payoutRatio)) return { signal: "insufficient_data", label: "No Data", labelAr: "لا توجد بيانات", detail: "Payout ratio unavailable.", detailAr: "نسبة التوزيع غير متوفرة." };
  if (payoutRatio < 0) return { signal: "negative", label: "Negative Payout", labelAr: "توزيع سلبي", detail: "Paying dividends from reserves (negative earnings).", detailAr: "يوزع أرباحاً من الاحتياطيات (أرباح سلبية)." };
  if (payoutRatio <= 0.50) return { signal: "strong", label: "Sustainable", labelAr: "مستدام", detail: `Payout ratio: ${pct(payoutRatio)} — ample room to grow.`, detailAr: `نسبة التوزيع: ${pct(payoutRatio)} — مجال كبير للنمو.` };
  if (payoutRatio <= 0.75) return { signal: "positive", label: "Comfortable", labelAr: "مريح", detail: `Payout ratio: ${pct(payoutRatio)} — balanced.`, detailAr: `نسبة التوزيع: ${pct(payoutRatio)} — متوازن.` };
  if (payoutRatio <= 0.90) return { signal: "caution", label: "Stretched", labelAr: "ممتد", detail: `Payout ratio: ${pct(payoutRatio)} — limited room for growth.`, detailAr: `نسبة التوزيع: ${pct(payoutRatio)} — مجال محدود للنمو.` };
  return { signal: "negative", label: "Unsustainable", labelAr: "غير مستدام", detail: `Payout ratio: ${pct(payoutRatio)} — paying out more than earnings.`, detailAr: `نسبة التوزيع: ${pct(payoutRatio)} — يوزع أكثر من الأرباح.` };
}

export function dividendConsistency(yearsOfDiv: number | null, divCagr3y: number | null): Interpretation {
  if (!ok(yearsOfDiv)) return { signal: "insufficient_data", label: "No Data", labelAr: "لا توجد بيانات", detail: "Dividend history unavailable.", detailAr: "تاريخ التوزيعات غير متوفر." };
  if (yearsOfDiv >= 10 && ok(divCagr3y) && divCagr3y > 0) return { signal: "strong", label: "Excellent Track Record", labelAr: "سجل ممتاز", detail: `${yearsOfDiv} years of dividends, growing at ${pct(divCagr3y)}/yr.`, detailAr: `${yearsOfDiv} سنوات من التوزيعات، تنمو بمعدل ${pct(divCagr3y)}/سنوياً.` };
  if (yearsOfDiv >= 5) return { signal: "positive", label: "Consistent", labelAr: "منتظم", detail: `${yearsOfDiv} years of dividend payments.`, detailAr: `${yearsOfDiv} سنوات من التوزيعات.` };
  if (yearsOfDiv >= 2) return { signal: "neutral", label: "Short Track Record", labelAr: "سجل قصير", detail: `Only ${yearsOfDiv} years of dividend history.`, detailAr: `${yearsOfDiv} سنوات فقط من تاريخ التوزيعات.` };
  return { signal: "caution", label: "New Dividend", labelAr: "توزيعات جديدة", detail: "Recently started paying dividends.", detailAr: "بدأ مؤخراً في توزيع الأرباح." };
}

// ─── MOMENTUM ───────────────────────────────────────────────────────────────

export function momentumRegime(
  return1m: number | null,
  return3m: number | null,
  return1y: number | null,
  relPerfVsTasi: number | null,
): Interpretation {
  const returns = [return1m, return3m, return1y].filter(ok);
  if (returns.length === 0) {
    return { signal: "insufficient_data", label: "No Data", labelAr: "لا توجد بيانات", detail: "Return data unavailable.", detailAr: "بيانات العوائد غير متوفرة." };
  }

  let bullish = 0;
  let bearish = 0;

  if (ok(return1m)) { return1m > 0.03 ? bullish++ : return1m < -0.03 ? bearish++ : null; }
  if (ok(return3m)) { return3m > 0.08 ? bullish++ : return3m < -0.08 ? bearish++ : null; }
  if (ok(return1y)) { return1y > 0.15 ? bullish++ : return1y < -0.10 ? bearish++ : null; }
  if (ok(relPerfVsTasi)) { relPerfVsTasi > 0.05 ? bullish++ : relPerfVsTasi < -0.05 ? bearish++ : null; }

  if (bullish >= 3) return { signal: "strong", label: "Strong Uptrend", labelAr: "اتجاه صعودي قوي", detail: "Positive momentum across all timeframes.", detailAr: "زخم إيجابي عبر جميع الأطر الزمنية." };
  if (bearish >= 3) return { signal: "negative", label: "Downtrend", labelAr: "اتجاه هبوطي", detail: "Negative momentum across multiple timeframes.", detailAr: "زخم سلبي عبر أطر زمنية متعددة." };
  if (bullish > bearish) return { signal: "positive", label: "Positive Momentum", labelAr: "زخم إيجابي", detail: "Generally improving price action.", detailAr: "تحسن عام في حركة السعر." };
  if (bearish > bullish) return { signal: "caution", label: "Weakening", labelAr: "ضعف", detail: "Price action showing some weakness.", detailAr: "حركة السعر تُظهر بعض الضعف." };
  return { signal: "neutral", label: "Sideways", labelAr: "عرضي", detail: "No clear directional trend.", detailAr: "لا يوجد اتجاه واضح." };
}

export function relativeStrengthVsTASI(relPerf: number | null): Interpretation {
  if (!ok(relPerf)) return { signal: "insufficient_data", label: "No Data", labelAr: "لا توجد بيانات", detail: "TASI comparison unavailable.", detailAr: "مقارنة تاسي غير متوفرة." };
  if (relPerf > 0.15) return { signal: "strong", label: "Major Outperformer", labelAr: "متفوق بشكل كبير", detail: `+${pct(relPerf)} vs TASI.`, detailAr: `+${pct(relPerf)} مقابل تاسي.` };
  if (relPerf > 0.05) return { signal: "positive", label: "Outperforming", labelAr: "متفوق", detail: `+${pct(relPerf)} vs TASI.`, detailAr: `+${pct(relPerf)} مقابل تاسي.` };
  if (relPerf > -0.05) return { signal: "neutral", label: "In Line", labelAr: "متماشي", detail: "Tracking TASI performance.", detailAr: "يتتبع أداء تاسي." };
  if (relPerf > -0.15) return { signal: "caution", label: "Underperforming", labelAr: "أداء ضعيف", detail: `${pct(relPerf)} vs TASI.`, detailAr: `${pct(relPerf)} مقابل تاسي.` };
  return { signal: "negative", label: "Major Underperformer", labelAr: "أداء ضعيف جداً", detail: `${pct(relPerf)} vs TASI.`, detailAr: `${pct(relPerf)} مقابل تاسي.` };
}

export function volatilityRiskBand(vol30d: number | null): Interpretation {
  if (!ok(vol30d)) return { signal: "insufficient_data", label: "No Data", labelAr: "لا توجد بيانات", detail: "Volatility data unavailable.", detailAr: "بيانات التذبذب غير متوفرة." };
  if (vol30d < 0.15) return { signal: "strong", label: "Low Volatility", labelAr: "تذبذب منخفض", detail: `30-day vol: ${pct(vol30d)}`, detailAr: `تذبذب 30 يوم: ${pct(vol30d)}` };
  if (vol30d < 0.25) return { signal: "neutral", label: "Normal Volatility", labelAr: "تذبذب طبيعي", detail: `30-day vol: ${pct(vol30d)}`, detailAr: `تذبذب 30 يوم: ${pct(vol30d)}` };
  if (vol30d < 0.40) return { signal: "caution", label: "Elevated Volatility", labelAr: "تذبذب مرتفع", detail: `30-day vol: ${pct(vol30d)}`, detailAr: `تذبذب 30 يوم: ${pct(vol30d)}` };
  return { signal: "negative", label: "High Volatility", labelAr: "تذبذب عالي", detail: `30-day vol: ${pct(vol30d)} — significant price swings.`, detailAr: `تذبذب 30 يوم: ${pct(vol30d)} — تقلبات سعرية كبيرة.` };
}

// ─── GROWTH ──────────────────────────────────────────────────────────────────

export function growthProfile(
  revGrowthYoy: number | null,
  earningsGrowthYoy: number | null,
  epsGrowthYoy: number | null,
  revCagr3y: number | null,
): Interpretation {
  const metrics = [revGrowthYoy, earningsGrowthYoy, epsGrowthYoy, revCagr3y].filter(ok);
  if (metrics.length === 0) {
    return { signal: "insufficient_data", label: "No Data", labelAr: "لا توجد بيانات", detail: "Growth metrics unavailable.", detailAr: "مقاييس النمو غير متوفرة." };
  }

  let growing = 0;
  let declining = 0;

  if (ok(revGrowthYoy)) { revGrowthYoy > 0.05 ? growing++ : revGrowthYoy < -0.05 ? declining++ : null; }
  if (ok(earningsGrowthYoy)) { earningsGrowthYoy > 0.10 ? growing++ : earningsGrowthYoy < -0.10 ? declining++ : null; }
  if (ok(epsGrowthYoy)) { epsGrowthYoy > 0.05 ? growing++ : epsGrowthYoy < -0.05 ? declining++ : null; }
  if (ok(revCagr3y)) { revCagr3y > 0.08 ? growing++ : revCagr3y < 0 ? declining++ : null; }

  if (growing >= 3) return { signal: "strong", label: "High Growth", labelAr: "نمو مرتفع", detail: "Strong growth across revenue and earnings.", detailAr: "نمو قوي عبر الإيرادات والأرباح." };
  if (declining >= 3) return { signal: "negative", label: "Declining", labelAr: "تراجع", detail: "Revenue and earnings contracting.", detailAr: "الإيرادات والأرباح في تراجع." };
  if (growing > declining) return { signal: "positive", label: "Growing", labelAr: "نمو", detail: "Positive growth trajectory.", detailAr: "مسار نمو إيجابي." };
  if (declining > growing) return { signal: "caution", label: "Mixed Growth", labelAr: "نمو مختلط", detail: "Some growth indicators declining.", detailAr: "بعض مؤشرات النمو في تراجع." };
  return { signal: "neutral", label: "Stable", labelAr: "مستقر", detail: "Flat growth — neither expanding nor contracting.", detailAr: "نمو ثابت — لا توسع ولا انكماش." };
}

// ─── SCORE INTERPRETATION ───────────────────────────────────────────────────

export function scoreConfidenceLevel(
  metricCoverage: number, // percentage of non-null metrics (0-100)
): Interpretation {
  if (metricCoverage >= 80) return { signal: "strong", label: "High Confidence", labelAr: "ثقة عالية", detail: `${metricCoverage.toFixed(0)}% of metrics available.`, detailAr: `${metricCoverage.toFixed(0)}% من المقاييس متوفرة.` };
  if (metricCoverage >= 60) return { signal: "positive", label: "Good Confidence", labelAr: "ثقة جيدة", detail: `${metricCoverage.toFixed(0)}% of metrics available.`, detailAr: `${metricCoverage.toFixed(0)}% من المقاييس متوفرة.` };
  if (metricCoverage >= 40) return { signal: "caution", label: "Limited Data", labelAr: "بيانات محدودة", detail: `Only ${metricCoverage.toFixed(0)}% of metrics available — interpret with caution.`, detailAr: `${metricCoverage.toFixed(0)}% فقط من المقاييس متوفرة — فسّر بحذر.` };
  return { signal: "negative", label: "Low Confidence", labelAr: "ثقة منخفضة", detail: `Only ${metricCoverage.toFixed(0)}% of metrics — score may not be reliable.`, detailAr: `${metricCoverage.toFixed(0)}% فقط من المقاييس — الدرجة قد لا تكون موثوقة.` };
}

export function scoreTierLabel(tier: string | null, locale: string): { label: string; color: string; bg: string } {
  const isAr = locale === "ar";
  switch (tier) {
    case "Strong Buy": return { label: isAr ? "شراء قوي" : "Strong Buy", color: "#22c55e", bg: "rgba(34,197,94,0.12)" };
    case "Buy": return { label: isAr ? "شراء" : "Buy", color: "#4ade80", bg: "rgba(74,222,128,0.10)" };
    case "Hold": return { label: isAr ? "احتفاظ" : "Hold", color: "#d4a574", bg: "rgba(212,165,116,0.10)" };
    case "Underperform": return { label: isAr ? "أداء ضعيف" : "Underperform", color: "#f97316", bg: "rgba(249,115,22,0.10)" };
    case "Sell": return { label: isAr ? "بيع" : "Sell", color: "#ef4444", bg: "rgba(239,68,68,0.10)" };
    default: return { label: isAr ? "غير مصنف" : "Unrated", color: "#6b7280", bg: "rgba(107,114,128,0.10)" };
  }
}

export function dimensionStrengthsWeaknesses(
  scoreValue: number | null,
  scoreQuality: number | null,
  scoreGrowth: number | null,
  scoreMomentum: number | null,
  scoreDividend: number | null,
  scoreSafety: number | null,
  locale: string,
): { strengths: string[]; weaknesses: string[] } {
  const isAr = locale === "ar";
  const dims: { key: string; nameEn: string; nameAr: string; score: number | null }[] = [
    { key: "value", nameEn: "Value", nameAr: "القيمة", score: scoreValue },
    { key: "quality", nameEn: "Quality", nameAr: "الجودة", score: scoreQuality },
    { key: "growth", nameEn: "Growth", nameAr: "النمو", score: scoreGrowth },
    { key: "momentum", nameEn: "Momentum", nameAr: "الزخم", score: scoreMomentum },
    { key: "dividend", nameEn: "Dividend", nameAr: "التوزيعات", score: scoreDividend },
    { key: "safety", nameEn: "Safety", nameAr: "الأمان", score: scoreSafety },
  ];

  const strengths: string[] = [];
  const weaknesses: string[] = [];

  for (const d of dims) {
    if (!ok(d.score)) continue;
    const name = isAr ? d.nameAr : d.nameEn;
    // Dimension scores in company_metrics_daily are on 0-100 scale per dimension weight
    // Normalize: Value=25, Quality=20, Growth=15, Momentum=15, Dividend=15, Safety=10
    const maxScores: Record<string, number> = { value: 25, quality: 20, growth: 15, momentum: 15, dividend: 15, safety: 10 };
    const max = maxScores[d.key] || 15;
    const pctOfMax = d.score / max;
    if (pctOfMax >= 0.7) strengths.push(name);
    else if (pctOfMax <= 0.3) weaknesses.push(name);
  }

  return { strengths: strengths.slice(0, 3), weaknesses: weaknesses.slice(0, 3) };
}

// ─── METRIC DISPLAY POLICY ─────────────────────────────────────────────────

/** 0% coverage / blocked metrics — always hide */
const BLOCKED_METRICS = new Set([
  "forward_pe", "peg_ratio", "fair_value_estimate", "fair_value_gap",
]);

/** Metrics that are 0% coverage but may become available — show "Coming soon" */
const COMING_SOON_METRICS = new Set([
  "cash_payout_ratio", "return_3y", "revenue_cagr_5y",
]);

export function metricDisplayPolicy(
  metricKey: string,
  value: number | null,
  options?: { isBankSector?: boolean; isNonDividendPayer?: boolean; hasNegativeEarnings?: boolean },
): MetricDisplay {
  // Blocked → hide entirely
  if (BLOCKED_METRICS.has(metricKey)) {
    return { value: "", raw: null, signal: "insufficient_data", hidden: true };
  }

  // Coming soon → show placeholder
  if (COMING_SOON_METRICS.has(metricKey) && !ok(value)) {
    return { value: "Coming soon", raw: null, signal: "insufficient_data", hidden: false, note: "Not yet implemented" };
  }

  // Null → show dash
  if (!ok(value)) {
    return { value: "—", raw: null, signal: "insufficient_data", hidden: false };
  }

  // Sector-specific rules
  if (options?.isBankSector && metricKey === "current_ratio") {
    return { value: "N/A", raw: null, signal: "neutral", hidden: false, note: "Not applicable to banks" };
  }

  // Negative earnings → PE is meaningless
  if (options?.hasNegativeEarnings && metricKey === "pe_ratio") {
    return { value: "N/A", raw: null, signal: "caution", hidden: false, note: "Negative earnings" };
  }

  // Dividend metrics for non-payers
  if (options?.isNonDividendPayer) {
    if (metricKey === "dividend_yield") {
      return { value: "0.0%", raw: 0, signal: "neutral", hidden: false, note: "No dividends paid" };
    }
    if (metricKey === "payout_ratio" || metricKey === "dividend_cagr_3y") {
      return { value: "—", raw: null, signal: "neutral", hidden: false, note: "No dividends paid" };
    }
  }

  // Format based on metric type
  const pctMetrics = new Set([
    "roe", "roa", "roce", "net_margin", "operating_margin",
    "revenue_growth_yoy", "earnings_growth_yoy", "eps_growth_yoy",
    "revenue_cagr_3y", "revenue_cagr_5y", "dividend_yield", "payout_ratio",
    "cash_payout_ratio", "dividend_cagr_3y",
    "return_1d", "return_1w", "return_1m", "return_3m", "return_1y", "return_3y",
    "volatility_30d", "relative_perf_vs_tasi",
  ]);

  const ratioMetrics = new Set([
    "pe_ratio", "pb_ratio", "ps_ratio", "ev_ebitda",
    "debt_to_equity", "current_ratio", "interest_coverage",
    "net_debt_ebitda", "ocf_to_debt",
  ]);

  const sarMetrics = new Set(["close_price", "market_cap"]);
  const pctileMetrics = new Set([
    "sector_pctile_pe", "sector_pctile_pb", "sector_pctile_dividend_yield",
    "sector_pctile_roe", "sector_pctile_net_margin", "sector_pctile_revenue_growth",
    "sector_pctile_debt_to_equity", "sector_pctile_return_1y",
  ]);

  let formatted: string;
  if (pctMetrics.has(metricKey)) {
    formatted = `${(value * 100).toFixed(1)}%`;
  } else if (ratioMetrics.has(metricKey)) {
    formatted = value.toFixed(2);
  } else if (sarMetrics.has(metricKey)) {
    if (value >= 1e12) formatted = `${(value / 1e12).toFixed(1)}T`;
    else if (value >= 1e9) formatted = `${(value / 1e9).toFixed(1)}B`;
    else if (value >= 1e6) formatted = `${(value / 1e6).toFixed(1)}M`;
    else formatted = value.toFixed(2);
  } else if (pctileMetrics.has(metricKey)) {
    formatted = `${value.toFixed(0)}th`;
  } else if (metricKey === "years_of_dividends" || metricKey === "sector_rank_market_cap" || metricKey === "sector_peer_count") {
    formatted = value.toFixed(0);
  } else {
    formatted = value.toFixed(2);
  }

  return { value: formatted, raw: value, signal: "neutral", hidden: false };
}

// ─── SIGNAL → CSS ───────────────────────────────────────────────────────────

export function signalColor(signal: Signal): string {
  switch (signal) {
    case "strong": return "#22c55e";
    case "positive": return "#4ade80";
    case "neutral": return "#d4a574";
    case "caution": return "#f97316";
    case "negative": return "#ef4444";
    case "insufficient_data": return "#6b7280";
  }
}

export function signalBg(signal: Signal): string {
  switch (signal) {
    case "strong": return "rgba(34,197,94,0.12)";
    case "positive": return "rgba(74,222,128,0.10)";
    case "neutral": return "rgba(212,165,116,0.08)";
    case "caution": return "rgba(249,115,22,0.10)";
    case "negative": return "rgba(239,68,68,0.10)";
    case "insufficient_data": return "rgba(107,114,128,0.08)";
  }
}
