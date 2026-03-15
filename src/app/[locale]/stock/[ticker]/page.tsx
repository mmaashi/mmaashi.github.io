import { createServiceClient } from "@/lib/supabase/server";
import { getCompanyQuote } from "@/lib/data-sources";
import PriceChart from "@/components/PriceChart";
import SuqaiScore from "@/components/SuqaiScore";
import { calculateScores } from "@/lib/scores";
import StockTabs from "@/components/StockTabs";
import FinancialChart from "@/components/FinancialChart";
import StockChat from "@/components/StockChat";
import VerdictHeader from "@/components/VerdictHeader";
// FairValueCard REMOVED — fair_value_estimate is a BLOCKED metric (0% coverage)
import ScoreChecks from "@/components/ScoreChecks";
import Link from "next/link";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  BarChart3,
  DollarSign,
  Activity,
  Calendar,
  Building2,
  Shield,
  Globe,
  Users,
  Info,
  Droplets,
  ArrowUpRight,
  ArrowDownRight,
  Newspaper,
  ExternalLink,
  Gauge,
  Target,
  Zap,
  PieChart,
  ShieldCheck,
  LineChart,
} from "lucide-react";
import { t, tSector } from "@/lib/i18n";
import {
  valuationSummary,
  profitabilityStrength,
  growthProfile,
  balanceSheetRiskLevel,
  dividendProfile,
  momentumRegime,
  scoreConfidenceLevel,
  scoreTierLabel,
  dimensionStrengthsWeaknesses,
  metricDisplayPolicy,
  signalColor,
  signalBg,
  payoutSustainability,
  dividendConsistency,
  liquidityStatus,
  debtBurdenSummary,
  relativeStrengthVsTASI,
  volatilityRiskBand,
  capitalEfficiencySummary,
  type Signal,
} from "@/lib/interpretation";

type Tab = "overview" | "chart" | "financials" | "dividends" | "news" | "info" | "analysis";

