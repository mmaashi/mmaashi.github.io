import { createServiceClient } from "@/lib/supabase/server";
import { t, tSector } from "@/lib/i18n";
import { calculateScores } from "@/lib/scores";
import { scoreVerdict } from "@/lib/format";
import { displayName } from "@/lib/display-names";
import { Info, Briefcase } from "lucide-react";
import DashboardSummaryCards from "@/components/dashboard/DashboardSummaryCards";
import PortfolioPerformanceChart from "@/components/dashboard/PortfolioPerformanceChart";
import HoldingsTable, { type HoldingRow } from "@/components/dashboard/HoldingsTable";
import SectorAllocationChart from "@/components/dashboard/SectorAllocationChart";
import UpdatesFeed, { type FeedItem } from "@/components/dashboard/UpdatesFeed";

// Demo holdings – tickers that exist in the DB
const DEMO_HOLDINGS = [
  { ticker: "2222", shares: 50, avgCost: 28.5 },
  { ticker: "1120", shares: 200, avgCost: 82.0 },
  { ticker: "2350", shares: 150, avgCost: 35.6 },
  { ticker: "7010", shares: 100, avgCost: 140.0 },
  { ticker: "2380", shares: 300, avgCost: 10.5 },
  { ticker: "1010", shares: 120, avgCost: 40.8 },
];

const SECTOR_AVG_PE = 18;

