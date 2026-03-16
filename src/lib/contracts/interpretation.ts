// ── SŪQAI Contract Investor Interpretation Engine ──
// Generates plain-language interpretations of contract announcements (EN + AR)

import type {
  CompanyContract,
  ContractInterpretation,
  DisclosureType,
  MaterialityLabel,
  ReactionLabel,
} from "./types";

/**
 * Generate a full investor interpretation for a contract event.
 */
export function interpretContract(
  contract: CompanyContract,
  companyName: string,
): ContractInterpretation {
  const c = contract;

  return {
    what_happened: buildWhatHappened(c, companyName),
    why_it_matters: buildWhyItMatters(c),
    how_important: buildHowImportant(c),
    uncertainty: buildUncertainty(c),
    reaction_summary: buildReactionSummary(c),
    watch_next: buildWatchNext(c),
  };
}

// ── What happened ──
function buildWhatHappened(c: CompanyContract, companyName: string): { en: string; ar: string } {
  const typeLabel = disclosureLabel(c.disclosure_type);
  const valueStr = c.value_disclosed && c.contract_value
    ? `valued at ${c.currency} ${fmtValue(c.contract_value)}`
    : "with an undisclosed value";
  const valueStrAr = c.value_disclosed && c.contract_value
    ? `بقيمة ${fmtValue(c.contract_value)} ${c.currency === "SAR" ? "ريال" : c.currency}`
    : "بقيمة غير معلنة";

  const counterpartyStr = c.counterparty
    ? ` from ${c.counterparty}`
    : c.counterparty_type === "government" ? " from a government entity" : "";
  const counterpartyStrAr = c.counterparty
    ? ` من ${c.counterparty}`
    : c.counterparty_type === "government" ? " من جهة حكومية" : "";

  return {
    en: `${companyName} announced a ${typeLabel.en.toLowerCase()} ${valueStr}${counterpartyStr}.`,
    ar: `أعلنت الشركة عن ${typeLabel.ar} ${valueStrAr}${counterpartyStrAr}.`,
  };
}

// ── Why it matters ──
function buildWhyItMatters(c: CompanyContract): { en: string; ar: string } {
  const parts: string[] = [];
  const partsAr: string[] = [];

  if (c.value_as_pct_of_revenue !== null && c.value_as_pct_of_revenue !== undefined) {
    if (c.value_as_pct_of_revenue >= 10) {
      parts.push("the disclosed value looks significant relative to annual revenue");
      partsAr.push("القيمة المعلنة تبدو مهمة نسبة للإيرادات السنوية");
    } else if (c.value_as_pct_of_revenue >= 5) {
      parts.push("the disclosed value looks meaningful relative to annual revenue");
      partsAr.push("القيمة المعلنة ذات قيمة نسبة للإيرادات السنوية");
    }
  }

  if (c.counterparty_type === "government" || c.counterparty_type === "semi_government") {
    parts.push("the counterparty is a government or strategic entity");
    partsAr.push("الطرف المقابل جهة حكومية أو استراتيجية");
  }

  if (c.disclosure_type === "contract_award" || c.disclosure_type === "project_execution") {
    parts.push("this may support backlog and revenue visibility");
    partsAr.push("قد يدعم ذلك الأعمال المتراكمة ووضوح الإيرادات");
  } else if (c.disclosure_type === "extension" || c.disclosure_type === "renewal") {
    parts.push("renewals signal client retention and relationship strength");
    partsAr.push("التجديدات تشير إلى قوة العلاقة واستمرارية العميل");
  }

  if (parts.length === 0) {
    return {
      en: "This contract may contribute to the company's revenue pipeline, though significance depends on execution.",
      ar: "قد يساهم هذا العقد في إيرادات الشركة المستقبلية، رغم أن الأهمية تعتمد على التنفيذ.",
    };
  }

  return {
    en: `This may matter because ${parts.join(", and ")}.`,
    ar: `قد يكون مهمًا لأن ${partsAr.join("، و")}.`,
  };
}

// ── How important ──
function buildHowImportant(c: CompanyContract): { en: string; ar: string } {
  const ml = materialityText(c.materiality_label);

  if (c.materiality_label === "unknown") {
    return {
      en: "Materiality cannot be fully assessed because the contract value was not disclosed.",
      ar: "لا يمكن تقييم الأهمية بالكامل لأن قيمة العقد لم تُفصح.",
    };
  }

  return {
    en: `Relative to the company's size, this contract appears ${ml.en.toLowerCase()}.`,
    ar: `نسبة لحجم الشركة، يبدو هذا العقد ${ml.ar}.`,
  };
}

// ── Uncertainty ──
function buildUncertainty(c: CompanyContract): { en: string; ar: string } {
  const unknowns: string[] = [];
  const unknownsAr: string[] = [];

  if (!c.value_disclosed) {
    unknowns.push("contract value was not disclosed");
    unknownsAr.push("لم يتم الإفصاح عن قيمة العقد");
  }

  if (!c.duration_months) {
    unknowns.push("duration is unclear");
    unknownsAr.push("المدة غير واضحة");
  }

  if (!c.counterparty) {
    unknowns.push("counterparty details are limited");
    unknownsAr.push("تفاصيل الطرف المقابل محدودة");
  }

  // Always add execution caveat
  unknowns.push("execution quality and margin impact remain to be seen");
  unknownsAr.push("جودة التنفيذ وتأثيره على الهوامش لا يزال قيد الملاحظة");

  return {
    en: `What is still uncertain: ${unknowns.join("; ")}.`,
    ar: `ما لا يزال غير واضح: ${unknownsAr.join("؛ ")}.`,
  };
}

