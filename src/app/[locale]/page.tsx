import { getMarketSummary, getTopGainers, getTopLosers } from "@/lib/data-sources";
import { createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  TrendingUp, TrendingDown, Minus, Activity,
  ArrowUpRight, ArrowDownRight, Newspaper,
  SlidersHorizontal, CalendarDays, Zap,
} from "lucide-react";
import { t, tMood } from "@/lib/i18n";

// ── Hero Section with Tagline ────────────────────────────────
function HeroTagline({ locale }: { locale: string }) {
  return (
    <div className="text-center mb-8 fade-up" style={{ paddingTop: 24 }}>
      <h1
        className="font-bold tracking-tight text-gradient-gold"
        style={{
          fontSize: 36,
          fontFamily: "var(--font-grotesk)",
          letterSpacing: "-0.04em",
          marginBottom: 10,
        }}
      >
        SŪQAI
      </h1>
      <p style={{ fontSize: 14, color: "var(--c-muted)", maxWidth: 440, margin: "0 auto", lineHeight: 1.7 }}>
        {t(locale, "market.tagline")}
      </p>
    </div>
  );
}

// ── Market Index Card ────────────────────────────────────────
async function MarketHero({ locale }: { locale: string }) {
  try {
    const s = await getMarketSummary();
    const isUp = s.index_change >= 0;
    const total = (s.advancing || 0) + (s.declining || 0) + (s.unchanged || 0);
    const advPct = total > 0 ? ((s.advancing / total) * 100).toFixed(0) : "0";

    // Build summary sentence
    const summaryKey = isUp ? "market.summary_up" : "market.summary_down";
    const summary = t(locale, summaryKey)
      .replace("{pct}", Math.abs(s.index_change_percent).toFixed(2))
      .replace("{adv}", String(s.advancing || 0))
      .replace("{dec}", String(s.declining || 0));

    return (
      <div className="fade-up" style={{ padding: "26px 28px", position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute", top: -80, right: -60,
          width: 320, height: 320, borderRadius: "50%",
          background: isUp ? "rgba(14,203,129,0.05)" : "rgba(246,70,93,0.05)",
          filter: "blur(60px)", pointerEvents: "none",
        }} />

        <div className="flex flex-wrap items-start justify-between gap-6">
          {/* Main index number */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Activity size={14} style={{ color: "var(--c-muted)" }} />
              <span style={{ color: "var(--c-muted)", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em" }}>
                {t(locale, "market.index")}
              </span>
            </div>
            <div className="flex items-end gap-4 flex-wrap">
              <span className="font-num" style={{ fontSize: 44, fontWeight: 700, lineHeight: 1, color: "var(--c-text)", letterSpacing: "-0.03em" }}>
                {s.index_value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <div className="flex flex-col pb-1">
                <span className={`font-num font-bold text-xl ${isUp ? "text-up" : "text-down"}`}>
                  {isUp ? "+" : ""}{s.index_change.toFixed(2)}
                </span>
                <span className={`font-num font-semibold text-sm ${isUp ? "text-up" : "text-down"}`}>
                  {isUp ? "+" : ""}{s.index_change_percent.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          {/* Market breadth */}
          <div className="flex items-center gap-4 md:gap-6 flex-wrap">
            <div className="text-center">
              <div className="flex items-center gap-1 justify-center mb-1">
                <ArrowUpRight size={13} style={{ color: "var(--c-green)" }} />
                <span className="font-num font-bold text-lg text-up">{s.advancing}</span>
              </div>
              <span style={{ fontSize: 10, color: "var(--c-muted)", fontWeight: 600, letterSpacing: "0.05em" }}>
                {t(locale, "market.advancing")}
              </span>
            </div>
            <div style={{ width: 1, height: 36, background: "var(--c-border)" }} />
            <div className="text-center">
              <div className="flex items-center gap-1 justify-center mb-1">
                <ArrowDownRight size={13} style={{ color: "var(--c-red)" }} />
                <span className="font-num font-bold text-lg text-down">{s.declining}</span>
              </div>
              <span style={{ fontSize: 10, color: "var(--c-muted)", fontWeight: 600, letterSpacing: "0.05em" }}>
                {t(locale, "market.declining")}
              </span>
            </div>
            <div style={{ width: 1, height: 36, background: "var(--c-border)" }} />
            <div className="text-center">
              <div className="flex items-center gap-1 justify-center mb-1">
                <Minus size={13} style={{ color: "var(--c-muted)" }} />
                <span className="font-num font-bold text-lg" style={{ color: "var(--c-text)" }}>{s.unchanged}</span>
              </div>
              <span style={{ fontSize: 10, color: "var(--c-muted)", fontWeight: 600, letterSpacing: "0.05em" }}>
                {t(locale, "market.unchanged")}
              </span>
            </div>
            <div style={{ width: 1, height: 36, background: "var(--c-border)" }} />
            <div className="text-center">
              <span className="font-num font-bold text-lg" style={{ color: "var(--c-text)" }}>
                {(s.total_volume / 1e9).toFixed(2)}B
              </span>
              <div style={{ fontSize: 10, color: "var(--c-muted)", fontWeight: 600, letterSpacing: "0.05em", marginTop: 2 }}>
                {t(locale, "market.volume")}
              </div>
            </div>
          </div>
        </div>

        {/* Breadth bar */}
        <div className="mt-5">
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
            <span style={{ fontSize: 10, color: "var(--c-muted)" }}>
              {t(locale, "market.mood")} {tMood(locale, s.market_mood || "neutral")}
            </span>
          </div>
        </div>

        {/* Summary sentence */}
        <p className="mt-3" style={{ fontSize: 13, color: "var(--c-text-sm)", lineHeight: 1.5 }}>
          {summary}
        </p>
      </div>
    );
  } catch {
    return (
      <div style={{ padding: "24px 28px" }}>
        <p style={{ color: "var(--c-muted)", fontSize: 13 }}>{t(locale, "market.unavailable")}</p>
      </div>
    );
  }
}

// ── Quick Action Cards ───────────────────────────────────────
function QuickActions({ locale }: { locale: string }) {
  const actions = [
    {
      href: `/${locale}/screener`,
      icon: SlidersHorizontal,
      title: t(locale, "market.action.screener"),
      desc: t(locale, "market.action.screener_desc"),
      color: "var(--c-gold)",
      bg: "var(--c-gold-dim)",
      ring: "var(--c-gold-ring)",
    },
    {
      href: `/${locale}/calendar`,
      icon: CalendarDays,
      title: t(locale, "market.action.calendar"),
      desc: t(locale, "market.action.calendar_desc"),
      color: "var(--c-green)",
      bg: "var(--c-green-bg)",
      ring: "var(--c-green-ring)",
    },
    {
      href: `/${locale}/news`,
      icon: Newspaper,
      title: t(locale, "market.action.news"),
      desc: t(locale, "market.action.news_desc"),
      color: "var(--c-blue, #60a5fa)",
      bg: "rgba(96,165,250,0.08)",
      ring: "rgba(96,165,250,0.2)",
    },
  ];

  return (
    <div className="grid gap-3 stagger grid-cols-1 md:grid-cols-3">
      {actions.map(({ href, icon: Icon, title, desc, color, bg, ring }) => (
        <Link
          key={href}
          href={href}
          className="card card-action group"
          style={{ padding: "20px 22px", textDecoration: "none", borderColor: ring, transition: "all 0.25s cubic-bezier(0.16,1,0.3,1)" }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
            style={{ background: bg, border: `1px solid ${ring}` }}
          >
            <Icon size={16} style={{ color }} />
          </div>
          <h3 className="font-semibold text-sm mb-1" style={{ color: "var(--c-text)", fontFamily: "var(--font-grotesk)" }}>
            {title}
          </h3>
          <p style={{ fontSize: 12, color: "var(--c-muted)", lineHeight: 1.45 }}>
            {desc}
          </p>
        </Link>
      ))}
    </div>
  );
}

// ── Movers Panel ─────────────────────────────────────────────
async function MoversPanel({ locale }: { locale: string }) {
  try {
    const [gainers, losers] = await Promise.all([getTopGainers(), getTopLosers()]);

    const MoverRow = ({ s, type }: { s: any; type: "up" | "down" }) => (
      <Link href={`/${locale}/stock/${s.symbol}`}
            className="flex items-center justify-between px-4 py-2.5 hover:bg-[var(--c-hover)] transition-colors group"
            style={{ borderBottom: "1px solid var(--c-border)" }}>
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
        <div className="text-right">
          <span className={`badge ${type === "up" ? "badge-up" : "badge-down"}`}>
            {type === "up" ? "+" : ""}{s.change_percent.toFixed(2)}%
          </span>
          <p className="font-num mt-0.5" style={{ fontSize: 12, color: "var(--c-text-sm)" }}>
            {t(locale, "common.sar")} {s.price.toFixed(2)}
          </p>
        </div>
      </Link>
    );

    return (
      <div className="grid gap-4 fade-up grid-cols-1 md:grid-cols-2">
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
    );
  } catch {
    return (
      <div className="card" style={{ padding: 20 }}>
        <p style={{ color: "var(--c-muted)", fontSize: 13 }}>{t(locale, "market.movers_unavail")}</p>
      </div>
    );
  }
}

// ── News Feed (compact, bottom) ──────────────────────────────
async function NewsPanel({ locale }: { locale: string }) {
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
    <div className="card overflow-hidden fade-up">
      <div className="flex items-center justify-between px-4 py-3"
           style={{ borderBottom: "1px solid var(--c-border)", background: "var(--c-elevated)" }}>
        <div className="flex items-center gap-2">
          <Newspaper size={14} style={{ color: "var(--c-gold)" }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--c-text-sm)", letterSpacing: "0.05em" }}>
            {t(locale, "market.latest_news")}
          </span>
        </div>
        <Link href={`/${locale}/news`}
              className="text-xs font-semibold transition-colors hover:text-white"
              style={{ color: "var(--c-gold)" }}>
          {t(locale, "market.view_all")} →
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
  );
}

// ── Page ──────────────────────────────────────────────────────
export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <div className="page-wrap">
      {/* Hero tagline */}
      <HeroTagline locale={locale} />

      {/* Market index card — animated gold border */}
      <div className="mb-6 card-gold-shimmer">
        <div className="card-gold-inner">
          <MarketHero locale={locale} />
        </div>
      </div>

      {/* Quick action cards */}
      <div className="mb-8">
        <QuickActions locale={locale} />
      </div>

      {/* Section separator */}
      <hr className="gradient-line mb-8" />

      {/* Gainers & Losers side by side */}
      <div className="mb-8">
        <MoversPanel locale={locale} />
      </div>

      {/* News at the bottom */}
      <div className="mb-8">
        <NewsPanel locale={locale} />
      </div>

      <hr className="gold-line my-10" />
      <p style={{ fontSize: 11, color: "var(--c-dim)", textAlign: "center", letterSpacing: "0.02em" }}>
        {t(locale, "common.disclaimer")}
      </p>
    </div>
  );
}
