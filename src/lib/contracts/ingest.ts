// ── SŪQAI Contract Ingestion Pipeline ──
// Fetches, parses, and stores contract-related Tadawul disclosures
// Designed for recurring scheduled execution

import type { DisclosureType, CounterpartyType, ContractType } from "./types";
import { assessMateriality } from "./materiality";

// ── Configuration ──

const TADAWUL_ANNOUNCEMENTS_URL = "https://www.saudiexchange.sa/wps/portal/saudiexchange/newsandreports/issuer-reports";

// Keywords that indicate contract-related disclosures
const CONTRACT_KEYWORDS_EN = [
  "contract", "award", "agreement", "signed", "project", "tender",
  "supply", "service", "extension", "renewal", "memorandum", "MOU",
  "framework", "procurement", "execution", "construction",
];

const CONTRACT_KEYWORDS_AR = [
  "عقد", "ترسية", "اتفاقية", "توقيع", "مشروع", "مناقصة",
  "توريد", "خدمات", "تمديد", "تجديد", "مذكرة تفاهم",
  "إطاري", "تنفيذ", "بناء", "إنشاء",
];

// ── Types ──

interface RawAnnouncement {
  id: string;
  title_en?: string;
  title_ar?: string;
  date: string;
  ticker: string;
  company_name?: string;
  body_en?: string;
  body_ar?: string;
  url?: string;
}

interface ParsedContract {
  ticker: string;
  announcement_id: string;
  announcement_url?: string;
  announcement_title_en?: string;
  announcement_title_ar?: string;
  announcement_date: string;
  disclosure_type: DisclosureType;
  contract_type?: ContractType;
  counterparty?: string;
  counterparty_type?: CounterpartyType;
  contract_value?: number;
  currency: string;
  value_disclosed: boolean;
  duration_text?: string;
  duration_months?: number;
  project_description?: string;
  geography?: string;
  expected_financial_impact?: string;
  source_text_raw?: string;
  source_text_clean?: string;
  extraction_confidence: number;
}

interface IngestionResult {
  recordsFound: number;
  recordsNew: number;
  recordsUpdated: number;
  errors: number;
  errorDetails: string[];
}

// ── Main ingestion function ──

/**
 * Process a batch of raw announcements into parsed contract records.
 * In production this would be called by a scheduled job.
 */
export function processAnnouncements(
  announcements: RawAnnouncement[],
): ParsedContract[] {
  const contracts: ParsedContract[] = [];

  for (const ann of announcements) {
    if (!isContractRelated(ann)) continue;

    try {
      const parsed = parseAnnouncement(ann);
      if (parsed) contracts.push(parsed);
    } catch (e) {
      // Log and continue — don't fail the batch
      console.error(`Failed to parse announcement ${ann.id}:`, e);
    }
  }

  return contracts;
}

// ── Detection ──

function isContractRelated(ann: RawAnnouncement): boolean {
  const text = [
    ann.title_en ?? "",
    ann.title_ar ?? "",
    ann.body_en ?? "",
    ann.body_ar ?? "",
  ].join(" ").toLowerCase();

  return (
    CONTRACT_KEYWORDS_EN.some((kw) => text.includes(kw.toLowerCase())) ||
    CONTRACT_KEYWORDS_AR.some((kw) => text.includes(kw))
  );
}

// ── Parsing ──

function parseAnnouncement(ann: RawAnnouncement): ParsedContract | null {
  const text = (ann.body_en ?? ann.body_ar ?? ann.title_en ?? ann.title_ar ?? "").toLowerCase();
  const rawText = ann.body_en ?? ann.body_ar ?? "";

  // Disclosure type
  const disclosureType = classifyDisclosureType(text);

  // Contract value
  const { value, currency, disclosed } = extractValue(rawText);

  // Counterparty
  const counterparty = extractCounterparty(rawText);
  const counterpartyType = classifyCounterparty(counterparty, rawText);

  // Duration
  const { durationText, durationMonths } = extractDuration(rawText);

  // Contract type
  const contractType = classifyContractType(rawText);

  // Confidence based on how much we extracted
  let confidence = 0.5;
  if (value !== undefined) confidence += 0.15;
  if (counterparty) confidence += 0.1;
  if (durationMonths) confidence += 0.1;
  if (contractType) confidence += 0.05;
  confidence = Math.min(1.0, confidence);

  return {
    ticker: ann.ticker,
    announcement_id: ann.id,
    announcement_url: ann.url,
    announcement_title_en: ann.title_en,
    announcement_title_ar: ann.title_ar,
    announcement_date: ann.date,
    disclosure_type: disclosureType,
    contract_type: contractType,
    counterparty,
    counterparty_type: counterpartyType,
    contract_value: value,
    currency: currency ?? "SAR",
    value_disclosed: disclosed,
    duration_text: durationText,
    duration_months: durationMonths,
    source_text_raw: rawText.slice(0, 5000),
    source_text_clean: cleanText(rawText).slice(0, 2000),
    extraction_confidence: confidence,
  };
}

// ── Classifiers ──

