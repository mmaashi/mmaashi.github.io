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
import { calculateScores } from "@/lib/scores";
import { scoreVerdict } from "@/lib/format";
import { displayName } from "@/lib/display-names";
import SectorHeatMap from "@/components/SectorHeatMap";

// ════════════════════════════════════════════════════════════════
// Helpers — compute SŪQAI score & fetch stock fundamentals
// ════════════════════════════════════════════════════════════════

/** Generate a computed verdict sentence from actual pillar scores */
function computeVerdict(
  pillars: StockFundamentals["pillars"],
  score: number | null,
  locale: string,
): string {
  const isAr = locale === "ar";
  if (score === null) return isAr ? "بيانات غير كافية للتقييم." : "Insufficient data for analysis.";

  const { label } = scoreVerdict(score, locale);

  // Find strongest and weakest pillars
  const entries: [string, number][] = [];
  const nameMapEn: Record<string, string> = { value: "valuation", growth: "growth", momentum: "momentum", health: "financial health", dividends: "dividends" };
  const nameMapAr: Record<string, string> = { value: "التقييم", growth: "النمو", momentum: "الزخم", health: "الملاءة المالية", dividends: "التوزيعات" };
  for (const [k, v] of Object.entries(pillars)) {
    if (v !== null) entries.push([k, v]);
  }
  if (entries.length === 0) return isAr ? "بيانات غير كافية للتقييم." : "Insufficient data for analysis.";

  entries.sort((a, b) => b[1] - a[1]);
  const strongest = entries[0];
  const weakest = entries[entries.length - 1];
  const nameMap = isAr ? nameMapAr : nameMapEn;

  if (isAr) {
    return `التقييم: ${label}. أقوى جانب: ${nameMap[strongest[0]]}${weakest[1] < 40 ? `. يحتاج تحسين: ${nameMap[weakest[0]]}` : ""}.`;
  }
  return `Rating: ${label}. Strongest: ${nameMap[strongest[0]]}${weakest[1] < 40 ? `. Needs improvement: ${nameMap[weakest[0]]}` : ""}.`;
}

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
  pillars: {
    value: number | null;
    growth: number | null;
    momentum: number | null;
    health: number | null;
    dividends: number | null;
  };
  dataDate: string | null;
}

