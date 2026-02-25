import { getMarketSummary, getTopGainers, getTopLosers } from "@/lib/data-sources";
import { createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";
import { TrendingUp, TrendingDown, Minus, Activity, ArrowUpRight, ArrowDownRight, Newspaper } from "lucide-react";

// ── Hero Market Card ──────────────────────────────────────────
async function MarketHero({ locale }: { locale: string }) {
  try {
    const s = await getMarketSummary();
    const isUp = s.index_change >= 0;
    const total = (s.advancing || 0) + (s.declining || 0) + (s.unchanged || 0);
    const advPct = total > 0 ? ((s.advancing / total) * 100).toFixed(0) : "0";

    return (
      <div className="card fade-up" style={{ padding: "24px 28px", position: "relative", overflow: "hidden" }}>
        {/* Subtle background glow */}
        <div style={{
          position: "absolute", top: -60, right: -40,
          width: 280, height: 280, borderRadius: "50%",
          background: isUp ? "rgba(14,203,129,0.04)" : "rgba(246,70,93,0.04)",
          filter: "blur(40px)", pointerEvents: "none",
        }} />

        <div className="flex flex-wrap items-start justify-between gap-6">
          {/* Main index number */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Activity size={14} style={{ color: "var(--c-muted)" }} />
              <span style={{ color: "var(--c-muted)", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em" }}>
                TADAWUL ALL-SHARE INDEX (TASI)
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
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="flex items-center gap-1 justify-center mb-1">
                <ArrowUpRight size={13} style={{ color: "var(--c-green)" }} />
                <span className="font-num font-bold text-lg text-up">{s.advancing}</span>
              </div>
              <span style={{ fontSize: 10, color: "var(--c-muted)", fontWeight: 600, letterSpacing: "0.05em" }}>ADVANCING</span>
            </div>
            <div style={{ width: 1, height: 36, background: "var(--c-border)" }} />
            <div className="text-center">
              <div className="flex items-center gap-1 justify-center mb-1">
                <ArrowDownRight size={13} style={{ color: "var(--c-red)" }} />
                <span className="font-num font-bold text-lg text-down">{s.declining}</span>
              </div>
              <span style={{ fontSize: 10, color: "var(--c-muted)", fontWeight: 600, letterSpacing: "0.05em" }}>DECLINING</span>
            </div>
            <div style={{ width: 1, height: 36, background: "var(--c-border)" }} />
            <div className="text-center">
              <div className="flex items-center gap-1 justify-center mb-1">
                <Minus size={13} style={{ color: "var(--c-muted)" }} />
                <span className="font-num font-bold text-lg" style={{ color: "var(--c-text)" }}>{s.unchanged}</span>
              </div>
              <span style={{ fontSize: 10, color: "var(--c-muted)", fontWeight: 600, letterSpacing: "0.05em" }}>UNCHANGED</span>
            </div>
            <div style={{ width: 1, height: 36, background: "var(--c-border)" }} />
            <div className="text-center">
              <span className="font-num font-bold text-lg" style={{ color: "var(--c-text)" }}>
                {(s.total_volume / 1e9).toFixed(2)}B
              </span>
              <div style={{ fontSize: 10, color: "var(--c-muted)", fontWeight: 600, letterSpacing: "0.05em", marginTop: 2 }}>
                VOLUME
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
            <span style={{ fontSize: 10, color: "var(--c-green)" }}>{advPct}% advancing</span>
            <span style={{ fontSize: 10, color: "var(--c-muted)", textTransform: "capitalize" }}>
              Market {s.market_mood || "activity"}
            </span>
          </div>
        </div>
      </div>
    );
  } catch {
    return (
      <div className="card" style={{ padding: "24px 28px" }}>
        <p style={{ color: "var(--c-muted)", fontSize: 13 }}>Market data temporarily unavailable</p>
      </div>
    );
  }
}

// ── Movers Column ─────────────────────────────────────────────
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
              {s.name_en || s.name}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className={`badge ${type === "up" ? "badge-up" : "badge-down"}`}>
            {type === "up" ? "+" : ""}{s.change_percent.toFixed(2)}%
          </span>
          <p className="font-num mt-0.5" style={{ fontSize: 12, color: "var(--c-text-sm)" }}>
            SAR {s.price.toFixed(2)}
          </p>
        </div>
      </Link>
    );

    return (
      <div className="flex flex-col gap-4">
        {/* Gainers */}
        <div className="card overflow-hidden" style={{ flex: 1 }}>
          <div className="flex items-center gap-2 px-4 py-3"
               style={{ borderBottom: "1px solid var(--c-border)", background: "var(--c-elevated)" }}>
            <TrendingUp size={14} style={{ color: "var(--c-green)" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--c-green)", letterSpacing: "0.05em" }}>
              TOP GAINERS
            </span>
          </div>
          {gainers.slice(0, 5).map((s) => <MoverRow key={s.symbol} s={s} type="up" />)}
        </div>

        {/* Losers */}
        <div className="card overflow-hidden" style={{ flex: 1 }}>
          <div className="flex items-center gap-2 px-4 py-3"
               style={{ borderBottom: "1px solid var(--c-border)", background: "var(--c-elevated)" }}>
            <TrendingDown size={14} style={{ color: "var(--c-red)" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--c-red)", letterSpacing: "0.05em" }}>
              TOP LOSERS
            </span>
          </div>
          {losers.slice(0, 5).map((s) => <MoverRow key={s.symbol} s={s} type="down" />)}
        </div>
      </div>
    );
  } catch {
    return (
      <div className="card" style={{ padding: 20 }}>
        <p style={{ color: "var(--c-muted)", fontSize: 13 }}>Movers unavailable</p>
      </div>
    );
  }
}

// ── News Feed ─────────────────────────────────────────────────
async function NewsPanel({ locale }: { locale: string }) {
  const supabase = createServiceClient();
  const { data: articles } = await supabase
    .from("news")
    .select("id, title_en, title_ar, source, source_url, published_at, sentiment_score")
    .order("published_at", { ascending: false })
    .limit(8);

  function timeAgo(d: string) {
    const h = Math.floor((Date.now() - new Date(d).getTime()) / 3600000);
    if (h < 1) return "now";
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
  }

  return (
    <div className="card overflow-hidden" style={{ height: "100%" }}>
      <div className="flex items-center justify-between px-4 py-3"
           style={{ borderBottom: "1px solid var(--c-border)", background: "var(--c-elevated)" }}>
        <div className="flex items-center gap-2">
          <Newspaper size={14} style={{ color: "var(--c-gold)" }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--c-text-sm)", letterSpacing: "0.05em" }}>
            LATEST NEWS
          </span>
        </div>
        <Link href={`/${locale}/news`}
              className="text-xs font-semibold transition-colors hover:text-white"
              style={{ color: "var(--c-gold)" }}>
          View all →
        </Link>
      </div>

      {!articles?.length ? (
        <div style={{ padding: "32px 16px", textAlign: "center" }}>
          <p style={{ color: "var(--c-muted)", fontSize: 13 }}>No news available</p>
        </div>
      ) : (
        <div>
          {articles.map((a) => {
            const title = locale === "ar" && a.title_ar ? a.title_ar : a.title_en;
            const score = a.sentiment_score;
            const sentiment = score === null ? null : score > 0.2 ? "up" : score < -0.2 ? "down" : null;
            return (
              <a key={a.id} href={a.source_url || "#"} target="_blank" rel="noopener noreferrer"
                 className="group block px-4 py-3 transition-colors hover:bg-[var(--c-hover)]"
                 style={{ borderBottom: "1px solid var(--c-border)" }}>
                <div className="flex items-start gap-2">
                  {sentiment && (
                    <span className={`badge ${sentiment === "up" ? "badge-up" : "badge-down"} mt-0.5 shrink-0`}
                          style={{ padding: "1px 5px", fontSize: 9 }}>
                      {sentiment === "up" ? "▲" : "▼"}
                    </span>
                  )}
                  <p className="text-sm leading-snug line-clamp-2 group-hover:text-white transition-colors"
                     style={{ color: "var(--c-text)" }}>
                    {title || "Untitled"}
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  {a.source && (
                    <span className="badge badge-neutral" style={{ padding: "1px 6px", fontSize: 10 }}>
                      {a.source}
                    </span>
                  )}
                  {a.published_at && (
                    <span style={{ fontSize: 11, color: "var(--c-dim)" }}>{timeAgo(a.published_at)} ago</span>
                  )}
                </div>
              </a>
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
      {/* Hero TASI */}
      <div className="mb-5">
        <MarketHero locale={locale} />
      </div>

      {/* 3-panel grid: movers (left) + news (right) */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr 1.2fr" }}>
        {/* Movers takes 2 cols conceptually via flex stacking */}
        <div className="col-span-2">
          <MoversPanel locale={locale} />
        </div>
        {/* News */}
        <div>
          <NewsPanel locale={locale} />
        </div>
      </div>

      {/* Disclaimer */}
      <hr className="gradient-line my-8" />
      <p style={{ fontSize: 11, color: "var(--c-dim)", textAlign: "center" }}>
        SŪQAI provides translated market data for informational purposes only. Not investment advice.
      </p>
    </div>
  );
}
