import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createServiceClient();
  const report: Record<string, unknown> = {};

  // ─── 1. COMPANIES ───────────────────────────────────
  const { data: companies, count: compCount } = await supabase
    .from("companies")
    .select("*", { count: "exact" });

  const compMissing: Record<string, number> = {};
  const sectors: Record<string, number> = {};
  const markets: Record<string, number> = {};
  const dupes: string[] = [];

  if (companies) {
    const fields = [
      "name_en", "name_ar", "sector", "ticker", "symbol", "market",
      "description_en", "description_ar", "website", "employee_count",
    ] as const;
    for (const f of fields) {
      compMissing[f] = companies.filter((c: any) => !c[f]).length;
    }
    compMissing["is_shariah_compliant_null"] = companies.filter(
      (c: any) => c.is_shariah_compliant === null
    ).length;

    for (const c of companies) {
      sectors[(c as any).sector || "NULL"] = (sectors[(c as any).sector || "NULL"] || 0) + 1;
      markets[(c as any).market || "NULL"] = (markets[(c as any).market || "NULL"] || 0) + 1;
    }
    const tickers = companies.map((c: any) => c.ticker);
    const seen = new Set<string>();
    for (const t of tickers) {
      if (seen.has(t)) dupes.push(t);
      seen.add(t);
    }
  }

  report.companies = { total: compCount, missing: compMissing, sectors, markets, duplicateTickers: dupes };

  // ─── 2. STOCK_PRICES ────────────────────────────────
  const { count: priceCount } = await supabase
    .from("stock_prices")
    .select("*", { count: "exact", head: true });

  const { data: minD } = await supabase.from("stock_prices").select("date").order("date", { ascending: true }).limit(1);
  const { data: maxD } = await supabase.from("stock_prices").select("date").order("date", { ascending: false }).limit(1);

  // Sample quality
  const { data: priceSample } = await supabase.from("stock_prices").select("close,open,volume,company_id").limit(2000);
  const uniquePriceCompanies = new Set(priceSample?.map((p: any) => p.company_id));
  const nullClose = priceSample?.filter((p: any) => p.close === null || Number(p.close) === 0).length ?? 0;
  const nullOpen = priceSample?.filter((p: any) => p.open === null || Number(p.open) === 0).length ?? 0;
  const nullVol = priceSample?.filter((p: any) => p.volume === null).length ?? 0;

  // Get distinct company count from all prices
  const { data: allPriceCompanies } = await supabase.from("stock_prices").select("company_id");
  const distinctPriceCompanies = new Set(allPriceCompanies?.map((p: any) => p.company_id));

  report.stockPrices = {
    total: priceCount,
    dateRange: { min: minD?.[0]?.date, max: maxD?.[0]?.date },
    companiesWithData: distinctPriceCompanies.size,
    sampleQuality: { nullClose, nullOpen, nullVolume: nullVol, sampleSize: priceSample?.length ?? 0 },
  };

  // ─── 3. FINANCIALS ──────────────────────────────────
  const { data: financials, count: finCount } = await supabase
    .from("financials")
    .select("*", { count: "exact" });

  const finPeriods: Record<string, number> = {};
  const finYears: Record<string, number> = {};
  const finMissing: Record<string, number> = {};

  if (financials) {
    for (const f of financials) {
      const fa = f as any;
      finPeriods[fa.period || "NULL"] = (finPeriods[fa.period || "NULL"] || 0) + 1;
      finYears[String(fa.year ?? "NULL")] = (finYears[String(fa.year ?? "NULL")] || 0) + 1;
    }

    const keyFields = [
      "revenue", "net_income", "earnings_per_share", "total_assets",
      "total_liabilities", "pe_ratio", "operating_income",
    ];
    for (const kf of keyFields) {
      finMissing[kf] = financials.filter((f: any) => f[kf] === null).length;
    }
  }

  const finCompanies = new Set(financials?.map((f: any) => f.company_id));
  const negRevenue = financials?.filter((f: any) => f.revenue !== null && Number(f.revenue) < 0).length ?? 0;

  report.financials = {
    total: finCount,
    periods: finPeriods,
    years: finYears,
    missing: finMissing,
    companiesWithData: finCompanies.size,
    negativeRevenue: negRevenue,
  };

  // ─── 4. DIVIDENDS ──────────────────────────────────
  const { data: dividends, count: divCount } = await supabase
    .from("dividends")
    .select("*", { count: "exact" });

  const divMissing: Record<string, number> = {};
  const currencies: Record<string, number> = {};
  const divYears: Record<string, number> = {};

  if (dividends) {
    const divFields = ["amount_per_share", "ex_date", "payment_date", "record_date", "year", "currency"];
    for (const df of divFields) {
      divMissing[df] = dividends.filter((d: any) => d[df] === null || d[df] === "").length;
    }
    for (const d of dividends) {
      const da = d as any;
      currencies[da.currency || "NULL"] = (currencies[da.currency || "NULL"] || 0) + 1;
      divYears[String(da.year ?? "NULL")] = (divYears[String(da.year ?? "NULL")] || 0) + 1;
    }
  }

  const divCompanies = new Set(dividends?.map((d: any) => d.company_id));
  const zeroDivs = dividends?.filter((d: any) => Number(d.amount_per_share) === 0).length ?? 0;

  report.dividends = {
    total: divCount,
    missing: divMissing,
    currencies,
    years: divYears,
    companiesWithData: divCompanies.size,
    zeroAmount: zeroDivs,
  };

  // ─── 5. OWNERSHIP ──────────────────────────────────
  const { data: ownership, count: ownCount } = await supabase
    .from("ownership")
    .select("*", { count: "exact" });

  const ownMissing: Record<string, number> = {};
  let badPercentSums = 0;
  const badSumExamples: string[] = [];

  if (ownership) {
    const ownFields = [
      "foreign_percent", "institutional_percent", "government_percent",
      "retail_percent", "holder_name_en", "holder_name_ar",
    ];
    for (const of2 of ownFields) {
      ownMissing[of2] = ownership.filter((o: any) => o[of2] === null || o[of2] === "").length;
    }
    for (const o of ownership) {
      const oa = o as any;
      const total =
        (Number(oa.foreign_percent) || 0) +
        (Number(oa.institutional_percent) || 0) +
        (Number(oa.government_percent) || 0) +
        (Number(oa.retail_percent) || 0);
      if (total > 0 && (total < 95 || total > 105)) {
        badPercentSums++;
        if (badSumExamples.length < 5) badSumExamples.push(`${oa.company_id}: ${total.toFixed(1)}%`);
      }
    }
  }

  const ownCompanies = new Set(ownership?.map((o: any) => o.company_id));

  report.ownership = {
    total: ownCount,
    missing: ownMissing,
    companiesWithData: ownCompanies.size,
    badPercentSums,
    badSumExamples,
  };

  // ─── 6. COMPANY_CONTRACTS ──────────────────────────
  const { data: contracts, count: conCount } = await supabase
    .from("company_contracts")
    .select("*", { count: "exact" });

  const conMissing: Record<string, number> = {};
  const gigas: Record<string, number> = {};
  const statuses: Record<string, number> = {};
  const pillars: Record<string, number> = {};

  if (contracts) {
    const conFields = [
      "contract_title_en", "contract_title_ar", "awarding_entity",
      "contract_value_sar", "announcement_date", "contract_status",
      "giga_project", "vision2030_pillar", "significance",
    ];
    for (const cf of conFields) {
      conMissing[cf] = contracts.filter((c: any) => c[cf] === null || c[cf] === "").length;
    }
    for (const c of contracts) {
      const ca = c as any;
      gigas[ca.giga_project || "NULL"] = (gigas[ca.giga_project || "NULL"] || 0) + 1;
      statuses[ca.contract_status || "NULL"] = (statuses[ca.contract_status || "NULL"] || 0) + 1;
      pillars[ca.vision2030_pillar || "NULL"] = (pillars[ca.vision2030_pillar || "NULL"] || 0) + 1;
    }
  }

  const conCompanies = new Set(contracts?.map((c: any) => c.company_id));
  const contractValues = contracts
    ?.filter((c: any) => c.contract_value_sar !== null)
    .map((c: any) => Number(c.contract_value_sar)) ?? [];
  contractValues.sort((a: number, b: number) => a - b);

  report.contracts = {
    total: conCount,
    missing: conMissing,
    gigaProjects: gigas,
    statuses,
    pillars,
    companiesWithData: conCompanies.size,
    valueStats: contractValues.length > 0 ? {
      count: contractValues.length,
      min: contractValues[0],
      max: contractValues[contractValues.length - 1],
      median: contractValues[Math.floor(contractValues.length / 2)],
      totalSAR: contractValues.reduce((a: number, b: number) => a + b, 0),
    } : null,
  };

  // ─── 7. CONTRACT_PIPELINE_SUMMARY ──────────────────
  const { data: pipelines, count: pipCount } = await supabase
    .from("contract_pipeline_summary")
    .select("*", { count: "exact" });

  const pipMissing: Record<string, number> = {};
  const trends: Record<string, number> = {};
  let neomCount = 0;
  let redSeaCount = 0;

  if (pipelines) {
    const pipFields = [
      "total_backlog_value_sar", "backlog_to_revenue_ratio",
      "pipeline_score", "pipeline_trend",
    ];
    for (const pf of pipFields) {
      pipMissing[pf] = pipelines.filter((p: any) => p[pf] === null || p[pf] === "").length;
    }
    for (const p of pipelines) {
      const pa = p as any;
      trends[pa.pipeline_trend || "NULL"] = (trends[pa.pipeline_trend || "NULL"] || 0) + 1;
      if (pa.has_neom_contract) neomCount++;
      if (pa.has_red_sea_contract) redSeaCount++;
    }
  }

  const pipCompanies = new Set(pipelines?.map((p: any) => p.company_id));
  const scores = pipelines
    ?.filter((p: any) => p.pipeline_score !== null)
    .map((p: any) => Number(p.pipeline_score)) ?? [];
  scores.sort((a: number, b: number) => a - b);

  const scoreBuckets = { "0-2": 0, "2-4": 0, "4-6": 0, "6-8": 0, "8-10": 0 };
  for (const s of scores) {
    if (s < 2) scoreBuckets["0-2"]++;
    else if (s < 4) scoreBuckets["2-4"]++;
    else if (s < 6) scoreBuckets["4-6"]++;
    else if (s < 8) scoreBuckets["6-8"]++;
    else scoreBuckets["8-10"]++;
  }

  report.pipeline = {
    total: pipCount,
    missing: pipMissing,
    trends,
    companiesWithData: pipCompanies.size,
    scoreStats: scores.length > 0 ? {
      min: scores[0],
      max: scores[scores.length - 1],
      median: scores[Math.floor(scores.length / 2)],
    } : null,
    scoreBuckets,
    neomContracts: neomCount,
    redSeaContracts: redSeaCount,
  };

  // ─── CROSS-TABLE COVERAGE ──────────────────────────
  if (companies) {
    const companyIds = new Set(companies.map((c: any) => c.id));
    const orphanOwnership = ownership?.filter((o: any) => !companyIds.has(o.company_id)).length ?? 0;
    const orphanContracts = contracts?.filter((c: any) => !companyIds.has(c.company_id)).length ?? 0;
    const orphanPipeline = pipelines?.filter((p: any) => !companyIds.has(p.company_id)).length ?? 0;

    const noData = companies.filter(
      (c: any) => !distinctPriceCompanies.has(c.id) && !finCompanies.has(c.id)
    );

    report.crossTable = {
      orphanRecords: { ownership: orphanOwnership, contracts: orphanContracts, pipeline: orphanPipeline },
      companiesWithNoData: {
        count: noData.length,
        examples: noData.slice(0, 10).map((c: any) => `${c.ticker} (${c.name_en})`),
      },
      coverage: {
        total: companyIds.size,
        prices: distinctPriceCompanies.size,
        financials: finCompanies.size,
        dividends: divCompanies.size,
        ownership: ownCompanies.size,
        contracts: conCompanies.size,
        pipeline: pipCompanies.size,
      },
    };
  }

  return NextResponse.json(report, { status: 200 });
}
