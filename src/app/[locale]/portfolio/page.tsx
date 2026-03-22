import { createServiceClient } from "@/lib/supabase/server";
import { t, tSector } from "@/lib/i18n";
import { calculateScores } from "@/lib/scores";
import { displayName } from "@/lib/display-names";
import { getMarketSummary } from "@/lib/sahm";
import Link from "next/link";
import { Sparkles, Rocket, TrendingUp, TrendingDown, ShieldCheck, AlertTriangle, ArrowUpRight, ArrowDownRight, BarChart3, Briefcase, Coins, Eye, Target, Zap, DollarSign, PieChart, Activity } from "lucide-react";

// ── Dashboard Components (interactive only) ──
import PortfolioPerformanceChart from "@/components/dashboard/PortfolioPerformanceChart";
import WealthCalculator from "@/components/dashboard/WealthCalculator";

// ── Type definitions ──
interface HoldingRow {
  ticker: string; name: string; sector: string; shares: number; avgCost: number;
  currentPrice: number; totalValue: number; gainLoss: number; gainPct: number;
  todayChange: number; weight: number; overallScore: number | null;
  fairValueDiff: number | null; nextDivDate: string | null; nextDivAmount: number | null;
}
interface HealthDimension { key: string; label: { en: string; ar: string }; score: number; signal: "strong" | "healthy" | "mixed" | "weak"; }
interface AttentionItem { priority: number; line: { en: string; ar: string }; action: { en: string; ar: string }; href: string; color: string; }
interface WatchlistStock { ticker: string; name: string; price: number; change: number; score: number | null; signal: string; signalLine: { en: string; ar: string }; divYield: number | null; }
interface Opportunity { ticker: string; name: string; price: number; score: number; matchReason: { en: string; ar: string }; insight: { en: string; ar: string }; tag: string; confidence: string; }

