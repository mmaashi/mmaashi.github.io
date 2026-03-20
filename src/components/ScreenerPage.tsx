"use client";

import React, { useRef } from "react";
import ScreenerTable from "./ScreenerTable";
import ScreenerTemplates from "./ScreenerTemplates";

interface Company {
  id: string;
  ticker: string;
  name_en: string;
  name_ar: string;
  sector: string;
  market: string;
  is_shariah_compliant: boolean;
  price: number | null;
  open: number | null;
  volume: number | null;
  change_pct: number | null;
  suqai_score: number | null;
  score_tier: string | null;
  pe_ratio: number | null;
  pb_ratio: number | null;
  dividend_yield: number | null;
  roe: number | null;
  revenue_growth_yoy: number | null;
  debt_to_equity: number | null;
  market_cap: number | null;
  net_margin: number | null;
}

interface Props {
  companies: Company[];
  sectors: string[];
  locale: string;
}

export default function ScreenerPageClient({
  companies,
  sectors,
  locale,
}: Props) {
  const screenerTableRef = useRef<{
    applyTemplate: (filters: Record<string, any>) => void;
  }>(null);

  const handleApplyTemplate = (filters: Record<string, any>) => {
    screenerTableRef.current?.applyTemplate(filters);
  };

  return (
    <div>
      <ScreenerTemplates locale={locale} onApplyTemplate={handleApplyTemplate} />
      <ScreenerTable
        ref={screenerTableRef}
        companies={companies}
        sectors={sectors}
        locale={locale}
      />
    </div>
  );
}
