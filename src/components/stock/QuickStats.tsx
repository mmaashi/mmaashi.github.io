"use client";

import React from "react";
import {
  TrendingUp,
  DollarSign,
  BarChart3,
  Percent,
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

type Signal = "strong" | "good" | "neutral" | "caution" | "risk";

interface StatConfig {
  key: string;
  label: { en: string; ar: string };
  icon: React.ReactNode;
  value: string | null;
  signal: Signal;
  signalLabel?: { en: string; ar: string };
  trend?: number | null;
  comparison?: string | null;
}

/* Signal-based color mapping */
const signalColors: Record<Signal, { accent: string; bg: string; text: string; border: string }> = {
  strong:  { accent: "#22c55e", bg: "rgba(34, 197, 94, 0.08)",  text: "#22c55e", border: "rgba(34, 197, 94, 0.25)" },
  good:    { accent: "#10b981", bg: "rgba(16, 185, 129, 0.06)", text: "#10b981", border: "rgba(16, 185, 129, 0.2)" },
  neutral: { accent: "#94a3b8", bg: "rgba(148, 163, 184, 0.06)", text: "var(--c-muted)", border: "var(--c-border)" },
  caution: { accent: "#f59e0b", bg: "rgba(245, 158, 11, 0.08)", text: "#f59e0b", border: "rgba(245, 158, 11, 0.25)" },
  risk:    { accent: "#ef4444", bg: "rgba(239, 68, 68, 0.08)",  text: "#ef4444", border: "rgba(239, 68, 68, 0.25)" },
};

const signalLabels: Record<Signal, { en: string; ar: string }> = {
  strong:  { en: "Strong", ar: "قوي" },
  good:    { en: "Good", ar: "جيد" },
  neutral: { en: "Fair", ar: "معتدل" },
  caution: { en: "Watch", ar: "مراقبة" },
  risk:    { en: "Risk", ar: "خطر" },
};

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

  const formatLargeNum = (val: number | undefined | null): string | null => {
    if (!val) return null;
    if (val >= 1e12) return `${(val / 1e12).toFixed(1)}T`;
    if (val >= 1e9) return `${(val / 1e9).toFixed(1)}B`;
    if (val >= 1e6) return `${(val / 1e6).toFixed(0)}M`;
    return val.toFixed(0);
  };

  const parseNum = (val: any): number | null => {
    if (val == null) return null;
    const num = typeof val === "string" ? parseFloat(val) : Number(val);
    return Number.isFinite(num) ? num : null;
  };

  const peNum = parseNum(pe);
  const divYieldNum = parseNum(dividendYield);
  const netMarginNum = netMargin ? parseFloat(netMargin) : null;

  // Signal assessment functions
  const getPESignal = (): Signal => {
    if (!peNum) return "neutral";
    if (sectorAvgPE && peNum < sectorAvgPE * 0.8) return "strong";  // significantly below sector
    if (sectorAvgPE && peNum < sectorAvgPE) return "good";
    if (peNum > 30) return "caution";
    if (peNum > 50) return "risk";
    return "neutral";
  };

  const getDYSignal = (): Signal => {
    if (!divYieldNum) return "neutral";
    if (divYieldNum >= 5) return "strong";
    if (divYieldNum >= 3) return "good";
    if (divYieldNum >= 1) return "neutral";
    return "caution";
  };

  const getROESignal = (): Signal => {
    if (!roe) return "neutral";
    if (roe >= 20) return "strong";
    if (roe >= 12) return "good";
    if (roe >= 5) return "neutral";
    return "caution";
  };

  const getMarginSignal = (): Signal => {
    if (!netMarginNum) return "neutral";
    if (netMarginNum >= 20) return "strong";
    if (netMarginNum >= 10) return "good";
    if (netMarginNum >= 3) return "neutral";
    if (netMarginNum >= 0) return "caution";
    return "risk";
  };

  const getDESignal = (): Signal => {
    if (!debtToEquity) return "neutral";
    if (debtToEquity < 0.5) return "strong";
    if (debtToEquity < 1) return "good";
    if (debtToEquity < 2) return "neutral";
    if (debtToEquity < 5) return "caution";
    return "risk";
  };

  const getBetaSignal = (): Signal => {
    if (!beta) return "neutral";
    if (beta >= 0.8 && beta <= 1.2) return "good";
    if (beta < 0.8) return "strong"; // less volatile
    if (beta > 1.5) return "caution";
    if (beta > 2) return "risk";
    return "neutral";
  };

  const peComparison = peNum && sectorAvgPE ? peNum - sectorAvgPE : null;
  const dyComparison = divYieldNum && sectorAvgDY ? divYieldNum - sectorAvgDY : null;

  const stats: StatConfig[] = [
    {
      key: "marketCap",
      label: { en: "Market Cap", ar: "القيمة السوقية" },
      icon: <DollarSign size={16} />,
      value: formatLargeNum(marketCap),
      signal: "neutral",
      comparison: marketCap ? `SAR ${formatLargeNum(marketCap)}` : null,
    },
    {
      key: "pe",
      label: { en: "P/E Ratio", ar: "السعر للربح" },
      icon: <BarChart3 size={16} />,
      value: peNum ? peNum.toFixed(1) : null,
      signal: getPESignal(),
      trend: peComparison,
      comparison: sectorAvgPE ? `${isAr ? "القطاع" : "Sector"}: ${sectorAvgPE.toFixed(1)}` : null,
    },
    {
      key: "dividendYield",
      label: { en: "Div Yield", ar: "عائد التوزيع" },
      icon: <Percent size={16} />,
      value: divYieldNum ? `${divYieldNum.toFixed(2)}%` : null,
      signal: getDYSignal(),
      trend: dyComparison,
      comparison: sectorAvgDY ? `${isAr ? "القطاع" : "Sector"}: ${sectorAvgDY.toFixed(2)}%` : null,
    },
    {
      key: "roe",
      label: { en: "ROE", ar: "العائد على الملكية" },
      icon: <TrendingUp size={16} />,
      value: roe ? `${roe.toFixed(1)}%` : null,
      signal: getROESignal(),
    },
    {
      key: "revenue",
      label: { en: "Revenue", ar: "الإيرادات" },
      icon: <Activity size={16} />,
      value: formatLargeNum(revenue),
      signal: "neutral",
      comparison: revenue ? `SAR ${formatLargeNum(revenue)}` : null,
    },
    {
      key: "netMargin",
      label: { en: "Net Margin", ar: "هامش الربح" },
      icon: <Percent size={16} />,
      value: netMargin,
      signal: getMarginSignal(),
    },
    {
      key: "debtToEquity",
      label: { en: "Debt/Equity", ar: "الدين/الملكية" },
      icon: <Shield size={16} />,
      value: debtToEquity ? debtToEquity.toFixed(2) : null,
      signal: getDESignal(),
    },
    {
      key: "beta",
      label: { en: "Beta", ar: "بيتا" },
      icon: <BarChart3 size={16} />,
      value: beta ? beta.toFixed(2) : null,
      signal: getBetaSignal(),
    },
  ];

  const activeStats = stats.filter((s) => s.value !== null);
  if (activeStats.length === 0) return null;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: "10px",
        marginBottom: "20px",
      }}
    >
      {activeStats.map((stat) => {
        const sc = signalColors[stat.signal];
        const sl = signalLabels[stat.signal];

        const trendColor =
          stat.trend == null ? null
          : stat.trend > 0 ? "var(--c-green)"
          : stat.trend < 0 ? "var(--c-red)"
          : null;

        const trendIcon =
          stat.trend == null ? null
          : stat.trend > 0 ? "↑"
          : stat.trend < 0 ? "↓"
          : null;

        const trendValue =
          stat.trend == null ? null
          : stat.trend > 0
            ? `+${Math.abs(stat.trend).toFixed(1)}`
            : `${stat.trend.toFixed(1)}`;

        return (
          <div
            key={stat.key}
            style={{
              background: sc.bg,
              border: `1px solid ${sc.border}`,
              borderRadius: "10px",
              padding: "14px 16px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              borderLeft: `3px solid ${sc.accent}`,
              position: "relative",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
            }}
          >
            {/* Signal badge — top right */}
            {stat.signal !== "neutral" && (
              <span style={{
                position: "absolute",
                top: 8,
                right: 8,
                fontSize: 9,
                fontWeight: 700,
                padding: "2px 7px",
                borderRadius: 4,
                background: sc.accent,
                color: "#fff",
                letterSpacing: "0.03em",
                textTransform: "uppercase",
              }}>
                {isAr ? sl.ar : sl.en}
              </span>
            )}

            {/* Label + Icon */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ color: sc.accent, display: "flex", alignItems: "center" }}>
                {stat.icon}
              </div>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.05em",
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
              className="font-num"
              style={{
                fontSize: "24px",
                fontWeight: 700,
                color: stat.signal === "neutral" ? "var(--c-text)" : sc.text,
                letterSpacing: "0.01em",
                lineHeight: 1.2,
              }}
            >
              {stat.value}
            </div>

            {/* Comparison or Trend */}
            {stat.trend != null && trendIcon ? (
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
