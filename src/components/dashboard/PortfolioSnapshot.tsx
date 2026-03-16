"use client";

import { Briefcase, Coins, Sparkles } from "lucide-react";

export interface SnapshotData {
  currentValue: number;
  investedAmount: number;
  unrealizedGain: number;
  returnPct: number;
  annualDividendEst: number;
  weightedDivYield: number;
  weightedScore: number | null;
  topIncomeHoldings: Array<{ ticker: string; name: string; yield: number }>;
  sar: string;
}

interface PortfolioSnapshotProps {
  data: SnapshotData;
  locale: string;
}

function fmtCurrency(value: number, sar: string): string {
  const abs = Math.abs(value);
  if (abs >= 1e6) return `${sar} ${(value / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sar} ${(value / 1e3).toFixed(0)}K`;
  return `${sar} ${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export default function PortfolioSnapshot({ data, locale }: PortfolioSnapshotProps) {
  const isAr = locale === "ar";
  const d = data;
  const gainUp = d.unrealizedGain >= 0;

  const rows = [
    { label: isAr ? "القيمة الحالية" : "Current value", value: fmtCurrency(d.currentValue, d.sar), color: "var(--c-text)" },
    { label: isAr ? "المبلغ المستثمر" : "Invested amount", value: fmtCurrency(d.investedAmount, d.sar), color: "var(--c-muted)" },
    {
      label: isAr ? "الربح/الخسارة غير المحققة" : "Unrealized gain/loss",
      value: `${gainUp ? "+" : ""}${fmtCurrency(Math.abs(d.unrealizedGain), d.sar)}`,
      color: gainUp ? "var(--c-green)" : "var(--c-red)",
    },
    {
      label: isAr ? "نسبة العائد" : "Return",
      value: `${d.returnPct >= 0 ? "+" : ""}${d.returnPct.toFixed(1)}%`,
      color: d.returnPct >= 0 ? "var(--c-green)" : "var(--c-red)",
    },
  ];

  return (
    <div className="card" style={{ padding: "20px 22px" }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Briefcase size={14} style={{ color: "var(--c-gold)" }} />
        <h3 className="font-bold" style={{ fontSize: 14, color: "var(--c-text)", fontFamily: "var(--font-grotesk)" }}>
          {isAr ? "محفظتي" : "My portfolio"}
        </h3>
      </div>
      <p style={{ fontSize: 10, color: "var(--c-dim)", marginBottom: 14 }}>
        {isAr ? "نظرة سريعة على مقتنياتك وعوائدك ودخلك" : "A quick view of your holdings, returns, and income"}
      </p>

      {/* Key metrics */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        {rows.map((r, i) => (
          <div key={i} className="flex items-center justify-between">
            <span style={{ fontSize: 11, color: "var(--c-muted)" }}>{r.label}</span>
            <span className="font-num font-semibold" style={{ fontSize: 12, color: r.color }}>{r.value}</span>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "var(--c-border)", marginBottom: 14 }} />

      {/* Income section */}
      <div className="flex items-center gap-2 mb-2">
        <Coins size={12} style={{ color: "var(--c-gold)" }} />
        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--c-dim)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          {isAr ? "الدخل المقدر" : "Estimated income"}
        </span>
      </div>

      <div className="flex items-center justify-between mb-2">
        <span style={{ fontSize: 11, color: "var(--c-muted)" }}>{isAr ? "التوزيعات السنوية (تقدير)" : "Annual dividends (est.)"}</span>
        <span className="font-num font-bold" style={{ fontSize: 14, color: "var(--c-gold)" }}>
          {fmtCurrency(d.annualDividendEst, d.sar)}
        </span>
      </div>
      <div className="flex items-center justify-between mb-3">
        <span style={{ fontSize: 11, color: "var(--c-muted)" }}>{isAr ? "العائد المرجح" : "Weighted yield"}</span>
        <span className="font-num font-semibold" style={{ fontSize: 12, color: "var(--c-gold)" }}>
          {d.weightedDivYield.toFixed(1)}%
        </span>
      </div>

      {/* Top income holdings */}
      {d.topIncomeHoldings.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: "var(--c-dim)", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
            {isAr ? "أعلى المقتنيات دخلًا" : "Top income holdings"}
          </span>
          {d.topIncomeHoldings.map((h, i) => (
            <div key={i} className="flex items-center justify-between" style={{ marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: "var(--c-text-sm)" }}>{h.ticker} · {h.name}</span>
              <span className="font-num" style={{ fontSize: 10, color: "var(--c-gold)", fontWeight: 600 }}>{h.yield.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      )}

      {/* Weighted Score */}
      {d.weightedScore !== null && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            background: "var(--c-gold-dim)",
            border: "1px solid var(--c-gold-ring)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Sparkles size={12} style={{ color: "var(--c-gold)" }} />
          <span style={{ fontSize: 10, color: "var(--c-muted)", flex: 1 }}>
            {isAr ? "تقييم SUQAI المرجح" : "Weighted SUQAI Score"}
          </span>
          <span className="font-num font-bold" style={{ fontSize: 16, color: "var(--c-gold)" }}>
            {Math.round(d.weightedScore)}
          </span>
        </div>
      )}

      <p style={{ fontSize: 8, color: "var(--c-dim)", marginTop: 8, fontStyle: "italic" }}>
        {isAr ? "أرقام الدخل تقديرية بناءً على التوزيعات التاريخية" : "Income figures are trailing estimates based on historical dividends"}
      </p>
    </div>
  );
}