function classifyDisclosureType(text: string): DisclosureType {
  if (text.includes("extension") || text.includes("تمديد")) return "extension";
  if (text.includes("renewal") || text.includes("تجديد")) return "renewal";
  if (text.includes("framework") || text.includes("إطاري")) return "framework_agreement";
  if (text.includes("memorandum") || text.includes("mou") || text.includes("مذكرة تفاهم")) return "mou";
  if (text.includes("supply") || text.includes("توريد")) return "supply_agreement";
  if (text.includes("service agreement") || text.includes("اتفاقية خدمات")) return "service_agreement";
  if (text.includes("project execution") || text.includes("تنفيذ مشروع")) return "project_execution";
  if (text.includes("signed") || text.includes("توقيع")) return "signed_contract";
  return "contract_award";
}

function classifyContractType(text: string): ContractType | undefined {
  const lower = text.toLowerCase();
  if (lower.match(/construct|build|infrastructure|بناء|إنشاء|تشييد/)) return "construction";
  if (lower.match(/engineer|هندس/)) return "engineering";
  if (lower.match(/it |software|digital|technology|تقنية|رقم/)) return "it_services";
  if (lower.match(/health|medical|hospital|صح|طب|مستشف/)) return "healthcare";
  if (lower.match(/logist|transport|shipping|نقل|لوجست/)) return "logistics";
  if (lower.match(/defen|military|عسكر|دفاع/)) return "defense";
  if (lower.match(/utility|power|water|electric|كهرب|مياه|طاقة/)) return "utilities";
  if (lower.match(/facility|maintenance|صيانة|إدارة مرافق/)) return "facility_management";
  if (lower.match(/industr|manufactur|صناع/)) return "industrial";
  if (lower.match(/consult|استشار/)) return "consulting";
  return undefined;
}

function classifyCounterparty(
  name: string | undefined,
  text: string,
): CounterpartyType {
  const combined = ((name ?? "") + " " + text).toLowerCase();
  if (combined.match(/ministry|government|saudi aramco|sabic|مملكة|وزارة|حكوم|أرامكو|سابك|هيئة/)) return "government";
  if (combined.match(/semi.government|fund|صندوق/)) return "semi_government";
  if (combined.match(/international|foreign|global/)) return "international";
  if (name) return "private";
  return "undisclosed";
}

// ── Extractors ──

function extractValue(text: string): { value?: number; currency?: string; disclosed: boolean } {
  // Match patterns like "SAR 250 million", "SAR 1.2 billion", "250M SAR"
  const patterns = [
    /(?:SAR|sar)\s*([\d,\.]+)\s*(million|billion|M|B)/i,
    /([\d,\.]+)\s*(million|billion|M|B)\s*(?:SAR|sar|riyals?)/i,
    /(?:بقيمة|بمبلغ)\s*([\d,\.]+)\s*(مليون|مليار)/,
    /(?:SAR|sar)\s*([\d,\.]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let num = parseFloat(match[1].replace(/,/g, ""));
      const unit = match[2]?.toLowerCase();
      if (unit === "billion" || unit === "b" || unit === "مليار") num *= 1e9;
      else if (unit === "million" || unit === "m" || unit === "مليون") num *= 1e6;
      if (num > 0 && num < 1e12) { // sanity check
        return { value: num, currency: "SAR", disclosed: true };
      }
    }
  }

  return { disclosed: false };
}

function extractCounterparty(text: string): string | undefined {
  // Try to find counterparty after common patterns
  const patterns = [
    /(?:with|from|awarded by|signed with)\s+([A-Z][A-Za-z\s&]{3,60}?)(?:\.|,|for|to|valued)/i,
    /(?:مع|من|من قبل)\s+([^\.\,]{3,60})(?:\.|،)/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }

  return undefined;
}

function extractDuration(text: string): { durationText?: string; durationMonths?: number } {
  const patterns = [
    /(\d+)\s*(?:year|سن)/i,
    /(\d+)\s*(?:month|شهر)/i,
  ];

  const yearMatch = text.match(patterns[0]);
  if (yearMatch) {
    const years = parseInt(yearMatch[1]);
    return { durationText: `${years} year${years > 1 ? "s" : ""}`, durationMonths: years * 12 };
  }

  const monthMatch = text.match(patterns[1]);
  if (monthMatch) {
    const months = parseInt(monthMatch[1]);
    return { durationText: `${months} month${months > 1 ? "s" : ""}`, durationMonths: months };
  }

  return {};
}

function cleanText(text: string): string {
  return text
    .replace(/<[^>]+>/g, " ")       // strip HTML
    .replace(/\s+/g, " ")            // collapse whitespace
    .replace(/\n{3,}/g, "\n\n")      // collapse newlines
    .trim();
}

// ── Materiality enrichment ──

/**
 * Enrich a parsed contract with materiality assessment.
 * Requires financial data that must be fetched separately.
 */
export function enrichWithMateriality(
  contract: ParsedContract,
  lastAnnualRevenue: number | null,
  marketCap: number | null,
) {
  const result = assessMateriality({
    contractValue: contract.contract_value ?? null,
    valueDisclosed: contract.value_disclosed,
    lastAnnualRevenue,
    marketCap,
    counterpartyType: contract.counterparty_type,
    disclosureType: contract.disclosure_type,
    durationMonths: contract.duration_months,
  });

  return {
    ...contract,
    materiality_score: result.score,
    materiality_label: result.label,
    is_material: result.isMaterial,
    value_as_pct_of_revenue: result.pctOfRevenue,
    value_as_pct_of_market_cap: result.pctOfMarketCap,
  };
}
