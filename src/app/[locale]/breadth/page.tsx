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

  // Fetch all companies first to get IDs
  const { data: companies } = await supabase
    .from("companies")
    .select("id, ticker, sector");

  if (!companies || companies.length === 0) {
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

  const companyIds = companies.map((c) => c.id);

  // Fetch all stock prices - query the actual columns that exist
  const { data: allPrices } = await supabase
    .from("stock_prices")
    .select("company_id, close, open, date, volume")
    .in("company_id", companyIds)
    .order("date", { ascending: false })
    .limit(500 * companyIds.length); // Fetch ~500 days per stock for 52-week analysis

  if (!allPrices || allPrices.length === 0) {
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
  // 1. GET LATEST PRICE & PREVIOUS PRICE FOR EACH COMPANY
  // ─────────────────────────────────────────────────────────
  const sortedPrices = [...allPrices].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const latestPrices = new Map<
    string,
    { close: number; open: number; volume: number; date: string }
  >();
  const previousPrices = new Map<
    string,
    { close: number; open: number; volume: number; date: string }
  >();
  const allHistoricalPrices = new Map<string, Array<number>>();

  for (const price of sortedPrices) {
    const compId = price.company_id;

    // Track latest price
    if (!latestPrices.has(compId)) {
      latestPrices.set(compId, {
        close: Number(price.close),
        open: Number(price.open),
        volume: Number(price.volume),
        date: price.date,
      });
    }
    // Track previous price (second most recent)
    else if (!previousPrices.has(compId)) {
      previousPrices.set(compId, {
        close: Number(price.close),
        open: Number(price.open),
        volume: Number(price.volume),
        date: price.date,
      });
    }

    // Collect all historical prices for 52-week analysis
    if (!allHistoricalPrices.has(compId)) {
      allHistoricalPrices.set(compId, []);
    }
    allHistoricalPrices.get(compId)!.push(Number(price.close));
  }

  // ─────────────────────────────────────────────────────────
  // 2. BREADTH METRICS (Advancing / Declining / Unchanged)
  // ─────────────────────────────────────────────────────────
  let advancing = 0;
  let declining = 0;
  let unchanged = 0;
  let near52wHigh = 0;
  let near52wLow = 0;
  let totalVolume = 0;

  const stocks = [];

  for (const company of companies) {
    const latest = latestPrices.get(company.id);
    if (!latest) continue;

    const previous = previousPrices.get(company.id);
    const changePercent = previous
      ? ((latest.close - previous.close) / previous.close) * 100
      : 0;

    totalVolume += latest.volume;

    if (changePercent > 0) advancing++;
    else if (changePercent < 0) declining++;
    else unchanged++;

    // 52-week high/low detection
    const historicalPrices = allHistoricalPrices.get(company.id) || [];
    if (historicalPrices.length > 0) {
      const high52w = Math.max(...historicalPrices);
      const low52w = Math.min(...historicalPrices);

      // Within 2% of 52-week high
      if (high52w > 0 && latest.close >= high52w * 0.98) {
        near52wHigh++;
      }
      // Within 2% of 52-week low
      if (low52w > 0 && latest.close <= low52w * 1.02) {
        near52wLow++;
      }
    }

    stocks.push({
      companyId: company.id,
      ticker: company.ticker,
      sector: company.sector,
      close: latest.close,
      open: latest.open,
      volume: latest.volume,
      changePercent,
    });
  }

  const total = stocks.length;
  const avgVolume = totalVolume > 0 ? totalVolume / total : 0;

  // ─────────────────────────────────────────────────────────
  // 3. SECTOR AGGREGATION
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
    const sector = stock.sector || "Other";
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
  // 4. VOLUME ANALYSIS
  // ─────────────────────────────────────────────────────────
  let volumeAboveAvg = 0;
  let volumeBelowAvg = 0;

  for (const stock of stocks) {
    if (stock.volume >= avgVolume) volumeAboveAvg++;
    else volumeBelowAvg++;
  }

  // ─────────────────────────────────────────────────────────
  // 5. MARKET SUMMARY (from Sahm API)
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

export default async function BreadthPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isAr = locale === "ar";

  const metrics = await calculateBreadthMetrics();

  const percentAdvancing =
    metrics.total > 0 ? (metrics.advancing / metrics.total) * 100 : 0;
  const percentDeclining =
    metrics.total > 0 ? (metrics.declining / metrics.total) * 100 : 0;
  const percentUnchanged =
    metrics.total > 0 ? (metrics.unchanged / metrics.total) * 100 : 0;

  const adDecRatio =
    metrics.declining > 0 ? metrics.advancing / metrics.declining : 0;

  const volumeFormatter = new Intl.NumberFormat(isAr ? "ar-SA" : "en-US", {
    notation: "compact",
    compactDisplay: "short",
  });

  // Bilingual label helpers
  const getLabel = (enLabel: string, arLabel: string) =>
    isAr ? arLabel : enLabel;

  return (
    <div
      style={{
        background: "var(--c-base)",
        color: "var(--c-text)",
        minHeight: "100vh",
        padding: "2rem",
      }}
    >
      {/* ─────────────────────────────────────────────────────────────
          PAGE HEADER
          ───────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: "2.5rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          {t(locale, "breadth.title")}
        </h1>
        <p style={{ color: "var(--c-muted)", fontSize: "0.95rem" }}>
          {t(locale, "breadth.subtitle")}
        </p>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MAIN GRID
          ───────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))",
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "1.25rem",
            }}
          >
            <Activity size={18} style={{ color: "var(--c-gold)" }} />
            <h2 style={{ fontSize: "1rem", fontWeight: 600 }}>
              {t(locale, "breadth.market_pulse")}
            </h2>
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
                    opacity: 0.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#000",
                    fontSize: "0.75rem",
                    fontWeight: 700,
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
              gridTemplateColumns: "repeat(auto-fit, minmax(min(140px, 100%), 1fr))",
              gap: "1rem",
            }}
          >
            <div
              style={{
                background: "var(--c-elevated)",
                border: "1px solid var(--c-border)",
                borderRadius: "var(--radius-sm)",
                padding: "1rem",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--c-muted)",
                  marginBottom: "0.5rem",
                }}
              >
                {getLabel("Advancing", "صاعد")}
              </div>
              <div
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "var(--c-green)",
                }}
              >
                {metrics.advancing}
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
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--c-muted)",
                  marginBottom: "0.5rem",
                }}
              >
                {getLabel("Unchanged", "بدون تغيير")}
              </div>
              <div
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "var(--c-muted)",
                }}
              >
                {metrics.unchanged}
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
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--c-muted)",
                  marginBottom: "0.5rem",
                }}
              >
                {getLabel("Declining", "هابط")}
              </div>
              <div
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "var(--c-red)",
                }}
              >
                {metrics.declining}
              </div>
            </div>
          </div>

          {/* A/D Ratio */}
          <div
            style={{
              background: "var(--c-elevated)",
              border: "1px solid var(--c-border)",
              borderRadius: "var(--radius-sm)",
              padding: "1rem",
              marginTop: "1rem",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--c-muted)",
                marginBottom: "0.5rem",
                textTransform: "uppercase",
              }}
            >
              {getLabel("Advancing to Declining", "النسبة الصاعدة للهابطة")}
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>
              {adDecRatio.toFixed(2)}:1
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            SECTION B: 52-WEEK HIGHS/LOWS
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "1.5rem",
            }}
          >
            <TrendingUp size={18} style={{ color: "var(--c-gold)" }} />
            <h2 style={{ fontSize: "1rem", fontWeight: 600 }}>
              {getLabel("52-Week Range", "نطاق 52 أسبوع")}
            </h2>
          </div>

          {/* Stacked bar */}
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

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))", gap: "1rem" }}>
            <div
              style={{
                background: "var(--c-elevated)",
                border: "1px solid var(--c-border)",
                borderRadius: "var(--radius-sm)",
                padding: "1rem",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--c-muted)",
                  marginBottom: "0.5rem",
                }}
              >
                {t(locale, "breadth.new_highs")}
              </div>
              <div
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "var(--c-green)",
                }}
              >
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
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--c-muted)",
                  marginBottom: "0.5rem",
                }}
              >
                {t(locale, "breadth.new_lows")}
              </div>
              <div
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "var(--c-red)",
                }}
              >
                {metrics.near52wLow}
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            SECTION C: VOLUME ANALYSIS (Left)
            ═══════════════════════════════════════════════════════════ */}
        <div
          style={{
            background: "var(--c-surface)",
            border: "1px solid var(--c-border)",
            borderRadius: "var(--radius-md)",
            padding: "1.5rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "1.5rem",
            }}
          >
            <Activity size={18} style={{ color: "var(--c-gold)" }} />
            <h2 style={{ fontSize: "1rem", fontWeight: 600 }}>
              {t(locale, "breadth.volume_analysis")}
            </h2>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <div
              style={{
                fontSize: "0.8rem",
                color: "var(--c-muted)",
                marginBottom: "0.75rem",
              }}
            >
              {getLabel("Total Market Volume", "إجمالي حجم السوق")}
            </div>
            <div style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem" }}>
              {volumeFormatter.format(metrics.totalVolume)}
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--c-muted)" }}>
              {getLabel("Avg / Stock", "المتوسط / السهم")}:{" "}
              {volumeFormatter.format(metrics.avgVolume)}
            </div>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <div
              style={{
                fontSize: "0.8rem",
                color: "var(--c-muted)",
                marginBottom: "0.75rem",
              }}
            >
              {getLabel("Volume Distribution", "توزيع الحجم")}
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

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))", gap: "1rem" }}>
            <div
              style={{
                background: "var(--c-elevated)",
                border: "1px solid var(--c-border)",
                borderRadius: "var(--radius-sm)",
                padding: "1rem",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--c-muted)",
                  marginBottom: "0.5rem",
                }}
              >
                {getLabel("Above Avg", "فوق المتوسط")}
              </div>
              <div
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "var(--c-green)",
                }}
              >
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
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--c-muted)",
                  marginBottom: "0.5rem",
                }}
              >
                {getLabel("Below Avg", "تحت المتوسط")}
              </div>
              <div
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "var(--c-muted)",
                }}
              >
                {metrics.volumeBelowAvg}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION D: QUICK STATS (Full Width Below)
          ───────────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))",
          gap: "1.5rem",
          marginBottom: "2rem",
        }}
      >
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
            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--c-muted)",
                marginBottom: "0.75rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {getLabel("Total Stocks Analyzed", "إجمالي الأسهم المحللة")}
            </div>
            <div
              style={{
                fontSize: "2rem",
                fontWeight: 700,
                color: "var(--c-gold)",
              }}
            >
              {metrics.total}
            </div>
          </div>
          <div
            style={{
              fontSize: "0.8rem",
              color: "var(--c-muted)",
              marginTop: "1rem",
            }}
          >
            {getLabel(
              "Market breadth dataset updated continuously",
              "يتم تحديث مجموعة بيانات اتساع السوق بشكل مستمر"
            )}
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
          <div
            style={{
              fontSize: "0.75rem",
              color: "var(--c-muted)",
              marginBottom: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {getLabel("Market Health Indicator", "مؤشر صحة السوق")}
          </div>
          <div
            style={{
              fontSize: "1.25rem",
              fontWeight: 600,
              color:
                metrics.advancing > metrics.declining
                  ? "var(--c-green)"
                  : metrics.declining > metrics.advancing
                    ? "var(--c-red)"
                    : "var(--c-muted)",
            }}
          >
            {metrics.advancing > metrics.declining
              ? getLabel("Bullish", "صعودي")
              : metrics.declining > metrics.advancing
                ? getLabel("Bearish", "هابط")
                : getLabel("Neutral", "محايد")}
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--c-muted)", marginTop: "0.5rem" }}>
            {metrics.total > 0
              ? Math.round(
                  ((metrics.advancing - metrics.declining) / metrics.total) * 100
                )
              : 0}
            % {getLabel("net breadth", "صافي الاتساع")}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION E: SECTOR PERFORMANCE HEATMAP (Full Width)
          ───────────────────────────────────────────────────────────── */}
      <div
        style={{
          background: "var(--c-surface)",
          border: "1px solid var(--c-border)",
          borderRadius: "var(--radius-md)",
          padding: "1.5rem",
        }}
      >
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1.5rem" }}>
          {t(locale, "breadth.sector_perf")}
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "1rem",
          }}
        >
          {metrics.sectorPerformance.map((sector) => {
            const intensity = Math.max(
              -100,
              Math.min(100, sector.avgChange * 20)
            );
            const isPositive = intensity >= 0;
            const bgColor = isPositive
              ? `rgba(14, 203, 129, ${Math.min(
                  0.4,
                  Math.abs(intensity) / 100
                )})`
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
                <div
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    marginBottom: "0.75rem",
                    color: "var(--c-text)",
                  }}
                >
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
                  {sector.avgChange >= 0 ? "+" : ""}
                  {sector.avgChange.toFixed(2)}%
                </div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--c-muted)",
                    display: "flex",
                    gap: "0.5rem",
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                    }}
                  >
                    <span style={{ color: "var(--c-green)" }}>▲</span>{" "}
                    {sector.advancing}
                  </span>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                    }}
                  >
                    <span style={{ color: "var(--c-red)" }}>▼</span>{" "}
                    {sector.declining}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