/** Fetch fundamentals for a set of tickers */
async function fetchFundamentals(tickers: string[]): Promise<StockFundamentals[]> {
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

  // Fetch recent dividends (last 1 year for proper annual yield)
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const { data: dividends } = await supabase
    .from("dividends")
    .select("company_id, amount_per_share, ex_date")
    .in("company_id", companyIds)
    .gte("ex_date", oneYearAgo.toISOString().split("T")[0])
    .order("ex_date", { ascending: false });

  // Sum dividends per company for annual yield
  const divMap = new Map<string, number>();
  for (const d of dividends || []) {
    divMap.set(d.company_id, (divMap.get(d.company_id) || 0) + Number(d.amount_per_share));
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

  // Assemble results — using the canonical calculateScores from scores.ts
  return tickers.map((ticker) => {
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

    // Use the SAME scoring algorithm as the stock detail page
    const scores = calculateScores({
      pe: fin?.pe_ratio ?? null,
      eps: fin?.earnings_per_share ?? null,
      divYield: divYieldPct,
      revenue: fin?.revenue ?? null,
      netIncome: fin?.net_income ?? null,
      changePct: priceChange,
      currentPrice: price,
      fiftyTwoHigh: null, // not fetched on homepage — momentum defaults to 2.5 ± change
      fiftyTwoLow: null,
      debtToEquity: fin?.debt_to_equity ?? null,
      roe: fin?.roe ?? null,
    });

    // Convert 0-5 pillar scores to 0-100 scale for display
    const toHundred = (v: number) => Math.round(v * 20);
    const pillars = {
      value: toHundred(scores.value),
      growth: toHundred(scores.growth),
      momentum: toHundred(scores.momentum),
      health: toHundred(scores.health),
      dividends: toHundred(scores.dividend),
    };

    // Overall score = average of 5 pillars (0-100 scale)
    const overall = Math.round(
      (pillars.value + pillars.growth + pillars.momentum + pillars.health + pillars.dividends) / 5
    );

    return {
      ticker,
      nameEn: comp?.name_en || ticker,
      nameAr: comp?.name_ar || ticker,
      sector: comp?.sector || "",
      score: overall,
      latestPrice: price,
      priceChange,
      divYield: divYieldPct != null ? `${divYieldPct.toFixed(1)}%` : null,
      peRatio: fin?.pe_ratio ?? null,
      roe: fin?.roe ?? null,
      debtToEquity: fin?.debt_to_equity ?? null,
      pillars,
      dataDate: latestPrice?.date ?? null,
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
              href={`/${locale}/screener`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all"
              style={{
                background: "transparent",
                color: "var(--c-gold)",
                border: "1px solid var(--c-gold-ring)",
                textDecoration: "none",
                fontFamily: "var(--font-grotesk)",
              }}
            >
              <SlidersHorizontal size={13} />
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
              <span style={{ fontSize: 10, fontWeight: 700, color: "var(--c-gold)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                {isAr ? "سهم مميز" : "FEATURED"}
              </span>
            </div>
            <p className="font-bold" style={{ fontSize: 15, color: "var(--c-text)", fontFamily: "var(--font-grotesk)" }}>
              {displayName(locale, heroStock.nameEn, heroStock.nameAr)}
            </p>
            <p className="font-num" style={{ fontSize: 11, color: "var(--c-muted)", marginBottom: 10 }}>{heroStock.ticker}</p>
            <div className="flex items-center gap-4 mb-2">
              <div>
                <span style={{ fontSize: 10, color: "var(--c-dim)", fontWeight: 600 }}>{t(locale, "score.label")}</span>
                <p className="font-num font-bold" style={{ fontSize: 16, color: "var(--c-gold)" }}>
                  {heroStock.score != null ? <>{heroStock.score}<span style={{ fontSize: 10, fontWeight: 500, color: "var(--c-dim)" }}>/100</span></> : na}
                </p>
              </div>
              <div style={{ width: 1, height: 28, background: "var(--c-border)" }} />
              <div>
                <span style={{ fontSize: 10, color: "var(--c-dim)", fontWeight: 600 }}>{t(locale, "featured.latest_price")}</span>
                <p className="font-num font-bold" style={{ fontSize: 14, color: "var(--c-text)" }}>
                  {heroStock.latestPrice != null ? `${heroStock.latestPrice.toFixed(2)} ${sar}` : na}
                </p>
              </div>
              <div style={{ width: 1, height: 28, background: "var(--c-border)" }} />
              <div>
                <span style={{ fontSize: 10, color: "var(--c-dim)", fontWeight: 600 }}>{t(locale, "featured.div_yield")}</span>
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
        style={{ fontSize: 17, color: "var(--c-text)", fontFamily: "var(--font-grotesk)", letterSpacing: "-0.01em" }}
      >
        {t(locale, "features.title")}
      </h2>
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 stagger">
        {cards.map(({ num, icon: Icon, color, bg, ring, href }) => (
          <Link
            key={num}
            href={href}
            className="card group"
            style={{ padding: "20px 20px", textDecoration: "none", transition: "all 0.2s" }}
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
            <p style={{ fontSize: 12, color: "var(--c-muted)", lineHeight: 1.6 }}>
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
        style={{ fontSize: 17, color: "var(--c-text)", fontFamily: "var(--font-grotesk)", letterSpacing: "-0.01em" }}
      >
        {t(locale, "featured.title")}
      </h2>
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3 stagger">
        {stocks.map((f) => (
          <Link
            key={f.ticker}
            href={`/${locale}/stock/${f.ticker}`}
            className="card group"
            style={{ padding: "20px 20px", textDecoration: "none", transition: "all 0.2s" }}
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-bold" style={{ fontSize: 14, color: "var(--c-text)", fontFamily: "var(--font-grotesk)" }}>
                  {displayName(locale, f.nameEn, f.nameAr)}
                </p>
                <p className="font-num" style={{ fontSize: 11, color: "var(--c-dim)" }}>{f.ticker}</p>
              </div>
              <div
                className="flex flex-col items-center justify-center rounded-lg"
                style={{
                  width: 44, height: 38,
                  background: "var(--c-gold-dim)",
                  border: "1px solid var(--c-gold-ring)",
                }}
              >
                <span className="font-num font-bold" style={{ fontSize: 15, lineHeight: 1, color: "var(--c-gold)" }}>
                  {f.score ?? na}
                </span>
                {f.score != null && (
                  <span className="font-num" style={{ fontSize: 8, color: "var(--c-dim)", lineHeight: 1, marginTop: 1 }}>/100</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <div>
                <span style={{ fontSize: 10, color: "var(--c-dim)", fontWeight: 600 }}>{t(locale, "featured.latest_price")}</span>
                <p className="font-num font-semibold" style={{ fontSize: 13, color: "var(--c-text)" }}>
                  {f.latestPrice != null ? `${f.latestPrice.toFixed(2)} ${sar}` : na}
                </p>
              </div>
              <div style={{ width: 1, height: 24, background: "var(--c-border)" }} />
              <div>
                <span style={{ fontSize: 10, color: "var(--c-dim)", fontWeight: 600 }}>{t(locale, "featured.div_yield")}</span>
                <p className="font-num font-semibold" style={{ fontSize: 13, color: "var(--c-green)" }}>
                  {f.divYield ?? na}
                </p>
              </div>
            </div>
            {/* Pillar mini-bars with labels */}
            {f.pillars && (
              <div className="flex gap-1 mt-3">
                {(["value", "growth", "momentum", "health", "dividends"] as const).map((k) => {
                  const v = f.pillars[k];
                  const pct = v != null ? Math.min(100, Math.max(0, v)) : 0;
                  const labelEn: Record<string, string> = { value: "V", growth: "G", momentum: "M", health: "H", dividends: "D" };
                  const labelAr: Record<string, string> = { value: "ق", growth: "ن", momentum: "ز", health: "ص", dividends: "ت" };
                  return (
                    <div key={k} style={{ flex: 1, textAlign: "center" }}>
                      <span style={{ fontSize: 8, fontWeight: 600, color: "var(--c-dim)", letterSpacing: "0.02em" }}>
                        {isAr ? labelAr[k] : labelEn[k]}
                      </span>
                      <div style={{ height: 4, borderRadius: 2, background: "var(--c-border)", overflow: "hidden", marginTop: 2 }}>
                        <div style={{
                          width: `${pct}%`,
                          height: "100%",
                          borderRadius: 2,
                          background: pct >= 70 ? "var(--c-green)" : pct >= 40 ? "var(--c-gold)" : "var(--c-red)",
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {/* Verdict line — computed from actual pillar scores */}
            <p style={{ fontSize: 11, color: "var(--c-muted)", lineHeight: 1.5, marginTop: 8 }}>
              {computeVerdict(f.pillars, f.score, locale)}
            </p>
            {/* Pillar contribution chips — H4 */}
            {f.pillars && (() => {
              const chipNameEn: Record<string, string> = { value: "Value", growth: "Growth", momentum: "Momentum", health: "Health", dividends: "Dividends" };
              const chipNameAr: Record<string, string> = { value: "التقييم", growth: "النمو", momentum: "الزخم", health: "الملاءة", dividends: "التوزيعات" };
              const chips: { label: string; color: string; bg: string }[] = [];
              for (const [k, v] of Object.entries(f.pillars)) {
                if (v == null) continue;
                const name = isAr ? chipNameAr[k] : chipNameEn[k];
                if (v >= 70) chips.push({ label: `✓ ${name}`, color: "var(--c-green)", bg: "rgba(34,197,94,0.10)" });
                else if (v < 40) chips.push({ label: `↓ ${name}`, color: "var(--c-red)", bg: "rgba(239,68,68,0.10)" });
              }
              if (chips.length === 0) return null;
              return (
                <div className="flex flex-wrap gap-1 mt-2">
                  {chips.map((c) => (
                    <span key={c.label} style={{ fontSize: 9, fontWeight: 600, color: c.color, background: c.bg, borderRadius: 4, padding: "2px 6px" }}>
                      {c.label}
                    </span>
                  ))}
                </div>
              );
            })()}
            {/* Data freshness */}
            {f.dataDate && (
              <p style={{ fontSize: 9, color: "var(--c-dim)", marginTop: 4 }}>
                {isAr ? "بتاريخ" : "As of"}{" "}
                {new Date(f.dataDate).toLocaleDateString(isAr ? "ar-SA" : "en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            )}
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
          style={{ fontSize: 17, color: "var(--c-text)", fontFamily: "var(--font-grotesk)", letterSpacing: "-0.01em" }}
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
              <span style={{ fontSize: 10, color: "var(--c-dim)", fontWeight: 600, letterSpacing: "0.05em" }}>
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
              <span style={{ fontSize: 10, color: "var(--c-dim)", fontWeight: 600, letterSpacing: "0.05em" }}>
                {t(locale, "market.unchanged")}
              </span>
              <p className="font-num font-bold mt-1" style={{ fontSize: 14, color: "var(--c-text)" }}>{s.unchanged}</p>
            </div>

            {/* Volume */}
            <div className="stat-card" style={{ padding: "10px 12px" }}>
              <span style={{ fontSize: 10, color: "var(--c-dim)", fontWeight: 600, letterSpacing: "0.05em" }}>
                {t(locale, "market.volume")}
              </span>
              <p className="font-num font-bold mt-1" style={{ fontSize: 14, color: "var(--c-text)" }}>
                {(s.total_volume / 1e9).toFixed(2)} {t(locale, "common.billion")}
              </p>
            </div>

            {/* Traded Value */}
            {s.total_value != null && (
              <div className="stat-card" style={{ padding: "10px 12px" }}>
                <span style={{ fontSize: 10, color: "var(--c-dim)", fontWeight: 600, letterSpacing: "0.05em" }}>
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
                <span style={{ fontSize: 10, color: "var(--c-dim)", fontWeight: 600, letterSpacing: "0.05em" }}>
                  {t(locale, "snapshot.top_sector")}
                </span>
                <p className="font-bold mt-1" style={{ fontSize: 13, color: "var(--c-gold)" }}>
                  {tSector(locale, s.top_sector)}
                </p>
              </div>
            )}

            {/* Market Mood */}
            <div className="stat-card" style={{ padding: "10px 12px" }}>
              <span style={{ fontSize: 10, color: "var(--c-dim)", fontWeight: 600, letterSpacing: "0.05em" }}>
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
            <span style={{ fontSize: 10, fontWeight: 700, color: type === "up" ? "var(--c-green)" : "var(--c-red)" }}>
              {s.symbol.slice(0, 4)}
            </span>
          </div>
          <div>
            <p className="font-semibold text-sm truncate" style={{ color: "var(--c-text)", maxWidth: 130 }}>
              {displayName(locale, s.name_en || s.name || s.symbol, s.name_ar)}
            </p>
            <p className="font-num" style={{ fontSize: 11, color: "var(--c-dim)" }}>{s.symbol}</p>
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
                            style={{ padding: "2px 6px", fontSize: 10 }}>
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
        style={{ fontSize: 17, color: "var(--c-text)", fontFamily: "var(--font-grotesk)", letterSpacing: "-0.01em" }}
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
            <Link key={href} href={href} style={{ fontSize: 12, color: "var(--c-muted)", textDecoration: "none" }}>
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Built with line */}
      <p style={{ fontSize: 12, color: "var(--c-muted)", textAlign: "center", marginBottom: 12 }}>
        {t(locale, "footer.built_with")}
      </p>

      {/* Disclaimer note */}
      <hr className="gold-line" style={{ marginBottom: 12 }} />
      <p style={{ fontSize: 11, color: "var(--c-dim)", textAlign: "center", lineHeight: 1.6, maxWidth: 560, margin: "0 auto", paddingBottom: 24 }}>
        {t(locale, "footer.note")}
      </p>
    </footer>
  );
}

// ════════════════════════════════════════════════════════════════
// Section 5.5 — SŪQAI Intelligence Cards
// Top Scored | Dividend Picks | Value Ideas | Momentum Leaders
// ════════════════════════════════════════════════════════════════
async function IntelligenceCards({ locale }: { locale: string }) {
  const isAr = locale === "ar";
  const supabase = createServiceClient();

  // Fetch top companies by different criteria from company_metrics_daily
  // We'll get a broad set and filter client-side
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const metricsResult = await (supabase as any)
    .from("company_metrics_daily")
    .select("company_id, suqai_score, score_tier, dividend_yield, pe_ratio, pb_ratio, return_1m, return_3m, return_1y, roe, market_cap")
    .order("as_of_date", { ascending: false })
    .limit(500);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const metricsRaw: any[] = metricsResult.data ?? [];

  // Deduplicate: latest per company_id
  const seen = new Set<string>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const metrics: any[] = [];
  for (const row of metricsRaw) {
    if (!seen.has(row.company_id)) {
      seen.add(row.company_id);
      metrics.push(row);
    }
  }

  // Get company names
  const companyIds = metrics.map(m => m.company_id);
  const { data: companiesData } = await supabase
    .from("companies")
    .select("id, ticker, name_en, name_ar, sector")
    .in("id", companyIds.length > 0 ? companyIds : ["none"]);

  const companyMap = new Map((companiesData ?? []).map(c => [c.id, c]));

  // Enrich with company data
  const enriched = metrics
    .map(m => ({ ...m, company: companyMap.get(m.company_id) }))
    .filter(m => m.company);

  // Create different ranked lists
  const topScored = enriched
    .filter(m => m.suqai_score != null)
    .sort((a, b) => Number(b.suqai_score) - Number(a.suqai_score))
    .slice(0, 5);

  const dividendPicks = enriched
    .filter(m => m.dividend_yield != null && Number(m.dividend_yield) > 0)
    .sort((a, b) => Number(b.dividend_yield) - Number(a.dividend_yield))
    .slice(0, 5);

  const valueIdeas = enriched
    .filter(m => m.pe_ratio != null && Number(m.pe_ratio) > 0 && Number(m.pe_ratio) < 15 && m.suqai_score != null && Number(m.suqai_score) >= 40)
    .sort((a, b) => Number(a.pe_ratio) - Number(b.pe_ratio))
    .slice(0, 5);

  const momentumLeaders = enriched
    .filter(m => m.return_1m != null)
    .sort((a, b) => Number(b.return_1m) - Number(a.return_1m))
    .slice(0, 5);

  const tierColor = (tier: string | null) => {
    switch (tier) {
      case "Strong Buy": return "#22c55e";
      case "Buy": return "#4ade80";
      case "Hold": return "#d4a574";
      case "Underperform": return "#f97316";
      case "Sell": return "#ef4444";
      default: return "#6b7280";
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function CardRow({ items, format }: { items: any[]; format: (m: any) => { value: string; color: string; sub?: string } }) {
    if (items.length === 0) return <p style={{ color: "var(--c-dim)", fontSize: 12 }}>{isAr ? "لا توجد بيانات كافية" : "Insufficient data"}</p>;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map((m, i) => {
          const c = m.company;
          const name = isAr && c.name_ar ? c.name_ar : c.name_en;
          const { value, color, sub } = format(m);
          return (
            <Link
              key={c.ticker}
              href={`/${locale}/stock/${c.ticker}`}
              style={{ textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: 8, background: i === 0 ? "var(--c-gold-dim)" : "var(--c-elevated)", border: `1px solid ${i === 0 ? "var(--c-gold-ring)" : "var(--c-border)"}`, transition: "border-color 0.15s" }}
            >
              <div className="flex items-center gap-2" style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: i === 0 ? "var(--c-gold)" : "var(--c-muted)", width: 16 }}>{i + 1}</span>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "var(--c-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</p>
                  <span className="font-num" style={{ fontSize: 10, color: "var(--c-muted)" }}>{c.ticker}</span>
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <span className="font-num font-bold" style={{ fontSize: 14, color }}>{value}</span>
                {sub && <p className="font-num" style={{ fontSize: 10, color: "var(--c-dim)" }}>{sub}</p>}
              </div>
            </Link>
          );
        })}
      </div>
    );
  }

  if (enriched.length === 0) return null;

  return (
    <section className="fade-up mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Star size={16} style={{ color: "var(--c-gold)" }} />
        <h2 className="font-bold text-lg" style={{ color: "var(--c-text)", fontFamily: "var(--font-grotesk)" }}>
          {isAr ? "اختيارات سوقاي" : "SŪQAI Picks"}
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Top Scored */}
        <div className="card" style={{ padding: "16px 18px" }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "rgba(200,169,81,0.15)", border: "1px solid rgba(200,169,81,0.3)" }}>
              <Star size={12} style={{ color: "#C8A951" }} />
            </div>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--c-text)", letterSpacing: "0.04em" }}>
              {isAr ? "أعلى التقييمات" : "TOP SCORED"}
            </h3>
          </div>
          <CardRow
            items={topScored}
            format={(m) => ({
              value: Number(m.suqai_score).toFixed(0),
              color: tierColor(m.score_tier),
              sub: m.score_tier,
            })}
          />
        </div>

        {/* Dividend Picks */}
        <div className="card" style={{ padding: "16px 18px" }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)" }}>
              <DollarSign size={12} style={{ color: "#22c55e" }} />
            </div>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--c-text)", letterSpacing: "0.04em" }}>
              {isAr ? "أعلى التوزيعات" : "DIVIDEND PICKS"}
            </h3>
          </div>
          <CardRow
            items={dividendPicks}
            format={(m) => ({
              value: `${(Number(m.dividend_yield) * 100).toFixed(1)}%`,
              color: "#22c55e",
              sub: isAr ? "عائد" : "yield",
            })}
          />
        </div>

        {/* Value Ideas */}
        <div className="card" style={{ padding: "16px 18px" }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "rgba(96,165,250,0.12)", border: "1px solid rgba(96,165,250,0.25)" }}>
              <BarChart3 size={12} style={{ color: "#60A5FA" }} />
            </div>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--c-text)", letterSpacing: "0.04em" }}>
              {isAr ? "أفكار قيمة" : "VALUE IDEAS"}
            </h3>
          </div>
          <CardRow
            items={valueIdeas}
            format={(m) => ({
              value: `${Number(m.pe_ratio).toFixed(1)}x`,
              color: "#60A5FA",
              sub: "P/E",
            })}
          />
        </div>

        {/* Momentum Leaders */}
        <div className="card" style={{ padding: "16px 18px" }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.25)" }}>
              <TrendingUp size={12} style={{ color: "#f97316" }} />
            </div>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--c-text)", letterSpacing: "0.04em" }}>
              {isAr ? "قادة الزخم" : "MOMENTUM"}
            </h3>
          </div>
          <CardRow
            items={momentumLeaders}
            format={(m) => ({
              value: `${Number(m.return_1m) > 0 ? "+" : ""}${(Number(m.return_1m) * 100).toFixed(1)}%`,
              color: Number(m.return_1m) > 0 ? "#22c55e" : "#ef4444",
              sub: isAr ? "شهر" : "1M",
            })}
          />
        </div>
      </div>
    </section>
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
  let featuredStocks: StockFundamentals[] = [];
  try {
    featuredStocks = await fetchFundamentals(featuredTickers);
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

      {/* Section 5.5 — SŪQAI Intelligence Cards */}
      <Suspense fallback={<SkeletonCard height={320} />}>
        <IntelligenceCards locale={locale} />
      </Suspense>

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