// ── Reaction summary ──
function buildReactionSummary(c: CompanyContract): { en: string; ar: string } {
  if (c.reaction_label === undefined || c.reaction_label === null) {
    return {
      en: "Market reaction data is not yet available for this announcement.",
      ar: "بيانات ردة فعل السوق غير متاحة بعد لهذا الإعلان.",
    };
  }

  const label = c.reaction_label;
  if (c.reaction_day3 !== null && c.reaction_day3 !== undefined) {
    const pct = Math.abs(c.reaction_day3).toFixed(1);
    const dir = c.reaction_day3 >= 0 ? "rose" : "fell";
    const dirAr = c.reaction_day3 >= 0 ? "ارتفع" : "انخفض";

    if (label === "positive") {
      return {
        en: `The stock ${dir} ${pct}% over 3 trading days after the announcement. Price response alone does not confirm long-term impact.`,
        ar: `${dirAr} السهم ${pct}% خلال ٣ أيام تداول بعد الإعلان. تفاعل السعر وحده لا يؤكد التأثير طويل المدى.`,
      };
    } else if (label === "negative") {
      return {
        en: `The stock ${dir} ${pct}% over 3 trading days after the announcement, though multiple factors may have been at play.`,
        ar: `${dirAr} السهم ${pct}% خلال ٣ أيام تداول بعد الإعلان، رغم أن عوامل متعددة قد تكون مؤثرة.`,
      };
    }
  }

  return {
    en: `The market reaction was ${reactionTextEn(label)}.`,
    ar: `تفاعل السوق كان ${reactionTextAr(label)}.`,
  };
}

// ── Watch next ──
function buildWatchNext(c: CompanyContract): { en: string; ar: string } {
  const items: string[] = [];
  const itemsAr: string[] = [];

  if (c.disclosure_type === "mou" || c.disclosure_type === "framework_agreement") {
    items.push("whether this converts to a firm contract with defined terms");
    itemsAr.push("ما إذا كان سيتحول إلى عقد ملزم بشروط محددة");
  }

  items.push("how management discusses this in the next earnings call");
  itemsAr.push("كيف ستتحدث الإدارة عن هذا في النتائج القادمة");

  if (!c.value_disclosed) {
    items.push("whether more details about value and scope are disclosed later");
    itemsAr.push("ما إذا كان سيتم الإفصاح عن مزيد من التفاصيل لاحقًا");
  }

  items.push("execution progress and any subsequent contract awards");
  itemsAr.push("تقدم التنفيذ وأي عقود لاحقة");

  return {
    en: `Watch for: ${items.join("; ")}.`,
    ar: `تابع: ${itemsAr.join("؛ ")}.`,
  };
}

// ── Helpers ──

function disclosureLabel(type: DisclosureType): { en: string; ar: string } {
  const map: Record<DisclosureType, { en: string; ar: string }> = {
    contract_award: { en: "New contract award", ar: "فوز بعقد جديد" },
    signed_contract: { en: "Signed contract", ar: "توقيع عقد" },
    extension: { en: "Contract extension", ar: "تمديد عقد" },
    renewal: { en: "Contract renewal", ar: "تجديد عقد" },
    framework_agreement: { en: "Framework agreement", ar: "اتفاقية إطارية" },
    mou: { en: "Memorandum of understanding", ar: "مذكرة تفاهم" },
    supply_agreement: { en: "Supply agreement", ar: "اتفاقية توريد" },
    service_agreement: { en: "Service agreement", ar: "اتفاقية خدمات" },
    project_execution: { en: "Project execution agreement", ar: "اتفاقية تنفيذ مشروع" },
  };
  return map[type] ?? { en: "Contract announcement", ar: "إعلان عقد" };
}

export { disclosureLabel };

function materialityText(label: MaterialityLabel): { en: string; ar: string } {
  const map: Record<MaterialityLabel, { en: string; ar: string }> = {
    major: { en: "Major", ar: "كبير" },
    meaningful: { en: "Meaningful", ar: "مهم" },
    moderate: { en: "Moderate", ar: "متوسط" },
    minor: { en: "Minor", ar: "بسيط" },
    unknown: { en: "Unknown", ar: "غير محدد" },
  };
  return map[label];
}

function reactionTextEn(label: ReactionLabel): string {
  switch (label) {
    case "positive": return "positive";
    case "mixed": return "mixed";
    case "muted": return "muted";
    case "negative": return "negative";
  }
}

function reactionTextAr(label: ReactionLabel): string {
  switch (label) {
    case "positive": return "إيجابيًا";
    case "mixed": return "متباينًا";
    case "muted": return "محدودًا";
    case "negative": return "سلبيًا";
  }
}

function fmtValue(val: number): string {
  if (val >= 1e9) return `${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e6) return `${(val / 1e6).toFixed(0)}M`;
  if (val >= 1e3) return `${(val / 1e3).toFixed(0)}K`;
  return val.toLocaleString();
}