export default async function PortfolioPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const sar = t(locale, "common.sar");
  const supabase = createServiceClient();

  /* ── 1. Fetch companies ── */
  const { data: companies } = await supabase
    .from("companies")
    .select("id, ticker, name_en, name_ar, sector")
    .in("ticker", DEMO_HOLDINGS.map((h) => h.ticker));

  const companyIds = (companies || []).map((c) => c.id);
  const tickerToCompany = new Map(
    (companies || []).map((c) => [c.ticker, c])
  );

  /* ── 2. Parallel fetches ── */
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const oneYearStr = oneYearAgo.toISOString().slice(0, 10);

  const [pricesRes, financialsRes, dividendsRes, historyRes, newsRes] =
    await Promise.all([
      // Latest 2 prices per company (for today change calc)
      supabase
        .from("stock_prices")
        .select("company_id, close, date")
        .in("company_id", companyIds)
        .order("date", { ascending: false })
        .limit(companyIds.length * 2),
      // Latest financials per company
      supabase
        .from("financials")
        .select("company_id, earnings_per_share, revenue, net_income, debt_to_equity, current_ratio, operating_cash_flow, free_cash_flow, book_value_per_share")
        .in("company_id", companyIds)
        .order("year", { ascending: false })
        .limit(companyIds.length),
      // Last 12 dividends per company
      supabase
        .from("dividends")
        .select("company_id, amount_per_share, pay_date, ex_date")
        .in("company_id", companyIds)
        .order("pay_date", { ascending: false })
        .limit(companyIds.length * 4),
      // 1-year price history for all companies
      supabase
        .from("stock_prices")
        .select("company_id, close, date")
        .in("company_id", companyIds)
        .gte("date", oneYearStr)
        .order("date", { ascending: true }),
      // Recent news
      supabase
        .from("news")
        .select("company_id, title_en, title_ar, published_at, source_url")
        .in("company_id", companyIds)
        .order("published_at", { ascending: false })
        .limit(20),
    ]);

  /* ── 3. Build price map (latest + previous close) ── */
  const priceMap = new Map<string, { close: number; prevClose: number | null }>();
  const seenCount = new Map<string, number>();
  for (const p of pricesRes.data || []) {
    const count = seenCount.get(p.company_id) || 0;
    if (count === 0) {
      priceMap.set(p.company_id, { close: Number(p.close), prevClose: null });
    } else if (count === 1) {
      const existing = priceMap.get(p.company_id)!;
      existing.prevClose = Number(p.close);
    }
    seenCount.set(p.company_id, count + 1);
  }

  /* ── 4. Build 52-week high/low from history ── */
  const highLowMap = new Map<string, { high: number; low: number }>();
  for (const p of historyRes.data || []) {
    const val = Number(p.close);
    const existing = highLowMap.get(p.company_id);
    if (!existing) {
      highLowMap.set(p.company_id, { high: val, low: val });
    } else {
      if (val > existing.high) existing.high = val;
      if (val < existing.low) existing.low = val;
    }
  }

  /* ── 5. Build financial & dividend maps ── */
  const finMap = new Map<string, NonNullable<typeof financialsRes.data>[0]>();
  const seenFin = new Set<string>();
  for (const f of financialsRes.data || []) {
    if (!seenFin.has(f.company_id)) {
      finMap.set(f.company_id, f);
      seenFin.add(f.company_id);
    }
  }

  const divMap = new Map<string, { annualEst: number; nextDate: string | null; nextAmount: number | null }>();
  const divBuckets = new Map<string, NonNullable<typeof dividendsRes.data>>();
  for (const d of dividendsRes.data || []) {
    if (!divBuckets.has(d.company_id)) divBuckets.set(d.company_id, []);
    divBuckets.get(d.company_id)!.push(d);
  }
  for (const [cid, divs] of divBuckets) {
    if (!divs || !divs.length) continue;
    const last4 = divs.slice(0, 4);
    const annualEst = last4.reduce((s, d) => s + Number(d.amount_per_share || 0), 0);
    divMap.set(cid, {
      annualEst,
      nextDate: divs[0]?.pay_date ?? null,
      nextAmount: divs[0] ? Number(divs[0].amount_per_share) : null,
    });
  }

  /* ── 6. Build HoldingRow[] ── */
  const holdings: HoldingRow[] = [];
  for (const h of DEMO_HOLDINGS) {
    const company = tickerToCompany.get(h.ticker);
    if (!company) continue;
    const priceData = priceMap.get(company.id);
    const currentPrice = priceData?.close ?? h.avgCost;
    const prevClose = priceData?.prevClose ?? currentPrice;
    const totalCost = h.shares * h.avgCost;
    const totalValue = h.shares * currentPrice;
    const gainLoss = totalValue - totalCost;
    const gainPct = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;
    const todayChange = prevClose > 0 ? ((currentPrice - prevClose) / prevClose) * 100 : 0;

    const fin = finMap.get(company.id);
    const hl = highLowMap.get(company.id);
    const div = divMap.get(company.id);
    const eps = fin?.earnings_per_share ? Number(fin.earnings_per_share) : null;
    const pe = eps && eps > 0 ? currentPrice / eps : null;
    const divYield = div && div.annualEst > 0 ? (div.annualEst / currentPrice) * 100 : 0;
    const rev = fin?.revenue ? Number(fin.revenue) : null;
    const ni = fin?.net_income ? Number(fin.net_income) : null;

    // SŪQAI Score
    let overallScore: number | null = null;
    try {
      const scores = calculateScores({
        pe: pe ?? null,
        eps: eps ?? null,
        divYield,
        revenue: rev ?? null,
        netIncome: ni ?? null,
        changePct: todayChange,
        currentPrice,
        fiftyTwoHigh: hl?.high ?? currentPrice,
        fiftyTwoLow: hl?.low ?? currentPrice,
      });
      overallScore = ((scores.value + scores.growth + scores.dividend + scores.health + scores.momentum) / 25) * 100;
    } catch { /* skip */ }

    // Fair value diff via P/E method
    let fairValueDiff: number | null = null;
    if (pe && pe > 0) {
      const fairPrice = (eps! * SECTOR_AVG_PE);
      fairValueDiff = ((fairPrice - currentPrice) / currentPrice) * 100;
    }

    holdings.push({
      ticker: h.ticker,
      name: displayName(locale, company.name_en, company.name_ar),
      sector: company.sector || "Other",
      shares: h.shares,
      avgCost: h.avgCost,
      currentPrice,
      totalValue,
      gainLoss,
      gainPct,
      todayChange,
      weight: 0, // computed below
      overallScore,
      fairValueDiff,
      nextDivDate: div?.nextDate ?? null,
      nextDivAmount: div?.nextAmount ?? null,
    });
  }

  // Compute weights
  const totalValue = holdings.reduce((s, h) => s + h.totalValue, 0);
  for (const h of holdings) {
    h.weight = totalValue > 0 ? (h.totalValue / totalValue) * 100 : 0;
  }

  /* ── 7. Summary stats ── */
  const totalCost = holdings.reduce((s, h) => s + h.shares * h.avgCost, 0);
  const totalGain = totalValue - totalCost;
  const totalGainPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;
  const todayGainAmount = holdings.reduce(
    (s, h) => s + h.totalValue * (h.todayChange / (100 + h.todayChange)),
    0
  );
  const todayGainPct =
    totalValue > 0 ? (todayGainAmount / (totalValue - todayGainAmount)) * 100 : 0;
  const annualDividendEst = holdings.reduce((s, h) => {
    const div = divMap.get(tickerToCompany.get(h.ticker)?.id || "");
    return s + (div?.annualEst ?? 0) * h.shares;
  }, 0);
  const alertCount = holdings.filter(
    (h) => Math.abs(h.todayChange) > 3 || (h.overallScore !== null && h.overallScore <= 30)
  ).length;

  /* ── 8. Sector allocation ── */
  const sectorBuckets = new Map<string, { value: number; count: number; change: number }>();
  for (const h of holdings) {
    const existing = sectorBuckets.get(h.sector);
    if (!existing) {
      sectorBuckets.set(h.sector, { value: h.totalValue, count: 1, change: h.todayChange });
    } else {
      existing.value += h.totalValue;
      existing.count += 1;
      existing.change = (existing.change * (existing.count - 1) + h.todayChange) / existing.count;
    }
  }
  const sectors = [...sectorBuckets.entries()]
    .map(([sector, d]) => ({
      sector,
      sectorAr: tSector("ar", sector),
      value: d.value,
      weight: totalValue > 0 ? (d.value / totalValue) * 100 : 0,
      count: d.count,
      change: d.change,
    }))
    .sort((a, b) => b.weight - a.weight);

  /* ── 9. Feed items ── */
  const feedItems: FeedItem[] = [];
  // Dividends
  for (const d of (dividendsRes.data || []).slice(0, 5)) {
    const comp = (companies || []).find((c) => c.id === d.company_id);
    if (!comp) continue;
    feedItems.push({
      id: `div-${comp.ticker}-${d.pay_date}`,
      type: "dividend",
      ticker: comp.ticker,
      title: `${sar} ${Number(d.amount_per_share).toFixed(2)} ${t(locale, "portfolio.feed.per_share")}`,
      subtitle: d.pay_date ? `${t(locale, "portfolio.feed.pay_date")} ${d.pay_date}` : "",
      date: d.ex_date || d.pay_date || new Date().toISOString(),
      color: "var(--c-gold)",
      link: `/${locale}/stock/${comp.ticker}`,
    });
  }
  // News
  for (const n of (newsRes.data || []).slice(0, 5)) {
    const comp = (companies || []).find((c) => c.id === n.company_id);
    if (!comp) continue;
    feedItems.push({
      id: `news-${comp.ticker}-${n.published_at}`,
      type: "news",
      ticker: comp.ticker,
      title: (locale === "ar" ? n.title_ar : n.title_en) || n.title_en || "News",
      subtitle: "",
      date: n.published_at || new Date().toISOString(),
      color: "#60A5FA",
      link: n.source_url || `/${locale}/stock/${comp.ticker}`,
    });
  }
  // Score alerts
  for (const h of holdings) {
    if (h.overallScore !== null && h.overallScore >= 80) {
      feedItems.push({
        id: `score-high-${h.ticker}`,
        type: "score_alert",
        ticker: h.ticker,
        title: `${t(locale, "portfolio.feed.score_label")} ${Math.round(h.overallScore)} — ${scoreVerdict(h.overallScore, locale).label}`,
        subtitle: "",
        date: new Date().toISOString(),
        color: "var(--c-green)",
        link: `/${locale}/stock/${h.ticker}`,
      });
    } else if (h.overallScore !== null && h.overallScore <= 30) {
      feedItems.push({
        id: `score-low-${h.ticker}`,
        type: "score_alert",
        ticker: h.ticker,
        title: `${t(locale, "portfolio.feed.score_label")} ${Math.round(h.overallScore)} — ${scoreVerdict(h.overallScore, locale).label}`,
        subtitle: "",
        date: new Date().toISOString(),
        color: "var(--c-red)",
        link: `/${locale}/stock/${h.ticker}`,
      });
    }
  }
  // Price alerts (>3% move)
  for (const h of holdings) {
    if (Math.abs(h.todayChange) > 3) {
      feedItems.push({
        id: `price-${h.ticker}`,
        type: "price_alert",
        ticker: h.ticker,
        title: `${h.todayChange > 0 ? "+" : ""}${h.todayChange.toFixed(1)}% ${t(locale, "portfolio.feed.today")}`,
        subtitle: `${sar} ${h.currentPrice.toFixed(2)}`,
        date: new Date().toISOString(),
        color: h.todayChange > 0 ? "var(--c-green)" : "var(--c-red)",
        link: `/${locale}/stock/${h.ticker}`,
      });
    }
  }
  feedItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  /* ── 10. Performance chart data ── */
  const dateMap = new Map<string, { portfolio: number }>();
  for (const p of historyRes.data || []) {
    const holding = DEMO_HOLDINGS.find((h) => {
      const comp = tickerToCompany.get(h.ticker);
      return comp?.id === p.company_id;
    });
    if (!holding) continue;
    const val = Number(p.close) * holding.shares;
    const existing = dateMap.get(p.date);
    if (!existing) {
      dateMap.set(p.date, { portfolio: val });
    } else {
      existing.portfolio += val;
    }
  }
  const performanceData = [...dateMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, d]) => ({ date, portfolio: d.portfolio }));

  /* ── RENDER ── */
  const isAr = locale === "ar";

  return (
    <div className="page-wrap">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 fade-up">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "var(--c-gold-dim)", border: "1px solid var(--c-gold-ring)" }}
        >
          <Briefcase size={16} style={{ color: "var(--c-gold)" }} />
        </div>
        <div>
          <h1
            className="font-bold text-xl"
            style={{ color: "var(--c-text)", fontFamily: "var(--font-grotesk)" }}
          >
            {t(locale, "portfolio.command_center")}
          </h1>
          <p style={{ fontSize: 12, color: "var(--c-muted)" }}>
            {t(locale, "portfolio.command_center_desc")}
          </p>
        </div>
      </div>

      {/* Demo Banner */}
      <div className="card-gold fade-up mb-5" style={{ padding: "12px 18px" }}>
        <div className="flex items-center gap-3">
          <Info size={13} style={{ color: "var(--c-gold)" }} />
          <p style={{ fontSize: 11, color: "var(--c-muted)" }}>
            {t(locale, "portfolio.demo_desc")}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <DashboardSummaryCards
        totalValue={totalValue}
        totalCost={totalCost}
        totalGain={totalGain}
        totalGainPct={totalGainPct}
        todayGainAmount={todayGainAmount}
        todayGainPct={todayGainPct}
        annualDividendEst={annualDividendEst}
        alertCount={alertCount}
        holdingsCount={holdings.length}
        sar={sar}
        locale={locale}
      />

      {/* Performance Chart + Sector Allocation (2:1 grid) */}
      <div
        className="stagger"
        style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14, marginBottom: 20 }}
      >
        <PortfolioPerformanceChart data={performanceData} locale={locale} sar={sar} />
        <SectorAllocationChart sectors={sectors} locale={locale} sar={sar} />
      </div>

      {/* Responsive override for chart grid */}
      <style>{`
        @media (max-width: 900px) {
          .stagger { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Holdings Table */}
      <div className="mb-5">
        <HoldingsTable holdings={holdings} locale={locale} sar={sar} />
      </div>

      {/* Updates Feed */}
      <div className="mb-8">
        <UpdatesFeed items={feedItems} locale={locale} />
      </div>

      <hr className="gold-line my-8" />
      <p style={{ fontSize: 11, color: "var(--c-dim)", textAlign: "center", letterSpacing: "0.02em" }}>
        {t(locale, "common.disclaimer")}
      </p>
    </div>
  );
}
