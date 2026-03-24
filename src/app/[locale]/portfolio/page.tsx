import { createServiceClient } from "@/lib/supabase/server";
import { t, tSector } from "@/lib/i18n";
import { calculateScores } from "@/lib/scores";
import { displayName } from "@/lib/display-names";
import Link from "next/link";
import { Sparkles, Rocket, DollarSign, ArrowRight } from "lucide-react";

import PortfolioTabs from "@/components/PortfolioTabs";
import PortfolioPerformanceChart from "@/components/dashboard/PortfolioPerformanceChart";

export const revalidate = 900;

// ── Demo data ──
const DEMO_HOLDINGS = [
  { ticker: "2222", shares: 50, avgCost: 28.5 },
  { ticker: "1120", shares: 200, avgCost: 82.0 },
  { ticker: "2350", shares: 150, avgCost: 35.6 },
  { ticker: "7010", shares: 100, avgCost: 140.0 },
  { ticker: "2380", shares: 300, avgCost: 10.5 },
  { ticker: "1010", shares: 120, avgCost: 40.8 },
];
const DEMO_WATCHLIST = ["2010", "1211", "4200", "2280", "4030"];

const SECTOR_AVG_PE = 18;

const SECTOR_COLORS: Record<string, string> = {
  Banks: "#c8a951", Materials: "#60a5fa", "Telecommunication Services": "#a78bfa",
  Retailing: "#34d399", Energy: "#f87171", "Food & Beverages": "#fbbf24",
  Insurance: "#818cf8", "Health Care Equipment & Svc": "#f472b6",
  "Real Estate Mgmt & Dev't": "#22d3ee", Utilities: "#94a3b8",
  "Capital Goods": "#fb923c", Other: "#64748b",
};

function scoreColor(s: number): string {
  if (s >= 75) return "var(--c-green)";
  if (s >= 55) return "var(--c-gold)";
  if (s >= 35) return "var(--c-text)";
  return "var(--c-red)";
}