function fmtCurrency(value: number, sar: string): string {
  const abs = Math.abs(value);
  if (abs >= 1e9) return `${sar} ${(value / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sar} ${(value / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sar} ${(value / 1e3).toFixed(1)}K`;
  return `${sar} ${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function scoreColor(s: number): string {
  if (s >= 75) return "var(--c-green)";
  if (s >= 55) return "var(--c-gold)";
  if (s >= 35) return "var(--c-text)";
  return "var(--c-red)";
}

function signalColor(signal: string): string {
  switch (signal) { case "strong": return "var(--c-green)"; case "healthy": return "#4ade80"; case "mixed": return "var(--c-gold)"; case "weak": return "var(--c-red)"; default: return "var(--c-muted)"; }
}

// Demo data (fallback when no real portfolio exists)
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

export default async function MyDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const sar = t(locale, "common.sar");
  const isAr = locale === "ar";
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
      .single()) as { data: { id: string; portfolio_holdings: Array<{ id: string; ticker: string; company_id: string | null; quantity: number; average_cost: number | null }> } | null; error: any };

    if (realPortfolio?.portfolio_holdings && realPortfolio.portfolio_holdings.length > 0) {
      isDemo = false;
      activeHoldingsInput = realPortfolio.portfolio_holdings.map((h) => ({
        ticker: h.ticker,
        shares: Number(h.quantity),
        avgCost: h.average_cost ? Number(h.average_cost) : 0,
      }));
    }
  } catch {
    // Portfolio tables may not exist yet — fall back to demo
  }

  // ══════════════════════════════════════════════════
  //  DATA FETCHING
  // ══════════════════════════════════════════════════

  let mkt = { index_value: 0, index_change: 0, index_change_percent: 0, advancing: 0, declining: 0, unchanged: 0, total_volume: 0, isOpen: false };
  try {
    const s = await getMarketSummary();
    const riyadh = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Riyadh" }));
    const day = riyadh.getDay();
    const min = riyadh.getHours() * 60 + riyadh.getMinutes();
    mkt = { index_value: s.index_value, index_change: s.index_change, index_change_percent: s.index_change_percent, advancing: s.advancing, declining: s.declining, unchanged: s.unchanged, total_volume: s.total_volume, isOpen: day >= 0 && day <= 4 && min >= 600 && min <= 900 };
  } catch {}

  const allTickers = [...new Set([...activeHoldingsInput.map((h) => h.ticker), ...DEMO_WATCHLIST])];
  const { data: companies } = await supabase.from("companies").select("id, ticker, name_en, name_ar, sector").in("ticker", allTickers);
  const companyIds = (companies || []).map((c) => c.id);
  const tickerToCompany = new Map((companies || []).map((c) => [c.ticker, c]));

  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const oneYearStr = oneYearAgo.toISOString().slice(0, 10);

  const [pricesRes, financialsRes, dividendsRes, historyRes, newsRes, opportunitiesRes] = await Promise.all([
    supabase.from("stock_prices").select("company_id, close, date").in("company_id", companyIds).order("date", { ascending: false }).limit(companyIds.length * 2),
    supabase.from("financials").select("company_id, earnings_per_share, revenue, net_income, debt_to_equity, current_ratio, operating_cash_flow, free_cash_flow, book_value_per_share").in("company_id", companyIds).order("year", { ascending: false }).limit(companyIds.length),
    supabase.from("dividends").select("company_id, amount_per_share, pay_date, ex_date").in("company_id", companyIds).order("pay_date", { ascending: false }).limit(companyIds.length * 4),
    supabase.from("stock_prices").select("company_id, close, date").in("company_id", companyIds).gte("date", oneYearStr).order("date", { ascending: true }),
    supabase.from("news").select("company_id, title_en, title_ar, published_at, source_url").in("company_id", companyIds).order("published_at", { ascending: false }).limit(20),
    supabase.from("company_metrics_daily" as any).select("company_id, suqai_score, pe_ratio, roe, dividend_yield, revenue_growth_yoy").not("suqai_score", "is", null).order("suqai_score", { ascending: false }).limit(30) as unknown as Promise<{ data: Array<{ company_id: string; suqai_score: number; pe_ratio: number | null; roe: number | null; dividend_yield: number | null; revenue_growth_yoy: number | null }> | null; error: any }>,
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

  function computeScorePillars(companyId: string, currentPrice: number, todayChange: number) {
    const fin = finMap.get(companyId);
    const hl = highLowMap.get(companyId);
    const div = divMap.get(companyId);
    const eps = fin?.earnings_per_share ? Number(fin.earnings_per_share) : null;
    const pe = eps && eps > 0 ? currentPrice / eps : null;
    const divYield = div && div.annualEst > 0 ? (div.annualEst / currentPrice) * 100 : 0;
    const rev = fin?.revenue ? Number(fin.revenue) : null;
    const ni = fin?.net_income ? Number(fin.net_income) : null;
    try {
      return calculateScores({ pe: pe ?? null, eps: eps ?? null, divYield, revenue: rev ?? null, netIncome: ni ?? null, changePct: todayChange, currentPrice, fiftyTwoHigh: hl?.high ?? currentPrice, fiftyTwoLow: hl?.low ?? currentPrice, debtToEquity: fin?.debt_to_equity ? Number(fin.debt_to_equity) : null, roe: null });
    } catch { return null; }
  }
  function computeScore(companyId: string, currentPrice: number, todayChange: number): number | null {
    const p = computeScorePillars(companyId, currentPrice, todayChange);
    return p ? ((p.value + p.growth + p.dividend + p.health + p.momentum) / 25) * 100 : null;
  }

  // ══════════════════════════════════════════════════
  //  BUILD HOLDINGS
  // ══════════════════════════════════════════════════

  const holdings: HoldingRow[] = [];
  for (const h of activeHoldingsInput) {
    const company = tickerToCompany.get(h.ticker);
    if (!company) continue;
    const priceData = priceMap.get(company.id);
    // Use live price if available; fall back to avgCost only if > 0; otherwise 0 (honest display)
    const currentPrice = priceData?.close ?? (h.avgCost > 0 ? h.avgCost : 0);
    const prevClose = priceData?.prevClose ?? currentPrice;
    const totalCost = h.avgCost > 0 ? h.shares * h.avgCost : 0;
    const totalValue = h.shares * currentPrice;
    const gainLoss = totalValue - totalCost;
    const gainPct = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;
    const todayChange = prevClose > 0 ? ((currentPrice - prevClose) / prevClose) * 100 : 0;
    const overallScore = computeScore(company.id, currentPrice, todayChange);
    const fin = finMap.get(company.id);
    const eps = fin?.earnings_per_share ? Number(fin.earnings_per_share) : null;
    const pe = eps && eps > 0 ? currentPrice / eps : null;
    let fairValueDiff: number | null = null;
    if (pe && pe > 0) fairValueDiff = ((eps! * SECTOR_AVG_PE - currentPrice) / currentPrice) * 100;
    const div = divMap.get(company.id);
    holdings.push({
      ticker: h.ticker, name: displayName(locale, company.name_en, company.name_ar),
      sector: company.sector || "Other", shares: h.shares, avgCost: h.avgCost, currentPrice,
      totalValue, gainLoss, gainPct, todayChange, weight: 0, overallScore, fairValueDiff,
      nextDivDate: div?.nextDate ?? null, nextDivAmount: div?.nextAmount ?? null,
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
  const alertCount = holdings.filter((h) => Math.abs(h.todayChange) > 3 || (h.overallScore !== null && h.overallScore <= 30)).length;
  const weightedScore = holdings.reduce((s, h) => s + (h.overallScore ?? 0) * h.weight / 100, 0);

  // ══════════════════════════════════════════════════
  //  SECTOR ALLOCATION
  // ══════════════════════════════════════════════════

  const sectorBuckets = new Map<string, { value: number; count: number; change: number }>();
  for (const h of holdings) {
    const ex = sectorBuckets.get(h.sector);
    if (!ex) sectorBuckets.set(h.sector, { value: h.totalValue, count: 1, change: h.todayChange });
    else { ex.value += h.totalValue; ex.count++; ex.change = (ex.change * (ex.count - 1) + h.todayChange) / ex.count; }
  }
  const sectors = [...sectorBuckets.entries()].map(([sector, d]) => ({
    sector, sectorAr: tSector("ar", sector), value: d.value,
    weight: totalValue > 0 ? (d.value / totalValue) * 100 : 0, count: d.count, change: d.change,
  })).sort((a, b) => b.weight - a.weight);

  // ══════════════════════════════════════════════════
  //  PORTFOLIO HEALTH ENGINE
  // ══════════════════════════════════════════════════

  const qualityScore = weightedScore;
  const incomeScore = Math.min(100, weightedDivYield * 18);
  const hhi = holdings.reduce((s, h) => s + Math.pow(h.weight / 100, 2), 0);
  const diversificationScore = Math.min(100, (1 - hhi) * 130);
  const momentumAvg = holdings.reduce((s, h) => s + (h.todayChange > 0 ? 70 : h.todayChange > -2 ? 50 : 25), 0) / Math.max(holdings.length, 1);
  const deRatios = holdings.map((h) => { const fin = finMap.get(tickerToCompany.get(h.ticker)?.id || ""); return fin?.debt_to_equity ? Number(fin.debt_to_equity) : null; }).filter((v): v is number => v !== null);
  const avgDE = deRatios.length > 0 ? deRatios.reduce((s, v) => s + v, 0) / deRatios.length : 0.5;
  const balanceScore = Math.max(0, Math.min(100, 100 - avgDE * 40));
  const maxWeight = holdings.length > 0 ? Math.max(...holdings.map((h) => h.weight)) : 0;
  const concentrationScore = Math.max(0, Math.min(100, 100 - maxWeight * 1.5));

  function dimSignal(score: number): "strong" | "healthy" | "mixed" | "weak" {
    if (score >= 70) return "strong";
    if (score >= 50) return "healthy";
    if (score >= 30) return "mixed";
    return "weak";
  }

  const dimensions: HealthDimension[] = [
    { key: "quality", label: { en: "Quality", ar: "الجودة" }, score: qualityScore, signal: dimSignal(qualityScore) },
    { key: "income", label: { en: "Income", ar: "الدخل" }, score: incomeScore, signal: dimSignal(incomeScore) },
    { key: "diversification", label: { en: "Diversification", ar: "التنويع" }, score: diversificationScore, signal: dimSignal(diversificationScore) },
    { key: "momentum", label: { en: "Momentum", ar: "الزخم" }, score: momentumAvg, signal: dimSignal(momentumAvg) },
    { key: "balance", label: { en: "Balance sheet", ar: "الميزانية" }, score: balanceScore, signal: dimSignal(balanceScore) },
    { key: "concentration", label: { en: "Concentration", ar: "التركيز" }, score: concentrationScore, signal: dimSignal(concentrationScore) },
  ];

  const overallHealthScore = dimensions.reduce((s, d) => s + d.score, 0) / dimensions.length;
  const healthLabel = overallHealthScore >= 70 ? { en: "Strong", ar: "قوي" } : overallHealthScore >= 55 ? { en: "Healthy", ar: "صحي" } : overallHealthScore >= 35 ? { en: "Mixed", ar: "مختلط" } : { en: "Watch closely", ar: "يحتاج متابعة" };
  const healthColor = overallHealthScore >= 70 ? "var(--c-green)" : overallHealthScore >= 55 ? "#4ade80" : overallHealthScore >= 35 ? "var(--c-gold)" : "var(--c-red)";

  // Strengths & watchouts
  const strengths: Array<{ en: string; ar: string }> = [];
  const watchouts: Array<{ en: string; ar: string }> = [];
  if (qualityScore >= 60) strengths.push({ en: "Average quality across holdings is above market average", ar: "متوسط جودة المقتنيات أعلى من متوسط السوق" });
  if (incomeScore >= 50) strengths.push({ en: "Dividend profile is meaningful and supported by established payers", ar: "ملف التوزيعات جيد ومدعوم من شركات مستقرة" });
  if (balanceScore >= 60) strengths.push({ en: "Most holdings rank well on profitability", ar: "معظم المقتنيات تحقق ربحية جيدة" });
  if (diversificationScore >= 60) strengths.push({ en: "Sector diversification is reasonable", ar: "التنويع القطاعي معقول" });
  if (strengths.length === 0) strengths.push({ en: "Portfolio has reasonable basic structure", ar: "المحفظة تملك هيكلًا أساسيًا معقولًا" });

  const topSector = sectors[0];
  if (topSector && topSector.weight > 40) watchouts.push({ en: `${topSector.sector} represents ${topSector.weight.toFixed(0)}% of your portfolio`, ar: `قطاع ${tSector("ar", topSector.sector)} يمثل ${topSector.weight.toFixed(0)}% من محفظتك` });
  if (maxWeight > 25) { const topH = [...holdings].sort((a, b) => b.weight - a.weight)[0]; watchouts.push({ en: `Your top holding (${topH.ticker}) accounts for ${maxWeight.toFixed(0)}% of total value`, ar: `أكبر مقتنياتك (${topH.ticker}) تمثل ${maxWeight.toFixed(0)}% من إجمالي القيمة` }); }
  const weakMomentum = holdings.filter((h) => h.todayChange < -2);
  if (weakMomentum.length > 0) watchouts.push({ en: `${weakMomentum.length} holding${weakMomentum.length > 1 ? "s" : ""} show${weakMomentum.length === 1 ? "s" : ""} weakening momentum`, ar: `${weakMomentum.length} ${weakMomentum.length > 1 ? "أسهم تظهر" : "سهم يظهر"} زخمًا ضعيفًا` });
  if (watchouts.length === 0) watchouts.push({ en: "No major concerns detected right now", ar: "لا مخاوف كبيرة مكتشفة حاليًا" });

  // Benchmark
  const benchmarkReturn = totalGainPct;
  const tasiReturn = mkt.index_change_percent;
  const benchmarkVerdict = benchmarkReturn > tasiReturn + 1
    ? { en: "Your portfolio is ahead of the market this year", ar: "محفظتك متقدمة على السوق هذا العام" }
    : benchmarkReturn < tasiReturn - 1
      ? { en: "Your portfolio is trailing the market this year", ar: "محفظتك متأخرة عن السوق هذا العام" }
      : { en: "Your portfolio is roughly in line with the market", ar: "محفظتك تتحرك بما يقارب أداء السوق" };

  // ══════════════════════════════════════════════════
  //  BRAIN-MODE: Top Strength, Top Issue, Next Action
  // ══════════════════════════════════════════════════

  const topStrength = strengths[0] || null;

  // Determine top issue (most impactful watchout)
  let topIssue: { en: string; ar: string } | undefined;
  if (maxWeight > 40) {
    const topH = [...holdings].sort((a, b) => b.weight - a.weight)[0];
    topIssue = { en: `Concentration risk: ${topH.ticker} is ${maxWeight.toFixed(0)}% of your portfolio`, ar: `مخاطر التركيز: ${topH.ticker} يمثل ${maxWeight.toFixed(0)}% من محفظتك` };
  } else if (topSector && topSector.weight > 50) {
    topIssue = { en: `${topSector.sector} exposure is ${topSector.weight.toFixed(0)}% — consider diversifying`, ar: `التعرض لقطاع ${tSector("ar", topSector.sector)} ${topSector.weight.toFixed(0)}% — فكّر بالتنويع` };
  } else if (weakMomentum.length > 0) {
    topIssue = { en: `${weakMomentum[0].name} has weakening momentum — worth reviewing`, ar: `${weakMomentum[0].name} يظهر زخمًا ضعيفًا — يستحق المراجعة` };
  }

  // Determine next action
  let nextAction: { en: string; ar: string; href: string } | undefined;
  const weakestHolding = [...holdings].sort((a, b) => (a.overallScore ?? 0) - (b.overallScore ?? 0))[0];
  if (maxWeight > 40) {
    const topH = [...holdings].sort((a, b) => b.weight - a.weight)[0];
    nextAction = { en: `Review your top holding concentration`, ar: `راجع تركيز أكبر مقتنياتك`, href: `/${locale}/stock/${topH.ticker}` };
  } else if (weakestHolding && weakestHolding.overallScore !== null && weakestHolding.overallScore < 40) {
    nextAction = { en: `Review ${weakestHolding.ticker} — weakest quality score`, ar: `راجع ${weakestHolding.ticker} — أقل تقييم جودة`, href: `/${locale}/stock/${weakestHolding.ticker}` };
  }

  // ══════════════════════════════════════════════════
  //  HERO SUMMARY LINE (more decisive)
  // ══════════════════════════════════════════════════

  let summaryLine = { en: "Here\u2019s what matters in your investing world today.", ar: "إليك ما يهمّك في عالمك الاستثماري اليوم." };
  if (topIssue) {
    // Single decisive sentence combining health + issue
    summaryLine = {
      en: `Your portfolio is ${healthLabel.en.toLowerCase()} today: quality is solid, but ${topIssue.en.toLowerCase().replace(/^concentration risk: /, "").replace(/^./, (c) => c.toLowerCase())}`,
      ar: `محفظتك ${healthLabel.ar} اليوم: الجودة جيدة، لكن ${topIssue.ar.replace(/^مخاطر التركيز: /, "")}`,
    };
  } else if (alertCount > 0) {
    summaryLine = { en: `Your portfolio is ${healthLabel.en.toLowerCase()}, but ${alertCount} holding${alertCount > 1 ? "s" : ""} need${alertCount === 1 ? "s" : ""} attention.`, ar: `محفظتك ${healthLabel.ar}، لكن ${alertCount} ${alertCount > 1 ? "أسهم تحتاج" : "سهم يحتاج"} مراجعة.` };
  } else if (incomeScore >= 50 && momentumAvg < 50) {
    summaryLine = { en: "Income is strong, though momentum is mixed across your holdings.", ar: "الدخل قوي، رغم أن الزخم مختلط بين مقتنياتك." };
  }

  // Hero CTAs (context-aware)
  let primaryCta = { label: { en: "Review risks", ar: "راجع المخاطر" }, href: `/${locale}/portfolio#health` };
  let secondaryCta = { label: { en: "Explore matches", ar: "استكشف الفرص" }, href: `/${locale}/screener` };
  if (maxWeight > 40) {
    const topH = [...holdings].sort((a, b) => b.weight - a.weight)[0];
    primaryCta = { label: { en: "Review concentration", ar: "راجع التركيز" }, href: `/${locale}/stock/${topH.ticker}` };
  } else if (weakMomentum.length > 0) {
    primaryCta = { label: { en: `Review ${weakMomentum[0].ticker}`, ar: `راجع ${weakMomentum[0].ticker}` }, href: `/${locale}/stock/${weakMomentum[0].ticker}` };
  }

  // ══════════════════════════════════════════════════
  //  ATTENTION MODULE (prioritized action list)
  // ══════════════════════════════════════════════════

  const attentionItems: AttentionItem[] = [];

  // 1. Weakest holding by score
  if (weakestHolding && weakestHolding.overallScore !== null && weakestHolding.overallScore < 45) {
    attentionItems.push({
      priority: 1,
      line: { en: `Review ${weakestHolding.name}: weakest quality score in portfolio (${Math.round(weakestHolding.overallScore)})`, ar: `راجع ${weakestHolding.name}: أقل تقييم جودة في المحفظة (${Math.round(weakestHolding.overallScore)})` },
      action: { en: "Review holding", ar: "راجع السهم" },
      href: `/${locale}/stock/${weakestHolding.ticker}`,
      color: "var(--c-red)",
    });
  }

  // 2. Concentration risk
  if (maxWeight > 30) {
    const topH = [...holdings].sort((a, b) => b.weight - a.weight)[0];
    attentionItems.push({
      priority: 2,
      line: { en: `Review concentration: ${topH.ticker} is ${maxWeight.toFixed(0)}% of portfolio value`, ar: `راجع التركيز: ${topH.ticker} يمثل ${maxWeight.toFixed(0)}% من قيمة المحفظة` },
      action: { en: "View position", ar: "عرض المركز" },
      href: `/${locale}/stock/${topH.ticker}`,
      color: "var(--c-gold)",
    });
  }

  // 3. New opportunity matches
  // (will be populated after opportunities are built)

  // 4. Dividend idea from watchlist
  const highYieldWL = DEMO_WATCHLIST.map((t) => {
    const c = tickerToCompany.get(t);
    if (!c) return null;
    const d = divMap.get(c.id);
    const p = priceMap.get(c.id);
    if (!d || !p || d.annualEst <= 0) return null;
    const y = (d.annualEst / p.close) * 100;
    return y > 3 ? { ticker: t, name: displayName(locale, c.name_en, c.name_ar), yield: y } : null;
  }).filter(Boolean) as Array<{ ticker: string; name: string; yield: number }>;

  if (highYieldWL.length > 0) {
    const best = highYieldWL.sort((a, b) => b.yield - a.yield)[0];
    attentionItems.push({
      priority: 4,
      line: { en: `Dividend idea: ${best.name} offers ${best.yield.toFixed(1)}% yield`, ar: `فرصة توزيعات: ${best.name} يقدم عائد ${best.yield.toFixed(1)}%` },
      action: { en: "View stock", ar: "عرض السهم" },
      href: `/${locale}/stock/${best.ticker}`,
      color: "#a78bfa",
    });
  }

  // ══════════════════════════════════════════════════
  //  WATCHLIST
  // ══════════════════════════════════════════════════

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
    let signalLine = { en: "Neutral signal", ar: "إشارة محايدة" };
    if (score !== null && score >= 75) { signal = "strong"; signalLine = { en: "Profitability remains strong", ar: "الربحية لا تزال قوية" }; }
    else if (score !== null && score >= 60) { signal = "positive"; const dv = divMap.get(company.id); if (dv && dv.annualEst > 0) signalLine = { en: "Yield looks attractive", ar: "العائد يبدو جاذبًا" }; else signalLine = { en: "Balance sheet is stable", ar: "الميزانية مستقرة" }; }
    else if (score !== null && score >= 40) { signal = "neutral"; signalLine = { en: "Valuation looks fair", ar: "التقييم يبدو عادلًا" }; }
    else if (score !== null && score >= 25) { signal = "caution"; signalLine = { en: "Momentum weakened", ar: "الزخم تراجع" }; }
    else { signal = "negative"; signalLine = { en: "Valuation looks stretched", ar: "التقييم يبدو مرتفعًا" }; }

    const div = divMap.get(company.id);
    watchlistStocks.push({ ticker, name: displayName(locale, company.name_en, company.name_ar), price: priceData.close, change: todayChange, score, signal, signalLine, divYield: div && div.annualEst > 0 ? (div.annualEst / priceData.close) * 100 : null });
  }

  // Watchlist contract activity
  let wlContractCount = 0;
  try {
    const wlCompanyIds = DEMO_WATCHLIST.map((t) => tickerToCompany.get(t)?.id).filter(Boolean) as string[];
    if (wlCompanyIds.length > 0) {
      const thirtyDaysAgo2 = new Date();
      thirtyDaysAgo2.setDate(thirtyDaysAgo2.getDate() - 30);
      const { count } = await (supabase as any)
        .from("company_contracts")
        .select("id", { count: "exact", head: true })
        .in("company_id", wlCompanyIds)
        .gte("announcement_date", thirtyDaysAgo2.toISOString().slice(0, 10)) as unknown as { count: number | null; error: any };
      wlContractCount = count ?? 0;
    }
  } catch {
    // Contract table may not exist yet
  }

  const wlInsights: Array<{ line: { en: string; ar: string }; color: string }> = [];
  if (wlContractCount > 0) wlInsights.push({ line: { en: `${wlContractCount} new contract${wlContractCount > 1 ? "s" : ""} announced by watchlist companies`, ar: `${wlContractCount} ${wlContractCount > 1 ? "عقود جديدة" : "عقد جديد"} من شركات قائمة المتابعة` }, color: "var(--c-green)" });
  const highScoreWL = watchlistStocks.filter((s) => s.score !== null && s.score >= 70);
  if (highScoreWL.length > 0) wlInsights.push({ line: { en: `${highScoreWL.length} stock${highScoreWL.length > 1 ? "s" : ""} in your watchlist rank${highScoreWL.length === 1 ? "s" : ""} highly on quality`, ar: `${highScoreWL.length} ${highScoreWL.length > 1 ? "أسهم" : "سهم"} في قائمتك ${highScoreWL.length > 1 ? "تحقق" : "يحقق"} جودة عالية` }, color: "var(--c-green)" });
  const weakWL = watchlistStocks.filter((s) => s.change < -2);
  if (weakWL.length > 0) wlInsights.push({ line: { en: `${weakWL.length} name${weakWL.length > 1 ? "s" : ""} dropped today — worth checking`, ar: `${weakWL.length} ${weakWL.length > 1 ? "أسهم انخفضت" : "سهم انخفض"} اليوم — يستحق المراجعة` }, color: "var(--c-red)" });
  const divWL = watchlistStocks.filter((s) => s.divYield !== null && s.divYield > 3);
  if (divWL.length > 0) wlInsights.push({ line: { en: `${divWL.length} stock${divWL.length > 1 ? "s" : ""} offer${divWL.length === 1 ? "s" : ""} attractive dividend yield`, ar: `${divWL.length} ${divWL.length > 1 ? "أسهم تقدم" : "سهم يقدم"} عائد توزيعات جاذب` }, color: "var(--c-gold)" });
  if (wlInsights.length === 0) wlInsights.push({ line: { en: "No notable changes in your watchlist today", ar: "لا تغييرات ملحوظة في قائمتك اليوم" }, color: "var(--c-dim)" });

  // ══════════════════════════════════════════════════
  //  OPPORTUNITIES
  // ══════════════════════════════════════════════════

  const holdingTickers = new Set(activeHoldingsInput.map((h) => h.ticker));
  const opportunities: Opportunity[] = [];
  const oppCandidateIds = (opportunitiesRes.data || []).map((r) => r.company_id).filter(Boolean);
  let oppCompanies: Array<{ id: string; ticker: string; name_en: string; name_ar: string; sector: string }> = [];
  if (oppCandidateIds.length > 0) { const { data: oc } = await supabase.from("companies").select("id, ticker, name_en, name_ar, sector").in("id", oppCandidateIds); oppCompanies = oc || []; }
  const oppCompanyMap = new Map(oppCompanies.map((c) => [c.id, c]));
  const oppIds = oppCompanies.map((c) => c.id).filter((id) => !companyIds.includes(id));
  const oppPriceMap = new Map<string, number>();
  if (oppIds.length > 0) { const { data: op } = await supabase.from("stock_prices").select("company_id, close").in("company_id", oppIds).order("date", { ascending: false }).limit(oppIds.length); const seenO = new Set<string>(); for (const p of op || []) { if (!seenO.has(p.company_id)) { oppPriceMap.set(p.company_id, Number(p.close)); seenO.add(p.company_id); } } }

  for (const row of opportunitiesRes.data || []) {
    if (opportunities.length >= 4) break;
    const comp = oppCompanyMap.get(row.company_id);
    if (!comp || holdingTickers.has(comp.ticker)) continue;
    const price = priceMap.get(comp.id)?.close ?? oppPriceMap.get(comp.id) ?? 0;
    if (price === 0) continue;
    const score = Number(row.suqai_score);
    if (score < 60) continue;
    const pe = row.pe_ratio ? Number(row.pe_ratio) : null;
    const dy = row.dividend_yield ? Number(row.dividend_yield) : null;
    const revG = row.revenue_growth_yoy ? Number(row.revenue_growth_yoy) : null;

    // Trust-first labeling
    let tag: Opportunity["tag"] = "high_quality";
    let matchReason = { en: "Ranks highly on profitability and fundamentals", ar: "يحقق ربحية عالية وأساسيات قوية" };
    let insight = { en: `SUQAI Score ${Math.round(score)} — strong fundamentals across multiple dimensions`, ar: `تقييم SUQAI ${Math.round(score)} — أساسيات قوية عبر أبعاد متعددة` };
    let confidence: Opportunity["confidence"] = "medium";

    if (pe !== null && pe > 0 && pe < 15) {
      tag = "undervalued";
      matchReason = { en: "Reasonable valuation vs peers on trailing earnings", ar: "تقييم معقول مقارنة بالنظراء على الأرباح التاريخية" };
      insight = { en: `P/E ${pe.toFixed(1)} — valuation looks more reasonable than several high-quality peers`, ar: `مكرر الأرباح ${pe.toFixed(1)} — التقييم يبدو أكثر معقولية من نظرائه` };
      confidence = "high";
    } else if (dy !== null && dy > 0.04) {
      tag = "dividend_leader";
      matchReason = { en: "Matches your income + safety preference", ar: "يتوافق مع تفضيلك للدخل والأمان" };
      insight = { en: `Dividend looks attractive without unusually high payout pressure`, ar: `التوزيعات تبدو جاذبة دون ضغط غير عادي على نسبة التوزيع` };
      confidence = "high";
    } else if (revG !== null && revG > 0.15) {
      tag = "momentum";
      matchReason = { en: "Quality with improving momentum", ar: "جودة مع تحسن في الزخم" };
      insight = { en: `Revenue growing ${(revG * 100).toFixed(0)}% YoY with strengthening profitability`, ar: `الإيرادات تنمو ${(revG * 100).toFixed(0)}% سنويًا مع تعزز الربحية` };
      confidence = "medium";
    }

    opportunities.push({ ticker: comp.ticker, name: displayName(locale, comp.name_en, comp.name_ar), price, score, matchReason, insight, tag, confidence });
  }

  // Add opportunity attention item (after opportunities are built)
  if (opportunities.length > 0) {
    attentionItems.push({
      priority: 3,
      line: { en: `New match: ${opportunities.length} quality idea${opportunities.length > 1 ? "s" : ""} fit${opportunities.length === 1 ? "s" : ""} your saved style`, ar: `تطابق جديد: ${opportunities.length} ${opportunities.length > 1 ? "أفكار" : "فكرة"} تناسب أسلوبك المحفوظ` },
      action: { en: "View ideas", ar: "عرض الأفكار" },
      href: `/${locale}/portfolio#opportunities`,
      color: "var(--c-gold)",
    });
  }

  // Sort attention items by priority
  attentionItems.sort((a, b) => a.priority - b.priority);

  // ══════════════════════════════════════════════════
  //  CONTRACT ALERTS FOR HOLDINGS
  // ══════════════════════════════════════════════════

  const contractAlerts: Array<{ ticker: string; companyName: string; disclosureType: string; disclosureLabelEn: string; disclosureLabelAr: string; value: number | null; currency: string; counterparty: string | null; materialityLabel: string; announcementDate: string; daysAgo: number; interpretation: { en: string; ar: string } }> = [];
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysStr = thirtyDaysAgo.toISOString().slice(0, 10);
    const holdingCompanyIds = activeHoldingsInput.map((h) => tickerToCompany.get(h.ticker)?.id).filter(Boolean) as string[];

    if (holdingCompanyIds.length > 0) {
      const { data: recentContracts } = await (supabase as any)
        .from("company_contracts")
        .select("ticker, disclosure_type, contract_value, currency, counterparty, materiality_label, announcement_date, what_happened_en, what_happened_ar, value_disclosed")
        .in("company_id", holdingCompanyIds)
        .gte("announcement_date", thirtyDaysStr)
        .order("announcement_date", { ascending: false })
        .limit(5) as unknown as { data: Array<{
          ticker: string; disclosure_type: string; contract_value: number | null;
          currency: string; counterparty: string | null; materiality_label: string;
          announcement_date: string; what_happened_en: string | null; what_happened_ar: string | null;
          value_disclosed: boolean;
        }> | null; error: any };

      const discLabelEn: Record<string, string> = {
        contract_award: "New award", signed_contract: "Signed", extension: "Extension",
        renewal: "Renewal", framework_agreement: "Framework", mou: "MOU",
        supply_agreement: "Supply", service_agreement: "Service", project_execution: "Project",
      };
      const discLabelAr: Record<string, string> = {
        contract_award: "عقد جديد", signed_contract: "توقيع", extension: "تمديد",
        renewal: "تجديد", framework_agreement: "إطاري", mou: "مذكرة تفاهم",
        supply_agreement: "توريد", service_agreement: "خدمات", project_execution: "تنفيذ مشروع",
      };

      for (const c of recentContracts || []) {
        const company = tickerToCompany.get(c.ticker);
        if (!company) continue;
        const daysAgo = Math.floor((Date.now() - new Date(c.announcement_date).getTime()) / 86400000);
        contractAlerts.push({
          ticker: c.ticker,
          companyName: displayName(locale, company.name_en, company.name_ar),
          disclosureType: c.disclosure_type,
          disclosureLabelEn: discLabelEn[c.disclosure_type] || "Contract",
          disclosureLabelAr: discLabelAr[c.disclosure_type] || "عقد",
          value: c.value_disclosed && c.contract_value ? Number(c.contract_value) : null,
          currency: c.currency || "SAR",
          counterparty: c.counterparty,
          materialityLabel: c.materiality_label || "unknown",
          announcementDate: c.announcement_date,
          daysAgo,
          interpretation: {
            en: c.what_happened_en || `${displayName("en", company.name_en, company.name_ar)} announced a new ${discLabelEn[c.disclosure_type]?.toLowerCase() || "contract"}.`,
            ar: c.what_happened_ar || `أعلنت ${displayName("ar", company.name_en, company.name_ar)} عن ${discLabelAr[c.disclosure_type] || "عقد"} جديد.`,
          },
        });
      }
    }
  } catch {
    // Contract table may not exist yet — graceful degradation
  }

  // Add contract alert to attention module if we have any
  if (contractAlerts.length > 0) {
    const topContract = contractAlerts[0];
    attentionItems.push({
      priority: 1.5, // High priority — between weakest holding and concentration
      line: {
        en: `New contract: ${topContract.companyName} announced a ${topContract.disclosureLabelEn.toLowerCase()}${topContract.value ? ` worth ${topContract.currency} ${topContract.value >= 1e6 ? (topContract.value / 1e6).toFixed(0) + "M" : topContract.value.toLocaleString()}` : ""}`,
        ar: `عقد جديد: أعلنت ${topContract.companyName} عن ${topContract.disclosureLabelAr}${topContract.value ? ` بقيمة ${topContract.currency} ${topContract.value >= 1e6 ? (topContract.value / 1e6).toFixed(0) + "M" : topContract.value.toLocaleString()}` : ""}`,
      },
      action: { en: "View contract", ar: "عرض العقد" },
      href: `/${locale}/stock/${topContract.ticker}`,
      color: "var(--c-green)",
    });
    // Re-sort attention items
    attentionItems.sort((a, b) => a.priority - b.priority);
  }

  // ══════════════════════════════════════════════════
  //  PERFORMANCE CHART
  // ══════════════════════════════════════════════════

  const dateMap = new Map<string, { portfolio: number }>();
  for (const p of historyRes.data || []) {
    const holding = activeHoldingsInput.find((h) => tickerToCompany.get(h.ticker)?.id === p.company_id);
    if (!holding) continue;
    const val = Number(p.close) * holding.shares;
    const ex = dateMap.get(p.date);
    if (!ex) dateMap.set(p.date, { portfolio: val });
    else ex.portfolio += val;
  }
  const performanceData = [...dateMap.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, d]) => ({ date, portfolio: d.portfolio }));

  // ══════════════════════════════════════════════════
  //  DERIVED DATA
  // ══════════════════════════════════════════════════

  const biggestMover = holdings.length > 0 ? holdings.reduce((best, h) => Math.abs(h.todayChange) > Math.abs(best.todayChange) ? h : best) : null;
  const sortedHoldings = [...holdings].sort((a, b) => b.totalValue - a.totalValue);
  const topHolding = sortedHoldings[0] || null;

  // Sector colors for diversity ring
  const sectorColors: Record<string, string> = {
    "Banks": "#c8a951", "Materials": "#60a5fa", "Telecommunication Services": "#a78bfa",
    "Retailing": "#34d399", "Energy": "#f87171", "Food & Beverages": "#fbbf24",
    "Insurance": "#818cf8", "Health Care Equipment & Svc": "#f472b6", "Real Estate Mgmt & Dev't": "#22d3ee",
    "Utilities": "#94a3b8", "Capital Goods": "#fb923c", "Other": "#64748b",
  };
  function getSectorColor(sector: string): string { return sectorColors[sector] || "#64748b"; }

  // ══════════════════════════════════════════════════
  //  RENDER — Premium Wallet Design
  // ══════════════════════════════════════════════════

  const up = todayGainPct >= 0;
  const totalUp = totalGainPct >= 0;

  return (
    <div className="page-wrap">
      {/* ── DEMO BANNER ── */}
      {isDemo && (
        <div style={{ padding: "14px 20px", borderRadius: 12, background: "linear-gradient(135deg, rgba(200,169,81,0.08), rgba(6,13,24,0.85))", border: "1px solid var(--c-gold-ring)", marginBottom: 16, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <Sparkles size={14} style={{ color: "var(--c-gold)" }} />
          <span style={{ fontSize: 11, color: "var(--c-muted)", flex: 1 }}>
            {isAr ? "محفظة تجريبية — أنشئ محفظتك الخاصة لتتبع استثماراتك" : "Sample portfolio — create yours to track your investments"}
          </span>
          <Link href={`/${locale}/portfolio/create`} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 16px", borderRadius: 8, background: "var(--c-gold)", color: "var(--c-base)", fontSize: 10, fontWeight: 700, textDecoration: "none", fontFamily: "var(--font-grotesk)" }}>
            <Rocket size={10} /> {isAr ? "أنشئ محفظتي" : "Create portfolio"}
          </Link>
        </div>
      )}

      {/* ════════════════════════════════════════════════
          HERO: Portfolio Value + Key Metrics
         ════════════════════════════════════════════════ */}
      <div style={{ padding: "32px 28px 28px", borderRadius: 16, background: "linear-gradient(160deg, rgba(200,169,81,0.08) 0%, rgba(6,13,24,0.95) 40%, rgba(6,13,24,0.98) 100%)", border: "1px solid var(--c-gold-ring)", marginBottom: 20, position: "relative", overflow: "hidden" }}>
        {/* Ambient glow */}
        <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(200,169,81,0.12), transparent 70%)", pointerEvents: "none" }} />

        <div style={{ display: "flex", gap: 32, flexWrap: "wrap", position: "relative", zIndex: 1 }}>
          {/* Left: Value */}
          <div style={{ flex: "1 1 320px" }}>
            <p style={{ fontSize: 11, color: "var(--c-muted)", marginBottom: 4, fontFamily: "var(--font-grotesk)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              {isAr ? "قيمة المحفظة" : "Portfolio Value"}
            </p>
            <p style={{ fontSize: 36, fontWeight: 800, color: "var(--c-text)", fontFamily: "var(--font-grotesk)", lineHeight: 1, marginBottom: 10 }}>
              {fmtCurrency(totalValue, sar)}
            </p>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 10, color: "var(--c-dim)" }}>{isAr ? "اليوم" : "Today"}</span>
                <p style={{ fontSize: 16, fontWeight: 700, color: up ? "var(--c-green)" : "var(--c-red)", margin: 0, display: "flex", alignItems: "center", gap: 3 }}>
                  {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                  {up ? "+" : ""}{todayGainPct.toFixed(2)}%
                  <span style={{ fontSize: 11, fontWeight: 400, color: "var(--c-muted)", marginInlineStart: 4 }}>{up ? "+" : ""}{fmtCurrency(todayGainAmount, sar)}</span>
                </p>
              </div>
              <div>
                <span style={{ fontSize: 10, color: "var(--c-dim)" }}>{isAr ? "إجمالي العائد" : "Total Return"}</span>
                <p style={{ fontSize: 16, fontWeight: 700, color: totalUp ? "var(--c-green)" : "var(--c-red)", margin: 0 }}>
                  {totalUp ? "+" : ""}{totalGainPct.toFixed(1)}%
                  <span style={{ fontSize: 11, fontWeight: 400, color: "var(--c-muted)", marginInlineStart: 4 }}>{totalUp ? "+" : ""}{fmtCurrency(totalGain, sar)}</span>
                </p>
              </div>
            </div>

            {/* Summary line */}
            <p style={{ fontSize: 12, color: "var(--c-muted)", lineHeight: 1.6, maxWidth: 400 }}>
              {isAr ? summaryLine.ar : summaryLine.en}
            </p>
          </div>

          {/* Right: Quick stats grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, minWidth: 220 }}>
            {[
              { icon: <Briefcase size={12} />, label: isAr ? "المقتنيات" : "Holdings", value: `${holdings.length}`, color: "var(--c-gold)" },
              { icon: <ShieldCheck size={12} />, label: isAr ? "الصحة" : "Health", value: isAr ? healthLabel.ar : healthLabel.en, color: healthColor },
              { icon: <Coins size={12} />, label: isAr ? "عائد التوزيعات" : "Div. Yield", value: `${weightedDivYield.toFixed(1)}%`, color: weightedDivYield > 3 ? "var(--c-green)" : "var(--c-gold)" },
              { icon: <Target size={12} />, label: isAr ? "تقييم SUQAI" : "SUQAI Score", value: weightedScore > 0 ? `${Math.round(weightedScore)}` : "—", color: weightedScore >= 60 ? "var(--c-green)" : weightedScore >= 40 ? "var(--c-gold)" : "var(--c-muted)" },
            ].map((s, i) => (
              <div key={i} style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid var(--c-border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                  <span style={{ color: s.color }}>{s.icon}</span>
                  <span style={{ fontSize: 9, color: "var(--c-dim)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.label}</span>
                </div>
                <p style={{ fontSize: 16, fontWeight: 700, color: s.color, margin: 0, fontFamily: "var(--font-grotesk)" }}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          ATTENTION ITEMS (inline)
         ════════════════════════════════════════════════ */}
      {attentionItems.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
          {attentionItems.slice(0, 3).map((item, i) => (
            <Link key={i} href={item.href} style={{ flex: "1 1 200px", display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, background: "var(--c-surface)", border: "1px solid var(--c-border)", textDecoration: "none", transition: "border-color 0.2s" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: item.color, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: "var(--c-text)", flex: 1, lineHeight: 1.4 }}>
                {isAr ? item.line.ar : item.line.en}
              </span>
              <ArrowUpRight size={12} style={{ color: "var(--c-dim)" }} />
            </Link>
          ))}
        </div>
      )}

      {/* ════════════════════════════════════════════════
          PORTFOLIO HEALTH + SECTOR MIX (side by side)
         ════════════════════════════════════════════════ */}
      <div className="portfolio-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
        {/* Health Dimensions */}
        <div className="card" style={{ padding: "20px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <ShieldCheck size={14} style={{ color: healthColor }} />
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--c-text)", fontFamily: "var(--font-grotesk)", margin: 0 }}>
              {isAr ? "صحة المحفظة" : "Portfolio Health"}
            </h3>
            <span style={{ marginInlineStart: "auto", fontSize: 10, fontWeight: 700, color: healthColor, padding: "2px 8px", borderRadius: 6, background: `${healthColor}15` }}>
              {isAr ? healthLabel.ar : healthLabel.en}
            </span>
          </div>
          {dimensions.map((dim) => (
            <div key={dim.key} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontSize: 10, color: "var(--c-muted)" }}>{isAr ? dim.label.ar : dim.label.en}</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: signalColor(dim.signal) }}>{Math.round(dim.score)}</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: "var(--c-border)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.min(dim.score, 100)}%`, borderRadius: 3, background: `linear-gradient(90deg, ${signalColor(dim.signal)}80, ${signalColor(dim.signal)})`, transition: "width 0.5s ease" }} />
              </div>
            </div>
          ))}
          {/* Strengths & watchouts */}
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--c-border)" }}>
            {strengths.slice(0, 2).map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 6, alignItems: "flex-start", marginBottom: 6 }}>
                <span style={{ color: "var(--c-green)", fontSize: 10, marginTop: 1 }}>+</span>
                <span style={{ fontSize: 10, color: "var(--c-muted)", lineHeight: 1.4 }}>{isAr ? s.ar : s.en}</span>
              </div>
            ))}
            {watchouts.slice(0, 2).map((w, i) => (
              <div key={i} style={{ display: "flex", gap: 6, alignItems: "flex-start", marginBottom: 6 }}>
                <AlertTriangle size={10} style={{ color: "var(--c-gold)", marginTop: 1, flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: "var(--c-muted)", lineHeight: 1.4 }}>{isAr ? w.ar : w.en}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sector Mix + Summary */}
        <div className="card" style={{ padding: "20px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <PieChart size={14} style={{ color: "var(--c-gold)" }} />
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--c-text)", fontFamily: "var(--font-grotesk)", margin: 0 }}>
              {isAr ? "التوزيع القطاعي" : "Sector Mix"}
            </h3>
          </div>
          {/* Visual sector bars */}
          <div style={{ display: "flex", height: 12, borderRadius: 6, overflow: "hidden", marginBottom: 14 }}>
            {sectors.map((s, i) => (
              <div key={i} style={{ width: `${s.weight}%`, background: getSectorColor(s.sector), minWidth: s.weight > 3 ? 4 : 1, transition: "width 0.3s" }} title={`${s.sector}: ${s.weight.toFixed(1)}%`} />
            ))}
          </div>
          {sectors.slice(0, 5).map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: getSectorColor(s.sector), flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: "var(--c-text)", flex: 1 }}>{isAr ? s.sectorAr : s.sector}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--c-text)", fontFamily: "var(--font-grotesk)" }}>{s.weight.toFixed(0)}%</span>
              <span style={{ fontSize: 10, color: s.change >= 0 ? "var(--c-green)" : "var(--c-red)" }}>{s.change >= 0 ? "+" : ""}{s.change.toFixed(1)}%</span>
            </div>
          ))}
          {/* Portfolio summary row */}
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--c-border)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <span style={{ fontSize: 9, color: "var(--c-dim)", textTransform: "uppercase" }}>{isAr ? "المبلغ المستثمر" : "Invested"}</span>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--c-text)", margin: 0 }}>{fmtCurrency(totalCost, sar)}</p>
            </div>
            <div>
              <span style={{ fontSize: 9, color: "var(--c-dim)", textTransform: "uppercase" }}>{isAr ? "التوزيعات السنوية" : "Annual Div."}</span>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--c-green)", margin: 0 }}>{fmtCurrency(annualDividendEst, sar)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          PERFORMANCE CHART
         ════════════════════════════════════════════════ */}
      <div style={{ marginBottom: 20 }}>
        <PortfolioPerformanceChart data={performanceData} locale={locale} sar={sar} />
      </div>

      {/* ════════════════════════════════════════════════
          HOLDINGS — Visual Wallet Cards
         ════════════════════════════════════════════════ */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Briefcase size={14} style={{ color: "var(--c-gold)" }} />
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--c-text)", fontFamily: "var(--font-grotesk)", margin: 0 }}>
            {isAr ? "مقتنياتي" : "My Holdings"}
          </h3>
          <span style={{ fontSize: 10, color: "var(--c-dim)", marginInlineStart: 4 }}>{holdings.length} {isAr ? "أسهم" : "stocks"}</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
          {sortedHoldings.map((h) => {
            const gainUp = h.gainPct >= 0;
            const todayUp = h.todayChange >= 0;
            const score = h.overallScore;
            const sColor = getSectorColor(h.sector);

            return (
              <Link key={h.ticker} href={`/${locale}/stock/${h.ticker}`} style={{ textDecoration: "none" }}>
                <div className="card" style={{ padding: "16px 18px", position: "relative", overflow: "hidden", transition: "border-color 0.2s, transform 0.15s", cursor: "pointer" }}>
                  {/* Sector accent */}
                  <div style={{ position: "absolute", top: 0, left: 0, width: 3, height: "100%", background: sColor, borderRadius: "4px 0 0 4px" }} />

                  {/* Header row: ticker + weight */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 15, fontWeight: 800, color: "var(--c-text)", fontFamily: "var(--font-grotesk)" }}>{h.ticker}</span>
                        {score !== null && (
                          <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 4, background: `${scoreColor(score)}18`, color: scoreColor(score) }}>
                            {Math.round(score)}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 10, color: "var(--c-muted)", margin: 0, marginTop: 2 }}>{h.name}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: 9, color: "var(--c-dim)", textTransform: "uppercase" }}>{h.weight.toFixed(0)}%</span>
                      <div style={{ width: 36, height: 3, borderRadius: 2, background: "var(--c-border)", marginTop: 3 }}>
                        <div style={{ height: "100%", width: `${Math.min(h.weight, 100)}%`, borderRadius: 2, background: sColor }} />
                      </div>
                    </div>
                  </div>

                  {/* Price row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                    <span style={{ fontSize: 18, fontWeight: 700, color: "var(--c-text)", fontFamily: "var(--font-grotesk)" }}>
                      {sar} {h.currentPrice.toFixed(2)}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: todayUp ? "var(--c-green)" : "var(--c-red)", display: "flex", alignItems: "center", gap: 2 }}>
                      {todayUp ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                      {todayUp ? "+" : ""}{h.todayChange.toFixed(2)}%
                    </span>
                  </div>

                  {/* Metrics grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, paddingTop: 8, borderTop: "1px solid var(--c-border)" }}>
                    <div>
                      <span style={{ fontSize: 8, color: "var(--c-dim)", textTransform: "uppercase" }}>{isAr ? "القيمة" : "Value"}</span>
                      <p style={{ fontSize: 11, fontWeight: 600, color: "var(--c-text)", margin: 0 }}>{fmtCurrency(h.totalValue, sar)}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: 8, color: "var(--c-dim)", textTransform: "uppercase" }}>{isAr ? "الربح" : "P&L"}</span>
                      <p style={{ fontSize: 11, fontWeight: 600, color: gainUp ? "var(--c-green)" : "var(--c-red)", margin: 0 }}>
                        {gainUp ? "+" : ""}{h.gainPct.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <span style={{ fontSize: 8, color: "var(--c-dim)", textTransform: "uppercase" }}>{isAr ? "الأسهم" : "Shares"}</span>
                      <p style={{ fontSize: 11, fontWeight: 600, color: "var(--c-text)", margin: 0 }}>{h.shares}</p>
                    </div>
                  </div>

                  {/* Fair value badge */}
                  {h.fairValueDiff !== null && (
                    <div style={{ position: "absolute", top: 12, right: 12 }}>
                      <span style={{
                        fontSize: 8, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                        color: h.fairValueDiff > 10 ? "var(--c-green)" : h.fairValueDiff < -10 ? "var(--c-red)" : "var(--c-gold)",
                        background: h.fairValueDiff > 10 ? "rgba(34,197,94,0.12)" : h.fairValueDiff < -10 ? "rgba(248,113,113,0.12)" : "rgba(200,169,81,0.12)",
                      }}>
                        {h.fairValueDiff > 10 ? (isAr ? "مخفّض" : "UNDERVALUED") : h.fairValueDiff < -10 ? (isAr ? "مرتفع" : "OVERVALUED") : (isAr ? "عادل" : "FAIR")}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          WATCHLIST — Compact Cards
         ════════════════════════════════════════════════ */}
      {watchlistStocks.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Eye size={14} style={{ color: "var(--c-gold)" }} />
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--c-text)", fontFamily: "var(--font-grotesk)", margin: 0 }}>
              {isAr ? "قائمة المتابعة" : "Watchlist"}
            </h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
            {watchlistStocks.map((s) => {
              const wUp = s.change >= 0;
              return (
                <Link key={s.ticker} href={`/${locale}/stock/${s.ticker}`} style={{ textDecoration: "none" }}>
                  <div className="card" style={{ padding: "14px 16px", transition: "border-color 0.2s" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--c-text)", fontFamily: "var(--font-grotesk)" }}>{s.ticker}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: wUp ? "var(--c-green)" : "var(--c-red)" }}>
                        {wUp ? "+" : ""}{s.change.toFixed(1)}%
                      </span>
                    </div>
                    <p style={{ fontSize: 9, color: "var(--c-muted)", margin: 0, marginBottom: 6 }}>{s.name}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--c-text)" }}>{sar} {s.price.toFixed(2)}</span>
                      {s.score !== null && (
                        <span style={{ fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 3, background: `${scoreColor(s.score)}15`, color: scoreColor(s.score) }}>
                          {Math.round(s.score)}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 9, color: "var(--c-dim)", margin: 0, marginTop: 6, lineHeight: 1.3 }}>
                      {isAr ? s.signalLine.ar : s.signalLine.en}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════
          OPPORTUNITIES — Compact
         ════════════════════════════════════════════════ */}
      {opportunities.length > 0 && (
        <div id="opportunities" style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Zap size={14} style={{ color: "var(--c-gold)" }} />
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--c-text)", fontFamily: "var(--font-grotesk)", margin: 0 }}>
              {isAr ? "فرص تناسب أسلوبك" : "Opportunities for You"}
            </h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>
            {opportunities.map((o) => {
              const tagColors: Record<string, { bg: string; text: string; label: { en: string; ar: string } }> = {
                undervalued: { bg: "rgba(34,197,94,0.12)", text: "var(--c-green)", label: { en: "Value", ar: "قيمة" } },
                dividend_leader: { bg: "rgba(200,169,81,0.12)", text: "var(--c-gold)", label: { en: "Income", ar: "دخل" } },
                momentum: { bg: "rgba(96,165,250,0.12)", text: "#60a5fa", label: { en: "Growth", ar: "نمو" } },
                high_quality: { bg: "rgba(167,139,250,0.12)", text: "#a78bfa", label: { en: "Quality", ar: "جودة" } },
              };
              const tc = tagColors[o.tag] || tagColors.high_quality;
              return (
                <Link key={o.ticker} href={`/${locale}/stock/${o.ticker}`} style={{ textDecoration: "none" }}>
                  <div className="card" style={{ padding: "14px 16px", transition: "border-color 0.2s" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--c-text)", fontFamily: "var(--font-grotesk)" }}>{o.ticker}</span>
                      <span style={{ fontSize: 8, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: tc.bg, color: tc.text }}>
                        {isAr ? tc.label.ar : tc.label.en}
                      </span>
                    </div>
                    <p style={{ fontSize: 10, color: "var(--c-muted)", margin: 0, marginBottom: 8 }}>{o.name}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--c-text)" }}>{sar} {o.price.toFixed(2)}</span>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 3, background: `${scoreColor(o.score)}15`, color: scoreColor(o.score) }}>
                        Score {Math.round(o.score)}
                      </span>
                    </div>
                    <p style={{ fontSize: 9, color: "var(--c-dim)", margin: 0, marginTop: 6, lineHeight: 1.3 }}>
                      {isAr ? o.insight.ar : o.insight.en}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════
          WEALTH CALCULATOR
         ════════════════════════════════════════════════ */}
      <WealthCalculator locale={locale} sar={sar} portfolioValue={totalValue} />

      {/* Responsive */}
      <style>{`
        @media (max-width: 900px) {
          .portfolio-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <hr className="gold-line my-8" />
      <p style={{ fontSize: 11, color: "var(--c-dim)", textAlign: "center", letterSpacing: "0.02em" }}>
        {t(locale, "common.disclaimer")}
      </p>
    </div>
  );
}
