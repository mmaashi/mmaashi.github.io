import { createServiceClient } from "@/lib/supabase/server";
import { getMarketSummary } from "@/lib/data-sources";
import { t } from "@/lib/i18n";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
} from "lucide-react";

// ════════════════════════════════════════════════════════════════
// Market Breadth Analysis Dashboard
// ════════════════════════════════════════════════════════════════

interface BreadthMetrics {
  advancing: number;
  declining: number;
  unchanged: number;
  total: number;
  near52wHigh: number;
  near52wLow: number;
  avgVolume: number;
  totalVolume: number;
  sectorPerformance: Array<{
    sector: string;
    advancing: number;
    declining: number;
    unchanged: number;
    avgChange: number;
    totalVolume: number;
    count: number;
  }>;
  volumeAboveAvg: number;
  volumeBelowAvg: number;
  tasiValue: number;
  tasiChange: number;
  tasiChangePercent: number;
}

async function calculateBreadthMetrics(): Promise<BreadthMetrics> {
  const supabase = await createServiceClient();

  // Fetch all stock prices with sector info
  const { data: stockData } = await supabase
    .from("stock_prices")
    .select(
      `
      ticker,
      close,
      open,
      change_percent,
      high_52w,
      low_52w,
      volume,
      companies (
        ticker,
        sector,
        name_en
      )
    `
    )
    .order("ticker");

  if (!stockData || stockData.length === 0) {
    return {
      advancing: 0,
      declining: 0,
      unchanged: 0,
      total: 0,
      near52wHigh: 0,
      near52wLow: 0,
      avgVolume: 0,
      totalVolume: 0,
      sectorPerformance: [],
      volumeAboveAvg: 0,
      volumeBelowAvg: 0,
      tasiValue: 0,
      tasiChange: 0,
      tasiChangePercent: 0,
    };
  }

  // ─────────────────────────────────────────────────────────
  // 1. BREADTH METRICS (Advancing / Declining / Unchanged)
  // ─────────────────────────────────────────────────────────
  let advancing = 0;
  let declining = 0;
  let unchanged = 0;
  let near52wHigh = 0;
  let near52wLow = 0;
  let totalVolume = 0;

  const stocks = stockData.map((s: any) => ({
    ticker: s.ticker,
    close: Number(s.close),
    open: Number(s.open),
    changePercent: Number(s.change_percent),
    high52w: Number(s.high_52w),
    low52w: Number(s.low_52w),
    volume: Number(s.volume),
    sector: s.companies?.[0]?.sector || "Other",
  }));

  for (const stock of stocks) {
    totalVolume += stock.volume;

    if (stock.changePercent > 0) advancing++;
    else if (stock.changePercent < 0) declining++;
    else unchanged++;

    // 52-week high/low detection (within 2% threshold)
    if (stock.high52w > 0 && stock.close >= stock.high52w * 0.98) {
      near52wHigh++;
    }
    if (stock.low52w > 0 && stock.close <= stock.low52w * 1.02) {
      near52wLow++;
    }
  }

  const total = stocks.length;
  const avgVolume = totalVolume > 0 ? totalVolume / total : 0;

  // ─────────────────────────────────────────────────────────
  // 2. SECTOR AGGREGATION
  // ─────────────────────────────────────────────────────────
  const sectorMap = new Map<
    string,
    {
      advancing: number;
      declining: number;
      unchanged: number;
      totalChange: number;
      count: number;
      totalVolume: number;
    }
  >();

  for (const stock of stocks) {
    const sector = stock.sector;
    if (!sectorMap.has(sector)) {
      sectorMap.set(sector, {
        advancing: 0,
        declining: 0,
        unchanged: 0,
        totalChange: 0,
        count: 0,
        totalVolume: 0,
      });
    }

    const sectorData = sectorMap.get(sector)!;
    sectorData.count++;
    sectorData.totalChange += stock.changePercent;
    sectorData.totalVolume += stock.volume;

    if (stock.changePercent > 0) sectorData.advancing++;
    else if (stock.changePercent < 0) sectorData.declining++;
    else sectorData.unchanged++;
  }

  const sectorPerformance = Array.from(sectorMap.entries())
    .map(([sector, data]) => ({
      sector,
      advancing: data.advancing,
      declining: data.declining,
      unchanged: data.unchanged,
      avgChange: data.count > 0 ? data.totalChange / data.count : 0,
      totalVolume: data.totalVolume,
      count: data.count,
    }))
    .sort((a, b) => b.avgChange - a.avgChange);

  // ─────────────────────────────────────────────────────────
  // 3. VOLUME ANALYSIS
  // ─────────────────────────────────────────────────────────
  let volumeAboveAvg = 0;
  let volumeBelowAvg = 0;

  for (const stock of stocks) {
    if (stock.volume >= avgVolume) volumeAboveAvg++;
    else volumeBelowAvg++;
  }

  // ─────────────────────────────────────────────────────────
  // 4. MARKET SUMMARY (from Sahm API)
  // ─────────────────────────────────────────────────────────
  const marketSummary = await getMarketSummary().catch(() => null);

  return {
    advancing,
    declining,
    unchanged,
    total,
    near52wHigh,
    near52wLow,
    avgVolume,
    totalVolume,
    sectorPerformance,
    volumeAboveAvg,
    volumeBelowAvg,
    tasiValue: marketSummary?.index_value || 0,
    tasiChange: marketSummary?.index_change || 0,
    tasiChangePercent: marketSummary?.index_change_percent || 0,
  };
}

