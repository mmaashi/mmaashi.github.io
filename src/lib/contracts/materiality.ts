// ── SŪQAI Contract Materiality Engine ──
// Scores and classifies the significance of a contract disclosure

import type { MaterialityLabel, CounterpartyType, DisclosureType } from "./types";

interface MaterialityInput {
  contractValue: number | null;
  valueDisclosed: boolean;
  lastAnnualRevenue: number | null;
  marketCap: number | null;
  counterpartyType?: CounterpartyType;
  disclosureType: DisclosureType;
  durationMonths?: number | null;
  sectorContext?: string;
}

interface MaterialityResult {
  score: number;          // 0-100
  label: MaterialityLabel;
  isMaterial: boolean;
  pctOfRevenue: number | null;
  pctOfMarketCap: number | null;
  reasoning: { en: string; ar: string };
}

export function assessMateriality(input: MaterialityInput): MaterialityResult {
  const {
    contractValue,
    valueDisclosed,
    lastAnnualRevenue,
    marketCap,
    counterpartyType,
    disclosureType,
    durationMonths,
  } = input;

  // If value not disclosed, limited assessment
  if (!valueDisclosed || contractValue === null || contractValue <= 0) {
    // We can still provide partial signal from other factors
    let baseScore = 30; // Unknown baseline

    // Government/strategic counterparty bump
    if (counterpartyType === "government" || counterpartyType === "semi_government") baseScore += 10;

    // Long duration bump
    if (durationMonths && durationMonths > 24) baseScore += 5;

    // MOU downgrade
    if (disclosureType === "mou" || disclosureType === "framework_agreement") baseScore -= 10;

    return {
      score: Math.max(0, Math.min(100, baseScore)),
      label: "unknown",
      isMaterial: false,
      pctOfRevenue: null,
      pctOfMarketCap: null,
      reasoning: {
        en: "Contract value was not disclosed. Materiality cannot be fully assessed.",
        ar: "لم يتم الإفصاح عن قيمة العقد. لا يمكن تقييم الأهمية بالكامل.",
      },
    };
  }

  let score = 0;
  const factors: string[] = [];
  const factorsAr: string[] = [];

  // ── Revenue ratio (strongest signal) ──
  const pctOfRevenue = lastAnnualRevenue && lastAnnualRevenue > 0
    ? (contractValue / lastAnnualRevenue) * 100
    : null;

  if (pctOfRevenue !== null) {
    if (pctOfRevenue >= 20) { score += 35; factors.push("very significant relative to annual revenue"); factorsAr.push("مهم جدًا نسبة للإيرادات السنوية"); }
    else if (pctOfRevenue >= 10) { score += 28; factors.push("significant relative to annual revenue"); factorsAr.push("مهم نسبة للإيرادات السنوية"); }
    else if (pctOfRevenue >= 5) { score += 20; factors.push("meaningful relative to annual revenue"); factorsAr.push("ذو قيمة نسبة للإيرادات السنوية"); }
    else if (pctOfRevenue >= 2) { score += 12; factors.push("moderate relative to annual revenue"); factorsAr.push("متوسط نسبة للإيرادات السنوية"); }
    else { score += 5; factors.push("small relative to annual revenue"); factorsAr.push("صغير نسبة للإيرادات السنوية"); }
  }

  // ── Market cap ratio ──
  const pctOfMarketCap = marketCap && marketCap > 0
    ? (contractValue / marketCap) * 100
    : null;

  if (pctOfMarketCap !== null) {
    if (pctOfMarketCap >= 5) { score += 20; factors.push("material relative to market cap"); factorsAr.push("مادي نسبة للقيمة السوقية"); }
    else if (pctOfMarketCap >= 2) { score += 12; }
    else if (pctOfMarketCap >= 0.5) { score += 6; }
  }

  // ── Counterparty type ──
  if (counterpartyType === "government" || counterpartyType === "semi_government") {
    score += 10;
    factors.push("government or strategic counterparty");
    factorsAr.push("جهة حكومية أو استراتيجية");
  } else if (counterpartyType === "international") {
    score += 7;
  }

  // ── Disclosure type ──
  if (disclosureType === "contract_award" || disclosureType === "signed_contract" || disclosureType === "project_execution") {
    score += 8;
  } else if (disclosureType === "extension" || disclosureType === "renewal") {
    score += 5;
    factors.push("contract renewal or extension");
    factorsAr.push("تجديد أو تمديد عقد");
  } else if (disclosureType === "mou" || disclosureType === "framework_agreement") {
    score -= 5;
    factors.push("framework or MOU — not yet a firm commitment");
    factorsAr.push("إطاري أو مذكرة تفاهم — ليس التزامًا نهائيًا بعد");
  }

  // ── Duration ──
  if (durationMonths && durationMonths >= 36) { score += 5; }
  else if (durationMonths && durationMonths >= 12) { score += 3; }

  // ── Absolute value thresholds (SAR) ──
  if (contractValue >= 1e9) { score += 10; factors.push("contract value exceeds SAR 1B"); factorsAr.push("قيمة العقد تتجاوز مليار ريال"); }
  else if (contractValue >= 500e6) { score += 7; }
  else if (contractValue >= 100e6) { score += 4; }

  // Clamp
  score = Math.max(0, Math.min(100, score));

  // Label
  let label: MaterialityLabel;
  if (score >= 75) label = "major";
  else if (score >= 55) label = "meaningful";
  else if (score >= 35) label = "moderate";
  else label = "minor";

  const isMaterial = score >= 45;

  // Build reasoning
  const reasoningEn = factors.length > 0
    ? `This contract appears ${label}: ${factors.join("; ")}.`
    : `This contract appears ${label}.`;
  const reasoningAr = factorsAr.length > 0
    ? `هذا العقد يبدو ${labelAr(label)}: ${factorsAr.join("؛ ")}.`
    : `هذا العقد يبدو ${labelAr(label)}.`;

  return {
    score,
    label,
    isMaterial,
    pctOfRevenue,
    pctOfMarketCap,
    reasoning: { en: reasoningEn, ar: reasoningAr },
  };
}

function labelAr(label: MaterialityLabel): string {
  switch (label) {
    case "major": return "كبيرًا";
    case "meaningful": return "ذو أهمية";
    case "moderate": return "متوسطًا";
    case "minor": return "بسيطًا";
    case "unknown": return "غير محدد الأهمية";
  }
}

// ── Bilingual label helpers ──

export function materialityLabelText(label: MaterialityLabel, isAr: boolean): string {
  const map: Record<MaterialityLabel, { en: string; ar: string }> = {
    major: { en: "Major", ar: "كبير" },
    meaningful: { en: "Meaningful", ar: "مهم" },
    moderate: { en: "Moderate", ar: "متوسط" },
    minor: { en: "Minor", ar: "بسيط" },
    unknown: { en: "Unknown", ar: "غير محدد" },
  };
  return isAr ? map[label].ar : map[label].en;
}

export function materialityColor(label: MaterialityLabel): string {
  switch (label) {
    case "major": return "var(--c-green)";
    case "meaningful": return "var(--c-gold)";
    case "moderate": return "var(--c-muted)";
    case "minor": return "var(--c-dim)";
    case "unknown": return "var(--c-dim)";
  }
}
