import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { calculateAllScores } from "@/lib/scoring/engine";
import type { ScoringInput } from "@/lib/scoring/types";

/**
 * Cron: Refresh company_metrics_daily and company_scores_daily.
 * Schedule: Daily at 09:00 UTC (12:00 AST, after market close processing).
 *
 * Steps:
 *  1. Fetch all companies with their latest financials + prices + dividends
 *  2. Compute sector averages
 *  3. Compute each company's metrics ratios
 *  4. Run scoring engine for each company
 *  5. Upsert into company_metrics_daily + company_scores_daily + sector_averages
 */

const CRON_SECRET = process.env.CRON_SECRET;

function scoreTier(score: number): string {
  if (score >= 75) return "Strong Buy";
  if (score >= 60) return "Buy";
  if (score >= 45) return "Hold";
  if (score >= 30) return "Underperform";
  return "Sell";
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startTime = Date.now();
  const today = new Date().toISOString().split("T")[0];
  const supabase = createServiceClient();

  try {
    // ── 1. Fetch all companies ──
    const { data: companies, error: compErr } = await supabase
      .from("companies")
      .select("id, ticker, sector, shares_outstanding");

    if (compErr || !companies?.length) {
      console.error("Failed to fetch companies:", compErr);
      return NextResponse.json({ error: "No companies found" }, { status: 500 });
    }

    // ── 2. Fetch latest price per company (today or most recent) ──
    const { data: allPrices } = await supabase
      .from("stock_prices")
      .select("company_id, date, close, open, high, low, volume")
      .order("date", { ascending: false })
      .limit(companies.length * 5);

    const priceMap = new Map<string, { close: number; prevClose: number | null; volume: number }>();
    const pricesByCompany = new Map<string, Array<{ date: string; close: number }>>();

    if (allPrices) {
      for (const p of allPrices) {
        if (!pricesByCompany.has(p.company_id)) {
          pricesByCompany.set(p.company_id, []);
        }
        pricesByCompany.get(p.company_id)!.push({ date: p.date, close: Number(p.close) });
      }
      for (const [cid, prices] of pricesByCompany) {
        const sorted = prices.sort((a, b) => b.date.localeCompare(a.date));
        if (sorted.length > 0) {
          priceMap.set(cid, {
            close: sorted[0].close,
            prevClose: sorted.length > 1 ? sorted[1].close : null,
            volume: 0,
          });
        }
      }
    }

    // ── 2b. Fetch 1-year-ago prices for return_1y ──
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const yearAgoStr = oneYearAgo.toISOString().split("T")[0];

    const { data: yearAgoPrices } = await supabase
      .from("stock_prices")
      .select("company_id, close, date")
      .gte("date", yearAgoStr)
      .lte("date", new Date(oneYearAgo.getTime() + 14 * 86400000).toISOString().split("T")[0])
      .order("date", { ascending: true })
      .limit(companies.length * 2);

    const yearAgoPriceMap = new Map<string, number>();
    if (yearAgoPrices) {
      for (const p of yearAgoPrices) {
        if (!yearAgoPriceMap.has(p.company_id)) {
          yearAgoPriceMap.set(p.company_id, Number(p.close));
        }
      }
    }

    // ── 3. Fetch latest financials per company ──
    const { data: allFinancials } = await supabase
      .from("financials")
      .select("company_id, year, revenue, net_income, total_assets, total_liabilities, total_equity, earnings_per_share, debt_to_equity, roe, book_value_per_share, shares_outstanding, operating_income, operating_cash_flow, current_ratio, total_debt, cash")
      .order("year", { ascending: false })
      .limit(companies.length * 4);

    // Group financials by company, sorted by year desc
    const finMap = new Map<string, Array<Record<string, unknown>>>();
    if (allFinancials) {
      for (const f of allFinancials) {
        if (!finMap.has(f.company_id)) finMap.set(f.company_id, []);
        finMap.get(f.company_id)!.push(f);
      }
    }

    // ── 4. Fetch dividends per company ──
    const { data: allDividends } = await supabase
      .from("dividends")
      .select("company_id, year, amount_per_share, ex_date")
      .order("ex_date", { ascending: false })
      .limit(5000);

    const divMap = new Map<string, Array<{ year: number; amount: number; ex_date: string }>>();
    if (allDividends) {
      for (const d of allDividends) {
        if (!divMap.has(d.company_id)) divMap.set(d.company_id, []);
        divMap.get(d.company_id)!.push({
          year: d.year,
          amount: Number(d.amount_per_share),
          ex_date: d.ex_date,
        });
      }
    }

    // ── 5. Compute sector averages first pass ──
    const sectorData = new Map<string, { pe: number[]; pb: number[]; roe: number[]; dy: number[]; de: number[]; nm: number[]; rg: number[]; eg: number[]; mc: number[] }>();

    for (const c of companies) {
      const sector = c.sector || "Unknown";
      if (!sectorData.has(sector)) {
        sectorData.set(sector, { pe: [], pb: [], roe: [], dy: [], de: [], nm: [], rg: [], eg: [], mc: [] });
      }
    }

    // ── 6. Compute metrics for each company ──
    const metricsRows: Record<string, unknown>[] = [];
    const scoresRows: Record<string, unknown>[] = [];
    let computed = 0;
    let skipped = 0;

    for (const c of companies) {
      const price = priceMap.get(c.id);
      const fins = finMap.get(c.id);
      const divs = divMap.get(c.id);

      if (!price || !fins || fins.length === 0) {
        skipped++;
        continue;
      }

      const latest = fins[0] as Record<string, unknown>;
      const prev = fins.length > 1 ? (fins[1] as Record<string, unknown>) : null;
      const prev2 = fins.length > 2 ? (fins[2] as Record<string, unknown>) : null;

      const closePrice = price.close;
      const sharesOut = Number(c.shares_outstanding || latest.shares_outstanding || 0);
      const marketCap = sharesOut > 0 ? closePrice * sharesOut : null;

      const revenue = num(latest.revenue);
      const netIncome = num(latest.net_income);
      const totalAssets = num(latest.total_assets);
      const totalLiabilities = num(latest.total_liabilities);
      const totalEquity = num(latest.total_equity);
      const eps = num(latest.earnings_per_share);
      const bvps = num(latest.book_value_per_share);
      const operatingIncome = num(latest.operating_income);
      const ocf = num(latest.operating_cash_flow);
      const currentRatio = num(latest.current_ratio);
      const totalDebt = num(latest.total_debt);
      const cash = num(latest.cash);

      // Valuation ratios
      const pe_ratio = eps && eps > 0 ? closePrice / eps : null;
      const pb_ratio = bvps && bvps > 0 ? closePrice / bvps : null;
      const ps_ratio = revenue && marketCap && revenue > 0 ? marketCap / revenue : null;
      const roe = num(latest.roe) ?? (netIncome && totalEquity && totalEquity > 0 ? netIncome / totalEquity : null);
      const roa = netIncome && totalAssets && totalAssets > 0 ? netIncome / totalAssets : null;
      const debtToEquity = num(latest.debt_to_equity) ?? (totalLiabilities && totalEquity && totalEquity > 0 ? totalLiabilities / totalEquity : null);
      const netMargin = netIncome && revenue && revenue > 0 ? netIncome / revenue : null;
      const operatingMargin = operatingIncome && revenue && revenue > 0 ? operatingIncome / revenue : null;

      // Growth
      const prevRevenue = prev ? num(prev.revenue) : null;
      const prevNetIncome = prev ? num(prev.net_income) : null;
      const prevEps = prev ? num(prev.earnings_per_share) : null;

      const revenueGrowthYoy = prevRevenue && prevRevenue > 0 && revenue ? (revenue - prevRevenue) / prevRevenue : null;
      const earningsGrowthYoy = prevNetIncome && prevNetIncome > 0 && netIncome ? (netIncome - prevNetIncome) / prevNetIncome : null;
      const epsGrowthYoy = prevEps && prevEps > 0 && eps ? (eps - prevEps) / prevEps : null;

      // Revenue CAGR 3Y
      const rev3yAgo = prev2 ? num(prev2.revenue) : null;
      const revenueCagr3y = rev3yAgo && rev3yAgo > 0 && revenue && revenue > 0
        ? Math.pow(revenue / rev3yAgo, 1 / 3) - 1
        : null;

      // Health
      const ebitda = operatingIncome; // Approximation
      const netDebtEbitda = ebitda && ebitda > 0 && totalDebt != null && cash != null
        ? (totalDebt - cash) / ebitda
        : null;
      const interestCoverage = ebitda && ebitda > 0 ? ebitda / (ebitda * 0.05 || 1) : null; // Approx
      const ocfToDebt = ocf && totalDebt && totalDebt > 0 ? ocf / totalDebt : null;

      // Dividends
      const dividendYears = divs ? new Set(divs.map(d => d.year)).size : 0;
      const latestDivPerShare = divs && divs.length > 0
        ? divs.filter(d => d.year === divs[0].year).reduce((s, d) => s + d.amount, 0)
        : 0;
      const dividendYield = latestDivPerShare > 0 && closePrice > 0 ? latestDivPerShare / closePrice : null;
      const payoutRatio = latestDivPerShare > 0 && eps && eps > 0 ? latestDivPerShare / eps : null;

      // Dividend CAGR 3Y
      let dividendCagr3y: number | null = null;
      if (divs && divs.length > 0) {
        const byYear = new Map<number, number>();
        for (const d of divs) {
          byYear.set(d.year, (byYear.get(d.year) || 0) + d.amount);
        }
        const years = [...byYear.keys()].sort((a, b) => b - a);
        if (years.length >= 4) {
          const recent = byYear.get(years[0])!;
          const older = byYear.get(years[3])!;
          if (older > 0 && recent > 0) {
            dividendCagr3y = Math.pow(recent / older, 1 / 3) - 1;
          }
        }
      }

      // Returns
      const yearAgoPrice = yearAgoPriceMap.get(c.id);
      const return1y = yearAgoPrice && yearAgoPrice > 0 ? (closePrice - yearAgoPrice) / yearAgoPrice : null;
      const return1d = price.prevClose ? (closePrice - price.prevClose) / price.prevClose : null;

      // EV/EBITDA
      const ev = marketCap && totalDebt != null && cash != null
        ? marketCap + totalDebt - cash
        : null;
      const evEbitda = ev && ebitda && ebitda > 0 ? ev / ebitda : null;

      // Accumulate sector data
      const sector = c.sector || "Unknown";
      const sd = sectorData.get(sector)!;
      if (pe_ratio && pe_ratio > 0 && pe_ratio < 200) sd.pe.push(pe_ratio);
      if (pb_ratio && pb_ratio > 0) sd.pb.push(pb_ratio);
      if (roe != null) sd.roe.push(roe);
      if (dividendYield != null && dividendYield > 0) sd.dy.push(dividendYield);
      if (debtToEquity != null && debtToEquity >= 0) sd.de.push(debtToEquity);
      if (netMargin != null) sd.nm.push(netMargin);
      if (revenueGrowthYoy != null) sd.rg.push(revenueGrowthYoy);
      if (earningsGrowthYoy != null) sd.eg.push(earningsGrowthYoy);
      if (marketCap) sd.mc.push(marketCap);

      // Store for second pass (after sector avgs computed)
      metricsRows.push({
        company_id: c.id,
        as_of_date: today,
        close_price: closePrice,
        market_cap: marketCap,
        pe_ratio,
        pb_ratio,
        ps_ratio,
        ev_ebitda: evEbitda,
        dividend_yield: dividendYield,
        payout_ratio: payoutRatio,
        dividend_cagr_3y: dividendCagr3y,
        years_of_dividends: dividendYears,
        roe,
        roa,
        net_margin: netMargin,
        operating_margin: operatingMargin,
        revenue_growth_yoy: revenueGrowthYoy,
        earnings_growth_yoy: earningsGrowthYoy,
        eps_growth_yoy: epsGrowthYoy,
        revenue_cagr_3y: revenueCagr3y,
        debt_to_equity: debtToEquity,
        net_debt_ebitda: netDebtEbitda,
        interest_coverage: interestCoverage,
        current_ratio: currentRatio,
        ocf_to_debt: ocfToDebt,
        return_1d: return1d,
        return_1y: return1y,
        // Will add suqai_score + score_tier after scoring
        _sector: sector,
        _latestDivPerShare: latestDivPerShare,
        _cashPayoutRatio: ocf && ocf > 0 && latestDivPerShare > 0 ? (latestDivPerShare * sharesOut) / ocf : null,
      });

      computed++;
    }

    // ── 7. Compute sector averages ──
    const sectorAvgRows: Record<string, unknown>[] = [];
    const sectorAvgMap = new Map<string, { pe: number; pb: number; roe: number; dy: number; de: number }>();

    for (const [sector, sd] of sectorData) {
      const avgPe = sd.pe.length > 0 ? sd.pe.reduce((a, b) => a + b, 0) / sd.pe.length : null;
      const avgPb = sd.pb.length > 0 ? sd.pb.reduce((a, b) => a + b, 0) / sd.pb.length : null;
      const avgRoe = sd.roe.length > 0 ? sd.roe.reduce((a, b) => a + b, 0) / sd.roe.length : null;
      const avgDy = sd.dy.length > 0 ? sd.dy.reduce((a, b) => a + b, 0) / sd.dy.length : null;
      const avgDe = sd.de.length > 0 ? sd.de.reduce((a, b) => a + b, 0) / sd.de.length : null;
      const avgNm = sd.nm.length > 0 ? sd.nm.reduce((a, b) => a + b, 0) / sd.nm.length : null;
      const avgRg = sd.rg.length > 0 ? sd.rg.reduce((a, b) => a + b, 0) / sd.rg.length : null;
      const avgEg = sd.eg.length > 0 ? sd.eg.reduce((a, b) => a + b, 0) / sd.eg.length : null;
      const totalMc = sd.mc.length > 0 ? sd.mc.reduce((a, b) => a + b, 0) : null;

      sectorAvgMap.set(sector, {
        pe: avgPe ?? 20,
        pb: avgPb ?? 2,
        roe: avgRoe ?? 0.10,
        dy: avgDy ?? 0.02,
        de: avgDe ?? 1,
      });

      sectorAvgRows.push({
        sector,
        as_of_date: today,
        avg_pe: avgPe,
        avg_pb: avgPb,
        avg_roe: avgRoe,
        avg_dividend_yield: avgDy,
        avg_debt_to_equity: avgDe,
        avg_net_margin: avgNm,
        avg_revenue_growth: avgRg,
        avg_earnings_growth: avgEg,
        company_count: sd.pe.length || sd.mc.length,
        total_market_cap: totalMc,
      });
    }

    // ── 8. Run scoring engine with sector averages ──
    for (const row of metricsRows) {
      const sector = row._sector as string;
      const sAvg = sectorAvgMap.get(sector) || { pe: 20, pb: 2, roe: 0.10, dy: 0.02, de: 1 };

      const input: ScoringInput = {
        close_price: row.close_price as number | null,
        market_cap: row.market_cap as number | null,
        pe_ratio: row.pe_ratio as number | null,
        pb_ratio: row.pb_ratio as number | null,
        ps_ratio: row.ps_ratio as number | null,
        ev_ebitda: row.ev_ebitda as number | null,
        sector_avg_pe: sAvg.pe,
        sector_avg_pb: sAvg.pb,
        sector_avg_roe: sAvg.roe,
        sector_avg_dividend_yield: sAvg.dy,
        sector_avg_debt_to_equity: sAvg.de,
        revenue_growth_yoy: row.revenue_growth_yoy as number | null,
        earnings_growth_yoy: row.earnings_growth_yoy as number | null,
        eps_growth_yoy: row.eps_growth_yoy as number | null,
        revenue_cagr_3y: row.revenue_cagr_3y as number | null,
        revenue_cagr_5y: null,
        roe: row.roe as number | null,
        roa: row.roa as number | null,
        net_margin: row.net_margin as number | null,
        operating_margin: row.operating_margin as number | null,
        debt_to_equity: row.debt_to_equity as number | null,
        current_ratio: row.current_ratio as number | null,
        interest_coverage: row.interest_coverage as number | null,
        ocf_to_debt: row.ocf_to_debt as number | null,
        net_debt_ebitda: row.net_debt_ebitda as number | null,
        dividend_yield: row.dividend_yield as number | null,
        payout_ratio: row.payout_ratio as number | null,
        cash_payout_ratio: row._cashPayoutRatio as number | null,
        dividend_cagr_3y: row.dividend_cagr_3y as number | null,
        years_of_dividends: row.years_of_dividends as number | null,
        return_1y: row.return_1y as number | null,
        return_3y: null,
      };

      const result = calculateAllScores(input);
      const suqaiScore = result.overall_score;
      const tier = scoreTier(suqaiScore);

      // Add score to metrics row
      row.suqai_score = suqaiScore;
      row.score_tier = tier;

      // Build scores row
      scoresRows.push({
        company_id: row.company_id,
        as_of_date: today,
        value_score: result.value_score,
        growth_score: result.growth_score,
        performance_score: result.performance_score,
        health_score: result.health_score,
        dividend_score: result.dividend_score,
        overall_score: result.overall_score,
        value_checks: result.value_checks,
        growth_checks: result.growth_checks,
        performance_checks: result.performance_checks,
        health_checks: result.health_checks,
        dividend_checks: result.dividend_checks,
        risk_flags: result.risk_flags,
        insight_badges: result.insight_badges,
      });
    }

    // ── 9. Upsert all data ──
    // Clean internal fields before upserting
    const cleanMetrics = metricsRows.map(r => {
      const { _sector, _latestDivPerShare, _cashPayoutRatio, ...clean } = r as Record<string, unknown>;
      return { ...clean, source_name: "cron-metrics", updated_at: new Date().toISOString() };
    });

    // Batch upsert metrics (50 at a time to avoid payload limits)
    let metricsUpserted = 0;
    let metricsErrors = 0;
    for (let i = 0; i < cleanMetrics.length; i += 50) {
      const batch = cleanMetrics.slice(i, i + 50);
      const { error } = await supabase
        .from("company_metrics_daily")
        .upsert(batch, { onConflict: "company_id,as_of_date" });
      if (error) {
        console.error(`Metrics upsert batch ${i} error:`, error);
        metricsErrors += batch.length;
      } else {
        metricsUpserted += batch.length;
      }
    }

    // Batch upsert scores
    let scoresUpserted = 0;
    for (let i = 0; i < scoresRows.length; i += 50) {
      const batch = scoresRows.slice(i, i + 50);
      const { error } = await supabase
        .from("company_scores_daily")
        .upsert(batch, { onConflict: "company_id,as_of_date" });
      if (error) {
        console.error(`Scores upsert batch ${i} error:`, error);
      } else {
        scoresUpserted += batch.length;
      }
    }

    // Upsert sector averages
    let sectorsUpserted = 0;
    for (const sa of sectorAvgRows) {
      const { error } = await supabase
        .from("sector_averages")
        .upsert(sa, { onConflict: "sector,as_of_date" });
      if (error) {
        console.error(`Sector avg upsert error for ${sa.sector}:`, error);
      } else {
        sectorsUpserted++;
      }
    }

    // ── 10. Log ETL run ──
    await supabase.from("etl_job_runs").insert({
      job_name: "cron-metrics",
      finished_at: new Date().toISOString(),
      status: metricsErrors > 0 ? "failed" : "success",
      rows_processed: computed,
      rows_errored: skipped + metricsErrors,
      details: {
        metrics_upserted: metricsUpserted,
        scores_upserted: scoresUpserted,
        sectors_upserted: sectorsUpserted,
        skipped_no_data: skipped,
        elapsed_ms: Date.now() - startTime,
      },
    });

    return NextResponse.json({
      success: true,
      date: today,
      companies_total: companies.length,
      metrics_computed: computed,
      metrics_upserted: metricsUpserted,
      scores_upserted: scoresUpserted,
      sectors_upserted: sectorsUpserted,
      skipped_no_data: skipped,
      errors: metricsErrors,
      elapsed_ms: Date.now() - startTime,
    });
  } catch (err) {
    console.error("Metrics cron error:", err);
    return NextResponse.json(
      { error: "Internal error", message: String(err) },
      { status: 500 },
    );
  }
}

function num(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
