"use client";

import React from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Percent,
  PieChart,
  Shield,
  Activity,
} from "lucide-react";

interface QuickStatsProps {
  locale: string;
  marketCap?: number | null;
  pe?: number | string | null;
  dividendYield?: number | string | null;
  roe?: number | null;
  revenue?: number | null;
  netMargin?: string | null; // comes as "12.5%" format
  debtToEquity?: number | null;
  beta?: number | null;
  sectorAvgPE?: number | null;
  sectorAvgDY?: number | null;
}

interface StatConfig {
  key: string;
  label: { en: string; ar: string };
  icon: React.ReactNode;
  color: string;
  value: string | null;
  trend?: number | null;
  comparison?: string | null;
}

export default function QuickStats({
  locale,
  marketCap,
  pe,
  dividendYield,
  roe,
  revenue,
  netMargin,
  debtToEquity,
  beta,
  sectorAvgPE,
  sectorAvgDY,
}: QuickStatsProps) {
  const isAr = locale === "ar";

  // Format market cap with B/M suffix
  const formatMarketCap = (val: number | undefined | null): string | null => {
    if (!val) return null;
    if (val >= 1e9) return `${(val / 1e9).toFixed(1)}B`;
    if (val >= 1e6) return `${(val / 1e6).toFixed(0)}M`;
    return val.toFixed(0);
  };

  // Format revenue with B/M suffix
  const formatRevenue = (val: number | undefined | null): string | null => {
    if (!val) return null;
    if (val >= 1e9) return `${(val / 1e9).toFixed(1)}B`;
    if (val >= 1e6) return `${(val / 1e6).toFixed(0)}M`;
    return val.toFixed(0);
  };

  // Parse numeric string if needed
  const parseNum = (val: any): number | null => {
    if (val === null || val === undefined) return null;
    const num = typeof val === "string" ? parseFloat(val) : Number(val);
    return Number.isFinite(num) ? num : null;
  };

  const peNum = parseNum(pe);
  const divYieldNum = parseNum(dividendYield);

  // Compare against sector averages
  const peComparison = peNum && sectorAvgPE ? peNum - sectorAvgPE : null;
  const dyComparison = divYieldNum && sectorAvgDY ? divYieldNum - sectorAvgDY : null;

  const stats: StatConfig[] = [
    {
      key: "marketCap",
      label: { en: "Market Cap", ar: "القيمة السوقية" },
      icon: <DollarSign size={16} />,
      color: "#10b981", // green
      value: formatMarketCap(marketCap),
      comparison: marketCap ? `SAR ${formatMarketCap(marketCap)}` : null,
    },
    {
      key: "pe",
      label: { en: "P/E Ratio", ar: "نسبة السعر للربح" },
      icon: <BarChart3 size={16} />,
      color: "#3b82f6", // blue
      value: peNum ? peNum.toFixed(1) : null,
      trend: peComparison,
      comparison: sectorAvgPE ? `Sector: ${sectorAvgPE.toFixed(1)}` : null,
    },
    {
      key: "dividendYield",
      label: { en: "Dividend Yield", ar: "عائد التوزيع" },
      icon: <Percent size={16} />,
      color: "#f59e0b", // amber
      value: divYieldNum ? `${divYieldNum.toFixed(2)}%` : null,
      trend: dyComparison,
      comparison: sectorAvgDY ? `Sector: ${sectorAvgDY.toFixed(2)}%` : null,
    },
    {
      key: "roe",
      label: { en: "ROE", ar: "العائد على حقوق الملكية" },
      icon: <TrendingUp size={16} />,
      color: "#8b5cf6", // purple
      value: roe ? `${roe.toFixed(1)}%` : null,
    },
    {
      key: "revenue",
      label: { en: "Revenue", ar: "الإيرادات" },
      icon: <Activity size={16} />,
      color: "#ec4899", // pink
      value: formatRevenue(revenue),
      comparison: revenue ? `SAR ${formatRevenue(revenue)}` : null,
    },
    {
      key: "netMargin",
      label: { en: "Net Margin", ar: "هامش الربح الصافي" },
      icon: <Percent size={16} />,
      color: "#06b6d4", // cyan
      value: netMargin,
    },
    {
      key: "debtToEquity",
      label: { en: "Debt-to-Equity", ar: "نسبة الدين إلى حقوق الملكية" },
      icon: <Shield size={16} />,
      color: "#6366f1", // indigo
      value: debtToEquity ? debtToEquity.toFixed(2) : null,
    },
    {
      key: "beta",
      label: { en: "Beta", ar: "بيتا" },
      icon: <BarChart3 size={16} />,
      color: "#14b8a6", // teal
      value: beta ? beta.toFixed(2) : null,
    },
  ];

  // Filter out stats with no value
  const activeStats = stats.filter((s) => s.value !== null);

  if (activeStats.length === 0) return null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: "12px",
        marginBottom: "20px",
      }}
    >
      {activeStats.map((stat) => {
        const trendColor =
          stat.trend === null
            ? null
            : stat.trend > 0
              ? "var(--c-green)"
              : stat.trend < 0
                ? "var(--c-red)"
                : null;

        const trendIcon =
          stat.trend === null
            ? null
            : stat.trend > 0
              ? "↑"
              : stat.trend < 0
                ? "↓"
                : null;

        const trendValue =
          stat.trend === null
            ? null
            : stat.trend > 0
              ? `+${Math.abs(stat.trend).toFixed(2)}`
              : `${stat.trend.toFixed(2)}`;

        return (
          <div
            key={stat.key}
            style={{
              background: "var(--c-surface)",
              border: "1px solid var(--c-border)",
              borderRadius: "8px",
              padding: "12px",
              minHeight: "140px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              borderLeft: `3px solid ${stat.color}`,
              position: "relative",
            }}
          >
            {/* Label + Icon */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ color: stat.color, display: "flex", alignItems: "center" }}>
                {stat.icon}
              </div>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  color: "var(--c-muted)",
                  textTransform: "uppercase",
                  fontFamily: "var(--font-grotesk)",
                }}
              >
                {isAr ? stat.label.ar : stat.label.en}
              </span>
            </div>

            {/* Main Value */}
            <div
              style={{
                fontSize: "22px",
                fontWeight: 700,
                color: "var(--c-text)",
                fontFamily: "'Courier New', monospace", // tabular numbers
                letterSpacing: "0.02em",
                lineHeight: 1.2,
              }}
            >
              {stat.value}
            </div>

            {/* Comparison or Trend */}
            {stat.trend !== null && trendIcon ? (
              <div
                style={{
                  fontSize: "11px",
                  color: trendColor,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span>{trendIcon}</span>
                <span>{trendValue}</span>
                <span style={{ fontSize: "9px", color: "var(--c-muted)" }}>
                  vs {isAr ? "القطاع" : "Sector"}
                </span>
              </div>
            ) : stat.comparison ? (
              <div
                style={{
                  fontSize: "10px",
                  color: "var(--c-muted)",
                  fontWeight: 500,
                }}
              >
                {stat.comparison}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}