export default async function StockPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; ticker: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { locale, ticker } = await params;
  const { tab: rawTab = "overview" } = await searchParams;

  const upperTicker = ticker.toUpperCase();
  const validTabs: Tab[] = ["overview", "chart", "financials", "dividends", "news", "info", "analysis"];
  const activeTab: Tab = validTabs.includes(rawTab as Tab) ? (rawTab as Tab) : "overview";

  const supabase = createServiceClient();

  // ── 1. Get company from DB ──────────────────────────────────
  const { data: company } = await supabase
    .from("companies")
    .select("id, ticker, name_en, name_ar, sector, market, is_shariah_compliant, description_en, description_ar, website_url, employee_count, founded_year, ceo_name_en, ceo_name_ar")
    .eq("ticker", upperTicker)
    .single();

  if (!company) {
    return (
      <div className="page-wrap">
        <div className="card" style={{ padding: "64px 28px", textAlign: "center" }}>
          <p style={{ fontSize: 40, marginBottom: 16 }}>📊</p>
          <h1 className="font-bold text-xl mb-2" style={{ color: "var(--c-text)", fontFamily: "var(--font-grotesk)" }}>
            {t(locale, "stock.not_found")}
          </h1>
          <p style={{ color: "var(--c-muted)", fontSize: 14, marginBottom: 16 }}>
            {t(locale, "stock.not_found_desc")} <span style={{ color: "var(--c-gold)", fontWeight: 700 }}>{upperTicker}</span>
          </p>
          <Link href={`/${locale}/screener`} className="text-sm font-semibold transition-colors hover:text-white" style={{ color: "var(--c-gold)", textDecoration: "none" }}>
            {t(locale, "stock.browse")}
          </Link>
        </div>
      </div>
    );
  }

  // ── 2. Parallel data fetch (always fetch core, conditionally fetch tab data) ──
  const yearAgo = new Date();
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);
  const yearAgoStr = yearAgo.toISOString().split("T")[0];

  // ── 3. Extract results ──────────────────────────────────────
  const [
    liveQuoteResult,
    latestPriceResult,
    priceHistoryResult,
    financialResult,
    recentDivResult,
    allDivResult,
    newsResult,
    peersResult,
    metricsResult,
  ] = await Promise.allSettled([
    getCompanyQuote(upperTicker),
    supabase
      .from("stock_prices")
      .select("close, open, high, low, volume, date")
      .eq("company_id", company.id)
      .order("date", { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from("stock_prices")
      .select("date, close, open, high, low")
      .eq("company_id", company.id)
      .order("date", { ascending: true }),
    supabase
      .from("financials")
      .select("earnings_per_share, year, period, net_income, revenue, total_assets, total_liabilities, debt_to_equity, current_ratio, operating_cash_flow, free_cash_flow, roe, gross_profit, operating_income")
      .eq("company_id", company.id)
      .order("year", { ascending: false })
      .order("period", { ascending: false })
      .limit(8),
    supabase
      .from("dividends")
      .select("amount_per_share, ex_date, pay_date")
      .eq("company_id", company.id)
      .order("ex_date", { ascending: false })
      .limit(20),
    supabase
      .from("dividends")
      .select("amount_per_share, ex_date, pay_date, currency")
      .eq("company_id", company.id)
      .order("ex_date", { ascending: false })
      .limit(12),
    supabase
      .from("news")
      .select("id, title_en, title_ar, source, source_url, published_at, sentiment_score, company_id")
      .or(`company_id.eq.${company.id},company_id.is.null`)
      .order("published_at", { ascending: false })
      .limit(20),
    supabase
      .from("companies")
      .select("id, ticker, name_en, name_ar, sector")
      .eq("sector", company.sector ?? "")
      .neq("id", company.id)
      .limit(6),
    // ── SŪQAI Metrics (59 pre-computed columns) ──
    supabase
      .from("company_metrics_daily")
      .select("*")
      .eq("company_id", company.id)
      .order("as_of_date", { ascending: false })
      .limit(1)
      .single(),
  ]);

  const liveQuote      = liveQuoteResult.status     === "fulfilled" ? liveQuoteResult.value      : null;
  const latestDbPrice  = latestPriceResult.status   === "fulfilled" ? latestPriceResult.value.data : null;
  const priceHistory   = priceHistoryResult.status  === "fulfilled" ? priceHistoryResult.value.data ?? [] : [];
  const allFinancials  = financialResult.status     === "fulfilled" ? financialResult.value.data ?? [] : [];
  const financial      = allFinancials[0] ?? null;
  const recentDivs     = recentDivResult.status     === "fulfilled" ? recentDivResult.value.data ?? [] : [];
  const allDivs        = allDivResult.status        === "fulfilled" ? allDivResult.value.data ?? [] : [];
  const rawNewsItems   = newsResult.status          === "fulfilled" ? newsResult.value.data ?? [] : [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const metrics: any   = metricsResult.status       === "fulfilled" ? (metricsResult.value as any).data : null;
  // Sort: company-specific news first, then general market news
  const newsItems      = rawNewsItems.sort((a: {company_id: string | null}, b: {company_id: string | null}) => {
    if (a.company_id === company.id && b.company_id !== company.id) return -1;
    if (a.company_id !== company.id && b.company_id === company.id) return 1;
    return 0;
  }).slice(0, 15);
  const peers          = peersResult.status         === "fulfilled" ? peersResult.value.data ?? [] : [];

  // ── 4. Compute display values ───────────────────────────────
  const currentPrice = liveQuote?.price ?? (latestDbPrice ? Number(latestDbPrice.close) : null);
  const changeAmt    = liveQuote?.change ?? null;
  const changePct    = liveQuote?.change_percent ?? null;
  const isPositive   = changePct !== null ? changePct >= 0 : changeAmt !== null ? changeAmt >= 0 : true;
  const volume       = liveQuote?.volume ?? (latestDbPrice ? Number(latestDbPrice.volume) : null);
  const high         = liveQuote?.high   ?? (latestDbPrice ? Number(latestDbPrice.high)   : null);
  const low          = liveQuote?.low    ?? (latestDbPrice ? Number(latestDbPrice.low)    : null);
  const open         = liveQuote?.open   ?? (latestDbPrice ? Number(latestDbPrice.open)   : null);

  const eps       = financial?.earnings_per_share ? Number(financial.earnings_per_share) : null;
  const pe        = currentPrice && eps && eps > 0 ? (currentPrice / eps).toFixed(1) : null;
  const revenue   = financial?.revenue   ? Number(financial.revenue)   : null;
  const netIncome = financial?.net_income ? Number(financial.net_income) : null;
  const totalAssets = financial?.total_assets ? Number(financial.total_assets) : null;
  const totalLiabilities = financial?.total_liabilities ? Number(financial.total_liabilities) : null;

  // Use stored ratio OR calculate from assets/liabilities
  const debtEq    = financial?.debt_to_equity
    ? Number(financial.debt_to_equity)
    : (totalAssets && totalLiabilities && totalAssets > totalLiabilities)
      ? totalLiabilities / (totalAssets - totalLiabilities)
      : null;
  const currRatio = financial?.current_ratio   ? Number(financial.current_ratio)   : null;
  const ocf       = financial?.operating_cash_flow ? Number(financial.operating_cash_flow) : null;
  const roe       = financial?.roe ? Number(financial.roe) : (netIncome && totalAssets && totalLiabilities && (totalAssets - totalLiabilities) > 0) ? (netIncome / (totalAssets - totalLiabilities)) * 100 : null;
  const grossProfit = financial?.gross_profit ? Number(financial.gross_profit) : null;
  const opIncome    = financial?.operating_income ? Number(financial.operating_income) : null;

  const netMargin = netIncome !== null && revenue !== null && revenue > 0
    ? `${((netIncome / revenue) * 100).toFixed(1)}%`
    : null;
  const revenueFormatted = revenue !== null
    ? revenue >= 1e9 ? `${(revenue / 1e9).toFixed(1)}B` : `${(revenue / 1e6).toFixed(0)}M`
    : null;

  // Use allDivs (last 12 records, no date filter) for yield — more reliable than recentDivs which filters by 1yr
  const latestFourDivs = allDivs.slice(0, 4);
  const annualDiv  = latestFourDivs.reduce((s, d) => s + Number(d.amount_per_share), 0);
  const divYield   = currentPrice && annualDiv > 0 ? ((annualDiv / currentPrice) * 100).toFixed(2) + "%" : null;
  const divYieldNum = currentPrice && annualDiv > 0 ? (annualDiv / currentPrice) * 100 : null;

  // 52W high/low from full history
  const allHighs   = priceHistory.map((p) => Number(p.high ?? p.close));
  const allLows    = priceHistory.map((p) => Number(p.low  ?? p.close));
  const fiftyTwoHigh = allHighs.length > 0 ? Math.max(...allHighs).toFixed(2) : null;
  const fiftyTwoLow  = allLows.length  > 0 ? Math.min(...allLows).toFixed(2)  : null;

  // 52W range position (0–100%)
  const rangePosition = (fiftyTwoHigh && fiftyTwoLow && currentPrice)
    ? Math.max(0, Math.min(100,
        ((currentPrice - parseFloat(fiftyTwoLow)) /
         (parseFloat(fiftyTwoHigh) - parseFloat(fiftyTwoLow))) * 100
      ))
    : null;

  // Fair Value REMOVED — fair_value_estimate is a BLOCKED metric (0% coverage in DB)
  // DO NOT compute or display fair value estimates until validated data source exists

  const displayName = locale === "ar" && company.name_ar ? company.name_ar : company.name_en;
  const isLive      = !!liveQuote;
  const sar         = t(locale, "common.sar");
  const isAr        = locale === "ar";

  // SŪQAI Score
  const scores = calculateScores({
    pe: pe ? parseFloat(pe) : null,
    eps,
    divYield: divYieldNum,
    revenue,
    netIncome,
    changePct,
    currentPrice,
    fiftyTwoHigh: fiftyTwoHigh ? parseFloat(fiftyTwoHigh) : null,
    fiftyTwoLow:  fiftyTwoLow  ? parseFloat(fiftyTwoLow)  : null,
    debtToEquity: debtEq,
    roe,
  });

  // ── SŪQAI Verdict & Analysis Data ──────────────────────────
  const overallScore = ((scores.value + scores.growth + scores.dividend + scores.health + scores.momentum) / 25) * 100;

  // ── Metrics-based data (from company_metrics_daily) ────────
  const m = metrics; // shorthand
  const n = (key: string): number | null => {
    if (!m || m[key] === null || m[key] === undefined) return null;
    const v = Number(m[key]);
    return Number.isFinite(v) ? v : null;
  };

  // Real SŪQAI Score from DB (overrides legacy calculation when available)
  const realSuqaiScore = n("suqai_score");
  const realScoreTier = m?.score_tier ?? null;
  const displayScore = realSuqaiScore ?? overallScore;

  // Dimension scores from DB
  const dbScoreValue = n("score_value");
  const dbScoreQuality = n("score_quality");
  const dbScoreGrowth = n("score_growth");
  const dbScoreMomentum = n("score_momentum");
  const dbScoreDividend = n("score_dividend");
  const dbScoreSafety = n("score_safety");

  // Metric coverage for confidence
  const metricKeys = [
    "pe_ratio", "pb_ratio", "ps_ratio", "ev_ebitda",
    "roe", "roa", "roce", "net_margin", "operating_margin",
    "revenue_growth_yoy", "earnings_growth_yoy", "eps_growth_yoy", "revenue_cagr_3y",
    "dividend_yield", "payout_ratio", "dividend_cagr_3y", "years_of_dividends",
    "debt_to_equity", "current_ratio", "interest_coverage", "net_debt_ebitda", "ocf_to_debt",
    "return_1m", "return_3m", "return_1y", "volatility_30d", "relative_perf_vs_tasi",
  ];
  const coveredCount = m ? metricKeys.filter(k => n(k) !== null).length : 0;
  const metricCoverage = (coveredCount / metricKeys.length) * 100;

  // Interpretation engine results
  const isBankSector = company.sector === "Banks" || company.sector === "بنوك";
  const isNonDividendPayer = n("dividend_yield") === null || n("dividend_yield") === 0;
  const hasNegativeEarnings = n("pe_ratio") !== null && n("pe_ratio")! < 0;

  const interpValuation = valuationSummary(n("pe_ratio"), n("pb_ratio"), n("ps_ratio"), n("ev_ebitda"), n("sector_pctile_pe"), n("sector_pctile_pb"));
  const interpQuality = profitabilityStrength(n("roe"), n("roa"), n("net_margin"), n("operating_margin"));
  const interpGrowth = growthProfile(n("revenue_growth_yoy"), n("earnings_growth_yoy"), n("eps_growth_yoy"), n("revenue_cagr_3y"));
  const interpSafety = balanceSheetRiskLevel(n("debt_to_equity"), n("current_ratio"), n("interest_coverage"), n("net_debt_ebitda"), n("ocf_to_debt"));
  const interpDividend = dividendProfile(n("dividend_yield"), n("payout_ratio"), n("dividend_cagr_3y"), n("years_of_dividends"));
  const interpMomentum = momentumRegime(n("return_1m"), n("return_3m"), n("return_1y"), n("relative_perf_vs_tasi"));
  const interpConfidence = scoreConfidenceLevel(metricCoverage);
  const tierInfo = scoreTierLabel(realScoreTier, locale);
  const { strengths: scoreStrengths, weaknesses: scoreWeaknesses } = dimensionStrengthsWeaknesses(dbScoreValue, dbScoreQuality, dbScoreGrowth, dbScoreMomentum, dbScoreDividend, dbScoreSafety, locale);

  // Insight badges — only data-validated signals (no fair value)
  const insightBadges: string[] = [];
  if (divYieldNum && divYieldNum > 4) insightBadges.push("high_yield");
  if (divYieldNum && divYieldNum > 2 && allDivs.length >= 8) insightBadges.push("dividend_champion");
  if (scores.growth >= 4) insightBadges.push("high_growth");
  if (debtEq !== null && debtEq < 0.5) insightBadges.push("low_debt");
  if (company.is_shariah_compliant) insightBadges.push("shariah_compliant");
  if (scores.momentum >= 4) insightBadges.push("momentum_up");

  // Risk flags — only data-validated signals (no fair value)
  const riskFlags: string[] = [];
  if (debtEq !== null && debtEq > 2) riskFlags.push("high_debt");
  if (eps !== null && eps < 0) riskFlags.push("negative_earnings");
  if (revenue !== null && netIncome !== null && allFinancials.length >= 2) {
    const prevRev = allFinancials[1]?.revenue ? Number(allFinancials[1].revenue) : null;
    if (prevRev && revenue < prevRev * 0.9) riskFlags.push("declining_revenue");
  }
  if (!divYieldNum || divYieldNum === 0) riskFlags.push("no_dividend");

  // Per-pillar checks for Analysis tab
  const valueChecks = [
    { check: isAr ? "مضاعف الأرباح أقل من 15" : "P/E ratio below 15", passed: pe !== null && parseFloat(pe) < 15 },
    { check: isAr ? "ربحية السهم إيجابية" : "Positive EPS", passed: eps !== null && eps > 0 },
    { check: isAr ? "هامش ربح أعلى من 10%" : "Net margin above 10%", passed: netIncome !== null && revenue !== null && revenue > 0 && (netIncome / revenue) > 0.1 },
    { check: isAr ? "نسبة السعر للدفترية أقل من 3" : "P/B ratio below 3", passed: n("pb_ratio") !== null && n("pb_ratio")! < 3 && n("pb_ratio")! > 0 },
  ];
  const growthChecks = [
    { check: isAr ? "نمو الإيرادات" : "Revenue growth (YoY)", passed: allFinancials.length >= 2 && revenue !== null && allFinancials[1]?.revenue !== null && revenue > Number(allFinancials[1]?.revenue ?? 0) },
    { check: isAr ? "نمو صافي الربح" : "Net income growth", passed: allFinancials.length >= 2 && netIncome !== null && Number(allFinancials[1]?.net_income ?? 0) > 0 && netIncome > Number(allFinancials[1]?.net_income ?? 0) },
    { check: isAr ? "ربحية السهم أعلى من 1 ريال" : "EPS above 1 SAR", passed: eps !== null && eps > 1 },
  ];
  const healthChecks = [
    { check: isAr ? "نسبة الدين إلى حقوق الملكية أقل من 1" : "Debt/Equity below 1.0", passed: debtEq !== null && debtEq < 1 },
    { check: isAr ? "نسبة التداول أعلى من 1" : "Current ratio above 1.0", passed: currRatio !== null && currRatio > 1 },
    { check: isAr ? "تدفقات تشغيلية إيجابية" : "Positive operating cash flow", passed: ocf !== null && ocf > 0 },
    { check: isAr ? "صافي الأصول إيجابي" : "Positive net assets", passed: totalAssets !== null && totalLiabilities !== null && totalAssets > totalLiabilities },
  ];
  const dividendChecks = [
    { check: isAr ? "عائد توزيعات أعلى من 2%" : "Dividend yield above 2%", passed: divYieldNum !== null && divYieldNum > 2 },
    { check: isAr ? "توزيعات مستمرة (4+ دفعات)" : "Consistent dividends (4+ payments)", passed: allDivs.length >= 4 },
    { check: isAr ? "عائد توزيعات أعلى من 4%" : "High yield above 4%", passed: divYieldNum !== null && divYieldNum > 4 },
  ];
  const momentumChecks = [
    { check: isAr ? "تغيّر إيجابي اليوم" : "Positive daily change", passed: changePct !== null && changePct > 0 },
    { check: isAr ? "أعلى من منتصف نطاق 52 أسبوع" : "Above 52-week midpoint", passed: rangePosition !== null && rangePosition > 50 },
    { check: isAr ? "سعر أعلى من متوسط الفتح" : "Price above open", passed: currentPrice !== null && open !== null && currentPrice > open },
  ];

  const chartData = priceHistory.map((p) => ({
    date:  p.date as string,
    close: Number(p.close),
    open:  p.open  ? Number(p.open)  : undefined,
    high:  p.high  ? Number(p.high)  : undefined,
    low:   p.low   ? Number(p.low)   : undefined,
  }));

  // ── HELPER COMPONENTS (inline) ──────────────────────────────

  // 52W Range Bar
  const RangeBar = () => {
    if (!fiftyTwoHigh || !fiftyTwoLow || rangePosition === null) return null;
    const dotPos = Math.max(2, Math.min(98, rangePosition));
    return (
      <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--c-border)" }}>
        <div className="flex justify-between mb-2">
          <div>
            <p style={{ fontSize: 10, color: "var(--c-muted)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>
              {t(locale, "stock.52w_low")}
            </p>
            <span className="font-num font-semibold" style={{ color: "var(--c-red)", fontSize: 14 }}>
              {sar} {fiftyTwoLow}
            </span>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 10, color: "var(--c-muted)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>
              {t(locale, "stock.current_pos")}
            </p>
            <span className="font-num font-semibold" style={{ color: "var(--c-gold)", fontSize: 14 }}>
              {rangePosition.toFixed(0)}%
            </span>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 10, color: "var(--c-muted)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>
              {t(locale, "stock.52w_high")}
            </p>
            <span className="font-num font-semibold" style={{ color: "var(--c-green)", fontSize: 14 }}>
              {sar} {fiftyTwoHigh}
            </span>
          </div>
        </div>
        {/* Track */}
        <div style={{ position: "relative", height: 8, borderRadius: 8, background: "var(--c-border)", margin: "8px 0" }}>
          {/* Gradient fill from left to current position */}
          <div style={{
            position: "absolute",
            left: 0,
            width: `${dotPos}%`,
            height: "100%",
            borderRadius: 8,
            background: "linear-gradient(to right, var(--c-red-ring), var(--c-gold), var(--c-green))",
            opacity: 0.5,
          }} />
          {/* Current price dot */}
          <div style={{
            position: "absolute",
            left: `${dotPos}%`,
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: "var(--c-gold)",
            border: "2px solid var(--c-base)",
            boxShadow: "0 0 8px rgba(200,169,81,0.6)",
            zIndex: 2,
          }} />
        </div>
        <div className="flex justify-between">
          <span className="font-num" style={{ fontSize: 10, color: "var(--c-muted)" }}>{sar} {fiftyTwoLow}</span>
          <span className="font-num" style={{ fontSize: 10, color: "var(--c-muted)" }}>{sar} {fiftyTwoHigh}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="page-wrap">
      {/* Back */}
      <Link
        href={`/${locale}/screener`}
        className="inline-flex items-center gap-2 mb-5 text-sm font-semibold transition-colors hover:text-white"
        style={{ color: "var(--c-gold)", textDecoration: "none" }}
      >
        <ArrowLeft size={14} />
        {t(locale, "stock.back")}
      </Link>

      {/* ══════════════════════════════════════════════════════
          STOCK HEADER — always visible on every tab
      ══════════════════════════════════════════════════════ */}
      <div className="card-gold fade-up mb-5" style={{ padding: "26px 28px" }}>
        {/* Subtle glow */}
        <div style={{
          position: "absolute", top: -80, right: -60,
          width: 320, height: 320, borderRadius: "50%",
          background: isPositive ? "rgba(14,203,129,0.05)" : "rgba(246,70,93,0.05)",
          filter: "blur(60px)", pointerEvents: "none",
        }} />

        <div className="flex flex-wrap items-start justify-between gap-4">
          {/* Company identity */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              {/* Ticker badge — premium avatar */}
              <div className="rounded-2xl flex items-center justify-center flex-shrink-0"
                   style={{
                     width: 58, height: 58,
                     background: "linear-gradient(145deg, rgba(200,169,81,0.22) 0%, rgba(200,169,81,0.07) 100%)",
                     border: "1.5px solid var(--c-gold-ring)",
                     boxShadow: "0 4px 16px rgba(200,169,81,0.15), inset 0 1px 0 rgba(255,255,255,0.04)",
                   }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: "var(--c-gold)", letterSpacing: "0.04em", textAlign: "center", lineHeight: 1.2, fontFamily: "var(--font-grotesk)" }}>
                  {company.ticker}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-lg" style={{ color: "var(--c-gold)", fontFamily: "var(--font-grotesk)" }}>
                    {company.ticker}
                  </span>
                  {company.is_shariah_compliant && (
                    <span className="badge badge-gold" style={{ padding: "2px 8px", fontSize: 10 }}>
                      <Shield size={10} /> {t(locale, "stock.shariah")}
                    </span>
                  )}
                  {isLive && (
                    <span className="badge badge-open" style={{ fontSize: 10, padding: "2px 8px" }}>
                      <span className="live-dot" style={{ width: 5, height: 5 }} />
                      {t(locale, "stock.live")}
                    </span>
                  )}
                </div>
                <h1 style={{ color: "var(--c-text)", fontSize: 17, fontWeight: 600, marginTop: 2 }}>{displayName}</h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {company.sector && (
                    <span className="badge badge-neutral" style={{ fontSize: 10 }}>{tSector(locale, company.sector)}</span>
                  )}
                  {company.market && (
                    <span style={{ fontSize: 11, color: "var(--c-dim)" }}>{company.market} {t(locale, "stock.market")}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Price block */}
          {currentPrice !== null ? (
            <div style={{ textAlign: isAr ? "left" : "right" }}>
              <span className="font-num" style={{ fontSize: 38, fontWeight: 800, color: "var(--c-text)", lineHeight: 1, letterSpacing: "-0.03em", display: "block" }}>
                {currentPrice.toFixed(2)}
              </span>
              <span style={{ fontSize: 13, color: "var(--c-muted)", fontWeight: 500 }}>{sar}</span>
              {changePct !== null && (
                <div className="flex items-center gap-2 justify-end mt-2">
                  {changeAmt !== null && (
                    <span className={`font-num font-semibold text-base ${isPositive ? "text-up" : "text-down"}`}>
                      {isPositive ? "+" : ""}{changeAmt.toFixed(2)}
                    </span>
                  )}
                  <span className={`badge font-num ${isPositive ? "badge-up" : "badge-down"}`} style={{ fontSize: 12, padding: "4px 10px" }}>
                    {isPositive ? <TrendingUp size={11} style={{ display: "inline", marginRight: 3 }} /> : <TrendingDown size={11} style={{ display: "inline", marginRight: 3 }} />}
                    {isPositive ? "+" : ""}{changePct.toFixed(2)}%
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p style={{ color: "var(--c-muted)", fontSize: 14 }}>{t(locale, "stock.price_unavail")}</p>
          )}
        </div>

        {/* OHLCV row */}
        {currentPrice !== null && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-4" style={{ borderTop: "1px solid var(--c-border)" }}>
            {[
              { label: t(locale, "stock.open"),   val: open,   color: "var(--c-text)" },
              { label: t(locale, "stock.high"),   val: high,   color: "var(--c-green)" },
              { label: t(locale, "stock.low"),    val: low,    color: "var(--c-red)" },
              { label: t(locale, "stock.volume"), val: volume, color: "var(--c-text)", isVol: true },
            ].map(({ label, val, color, isVol }) => (
              <div key={label}>
                <p style={{ fontSize: 11, color: "var(--c-muted)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>
                  {label}
                </p>
                <span className="font-num font-semibold" style={{ color, fontSize: 15 }}>
                  {val !== null
                    ? isVol
                      ? val >= 1e6 ? `${(val / 1e6).toFixed(1)}M` : `${(val / 1e3).toFixed(0)}K`
                      : `${sar} ${val.toFixed(2)}`
                    : "N/A"}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* 52W Range Bar — always in header for quick reference */}
        <RangeBar />
      </div>

      {/* ══════════════════════════════════════════════════════
          TAB NAVIGATION
      ══════════════════════════════════════════════════════ */}
      <StockTabs
        locale={locale}
        ticker={upperTicker}
        activeTab={activeTab}
        newsCount={newsItems.length}
      />

      {/* ══════════════════════════════════════════════════════
          TAB: OVERVIEW
      ══════════════════════════════════════════════════════ */}
      {activeTab === "overview" && (
        <>
          {/* ── SŪQAI SCORE HERO ──────────────────────────────── */}
          <div className="card-gold fade-up mb-5" style={{ padding: "24px 28px" }}>
            <div className="flex flex-wrap items-start justify-between gap-6">
              {/* Score circle + tier */}
              <div className="flex items-center gap-5">
                <div style={{
                  width: 88, height: 88, borderRadius: "50%",
                  background: `conic-gradient(${tierInfo.color} ${(displayScore / 100) * 360}deg, var(--c-border) 0deg)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: `0 0 24px ${tierInfo.color}33`,
                }}>
                  <div style={{
                    width: 72, height: 72, borderRadius: "50%",
                    background: "var(--c-base)", display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                  }}>
                    <span className="font-num" style={{ fontSize: 26, fontWeight: 800, color: tierInfo.color, lineHeight: 1 }}>
                      {displayScore.toFixed(0)}
                    </span>
                    <span style={{ fontSize: 9, color: "var(--c-muted)", fontWeight: 600 }}>/ 100</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--c-text)", fontFamily: "var(--font-grotesk)", margin: 0 }}>
                      {isAr ? "نتيجة سوقاي" : "SŪQAI Score"}
                    </h2>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6,
                      background: tierInfo.bg, color: tierInfo.color,
                    }}>
                      {tierInfo.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4,
                      background: signalBg(interpConfidence.signal), color: signalColor(interpConfidence.signal),
                    }}>
                      {isAr ? interpConfidence.labelAr : interpConfidence.label}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--c-dim)" }}>
                      {isAr ? interpConfidence.detailAr : interpConfidence.detail}
                    </span>
                  </div>
                  {/* Strengths & Weaknesses */}
                  <div className="flex flex-wrap gap-2">
                    {scoreStrengths.map(s => (
                      <span key={s} style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: "rgba(34,197,94,0.10)", color: "#22c55e" }}>
                        + {s}
                      </span>
                    ))}
                    {scoreWeaknesses.map(w => (
                      <span key={w} style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: "rgba(239,68,68,0.10)", color: "#ef4444" }}>
                        - {w}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dimension bars */}
              <div style={{ minWidth: 220 }}>
                {[
                  { label: isAr ? "القيمة" : "Value", score: dbScoreValue, max: 25, color: "#C8A951" },
                  { label: isAr ? "الجودة" : "Quality", score: dbScoreQuality, max: 20, color: "#A78BFA" },
                  { label: isAr ? "النمو" : "Growth", score: dbScoreGrowth, max: 15, color: "#0ECB81" },
                  { label: isAr ? "الزخم" : "Momentum", score: dbScoreMomentum, max: 15, color: "#60A5FA" },
                  { label: isAr ? "التوزيعات" : "Dividend", score: dbScoreDividend, max: 15, color: "#F59E0B" },
                  { label: isAr ? "الأمان" : "Safety", score: dbScoreSafety, max: 10, color: "#14B8A6" },
                ].map(({ label, score: dimScore, max, color }) => (
                  <div key={label} className="flex items-center gap-2 mb-1.5">
                    <span style={{ fontSize: 10, fontWeight: 600, color: "var(--c-muted)", width: 65, textAlign: "right" }}>{label}</span>
                    <div style={{ flex: 1, height: 6, borderRadius: 3, background: "var(--c-border)", overflow: "hidden" }}>
                      <div style={{
                        width: dimScore !== null ? `${Math.min(100, (dimScore / max) * 100)}%` : "0%",
                        height: "100%", borderRadius: 3, background: color,
                        transition: "width 0.6s ease",
                      }} />
                    </div>
                    <span className="font-num" style={{ fontSize: 10, color: "var(--c-dim)", width: 36, textAlign: "right" }}>
                      {dimScore !== null ? `${dimScore.toFixed(0)}/${max}` : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Verdict Header (legacy — insight badges & risk flags) ── */}
          <VerdictHeader
            overallScore={displayScore}
            valuePillars={{
              value: scores.value,
              growth: scores.growth,
              performance: scores.momentum,
              health: scores.health,
              dividend: scores.dividend,
            }}
            insightBadges={insightBadges}
            riskFlags={riskFlags}
            locale={locale}
          />

          {/* ════════════════════════════════════════════════════
              SECTION 1: OVERVIEW — Key Metrics at a Glance
          ════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {([
              { icon: BarChart3, label: t(locale, "stock.pe"), ...metricDisplayPolicy("pe_ratio", n("pe_ratio"), { hasNegativeEarnings }), sub: eps ? `EPS: ${sar} ${eps.toFixed(2)}` : undefined },
              { icon: DollarSign, label: isAr ? "القيمة الدفترية" : "P/B Ratio", ...metricDisplayPolicy("pb_ratio", n("pb_ratio")), sub: undefined },
              { icon: Calendar, label: t(locale, "stock.div_yield"), ...metricDisplayPolicy("dividend_yield", n("dividend_yield"), { isNonDividendPayer }), sub: annualDiv > 0 ? `${sar} ${annualDiv.toFixed(2)}/yr` : undefined },
              { icon: TrendingUp, label: t(locale, "stock.revenue_short"), value: revenueFormatted ?? "—", raw: revenue, signal: "neutral" as Signal, hidden: false, sub: undefined, note: undefined },
              { icon: BarChart3, label: t(locale, "stock.net_margin"), ...metricDisplayPolicy("net_margin", n("net_margin")), sub: undefined },
              { icon: Building2, label: t(locale, "stock.debt_equity"), ...metricDisplayPolicy("debt_to_equity", n("debt_to_equity"), { isBankSector }), sub: undefined },
              { icon: TrendingUp, label: t(locale, "stock.roe"), ...metricDisplayPolicy("roe", n("roe")), sub: undefined },
              { icon: Activity, label: t(locale, "stock.52w"), value: fiftyTwoHigh && fiftyTwoLow ? `${fiftyTwoLow} – ${fiftyTwoHigh}` : "—", raw: null, signal: "neutral" as Signal, hidden: false, sub: fiftyTwoHigh ? sar : undefined, note: undefined },
            ] as Array<{ icon: typeof BarChart3; label: string; value: string; raw: number | null; signal: Signal; hidden: boolean; sub?: string; note?: string }>).filter(item => !item.hidden).map(({ icon: Icon, label, value, signal, sub, note }) => (
              <div key={label} className="card" style={{ padding: "16px 18px" }}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={13} style={{ color: "var(--c-muted)" }} />
                  <span style={{ fontSize: 11, color: "var(--c-muted)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</span>
                </div>
                <span className="font-num font-bold text-lg" style={{ color: signal !== "insufficient_data" ? "var(--c-text)" : "var(--c-dim)" }}>{value}</span>
                {sub && <p className="font-num" style={{ fontSize: 11, color: "var(--c-dim)", marginTop: 2 }}>{sub}</p>}
                {note && <p style={{ fontSize: 10, color: "var(--c-dim)", marginTop: 2, fontStyle: "italic" }}>{note}</p>}
              </div>
            ))}
          </div>

          {/* ════════════════════════════════════════════════════
              SECTION 2-7: INTERPRETATION CARDS
              Each card shows the section interpretation + key metrics
          ════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            {/* Valuation */}
            {interpValuation.signal !== "insufficient_data" && (
              <div className="card" style={{ padding: "20px 22px" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Target size={14} style={{ color: "#C8A951" }} />
                  <h3 className="font-bold" style={{ fontSize: 14, color: "var(--c-text)" }}>{isAr ? "التقييم" : "Valuation"}</h3>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: signalBg(interpValuation.signal), color: signalColor(interpValuation.signal) }}>
                    {isAr ? interpValuation.labelAr : interpValuation.label}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: "var(--c-muted)", marginBottom: 12, lineHeight: 1.5 }}>
                  {isAr ? interpValuation.detailAr : interpValuation.detail}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { k: "pe_ratio", label: "P/E" }, { k: "pb_ratio", label: "P/B" },
                    { k: "ps_ratio", label: "P/S" }, { k: "ev_ebitda", label: "EV/EBITDA" },
                  ].map(({ k, label }) => {
                    const d = metricDisplayPolicy(k, n(k), { hasNegativeEarnings });
                    if (d.hidden) return null;
                    return (
                      <div key={k} style={{ padding: "8px 10px", background: "var(--c-elevated)", borderRadius: 6 }}>
                        <p style={{ fontSize: 10, color: "var(--c-dim)", fontWeight: 600, marginBottom: 2 }}>{label}</p>
                        <span className="font-num font-semibold" style={{ fontSize: 14, color: d.signal !== "insufficient_data" ? "var(--c-text)" : "var(--c-dim)" }}>{d.value}</span>
                      </div>
                    );
                  })}
                </div>
                {/* Sector percentiles */}
                {(n("sector_pctile_pe") !== null || n("sector_pctile_pb") !== null) && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--c-border)" }}>
                    <p style={{ fontSize: 10, color: "var(--c-dim)", fontWeight: 600, marginBottom: 6 }}>{isAr ? "المرتبة في القطاع" : "SECTOR RANK"}</p>
                    <div className="flex gap-3">
                      {n("sector_pctile_pe") !== null && (
                        <span className="font-num" style={{ fontSize: 11, color: "var(--c-muted)" }}>PE: {n("sector_pctile_pe")!.toFixed(0)}th pctile</span>
                      )}
                      {n("sector_pctile_pb") !== null && (
                        <span className="font-num" style={{ fontSize: 11, color: "var(--c-muted)" }}>PB: {n("sector_pctile_pb")!.toFixed(0)}th pctile</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quality */}
            {interpQuality.signal !== "insufficient_data" && (
              <div className="card" style={{ padding: "20px 22px" }}>
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck size={14} style={{ color: "#A78BFA" }} />
                  <h3 className="font-bold" style={{ fontSize: 14, color: "var(--c-text)" }}>{isAr ? "الجودة" : "Quality"}</h3>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: signalBg(interpQuality.signal), color: signalColor(interpQuality.signal) }}>
                    {isAr ? interpQuality.labelAr : interpQuality.label}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: "var(--c-muted)", marginBottom: 12, lineHeight: 1.5 }}>
                  {isAr ? interpQuality.detailAr : interpQuality.detail}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { k: "roe", label: "ROE" }, { k: "roa", label: "ROA" },
                    { k: "net_margin", label: isAr ? "هامش صافي" : "Net Margin" }, { k: "operating_margin", label: isAr ? "هامش تشغيلي" : "Op. Margin" },
                  ].map(({ k, label }) => {
                    const d = metricDisplayPolicy(k, n(k));
                    return (
                      <div key={k} style={{ padding: "8px 10px", background: "var(--c-elevated)", borderRadius: 6 }}>
                        <p style={{ fontSize: 10, color: "var(--c-dim)", fontWeight: 600, marginBottom: 2 }}>{label}</p>
                        <span className="font-num font-semibold" style={{ fontSize: 14, color: d.signal !== "insufficient_data" ? "var(--c-text)" : "var(--c-dim)" }}>{d.value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Growth */}
            {interpGrowth.signal !== "insufficient_data" && (
              <div className="card" style={{ padding: "20px 22px" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={14} style={{ color: "#0ECB81" }} />
                  <h3 className="font-bold" style={{ fontSize: 14, color: "var(--c-text)" }}>{isAr ? "النمو" : "Growth"}</h3>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: signalBg(interpGrowth.signal), color: signalColor(interpGrowth.signal) }}>
                    {isAr ? interpGrowth.labelAr : interpGrowth.label}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: "var(--c-muted)", marginBottom: 12, lineHeight: 1.5 }}>
                  {isAr ? interpGrowth.detailAr : interpGrowth.detail}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { k: "revenue_growth_yoy", label: isAr ? "نمو الإيرادات" : "Rev Growth" }, { k: "earnings_growth_yoy", label: isAr ? "نمو الأرباح" : "Earnings Growth" },
                    { k: "eps_growth_yoy", label: isAr ? "نمو ربحية السهم" : "EPS Growth" }, { k: "revenue_cagr_3y", label: isAr ? "معدل نمو 3 سنوات" : "Rev CAGR 3Y" },
                  ].map(({ k, label }) => {
                    const d = metricDisplayPolicy(k, n(k));
                    return (
                      <div key={k} style={{ padding: "8px 10px", background: "var(--c-elevated)", borderRadius: 6 }}>
                        <p style={{ fontSize: 10, color: "var(--c-dim)", fontWeight: 600, marginBottom: 2 }}>{label}</p>
                        <span className="font-num font-semibold" style={{ fontSize: 14, color: d.signal !== "insufficient_data" ? (d.raw && d.raw > 0 ? "var(--c-green)" : d.raw && d.raw < 0 ? "var(--c-red)" : "var(--c-text)") : "var(--c-dim)" }}>{d.value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Safety */}
            {interpSafety.signal !== "insufficient_data" && (
              <div className="card" style={{ padding: "20px 22px" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Shield size={14} style={{ color: "#14B8A6" }} />
                  <h3 className="font-bold" style={{ fontSize: 14, color: "var(--c-text)" }}>{isAr ? "الأمان" : "Safety"}</h3>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: signalBg(interpSafety.signal), color: signalColor(interpSafety.signal) }}>
                    {isAr ? interpSafety.labelAr : interpSafety.label}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: "var(--c-muted)", marginBottom: 12, lineHeight: 1.5 }}>
                  {isAr ? interpSafety.detailAr : interpSafety.detail}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { k: "debt_to_equity", label: isAr ? "الدين/الملكية" : "D/E" }, { k: "current_ratio", label: isAr ? "نسبة التداول" : "Current Ratio" },
                    { k: "interest_coverage", label: isAr ? "تغطية الفائدة" : "Int. Coverage" }, { k: "ocf_to_debt", label: isAr ? "التدفق/الدين" : "OCF/Debt" },
                  ].map(({ k, label }) => {
                    const d = metricDisplayPolicy(k, n(k), { isBankSector });
                    return (
                      <div key={k} style={{ padding: "8px 10px", background: "var(--c-elevated)", borderRadius: 6 }}>
                        <p style={{ fontSize: 10, color: "var(--c-dim)", fontWeight: 600, marginBottom: 2 }}>{label}</p>
                        <span className="font-num font-semibold" style={{ fontSize: 14, color: d.signal !== "insufficient_data" ? "var(--c-text)" : "var(--c-dim)" }}>{d.value}{d.note ? ` *` : ""}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Dividend */}
            <div className="card" style={{ padding: "20px 22px" }}>
              <div className="flex items-center gap-2 mb-3">
                <DollarSign size={14} style={{ color: "#F59E0B" }} />
                <h3 className="font-bold" style={{ fontSize: 14, color: "var(--c-text)" }}>{isAr ? "التوزيعات" : "Dividend"}</h3>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: signalBg(interpDividend.signal), color: signalColor(interpDividend.signal) }}>
                  {isAr ? interpDividend.labelAr : interpDividend.label}
                </span>
              </div>
              <p style={{ fontSize: 12, color: "var(--c-muted)", marginBottom: 12, lineHeight: 1.5 }}>
                {isAr ? interpDividend.detailAr : interpDividend.detail}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { k: "dividend_yield", label: isAr ? "العائد" : "Yield" }, { k: "payout_ratio", label: isAr ? "نسبة التوزيع" : "Payout" },
                  { k: "dividend_cagr_3y", label: isAr ? "نمو التوزيعات" : "Div Growth 3Y" }, { k: "years_of_dividends", label: isAr ? "سنوات التوزيع" : "Years Paying" },
                ].map(({ k, label }) => {
                  const d = metricDisplayPolicy(k, n(k), { isNonDividendPayer });
                  return (
                    <div key={k} style={{ padding: "8px 10px", background: "var(--c-elevated)", borderRadius: 6 }}>
                      <p style={{ fontSize: 10, color: "var(--c-dim)", fontWeight: 600, marginBottom: 2 }}>{label}</p>
                      <span className="font-num font-semibold" style={{ fontSize: 14, color: d.signal !== "insufficient_data" ? "var(--c-text)" : "var(--c-dim)" }}>{d.value}</span>
                      {d.note && <p style={{ fontSize: 9, color: "var(--c-dim)", marginTop: 1, fontStyle: "italic" }}>{d.note}</p>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Momentum */}
            {interpMomentum.signal !== "insufficient_data" && (
              <div className="card" style={{ padding: "20px 22px" }}>
                <div className="flex items-center gap-2 mb-3">
                  <LineChart size={14} style={{ color: "#60A5FA" }} />
                  <h3 className="font-bold" style={{ fontSize: 14, color: "var(--c-text)" }}>{isAr ? "الزخم" : "Momentum"}</h3>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: signalBg(interpMomentum.signal), color: signalColor(interpMomentum.signal) }}>
                    {isAr ? interpMomentum.labelAr : interpMomentum.label}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: "var(--c-muted)", marginBottom: 12, lineHeight: 1.5 }}>
                  {isAr ? interpMomentum.detailAr : interpMomentum.detail}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { k: "return_1m", label: "1M" }, { k: "return_3m", label: "3M" }, { k: "return_1y", label: "1Y" },
                  ].map(({ k, label }) => {
                    const d = metricDisplayPolicy(k, n(k));
                    return (
                      <div key={k} style={{ padding: "8px 10px", background: "var(--c-elevated)", borderRadius: 6, textAlign: "center" }}>
                        <p style={{ fontSize: 10, color: "var(--c-dim)", fontWeight: 600, marginBottom: 2 }}>{label}</p>
                        <span className="font-num font-semibold" style={{ fontSize: 14, color: d.raw && d.raw > 0 ? "var(--c-green)" : d.raw && d.raw < 0 ? "var(--c-red)" : "var(--c-dim)" }}>{d.value}</span>
                      </div>
                    );
                  })}
                </div>
                {(n("volatility_30d") !== null || n("relative_perf_vs_tasi") !== null) && (
                  <div className="flex gap-3 mt-2">
                    {n("volatility_30d") !== null && (
                      <span className="font-num" style={{ fontSize: 11, color: "var(--c-muted)" }}>Vol 30d: {(n("volatility_30d")! * 100).toFixed(1)}%</span>
                    )}
                    {n("relative_perf_vs_tasi") !== null && (
                      <span className="font-num" style={{ fontSize: 11, color: n("relative_perf_vs_tasi")! > 0 ? "var(--c-green)" : "var(--c-red)" }}>
                        vs TASI: {n("relative_perf_vs_tasi")! > 0 ? "+" : ""}{(n("relative_perf_vs_tasi")! * 100).toFixed(1)}%
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Company description */}
          {(company.description_en || company.description_ar) && (
            <div className="card mb-5" style={{ padding: "22px 24px" }}>
              <div className="flex items-center gap-2 mb-3">
                <Info size={14} style={{ color: "var(--c-gold)" }} />
                <h2 className="font-bold" style={{ fontSize: 15, color: "var(--c-text)" }}>
                  {t(locale, "stock.about_company")}
                </h2>
              </div>
              <p style={{ fontSize: 13, color: "var(--c-muted)", lineHeight: 1.8, margin: 0 }}>
                {(isAr && company.description_ar) ? company.description_ar : company.description_en}
              </p>
            </div>
          )}

          {/* Fair Value Card REMOVED — blocked metric, 0% coverage */}

          {/* ── Sector Context ──────────────────────────────── */}
          {(n("sector_rank_market_cap") !== null || n("sector_peer_count") !== null) && (
            <div className="card mb-5" style={{ padding: "20px 24px" }}>
              <div className="flex items-center gap-2 mb-4">
                <PieChart size={14} style={{ color: "var(--c-gold)" }} />
                <h2 className="font-bold" style={{ fontSize: 15, color: "var(--c-text)" }}>
                  {isAr ? "السياق القطاعي" : "Sector Context"}
                </h2>
                <span style={{ fontSize: 11, color: "var(--c-dim)" }}>
                  {isAr ? tSector(locale, company.sector ?? "") : tSector(locale, company.sector ?? "")}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                {n("sector_rank_market_cap") !== null && n("sector_peer_count") !== null && (
                  <div style={{ padding: "10px 12px", background: "var(--c-elevated)", borderRadius: 6 }}>
                    <p style={{ fontSize: 10, color: "var(--c-dim)", fontWeight: 600, marginBottom: 2 }}>{isAr ? "المرتبة" : "RANK"}</p>
                    <span className="font-num font-bold" style={{ fontSize: 18, color: "var(--c-gold)" }}>
                      #{n("sector_rank_market_cap")!.toFixed(0)}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--c-dim)" }}> / {n("sector_peer_count")!.toFixed(0)}</span>
                  </div>
                )}
                {[
                  { k: "sector_pctile_roe", label: "ROE" },
                  { k: "sector_pctile_revenue_growth", label: isAr ? "النمو" : "Growth" },
                  { k: "sector_pctile_return_1y", label: isAr ? "العائد" : "Return" },
                ].map(({ k, label }) => {
                  const val = n(k);
                  if (val === null) return null;
                  return (
                    <div key={k} style={{ padding: "10px 12px", background: "var(--c-elevated)", borderRadius: 6 }}>
                      <p style={{ fontSize: 10, color: "var(--c-dim)", fontWeight: 600, marginBottom: 2 }}>{label} {isAr ? "المئوية" : "PCTILE"}</p>
                      <span className="font-num font-bold" style={{ fontSize: 18, color: val > 70 ? "var(--c-green)" : val < 30 ? "var(--c-red)" : "var(--c-text)" }}>
                        {val.toFixed(0)}th
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Peer Comparison ──────────────────────────────── */}
          {peers.length > 0 && (
            <div className="card mb-5" style={{ padding: "20px 24px" }}>
              <div className="flex items-center gap-2 mb-4">
                <Users size={14} style={{ color: "var(--c-gold)" }} />
                <h2 className="font-bold" style={{ fontSize: 15, color: "var(--c-text)" }}>
                  {isAr ? "شركات مشابهة" : "Similar Companies"}
                </h2>
                <span style={{ fontSize: 11, color: "var(--c-dim)", marginLeft: 4 }}>
                  {isAr ? `في قطاع ${tSector(locale, company.sector ?? "")}` : `in ${tSector(locale, company.sector ?? "")}`}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {peers.map((peer) => {
                  const peerName = (isAr && peer.name_ar) ? peer.name_ar : peer.name_en;
                  return (
                    <Link
                      key={peer.ticker}
                      href={`/${locale}/stock/${peer.ticker}`}
                      style={{ textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--c-elevated)", border: "1px solid var(--c-border)", transition: "border-color 0.15s" }}
                      className="hover:border-gold"
                    >
                      <div className="flex items-center gap-3">
                        <div style={{ width: 34, height: 34, borderRadius: 8, background: "var(--c-base)", border: "1px solid var(--c-border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: "var(--c-gold)", fontFamily: "var(--font-grotesk)" }}>
                            {peer.ticker.slice(0, 4)}
                          </span>
                        </div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--c-text)", marginBottom: 1 }}>{peerName}</p>
                          <span className="font-num" style={{ fontSize: 11, color: "var(--c-muted)" }}>{peer.ticker}</span>
                        </div>
                      </div>
                      <ArrowUpRight size={14} style={{ color: "var(--c-muted)" }} />
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Latest News preview (top 3) */}
          {newsItems.length > 0 && (
            <div className="card mb-5" style={{ padding: "20px 22px" }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Newspaper size={14} style={{ color: "var(--c-gold)" }} />
                  <h2 className="font-bold" style={{ fontSize: 15, color: "var(--c-text)" }}>
                    {t(locale, "stock.news_section")}
                  </h2>
                </div>
                <Link href={`/${locale}/stock/${upperTicker}?tab=news`}
                      style={{ fontSize: 12, color: "var(--c-gold)", textDecoration: "none", fontWeight: 600 }}>
                  {t(locale, "stock.read_more")}
                </Link>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {newsItems.slice(0, 3).map((item) => {
                  const title = isAr && item.title_ar ? item.title_ar : item.title_en;
                  const pubDate = item.published_at
                    ? new Date(item.published_at).toLocaleDateString(isAr ? "ar-SA" : "en-US", { month: "short", day: "numeric", year: "numeric" })
                    : "";
                  const sentiment = item.sentiment_score ? Number(item.sentiment_score) : null;
                  return (
                    <a key={item.id} href={item.source_url} target="_blank" rel="noopener noreferrer"
                       style={{ textDecoration: "none", display: "block", padding: "12px 14px", borderRadius: "var(--radius-md)", background: "var(--c-elevated)", border: "1px solid var(--c-border)", transition: "border-color 0.15s" }}
                       className="hover:border-gold">
                      <div className="flex items-start justify-between gap-3">
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 13, color: "var(--c-text)", fontWeight: 500, lineHeight: 1.45, marginBottom: 6 }}>
                            {title ?? "—"}
                          </p>
                          <div className="flex items-center gap-2">
                            <span style={{ fontSize: 11, color: "var(--c-muted)" }}>{item.source}</span>
                            <span style={{ fontSize: 11, color: "var(--c-dim)" }}>·</span>
                            <span className="font-num" style={{ fontSize: 11, color: "var(--c-dim)" }}>{pubDate}</span>
                            {sentiment !== null && (
                              <span style={{
                                fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 4,
                                background: sentiment > 0.1 ? "var(--c-green-bg)" : sentiment < -0.1 ? "var(--c-red-bg)" : "var(--c-border)",
                                color: sentiment > 0.1 ? "var(--c-green)" : sentiment < -0.1 ? "var(--c-red)" : "var(--c-muted)",
                              }}>
                                {sentiment > 0.1 ? "▲" : sentiment < -0.1 ? "▼" : "●"}
                              </span>
                            )}
                          </div>
                        </div>
                        <ExternalLink size={12} style={{ color: "var(--c-muted)", flexShrink: 0, marginTop: 2 }} />
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: CHART
      ══════════════════════════════════════════════════════ */}
      {activeTab === "chart" && (
        <section className="mb-5">
          <div className="card" style={{ padding: "22px 24px" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity size={14} style={{ color: "var(--c-gold)" }} />
                <h2 className="font-bold" style={{ fontSize: 15, color: "var(--c-text)", fontFamily: "var(--font-grotesk)" }}>
                  {t(locale, "stock.price_history")}
                </h2>
              </div>
              {chartData.length > 0 && (
                <span className="badge badge-neutral font-num" style={{ fontSize: 10 }}>
                  {chartData.length} {t(locale, "stock.days")}
                </span>
              )}
            </div>
            <PriceChart data={chartData} ticker={company.ticker} locale={locale} />
          </div>

          {/* Liquidity Flow (only when live data available) */}
          {liveQuote?.liquidity && liveQuote.liquidity.inflow_value != null && (
            <div className="card mt-4" style={{ padding: "22px 24px" }}>
              <div className="flex items-center gap-2 mb-4">
                <Droplets size={14} style={{ color: "var(--c-gold)" }} />
                <div>
                  <h2 className="font-bold" style={{ fontSize: 15, color: "var(--c-text)", fontFamily: "var(--font-grotesk)" }}>
                    {t(locale, "stock.liquidity")}
                  </h2>
                  <p style={{ fontSize: 11, color: "var(--c-muted)" }}>{t(locale, "stock.liquidity_subtitle")}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Inflow */}
                <div style={{ padding: "14px 16px", background: "var(--c-green-bg)", borderRadius: "var(--radius-md)", border: "1px solid var(--c-green-ring)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <ArrowUpRight size={14} style={{ color: "var(--c-green)" }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--c-green)", letterSpacing: "0.05em" }}>{t(locale, "stock.inflow")}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="metric-label">{t(locale, "stock.value")}</p>
                      <span className="font-num font-bold" style={{ color: "var(--c-green)", fontSize: 14 }}>
                        {(liveQuote.liquidity.inflow_value / 1e6).toFixed(1)}M
                      </span>
                    </div>
                    <div>
                      <p className="metric-label">{t(locale, "stock.flow_volume")}</p>
                      <span className="font-num font-bold" style={{ color: "var(--c-green)", fontSize: 14 }}>
                        {(liveQuote.liquidity.inflow_volume / 1e3).toFixed(0)}K
                      </span>
                    </div>
                    <div>
                      <p className="metric-label">{t(locale, "stock.trades")}</p>
                      <span className="font-num font-bold" style={{ color: "var(--c-green)", fontSize: 14 }}>
                        {liveQuote.liquidity.inflow_trades.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                {/* Outflow */}
                <div style={{ padding: "14px 16px", background: "var(--c-red-bg)", borderRadius: "var(--radius-md)", border: "1px solid var(--c-red-ring)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <ArrowDownRight size={14} style={{ color: "var(--c-red)" }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--c-red)", letterSpacing: "0.05em" }}>{t(locale, "stock.outflow")}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="metric-label">{t(locale, "stock.value")}</p>
                      <span className="font-num font-bold" style={{ color: "var(--c-red)", fontSize: 14 }}>
                        {(liveQuote.liquidity.outflow_value / 1e6).toFixed(1)}M
                      </span>
                    </div>
                    <div>
                      <p className="metric-label">{t(locale, "stock.flow_volume")}</p>
                      <span className="font-num font-bold" style={{ color: "var(--c-red)", fontSize: 14 }}>
                        {(liveQuote.liquidity.outflow_volume / 1e3).toFixed(0)}K
                      </span>
                    </div>
                    <div>
                      <p className="metric-label">{t(locale, "stock.trades")}</p>
                      <span className="font-num font-bold" style={{ color: "var(--c-red)", fontSize: 14 }}>
                        {liveQuote.liquidity.outflow_trades.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Net flow row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3" style={{ borderTop: "1px solid var(--c-border)", paddingTop: 14 }}>
                {[
                  { label: t(locale, "stock.net_flow"),   val: `${liveQuote.liquidity.net_value >= 0 ? "+" : ""}${(liveQuote.liquidity.net_value / 1e6).toFixed(1)}M`, color: liveQuote.liquidity.net_value >= 0 ? "var(--c-green)" : "var(--c-red)" },
                  { label: t(locale, "stock.bid"),        val: `${sar} ${(liveQuote.bid ?? 0).toFixed(2)}`, color: "var(--c-text)" },
                  { label: t(locale, "stock.ask"),        val: `${sar} ${(liveQuote.ask ?? 0).toFixed(2)}`, color: "var(--c-text)" },
                  { label: t(locale, "stock.prev_close"), val: `${sar} ${(liveQuote.previous_close ?? 0).toFixed(2)}`, color: "var(--c-muted)" },
                ].map(({ label, val, color }) => (
                  <div key={label}>
                    <p className="metric-label">{label}</p>
                    <span className="font-num font-bold" style={{ color, fontSize: 15 }}>{val}</span>
                  </div>
                ))}
              </div>
              {/* Flow bar */}
              {(() => {
                const total = liveQuote.liquidity.inflow_value + liveQuote.liquidity.outflow_value;
                const inflowPct = total > 0 ? (liveQuote.liquidity.inflow_value / total) * 100 : 50;
                return (
                  <div className="mt-4">
                    <div style={{ height: 6, borderRadius: 6, background: "var(--c-border)", overflow: "hidden", display: "flex" }}>
                      <div style={{ width: `${inflowPct}%`, height: "100%", background: "var(--c-green)", transition: "width 0.6s ease", borderRadius: "6px 0 0 6px" }} />
                      <div style={{ flex: 1, height: "100%", background: "var(--c-red)", borderRadius: "0 6px 6px 0" }} />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="font-num" style={{ fontSize: 10, color: "var(--c-green)" }}>{inflowPct.toFixed(0)}% {t(locale, "stock.inflow")}</span>
                      <span className="font-num" style={{ fontSize: 10, color: "var(--c-red)" }}>{(100 - inflowPct).toFixed(0)}% {t(locale, "stock.outflow")}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </section>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: FINANCIALS
      ══════════════════════════════════════════════════════ */}
      {activeTab === "financials" && (
        <section className="mb-5">
          <div className="card" style={{ padding: "22px 24px" }}>
            <div className="flex items-center gap-2 mb-5">
              <Building2 size={14} style={{ color: "var(--c-gold)" }} />
              <div>
                <h2 className="font-bold" style={{ fontSize: 15, color: "var(--c-text)" }}>
                  {t(locale, "stock.financials")}
                  {financial && ` — ${t(locale, `stock.period.${financial.period?.toLowerCase() || "annual"}`)} ${financial.year}`}
                </h2>
                <p style={{ fontSize: 11, color: "var(--c-muted)" }}>All figures in SAR</p>
              </div>
            </div>

            {financial ? (
              <>
                {/* Income Statement */}
                <div className="mb-5">
                  <p style={{ fontSize: 11, color: "var(--c-muted)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
                    {isAr ? "قائمة الدخل" : "Income Statement"}
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: t(locale, "stock.revenue"),      val: revenue,     fmt: (v: number) => `${(v / 1e9).toFixed(2)}B`, prefix: sar, color: "var(--c-text)" },
                      { label: t(locale, "stock.gross_profit"), val: grossProfit, fmt: (v: number) => `${(v / 1e9).toFixed(2)}B`, prefix: sar, color: grossProfit && grossProfit > 0 ? "var(--c-green)" : "var(--c-red)" },
                      { label: t(locale, "stock.op_income"),    val: opIncome,    fmt: (v: number) => `${(v / 1e9).toFixed(2)}B`, prefix: sar, color: opIncome && opIncome > 0 ? "var(--c-green)" : "var(--c-red)" },
                      { label: t(locale, "stock.net_income"),   val: netIncome,   fmt: (v: number) => `${(v / 1e9).toFixed(2)}B`, prefix: sar, color: netIncome && netIncome > 0 ? "var(--c-green)" : "var(--c-red)" },
                    ].map(({ label, val, fmt, prefix, color }) => (
                      <div key={label} style={{ padding: "14px 16px", background: "var(--c-elevated)", borderRadius: "var(--radius-md)", border: "1px solid var(--c-border)" }}>
                        <p style={{ fontSize: 10, color: "var(--c-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{label}</p>
                        <span className="font-num font-bold" style={{ fontSize: 18, color: val ? color : "var(--c-dim)" }}>
                          {val ? `${prefix} ${fmt(val)}` : "N/A"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Balance Sheet & Ratios */}
                <div className="mb-5">
                  <p style={{ fontSize: 11, color: "var(--c-muted)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
                    {isAr ? "الميزانية والنسب المالية" : "Balance Sheet & Ratios"}
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: t(locale, "stock.debt_equity"), val: debtEq, fmt: (v: number) => v.toFixed(2), suffix: "x", color: debtEq !== null ? (debtEq < 0.5 ? "var(--c-green)" : debtEq < 1 ? "var(--c-gold)" : "var(--c-red)") : "var(--c-dim)" },
                      { label: t(locale, "stock.roe"),         val: roe,    fmt: (v: number) => v.toFixed(1), suffix: "%", color: roe !== null ? (roe > 15 ? "var(--c-green)" : roe > 0 ? "var(--c-text)" : "var(--c-red)") : "var(--c-dim)" },
                      { label: t(locale, "stock.net_margin"),  val: netMargin ? parseFloat(netMargin) : null, fmt: (v: number) => v.toFixed(1), suffix: "%", color: netMargin ? (parseFloat(netMargin) > 10 ? "var(--c-green)" : parseFloat(netMargin) > 0 ? "var(--c-text)" : "var(--c-red)") : "var(--c-dim)" },
                      { label: t(locale, "stock.pe"),          val: pe ? parseFloat(pe) : null, fmt: (v: number) => v.toFixed(1), suffix: "x", color: pe ? (parseFloat(pe) < 15 ? "var(--c-green)" : parseFloat(pe) < 25 ? "var(--c-text)" : "var(--c-red)") : "var(--c-dim)" },
                    ].map(({ label, val, fmt, suffix, color }) => (
                      <div key={label} className="card" style={{ padding: "14px 16px" }}>
                        <p style={{ fontSize: 10, color: "var(--c-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>{label}</p>
                        <span className="font-num font-bold" style={{ fontSize: 18, color: val != null ? color : "var(--c-dim)" }}>
                          {val != null ? `${fmt(val)}${suffix}` : "N/A"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Assets & Liabilities */}
                <div>
                  <p style={{ fontSize: 11, color: "var(--c-muted)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
                    {isAr ? "الأصول والالتزامات" : "Assets & Liabilities"}
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { label: t(locale, "stock.total_assets"), val: totalAssets, fmt: (v: number) => `${(v / 1e9).toFixed(1)}B`, color: "var(--c-text)" },
                      { label: isAr ? "إجمالي الالتزامات" : "Total Liabilities", val: totalLiabilities, fmt: (v: number) => `${(v / 1e9).toFixed(1)}B`, color: "var(--c-red)" },
                      { label: isAr ? "حقوق الملكية" : "Equity", val: totalAssets && totalLiabilities ? totalAssets - totalLiabilities : null, fmt: (v: number) => `${(v / 1e9).toFixed(1)}B`, color: "var(--c-green)" },
                    ].map(({ label, val, fmt, color }) => (
                      <div key={label} className="card" style={{ padding: "14px 16px" }}>
                        <p style={{ fontSize: 10, color: "var(--c-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>{label}</p>
                        <span className="font-num font-bold" style={{ fontSize: 18, color: val != null ? color : "var(--c-dim)" }}>
                          {val != null ? `${sar} ${fmt(val)}` : "N/A"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <p style={{ fontSize: 32, marginBottom: 12 }}>📊</p>
                <p style={{ color: "var(--c-muted)", fontSize: 14 }}>Financial data not yet available for {company.ticker}.</p>
                <p style={{ color: "var(--c-dim)", fontSize: 12, marginTop: 6 }}>Data is being collected — check back soon.</p>
              </div>
            )}
          </div>

          {/* ── Financial Trend Charts ────────────────────────── */}
          {allFinancials.length > 1 && (
            <div className="card" style={{ padding: "22px 24px" }}>
              <div className="flex items-center gap-2 mb-5">
                <BarChart3 size={14} style={{ color: "var(--c-gold)" }} />
                <div>
                  <h2 className="font-bold" style={{ fontSize: 15, color: "var(--c-text)" }}>
                    {isAr ? "الاتجاهات المالية" : "Financial Trends"}
                  </h2>
                  <p style={{ fontSize: 11, color: "var(--c-muted)" }}>
                    {isAr ? `آخر ${allFinancials.length} فترات` : `Last ${allFinancials.length} periods`}
                  </p>
                </div>
              </div>
              <FinancialChart locale={locale} data={allFinancials.map(f => ({
                year: f.year ?? 0,
                period: f.period ?? "annual",
                revenue: f.revenue ? Number(f.revenue) : null,
                net_income: f.net_income ? Number(f.net_income) : null,
                earnings_per_share: f.earnings_per_share ? Number(f.earnings_per_share) : null,
                gross_profit: f.gross_profit ? Number(f.gross_profit) : null,
                operating_income: f.operating_income ? Number(f.operating_income) : null,
              }))} />
            </div>
          )}
        </section>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: DIVIDENDS
      ══════════════════════════════════════════════════════ */}
      {activeTab === "dividends" && (
        <section className="mb-5">
          {allDivs.length > 0 ? (
            <>
              {/* Dividend summary card */}
              <div className="card mb-4" style={{ padding: "20px 22px" }}>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="metric-label">{t(locale, "stock.div_yield")}</p>
                    <span className="font-num font-bold" style={{ fontSize: 28, color: divYield ? "var(--c-green)" : "var(--c-dim)" }}>
                      {divYield ?? "N/A"}
                    </span>
                  </div>
                  <div>
                    <p className="metric-label">Annual Dividend</p>
                    <span className="font-num font-bold" style={{ fontSize: 20, color: "var(--c-text)" }}>
                      {annualDiv > 0 ? `${sar} ${annualDiv.toFixed(2)}` : "N/A"}
                    </span>
                    {annualDiv > 0 && <p style={{ fontSize: 11, color: "var(--c-dim)", marginTop: 2 }}>per share / year</p>}
                  </div>
                    <div>
                      <p className="metric-label">Total Payments</p>
                      <span className="font-num font-bold" style={{ fontSize: 20, color: "var(--c-text)" }}>
                        {allDivs.length}
                      </span>
                      <p style={{ fontSize: 11, color: "var(--c-dim)", marginTop: 2 }}>on record</p>
                    </div>
                  </div>
                </div>

              {/* Dividend history table */}
              <div className="card overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3"
                     style={{ borderBottom: "1px solid var(--c-border)", background: "var(--c-elevated)" }}>
                  <Calendar size={14} style={{ color: "var(--c-green)" }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--c-text-sm)", letterSpacing: "0.05em" }}>
                    {t(locale, "stock.div_history")}
                  </span>
                </div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left" }}>{t(locale, "stock.ex_date")}</th>
                      <th style={{ textAlign: "right" }}>{t(locale, "stock.amount")}</th>
                      <th style={{ textAlign: "right" }}>{t(locale, "stock.pay_date")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allDivs.map((d, i) => (
                      <tr key={i}>
                        <td>
                          <span className="font-num" style={{ color: "var(--c-text)", fontSize: 13 }}>
                            {new Date(d.ex_date + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <span className="font-num font-semibold" style={{ color: "var(--c-green)" }}>
                            {sar} {Number(d.amount_per_share).toFixed(2)}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <span className="font-num" style={{ color: "var(--c-muted)", fontSize: 13 }}>
                            {d.pay_date
                              ? new Date(d.pay_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                              : "N/A"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="card" style={{ padding: "48px 28px", textAlign: "center" }}>
              <p style={{ fontSize: 32, marginBottom: 12 }}>💰</p>
              <p style={{ color: "var(--c-muted)", fontSize: 14 }}>No dividend history recorded for {company.ticker} yet.</p>
            </div>
          )}
        </section>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: NEWS
      ══════════════════════════════════════════════════════ */}
      {activeTab === "news" && (
        <section className="mb-5">
          <div className="card" style={{ padding: "22px 24px" }}>
            <div className="flex items-center gap-2 mb-5">
              <Newspaper size={14} style={{ color: "var(--c-gold)" }} />
              <h2 className="font-bold" style={{ fontSize: 15, color: "var(--c-text)" }}>
                {t(locale, "stock.news_section")} — {displayName}
              </h2>
              {newsItems.length > 0 && (
                <span className="badge badge-neutral font-num" style={{ fontSize: 10 }}>
                  {newsItems.length}
                </span>
              )}
            </div>

            {newsItems.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {newsItems.map((item) => {
                  const title = isAr && item.title_ar ? item.title_ar : item.title_en;
                  const pubDate = item.published_at
                    ? new Date(item.published_at).toLocaleDateString(isAr ? "ar-SA" : "en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })
                    : "";
                  const sentiment = item.sentiment_score ? Number(item.sentiment_score) : null;
                  return (
                    <a
                      key={item.id}
                      href={item.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        textDecoration: "none",
                        display: "block",
                        padding: "14px 16px",
                        borderRadius: "var(--radius-md)",
                        background: "var(--c-elevated)",
                        border: "1px solid var(--c-border)",
                        transition: "border-color 0.15s, background 0.15s",
                      }}
                    >
                      <div className="flex items-start gap-3">
                        {/* Sentiment indicator */}
                        <div style={{
                          width: 4,
                          borderRadius: 2,
                          flexShrink: 0,
                          alignSelf: "stretch",
                          background: sentiment !== null
                            ? sentiment > 0.1 ? "var(--c-green)" : sentiment < -0.1 ? "var(--c-red)" : "var(--c-border)"
                            : "var(--c-border)",
                        }} />
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 14, color: "var(--c-text)", fontWeight: 500, lineHeight: 1.5, marginBottom: 8 }}>
                            {title ?? "Untitled"}
                          </p>
                          <div className="flex items-center gap-3 flex-wrap">
                            <span style={{
                              fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
                              background: "var(--c-gold-dim)", color: "var(--c-gold)", border: "1px solid var(--c-gold-ring)"
                            }}>
                              {item.source}
                            </span>
                            <span className="font-num" style={{ fontSize: 11, color: "var(--c-dim)" }}>{pubDate}</span>
                            {sentiment !== null && Math.abs(sentiment) > 0.1 && (
                              <span style={{
                                fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 4,
                                background: sentiment > 0.1 ? "var(--c-green-bg)" : "var(--c-red-bg)",
                                color: sentiment > 0.1 ? "var(--c-green)" : "var(--c-red)",
                              }}>
                                {sentiment > 0.1 ? "↑ Positive" : "↓ Negative"}
                              </span>
                            )}
                          </div>
                        </div>
                        <ExternalLink size={13} style={{ color: "var(--c-muted)", flexShrink: 0, marginTop: 2 }} />
                      </div>
                    </a>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <p style={{ fontSize: 32, marginBottom: 12 }}>📰</p>
                <p style={{ color: "var(--c-muted)", fontSize: 14 }}>{t(locale, "stock.no_news")}</p>
                <p style={{ color: "var(--c-dim)", fontSize: 12, marginTop: 6 }}>
                  News is collected automatically from Argaam and Tadawul announcements.
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: INFO
      ══════════════════════════════════════════════════════ */}
      {activeTab === "info" && (
        <section className="mb-5">
          <div className="card" style={{ padding: "22px 24px" }}>
            <div className="flex items-center gap-2 mb-5">
              <Info size={14} style={{ color: "var(--c-gold)" }} />
              <h2 className="font-bold" style={{ fontSize: 15, color: "var(--c-text)" }}>{t(locale, "stock.company_info")}</h2>
            </div>

            {/* Description */}
            {(locale === "ar" ? company.description_ar : company.description_en) && (
              <div className="mb-5">
                <p style={{ fontSize: 11, color: "var(--c-muted)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>
                  {t(locale, "stock.about_company")}
                </p>
                <p style={{ fontSize: 14, color: "var(--c-text-sm)", lineHeight: 1.7 }}>
                  {locale === "ar" ? company.description_ar : company.description_en}
                </p>
              </div>
            )}

            {/* Details grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4" style={{ borderTop: "1px solid var(--c-border)", paddingTop: 20 }}>
              {[
                { label: t(locale, "screener.col.sector"), val: company.sector ? tSector(locale, company.sector) : null },
                { label: t(locale, "stock.ceo"), val: locale === "ar" ? company.ceo_name_ar : company.ceo_name_en },
                { label: t(locale, "stock.founded"), val: company.founded_year?.toString() },
                { label: t(locale, "stock.employees"), val: company.employee_count ? Number(company.employee_count).toLocaleString() : null },
                { label: "Market", val: company.market === "main" ? "Main Market (Tadawul)" : "Nomu Parallel Market" },
                { label: "Shariah", val: company.is_shariah_compliant ? "✓ Compliant" : "Non-compliant" },
              ].filter(i => i.val).map(({ label, val }) => (
                <div key={label}>
                  <p style={{ fontSize: 11, color: "var(--c-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>{label}</p>
                  <span style={{ fontSize: 14, color: "var(--c-text)" }}>{val}</span>
                </div>
              ))}
            </div>

            {/* Website */}
            {company.website_url && (
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--c-border)" }}>
                <p style={{ fontSize: 11, color: "var(--c-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                  {t(locale, "stock.website")}
                </p>
                {(() => {
                  const rawUrl = company.website_url!;
                  const fullUrl = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;
                  let displayHost = rawUrl;
                  try { displayHost = new URL(fullUrl).hostname.replace("www.", ""); } catch {}
                  return (
                    <a href={fullUrl} target="_blank" rel="noopener noreferrer"
                       className="inline-flex items-center gap-2 transition-colors hover:text-white"
                       style={{ color: "var(--c-gold)", textDecoration: "none", fontSize: 14, fontWeight: 500 }}>
                      <Globe size={14} />
                      {displayHost}
                      <ExternalLink size={11} style={{ opacity: 0.6 }} />
                    </a>
                  );
                })()}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB: ANALYSIS
      ══════════════════════════════════════════════════════ */}
      {activeTab === "analysis" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Verdict at top of analysis */}
          <VerdictHeader
            overallScore={overallScore}
            valuePillars={{
              value: scores.value,
              growth: scores.growth,
              performance: scores.momentum,
              health: scores.health,
              dividend: scores.dividend,
            }}
            insightBadges={insightBadges}
            riskFlags={riskFlags}
            locale={locale}
          />

          {/* Fair Value Card REMOVED — blocked metric, 0% coverage */}

          {/* Score Checks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ScoreChecks
              title={isAr ? "القيمة" : "Value"}
              score={scores.value}
              color="#C8A951"
              checks={valueChecks}
              locale={locale}
            />
            <ScoreChecks
              title={isAr ? "النمو" : "Growth"}
              score={scores.growth}
              color="#0ECB81"
              checks={growthChecks}
              locale={locale}
            />
            <ScoreChecks
              title={isAr ? "الصحة المالية" : "Financial Health"}
              score={scores.health}
              color="#A78BFA"
              checks={healthChecks}
              locale={locale}
            />
            <ScoreChecks
              title={isAr ? "التوزيعات" : "Dividends"}
              score={scores.dividend}
              color="#F59E0B"
              checks={dividendChecks}
              locale={locale}
            />
            <ScoreChecks
              title={isAr ? "الزخم" : "Momentum"}
              score={scores.momentum}
              color="#60A5FA"
              checks={momentumChecks}
              locale={locale}
            />
          </div>
        </div>
      )}

      {/* Back + Disclaimer */}
      <div className="mb-4 mt-8">
        <Link href={`/${locale}/screener`} className="btn btn-primary" style={{ textDecoration: "none" }}>
          <ArrowLeft size={14} />
          {t(locale, "stock.back_btn")}
        </Link>
      </div>
      <hr className="gold-line my-10" />
      <p style={{ fontSize: 11, color: "var(--c-dim)", textAlign: "center", letterSpacing: "0.02em" }}>
        {t(locale, "common.disclaimer")}
      </p>

      {/* ── AI Stock Chatbot ──────────────────────────────────── */}
      <StockChat
        locale={locale}
        stockContext={{
          ticker: upperTicker,
          name: displayName,
          price: currentPrice,
          changePct,
          pe,
          eps,
          revenue: revenueFormatted,
          netMargin,
          divYield,
          sector: company.sector,
        }}
      />
    </div>
  );
}
