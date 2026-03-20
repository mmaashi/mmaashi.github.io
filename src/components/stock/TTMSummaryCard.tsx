"use client";

import { DollarSign } from "lucide-react";

interface TTMSummaryProps {
  locale: string;
  revenue: number | null;
  grossProfit: number | null;
  operatingIncome: number | null;
  netIncome: number | null;
  grossMargin?: number | null;
  operatingMargin?: number | null;
  netMargin?: number | null;
}

function formatValue(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";

  if (value >= 1e9) {
    return `${(value / 1e9).toFixed(1)}B`;
  }
  if (value >= 1e6) {
    return `${(value / 1e6).toFixed(1)}M`;
  }
  if (value >= 1e3) {
    return `${(value / 1e3).toFixed(1)}K`;
  }
  return value.toFixed(0);
}

interface IncomeItem {
  label: { en: string; ar: string };
  value: number | null;
  margin: number | null;
  percentage: number; // percentage of revenue (0-1)
  color: string;
  highlight?: boolean;
}

export default function TTMSummaryCard({
  locale,
  revenue,
  grossProfit,
  operatingIncome,
  netIncome,
  grossMargin,
  operatingMargin,
  netMargin,
}: TTMSummaryProps) {
  const isAr = locale === "ar";

  // Calculate percentages for visual bars
  const revenueNum = revenue ?? 0;
  const gpPercentage = grossProfit && revenueNum > 0 ? grossProfit / revenueNum : 0;
  const oiPercentage = operatingIncome && revenueNum > 0 ? operatingIncome / revenueNum : 0;
  const niPercentage = netIncome && revenueNum > 0 ? Math.abs(netIncome) / revenueNum : 0;

  const items: IncomeItem[] = [
    {
      label: { en: "Revenue", ar: "الإيرادات" },
      value: revenue,
      margin: null,
      percentage: 1,
      color: "var(--c-gold)",
    },
    {
      label: { en: "Gross Profit", ar: "إجمالي الربح" },
      value: grossProfit,
      margin: grossMargin,
      percentage: gpPercentage,
      color: "var(--c-green)",
      highlight: true,
    },
    {
      label: { en: "Operating Income", ar: "دخل التشغيل" },
      value: operatingIncome,
      margin: operatingMargin,
      percentage: oiPercentage,
      color: "#60A5FA",
    },
    {
      label: { en: "Net Income", ar: "الدخل الصافي" },
      value: netIncome,
      margin: netMargin,
      percentage: niPercentage,
      color: netIncome && netIncome >= 0 ? "var(--c-green)" : "var(--c-red)",
    },
  ];

  return (
    <div
      className="card"
      style={{ padding: "18px 20px", direction: isAr ? "rtl" : "ltr" }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <DollarSign size={14} style={{ color: "var(--c-gold)" }} />
        <h3 className="font-bold" style={{ fontSize: 13, color: "var(--c-text)", flex: 1 }}>
          {isAr ? "ملخص الدخل (12 شهر)" : "TTM Income Summary"}
        </h3>
      </div>

      {/* Income statement rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map((item, idx) => (
          <div
            key={idx}
            style={{
              paddingBottom: 10,
              borderBottom: idx < items.length - 1 ? "1px solid var(--c-border)" : "none",
              background: item.highlight ? "rgba(200,169,81,0.02)" : "transparent",
              padding: item.highlight ? "8px 10px" : "0px",
              borderRadius: item.highlight ? 6 : 0,
            }}
          >
            {/* Row header: label + margin (if available) */}
            <div className="flex items-baseline justify-between mb-2">
              <span
                style={{
                  fontSize: 11,
                  color: "var(--c-muted)",
                  fontWeight: 600,
                  flex: 1,
                }}
              >
                {isAr ? item.label.ar : item.label.en}
              </span>

              {item.margin !== null && item.margin !== undefined && (
                <span
                  className="font-num"
                  style={{
                    fontSize: 10,
                    color: item.highlight ? "var(--c-gold)" : "var(--c-muted)",
                    fontWeight: 600,
                    marginLeft: 8,
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.margin.toFixed(1)}%
                </span>
              )}
            </div>

            {/* Value and visual bar */}
            <div className="flex items-center gap-2">
              <span
                className="font-num font-bold"
                style={{
                  fontSize: 12,
                  color: item.color,
                  minWidth: 60,
                }}
              >
                {formatValue(item.value)}
              </span>

              {/* Visual bar (proportional to revenue) */}
              {item.value !== null && item.percentage > 0 && (
                <div
                  style={{
                    flex: 1,
                    height: 8,
                    background: "var(--c-elevated)",
                    borderRadius: 4,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.max(item.percentage * 100, 2)}%`,
                      background: item.color,
                      opacity: 0.7,
                      borderRadius: 4,
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer note */}
      {(grossMargin !== null || operatingMargin !== null || netMargin !== null) && (
        <div
          style={{
            marginTop: 12,
            paddingTop: 10,
            borderTop: "1px solid var(--c-border)",
            fontSize: 9,
            color: "var(--c-dim)",
            lineHeight: 1.5,
          }}
        >
          {isAr
            ? "الهوامش تمثل نسبة مئوية من الإيرادات"
            : "Margins represent percentage of revenue"}
        </div>
      )}
    </div>
  );
}
