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

  // Fetch latest financials grouped by ticker
  const { data: financials } = await supabase
    .from("financials")
    .select("id, ticker, period, revenue, net_income, eps, total_assets, company_id")
    .order("period", { ascending: false })
    .limit(500);

  // Fetch company names for enrichment
  const { data: companies } = await supabase
    .from("companies")
    .select("id, ticker, name_en, name_ar");

  // Create company lookup map
  const companyMap = new Map<string, { name_en: string; name_ar: string }>();
  if (companies) {
    for (const company of companies) {
      companyMap.set(company.ticker, {
        name_en: company.name_en || "",
        name_ar: company.name_ar || company.name_en || "",
      });
    }
  }

  // Group financials by ticker and get latest 2 periods
  const tickerGroups = new Map<string, typeof financials>();
  if (financials) {
    for (const item of financials) {
      if (!tickerGroups.has(item.ticker)) {
        tickerGroups.set(item.ticker, []);
      }
      tickerGroups.get(item.ticker)!.push(item);
    }
  }

  // Process each ticker to get latest and previous period
  interface EarningsCard {
    ticker: string;
    name_en: string;
    name_ar: string;
    currentPeriod: string;
    beat: boolean; // true = beat, false = miss
    revenue: number;
    netIncome: number;
    eps: number;
    revenueChangePercent: number;
    netIncomeChangePercent: number;
    epsChangePercent: number;
  }

  const earningsCards: EarningsCard[] = [];

  for (const [ticker, periods] of tickerGroups) {
    if (periods.length >= 2) {
      const latest = periods[0];
      const previous = periods[1];

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
        previous.eps && latest.eps
          ? ((latest.eps - previous.eps) / previous.eps) * 100
          : 0;

      const beat = latest.net_income > previous.net_income;

      const company = companyMap.get(ticker) || {
        name_en: "",
        name_ar: "",
      };

      earningsCards.push({
        ticker,
        name_en: company.name_en,
        name_ar: company.name_ar,
        currentPeriod: latest.period,
        beat,
        revenue: latest.revenue || 0,
        netIncome: latest.net_income || 0,
        eps: latest.eps || 0,
        revenueChangePercent: revenueChange,
        netIncomeChangePercent: netIncomeChange,
        epsChangePercent: epsChange,
      });
    }
  }

  // Sort by most recent period
  earningsCards.sort(
    (a, b) => new Date(b.currentPeriod).getTime() - new Date(a.currentPeriod).getTime()
  );

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

  // Parse period string to readable format
  function formatPeriod(period: string): string {
    // Expected format: "2025-Q4" or "2025-01" or similar
    const match = period.match(/(\d{4})[-_](Q\d|0?\d)/i);
    if (match) {
      const year = match[1];
      const qm = match[2].toUpperCase();
      return `${qm} ${year}`;
    }
    return period;
  }

  return (
    <div className="page-wrap">
      <style>{`
        .earnings-card:hover { border-color: var(--c-gold) !important; box-shadow: 0 0 0 1px var(--c-gold-dim); background: rgba(200,169,81,0.02) !important; }
        .earnings-metric:hover { background: rgba(200,169,81,0.05) !important; }
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
            gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
            gap: 16,
          }}
        >
          {earningsCards.map((card) => {
            const name = isAr && card.name_ar ? card.name_ar : card.name_en;
            const badgeColor = card.beat ? "var(--c-green)" : "var(--c-red)";
            const badgeBg = card.beat
              ? "rgba(14, 203, 129, 0.1)"
              : "rgba(255, 67, 54, 0.1)";

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

                  {/* Beat/Miss Badge */}
                  <div
                    style={{
                      padding: "6px 12px",
                      borderRadius: 6,
                      background: badgeBg,
                      border: `1px solid ${badgeColor}`,
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: badgeColor,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {card.beat
                        ? t(locale, "earnings.beat")
                        : t(locale, "earnings.miss")}
                    </span>
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
                  {formatPeriod(card.currentPeriod)}
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
                      View full analysis →
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
