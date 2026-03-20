/**
 * SŪQAI Stock Verdict Engine
 *
 * Generates the top-of-page verdict card content:
 *   - Overall verdict sentence
 *   - Top strengths
 *   - Key watchouts
 *   - Peer comparison context
 *
 * All output is bilingual (EN/AR).
 * Fully automated — updates when data changes.
 */

import type { Interpretation, Signal } from "./interpretation";

interface BiText { en: string; ar: string }

export interface StockVerdict {
  verdict: BiText;
  strengths: BiText[];
  watchouts: BiText[];
  peerContext: BiText[];
  confidenceLabel: BiText;
  confidenceColor: string;
}

function ok(v: number | null | undefined): v is number {
  return v != null && !Number.isNaN(v) && Number.isFinite(v);
}

interface VerdictInput {
  n: (key: string) => number | null;
  interpValuation: Interpretation;
  interpQuality: Interpretation;
  interpGrowth: Interpretation;
  interpSafety: Interpretation;
  interpDividend: Interpretation;
  interpMomentum: Interpretation;
  interpConfidence: Interpretation;
  isBankSector: boolean;
  isNonDividendPayer: boolean;
  hasNegativeEarnings: boolean;
  suqaiScore: number | null;
  scoreTier: string | null;
}

export function generateVerdict(input: VerdictInput): StockVerdict {
  const {
    n, interpValuation, interpQuality, interpGrowth, interpSafety,
    interpDividend, interpMomentum, interpConfidence,
    isBankSector, isNonDividendPayer, hasNegativeEarnings,
    suqaiScore, scoreTier,
  } = input;

  // ── Build verdict sentence ────────────────────────────────────
  const parts: { en: string[]; ar: string[] } = { en: [], ar: [] };

  // Quality descriptor
  const qSig = interpQuality.signal;
  if (qSig === "strong") { parts.en.push("High-quality company"); parts.ar.push("شركة عالية الجودة"); }
  else if (qSig === "positive") { parts.en.push("Above-average profitability"); parts.ar.push("ربحية فوق المتوسط"); }
  else if (qSig === "negative") { parts.en.push("Weak profitability"); parts.ar.push("ربحية ضعيفة"); }

  // Valuation descriptor
  const vSig = interpValuation.signal;
  if (vSig === "positive") { parts.en.push("with attractive valuation"); parts.ar.push("بتقييم جذاب"); }
  else if (vSig === "negative" || vSig === "caution") { parts.en.push("with premium valuation"); parts.ar.push("بتقييم مرتفع"); }
  else if (vSig === "neutral") { parts.en.push("at fair valuation"); parts.ar.push("بتقييم عادل"); }

  // Growth
  const gSig = interpGrowth.signal;
  if (gSig === "strong") { parts.en.push("and strong growth"); parts.ar.push("ونمو قوي"); }
  else if (gSig === "negative") { parts.en.push("but declining fundamentals"); parts.ar.push("لكن مع تراجع في الأساسيات"); }

  // Dividend
  if (!isNonDividendPayer && interpDividend.signal === "strong") {
    parts.en.push("— a dividend leader");
    parts.ar.push("— من رواد التوزيعات");
  }

  const verdictEn = parts.en.length > 0 ? parts.en.join(" ") + "." : "Mixed signals across key dimensions.";
  const verdictAr = parts.ar.length > 0 ? parts.ar.join(" ") + "." : "إشارات مختلطة عبر الأبعاد الرئيسية.";

  // ── Strengths ─────────────────────────────────────────────────
  const strengths: BiText[] = [];

  if (interpQuality.signal === "strong" || interpQuality.signal === "positive") {
    const roe = n("roe");
    strengths.push({
      en: ok(roe) ? `Strong profitability (ROE ${(roe * 100).toFixed(1)}%)` : "Strong profitability metrics",
      ar: ok(roe) ? `ربحية قوية (العائد على الملكية ${(roe * 100).toFixed(1)}%)` : "مؤشرات ربحية قوية",
    });
  }

  if (interpValuation.signal === "positive") {
    strengths.push({ en: "Valuation looks attractive vs. peers", ar: "التقييم يبدو جذابًا مقارنة بالأقران" });
  }

  if (interpGrowth.signal === "strong" || interpGrowth.signal === "positive") {
    const revG = n("revenue_growth_yoy");
    strengths.push({
      en: ok(revG) ? `Revenue growing ${(revG * 100).toFixed(1)}% YoY` : "Positive growth trajectory",
      ar: ok(revG) ? `الإيرادات تنمو ${(revG * 100).toFixed(1)}% سنويًا` : "مسار نمو إيجابي",
    });
  }

  if (interpSafety.signal === "strong" || interpSafety.signal === "positive") {
    strengths.push({ en: "Healthy balance sheet", ar: "ميزانية عمومية صحية" });
  }

  if (!isNonDividendPayer && (interpDividend.signal === "strong" || interpDividend.signal === "positive")) {
    const dy = n("dividend_yield");
    strengths.push({
      en: ok(dy) ? `Attractive dividend yield (${(dy * 100).toFixed(1)}%)` : "Solid dividend profile",
      ar: ok(dy) ? `عائد توزيعات جذاب (${(dy * 100).toFixed(1)}%)` : "ملف توزيعات قوي",
    });
  }

  if (interpMomentum.signal === "strong" || interpMomentum.signal === "positive") {
    strengths.push({ en: "Positive price momentum", ar: "زخم سعري إيجابي" });
  }

  // ── Watchouts ──────────────────────────────────────────────────
  const watchouts: BiText[] = [];

  if (interpValuation.signal === "negative" || interpValuation.signal === "caution") {
    watchouts.push({ en: "Premium valuation — limited room for disappointment", ar: "تقييم مرتفع — مساحة محدودة للخطأ" });
  }

  if (hasNegativeEarnings) {
    watchouts.push({ en: "Negative earnings — watch for return to profitability", ar: "أرباح سلبية — تابع العودة إلى الربحية" });
  }

  if (interpSafety.signal === "negative" || interpSafety.signal === "caution") {
    watchouts.push({
      en: isBankSector ? "Leverage elevated — monitor capital adequacy" : "Balance sheet pressure — monitor debt levels",
      ar: isBankSector ? "رافعة مالية مرتفعة — راقب كفاية رأس المال" : "ضغط على الميزانية — راقب مستويات الديون",
    });
  }

  if (interpGrowth.signal === "negative" || interpGrowth.signal === "caution") {
    watchouts.push({ en: "Growth is weakening or mixed", ar: "النمو يتراجع أو مختلط" });
  }

  if (!isNonDividendPayer && (interpDividend.signal === "caution" || interpDividend.signal === "negative")) {
    watchouts.push({ en: "Dividend sustainability needs monitoring", ar: "استدامة التوزيعات تحتاج متابعة" });
  }

  if (interpMomentum.signal === "negative" || interpMomentum.signal === "caution") {
    watchouts.push({ en: "Price momentum is weakening", ar: "الزخم السعري يضعف" });
  }

  const pctPR = n("payout_ratio");
  if (ok(pctPR) && pctPR > 0.85) {
    watchouts.push({ en: "Payout ratio is stretched — dividend flexibility limited", ar: "نسبة التوزيع ممتدة — مرونة التوزيعات محدودة" });
  }

  // ── Peer context ──────────────────────────────────────────────
  const peerContext: BiText[] = [];

  const pctPE = n("sector_pctile_pe");
  if (ok(pctPE)) {
    if (pctPE < 25) peerContext.push({ en: "Cheaper than most sector peers on P/E", ar: "أرخص من معظم شركات القطاع على مكرر الأرباح" });
    else if (pctPE > 75) peerContext.push({ en: "More expensive than most sector peers on P/E", ar: "أغلى من معظم شركات القطاع على مكرر الأرباح" });
  }

  const pctROE = n("sector_pctile_roe");
  if (ok(pctROE)) {
    if (pctROE > 75) peerContext.push({ en: "More profitable than most peers", ar: "أكثر ربحية من معظم الأقران" });
    else if (pctROE < 25) peerContext.push({ en: "Less profitable than most peers", ar: "أقل ربحية من معظم الأقران" });
  }

  const pctDY = n("sector_pctile_dividend_yield");
  if (ok(pctDY) && pctDY > 70) {
    peerContext.push({ en: "Higher dividend yield than most peers", ar: "عائد توزيعات أعلى من معظم الأقران" });
  }

  const pctDE = n("sector_pctile_debt_to_equity");
  if (ok(pctDE) && pctDE > 75) {
    peerContext.push({ en: "Higher leverage than most sector peers", ar: "رافعة مالية أعلى من معظم شركات القطاع" });
  }

  // ── Confidence ────────────────────────────────────────────────
  const confSig = interpConfidence.signal;
  const confidenceColor =
    confSig === "strong" ? "#22c55e"
    : confSig === "positive" ? "#4ade80"
    : confSig === "caution" ? "#f59e0b"
    : "#ef4444";

  return {
    verdict: { en: verdictEn, ar: verdictAr },
    strengths: strengths.slice(0, 3),
    watchouts: watchouts.slice(0, 3),
    peerContext: peerContext.slice(0, 3),
    confidenceLabel: { en: interpConfidence.label, ar: interpConfidence.labelAr },
    confidenceColor,
  };
}
