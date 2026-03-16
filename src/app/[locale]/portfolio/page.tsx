import { createServiceClient } from "@/lib/supabase/server";
import { t, tSector } from "@/lib/i18n";
import { calculateScores } from "@/lib/scores";
import { scoreVerdict } from "@/lib/format";
import { displayName } from "@/lib/display-names";
import { getMarketSummary } from "@/lib/sahm";
import { Info, Briefcase, TrendingUp } from "lucide-react";
import DashboardSummaryCards from "@/components/dashboard/DashboardSummaryCards";
import PortfolioPerformanceChart from "@/components/dashboard/PortfolioPerformanceChart";
import HoldingsTable, { type HoldingRow } from "@/components/dashboard/HoldingsTable";
import SectorAllocationChart from "@/components/dashboard/SectorAllocationChart";
import UpdatesFeed, { type FeedItem } from "@/components/dashboard/UpdatesFeed";
import TodayAtGlance, { type TodayData } from "@/components/dashboard/TodayAtGlance";
import WatchlistModule, { type WatchlistStock } from "@/components/dashboard/WatchlistModule";
import OpportunitiesModule, { type Opportunity } from "@/components/dashboard/OpportunitiesModule";
import WealthCalculator from "@/components/dashboard/WealthCalculator";
import RecentlyViewed, { type RecentStock } from "@/components/dashboard/RecentlyViewed";

// Demo holdings – tickers that exist in the DB
const DEMO_HOLDINGS = [
  { ticker: "2222", shares: 50, avgCost: 28.5 },
  { ticker: "1120", shares: 200, avgCost: 82.0 },
  { ticker: "2350", shares: 150, avgCost: 35.6 },
  { ticker: "7010", shares: 100, avgCost: 140.0 },
  { ticker: "2380", shares: 300, avgCost: 10.5 },
  { ticker: "1010", shares: 120, avgCost: 40.8 },
];

// Demo watchlist — popular stocks to track
const DEMO_WATCHLIST = ["2010", "1211", "4200", "2280", "4030"];

const SECTOR_AVG_PE = 18;

