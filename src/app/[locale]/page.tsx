import { getMarketSummary, getTopGainers, getTopLosers } from "@/lib/data-sources";
import { createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Suspense } from "react";
import {
  TrendingUp, TrendingDown, Minus, Activity,
  ArrowUpRight, ArrowDownRight, Newspaper,
  SlidersHorizontal, CalendarDays, Search,
  BarChart3, Star, Filter, DollarSign,
  Database, Brain, Briefcase, ShieldCheck,
  Home,
} from "lucide-react";
import { t, tMood, tSector } from "@/lib/i18n";
import SectorHeatMap from "@/components/SectorHeatMap";

// ════════════════════════════════════════════════════════════════
// Helpers — compute SŪQAI score & fetch stock fundamentals
// ════════════════════════════════════════════════════════════════

interface StockFundamentals {
  ticker: string;
  nameEn: string;
  nameAr: string;
  sector: string;
  score: number | null;
  latestPrice: number | null;
  priceChange: number | null;
  divYield: string | null;
  peRatio: number | null;
  roe: number | null;
  debtToEquity: number | null;
  verdictKey: string;
  pillars: {
    value: number | null;
    growth: number | null;
    momentum: number | null;
    health: number | null;
    dividends: number | null;
  };
}

/** Clamp a pillar score to 0–100 range */
function clamp(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)));
}

/** Compute a basic SŪQAI score from available fundamentals */
function computeScore(fin: any, divYieldPct: number | null, priceChange: number | null): {
  total: number | null;
  pillars: StockFundamentals["pillars"];
} {
  const pillars = { value: null as number | null, growth: null as number | null, momentum: null as number | null, health: null as number | null, dividends: null as number | null };
  let count = 0;
  let sum = 0;

  // Value pillar: based on P/E ratio (lower is better, <15 = 90, >40 = 20)
  if (fin?.pe_ratio != null && fin.pe_ratio > 0) {
    pillars.value = clamp(100 - (fin.pe_ratio - 5) * 2);
    sum += pillars.value; count++;
  }

  // Growth pillar: based on EPS (positive = good) + revenue growth proxy
  if (fin?.earnings_per_share != null) {
    const epsScore = fin.earnings_per_share > 0 ? clamp(50 + fin.earnings_per_share * 5) : clamp(30 - Math.abs(fin.earnings_per_share) * 3);
    pillars.growth = epsScore;
    sum += pillars.growth; count++;
  }

  // Momentum pillar: based on daily price change
  if (priceChange != null) {
    pillars.momentum = clamp(50 + priceChange * 10);
    sum += pillars.momentum; count++;
  }

  // Health pillar: based on debt-to-equity and ROE
  if (fin?.debt_to_equity != null || fin?.roe != null) {
    let healthScore = 50;
    if (fin.debt_to_equity != null) healthScore += fin.debt_to_equity < 1 ? 20 : fin.debt_to_equity < 2 ? 0 : -20;
    if (fin.roe != null) healthScore += fin.roe > 0.15 ? 20 : fin.roe > 0.08 ? 10 : 0;
    pillars.health = clamp(healthScore);
    sum += pillars.health; count++;
  }

  // Dividends pillar: based on yield
  if (divYieldPct != null && divYieldPct > 0) {
    pillars.dividends = clamp(divYieldPct * 15); // 6.7% yield = 100
    sum += pillars.dividends; count++;
  }

  const total = count >= 2 ? Math.round(sum / count) : null;
  return { total, pillars };
}

