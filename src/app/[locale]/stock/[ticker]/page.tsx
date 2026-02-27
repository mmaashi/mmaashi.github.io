import { createServiceClient } from "@/lib/supabase/server";
import { getCompanyQuote } from "@/lib/data-sources";
import PriceChart from "@/components/PriceChart";
import SuqaiScore from "@/components/SuqaiScore";
import { calculateScores } from "@/lib/scores";
import StockTabs from "@/components/StockTabs";
import FinancialChart from "@/components/FinancialChart";
import StockChat from "@/components/StockChat";
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
} from "lucide-react";
import { t, tSector } from "@/lib/i18n";

type Tab = "overview" | "chart" | "financials" | "dividends" | "news" | "info";

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
  const validTabs: Tab[] = ["overview", "chart", "financials", "dividends", "news", "info"];
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
      .gte("date", yearAgoStr)
      .order("date", { ascending: true }),
    supabase
      .from("financials")
      .select("earnings_per_share, year, period, net_income, revenue, total_assets, total_liabilities, debt_to_equity, current_ratio, operating_cash_flow, free_cash_flow")
      .eq("company_id", company.id)
      .order("year", { ascending: false })
      .order("period", { ascending: false })
      .limit(8),
    supabase
      .from("dividends")
      .select("amount_per_share, ex_date, payment_date")
      .eq("company_id", company.id)
      .gte("ex_date", yearAgoStr)
      .order("ex_date", { ascending: false }),
    supabase
      .from("dividends")
      .select("amount_per_share, ex_date, payment_date, currency")
      .eq("company_id", company.id)
      .order("ex_date", { ascending: false })
      .limit(12),
    supabase
      .from("news")
      .select("id, title_en, title_ar, source, source_url, published_at, sentiment_score")
      .eq("company_id", company.id)
      .order("published_at", { ascending: false })
      .limit(15),
    supabase
      .from("companies")
      .select("id, ticker, name_en, name_ar, sector")
      .eq("sector", company.sector ?? "")
      .neq("id", company.id)
      .limit(6),
  ]);

  const liveQuote      = liveQuoteResult.status     === "fulfilled" ? liveQuoteResult.value      : null;
  const latestDbPrice  = latestPriceResult.status   === "fulfilled" ? latestPriceResult.value.data : null;
  const priceHistory   = priceHistoryResult.status  === "fulfilled" ? priceHistoryResult.value.data ?? [] : [];
  const allFinancials  = financialResult.status     === "fulfilled" ? financialResult.value.data ?? [] : [];
  const financial      = allFinancials[0] ?? null;
  const recentDivs     = recentDivResult.status     === "fulfilled" ? recentDivResult.value.data ?? [] : [];
  const allDivs        = allDivResult.status        === "fulfilled" ? allDivResult.value.data ?? [] : [];
  const newsItems      = newsResult.status          === "fulfilled" ? newsResult.value.data ?? [] : [];
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
  const debtEq    = financial?.debt_to_equity  ? Number(financial.debt_to_equity)  : null;
  const currRatio = financial?.current_ratio   ? Number(financial.current_ratio)   : null;
  const ocf       = financial?.operating_cash_flow ? Number(financial.operating_cash_flow) : null;

  const netMargin = netIncome !== null && revenue !== null && revenue > 0
    ? `${((netIncome / revenue) * 100).toFixed(1)}%`
    : null;
  const revenueFormatted = revenue !== null
    ? revenue >= 1e9 ? `${(revenue / 1e9).toFixed(1)}B` : `${(revenue / 1e6).toFixed(0)}M`
    : null;

  const annualDiv  = recentDivs.reduce((s, d) => s + Number(d.amount_per_share), 0);
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

  // Fair Value estimate (simplified Graham/PE model)
  const netMarginNum = netIncome !== null && revenue !== null && revenue > 0 ? netIncome / revenue : null;
  const adjustedPE = netMarginNum !== null
    ? netMarginNum > 0.3 ? 20
    : netMarginNum > 0.2 ? 17
    : netMarginNum > 0.1 ? 14
    : 12
    : null;
  const fairValue = eps && eps > 0 && adjustedPE ? +(eps * adjustedPE).toFixed(2) : null;
  const fairValueDiff = fairValue && currentPrice ? ((fairValue - currentPrice) / fairValue) * 100 : null;
  const isUndervalued = fairValueDiff !== null && fairValueDiff > 5;
  const isOvervalued  = fairValueDiff !== null && fairValueDiff < -5;

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
  });

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
                    : "—"}
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
          {/* SŪQAI Score + Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-4 mb-5">
            {/* Score */}
            <div className="card" style={{ padding: "20px 22px" }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                     style={{ background: "var(--c-gold-dim)", border: "1px solid var(--c-gold-ring)" }}>
                  <TrendingUp size={12} style={{ color: "var(--c-gold)" }} />
                </div>
                <div>
                  <h2 className="font-bold" style={{ fontSize: 14, color: "var(--c-text)" }}>
                    {t(locale, "score.title")}
                  </h2>
                  <p style={{ fontSize: 10, color: "var(--c-muted)" }}>{t(locale, "score.subtitle")}</p>
                </div>
              </div>
              <SuqaiScore
                value={scores.value}
                growth={scores.growth}
                dividend={scores.dividend}
                health={scores.health}
                momentum={scores.momentum}
                locale={locale}
                size={200}
              />
              {pe && (
                <div className="mt-3 text-center">
                  <span className="badge font-semibold" style={{
                    fontSize: 11, padding: "4px 12px",
                    background: parseFloat(pe) < 15 ? "var(--c-green-bg)" : parseFloat(pe) < 25 ? "var(--c-gold-dim)" : "var(--c-red-bg)",
                    color: parseFloat(pe) < 15 ? "var(--c-green)" : parseFloat(pe) < 25 ? "var(--c-gold)" : "var(--c-red)",
                    borderColor: parseFloat(pe) < 15 ? "var(--c-green-ring)" : parseFloat(pe) < 25 ? "var(--c-gold-ring)" : "var(--c-red-ring)",
                  }}>
                    {parseFloat(pe) < 15 ? t(locale, "score.undervalued") : parseFloat(pe) < 25 ? t(locale, "score.fair") : t(locale, "score.overvalued")}
                  </span>
                </div>
              )}
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 content-start">
              {[
                {
                  icon: BarChart3,
                  label: t(locale, "stock.pe"),
                  value: pe ?? "—",
                  sub: eps ? `${t(locale, "stock.eps_short")}: ${sar} ${eps.toFixed(2)}` : undefined,
                  color: pe ? (parseFloat(pe) < 15 ? "var(--c-green)" : parseFloat(pe) < 25 ? "var(--c-text)" : "var(--c-red)") : "var(--c-dim)",
                },
                {
                  icon: DollarSign,
                  label: t(locale, "stock.eps"),
                  value: eps ? `${sar} ${eps.toFixed(2)}` : "—",
                  sub: financial ? `${t(locale, `stock.period.${financial.period?.toLowerCase() || "annual"}`)} ${financial.year}` : undefined,
                  color: eps ? (eps > 0 ? "var(--c-text)" : "var(--c-red)") : "var(--c-dim)",
                },
                {
                  icon: Calendar,
                  label: t(locale, "stock.div_yield"),
                  value: divYield ?? "—",
                  sub: annualDiv > 0 ? `${sar} ${annualDiv.toFixed(2)}/${t(locale, "stock.per_year")}` : undefined,
                  color: divYield ? "var(--c-green)" : "var(--c-dim)",
                },
                {
                  icon: Activity,
                  label: t(locale, "stock.52w"),
                  value: fiftyTwoHigh && fiftyTwoLow ? `${fiftyTwoLow} – ${fiftyTwoHigh}` : "—",
                  sub: fiftyTwoHigh ? sar : undefined,
                  color: fiftyTwoHigh ? "var(--c-text)" : "var(--c-dim)",
                },
                {
                  icon: TrendingUp,
                  label: t(locale, "stock.revenue_short"),
                  value: revenueFormatted ?? "—",
                  sub: financial ? `${t(locale, `stock.period.${financial.period?.toLowerCase() || "annual"}`)} ${financial.year}` : undefined,
                  color: revenueFormatted ? "var(--c-text)" : "var(--c-dim)",
                },
                {
                  icon: BarChart3,
                  label: t(locale, "stock.net_margin"),
                  value: netMargin ?? "—",
                  sub: netIncome && revenue ? `${sar} ${(netIncome / 1e9).toFixed(2)}B` : undefined,
                  color: netMargin ? (parseFloat(netMargin) > 0 ? "var(--c-green)" : "var(--c-red)") : "var(--c-dim)",
                },
              ].map(({ icon: Icon, label, value, sub, color }) => (
                <div key={label} className="card" style={{ padding: "16px 18px" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={13} style={{ color: "var(--c-muted)" }} />
                    <span style={{ fontSize: 11, color: "var(--c-muted)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      {label}
                    </span>
                  </div>
                  <span className="font-num font-bold text-lg" style={{ color }}>{value}</span>
                  {sub && <p className="font-num" style={{ fontSize: 11, color: "var(--c-dim)", marginTop: 2 }}>{sub}</p>}
                </div>
              ))}
            </div>
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

          {/* ── Fair Value Estimate ──────────────────────────── */}
          {fairValue && currentPrice && (
            <div className="card mb-5" style={{ padding: "22px 24px" }}>
              <div className="flex items-center gap-2 mb-4">
                <DollarSign size={14} style={{ color: "var(--c-gold)" }} />
                <h2 className="font-bold" style={{ fontSize: 15, color: "var(--c-text)" }}>
                  {isAr ? "التقييم العادل" : "Fair Value Estimate"}
                </h2>
                <span style={{ fontSize: 10, color: "var(--c-dim)", marginLeft: 4 }}>
                  {isAr ? "(تقدير مبسط)" : "(simplified model)"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p style={{ fontSize: 11, color: "var(--c-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                    {isAr ? "السعر الحالي" : "Current Price"}
                  </p>
                  <span className="font-num font-bold" style={{ fontSize: 22, color: "var(--c-text)" }}>
                    {sar} {currentPrice?.toFixed(2)}
                  </span>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: "var(--c-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                    {isAr ? "القيمة العادلة" : "Fair Value"}
                  </p>
                  <span className="font-num font-bold" style={{ fontSize: 22, color: isUndervalued ? "var(--c-green)" : isOvervalued ? "var(--c-red)" : "var(--c-gold)" }}>
                    {sar} {fairValue}
                  </span>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: "var(--c-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                    {isAr ? "الحالة" : "Status"}
                  </p>
                  <div>
                    <span style={{
                      display: "inline-block", padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700,
                      background: isUndervalued ? "var(--c-green-bg)" : isOvervalued ? "var(--c-red-bg)" : "var(--c-border)",
                      color: isUndervalued ? "var(--c-green)" : isOvervalued ? "var(--c-red)" : "var(--c-muted)",
                      border: `1px solid ${isUndervalued ? "var(--c-green-ring)" : isOvervalued ? "var(--c-red-ring)" : "var(--c-border)"}`,
                    }}>
                      {isUndervalued
                        ? (isAr ? `مخفّض ${Math.abs(fairValueDiff!).toFixed(0)}%` : `▲ ${Math.abs(fairValueDiff!).toFixed(0)}% Undervalued`)
                        : isOvervalued
                        ? (isAr ? `مرتفع ${Math.abs(fairValueDiff!).toFixed(0)}%` : `▼ ${Math.abs(fairValueDiff!).toFixed(0)}% Overvalued`)
                        : (isAr ? "سعر عادل" : "Fair Price")}
                    </span>
                    <p style={{ fontSize: 10, color: "var(--c-dim)", marginTop: 6 }}>
                      {isAr ? `المضاعف المستخدم: ${adjustedPE}x EPS` : `Model: EPS × ${adjustedPE}x`}
                    </p>
                  </div>
                </div>
              </div>
              <p style={{ fontSize: 10, color: "var(--c-dim)", marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--c-border)" }}>
                {isAr
                  ? "⚠️ هذا تقدير مبسط يستند إلى مضاعف الأرباح. لا يُعدّ توصية استثمارية."
                  : "⚠️ Simplified estimate based on EPS × adjusted P/E multiple. Not investment advice."}
              </p>
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
                    Income Statement
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { label: t(locale, "stock.revenue"),    val: revenue,   fmt: (v: number) => `${(v / 1e9).toFixed(2)}B`, color: "var(--c-text)" },
                      { label: t(locale, "stock.net_income"), val: netIncome, fmt: (v: number) => `${(v / 1e9).toFixed(2)}B`, color: netIncome && netIncome > 0 ? "var(--c-green)" : "var(--c-red)" },
                      { label: t(locale, "stock.eps_short"),  val: eps,       fmt: (v: number) => v.toFixed(2), color: "var(--c-text)" },
                    ].map(({ label, val, fmt, color }) => (
                      <div key={label} style={{ padding: "14px 16px", background: "var(--c-elevated)", borderRadius: "var(--radius-md)", border: "1px solid var(--c-border)" }}>
                        <p style={{ fontSize: 11, color: "var(--c-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{label}</p>
                        <span className="font-num font-bold" style={{ fontSize: 20, color: val ? color : "var(--c-dim)" }}>
                          {val ? `${sar} ${fmt(val)}` : "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Balance Sheet & Ratios */}
                <div>
                  <p style={{ fontSize: 11, color: "var(--c-muted)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
                    Balance Sheet & Ratios
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: "Debt / Equity", val: debtEq,    fmt: (v: number) => v.toFixed(2), suffix: "x",  color: debtEq && debtEq > 1 ? "var(--c-red)" : "var(--c-green)" },
                      { label: "Current Ratio", val: currRatio, fmt: (v: number) => v.toFixed(2), suffix: "x",  color: currRatio && currRatio > 1.5 ? "var(--c-green)" : "var(--c-gold)" },
                      { label: "Operating CF",  val: ocf,       fmt: (v: number) => `${(v / 1e9).toFixed(1)}B`, suffix: "", color: ocf && ocf > 0 ? "var(--c-green)" : "var(--c-red)" },
                      { label: "P/E Ratio",     val: pe ? parseFloat(pe) : null, fmt: (v: number) => v.toFixed(1), suffix: "x", color: "var(--c-text)" },
                    ].map(({ label, val, fmt, suffix, color }) => (
                      <div key={label} className="card" style={{ padding: "14px 16px" }}>
                        <p style={{ fontSize: 10, color: "var(--c-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>{label}</p>
                        <span className="font-num font-bold" style={{ fontSize: 18, color: val ? color : "var(--c-dim)" }}>
                          {val ? `${fmt(val)}${suffix}` : "—"}
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
              <FinancialChart data={allFinancials.map(f => ({
                year: f.year ?? 0,
                period: f.period ?? "annual",
                revenue: f.revenue ? Number(f.revenue) : null,
                net_income: f.net_income ? Number(f.net_income) : null,
                earnings_per_share: f.earnings_per_share ? Number(f.earnings_per_share) : null,
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
              {divYield && (
                <div className="card mb-4" style={{ padding: "20px 22px" }}>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="metric-label">{t(locale, "stock.div_yield")}</p>
                      <span className="font-num font-bold" style={{ fontSize: 28, color: "var(--c-green)" }}>{divYield}</span>
                    </div>
                    <div>
                      <p className="metric-label">Annual Dividend</p>
                      <span className="font-num font-bold" style={{ fontSize: 20, color: "var(--c-text)" }}>
                        {sar} {annualDiv.toFixed(2)}
                      </span>
                      <p style={{ fontSize: 11, color: "var(--c-dim)", marginTop: 2 }}>per share / year</p>
                    </div>
                    <div>
                      <p className="metric-label">Payments (last 12m)</p>
                      <span className="font-num font-bold" style={{ fontSize: 20, color: "var(--c-text)" }}>
                        {recentDivs.length}
                      </span>
                    </div>
                  </div>
                </div>
              )}

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
                            {d.payment_date
                              ? new Date(d.payment_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                              : "—"}
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
          fairValue,
        }}
      />
    </div>
  );
}
