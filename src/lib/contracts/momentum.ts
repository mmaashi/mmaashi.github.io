// ── SŪQAI Contract Momentum Calculator ──
// Computes company-level contract activity signals

import type { CompanyContract, MomentumSignal, ContractMomentum } from "./types";

/**
 * Calculate momentum metrics from a company's contract history.
 * Used both server-side for DB updates and client-side for display.
 */
export function calculateMomentum(
  companyId: number,
  ticker: string,
  contracts: CompanyContract[],
): ContractMomentum {
  const now = new Date();
  const threeMonthsAgo = new Date(now);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const twelveMonthsAgo = new Date(now);
  twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

  const sorted = [...contracts].sort(
    (a, b) => new Date(b.announcement_date).getTime() - new Date(a.announcement_date).getTime()
  );

  const in3m = sorted.filter((c) => new Date(c.announcement_date) >= threeMonthsAgo);
  const in12m = sorted.filter((c) => new Date(c.announcement_date) >= twelveMonthsAgo);

  const newAwardTypes = new Set([
    "contract_award", "signed_contract", "project_execution",
    "supply_agreement", "service_agreement",
  ]);
  const extensionTypes = new Set(["extension", "renewal"]);

  const newAwards12m = in12m.filter((c) => newAwardTypes.has(c.disclosure_type));
  const extensions12m = in12m.filter((c) => extensionTypes.has(c.disclosure_type));

  const disclosedIn12m = in12m.filter((c) => c.value_disclosed && c.contract_value);
  const disclosedValue12m = disclosedIn12m.reduce((s, c) => s + (c.contract_value ?? 0), 0);

  const allDisclosed = sorted.filter((c) => c.value_disclosed && c.contract_value);
  const avgContractSize = allDisclosed.length > 0
    ? allDisclosed.reduce((s, c) => s + (c.contract_value ?? 0), 0) / allDisclosed.length
    : undefined;
  const largestContract = allDisclosed.length > 0
    ? Math.max(...allDisclosed.map((c) => c.contract_value ?? 0))
    : undefined;

  const materialIn12m = in12m.filter((c) => c.is_material);

  // ── Momentum signal ──
  const signal = computeSignal(in3m.length, in12m.length, sorted.length, newAwards12m.length);
  const score = computeScore(in3m.length, in12m.length, newAwards12m.length, disclosedValue12m, materialIn12m.length);

  const { en: signalLineEn, ar: signalLineAr } = generateSignalLine(signal, in12m.length, newAwards12m.length, extensions12m.length);

  const latest = sorted[0] ?? null;

  return {
    company_id: companyId,
    ticker,
    contracts_3m: in3m.length,
    contracts_12m: in12m.length,
    contracts_total: sorted.length,
    new_awards_12m: newAwards12m.length,
    extensions_12m: extensions12m.length,
    disclosed_value_12m: disclosedValue12m,
    avg_contract_size: avgContractSize,
    largest_contract: largestContract,
    material_contracts_12m: materialIn12m.length,
    momentum_signal: signal,
    momentum_score: score,
    signal_line_en: signalLineEn,
    signal_line_ar: signalLineAr,
    last_contract_date: latest?.announcement_date,
    last_contract_type: latest?.disclosure_type,
    last_contract_value: latest?.contract_value ?? undefined,
  };
}

function computeSignal(
  count3m: number,
  count12m: number,
  total: number,
  newAwards12m: number,
): MomentumSignal {
  // Recent activity defines primary signal
  if (count3m >= 3) return "active";
  if (count3m >= 2 && count12m >= 5) return "active";
  if (count3m >= 1 && count12m >= 4) return "improving";
  if (count12m >= 3) return "steady";
  if (count12m >= 1) return "slowing";
  if (total > 0) return "limited";
  return "dormant";
}

function computeScore(
  count3m: number,
  count12m: number,
  newAwards12m: number,
  disclosedValue12m: number,
  materialCount12m: number,
): number {
  let score = 30; // baseline

  // Recent activity
  score += Math.min(count3m * 8, 24);
  score += Math.min(count12m * 3, 18);

  // New vs renewal mix
  if (newAwards12m > 0) score += Math.min(newAwards12m * 4, 12);

  // Value & materiality
  if (disclosedValue12m > 100e6) score += 8;
  else if (disclosedValue12m > 10e6) score += 4;
  score += Math.min(materialCount12m * 3, 9);

  return Math.max(0, Math.min(100, score));
}

function generateSignalLine(
  signal: MomentumSignal,
  count12m: number,
  newAwards: number,
  extensions: number,
): { en: string; ar: string } {
  switch (signal) {
    case "active":
      return {
        en: `Active business momentum — ${count12m} contracts in the last 12 months`,
        ar: `نشاط تعاقدي قوي — ${count12m} عقود في آخر ١٢ شهرًا`,
      };
    case "improving":
      return {
        en: `Improving contract activity with recent new wins`,
        ar: `نشاط تعاقدي متحسن مع فوز بعقود جديدة مؤخرًا`,
      };
    case "steady":
      if (extensions > newAwards) {
        return {
          en: `Steady activity — mostly renewals, not fresh wins`,
          ar: `نشاط مستقر — غالبيته تجديدات وليس عقودًا جديدة`,
        };
      }
      return {
        en: `Steady contract flow — ${newAwards} new award${newAwards > 1 ? "s" : ""} this year`,
        ar: `تدفق عقود مستقر — ${newAwards} ${newAwards > 1 ? "عقود جديدة" : "عقد جديد"} هذا العام`,
      };
    case "slowing":
      return {
        en: "Limited recent contract activity — momentum appears to be slowing",
        ar: "نشاط تعاقدي محدود مؤخرًا — الزخم يبدو متراجعًا",
      };
    case "limited":
      return {
        en: "Very limited contract activity in the past year",
        ar: "نشاط تعاقدي محدود جدًا في العام الماضي",
      };
    case "dormant":
      return {
        en: "No contract announcements recorded",
        ar: "لا إعلانات عقود مسجلة",
      };
  }
}

// ── Label helpers ──

export function momentumSignalText(signal: MomentumSignal, isAr: boolean): string {
  const map: Record<MomentumSignal, { en: string; ar: string }> = {
    active: { en: "Active", ar: "نشط" },
    improving: { en: "Improving", ar: "متحسن" },
    steady: { en: "Steady", ar: "مستقر" },
    slowing: { en: "Slowing", ar: "متراجع" },
    limited: { en: "Limited", ar: "محدود" },
    dormant: { en: "Dormant", ar: "خامل" },
  };
  return isAr ? map[signal].ar : map[signal].en;
}

export function momentumColor(signal: MomentumSignal): string {
  switch (signal) {
    case "active": return "var(--c-green)";
    case "improving": return "#4ade80";
    case "steady": return "var(--c-gold)";
    case "slowing": return "var(--c-red)";
    case "limited": return "var(--c-dim)";
    case "dormant": return "var(--c-dim)";
  }
}
