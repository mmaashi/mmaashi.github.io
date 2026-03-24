import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tickers = searchParams.get("tickers")?.split(",") || [];

    if (!tickers.length) {
      return NextResponse.json(
        { error: "No tickers provided" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Fetch company data
    const { data: companies, error: companiesError } = await supabase
      .from("companies")
      .select("id, ticker, name_en, name_ar, sector, is_shariah_compliant, market")
      .in("ticker", tickers);

    if (companiesError) throw companiesError;

    if (!companies || companies.length === 0) {
      return NextResponse.json(
        { error: "No companies found" },
        { status: 404 }
      );
    }

    const companyIds = companies.map((c) => c.id);

    // Fetch latest metrics for each company
    const { data: allMetrics, error: metricsError } = await supabase
      .from("company_metrics_daily")
      .select(
        "company_id, suqai_score, score_tier, pe_ratio, pb_ratio, dividend_yield, roe, revenue_growth_yoy, debt_to_equity, current_ratio, market_cap, net_margin, as_of_date"
      )
      .in("company_id", companyIds)
      .order("as_of_date", { ascending: false });

    if (metricsError) throw metricsError;

    // Fetch latest prices for each company
    const { data: allPrices, error: pricesError } = await supabase
      .from("stock_prices")
      .select("company_id, close, open, high, low, volume, date")
      .in("company_id", companyIds)
      .order("date", { ascending: false })
      .limit(companyIds.length * 2);

    if (pricesError) throw pricesError;

    // Build maps for latest metrics and prices per company
    const metricsMap = new Map<string, typeof allMetrics[0]>();
    for (const m of allMetrics || []) {
      if (!metricsMap.has(m.company_id)) {
        metricsMap.set(m.company_id, m);
      }
    }

    const pricesMap = new Map<string, { current: typeof allPrices[0] | null; previous: typeof allPrices[0] | null }>();
    const seenCompanies = new Set<string>();

    for (const p of allPrices || []) {
      if (!seenCompanies.has(p.company_id)) {
        pricesMap.set(p.company_id, { current: p, previous: null });
        seenCompanies.add(p.company_id);
      } else if (pricesMap.get(p.company_id)?.previous === null) {
        const existing = pricesMap.get(p.company_id)!;
        existing.previous = p;
      }
    }

    // Build response
    const comparison = companies.map((company) => {
      const metrics = metricsMap.get(company.id);
      const prices = pricesMap.get(company.id);
      const currentPrice = prices?.current;
      const previousPrice = prices?.previous;

      const price = currentPrice ? Number(currentPrice.close) : null;
      const prevClose = previousPrice ? Number(previousPrice.close) : price;

      const changePct =
        price !== null && prevClose !== null && prevClose > 0
          ? ((price - prevClose) / prevClose) * 100
          : null;

      return {
        id: company.id,
        ticker: company.ticker,
        name_en: company.name_en,
        name_ar: company.name_ar,
        sector: company.sector,
        is_shariah_compliant: company.is_shariah_compliant,
        market: company.market,
        // Price data
        price,
        changePct,
        open: currentPrice ? Number(currentPrice.open) : null,
        high: currentPrice ? Number(currentPrice.high) : null,
        low: currentPrice ? Number(currentPrice.low) : null,
        volume: currentPrice ? Number(currentPrice.volume) : null,
        // Metrics
        suqai_score: metrics?.suqai_score != null ? Number(metrics.suqai_score) : null,
        score_tier: metrics?.score_tier ?? null,
        pe_ratio: metrics?.pe_ratio != null ? Number(metrics.pe_ratio) : null,
        pb_ratio: metrics?.pb_ratio != null ? Number(metrics.pb_ratio) : null,
        dividend_yield: metrics?.dividend_yield != null ? Number(metrics.dividend_yield) : null,
        roe: metrics?.roe != null ? Number(metrics.roe) : null,
        revenue_growth_yoy: metrics?.revenue_growth_yoy != null ? Number(metrics.revenue_growth_yoy) : null,
        debt_to_equity: metrics?.debt_to_equity != null ? Number(metrics.debt_to_equity) : null,
        current_ratio: metrics?.current_ratio != null ? Number(metrics.current_ratio) : null,
        market_cap: metrics?.market_cap != null ? Number(metrics.market_cap) : null,
        net_margin: metrics?.net_margin != null ? Number(metrics.net_margin) : null,
        as_of_date: metrics?.as_of_date ?? null,
      };
    });

    return NextResponse.json(comparison);
  } catch (error) {
    console.error("Error in compare API:", error);
    return NextResponse.json(
      { error: "Failed to fetch comparison data" },
      { status: 500 }
    );
  }
}
