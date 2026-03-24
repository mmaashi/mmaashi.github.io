"use client";

import { useState } from "react";
import { Calculator, Plus, Minus, TrendingUp, ArrowRight } from "lucide-react";

interface HoldingData {
  ticker: string;
  name: string;
  shares: number;
  annualDPS: number;
  currentPrice: number;
}

export default function DividendWhatIf({
  holdings,
  locale,
  currentAnnualIncome,
}: {
  holdings: HoldingData[];
  locale: string;
  currentAnnualIncome: number;
}) {
  const isAr = locale === "ar";

  // Track additional shares per holding
  const [extras, setExtras] = useState<Record<string, number>>({});

  const addShares = (ticker: string, amount: number) => {
    setExtras((prev) => {
      const current = prev[ticker] || 0;
      const next = Math.max(0, current + amount);
      return { ...prev, [ticker]: next };
    });
  };

  // Calculate projected income with extras
  const projectedIncome = holdings.reduce((total, h) => {
    const extraShares = extras[h.ticker] || 0;
    return total + h.annualDPS * (h.shares + extraShares);
  }, 0);

  const extraCost = holdings.reduce((total, h) => {
    const extraShares = extras[h.ticker] || 0;
    return total + h.currentPrice * extraShares;
  }, 0);

  const incomeGain = projectedIncome - currentAnnualIncome;
  const hasChanges = Object.values(extras).some((v) => v > 0);

  return (
    <div
      style={{
        background: "var(--c-surface)",
        border: "1px solid var(--c-border)",
        borderRadius: 14,
        padding: "24px 20px",
        marginBottom: 8,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Calculator size={16} style={{ color: "var(--c-gold)" }} />
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--c-text)" }}>
          {isAr ? "حاسبة \"ماذا لو\"" : "What-If Calculator"}
        </h2>
      </div>
      <p style={{ fontSize: 12, color: "var(--c-muted)", marginBottom: 20 }}>
        {isAr
          ? "أضف أسهمًا افتراضية وشاهد كيف يتغير دخلك من التوزيعات"
          : "Add hypothetical shares and see how your dividend income changes"}
      </p>

      {/* Holdings grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 10,
          marginBottom: 20,
        }}
      >
        {holdings
          .filter((h) => h.annualDPS > 0)
          .map((h) => {
            const extra = extras[h.ticker] || 0;
            const newIncome = h.annualDPS * (h.shares + extra);
            const extraIncome = h.annualDPS * extra;

            return (
              <div
                key={h.ticker}
                style={{
                  padding: "14px 16px",
                  borderRadius: 10,
                  background: extra > 0 ? "rgba(14,203,129,0.04)" : "var(--c-elevated)",
                  border: `1px solid ${extra > 0 ? "rgba(14,203,129,0.2)" : "var(--c-border)"}`,
                  transition: "all 0.2s",
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-num" style={{ fontSize: 13, fontWeight: 700, color: "var(--c-text)" }}>
                      {h.ticker}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--c-muted)", marginInlineStart: 6 }}>{h.name}</span>
                  </div>
                  <span className="font-num" style={{ fontSize: 11, color: "var(--c-muted)" }}>
                    {h.annualDPS.toFixed(2)} SAR/sh
                  </span>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3" style={{ marginTop: 8 }}>
                  <button
                    onClick={() => addShares(h.ticker, -10)}
                    disabled={extra === 0}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      border: "1px solid var(--c-border)",
                      background: "var(--c-elevated)",
                      color: extra > 0 ? "var(--c-text)" : "var(--c-dim)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: extra > 0 ? "pointer" : "default",
                      opacity: extra > 0 ? 1 : 0.4,
                    }}
                  >
                    <Minus size={12} />
                  </button>

                  <div style={{ flex: 1, textAlign: "center" }}>
                    <div className="font-num" style={{ fontSize: 14, fontWeight: 700, color: extra > 0 ? "var(--c-green)" : "var(--c-muted)" }}>
                      +{extra}
                    </div>
                    <div style={{ fontSize: 9, color: "var(--c-dim)" }}>
                      {isAr ? "أسهم إضافية" : "extra shares"}
                    </div>
                  </div>

                  <button
                    onClick={() => addShares(h.ticker, 10)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      border: "1px solid rgba(14,203,129,0.3)",
                      background: "rgba(14,203,129,0.08)",
                      color: "var(--c-green)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <Plus size={12} />
                  </button>
                </div>

                {/* Result */}
                {extra > 0 && (
                  <div
                    style={{
                      marginTop: 10,
                      padding: "8px 10px",
                      borderRadius: 8,
                      background: "rgba(14,203,129,0.06)",
                      fontSize: 11,
                      color: "var(--c-muted)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>{isAr ? "دخل إضافي" : "Extra income"}</span>
                    <span className="font-num" style={{ color: "var(--c-green)", fontWeight: 700 }}>
                      +{extraIncome.toFixed(0)} SAR
                    </span>
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* Summary */}
      {hasChanges && (
        <div
          style={{
            padding: "16px 20px",
            borderRadius: 12,
            background: "linear-gradient(135deg, rgba(14,203,129,0.08), rgba(14,203,129,0.02))",
            border: "1px solid rgba(14,203,129,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 11, color: "var(--c-muted)", marginBottom: 4 }}>
              {isAr ? "الدخل الجديد المتوقع" : "New Projected Income"}
            </div>
            <div className="flex items-center gap-3">
              <span className="font-num" style={{ fontSize: 11, color: "var(--c-muted)", textDecoration: "line-through" }}>
                {currentAnnualIncome.toFixed(0)} SAR
              </span>
              <ArrowRight size={12} style={{ color: "var(--c-muted)" }} />
              <span className="font-num" style={{ fontSize: 20, fontWeight: 800, color: "var(--c-green)" }}>
                {projectedIncome.toFixed(0)} SAR
              </span>
            </div>
          </div>

          <div style={{ textAlign: isAr ? "left" : "right" }}>
            <div className="font-num" style={{ fontSize: 14, fontWeight: 700, color: "var(--c-green)" }}>
              <TrendingUp size={12} style={{ display: "inline", marginInlineEnd: 4 }} />
              +{incomeGain.toFixed(0)} SAR/yr
            </div>
            <div style={{ fontSize: 11, color: "var(--c-muted)", marginTop: 2 }}>
              {isAr ? "استثمار إضافي" : "Additional investment"}: <span className="font-num" style={{ fontWeight: 600 }}>{extraCost.toLocaleString("en-US", { maximumFractionDigits: 0 })} SAR</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