/** Fetch fundamentals for a set of tickers */
async function fetchFundamentals(tickers: string[], verdictKeys: string[]): Promise<StockFundamentals[]> {
  const supabase = createServiceClient();

  // Fetch companies
  const { data: companies } = await supabase
    .from("companies")
    .select("id, ticker, name_en, name_ar, sector")
    .in("ticker", tickers);

  const companyMap = new Map((companies || []).map(c => [c.ticker, c]));
  const companyIds = (companies || []).map(c => c.id);

  // Fetch latest financials per company (most recent year)
  const { data: financials } = await supabase
    .from("financials")
    .select("company_id, pe_ratio, pb_ratio, earnings_per_share, debt_to_equity, current_ratio, roe, book_value_per_share, revenue, net_income")
    .in("company_id", companyIds)
    .order("year", { ascending: false })
    .limit(tickers.length * 2);

  // Deduplicate — keep latest per company_id
  const finMap = new Map<string, any>();
  for (const f of financials || []) {
    if (!finMap.has(f.company_id)) finMap.set(f.company_id, f);
  }

  // Fetch recent dividends (last 2 years)
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
  const { data: dividends } = await supabase
    .from("dividends")
    .select("company_id, amount_per_share, ex_date")
    .in("company_id", companyIds)
    .gte("ex_date", twoYearsAgo.toISOString().split("T")[0])
    .order("ex_date", { ascending: false });

  // Sum dividends per company for annual yield
  const divMap = new Map<string, number>();
  for (const d of dividends || []) {
    divMap.set(d.company_id, (divMap.get(d.company_id) || 0) + d.amount_per_share);
  }

  // Fetch latest stock price per company
  const { data: prices } = await supabase
    .from("stock_prices")
    .select("company_id, close, open, date")
    .in("company_id", companyIds)
    .order("date", { ascending: false })
    .limit(tickers.length * 2);

  const priceMap = new Map<string, any>();
  for (const p of prices || []) {
    if (!priceMap.has(p.company_id)) priceMap.set(p.company_id, p);
  }

  // Assemble results
  return tickers.map((ticker, i) => {
    const comp = companyMap.get(ticker);
    const compId = comp?.id;
    const fin = compId ? finMap.get(compId) : null;
    const latestPrice = compId ? priceMap.get(compId) : null;
    const totalDivs = compId ? divMap.get(compId) : null;

    const price = latestPrice?.close ?? null;
    const priceChange = latestPrice && latestPrice.open > 0
      ? ((latestPrice.close - latestPrice.open) / latestPrice.open) * 100
      : null;
    const divYieldPct = (totalDivs && price && price > 0) ? (totalDivs / price) * 100 : null;

    const { total, pillars } = computeScore(fin, divYieldPct, priceChange);

    return {
      ticker,
      nameEn: comp?.name_en || ticker,
      nameAr: comp?.name_ar || ticker,
      sector: comp?.sector || "",
      score: total,
      latestPrice: price,
      priceChange,
      divYield: divYieldPct != null ? `${divYieldPct.toFixed(1)}%` : null,
      peRatio: fin?.pe_ratio ?? null,
      roe: fin?.roe ?? null,
      debtToEquity: fin?.debt_to_equity ?? null,
      verdictKey: verdictKeys[i] || "featured.verdict1",
      pillars,
    };
  });
}

// ════════════════════════════════════════════════════════════════
// Section 2 — Hero
// ════════════════════════════════════════════════════════════════
/** Reusable shimmer skeleton for Suspense fallbacks */
function SkeletonCard({ height = 200 }: { height?: number }) {
  return (
    <div
      className="card animate-pulse"
      style={{
        height,
        marginBottom: 24,
        background: "var(--c-card)",
        borderRadius: 16,
      }}
    />
  );
}