// ════════════════════════════════════════════════════════════════
// Component: Market Breadth Dashboard Page
// ════════════════════════════════════════════════════════════════

export default async function BreadthPage() {
  const metrics = await calculateBreadthMetrics();
  const locale = "en"; // Would come from params in real app

  const percentAdvancing = metrics.total > 0 ? (metrics.advancing / metrics.total) * 100 : 0;
  const percentDeclining = metrics.total > 0 ? (metrics.declining / metrics.total) * 100 : 0;
  const percentUnchanged = metrics.total > 0 ? (metrics.unchanged / metrics.total) * 100 : 0;

  const adDecRatio = metrics.declining > 0 ? metrics.advancing / metrics.declining : 0;

  const volumeFormatter = new Intl.NumberFormat("en-US", {
    notation: "compact",
    compactDisplay: "short",
  });

  return (
    <div style={{ background: "var(--c-base)", color: "var(--c-text)", minHeight: "100vh", padding: "2rem" }}>
      {/* ─────────────────────────────────────────────────────────────
          PAGE HEADER
          ───────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: "2.5rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          {t("breadth.title", locale)}
        </h1>
        <p style={{ color: "var(--c-muted)", fontSize: "0.95rem" }}>
          {t("breadth.subtitle", locale)}
        </p>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MAIN GRID
          ───────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        {/* ═══════════════════════════════════════════════════════════
            SECTION A: MARKET PULSE (Advancing / Declining / Unchanged)
            ═══════════════════════════════════════════════════════════ */}
        <div
          style={{
            background: "var(--c-surface)",
            border: "1px solid var(--c-border)",
            borderRadius: "var(--radius-md)",
            padding: "1.5rem",
            gridColumn: "span 1",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
            <Activity size={18} style={{ color: "var(--c-gold)" }} />
            <h2 style={{ fontSize: "1rem", fontWeight: 600 }}>{t("breadth.market_pulse", locale)}</h2>
          </div>

          {/* Stacked horizontal bar */}
          <div style={{ marginBottom: "1.5rem" }}>
            <div
              style={{
                display: "flex",
                height: "32px",
                borderRadius: "var(--radius-sm)",
                overflow: "hidden",
                background: "var(--c-elevated)",
                border: "1px solid var(--c-border)",
              }}
            >
              {percentAdvancing > 0 && (
                <div
                  style={{
                    flex: `${percentAdvancing}%`,
                    background: "var(--c-green)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#000",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    transition: "flex 0.3s ease-out",
                  }}
                >
                  {percentAdvancing > 10 && `${Math.round(percentAdvancing)}%`}
                </div>
              )}
              {percentUnchanged > 0 && (
                <div
                  style={{
                    flex: `${percentUnchanged}%`,
                    background: "var(--c-muted)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#000",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    opacity: 0.6,
                    transition: "flex 0.3s ease-out",
                  }}
                >
                  {percentUnchanged > 10 && `${Math.round(percentUnchanged)}%`}
                </div>
              )}
              {percentDeclining > 0 && (
                <div
                  style={{
                    flex: `${percentDeclining}%`,
                    background: "var(--c-red)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#000",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    transition: "flex 0.3s ease-out",
                  }}
                >
                  {percentDeclining > 10 && `${Math.round(percentDeclining)}%`}
                </div>
              )}
            </div>
          </div>

          {/* Stats grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "1rem",
              marginBottom: "1.5rem",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "0.8rem", color: "var(--c-muted)", marginBottom: "0.5rem" }}>
                {t("breadth.advancing", locale)}
              </div>
              <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--c-green)" }}>
                {metrics.advancing}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--c-muted)", marginTop: "0.25rem" }}>
                {Math.round(percentAdvancing)}%
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "0.8rem", color: "var(--c-muted)", marginBottom: "0.5rem" }}>
                {t("breadth.unchanged", locale)}
              </div>
              <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--c-muted)" }}>
                {metrics.unchanged}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--c-muted)", marginTop: "0.25rem" }}>
                {Math.round(percentUnchanged)}%
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "0.8rem", color: "var(--c-muted)", marginBottom: "0.5rem" }}>
                {t("breadth.declining", locale)}
              </div>
              <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--c-red)" }}>
                {metrics.declining}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--c-muted)", marginTop: "0.25rem" }}>
                {Math.round(percentDeclining)}%
              </div>
            </div>
          </div>

          {/* TASI Summary */}
          <div
            style={{
              background: "var(--c-elevated)",
              border: "1px solid var(--c-border)",
              borderRadius: "var(--radius-sm)",
              padding: "1rem",
            }}
          >
            <div style={{ fontSize: "0.75rem", color: "var(--c-muted)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              TASI Index
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{Math.round(metrics.tasiValue).toLocaleString()}</div>
              <div
                style={{
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  color: metrics.tasiChangePercent >= 0 ? "var(--c-green)" : "var(--c-red)",
                }}
              >
                {metrics.tasiChangePercent >= 0 ? "+" : ""}{metrics.tasiChangePercent.toFixed(2)}%
              </div>
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--c-muted)", marginTop: "0.5rem" }}>
              Volume: {volumeFormatter.format(metrics.totalVolume)}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            SECTION B: ADVANCE / DECLINE RATIO
            ═══════════════════════════════════════════════════════════ */}
        <div
          style={{
            background: "var(--c-surface)",
            border: "1px solid var(--c-border)",
            borderRadius: "var(--radius-md)",
            padding: "1.5rem",
            gridColumn: "span 1",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <TrendingUp size={18} style={{ color: "var(--c-gold)" }} />
            <h2 style={{ fontSize: "1rem", fontWeight: 600 }}>{t("breadth.ad_ratio", locale)}</h2>
          </div>

          {/* Large ratio display */}
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1.5rem",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "0.8rem", color: "var(--c-muted)", marginBottom: "0.75rem" }}>
                Advancing to Declining
              </div>
              <div
                style={{
                  fontSize: "2.5rem",
                  fontWeight: 700,
                  color: "var(--c-gold)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {adDecRatio.toFixed(2)}:1
              </div>
            </div>
          </div>

          {/* Side-by-side bars */}
          <div style={{ display: "flex", gap: "1rem" }}>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  background: "var(--c-elevated)",
                  border: `2px solid var(--c-green)`,
                  borderRadius: "var(--radius-sm)",
                  padding: "1rem",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "0.75rem", color: "var(--c-muted)", marginBottom: "0.5rem" }}>
                  Advancing
                </div>
                <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--c-green)" }}>
                  {metrics.advancing}
                </div>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  background: "var(--c-elevated)",
                  border: `2px solid var(--c-red)`,
                  borderRadius: "var(--radius-sm)",
                  padding: "1rem",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "0.75rem", color: "var(--c-muted)", marginBottom: "0.5rem" }}>
                  Declining
                </div>
                <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--c-red)" }}>
                  {metrics.declining}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            SECTION C: 52-WEEK HIGHS vs LOWS
            ═══════════════════════════════════════════════════════════ */}
        <div
          style={{
            background: "var(--c-surface)",
            border: "1px solid var(--c-border)",
            borderRadius: "var(--radius-md)",
            padding: "1.5rem",
            gridColumn: "span 1",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <TrendingUp size={18} style={{ color: "var(--c-gold)" }} />
            <h2 style={{ fontSize: "1rem", fontWeight: 600 }}>{t("breadth.new_highs", locale)}</h2>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ fontSize: "0.8rem", color: "var(--c-muted)", marginBottom: "0.75rem" }}>
              Near 52W High vs Low
            </div>
            <div
              style={{
                display: "flex",
                height: "40px",
                gap: "0.5rem",
                borderRadius: "var(--radius-sm)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  flex: metrics.near52wHigh,
                  background: "var(--c-green)",
                  borderRadius: "var(--radius-sm)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#000",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  minWidth: "2rem",
                  transition: "flex 0.3s ease-out",
                }}
              >
                {metrics.near52wHigh > 0 && metrics.near52wHigh}
              </div>
              <div
                style={{
                  flex: metrics.near52wLow,
                  background: "var(--c-red)",
                  borderRadius: "var(--radius-sm)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#000",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  minWidth: "2rem",
                  transition: "flex 0.3s ease-out",
                }}
              >
                {metrics.near52wLow > 0 && metrics.near52wLow}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div
              style={{
                background: "var(--c-elevated)",
                border: "1px solid var(--c-border)",
                borderRadius: "var(--radius-sm)",
                padding: "1rem",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "0.75rem", color: "var(--c-muted)", marginBottom: "0.5rem" }}>
                {t("breadth.new_highs", locale)}
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--c-green)" }}>
                {metrics.near52wHigh}
              </div>
            </div>
            <div
              style={{
                background: "var(--c-elevated)",
                border: "1px solid var(--c-border)",
                borderRadius: "var(--radius-sm)",
                padding: "1rem",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "0.75rem", color: "var(--c-muted)", marginBottom: "0.5rem" }}>
                {t("breadth.new_lows", locale)}
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--c-red)" }}>
                {metrics.near52wLow}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION D: SECTOR PERFORMANCE HEATMAP (Full Width)
          ───────────────────────────────────────────────────────────── */}
      <div
        style={{
          background: "var(--c-surface)",
          border: "1px solid var(--c-border)",
          borderRadius: "var(--radius-md)",
          padding: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1.5rem" }}>
          {t("breadth.sector_perf", locale)}
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "1rem",
          }}
        >
          {metrics.sectorPerformance.map((sector) => {
            const intensity = Math.max(-100, Math.min(100, sector.avgChange * 20));
            const isPositive = intensity >= 0;
            const bgColor = isPositive
              ? `rgba(14, 203, 129, ${Math.min(0.4, Math.abs(intensity) / 100)})`
              : `rgba(246, 70, 93, ${Math.min(0.4, Math.abs(intensity) / 100)})`;
            const textColor = isPositive ? "var(--c-green)" : "var(--c-red)";

            return (
              <div
                key={sector.sector}
                style={{
                  background: bgColor,
                  border: `1px solid ${textColor}`,
                  borderRadius: "var(--radius-md)",
                  padding: "1.25rem",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div style={{ fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.75rem", color: "var(--c-text)" }}>
                  {sector.sector}
                </div>
                <div
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    color: textColor,
                    marginBottom: "0.75rem",
                  }}
                >
                  {sector.avgChange >= 0 ? "+" : ""}{sector.avgChange.toFixed(2)}%
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--c-muted)", display: "flex", gap: "0.5rem" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <span style={{ color: "var(--c-green)" }}>▲</span> {sector.advancing}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <span style={{ color: "var(--c-red)" }}>▼</span> {sector.declining}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION E: VOLUME ANALYSIS
          ───────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.5rem",
        }}
      >
        <div
          style={{
            background: "var(--c-surface)",
            border: "1px solid var(--c-border)",
            borderRadius: "var(--radius-md)",
            padding: "1.5rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <Activity size={18} style={{ color: "var(--c-gold)" }} />
            <h2 style={{ fontSize: "1rem", fontWeight: 600 }}>{t("breadth.volume_analysis", locale)}</h2>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ fontSize: "0.8rem", color: "var(--c-muted)", marginBottom: "0.75rem" }}>
              Total Market Volume
            </div>
            <div style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem" }}>
              {volumeFormatter.format(metrics.totalVolume)}
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--c-muted)" }}>
              Avg / Stock: {volumeFormatter.format(metrics.avgVolume)}
            </div>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ fontSize: "0.8rem", color: "var(--c-muted)", marginBottom: "0.75rem" }}>
              Volume Distribution
            </div>
            <div
              style={{
                display: "flex",
                height: "32px",
                borderRadius: "var(--radius-sm)",
                overflow: "hidden",
                background: "var(--c-elevated)",
                border: "1px solid var(--c-border)",
              }}
            >
              <div
                style={{
                  flex: metrics.volumeAboveAvg,
                  background: "var(--c-green)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#000",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                }}
              >
                {metrics.volumeAboveAvg > 0 && `${metrics.volumeAboveAvg}`}
              </div>
              <div
                style={{
                  flex: metrics.volumeBelowAvg,
                  background: "var(--c-muted)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#000",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  opacity: 0.6,
                }}
              >
                {metrics.volumeBelowAvg > 0 && `${metrics.volumeBelowAvg}`}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div
              style={{
                background: "var(--c-elevated)",
                border: "1px solid var(--c-border)",
                borderRadius: "var(--radius-sm)",
                padding: "1rem",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "0.75rem", color: "var(--c-muted)", marginBottom: "0.5rem" }}>
                Above Avg
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--c-green)" }}>
                {metrics.volumeAboveAvg}
              </div>
            </div>
            <div
              style={{
                background: "var(--c-elevated)",
                border: "1px solid var(--c-border)",
                borderRadius: "var(--radius-sm)",
                padding: "1rem",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "0.75rem", color: "var(--c-muted)", marginBottom: "0.5rem" }}>
                Below Avg
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--c-muted)" }}>
                {metrics.volumeBelowAvg}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div
            style={{
              background: "var(--c-surface)",
              border: "1px solid var(--c-border)",
              borderRadius: "var(--radius-md)",
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--c-muted)", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Total Stocks Analyzed
              </div>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--c-gold)" }}>
                {metrics.total}
              </div>
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--c-muted)", marginTop: "1rem" }}>
              Market breadth dataset updated continuously throughout trading day
            </div>
          </div>

          <div
            style={{
              background: "var(--c-surface)",
              border: "1px solid var(--c-border)",
              borderRadius: "var(--radius-md)",
              padding: "1.5rem",
            }}
          >
            <div style={{ fontSize: "0.75rem", color: "var(--c-muted)", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Market Health Indicator
            </div>
            <div
              style={{
                fontSize: "1.25rem",
                fontWeight: 600,
                color: metrics.advancing > metrics.declining ? "var(--c-green)" : "var(--c-red)",
              }}
            >
              {metrics.advancing > metrics.declining ? "Bullish" : metrics.declining > metrics.advancing ? "Bearish" : "Neutral"}
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--c-muted)", marginTop: "0.5rem" }}>
              {Math.round(((metrics.advancing - metrics.declining) / metrics.total) * 100)}% net breadth
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
