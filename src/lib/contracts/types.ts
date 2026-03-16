// ── SŪQAI Contract Intelligence Types ──

export type DisclosureType =
  | "contract_award"
  | "signed_contract"
  | "extension"
  | "renewal"
  | "framework_agreement"
  | "mou"
  | "supply_agreement"
  | "service_agreement"
  | "project_execution";

export type ContractType =
  | "construction"
  | "engineering"
  | "it_services"
  | "healthcare"
  | "logistics"
  | "defense"
  | "utilities"
  | "facility_management"
  | "infrastructure"
  | "industrial"
  | "consulting"
  | "other";

export type CounterpartyType =
  | "government"
  | "semi_government"
  | "private"
  | "international"
  | "undisclosed";

export type MaterialityLabel =
  | "minor"
  | "moderate"
  | "meaningful"
  | "major"
  | "unknown";

export type ReactionLabel =
  | "positive"
  | "mixed"
  | "muted"
  | "negative";

export type MomentumSignal =
  | "active"
  | "improving"
  | "steady"
  | "slowing"
  | "limited"
  | "dormant";

export interface CompanyContract {
  id: string;
  company_id: number;
  ticker: string;
  announcement_id?: string;
  announcement_url?: string;
  announcement_title_en?: string;
  announcement_title_ar?: string;
  announcement_date: string;
  event_date?: string;
  disclosure_type: DisclosureType;
  contract_type?: ContractType;
  counterparty?: string;
  counterparty_type?: CounterpartyType;
  contract_value?: number;
  currency: string;
  value_disclosed: boolean;
  duration_text?: string;
  duration_months?: number;
  start_date?: string;
  end_date?: string;
  project_description?: string;
  geography?: string;
  expected_financial_impact?: string;
  value_as_pct_of_revenue?: number;
  value_as_pct_of_market_cap?: number;
  materiality_score?: number;
  materiality_label: MaterialityLabel;
  is_material: boolean;
  source_platform: string;
  source_text_raw?: string;
  source_text_clean?: string;
  extraction_confidence: number;
  is_verified: boolean;
  reaction_day0?: number;
  reaction_day1?: number;
  reaction_day3?: number;
  reaction_day5?: number;
  reaction_day10?: number;
  reaction_vs_tasi_day3?: number;
  reaction_vs_tasi_day5?: number;
  reaction_label?: ReactionLabel;
  status: string;
  notes?: string;
}

export interface ContractMomentum {
  company_id: number;
  ticker: string;
  contracts_3m: number;
  contracts_12m: number;
  contracts_total: number;
  new_awards_12m: number;
  extensions_12m: number;
  disclosed_value_12m: number;
  avg_contract_size?: number;
  largest_contract?: number;
  material_contracts_12m: number;
  momentum_signal: MomentumSignal;
  momentum_score: number;
  signal_line_en?: string;
  signal_line_ar?: string;
  last_contract_date?: string;
  last_contract_type?: string;
  last_contract_value?: number;
}

// ── Display / Interpretation types ──

export interface ContractInterpretation {
  what_happened: { en: string; ar: string };
  why_it_matters: { en: string; ar: string };
  how_important: { en: string; ar: string };
  uncertainty: { en: string; ar: string };
  reaction_summary: { en: string; ar: string };
  watch_next: { en: string; ar: string };
}

export interface ContractCardData {
  contract: CompanyContract;
  interpretation: ContractInterpretation;
  daysAgo: number;
}

export interface ContractModuleData {
  contracts: CompanyContract[];
  momentum: ContractMomentum | null;
  latestCard: ContractCardData | null;
  timelineItems: Array<{
    date: string;
    type: DisclosureType;
    title: string;
    value?: number;
    materiality: MaterialityLabel;
  }>;
  stats: {
    count12m: number;
    disclosedValue12m: number;
    materialCount: number;
    momentumSignal: MomentumSignal;
    momentumLine: { en: string; ar: string };
  };
}
