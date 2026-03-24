import { createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { t } from "@/lib/i18n";

export default async function EarningsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isAr = locale === "ar";
  const supabase = createServiceClient();

  // Fetch latest financials with company info
  const { data: financials } = await supabase
    .from("financials")
    .select("id, company_id, period, year, revenue, net_income, earnings_per_share, total_assets")
    .order("year", { ascending: false })
    .order("period", { ascending: false })
    .limit(500);

  // Fetch company names for enrichment
  const { data: companies } = await supabase
    .from("companies")
    .select("id, ticker, name_en, name_ar");

  // Create company lookup map by company_id
  const companyMap = new Map<string, { ticker: string; name_en: string; name_ar: string }>();
  if (companies) {
    for (const company of companies) {
      companyMap.set(company.id, {
        ticker: company.ticker || "",
        name_en: company.name_en || "",
        name_ar: company.name_ar || company.name_en || "",
      });
    }
  }

  // Group financials by company_id and get latest 2 periods
  const companyGroups = new Map<string, typeof financials>();
  if (financials) {
    for (const item of financials) {
      if (!companyGroups.has(item.company_id)) {
        companyGroups.set(item.company_id, []);
      }
      companyGroups.get(item.company_id)!.push(item);
    }
  }

  // Process each company to get latest and previous period
  interface EarningsCard {
    ticker: string;
    name_en: string;
    name_ar: string;
    currentPeriod: string;
    currentYear: number;
    beat: boolean; // true = beat, false = miss
    revenue: number;
    netIncome: number;
    eps: number;
    revenueChangePercent: number;
    netIncomeChangePercent: number;
    epsChangePercent: number;
    epsExpected?: number;
    epsSurprise?: number;
  }

  const earningsCards: EarningsCard[] = [];

  for (const [companyId, periods] of companyGroups) {
    if (periods && periods.length >= 2) {
      const latest = periods[0];
      const previous = periods[1];

      // Get company info from lookup
      const company = companyMap.get(companyId) || { ticker: "", name_en: "", name_ar: "" };

      // Calculate changes
      const revenueChange =
        previous.revenue && latest.revenue
          ? ((latest.revenue - previous.revenue) / previous.revenue) * 100
          : 0;
      const netIncomeChange =
        previous.net_income && latest.net_income
          ? ((latest.net_income - previous.net_income) / previous.net_income) * 100
          : 0;
      const epsChange =
        previous.earnings_per_share && latest.earnings_per_share
          ? ((latest.earnings_per_share - previous.earnings_per_share) / previous.earnings_per_share) * 100
          : 0;

      // Calculate EPS surprise (actual vs expected from previous period)
      const actualEps = latest.earnings_per_share || 0;
      const expectedEps = previous.earnings_per_share || 0;
      const epsSurprise = expectedEps !== 0
        ? ((actualEps - expectedEps) / Math.abs(expectedEps)) * 100
        : 0;

      const beat = (latest.net_income ?? 0) > (previous.net_income ?? 0);

      earningsCards.push({
        ticker: company.ticker,
        name_en: company.name_en,
        name_ar: company.name_ar,
        currentPeriod: latest.period,
        currentYear: latest.year,
        beat,
        revenue: latest.revenue || 0,
        netIncome: latest.net_income || 0,
        eps: latest.earnings_per_share || 0,
        revenueChangePercent: revenueChange,
        netIncomeChangePercent: netIncomeChange,
        epsChangePercent: epsChange,
        epsExpected: expectedEps,
        epsSurprise: epsSurprise,
      });
    }
  }

  // Sort by most recent period
  earningsCards.sort(
    (a, b) => new Date(b.currentPeriod).getTime() - new Date(a.currentPeriod).getTime()
  );

  // Calculate summary stats
  const totalReported = earningsCards.length;
  const beatCount = earningsCards.filter(c => c.beat).length;
  const beatRate = totalReported > 0 ? ((beatCount / totalReported) * 100).toFixed(1) : "0";
  const avgSurprise = totalReported > 0
    ? (earningsCards.reduce((sum, c) => sum + (c.epsSurprise || 0), 0) / totalReported).toFixed(1)
    : "0";

  const biggestBeat = earningsCards.length > 0
    ? earningsCards.reduce((max, c) => (c.epsSurprise || 0) > (max.epsSurprise || 0) ? c : max)
    : null;

  const biggestMiss = earningsCards.length > 0
    ? earningsCards.reduce((min, c) => (c.epsSurprise || 0) < (min.epsSurprise || 0) ? c : min)
    : null;

  // Format currency helper
  function formatCurrency(value: number): string {
    if (value >= 1_000_000_000) {
      return `${(value / 1_000_000_000).toFixed(2)}B`;
    }
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(2)}M`;
    }
    return value.toFixed(2);
  }

  // Format percentage helper
  function formatPercent(value: number): string {
    return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
  }

  // Format period and year to readable format
  function formatPeriodWithYear(period: string, year: number): string {
    // Expected format: "Q1", "Q2", "Q3", "Q4", or "annual"
    const periodStr = period.toUpperCase();
    return `${periodStr} ${year}`;
  }

  return (
    <div className="page-wrap">
      <style>{`
        .earnings-card:hover { border-color: var(--c-gold) !important; box-shadow: 0 0 0 1px var(--c-gold-dim); background: rgba(200,169,81,0.02) !important; }
        .earnings-metric:hover { background: rgba(200,169,81,0.05) !important; }
        .earnings-summary-stat { display: flex; flex-direction: column; gap: 8px; }
        .earnings-summary-stat-value { font-size: 24px; font-weight: 700; font-family: var(--font-grotesk); color: var(--c-gold); }
        .earnings-summary-stat-label { font-size: 12px; font-weight: 600; color: var(--c-muted); text-transform: uppercase; letter-spacing: 0.05em; }
        .surprise-positive { color: var(--c-green); }
        .surprise-negative { color: var(--c-red); }
        .surprise-bar { height: 4px; background: var(--c-border); border-radius: 2px; overflow: hidden; }
        .surprise-bar-fill { height: 100%; background: var(--c-gold); transition: width 0.3s ease-out; }
      `}</style>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            background: "var(--c-gold-dim)",
            border: "1px solid var(--c-gold-ring)",
          }}
        >
          <TrendingUp size={18} style={{ color: "var(--c-gold)" }} />
        </div>
        <div>
          <h1
            className="font-bold text-2xl"
            style={{
              color: "var(--c-text)",
              fontFamily: "var(--font-grotesk)",
            }}
          >
            {t(locale, "earnings.title")}
          </h1>
          <p style={{ fontSize: 13, color: "var(--c-muted)", marginTop: 4 }}>
            {t(locale, "earnings.subtitle")}
          </p>
        </div>
      </div>

      {/* Summary Stats Banner */}
      {earningsCards.length > 0 && (
        <div
          style={{
            background: "var(--c-elevated)",
            border: "1px solid var(--c-border)",
            borderRadius: "var(--radius-md)",
            padding: 24,
            marginBottom: 32,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(140px, 100%), 1fr))",
            gap: 32,
          }}
        >
          {/* Total Reported */}
          <div className="earnings-summary-stat">
            <div className="earnings-summary-stat-label">
              {t(locale, "earnings.total_reported")}
            </div>
            <div className="earnings-summary-stat-value">{totalReported}</div>
          </div>

          {/* Beat Rate */}
          <div className="earnings-summary-stat">
            <div className="earnings-summary-stat-label">
              {t(locale, "earnings.beat_rate")}
            </div>
            <div className="earnings-summary-stat-value" style={{ color: "var(--c-green)" }}>
              {beatRate}%
            </div>
          </div>

          {/* Average Surprise */}
          <div className="earnings-summary-stat">
            <div className="earnings-summary-stat-label">
              {t(locale, "earnings.avg_surprise")}
            </div>
            <div
              className="earnings-summary-stat-value"
              style={{ color: parseFloat(avgSurprise) >= 0 ? "var(--c-green)" : "var(--c-red)" }}
            >
              {parseFloat(avgSurprise) >= 0 ? "+" : ""}{avgSurprise}%
            </div>
          </div>

          {/* Biggest Beat */}
          {biggestBeat && (
            <div className="earnings-summary-stat">
              <div className="earnings-summary-stat-label">
                {t(locale, "earnings.biggest_beat")}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span className="earnings-summary-stat-value" style={{ color: "var(--c-green)", fontSize: 18 }}>
                  {biggestBeat.ticker}
                </span>
              </div>
              <div style={{ fontSize: 12, color: "var(--c-green)", fontWeight: 600 }}>
                +{(biggestBeat.epsSurprise || 0).toFixed(1)}%
              </div>
            </div>
          )}

          {/* Biggest Miss */}
          {biggestMiss && (
            <div className="earnings-summary-stat">
              <div className="earnings-summary-stat-label">
                {t(locale, "earnings.biggest_miss")}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span className="earnings-summary-stat-value" style={{ color: "var(--c-red)", fontSize: 18 }}>
                  {biggestMiss.ticker}
                </span>
              </div>
              <div style={{ fontSize: 12, color: "var(--c-red)", fontWeight: 600 }}>
                {(biggestMiss.epsSurprise || 0).toFixed(1)}%
              </div>
            </div>
          )}
        </div>
      )}

      {/* Earnings Results Section */}
      <div style={{ marginBottom: 24 }}>
        <h2
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "var(--c-text)",
            fontFamily: "var(--font-grotesk)",
            marginBottom: 16,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {t(locale, "earnings.calendar_view")}
        </h2>
      </div>

      {/* Earnings Cards */}
      {earningsCards.length === 0 ? (
        <div
          style={{
            padding: 40,
            textAlign: "center",
            background: "var(--c-surface)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--c-border)",
          }}
        >
          <p style={{ color: "var(--c-muted)", fontSize: 14 }}>
            {t(locale, "earnings.no_data")}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(380px, 100%), 1fr))",
            gap: 16,
          }}
        >
          {earningsCards.map((card) => {
            const name = isAr && card.name_ar ? card.name_ar : card.name_en;
            const badgeColor = card.beat ? "var(--c-green)" : "var(--c-red)";
            const badgeBg = card.beat
              ? "rgba(14, 203, 129, 0.1)"
              : "rgba(255, 67, 54, 0.1)";

            const surpriseColor = (card.epsSurprise || 0) >= 0 ? "var(--c-green)" : "var(--c-red)";
            const surpriseSign = (card.epsSurprise || 0) >= 0 ? "+" : "";
            const surpriseText = `${surpriseSign}${(card.epsSurprise || 0).toFixed(1)}%`;

            // Calculate bar width (max magnitude of 50%)
            const maxMagnitude = 50;
            const barWidth = Math.min(Math.abs(card.epsSurprise || 0), maxMagnitude) / maxMagnitude * 100;

            return (
              <div
                key={`${card.ticker}-${card.currentPeriod}`}
                className="earnings-card"
                style={{
                  background: "var(--c-surface)",
                  border: "1px solid var(--c-border)",
                  borderRadius: "var(--radius-md)",
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  transition: "all 0.2s ease-out",
                  cursor: "pointer",
                }}
              >
                {/* Top: Ticker + Name + Badge */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <Link href={`/${locale}/stock/${card.ticker}`}>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: "var(--c-text)",
                          fontFamily: "var(--font-grotesk)",
                        }}
                        className="ticker-tag"
                      >
                        {card.ticker}
                      </div>
                      <p
                        style={{
                          fontSize: 12,
                          color: "var(--c-muted)",
                          marginTop: 2,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {name}
                      </p>
                    </div>
                  </Link>

                  {/* Surprise Percentage Badge */}
                  <div
                    style={{
                      padding: "8px 14px",
                      borderRadius: 8,
                      background: surpriseColor === "var(--c-green)" ? "rgba(14, 203, 129, 0.1)" : "rgba(255, 67, 54, 0.1)",
                      border: `1px solid ${surpriseColor}`,
                      flexShrink: 0,
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: surpriseColor,
                        fontFamily: "var(--font-grotesk)",
                      }}
                    >
                      {surpriseText}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: surpriseColor,
                        marginTop: 2,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {(card.epsSurprise || 0) >= 0 ? t(locale, "earnings.beat") : t(locale, "earnings.miss")}
                    </div>
                  </div>
                </div>

                {/* Period */}
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--c-muted)",
                    fontWeight: 500,
                  }}
                >
                  {formatPeriodWithYear(card.currentPeriod, card.currentYear)}
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: "var(--c-border)" }} />

                {/* EPS Comparison Section */}
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--c-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: 8,
                    }}
                  >
                    {t(locale, "earnings.eps")}
                  </div>

                  {/* Expected vs Actual */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 10, color: "var(--c-muted)", marginBottom: 4 }}>
                        {t(locale, "earnings.expected_eps")}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--c-muted)", fontFamily: "var(--font-grotesk)" }}>
                        {(card.epsExpected || 0).toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: "var(--c-text)", marginBottom: 4, fontWeight: 600 }}>
                        {t(locale, "earnings.actual_eps")}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--c-gold)", fontFamily: "var(--font-grotesk)" }}>
                        {card.eps.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Surprise Bar */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, height: 6, background: "var(--c-border)", borderRadius: 3, overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          background: surpriseColor,
                          width: `${barWidth}%`,
                          transition: "width 0.3s ease-out",
                          borderRadius: 3,
                        }}
                      />
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: surpriseColor, minWidth: 45, textAlign: "right" }}>
                      {surpriseText}
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: "var(--c-border)" }} />

                {/* Metrics Grid */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                  }}
                >
                  {/* Revenue */}
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "var(--c-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        marginBottom: 6,
                      }}
                    >
                      {t(locale, "earnings.revenue")}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "var(--c-text)",
                        fontFamily: "var(--font-grotesk)",
                      }}
                    >
                      {formatCurrency(card.revenue)}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color:
                          card.revenueChangePercent >= 0
                            ? "var(--c-green)"
                            : "var(--c-red)",
                        marginTop: 4,
                        fontWeight: 600,
                      }}
                    >
                      {formatPercent(card.revenueChangePercent)}
                    </div>
                  </div>

                  {/* Net Income */}
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: "var(--c-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        marginBottom: 6,
                      }}
                    >
                      {t(locale, "earnings.net_income")}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "var(--c-text)",
                        fontFamily: "var(--font-grotesk)",
                      }}
                    >
                      {formatCurrency(card.netIncome)}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color:
                          card.netIncomeChangePercent >= 0
                            ? "var(--c-green)"
                            : "var(--c-red)",
                        marginTop: 4,
                        fontWeight: 600,
                      }}
                    >
                      {formatPercent(card.netIncomeChangePercent)}
                    </div>
                  </div>
                </div>

                {/* EPS Section */}
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--c-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: 6,
                    }}
                  >
                    {t(locale, "earnings.eps")}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "var(--c-text)",
                        fontFamily: "var(--font-grotesk)",
                      }}
                    >
                      {card.eps.toFixed(2)}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color:
                          card.epsChangePercent >= 0
                            ? "var(--c-green)"
                            : "var(--c-red)",
                        fontWeight: 600,
                      }}
                    >
                      {formatPercent(card.epsChangePercent)}
                    </div>
                  </div>
                </div>

                {/* View Link */}
                <div style={{ marginTop: 4 }}>
                  <Link href={`/${locale}/stock/${card.ticker}`}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "var(--c-gold)",
                        cursor: "pointer",
                        textDecoration: "none",
                        transition: "opacity 0.2s",
                      }}
                      className="earnings-metric"
                    >
                      {t(locale, "earnings.view_analysis")}
                    </div>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