export default async function MyDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const sar = t(locale, "common.sar");
  const isAr = locale === "ar";
  const supabase = createServiceClient();

  // ── Fetch market summary for Today at a Glance ──
  let marketData = { index_value: 0, index_change: 0, index_change_percent: 0, advancing: 0, declining: 0, unchanged: 0, total_volume: 0, isOpen: false };
  try {
    const s = await getMarketSummary();
    const riyadh = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Riyadh" }));
    const day = riyadh.getDay();
    const min = riyadh.getHours() * 60 + riyadh.getMinutes();
    marketData = {
      index_value: s.index_value,
      index_change: s.index_change,
      index_change_percent: s.index_change_percent,
      advancing: s.advancing,
      declining: s.declining,
      unchanged: s.unchanged,
      total_volume: s.total_volume,
      isOpen: day >= 0 && day <= 4 && min >= 600 && min <= 900,
    };
  } catch {}

  // ── Fetch all tickers we need (holdings + watchlist + opportunities) ──
  const allTickers = [...new Set([...DEMO_HOLDINGS.map((h) => h.ticker), ...DEMO_WATCHLIST])];

  const { data: companies } = await supabase
    .from("companies")
    .select("id, ticker, name_en, name_ar, sector")
    .in("ticker", allTickers);

  const companyIds = (companies || []).map((c) => c.id);
  const tickerToCompany = new Map((companies || []).map((c) => [c.ticker, c]));

  // ── Parallel fetches ──
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const oneYearStr = oneYearAgo.toISOString().slice(0, 10);

  const [pricesRes, financialsRes, dividendsRes, historyRes, newsRes, opportunitiesRes] =
    await Promise.all([
      supabase
        .from("stock_prices")
        .select("company_id, close, date")
        .in("company_id", companyIds)
        .order("date", { ascending: false })
        .limit(companyIds.length * 2),
      supabase
        .from("financials")
        .select("company_id, earnings_per_share, revenue, net_income, debt_to_equity, current_ratio, operating_cash_flow, free_cash_flow, book_value_per_share")
        .in("company_id", companyIds)
        .order("year", { ascending: false })
        .limit(companyIds.length),
      supabase
        .from("dividends")
        .select("company_id, amount_per_share, pay_date, ex_date")
        .in("company_id", companyIds)
        .order("pay_date", { ascending: false })
        .limit(companyIds.length * 4),
      supabase
        .from("stock_prices")
        .select("company_id, close, date")
        .in("company_id", companyIds)
        .gte("date", oneYearStr)
        .order("date", { ascending: true }),
      supabase
        .from("news")
        .select("company_id, title_en, title_ar, published_at, source_url")
        .in("company_id", companyIds)
        .order("published_at", { ascending: false })
        .limit(20),
      // Fetch top-scoring companies for Opportunities (outside portfolio)
      supabase
        .from("company_metrics_daily" as any)
        .select("company_id, suqai_score, pe_ratio, roe, dividend_yield, revenue_growth_yoy")
        .not("suqai_score", "is", null)
        .order("suqai_score", { ascending: false })
        .limit(30) as unknown as Promise<{ data: Array<{ company_id: string; suqai_score: number; pe_ratio: number | null; roe: number | null; dividend_yield: number | null; revenue_growth_yoy: number | null }> | null; error: any }>,
    ]);

  // ── Build price map ──
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

  // ── 52-week high/low ──
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

  // ── Financial & dividend maps ──
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

  // ── Helper: compute score for any company ──
  function computeScore(companyId: string, currentPrice: number, todayChange: number): number | null {
    const fin = finMap.get(companyId);
    const hl = highLowMap.get(companyId);
    const div = divMap.get(companyId);
    const eps = fin?.earnings_per_share ? Number(fin.earnings_per_share) : null;
    const pe = eps && eps > 0 ? currentPrice / eps : null;
    const divYield = div && div.annualEst > 0 ? (div.annualEst / currentPrice) * 100 : 0;
    const rev = fin?.revenue ? Number(fin.revenue) : null;
    const ni = fin?.net_income ? Number(fin.net_income) : null;

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
      return ((scores.value + scores.growth + scores.dividend + scores.health + scores.momentum) / 25) * 100;
    } catch {
      return null;
    }
  }

  // ── Build HoldingRow[] ──
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
    const overallScore = computeScore(company.id, currentPrice, todayChange);

    const fin = finMap.get(company.id);
    const eps = fin?.earnings_per_share ? Number(fin.earnings_per_share) : null;
    const pe = eps && eps > 0 ? currentPrice / eps : null;
    let fairValueDiff: number | null = null;
    if (pe && pe > 0) {
      const fairPrice = eps! * SECTOR_AVG_PE;
      fairValueDiff = ((fairPrice - currentPrice) / currentPrice) * 100;
    }

    const div = divMap.get(company.id);

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
      weight: 0,
      overallScore,
      fairValueDiff,
      nextDivDate: div?.nextDate ?? null,
      nextDivAmount: div?.nextAmount ?? null,
    });
  }

  const totalValue = holdings.reduce((s, h) => s + h.totalValue, 0);
  for (const h of holdings) {
    h.weight = totalValue > 0 ? (h.totalValue / totalValue) * 100 : 0;
  }

  // ── Summary stats ──
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

  // ── Sector allocation ──
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

  // ── Feed items ──
  const feedItems: FeedItem[] = [];
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

  // ── Performance chart data ──
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

  // ── Watchlist stocks ──
  const watchlistStocks: WatchlistStock[] = [];
  for (const ticker of DEMO_WATCHLIST) {
    const company = tickerToCompany.get(ticker);
    if (!company) continue;
    const priceData = priceMap.get(company.id);
    if (!priceData) continue;
    const prevClose = priceData.prevClose ?? priceData.close;
    const todayChange = prevClose > 0 ? ((priceData.close - prevClose) / prevClose) * 100 : 0;
    const score = computeScore(company.id, priceData.close, todayChange);

    let signal = "neutral";
    if (score !== null) {
      if (score >= 75) signal = "strong";
      else if (score >= 60) signal = "positive";
      else if (score >= 40) signal = "neutral";
      else if (score >= 25) signal = "caution";
      else signal = "negative";
    }

    const div = divMap.get(company.id);
    const divYield = div && div.annualEst > 0 ? (div.annualEst / priceData.close) * 100 : null;

    watchlistStocks.push({
      ticker,
      name: displayName(locale, company.name_en, company.name_ar),
      price: priceData.close,
      change: todayChange,
      score,
      signal,
      divYield,
    });
  }

  // ── Opportunities (top-scoring stocks NOT in the portfolio) ──
  const holdingTickers = new Set(DEMO_HOLDINGS.map((h) => h.ticker));
  const opportunities: Opportunity[] = [];

  // Fetch company info for opportunity candidates
  const oppCandidateIds = (opportunitiesRes.data || [])
    .map((r) => r.company_id)
    .filter((id) => id);

  let oppCompanies: Array<{ id: string; ticker: string; name_en: string; name_ar: string; sector: string }> = [];
  if (oppCandidateIds.length > 0) {
    const { data: oppComps } = await supabase
      .from("companies")
      .select("id, ticker, name_en, name_ar, sector")
      .in("id", oppCandidateIds);
    oppCompanies = oppComps || [];
  }

  const oppCompanyMap = new Map(oppCompanies.map((c) => [c.id, c]));

  // Also get latest prices for opportunity stocks
  const oppIds = oppCompanies.map((c) => c.id).filter((id) => !companyIds.includes(id));
  let oppPriceMap = new Map<string, number>();
  if (oppIds.length > 0) {
    const { data: oppPrices } = await supabase
      .from("stock_prices")
      .select("company_id, close")
      .in("company_id", oppIds)
      .order("date", { ascending: false })
      .limit(oppIds.length);
    const seenOpp = new Set<string>();
    for (const p of oppPrices || []) {
      if (!seenOpp.has(p.company_id)) {
        oppPriceMap.set(p.company_id, Number(p.close));
        seenOpp.add(p.company_id);
      }
    }
  }

  for (const row of opportunitiesRes.data || []) {
    if (opportunities.length >= 4) break;
    const comp = oppCompanyMap.get(row.company_id);
    if (!comp || holdingTickers.has(comp.ticker)) continue;

    const price = priceMap.get(comp.id)?.close ?? oppPriceMap.get(comp.id) ?? 0;
    if (price === 0) continue;

    const score = Number(row.suqai_score);
    if (score < 60) continue;

    // Determine opportunity tag
    const pe = row.pe_ratio ? Number(row.pe_ratio) : null;
    const roe = row.roe ? Number(row.roe) : null;
    const dy = row.dividend_yield ? Number(row.dividend_yield) : null;
    const revG = row.revenue_growth_yoy ? Number(row.revenue_growth_yoy) : null;

    let tag: Opportunity["tag"] = "high_quality";
    let reason = { en: `SŪQAI Score ${Math.round(score)} — strong fundamentals`, ar: `تقييم SŪQAI ${Math.round(score)} — أساسيات قوية` };

    if (pe !== null && pe > 0 && pe < 15) {
      tag = "undervalued";
      reason = {
        en: `P/E ${pe.toFixed(1)} — trading below sector average`,
        ar: `مكرر الأرباح ${pe.toFixed(1)} — يتداول أقل من متوسط القطاع`,
      };
    } else if (dy !== null && dy > 0.04) {
      tag = "dividend_leader";
      reason = {
        en: `Dividend yield ${(dy * 100).toFixed(1)}% — above-average income`,
        ar: `عائد التوزيعات ${(dy * 100).toFixed(1)}% — دخل فوق المتوسط`,
      };
    } else if (revG !== null && revG > 0.15) {
      tag = "momentum";
      reason = {
        en: `Revenue growing ${(revG * 100).toFixed(0)}% YoY — strong momentum`,
        ar: `الإيرادات تنمو ${(revG * 100).toFixed(0)}% سنويًا — زخم قوي`,
      };
    }

    opportunities.push({
      ticker: comp.ticker,
      name: displayName(locale, comp.name_en, comp.name_ar),
      price,
      score,
      reason,
      tag,
    });
  }

  // ── Recently Viewed (demo — will be client-side in production) ──
  const recentStocks: RecentStock[] = [];
  // Show first 6 companies that have prices as "recently viewed" demo
  for (const company of (companies || []).slice(0, 8)) {
    const priceData = priceMap.get(company.id);
    if (!priceData) continue;
    const prevClose = priceData.prevClose ?? priceData.close;
    const todayChange = prevClose > 0 ? ((priceData.close - prevClose) / prevClose) * 100 : 0;
    recentStocks.push({
      ticker: company.ticker,
      name: displayName(locale, company.name_en, company.name_ar),
      price: priceData.close,
      change: todayChange,
    });
    if (recentStocks.length >= 6) break;
  }

  // ── Today at a Glance data ──
  const todayData: TodayData = {
    tasiValue: marketData.index_value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    tasiChange: `${marketData.index_change >= 0 ? "+" : ""}${marketData.index_change_percent.toFixed(2)}%`,
    tasiIsPositive: marketData.index_change >= 0,
    isOpen: marketData.isOpen,
    advancing: marketData.advancing,
    declining: marketData.declining,
    unchanged: marketData.unchanged,
    tradedValue: marketData.total_volume > 1e9 ? `${(marketData.total_volume / 1e9).toFixed(1)}B` : `${(marketData.total_volume / 1e6).toFixed(0)}M`,
    portfolioChange: todayGainPct,
    portfolioChangeAmount: todayGainAmount,
    upcomingDividends: (dividendsRes.data || []).filter((d) => {
      const payDate = d.pay_date || d.ex_date;
      if (!payDate) return false;
      return new Date(payDate) >= new Date();
    }).length,
    alertCount,
  };

  // ── Upcoming dividends for count ──
  const upcomingDivCount = (dividendsRes.data || []).filter((d) => {
    const payDate = d.pay_date || d.ex_date;
    if (!payDate) return false;
    return new Date(payDate) >= new Date();
  }).length;

  // ══════════════════════════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════════════════════════

  return (
    <div className="page-wrap">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 fade-up">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "var(--c-gold-dim)", border: "1px solid var(--c-gold-ring)" }}
        >
          <TrendingUp size={16} style={{ color: "var(--c-gold)" }} />
        </div>
        <div>
          <h1
            className="font-bold text-xl"
            style={{ color: "var(--c-text)", fontFamily: "var(--font-grotesk)" }}
          >
            {isAr ? "سوقي" : "My SŪQAI"}
          </h1>
          <p style={{ fontSize: 12, color: "var(--c-muted)" }}>
            {isAr ? "لوحة المتابعة الشخصية" : "Your personal dashboard"}
          </p>
        </div>
      </div>

      {/* Demo Banner */}
      <div className="card-gold fade-up mb-4" style={{ padding: "10px 16px" }}>
        <div className="flex items-center gap-3">
          <Info size={12} style={{ color: "var(--c-gold)" }} />
          <p style={{ fontSize: 10, color: "var(--c-muted)" }}>
            {t(locale, "portfolio.demo_desc")}
          </p>
        </div>
      </div>

      {/* ── Today at a Glance ── */}
      <TodayAtGlance data={todayData} locale={locale} sar={sar} />

      {/* ── Summary Cards ── */}
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

      {/* ── Performance Chart + Sector Allocation ── */}
      <div
        className="dash-grid-2-1"
        style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14, marginBottom: 16 }}
      >
        <PortfolioPerformanceChart data={performanceData} locale={locale} sar={sar} />
        <SectorAllocationChart sectors={sectors} locale={locale} sar={sar} />
      </div>

      {/* ── Holdings Table ── */}
      <div className="mb-4">
        <HoldingsTable holdings={holdings} locale={locale} sar={sar} />
      </div>

      {/* ── Watchlist + Opportunities side by side ── */}
      <div
        className="dash-grid-1-1"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}
      >
        <WatchlistModule stocks={watchlistStocks} locale={locale} sar={sar} />
        <OpportunitiesModule opportunities={opportunities} locale={locale} sar={sar} />
      </div>

      {/* ── Wealth Calculator + Updates Feed side by side ── */}
      <div
        className="dash-grid-1-1"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}
      >
        <WealthCalculator locale={locale} sar={sar} />
        <UpdatesFeed items={feedItems} locale={locale} />
      </div>

      {/* ── Recently Viewed ── */}
      <div className="mb-8">
        <RecentlyViewed stocks={recentStocks} locale={locale} />
      </div>

      {/* Responsive grids */}
      <style>{`
        @media (max-width: 900px) {
          .dash-grid-2-1 { grid-template-columns: 1fr !important; }
          .dash-grid-1-1 { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <hr className="gold-line my-8" />
      <p style={{ fontSize: 11, color: "var(--c-dim)", textAlign: "center", letterSpacing: "0.02em" }}>
        {t(locale, "common.disclaimer")}
      </p>
    </div>
  );
}
