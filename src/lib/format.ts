/**
 * SŪQAI Number & Display Formatting Utilities
 * Follows Data Contract: full SAR integers, decimals for %, raw for ratios
 */

/** Format large monetary values (stored as full SAR integers) */
export function formatSAR(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1e12) return `${sign}${(abs / 1e12).toFixed(1)}T`;
  if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(1)}K`;
  return value.toFixed(2);
}

/** Format percentage from decimal (0.035 → "3.5%") */
export function formatPct(decimal: number | null | undefined): string {
  if (decimal === null || decimal === undefined) return "—";
  return `${(decimal * 100).toFixed(1)}%`;
}

/** Format a ratio (display as-is with 2 decimals) */
export function formatRatio(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value.toFixed(2);
}

/** Format price with SAR symbol */
export function formatPrice(value: number | null | undefined, locale?: string): string {
  if (value === null || value === undefined) return "—";
  const sar = locale === "ar" ? "ر.س" : "SAR";
  return `${sar} ${value.toFixed(2)}`;
}

/** Format volume (compact) */
export function formatVolume(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
  return value.toString();
}

/** Get color token based on score (0-5 scale) */
export function scoreColor(score: number): string {
  if (score >= 4) return "var(--c-green)";
  if (score >= 3) return "var(--c-gold)";
  if (score >= 2) return "var(--c-text)";
  return "var(--c-red)";
}

/** Get verdict label from overall score (0-100) */
export function scoreVerdict(score: number, locale: string): { label: string; color: string; bg: string; ring: string } {
  const isAr = locale === "ar";
  if (score >= 80) return {
    label: isAr ? "ممتاز" : "Excellent",
    color: "var(--c-green)", bg: "var(--c-green-bg)", ring: "var(--c-green-ring)"
  };
  if (score >= 60) return {
    label: isAr ? "جيد" : "Good",
    color: "var(--c-gold)", bg: "var(--c-gold-dim)", ring: "var(--c-gold-ring)"
  };
  if (score >= 40) return {
    label: isAr ? "متوسط" : "Average",
    color: "var(--c-text)", bg: "var(--c-border)", ring: "var(--c-border)"
  };
  return {
    label: isAr ? "ضعيف" : "Weak",
    color: "var(--c-red)", bg: "var(--c-red-bg)", ring: "var(--c-red-ring)"
  };
}

/** Get change color */
export function changeColor(value: number | null): string {
  if (value === null) return "var(--c-muted)";
  if (value > 0) return "var(--c-green)";
  if (value < 0) return "var(--c-red)";
  return "var(--c-muted)";
}

/** Format change with sign */
export function formatChange(value: number | null): string {
  if (value === null) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}
