import { createServiceClient } from "@/lib/supabase/server";
import { getCompanyQuote } from "@/lib/data-sources";
import PriceChart from "@/components/PriceChart";
import SuqaiScore, { calculateScores } from "@/components/SuqaiScore";
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
} from "lucide-react";
import { t, tSector } from "@/lib/i18n";

export default async function StockPage({
  params,
}: {
  params: Promise<{ locale: string; ticker: string }>;
}) {
  const { locale, ticker } = await params;
  const upperTicker = ticker.toUpperCase();
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
          <Link
            href={`/${locale}/screener`}
            className="text-sm font-semibold transition-colors hover:text-white"
            style={{ color: "var(--c-gold)", textDecoration: "none" }}
          >
            {t(locale, "stock.browse")}
          </Link>
        </div>
      </div>
    );
  }

  // ── 2. Parallel data fetch ──────────────────────────────────
  const yearAgo = new Date();
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);
  const yearAgoStr = yearAgo.toISOString().split("T")[0];

  const [liveQuoteResult, latestPriceResult, priceHistoryResult, financialResult, recentDivResult, allDivResult] =
    await Promise.allSettled([
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
        .order("date", { ascending: true })
        .limit(365),
      supabase
        .from("financials")
        .select("earnings_per_share, year, period, net_income, revenue")
        .eq("company_id", company.id)
        .order("year", { ascending: false })
        .order("period", { ascending: false })
        .limit(1)
        .single(),
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
        .limit(8),
    ]);

  // ── 3. Extract results ──────────────────────────────────────
  const liveQuote = liveQuoteResult.status === "fulfilled" ? liveQuoteResult.value : null;
  const latestDbPrice = latestPriceResult.status === "fulfilled" ? latestPriceResult.value.data : null;
  const priceHistory = priceHistoryResult.status === "fulfilled" ? priceHistoryResult.value.data ?? [] : [];
  const financial = financialResult.status === "fulfilled" ? financialResult.value.data : null;
  const recentDivs = recentDivResult.status === "fulfilled" ? recentDivResult.value.data ?? [] : [];
  const allDivs = allDivResult.status === "fulfilled" ? allDivResult.value.data ?? [] : [];

  // ── 4. Compute display values ───────────────────────────────
  const currentPrice = liveQuote?.price ?? (latestDbPrice ? Number(latestDbPrice.close) : null);
  const changeAmt = liveQuote?.change ?? null;
  const changePct = liveQuote?.change_percent ?? null;
  const isPositive = changePct !== null ? changePct >= 0 : changeAmt !== null ? changeAmt >= 0 : true;
  const volume = liveQuote?.volume ?? (latestDbPrice ? Number(latestDbPrice.volume) : null);
  const high = liveQuote?.high ?? (latestDbPrice ? Number(latestDbPrice.high) : null);
  const low = liveQuote?.low ?? (latestDbPrice ? Number(latestDbPrice.low) : null);
  const open = liveQuote?.open ?? (latestDbPrice ? Number(latestDbPrice.open) : null);

  const eps = financial?.earnings_per_share ? Number(financial.earnings_per_share) : null;
  const pe = currentPrice && eps && eps > 0 ? (currentPrice / eps).toFixed(1) : null;
  const revenue = financial?.revenue ? Number(financial.revenue) : null;
  const netIncome = financial?.net_income ? Number(financial.net_income) : null;

  const annualDiv = recentDivs.reduce((s, d) => s + Number(d.amount_per_share), 0);
  const divYield = currentPrice && annualDiv > 0 ? ((annualDiv / currentPrice) * 100).toFixed(2) + "%" : null;

  // 52W high/low — use full history
  const allHighs = priceHistory.map((p) => Number(p.high ?? p.close));
  const allLows = priceHistory.map((p) => Number(p.low ?? p.close));
  const fiftyTwoHigh = allHighs.length > 0 ? Math.max(...allHighs).toFixed(2) : null;
  const fiftyTwoLow = allLows.length > 0 ? Math.min(...allLows).toFixed(2) : null;

  const displayName = locale === "ar" && company.name_ar ? company.name_ar : company.name_en;
  const isLive = !!liveQuote;
  const sar = t(locale, "common.sar");

  // SŪQAI Score calculation
  const divYieldNum = currentPrice && annualDiv > 0 ? (annualDiv / currentPrice) * 100 : null;
  const scores = calculateScores({
    pe: pe ? parseFloat(pe) : null,
    eps,
    divYield: divYieldNum,
    revenue,
    netIncome,
    changePct,
    currentPrice,
    fiftyTwoHigh: fiftyTwoHigh ? parseFloat(fiftyTwoHigh) : null,
    fiftyTwoLow: fiftyTwoLow ? parseFloat(fiftyTwoLow) : null,
  });

  const chartData = priceHistory.map((p) => ({
    date: p.date as string,
    close: Number(p.close),
    open: p.open ? Number(p.open) : undefined,
    high: p.high ? Number(p.high) : undefined,
    low: p.low ? Number(p.low) : undefined,
  }));

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

      {/* ── Header Card ── */}
      <div className="card-gold fade-up mb-5" style={{ padding: "26px 28px" }}>
        {/* Subtle glow */}
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -60,
            width: 320,
            height: 320,
            borderRadius: "50%",
            background: isPositive ? "rgba(14,203,129,0.05)" : "rgba(246,70,93,0.05)",
            filter: "blur(60px)",
            pointerEvents: "none",
          }}
        />

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "var(--c-gold-dim)", border: "1px solid var(--c-gold-ring)" }}
              >
                <span style={{ fontSize: 10, fontWeight: 800, color: "var(--c-gold)" }}>
                  {company.ticker.slice(0, 4)}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
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
                <h1 style={{ color: "var(--c-text)", fontSize: 15, fontWeight: 600 }}>{displayName}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-1">
              {company.sector && (
                <span className="badge badge-neutral" style={{ fontSize: 10 }}>{tSector(locale, company.sector)}</span>
              )}
              {company.market && (
                <span style={{ fontSize: 11, color: "var(--c-dim)" }}>{company.market} {t(locale, "stock.market")}</span>
              )}
            </div>
          </div>

          {/* Price block */}
          {currentPrice !== null && (
            <div style={{ textAlign: "right" }}>
              <span className="font-num" style={{ fontSize: 36, fontWeight: 700, color: "var(--c-text)", lineHeight: 1, letterSpacing: "-0.02em" }}>
                {t(locale, "common.sar")} {currentPrice.toFixed(2)}
              </span>
              {changePct !== null && (
                <div className="flex items-center gap-2 justify-end mt-1">
                  <span className={`font-num font-semibold text-lg ${isPositive ? "text-up" : "text-down"}`}>
                    {isPositive ? "+" : ""}{changeAmt?.toFixed(2)}
                  </span>
                  <span className={`badge font-num ${isPositive ? "badge-up" : "badge-down"}`}>
                    {isPositive ? "+" : ""}{changePct?.toFixed(2)}%
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* OHLCV row */}
        {currentPrice !== null && (
          <div
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-4"
            style={{ borderTop: "1px solid var(--c-border)" }}
          >
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
                <span className="font-num font-semibold" style={{ color, fontSize: 14 }}>
                  {val !== null
                    ? isVol
                      ? val >= 1e6
                        ? `${(val / 1e6).toFixed(1)}M`
                        : `${(val / 1e3).toFixed(0)}K`
                      : `${sar} ${val.toFixed(2)}`
                    : "N/A"}
                </span>
              </div>
            ))}
          </div>
        )}

        {currentPrice === null && (
          <p style={{ color: "var(--c-muted)", fontSize: 14, marginTop: 8 }}>{t(locale, "stock.price_unavail")}</p>
        )}
      </div>

      {/* ── SŪQAI Score + Key Metrics ── */}
      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-4 mb-5">
        {/* Snowflake Score */}
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
          {/* Value assessment */}
          {pe && (
            <div className="mt-3 text-center">
              <span
                className="badge font-semibold"
                style={{
                  fontSize: 11,
                  padding: "4px 12px",
                  background: parseFloat(pe) < 15 ? "var(--c-green-bg)" : parseFloat(pe) < 25 ? "var(--c-gold-dim)" : "var(--c-red-bg)",
                  color: parseFloat(pe) < 15 ? "var(--c-green)" : parseFloat(pe) < 25 ? "var(--c-gold)" : "var(--c-red)",
                  borderColor: parseFloat(pe) < 15 ? "var(--c-green-ring)" : parseFloat(pe) < 25 ? "var(--c-gold-ring)" : "var(--c-red-ring)",
                }}
              >
                {parseFloat(pe) < 15
                  ? t(locale, "score.undervalued")
                  : parseFloat(pe) < 25
                  ? t(locale, "score.fair")
                  : t(locale, "score.overvalued")}
              </span>
            </div>
          )}
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 content-start">
        {[
          {
            icon: BarChart3,
            label: t(locale, "stock.pe"),
            value: pe ?? t(locale, "common.na"),
            sub: eps ? `${t(locale, "stock.eps_short")}: ${sar} ${eps.toFixed(2)}` : undefined,
            color: pe ? "var(--c-text)" : "var(--c-dim)",
          },
          {
            icon: DollarSign,
            label: t(locale, "stock.eps"),
            value: eps ? eps.toFixed(2) : t(locale, "common.na"),
            sub: financial ? `${t(locale, `stock.period.${financial.period?.toLowerCase() || "annual"}`)} ${financial.year}` : undefined,
            color: eps ? "var(--c-text)" : "var(--c-dim)",
          },
          {
            icon: Calendar,
            label: t(locale, "stock.div_yield"),
            value: divYield ?? t(locale, "common.na"),
            sub: annualDiv > 0 ? `${sar} ${annualDiv.toFixed(2)}/${t(locale, "stock.per_year")}` : undefined,
            color: divYield ? "var(--c-green)" : "var(--c-dim)",
          },
          {
            icon: Activity,
            label: t(locale, "stock.52w"),
            value: fiftyTwoHigh && fiftyTwoLow ? `${fiftyTwoLow} – ${fiftyTwoHigh}` : t(locale, "common.na"),
            sub: fiftyTwoHigh ? t(locale, "common.sar") : undefined,
            color: fiftyTwoHigh ? "var(--c-text)" : "var(--c-dim)",
          },
        ].map(({ icon: Icon, label, value, sub, color }) => (
          <div key={label} className="card" style={{ padding: "16px 18px" }}>
            <div className="flex items-center gap-2 mb-2">
              <Icon size={13} style={{ color: "var(--c-muted)" }} />
              <span style={{ fontSize: 11, color: "var(--c-muted)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {label}
              </span>
            </div>
            <span className="font-num font-bold text-lg" style={{ color }}>
              {value}
            </span>
            {sub && (
              <p className="font-num" style={{ fontSize: 11, color: "var(--c-dim)", marginTop: 2 }}>
                {sub}
              </p>
            )}
          </div>
        ))}
        </div>
      </div>

      {/* ── Price Chart ── */}
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
      </section>

      {/* ── Financials ── */}
      {financial && (revenue || netIncome || eps) && (
        <section className="mb-4">
          <div className="card" style={{ padding: "20px 22px" }}>
            <div className="flex items-center gap-2 mb-4">
              <Building2 size={14} style={{ color: "var(--c-gold)" }} />
              <h2 className="font-bold" style={{ fontSize: 15, color: "var(--c-text)" }}>
                {t(locale, "stock.financials")} — {t(locale, `stock.period.${financial.period?.toLowerCase() || "annual"}`)} {financial.year}
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div style={{ padding: "12px 0" }}>
                <p style={{ fontSize: 11, color: "var(--c-muted)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>
                  {t(locale, "stock.revenue")}
                </p>
                <span className="font-num font-bold text-lg" style={{ color: revenue && revenue > 0 ? "var(--c-text)" : "var(--c-dim)" }}>
                  {revenue && revenue > 0 ? `${sar} ${(revenue / 1e9).toFixed(2)}B` : t(locale, "common.na")}
                </span>
              </div>
              <div style={{ padding: "12px 0" }}>
                <p style={{ fontSize: 11, color: "var(--c-muted)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>
                  {t(locale, "stock.net_income")}
                </p>
                <span className="font-num font-bold text-lg" style={{ color: netIncome && netIncome > 0 ? "var(--c-text)" : "var(--c-dim)" }}>
                  {netIncome && netIncome !== 0 ? `${sar} ${(netIncome / 1e9).toFixed(2)}B` : t(locale, "common.na")}
                </span>
              </div>
              <div style={{ padding: "12px 0" }}>
                <p style={{ fontSize: 11, color: "var(--c-muted)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>
                  {t(locale, "stock.eps_short")}
                </p>
                <span className="font-num font-bold text-lg" style={{ color: eps ? "var(--c-text)" : "var(--c-dim)" }}>
                  {eps ? `${sar} ${eps.toFixed(2)}` : t(locale, "common.na")}
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Liquidity Flow ── */}
      {liveQuote?.liquidity && liveQuote.liquidity.inflow_value != null && (
        <section className="mb-5">
          <div className="card" style={{ padding: "22px 24px" }}>
            <div className="flex items-center gap-2 mb-4">
              <Droplets size={14} style={{ color: "var(--c-gold)" }} />
              <div>
                <h2 className="font-bold" style={{ fontSize: 15, color: "var(--c-text)", fontFamily: "var(--font-grotesk)" }}>
                  {t(locale, "stock.liquidity")}
                </h2>
                <p style={{ fontSize: 11, color: "var(--c-muted)" }}>{t(locale, "stock.liquidity_subtitle")}</p>
              </div>
            </div>

            {/* Inflow / Outflow bars */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Inflow */}
              <div style={{ padding: "14px 16px", background: "var(--c-green-bg)", borderRadius: "var(--radius-md)", border: "1px solid var(--c-green-ring)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <ArrowUpRight size={14} style={{ color: "var(--c-green)" }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--c-green)", letterSpacing: "0.05em" }}>
                    {t(locale, "stock.inflow")}
                  </span>
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
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--c-red)", letterSpacing: "0.05em" }}>
                    {t(locale, "stock.outflow")}
                  </span>
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

            {/* Net flow + Bid/Ask */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3" style={{ borderTop: "1px solid var(--c-border)", paddingTop: 14 }}>
              <div>
                <p className="metric-label">{t(locale, "stock.net_flow")}</p>
                <span className="font-num font-bold" style={{
                  fontSize: 15,
                  color: liveQuote.liquidity.net_value >= 0 ? "var(--c-green)" : "var(--c-red)",
                }}>
                  {liveQuote.liquidity.net_value >= 0 ? "+" : ""}{(liveQuote.liquidity.net_value / 1e6).toFixed(1)}M
                </span>
              </div>
              <div>
                <p className="metric-label">{t(locale, "stock.bid")}</p>
                <span className="font-num font-bold" style={{ color: "var(--c-text)", fontSize: 15 }}>
                  {sar} {(liveQuote.bid ?? 0).toFixed(2)}
                </span>
              </div>
              <div>
                <p className="metric-label">{t(locale, "stock.ask")}</p>
                <span className="font-num font-bold" style={{ color: "var(--c-text)", fontSize: 15 }}>
                  {sar} {(liveQuote.ask ?? 0).toFixed(2)}
                </span>
              </div>
              <div>
                <p className="metric-label">{t(locale, "stock.prev_close")}</p>
                <span className="font-num font-bold" style={{ color: "var(--c-muted)", fontSize: 15 }}>
                  {sar} {(liveQuote.previous_close ?? 0).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Flow bar visualization */}
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
        </section>
      )}

      {/* ── Dividend History ── */}
      {allDivs.length > 0 && (
        <section className="mb-5">
          <div className="card overflow-hidden">
            <div
              className="flex items-center gap-2 px-5 py-3"
              style={{ borderBottom: "1px solid var(--c-border)", background: "var(--c-elevated)" }}
            >
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
                        {new Date(d.ex_date + "T00:00:00").toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
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
                          ? new Date(d.payment_date + "T00:00:00").toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })
                          : "N/A"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Company Info ── */}
      {(company.description_en || company.description_ar || company.ceo_name_en || company.website_url || company.employee_count || company.founded_year) && (
        <section className="mb-4">
          <div className="card" style={{ padding: "20px 22px" }}>
            <div className="flex items-center gap-2 mb-4">
              <Info size={14} style={{ color: "var(--c-gold)" }} />
              <h2 className="font-bold" style={{ fontSize: 15, color: "var(--c-text)" }}>
                {t(locale, "stock.company_info")}
              </h2>
            </div>

            {/* Description */}
            {(locale === "ar" ? company.description_ar : company.description_en) && (
              <div className="mb-4">
                <p style={{ fontSize: 11, color: "var(--c-muted)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
                  {t(locale, "stock.about_company")}
                </p>
                <p style={{ fontSize: 13, color: "var(--c-text-sm)", lineHeight: 1.6 }}>
                  {locale === "ar" ? company.description_ar : company.description_en}
                </p>
              </div>
            )}

            {/* Details grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4" style={{ borderTop: "1px solid var(--c-border)", paddingTop: 16 }}>
              {company.sector && (
                <div>
                  <p style={{ fontSize: 11, color: "var(--c-muted)", fontWeight: 600, marginBottom: 4 }}>
                    {t(locale, "screener.col.sector")}
                  </p>
                  <span style={{ fontSize: 13, color: "var(--c-text)" }}>{tSector(locale, company.sector)}</span>
                </div>
              )}
              {(locale === "ar" ? company.ceo_name_ar : company.ceo_name_en) && (
                <div>
                  <p style={{ fontSize: 11, color: "var(--c-muted)", fontWeight: 600, marginBottom: 4 }}>
                    {t(locale, "stock.ceo")}
                  </p>
                  <span style={{ fontSize: 13, color: "var(--c-text)" }}>
                    {locale === "ar" ? company.ceo_name_ar : company.ceo_name_en}
                  </span>
                </div>
              )}
              {company.founded_year && (
                <div>
                  <p style={{ fontSize: 11, color: "var(--c-muted)", fontWeight: 600, marginBottom: 4 }}>
                    {t(locale, "stock.founded")}
                  </p>
                  <span className="font-num" style={{ fontSize: 13, color: "var(--c-text)" }}>{company.founded_year}</span>
                </div>
              )}
              {company.employee_count && (
                <div>
                  <p style={{ fontSize: 11, color: "var(--c-muted)", fontWeight: 600, marginBottom: 4 }}>
                    {t(locale, "stock.employees")}
                  </p>
                  <span className="font-num" style={{ fontSize: 13, color: "var(--c-text)" }}>
                    {Number(company.employee_count).toLocaleString()}
                  </span>
                </div>
              )}
              {company.website_url && (
                <div>
                  <p style={{ fontSize: 11, color: "var(--c-muted)", fontWeight: 600, marginBottom: 4 }}>
                    {t(locale, "stock.website")}
                  </p>
                  {(() => {
                    const rawUrl = company.website_url!;
                    const fullUrl = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;
                    let displayHost = rawUrl;
                    try { displayHost = new URL(fullUrl).hostname.replace("www.", ""); } catch {}
                    return (
                      <a href={fullUrl} target="_blank" rel="noopener noreferrer"
                         className="flex items-center gap-1 text-sm transition-colors hover:text-white"
                         style={{ color: "var(--c-gold)", textDecoration: "none" }}>
                        <Globe size={12} />
                        {displayHost}
                      </a>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Back link */}
      <div className="mb-4 mt-8">
        <Link
          href={`/${locale}/screener`}
          className="btn btn-primary"
          style={{ textDecoration: "none" }}
        >
          <ArrowLeft size={14} />
          {t(locale, "stock.back_btn")}
        </Link>
      </div>

      <hr className="gold-line my-10" />
      <p style={{ fontSize: 11, color: "var(--c-dim)", textAlign: "center", letterSpacing: "0.02em" }}>
        {t(locale, "common.disclaimer")}
      </p>
    </div>
  );
}