export default async function PortfolioPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isAr = locale === "ar";
  const sar = t(locale, "common.sar");
  const supabase = createServiceClient();

  // ══════════════════════════════════════════════════
  //  REAL PORTFOLIO CHECK
  // ══════════════════════════════════════════════════
  const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";
  let isDemo = true;
  let activeHoldingsInput: Array<{ ticker: string; shares: number; avgCost: number }> = DEMO_HOLDINGS;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: realPortfolio } = (await (supabase as any)
      .from("portfolios")
      .select("id, portfolio_holdings (id, ticker, company_id, quantity, average_cost)")
      .eq("user_id", DEMO_USER_ID)
      .eq("is_default", true)
      .single()) as { data: { id: string; portfolio_holdings: Array<{ id: string; ticker: string; company_id: string | null; quantity: number; average_cost: number | null }> } | null; error: unknown };

    if (realPortfolio?.portfolio_holdings && realPortfolio.portfolio_holdings.length > 0) {
      isDemo = false;
      activeHoldingsInput = realPortfolio.portfolio_holdings.map((h) => ({
        ticker: h.ticker,
        shares: Number(h.quantity),
        avgCost: h.average_cost ? Number(h.average_cost) : 0,
      }));
    }
  } catch {
    // Portfolio tables may not exist yet
  }

  // ══════════════════════════════════════════════════
  //  DATA FETCHING
  // ══════════════════════════════════════════════════

  // Fetch ALL companies for the inline add search
  const { data: allCompanies } = await supabase.from("companies").select("ticker, name_en, name_ar").order("ticker");
  const allStocks = (allCompanies || []).map((c) => ({
    ticker: c.ticker,
    name: displayName(locale, c.name_en, c.name_ar),
  }));

  const allTickers = [...new Set([...activeHoldingsInput.map((h) => h.ticker), ...DEMO_WATCHLIST])];
  const { data: companies } = await supabase.from("companies").select("id, ticker, name_en, name_ar, sector").in("ticker", allTickers);
  const companyIds = (companies || []).map((c) => c.id);
  const tickerToCompany = new Map((companies || []).map((c) => [c.ticker, c]));

  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const oneYearStr = oneYearAgo.toISOString().slice(0, 10);

  const [pricesRes, financialsRes, dividendsRes, historyRes] = await Promise.all([
    supabase.from("stock_prices").select("company_id, close, date").in("company_id", companyIds).order("date", { ascending: false }).limit(companyIds.length * 2),
    supabase.from("financials").select("company_id, earnings_per_share, revenue, net_income, debt_to_equity, current_ratio").in("company_id", companyIds).order("year", { ascending: false }).limit(companyIds.length),
    supabase.from("dividends").select("company_id, amount_per_share, pay_date, ex_date").in("company_id", companyIds).order("pay_date", { ascending: false }).limit(companyIds.length * 4),
    supabase.from("stock_prices").select("company_id, close, date").in("company_id", companyIds).gte("date", oneYearStr).order("date", { ascending: true }),
  ]);

  // ══════════════════════════════════════════════════
  //  DATA PROCESSING
  // ══════════════════════════════════════════════════
  const priceMap = new Map<string, { close: number; prevClose: number | null }>();
  const seenCount = new Map<string, number>();
  for (const p of pricesRes.data || []) {
    const count = seenCount.get(p.company_id) || 0;
    if (count === 0) priceMap.set(p.company_id, { close: Number(p.close), prevClose: null });
    else if (count === 1) priceMap.get(p.company_id)!.prevClose = Number(p.close);
    seenCount.set(p.company_id, count + 1);
  }

  const highLowMap = new Map<string, { high: number; low: number }>();
  for (const p of historyRes.data || []) {
    const val = Number(p.close);
    const ex = highLowMap.get(p.company_id);
    if (!ex) highLowMap.set(p.company_id, { high: val, low: val });
    else { if (val > ex.high) ex.high = val; if (val < ex.low) ex.low = val; }
  }

  const finMap = new Map<string, NonNullable<typeof financialsRes.data>[0]>();
  const seenFin = new Set<string>();
  for (const f of financialsRes.data || []) { if (!seenFin.has(f.company_id)) { finMap.set(f.company_id, f); seenFin.add(f.company_id); } }

  const divMap = new Map<string, { annualEst: number; nextDate: string | null; nextAmount: number | null }>();
  const divBuckets = new Map<string, NonNullable<typeof dividendsRes.data>>();
  for (const d of dividendsRes.data || []) { if (!divBuckets.has(d.company_id)) divBuckets.set(d.company_id, []); divBuckets.get(d.company_id)!.push(d); }
  for (const [cid, divs] of divBuckets) {
    if (!divs?.length) continue;
    const last4 = divs.slice(0, 4);
    divMap.set(cid, { annualEst: last4.reduce((s, d) => s + Number(d.amount_per_share || 0), 0), nextDate: divs[0]?.pay_date ?? null, nextAmount: divs[0] ? Number(divs[0].amount_per_share) : null });
  }

  function computeScore(companyId: string, currentPrice: number, todayChange: number): number | null {
    const fin = finMap.get(companyId);
    const hl = highLowMap.get(companyId);
    const div = divMap.get(companyId);
    const eps = fin?.earnings_per_share ? Number(fin.earnings_per_share) : null;
    const pe = eps && eps > 0 ? currentPrice / eps : null;
    const divYield = div && div.annualEst > 0 ? (div.annualEst / currentPrice) * 100 : 0;
    try {
      const p = calculateScores({ pe: pe ?? null, eps: eps ?? null, divYield, revenue: fin?.revenue ? Number(fin.revenue) : null, netIncome: fin?.net_income ? Number(fin.net_income) : null, changePct: todayChange, currentPrice, fiftyTwoHigh: hl?.high ?? currentPrice, fiftyTwoLow: hl?.low ?? currentPrice, debtToEquity: fin?.debt_to_equity ? Number(fin.debt_to_equity) : null, roe: null });
      return p ? ((p.value + p.growth + p.dividend + p.health + p.momentum) / 25) * 100 : null;
    } catch { return null; }
  }

  // ══════════════════════════════════════════════════
  //  BUILD HOLDINGS
  // ══════════════════════════════════════════════════
  interface HoldingRow {
    ticker: string; name: string; sector: string; shares: number; avgCost: number;
    currentPrice: number; totalValue: number; gainLoss: number; gainPct: number;
    todayChange: number; weight: number; overallScore: number | null;
  }

  const holdings: HoldingRow[] = [];
  for (const h of activeHoldingsInput) {
    const company = tickerToCompany.get(h.ticker);
    if (!company) continue;
    const priceData = priceMap.get(company.id);
    const currentPrice = priceData?.close ?? (h.avgCost > 0 ? h.avgCost : 0);
    const prevClose = priceData?.prevClose ?? currentPrice;
    const totalCost = h.avgCost > 0 ? h.shares * h.avgCost : 0;
    const totalValue = h.shares * currentPrice;
    const gainLoss = totalValue - totalCost;
    const gainPct = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;
    const todayChange = prevClose > 0 ? ((currentPrice - prevClose) / prevClose) * 100 : 0;
    const overallScore = computeScore(company.id, currentPrice, todayChange);
    holdings.push({
      ticker: h.ticker, name: displayName(locale, company.name_en, company.name_ar),
      sector: company.sector || "Other", shares: h.shares, avgCost: h.avgCost,
      currentPrice, totalValue, gainLoss, gainPct, todayChange, weight: 0, overallScore,
    });
  }

  const totalValue = holdings.reduce((s, h) => s + h.totalValue, 0);
  for (const h of holdings) h.weight = totalValue > 0 ? (h.totalValue / totalValue) * 100 : 0;
  const totalCost = holdings.reduce((s, h) => s + h.shares * h.avgCost, 0);
  const totalGain = totalValue - totalCost;
  const totalGainPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;
  const todayGainAmount = holdings.reduce((s, h) => s + h.totalValue * (h.todayChange / (100 + h.todayChange)), 0);
  const todayGainPct = totalValue > 0 ? (todayGainAmount / (totalValue - todayGainAmount)) * 100 : 0;
  const annualDividendEst = holdings.reduce((s, h) => { const d = divMap.get(tickerToCompany.get(h.ticker)?.id || ""); return s + (d?.annualEst ?? 0) * h.shares; }, 0);
  const weightedDivYield = totalValue > 0 ? (annualDividendEst / totalValue) * 100 : 0;

  // ══════════════════════════════════════════════════
  //  SECTORS
  // ══════════════════════════════════════════════════
  const sectorBuckets = new Map<string, number>();
  for (const h of holdings) sectorBuckets.set(h.sector, (sectorBuckets.get(h.sector) || 0) + h.totalValue);
  const sectors = [...sectorBuckets.entries()]
    .map(([sector, value]) => ({
      sector,
      sectorLocal: isAr ? tSector("ar", sector) : sector,
      weight: totalValue > 0 ? (value / totalValue) * 100 : 0,
      color: SECTOR_COLORS[sector] || "#64748b",
    }))
    .sort((a, b) => b.weight - a.weight);

  // ══════════════════════════════════════════════════
  //  WATCHLIST
  // ══════════════════════════════════════════════════
  interface WatchItem {
    ticker: string; name: string; price: number; change: number;
    score: number | null; divYield: number | null;
  }

  const watchlist: WatchItem[] = [];
  for (const ticker of DEMO_WATCHLIST) {
    const company = tickerToCompany.get(ticker);
    if (!company) continue;
    const priceData = priceMap.get(company.id);
    if (!priceData) continue;
    const prevClose = priceData.prevClose ?? priceData.close;
    const todayChange = prevClose > 0 ? ((priceData.close - prevClose) / prevClose) * 100 : 0;
    const score = computeScore(company.id, priceData.close, todayChange);
    const div = divMap.get(company.id);
    watchlist.push({
      ticker,
      name: displayName(locale, company.name_en, company.name_ar),
      price: priceData.close,
      change: todayChange,
      score,
      divYield: div && div.annualEst > 0 ? (div.annualEst / priceData.close) * 100 : null,
    });
  }

  // ══════════════════════════════════════════════════
  //  PERFORMANCE CHART DATA
  // ══════════════════════════════════════════════════
  const dateMap = new Map<string, number>();
  for (const p of historyRes.data || []) {
    const holding = activeHoldingsInput.find((h) => tickerToCompany.get(h.ticker)?.id === p.company_id);
    if (!holding) continue;
    const val = Number(p.close) * holding.shares;
    dateMap.set(p.date, (dateMap.get(p.date) || 0) + val);
  }
  const performanceData = [...dateMap.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, portfolio]) => ({ date, portfolio }));

  // ══════════════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════════════
  return (
    <div className="page-wrap">
      {/* ── Demo banner ── */}
      {isDemo && (
        <div style={{
          padding: "12px 18px", borderRadius: 10,
          background: "rgba(200,169,81,0.06)", border: "1px solid var(--c-gold-ring)",
          marginBottom: 14, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
        }}>
          <Sparkles size={13} style={{ color: "var(--c-gold)" }} />
          <span style={{ fontSize: 11, color: "var(--c-muted)", flex: 1 }}>
            {isAr ? "محفظة تجريبية — أنشئ محفظتك لتتبع استثماراتك" : "Sample portfolio — create yours to track your investments"}
          </span>
          <Link href={`/${locale}/portfolio/create`} style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "5px 14px", borderRadius: 7,
            background: "var(--c-gold)", color: "var(--c-base)",
            fontSize: 10, fontWeight: 700, textDecoration: "none",
          }}>
            <Rocket size={10} /> {isAr ? "أنشئ محفظتي" : "Create Mine"}
          </Link>
        </div>
      )}

      {/* ── Main portfolio card ── */}
      <div style={{
        background: "var(--c-surface)", border: "1px solid var(--c-border)",
        borderRadius: 14, overflow: "hidden", marginBottom: 20,
      }}>
        <PortfolioTabs
          holdings={holdings}
          watchlist={watchlist}
          sectors={sectors}
          allStocks={allStocks}
          locale={locale}
          totalValue={totalValue}
          totalCost={totalCost}
          totalGain={totalGain}
          totalGainPct={totalGainPct}
          todayGainAmount={todayGainAmount}
          todayGainPct={todayGainPct}
          annualDividend={annualDividendEst}
          divYield={weightedDivYield}
        />
      </div>

      {/* ── Performance Chart ── */}
      {performanceData.length > 10 && (
        <div style={{ marginBottom: 20 }}>
          <PortfolioPerformanceChart data={performanceData} locale={locale} sar={sar} />
        </div>
      )}

      {/* ── Quick links ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(200px, 100%), 1fr))", gap: 10, marginBottom: 20 }}>
        <Link href={`/${locale}/dividend-forecast`} style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "14px 16px", borderRadius: 12,
          background: "var(--c-surface)", border: "1px solid var(--c-border)",
          textDecoration: "none", transition: "border-color 0.2s",
        }}>
          <DollarSign size={16} style={{ color: "var(--c-green)" }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--c-text)" }}>
              {isAr ? "توقّعات التوزيعات" : "Dividend Forecast"}
            </div>
            <div style={{ fontSize: 10, color: "var(--c-muted)" }}>
              {isAr ? "كم ستجني سنويًا" : "See your projected income"}
            </div>
          </div>
          <ArrowRight size={14} style={{ color: "var(--c-dim)" }} />
        </Link>
        <Link href={`/${locale}/screener`} style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "14px 16px", borderRadius: 12,
          background: "var(--c-surface)", border: "1px solid var(--c-border)",
          textDecoration: "none", transition: "border-color 0.2s",
        }}>
          <Sparkles size={16} style={{ color: "var(--c-gold)" }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--c-text)" }}>
              {isAr ? "استكشف أسهم جديدة" : "Discover New Stocks"}
            </div>
            <div style={{ fontSize: 10, color: "var(--c-muted)" }}>
              {isAr ? "فلتر وفرز ٢٦٠+ سهم" : "Filter & sort 260+ stocks"}
            </div>
          </div>
          <ArrowRight size={14} style={{ color: "var(--c-dim)" }} />
        </Link>
      </div>

      {/* ── Disclaimer ── */}
      <p style={{ fontSize: 11, color: "var(--c-dim)", textAlign: "center", letterSpacing: "0.02em" }}>
        {t(locale, "common.disclaimer")}
      </p>
    </div>
  );
}
