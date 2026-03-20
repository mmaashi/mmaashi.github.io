// ── SŪQAI Stock Price Reaction Calculator ──
// Computes observed price behavior around contract announcement dates
// TRUST-SAFE: no causation claims, only observed behavior

import type { ReactionLabel } from "./types";

interface PricePoint {
  date: string;
  close: number;
}

interface ReactionInput {
  announcementDate: string;
  stockPrices: PricePoint[];       // Sorted ascending by date
  tasiPrices?: PricePoint[];       // Optional TASI index for excess return
}

export interface ReactionResult {
  day0: number | null;
  day1: number | null;
  day3: number | null;
  day5: number | null;
  day10: number | null;
  vsTasiDay3: number | null;
  vsTasiDay5: number | null;
  label: ReactionLabel;
  summary: { en: string; ar: string };
}

/**
 * Calculate price returns over windows after announcement.
 * Returns null for any window where data is insufficient.
 */
export function calculateReaction(input: ReactionInput): ReactionResult {
  const { announcementDate, stockPrices, tasiPrices } = input;

  // Find the announcement date index (or next trading day)
  const annIdx = findDateIndex(stockPrices, announcementDate);
  if (annIdx === -1 || annIdx === 0) {
    return emptyResult();
  }

  const prevClose = stockPrices[annIdx - 1].close;
  if (prevClose <= 0) return emptyResult();

  const getReturn = (daysAfter: number): number | null => {
    const idx = annIdx + daysAfter;
    if (idx >= stockPrices.length || idx < 0) return null;
    return ((stockPrices[idx].close - prevClose) / prevClose) * 100;
  };

  const day0 = getReturn(0);
  const day1 = getReturn(1);
  const day3 = getReturn(3);
  const day5 = getReturn(5);
  const day10 = getReturn(10);

  // TASI excess returns
  let vsTasiDay3: number | null = null;
  let vsTasiDay5: number | null = null;

  if (tasiPrices && tasiPrices.length > 0) {
    const tasiAnnIdx = findDateIndex(tasiPrices, announcementDate);
    if (tasiAnnIdx > 0) {
      const tasiPrev = tasiPrices[tasiAnnIdx - 1].close;
      if (tasiPrev > 0) {
        const tasiR3 = tasiAnnIdx + 3 < tasiPrices.length
          ? ((tasiPrices[tasiAnnIdx + 3].close - tasiPrev) / tasiPrev) * 100
          : null;
        const tasiR5 = tasiAnnIdx + 5 < tasiPrices.length
          ? ((tasiPrices[tasiAnnIdx + 5].close - tasiPrev) / tasiPrev) * 100
          : null;

        if (day3 !== null && tasiR3 !== null) vsTasiDay3 = day3 - tasiR3;
        if (day5 !== null && tasiR5 !== null) vsTasiDay5 = day5 - tasiR5;
      }
    }
  }

  // Determine label
  const refReturn = day3 ?? day1 ?? day0;
  let label: ReactionLabel = "muted";
  if (refReturn !== null) {
    if (refReturn >= 2) label = "positive";
    else if (refReturn >= 0.5) label = "mixed";
    else if (refReturn <= -2) label = "negative";
    else label = "muted";
  }

  // Generate trust-safe summary
  const summary = generateSummary(day0, day3, day5, label);

  return { day0, day1, day3, day5, day10, vsTasiDay3, vsTasiDay5, label, summary };
}

function findDateIndex(prices: PricePoint[], date: string): number {
  // Exact match or nearest after
  for (let i = 0; i < prices.length; i++) {
    if (prices[i].date >= date) return i;
  }
  return -1;
}

function emptyResult(): ReactionResult {
  return {
    day0: null, day1: null, day3: null, day5: null, day10: null,
    vsTasiDay3: null, vsTasiDay5: null,
    label: "muted",
    summary: {
      en: "Insufficient price data to assess market reaction.",
      ar: "بيانات الأسعار غير كافية لتقييم ردة فعل السوق.",
    },
  };
}

function generateSummary(
  day0: number | null,
  day3: number | null,
  day5: number | null,
  label: ReactionLabel,
): { en: string; ar: string } {
  const ref = day3 ?? day0;
  if (ref === null) {
    return {
      en: "Price data around this announcement is limited.",
      ar: "بيانات الأسعار حول هذا الإعلان محدودة.",
    };
  }

  const direction = ref >= 0 ? "rose" : "fell";
  const directionAr = ref >= 0 ? "ارتفع" : "انخفض";
  const window = day3 !== null ? "3 trading days" : "on the announcement day";
  const windowAr = day3 !== null ? "٣ أيام تداول" : "يوم الإعلان";
  const pct = Math.abs(ref).toFixed(1);

  switch (label) {
    case "positive":
      return {
        en: `The stock ${direction} ${pct}% over ${window} after the announcement.`,
        ar: `${directionAr} السهم ${pct}% خلال ${windowAr} بعد الإعلان.`,
      };
    case "negative":
      return {
        en: `The stock ${direction} ${pct}% over ${window} after the announcement.`,
        ar: `${directionAr} السهم ${pct}% خلال ${windowAr} بعد الإعلان.`,
      };
    case "mixed":
      return {
        en: `The market reaction was mixed — the stock moved ${pct}% over ${window}.`,
        ar: `تفاعل السوق كان متباينًا — تحرك السهم ${pct}% خلال ${windowAr}.`,
      };
    case "muted":
    default:
      return {
        en: `The market reaction was muted — the stock moved ${pct}% over ${window}.`,
        ar: `تفاعل السوق كان محدودًا — تحرك السهم ${pct}% خلال ${windowAr}.`,
      };
  }
}

// ── Label helpers ──

export function reactionLabelText(label: ReactionLabel, isAr: boolean): string {
  const map: Record<ReactionLabel, { en: string; ar: string }> = {
    positive: { en: "Positive", ar: "إيجابي" },
    mixed: { en: "Mixed", ar: "متباين" },
    muted: { en: "Muted", ar: "محدود" },
    negative: { en: "Negative", ar: "سلبي" },
  };
  return isAr ? map[label].ar : map[label].en;
}

export function reactionColor(label: ReactionLabel): string {
  switch (label) {
    case "positive": return "var(--c-green)";
    case "mixed": return "var(--c-gold)";
    case "muted": return "var(--c-dim)";
    case "negative": return "var(--c-red)";
  }
}