function HeroSection({ locale, heroStock }: { locale: string; heroStock: StockFundamentals | null }) {
  const isAr = locale === "ar";
  const sar = t(locale, "common.sar");
  const na = t(locale, "common.na");
  return (
    <section className="fade-up" style={{ paddingTop: 32, paddingBottom: 8 }}>
      <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
        {/* Left: copy + CTAs */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1
            className="font-bold tracking-tight"
            style={{
              fontSize: 34,
              fontFamily: "var(--font-grotesk)",
              letterSpacing: "-0.03em",
              lineHeight: 1.2,
              color: "var(--c-text)",
              marginBottom: 14,
            }}
          >
            {t(locale, "hero.headline")}
          </h1>
          <p style={{ fontSize: 14, color: "var(--c-muted)", lineHeight: 1.75, maxWidth: 480, marginBottom: 24 }}>
            {t(locale, "hero.subheadline")}
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href={`/${locale}/screener`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all"
              style={{
                background: "var(--c-gold)",
                color: "var(--c-base)",
                textDecoration: "none",
                fontFamily: "var(--font-grotesk)",
              }}
            >
              {t(locale, "hero.cta_primary")}
              <ArrowUpRight size={14} style={isAr ? { transform: "scaleX(-1)" } : undefined} />
            </Link>
            <Link
              href={`/${locale}/portfolio`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all"
              style={{
                background: "transparent",
                color: "var(--c-gold)",
                border: "1px solid var(--c-gold-ring)",
                textDecoration: "none",
                fontFamily: "var(--font-grotesk)",
              }}
            >
              <Briefcase size={13} />
              {t(locale, "hero.cta_secondary")}
            </Link>
          </div>
        </div>

        {/* Right: featured stock mini-card */}
        {heroStock && (
          <Link
            href={`/${locale}/stock/${heroStock.ticker}`}
            className="card shrink-0 w-full md:w-auto group"
            style={{
              maxWidth: 280,
              padding: "18px 20px",
              border: "1px solid var(--c-gold-ring)",
              background: "linear-gradient(135deg, var(--c-surface), var(--c-elevated))",
              textDecoration: "none",
              transition: "all 0.2s",
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Star size={12} style={{ color: "var(--c-gold)" }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: "var(--c-gold)", letterSpacing: "0.06em" }}>
                {isAr ? "سهم مميز" : "FEATURED"}
              </span>
            </div>
            <p className="font-bold" style={{ fontSize: 15, color: "var(--c-text)", fontFamily: "var(--font-grotesk)" }}>
              {isAr ? heroStock.nameAr : heroStock.nameEn}
            </p>
            <p className="font-num" style={{ fontSize: 11, color: "var(--c-muted)", marginBottom: 10 }}>{heroStock.ticker}</p>
            <div className="flex items-center gap-4 mb-2">
              <div>
                <span style={{ fontSize: 9, color: "var(--c-dim)", fontWeight: 600 }}>{t(locale, "score.label")}</span>
                <p className="font-num font-bold" style={{ fontSize: 16, color: "var(--c-gold)" }}>
                  {heroStock.score ?? na}
                </p>
              </div>
              <div style={{ width: 1, height: 28, background: "var(--c-border)" }} />
              <div>
                <span style={{ fontSize: 9, color: "var(--c-dim)", fontWeight: 600 }}>{t(locale, "featured.fair_value")}</span>
                <p className="font-num font-bold" style={{ fontSize: 14, color: "var(--c-text)" }}>
                  {heroStock.latestPrice != null ? `${heroStock.latestPrice.toFixed(2)} ${sar}` : na}
                </p>
              </div>
              <div style={{ width: 1, height: 28, background: "var(--c-border)" }} />
              <div>
                <span style={{ fontSize: 9, color: "var(--c-dim)", fontWeight: 600 }}>{t(locale, "featured.div_yield")}</span>
                <p className="font-num font-bold" style={{ fontSize: 14, color: "var(--c-green)" }}>
                  {heroStock.divYield ?? na}
                </p>
              </div>
            </div>
            <p style={{ fontSize: 11, color: "var(--c-muted)", lineHeight: 1.5, fontStyle: "italic" }}>
              {t(locale, "hero.featured_note")}
            </p>
          </Link>
        )}
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════
// Section 3 — Search
// ════════════════════════════════════════════════════════════════
function SearchSection({ locale }: { locale: string }) {
  const chips = [
    { key: "aramco", ticker: "2222" },
    { key: "alrajhi", ticker: "1120" },
    { key: "stc", ticker: "7010" },
    { key: "sabic", ticker: "2010" },
    { key: "acwa", ticker: "2082" },
  ];
  return (
    <section className="fade-up" style={{ marginBottom: 28 }}>
      {/* Search bar — links to screener with search focus */}
      <Link
        href={`/${locale}/screener`}
        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-colors"
        style={{
          background: "var(--c-surface)",
          border: "1px solid var(--c-border)",
          textDecoration: "none",
          marginBottom: 10,
        }}
      >
        <Search size={16} style={{ color: "var(--c-muted)", flexShrink: 0 }} />
        <span style={{ fontSize: 13, color: "var(--c-dim)" }}>
          {t(locale, "search.placeholder")}
        </span>
      </Link>
      {/* Quick chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {chips.map(({ key, ticker }) => (
          <Link
            key={ticker}
            href={`/${locale}/stock/${ticker}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            style={{
              background: "var(--c-elevated)",
              border: "1px solid var(--c-border)",
              color: "var(--c-text-sm)",
              textDecoration: "none",
            }}
          >
            <span style={{ color: "var(--c-dim)", fontSize: 10 }}>{ticker}</span>
            {t(locale, `search.chip.${key}`)}
          </Link>
        ))}
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════
// Section 4 — "What you can do with SŪQAI" (4 product cards)
// ════════════════════════════════════════════════════════════════
function FeaturesSection({ locale }: { locale: string }) {
  const cards = [
    { num: 1, icon: BarChart3, color: "var(--c-gold)", bg: "var(--c-gold-dim)", ring: "var(--c-gold-ring)", href: `/${locale}/screener` },
    { num: 2, icon: Star,      color: "var(--c-gold)", bg: "var(--c-gold-dim)", ring: "var(--c-gold-ring)", href: `/${locale}/screener` },
    { num: 3, icon: CalendarDays, color: "var(--c-green)", bg: "var(--c-green-bg)", ring: "var(--c-green-ring)", href: `/${locale}/calendar` },
    { num: 4, icon: Briefcase,   color: "#60a5fa",      bg: "rgba(96,165,250,0.08)", ring: "rgba(96,165,250,0.2)", href: `/${locale}/portfolio` },
  ];

  return (
    <section className="fade-up" style={{ marginBottom: 32 }}>
      <h2
        className="font-bold mb-4"
        style={{ fontSize: 16, color: "var(--c-text)", fontFamily: "var(--font-grotesk)" }}
      >
        {t(locale, "features.title")}
      </h2>
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 stagger">
        {cards.map(({ num, icon: Icon, color, bg, ring, href }) => (
          <Link
            key={num}
            href={href}
            className="card group"
            style={{ padding: "18px 18px", textDecoration: "none", transition: "all 0.2s" }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
              style={{ background: bg, border: `1px solid ${ring}` }}
            >
              <Icon size={16} style={{ color }} />
            </div>
            <h3 className="font-semibold mb-1" style={{ fontSize: 13, color: "var(--c-text)", fontFamily: "var(--font-grotesk)" }}>
              {t(locale, `features.card${num}.title`)}
            </h3>
            <p style={{ fontSize: 11, color: "var(--c-muted)", lineHeight: 1.55 }}>
              {t(locale, `features.card${num}.desc`)}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════
// Section 5 — Featured Stock Analysis (3 cards)
// ════════════════════════════════════════════════════════════════
function FeaturedAnalysis({ locale, stocks }: { locale: string; stocks: StockFundamentals[] }) {
  const isAr = locale === "ar";
  const sar = t(locale, "common.sar");
  const na = t(locale, "common.na");

  return (
    <section className="fade-up" style={{ marginBottom: 32 }}>
      <h2
        className="font-bold mb-4"
        style={{ fontSize: 16, color: "var(--c-text)", fontFamily: "var(--font-grotesk)" }}
      >
        {t(locale, "featured.title")}
      </h2>
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3 stagger">
        {stocks.map((f) => (
          <Link
            key={f.ticker}
            href={`/${locale}/stock/${f.ticker}`}
            className="card group"
            style={{ padding: "18px 18px", textDecoration: "none", transition: "all 0.2s" }}
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-bold" style={{ fontSize: 14, color: "var(--c-text)", fontFamily: "var(--font-grotesk)" }}>
                  {isAr ? f.nameAr : f.nameEn}
                </p>
                <p className="font-num" style={{ fontSize: 11, color: "var(--c-dim)" }}>{f.ticker}</p>
              </div>
              <div
                className="flex items-center justify-center rounded-lg"
                style={{
                  width: 38, height: 38,
                  background: "var(--c-gold-dim)",
                  border: "1px solid var(--c-gold-ring)",
                }}
              >
                <span className="font-num font-bold" style={{ fontSize: 15, color: "var(--c-gold)" }}>
                  {f.score ?? na}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <div>
                <span style={{ fontSize: 9, color: "var(--c-dim)", fontWeight: 600 }}>{t(locale, "featured.fair_value")}</span>
                <p className="font-num font-semibold" style={{ fontSize: 13, color: "var(--c-text)" }}>
                  {f.latestPrice != null ? `${f.latestPrice.toFixed(2)} ${sar}` : na}
                </p>
              </div>
              <div style={{ width: 1, height: 24, background: "var(--c-border)" }} />
              <div>
                <span style={{ fontSize: 9, color: "var(--c-dim)", fontWeight: 600 }}>{t(locale, "featured.div_yield")}</span>
                <p className="font-num font-semibold" style={{ fontSize: 13, color: "var(--c-green)" }}>
                  {f.divYield ?? na}
                </p>
              </div>
            </div>
            {/* Pillar mini-bars */}
            {f.pillars && (
              <div className="flex items-center gap-1 mt-3" style={{ height: 4 }}>
                {(["value", "growth", "momentum", "health", "dividends"] as const).map((k) => {
                  const v = f.pillars[k];
                  const pct = v != null ? Math.min(100, Math.max(0, v)) : 0;
                  return (
                    <div key={k} style={{ flex: 1, height: 4, borderRadius: 2, background: "var(--c-border)", overflow: "hidden" }}>
                      <div style={{
                        width: `${pct}%`,
                        height: "100%",
                        borderRadius: 2,
                        background: pct >= 70 ? "var(--c-green)" : pct >= 40 ? "var(--c-gold)" : "var(--c-red)",
                      }} />
                    </div>
                  );
                })}
              </div>
            )}
            {/* Verdict line */}
            <p style={{ fontSize: 11, color: "var(--c-muted)", lineHeight: 1.5, marginTop: 8 }}>
              {t(locale, f.verdictKey)}
            </p>
            {/* CTA button */}
            <span
              className="inline-flex items-center mt-3 px-4 py-1.5 rounded-lg font-semibold"
              style={{
                fontSize: 11,
                color: "var(--c-base)",
                background: "var(--c-gold)",
                fontFamily: "var(--font-grotesk)",
              }}
            >
              {t(locale, "featured.view")} {isAr ? "←" : "→"}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════
// Section 6 — Market Snapshot
// ════════════════════════════════════════════════════════════════
async function MarketSnapshot({ locale }: { locale: string }) {
  try {
    const s = await getMarketSummary();
    const isUp = s.index_change >= 0;
    const total = (s.advancing || 0) + (s.declining || 0) + (s.unchanged || 0);
    const advPct = total > 0 ? ((s.advancing / total) * 100).toFixed(0) : "0";

    const summaryKey = isUp ? "market.summary_up" : "market.summary_down";
    const summary = t(locale, summaryKey)
      .replace("{pct}", Math.abs(s.index_change_percent).toFixed(2))
      .replace("{adv}", String(s.advancing || 0))
      .replace("{dec}", String(s.declining || 0));

    return (
      <section className="fade-up" style={{ marginBottom: 32 }}>
        <h2
          className="font-bold mb-4"
          style={{ fontSize: 16, color: "var(--c-text)", fontFamily: "var(--font-grotesk)" }}
        >
          {t(locale, "snapshot.title")}
        </h2>

        <div className="card" style={{ padding: "20px 24px", position: "relative", overflow: "hidden" }}>
          {/* Ambient glow */}
          <div style={{
            position: "absolute", top: -60, right: -40,
            width: 240, height: 240, borderRadius: "50%",
            background: isUp ? "rgba(14,203,129,0.04)" : "rgba(246,70,93,0.04)",
            filter: "blur(50px)", pointerEvents: "none",
          }} />

          {/* Top row — TASI + change */}
          <div className="flex items-center gap-3 mb-4">
            <Activity size={14} style={{ color: "var(--c-muted)" }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--c-muted)", letterSpacing: "0.08em" }}>
              {t(locale, "snapshot.tasi")}
            </span>
          </div>

          <div className="flex flex-wrap items-end gap-4 mb-4">
            <span className="font-num" style={{ fontSize: 36, fontWeight: 700, lineHeight: 1, color: "var(--c-text)", letterSpacing: "-0.02em" }}>
              {s.index_value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <div className="flex flex-col pb-0.5">
              <span className={`font-num font-bold text-lg ${isUp ? "text-up" : "text-down"}`}>
                {isUp ? "+" : ""}{s.index_change.toFixed(2)}
              </span>
              <span className={`font-num font-semibold text-sm ${isUp ? "text-up" : "text-down"}`}>
                {isUp ? "+" : ""}{s.index_change_percent.toFixed(2)}%
              </span>
            </div>
          </div>

          {/* Stat chips row */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            {/* Breadth */}
            <div className="stat-card" style={{ padding: "10px 12px" }}>
              <span style={{ fontSize: 9, color: "var(--c-dim)", fontWeight: 600, letterSpacing: "0.05em" }}>
                {t(locale, "snapshot.breadth")}
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-num font-bold" style={{ color: "var(--c-green)", fontSize: 14 }}>
                  <ArrowUpRight size={11} style={{ display: "inline" }} /> {s.advancing}
                </span>
                <span className="font-num font-bold" style={{ color: "var(--c-red)", fontSize: 14 }}>
                  <ArrowDownRight size={11} style={{ display: "inline" }} /> {s.declining}
                </span>
              </div>
            </div>

            {/* Unchanged */}
            <div className="stat-card" style={{ padding: "10px 12px" }}>
              <span style={{ fontSize: 9, color: "var(--c-dim)", fontWeight: 600, letterSpacing: "0.05em" }}>
                {t(locale, "market.unchanged")}
              </span>
              <p className="font-num font-bold mt-1" style={{ fontSize: 14, color: "var(--c-text)" }}>{s.unchanged}</p>
            </div>

            {/* Volume */}
            <div className="stat-card" style={{ padding: "10px 12px" }}>
              <span style={{ fontSize: 9, color: "var(--c-dim)", fontWeight: 600, letterSpacing: "0.05em" }}>
                {t(locale, "market.volume")}
              </span>
              <p className="font-num font-bold mt-1" style={{ fontSize: 14, color: "var(--c-text)" }}>
                {(s.total_volume / 1e9).toFixed(2)} {t(locale, "common.billion")}
              </p>
            </div>

            {/* Traded Value */}
            {s.total_value != null && (
              <div className="stat-card" style={{ padding: "10px 12px" }}>
                <span style={{ fontSize: 9, color: "var(--c-dim)", fontWeight: 600, letterSpacing: "0.05em" }}>
                  {t(locale, "snapshot.traded")}
                </span>
                <p className="font-num font-bold mt-1" style={{ fontSize: 14, color: "var(--c-text)" }}>
                  {(s.total_value / 1e9).toFixed(2)} {t(locale, "common.billion")} {t(locale, "common.sar")}
                </p>
              </div>
            )}

            {/* Top Sector */}
            {s.top_sector && (
              <div className="stat-card" style={{ padding: "10px 12px" }}>
                <span style={{ fontSize: 9, color: "var(--c-dim)", fontWeight: 600, letterSpacing: "0.05em" }}>
                  {t(locale, "snapshot.top_sector")}
                </span>
                <p className="font-bold mt-1" style={{ fontSize: 13, color: "var(--c-gold)" }}>
                  {tSector(locale, s.top_sector)}
                </p>
              </div>
            )}

            {/* Market Mood */}
            <div className="stat-card" style={{ padding: "10px 12px" }}>
              <span style={{ fontSize: 9, color: "var(--c-dim)", fontWeight: 600, letterSpacing: "0.05em" }}>
                {t(locale, "market.mood")}
              </span>
              <p className="font-bold mt-1" style={{ fontSize: 13, color: isUp ? "var(--c-green)" : "var(--c-red)" }}>
                {tMood(locale, s.market_mood || "neutral")}
              </p>
            </div>
          </div>

          {/* Breadth bar */}
          <div>
            <div style={{ height: 4, borderRadius: 4, background: "var(--c-border)", overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${advPct}%`,
                borderRadius: 4,
                background: `linear-gradient(90deg, var(--c-green), ${isUp ? "var(--c-green)" : "var(--c-red)"})`,
                transition: "width 0.6s ease",
              }} />
            </div>
            <div className="flex justify-between mt-1">
              <span style={{ fontSize: 10, color: "var(--c-green)" }}>{advPct}% {t(locale, "market.advancing_pct")}</span>
            </div>
          </div>

          {/* Summary sentence */}
          <p className="mt-3" style={{ fontSize: 12, color: "var(--c-muted)", lineHeight: 1.5 }}>
            {summary}
          </p>
        </div>
      </section>
    );
  } catch {
    return (
      <section style={{ marginBottom: 32 }}>
        <div className="card" style={{ padding: 20 }}>
          <p style={{ color: "var(--c-muted)", fontSize: 13 }}>{t(locale, "market.unavailable")}</p>
        </div>
      </section>
    );
  }
}

// ════════════════════════════════════════════════════════════════
// Section 7 — Top Gainers / Top Losers
// ════════════════════════════════════════════════════════════════
async function MoversPanel({ locale }: { locale: string }) {
  try {
    const [gainers, losers] = await Promise.all([getTopGainers(), getTopLosers()]);

    const MoverRow = ({ s, type }: { s: any; type: "up" | "down" }) => (
      <Link href={`/${locale}/stock/${s.symbol}`}
            className="flex items-center justify-between px-4 py-2.5 hover:bg-[var(--c-hover)] transition-colors group"
            style={{ borderBottom: "1px solid var(--c-border)", textDecoration: "none" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
               style={{ background: type === "up" ? "var(--c-green-bg)" : "var(--c-red-bg)",
                        border: `1px solid ${type === "up" ? "var(--c-green-ring)" : "var(--c-red-ring)"}` }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: type === "up" ? "var(--c-green)" : "var(--c-red)" }}>
              {s.symbol.slice(0, 4)}
            </span>
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: "var(--c-text)" }}>{s.symbol}</p>
            <p className="truncate" style={{ fontSize: 11, color: "var(--c-muted)", maxWidth: 110 }}>
              {(locale === "ar" && s.name_ar) ? s.name_ar : (s.name_en || s.name)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-end">
            <span className={`badge ${type === "up" ? "badge-up" : "badge-down"}`}>
              {type === "up" ? "+" : ""}{s.change_percent.toFixed(2)}%
            </span>
            <p className="font-num mt-0.5" style={{ fontSize: 12, color: "var(--c-text-sm)" }}>
              {t(locale, "common.sar")} {s.price.toFixed(2)}
            </p>
          </div>
          <span
            className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-md font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ fontSize: 10, color: "var(--c-gold)", background: "var(--c-gold-dim)", border: "1px solid var(--c-gold-ring)" }}
          >
            {t(locale, "movers.view_analysis")}
          </span>
        </div>
      </Link>
    );

    return (
      <section className="fade-up" style={{ marginBottom: 32 }}>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {/* Gainers */}
          <div className="card overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3"
                 style={{ borderBottom: "1px solid var(--c-border)", background: "var(--c-elevated)" }}>
              <TrendingUp size={14} style={{ color: "var(--c-green)" }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--c-green)", letterSpacing: "0.05em" }}>
                {t(locale, "market.top_gainers")}
              </span>
            </div>
            {gainers.slice(0, 5).map((s) => <MoverRow key={s.symbol} s={s} type="up" />)}
          </div>

          {/* Losers */}
          <div className="card overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3"
                 style={{ borderBottom: "1px solid var(--c-border)", background: "var(--c-elevated)" }}>
              <TrendingDown size={14} style={{ color: "var(--c-red)" }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--c-red)", letterSpacing: "0.05em" }}>
                {t(locale, "market.top_losers")}
              </span>
            </div>
            {losers.slice(0, 5).map((s) => <MoverRow key={s.symbol} s={s} type="down" />)}
          </div>
        </div>
      </section>
    );
  } catch {
    return (
      <section style={{ marginBottom: 32 }}>
        <div className="card" style={{ padding: 20 }}>
          <p style={{ color: "var(--c-muted)", fontSize: 13 }}>{t(locale, "market.movers_unavail")}</p>
        </div>
      </section>
    );
  }
}

// ════════════════════════════════════════════════════════════════
// Section 8 — Latest Market News
// ════════════════════════════════════════════════════════════════
async function NewsPanel({ locale }: { locale: string }) {
  const isAr = locale === "ar";
  const supabase = createServiceClient();
  const { data: articles } = await supabase
    .from("news")
    .select("id, title_en, title_ar, source, source_url, published_at, sentiment_score")
    .order("published_at", { ascending: false })
    .limit(4);

  function timeAgo(d: string) {
    const h = Math.floor((Date.now() - new Date(d).getTime()) / 3600000);
    if (h < 1) return locale === "ar" ? "الآن" : "now";
    if (h < 24) return locale === "ar" ? `${h} س` : `${h}h`;
    return locale === "ar" ? `${Math.floor(h / 24)} ي` : `${Math.floor(h / 24)}d`;
  }

  return (
    <section className="fade-up" style={{ marginBottom: 32 }}>
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3"
             style={{ borderBottom: "1px solid var(--c-border)", background: "var(--c-elevated)" }}>
          <div className="flex items-center gap-2">
            <Newspaper size={14} style={{ color: "var(--c-gold)" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--c-text-sm)", letterSpacing: "0.05em" }}>
              {t(locale, "news.title")}
            </span>
          </div>
          <Link href={`/${locale}/news`}
                className="text-xs font-semibold transition-colors hover:text-white"
                style={{ color: "var(--c-gold)", textDecoration: "none" }}>
            {t(locale, "market.view_all")} {isAr ? "←" : "→"}
          </Link>
        </div>

        {!articles?.length ? (
          <div style={{ padding: "32px 16px", textAlign: "center" }}>
            <p style={{ color: "var(--c-muted)", fontSize: 13 }}>
              {t(locale, "market.no_news")}
            </p>
          </div>
        ) : (
          <div className="grid gap-0 grid-cols-1 md:grid-cols-2">
            {articles.map((a) => {
              const title = (locale === "ar" && a.title_ar) ? a.title_ar : a.title_en;
              const score = a.sentiment_score;
              const sentiment = score === null ? null : score > 0.2 ? "up" : score < -0.2 ? "down" : null;
              const displayTitle = title === "Announcements" && locale === "ar"
                ? t(locale, "news.announcements")
                : title;
              return (
                <Link key={a.id} href={`/${locale}/news/${a.id}`}
                   className="group block px-4 py-3 transition-colors hover:bg-[var(--c-hover)]"
                   style={{ borderBottom: "1px solid var(--c-border)", borderRight: "1px solid var(--c-border)", textDecoration: "none" }}>
                  <div className="flex items-start gap-2">
                    {sentiment && (
                      <span className={`badge ${sentiment === "up" ? "badge-up" : "badge-down"} mt-0.5 shrink-0`}
                            style={{ padding: "1px 5px", fontSize: 9 }}>
                        {sentiment === "up" ? "▲" : "▼"}
                      </span>
                    )}
                    <p className="text-sm leading-snug line-clamp-2 group-hover:text-white transition-colors"
                       style={{ color: "var(--c-text)" }}>
                      {displayTitle || (locale === "ar" ? "غير معنون" : "Untitled")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    {a.source && (
                      <span className="badge badge-neutral" style={{ padding: "1px 6px", fontSize: 10 }}>
                        {a.source}
                      </span>
                    )}
                    {a.published_at && (
                      <span style={{ fontSize: 11, color: "var(--c-dim)" }}>{timeAgo(a.published_at)}</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════
// Section 9 — Trust / Methodology ("How SŪQAI works")
// ════════════════════════════════════════════════════════════════
function TrustSection({ locale }: { locale: string }) {
  const blocks = [
    { num: 1, icon: Database,    color: "var(--c-gold)",  bg: "var(--c-gold-dim)",  ring: "var(--c-gold-ring)", href: `/${locale}/screener` },
    { num: 2, icon: Brain,       color: "var(--c-green)",  bg: "var(--c-green-bg)", ring: "var(--c-green-ring)", href: `/${locale}/about#methodology` },
    { num: 3, icon: ShieldCheck, color: "#60a5fa",         bg: "rgba(96,165,250,0.08)", ring: "rgba(96,165,250,0.2)", href: `/${locale}/about` },
  ];

  return (
    <section className="fade-up" style={{ marginBottom: 32 }}>
      <h2
        className="font-bold mb-4"
        style={{ fontSize: 16, color: "var(--c-text)", fontFamily: "var(--font-grotesk)" }}
      >
        {t(locale, "trust.title")}
      </h2>
      <div className="grid gap-3 grid-cols-1 md:grid-cols-3 stagger">
        {blocks.map(({ num, icon: Icon, color, bg, ring, href }) => (
          <Link
            key={num}
            href={href}
            className="card group"
            style={{ padding: "20px 20px", textDecoration: "none", display: "block", transition: "transform 0.15s ease" }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: bg, border: `1px solid ${ring}` }}
              >
                <Icon size={16} style={{ color }} />
              </div>
            </div>
            <h3 className="font-semibold mb-1" style={{ fontSize: 13, color: "var(--c-text)", fontFamily: "var(--font-grotesk)" }}>
              {t(locale, `trust.step${num}.title`)}
            </h3>
            <p style={{ fontSize: 11, color: "var(--c-muted)", lineHeight: 1.6 }}>
              {t(locale, `trust.step${num}.desc`)}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════
// Section 10 — Footer
// ════════════════════════════════════════════════════════════════
function FooterSection({ locale }: { locale: string }) {
  const footerLinks = [
    { label: t(locale, "footer.about"),        href: `/${locale}/about` },
    { label: t(locale, "footer.methodology"),   href: `/${locale}/about#methodology` },
    { label: t(locale, "footer.data_sources"),   href: `/${locale}/about#data` },
    { label: t(locale, "footer.dividends"),      href: `/${locale}/calendar` },
    { label: t(locale, "footer.screener"),        href: `/${locale}/screener` },
    { label: t(locale, "footer.contact"),         href: `/${locale}/about#contact` },
    { label: t(locale, "footer.disclaimer_link"), href: `/${locale}/about#disclaimer` },
  ];

  return (
    <footer style={{ marginTop: 16, paddingTop: 24, borderTop: "1px solid var(--c-border)" }}>
      {/* Brand + links */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <p
          className="font-bold"
          style={{ fontSize: 16, color: "var(--c-gold)", fontFamily: "var(--font-grotesk)" }}
        >
          SŪQAI
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {footerLinks.map(({ label, href }) => (
            <Link key={href} href={href} style={{ fontSize: 11, color: "var(--c-muted)", textDecoration: "none" }}>
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Built with line */}
      <p style={{ fontSize: 11, color: "var(--c-muted)", textAlign: "center", marginBottom: 12 }}>
        {t(locale, "footer.built_with")}
      </p>

      {/* Disclaimer note */}
      <hr className="gold-line" style={{ marginBottom: 12 }} />
      <p style={{ fontSize: 10, color: "var(--c-dim)", textAlign: "center", lineHeight: 1.6, maxWidth: 560, margin: "0 auto", paddingBottom: 24 }}>
        {t(locale, "footer.note")}
      </p>
    </footer>
  );
}

// ════════════════════════════════════════════════════════════════
// Page — assembled in the user's specified order
// ════════════════════════════════════════════════════════════════
export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Fetch real featured-stock data once, pass down as props
  const featuredTickers = ["1120", "2222", "7010"];
  const verdictKeys = ["featured.verdict1", "featured.verdict2", "featured.verdict3"];
  let featuredStocks: StockFundamentals[] = [];
  try {
    featuredStocks = await fetchFundamentals(featuredTickers, verdictKeys);
  } catch {
    // graceful degradation — sections will show empty / "N/A"
  }

  return (
    <div className="page-wrap">
      {/* Section 2 — Hero */}
      <HeroSection locale={locale} heroStock={featuredStocks[0] ?? null} />

      {/* Section 3 — Search */}
      <SearchSection locale={locale} />

      {/* Section 4 — What you can do with SŪQAI */}
      <FeaturesSection locale={locale} />

      {/* Section 5 — Featured Stock Analysis */}
      <FeaturedAnalysis locale={locale} stocks={featuredStocks} />

      {/* Section 6 — Market Snapshot */}
      <Suspense fallback={<SkeletonCard height={220} />}>
        <MarketSnapshot locale={locale} />
      </Suspense>

      {/* Sector Heat Map (compact horizontal strip) */}
      <Suspense fallback={<SkeletonCard height={80} />}>
        <SectorHeatMap locale={locale} />
      </Suspense>

      {/* Section 7 — Top Gainers / Top Losers */}
      <Suspense fallback={<SkeletonCard height={320} />}>
        <MoversPanel locale={locale} />
      </Suspense>

      {/* Section 8 — Latest Market News */}
      <Suspense fallback={<SkeletonCard height={280} />}>
        <NewsPanel locale={locale} />
      </Suspense>

      {/* Section 9 — Trust / Methodology */}
      <TrustSection locale={locale} />

      {/* Section 10 — Footer */}
      <FooterSection locale={locale} />
    </div>
  );
}
