import { createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  Briefcase,
  TrendingUp,
  TrendingDown,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Star,
  Info,
} from "lucide-react";
import { t, tSector } from "@/lib/i18n";

// Demo holdings – tickers that exist in the DB
const DEMO_HOLDINGS = [
  { ticker: "2222", shares: 50, avgCost: 28.50 },
  { ticker: "1120", shares: 200, avgCost: 82.00 },
  { ticker: "2350", shares: 150, avgCost: 35.60 },
  { ticker: "7010", shares: 100, avgCost: 140.00 },
  { ticker: "2380", shares: 300, avgCost: 10.50 },
  { ticker: "1010", shares: 120, avgCost: 40.80 },
];

export default async function PortfolioPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = createServiceClient();

  // Fetch companies that match our demo tickers
  const { data: companies } = await supabase
    .from("companies")
    .select("id, ticker, name_en, name_ar, sector")
    .in("ticker", DEMO_HOLDINGS.map((h) => h.ticker));

  // Fetch latest prices for those companies
  const companyIds = (companies || []).map((c) => c.id);
  const { data: allPrices } = await supabase
    .from("stock_prices")
    .select("company_id, close, date")
    .in("company_id", companyIds)
    .order("date", { ascending: false })
    .limit(companyIds.length * 2);

  const priceMap = new Map<string, { close: number; prevClose: number | null }>();
  const seenCount = new Map<string, number>();
  for (const p of allPrices || []) {
    const count = seenCount.get(p.company_id) || 0;
    if (count === 0) {
      priceMap.set(p.company_id, { close: Number(p.close), prevClose: null });
    } else if (count === 1) {
      const existing = priceMap.get(p.company_id)!;
      existing.prevClose = Number(p.close);
    }
    seenCount.set(p.company_id, count + 1);
  }

  // Build enriched holdings
  const holdings = DEMO_HOLDINGS.map((h) => {
    const company = (companies || []).find((c) => c.ticker === h.ticker);
    if (!company) return null;
    const priceData = priceMap.get(company.id);
    const currentPrice = priceData?.close ?? h.avgCost;
    const prevClose = priceData?.prevClose ?? currentPrice;
    const totalCost = h.shares * h.avgCost;
    const totalValue = h.shares * currentPrice;
    const gainLoss = totalValue - totalCost;
    const gainPct = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;
    const todayChange = prevClose > 0 ? ((currentPrice - prevClose) / prevClose) * 100 : 0;

    return {
      ticker: h.ticker,
      name_en: company.name_en,
      name_ar: company.name_ar || company.name_en,
      sector: company.sector || "Other",
      shares: h.shares,
      avgCost: h.avgCost,
      currentPrice,
      totalCost,
      totalValue,
      gainLoss,
      gainPct,
      todayChange,
    };
  }).filter(Boolean) as {
    ticker: string;
    name_en: string;
    name_ar: string;
    sector: string;
    shares: number;
    avgCost: number;
    currentPrice: number;
    totalCost: number;
    totalValue: number;
    gainLoss: number;
    gainPct: number;
    todayChange: number;
  }[];

  // Totals
  const totalValue = holdings.reduce((s, h) => s + h.totalValue, 0);
  const totalCost = holdings.reduce((s, h) => s + h.totalCost, 0);
  const totalGain = totalValue - totalCost;
  const totalGainPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;
  const todayGainAmount = holdings.reduce(
    (s, h) => s + h.totalValue * (h.todayChange / (100 + h.todayChange)),
    0
  );
  const todayGainPct = totalValue > 0 ? (todayGainAmount / (totalValue - todayGainAmount)) * 100 : 0;

  // Sector allocation
  const sectorMap = new Map<string, number>();
  for (const h of holdings) {
    sectorMap.set(h.sector, (sectorMap.get(h.sector) || 0) + h.totalValue);
  }
  const sectors = [...sectorMap.entries()]
    .map(([sector, value]) => ({
      sector,
      value,
      pct: totalValue > 0 ? (value / totalValue) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);

  const sectorColors = ["var(--c-gold)", "var(--c-green)", "#60A5FA", "#A78BFA", "#FB923C", "#EC4899"];

  // Best / worst
  const sorted = [...holdings].sort((a, b) => b.gainPct - a.gainPct);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  return (
    <div className="page-wrap">
      {/* Demo Banner */}
      <div
        className="card-gold fade-up mb-6"
        style={{ padding: "14px 20px" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "var(--c-gold-dim)", border: "1px solid var(--c-gold-ring)" }}
          >
            <Info size={14} style={{ color: "var(--c-gold)" }} />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--c-gold)" }}>
              {t(locale, "portfolio.demo_title")}
            </p>
            <p style={{ fontSize: 11, color: "var(--c-muted)", marginTop: 2 }}>
              {t(locale, "portfolio.demo_desc")}
            </p>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "var(--c-gold-dim)", border: "1px solid var(--c-gold-ring)" }}
        >
          <Briefcase size={16} style={{ color: "var(--c-gold)" }} />
        </div>
        <div>
          <h1
            className="font-bold text-xl"
            style={{ color: "var(--c-text)", fontFamily: "var(--font-grotesk)" }}
          >
            {t(locale, "portfolio.title")}
          </h1>
          <p style={{ fontSize: 12, color: "var(--c-muted)" }}>
            {t(locale, "portfolio.subtitle")}
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 stagger">
        {/* Total Value */}
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <Briefcase size={13} style={{ color: "var(--c-gold)" }} />
            <span className="metric-label">{t(locale, "portfolio.total_value")}</span>
          </div>
          <span className="font-num font-bold text-xl" style={{ color: "var(--c-text)" }}>
            {t(locale, "common.sar")} {totalValue.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
        </div>

        {/* Total Gain */}
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            {totalGain >= 0 ? (
              <TrendingUp size={13} style={{ color: "var(--c-green)" }} />
            ) : (
              <TrendingDown size={13} style={{ color: "var(--c-red)" }} />
            )}
            <span className="metric-label">{t(locale, "portfolio.total_gain")}</span>
          </div>
          <span
            className="font-num font-bold text-xl"
            style={{ color: totalGain >= 0 ? "var(--c-green)" : "var(--c-red)" }}
          >
            {totalGain >= 0 ? "+" : ""}
            {totalGain.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
          <span
            className="font-num"
            style={{ fontSize: 12, color: totalGain >= 0 ? "var(--c-green)" : "var(--c-red)", marginLeft: 6 }}
          >
            ({totalGainPct >= 0 ? "+" : ""}{totalGainPct.toFixed(1)}%)
          </span>
        </div>

        {/* Today's Change */}
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            {todayGainPct >= 0 ? (
              <ArrowUpRight size={13} style={{ color: "var(--c-green)" }} />
            ) : (
              <ArrowDownRight size={13} style={{ color: "var(--c-red)" }} />
            )}
            <span className="metric-label">{t(locale, "portfolio.today_gain")}</span>
          </div>
          <span
            className="font-num font-bold text-xl"
            style={{ color: todayGainPct >= 0 ? "var(--c-green)" : "var(--c-red)" }}
          >
            {todayGainPct >= 0 ? "+" : ""}{todayGainPct.toFixed(2)}%
          </span>
        </div>

        {/* Holdings Count */}
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <Star size={13} style={{ color: "var(--c-gold)" }} />
            <span className="metric-label">{t(locale, "portfolio.num_holdings")}</span>
          </div>
          <span className="font-num font-bold text-xl" style={{ color: "var(--c-text)" }}>
            {holdings.length}
          </span>
        </div>
      </div>

      {/* Holdings Table */}
      <section className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Briefcase size={14} style={{ color: "var(--c-gold)" }} />
          <h2 className="font-bold" style={{ fontSize: 15, color: "var(--c-text)", fontFamily: "var(--font-grotesk)" }}>
            {t(locale, "portfolio.holdings")}
          </h2>
        </div>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>{t(locale, "portfolio.col.stock")}</th>
                  <th style={{ textAlign: "right" }}>{t(locale, "portfolio.col.shares")}</th>
                  <th style={{ textAlign: "right" }}>{t(locale, "portfolio.col.avg_cost")}</th>
                  <th style={{ textAlign: "right" }}>{t(locale, "portfolio.col.current")}</th>
                  <th style={{ textAlign: "right" }}>{t(locale, "portfolio.col.value")}</th>
                  <th style={{ textAlign: "right" }}>{t(locale, "portfolio.col.gain")}</th>
                  <th style={{ textAlign: "right" }}>{t(locale, "portfolio.col.weight")}</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((h) => {
                  const name = locale === "ar" && h.name_ar ? h.name_ar : h.name_en;
                  const isUp = h.gainPct >= 0;
                  const weight = totalValue > 0 ? (h.totalValue / totalValue) * 100 : 0;

                  return (
                    <tr key={h.ticker}>
                      <td>
                        <Link
                          href={`/${locale}/stock/${h.ticker}`}
                          className="flex items-center gap-2 group"
                        >
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                            style={{
                              background: "var(--c-gold-dim)",
                              border: "1px solid var(--c-gold-ring)",
                            }}
                          >
                            <span style={{ fontSize: 8, fontWeight: 800, color: "var(--c-gold)" }}>
                              {h.ticker.slice(0, 4)}
                            </span>
                          </div>
                          <div>
                            <span className="ticker-tag group-hover:underline">{h.ticker}</span>
                            <p style={{ fontSize: 11, color: "var(--c-muted)", marginTop: 1 }}>
                              {name}
                            </p>
                          </div>
                        </Link>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <span className="font-num" style={{ color: "var(--c-text)", fontSize: 13 }}>
                          {h.shares.toLocaleString()}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <span className="font-num" style={{ color: "var(--c-muted)", fontSize: 13 }}>
                          {h.avgCost.toFixed(2)}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <span className="font-num font-semibold" style={{ color: "var(--c-text)", fontSize: 13 }}>
                          {h.currentPrice.toFixed(2)}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <span className="font-num font-semibold" style={{ color: "var(--c-text)", fontSize: 13 }}>
                          {t(locale, "common.sar")} {h.totalValue.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className="flex flex-col items-end gap-0.5">
                          <span
                            className="font-num font-semibold"
                            style={{ fontSize: 13, color: isUp ? "var(--c-green)" : "var(--c-red)" }}
                          >
                            {isUp ? "+" : ""}{h.gainLoss.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </span>
                          <span className={`badge font-num ${isUp ? "badge-up" : "badge-down"}`}>
                            {isUp ? "+" : ""}{h.gainPct.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                          <span className="font-num" style={{ fontSize: 12, color: "var(--c-text-sm)" }}>
                            {weight.toFixed(1)}%
                          </span>
                          <div className="progress-bar" style={{ width: 48, height: 3 }}>
                            <div
                              className="progress-bar-fill"
                              style={{
                                width: `${Math.min(weight, 100)}%`,
                                background: "var(--c-gold)",
                              }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Bottom Grid: Sector Allocation + Performance */}
      <div className="grid md:grid-cols-2 gap-4 mb-6 stagger">
        {/* Sector Allocation */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <PieChart size={14} style={{ color: "var(--c-gold)" }} />
            <h2 className="font-bold" style={{ fontSize: 15, color: "var(--c-text)", fontFamily: "var(--font-grotesk)" }}>
              {t(locale, "portfolio.allocation")}
            </h2>
          </div>
          <div className="card" style={{ padding: "20px 22px" }}>
            {/* Horizontal bar breakdown */}
            <div style={{ display: "flex", height: 8, borderRadius: 9999, overflow: "hidden", marginBottom: 20 }}>
              {sectors.map((s, i) => (
                <div
                  key={s.sector}
                  style={{
                    width: `${s.pct}%`,
                    background: sectorColors[i % sectorColors.length],
                    transition: "width 0.6s var(--ease-out)",
                  }}
                />
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {sectors.map((s, i) => (
                <div key={s.sector} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 3,
                        background: sectorColors[i % sectorColors.length],
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: 13, color: "var(--c-text-sm)" }}>
                      {tSector(locale, s.sector)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-num" style={{ fontSize: 12, color: "var(--c-muted)" }}>
                      {t(locale, "common.sar")} {s.value.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                    </span>
                    <span className="font-num font-semibold" style={{ fontSize: 13, color: "var(--c-text)", minWidth: 42, textAlign: "right" }}>
                      {s.pct.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Performance Summary */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={14} style={{ color: "var(--c-green)" }} />
            <h2 className="font-bold" style={{ fontSize: 15, color: "var(--c-text)", fontFamily: "var(--font-grotesk)" }}>
              {t(locale, "portfolio.performance")}
            </h2>
          </div>
          <div className="card" style={{ padding: "20px 22px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Invested */}
              <div className="flex items-center justify-between">
                <span className="metric-label">{t(locale, "portfolio.invested")}</span>
                <span className="font-num font-semibold" style={{ color: "var(--c-text)", fontSize: 14 }}>
                  {t(locale, "common.sar")} {totalCost.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </span>
              </div>

              {/* Current */}
              <div className="flex items-center justify-between">
                <span className="metric-label">{t(locale, "portfolio.total_value")}</span>
                <span className="font-num font-semibold" style={{ color: "var(--c-text)", fontSize: 14 }}>
                  {t(locale, "common.sar")} {totalValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </span>
              </div>

              <hr className="gradient-line" />

              {/* Total P&L */}
              <div className="flex items-center justify-between">
                <span className="metric-label">{t(locale, "portfolio.total_gain")}</span>
                <div className="flex items-center gap-2">
                  <span
                    className="font-num font-semibold"
                    style={{ fontSize: 14, color: totalGain >= 0 ? "var(--c-green)" : "var(--c-red)" }}
                  >
                    {totalGain >= 0 ? "+" : ""}{t(locale, "common.sar")} {Math.abs(totalGain).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                  </span>
                  <span className={`badge font-num ${totalGain >= 0 ? "badge-up" : "badge-down"}`}>
                    {totalGainPct >= 0 ? "+" : ""}{totalGainPct.toFixed(1)}%
                  </span>
                </div>
              </div>

              <hr className="gradient-line" />

              {/* Best Performer */}
              {best && (
                <div className="flex items-center justify-between">
                  <span className="metric-label">{t(locale, "portfolio.best")}</span>
                  <div className="flex items-center gap-2">
                    <Link href={`/${locale}/stock/${best.ticker}`} className="ticker-tag" style={{ fontSize: 12 }}>
                      {best.ticker}
                    </Link>
                    <span className="badge badge-up font-num">+{best.gainPct.toFixed(1)}%</span>
                  </div>
                </div>
              )}

              {/* Worst Performer */}
              {worst && worst.ticker !== best?.ticker && (
                <div className="flex items-center justify-between">
                  <span className="metric-label">{t(locale, "portfolio.worst")}</span>
                  <div className="flex items-center gap-2">
                    <Link href={`/${locale}/stock/${worst.ticker}`} className="ticker-tag" style={{ fontSize: 12 }}>
                      {worst.ticker}
                    </Link>
                    <span className={`badge font-num ${worst.gainPct >= 0 ? "badge-up" : "badge-down"}`}>
                      {worst.gainPct >= 0 ? "+" : ""}{worst.gainPct.toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      <hr className="gold-line my-10" />
      <p style={{ fontSize: 11, color: "var(--c-dim)", textAlign: "center", letterSpacing: "0.02em" }}>
        {t(locale, "common.disclaimer")}
      </p>
    </div>
  );
}
