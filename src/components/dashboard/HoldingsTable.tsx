"use client";

import Link from "next/link";
import { ArrowUpRight, ArrowDownRight, Sparkles, Minus } from "lucide-react";

export interface HoldingRow {
  ticker: string;
  name: string;
  sector: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  totalValue: number;
  gainLoss: number;
  gainPct: number;
  todayChange: number;
  weight: number;
  overallScore: number | null;
  fairValueDiff: number | null; // positive = undervalued
  nextDivDate: string | null;
  nextDivAmount: number | null;
}

interface HoldingsTableProps {
  holdings: HoldingRow[];
  locale: string;
  sar: string;
}

const cols: Record<string, { en: string; ar: string }> = {
  stock: { en: "Stock", ar: "السهم" },
  score: { en: "Score", ar: "التقييم" },
  price: { en: "Price", ar: "السعر" },
  today: { en: "Today", ar: "اليوم" },
  value: { en: "Value", ar: "القيمة" },
  gain: { en: "Gain/Loss", ar: "الربح/الخسارة" },
  fairValue: { en: "Fair Value", ar: "القيمة العادلة" },
  weight: { en: "Weight", ar: "الوزن" },
};

function getScoreColor(score: number): string {
  if (score >= 80) return "var(--c-green)";
  if (score >= 60) return "var(--c-gold)";
  if (score >= 40) return "var(--c-text)";
  return "var(--c-red)";
}

function getFairValueLabel(diff: number | null, isAr: boolean): { text: string; color: string; bg: string } {
  if (diff === null) return { text: "—", color: "var(--c-dim)", bg: "transparent" };
  if (diff > 10) return {
    text: isAr ? "مخفّض" : "Under",
    color: "var(--c-green)",
    bg: "var(--c-green-bg)",
  };
  if (diff < -10) return {
    text: isAr ? "مرتفع" : "Over",
    color: "var(--c-red)",
    bg: "var(--c-red-bg)",
  };
  return {
    text: isAr ? "عادل" : "Fair",
    color: "var(--c-gold)",
    bg: "var(--c-gold-dim)",
  };
}

export default function HoldingsTable({ holdings, locale, sar }: HoldingsTableProps) {
  const isAr = locale === "ar";
  const l = (key: string) => (isAr ? cols[key]?.ar : cols[key]?.en) ?? key;

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>{l("stock")}</th>
              <th style={{ textAlign: "center" }}>{l("score")}</th>
              <th style={{ textAlign: "right" }}>{l("price")}</th>
              <th style={{ textAlign: "right" }}>{l("today")}</th>
              <th style={{ textAlign: "right" }}>{l("value")}</th>
              <th style={{ textAlign: "right" }}>{l("gain")}</th>
              <th style={{ textAlign: "center" }}>{l("fairValue")}</th>
              <th style={{ textAlign: "right" }}>{l("weight")}</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((h) => {
              const isUp = h.gainPct >= 0;
              const todayUp = h.todayChange >= 0;
              const fv = getFairValueLabel(h.fairValueDiff, isAr);

              return (
                <tr key={h.ticker}>
                  {/* Stock info */}
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
                        <p style={{ fontSize: 10, color: "var(--c-muted)", marginTop: 1 }}>
                          {h.name}
                        </p>
                      </div>
                    </Link>
                  </td>

                  {/* SŪQAI Score */}
                  <td style={{ textAlign: "center" }}>
                    {h.overallScore !== null ? (
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                        <Sparkles size={10} style={{ color: getScoreColor(h.overallScore) }} />
                        <span
                          className="font-num font-bold"
                          style={{ fontSize: 14, color: getScoreColor(h.overallScore) }}
                        >
                          {Math.round(h.overallScore)}
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: "var(--c-dim)", fontSize: 12 }}>—</span>
                    )}
                  </td>

                  {/* Current Price */}
                  <td style={{ textAlign: "right" }}>
                    <span className="font-num font-semibold" style={{ color: "var(--c-text)", fontSize: 13 }}>
                      {h.currentPrice.toFixed(2)}
                    </span>
                  </td>

                  {/* Today's Change */}
                  <td style={{ textAlign: "right" }}>
                    <span
                      className="font-num"
                      style={{
                        fontSize: 12,
                        color: todayUp ? "var(--c-green)" : "var(--c-red)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 2,
                      }}
                    >
                      {todayUp ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                      {todayUp ? "+" : ""}
                      {h.todayChange.toFixed(2)}%
                    </span>
                  </td>

                  {/* Total Value */}
                  <td style={{ textAlign: "right" }}>
                    <div>
                      <span className="font-num font-semibold" style={{ color: "var(--c-text)", fontSize: 13 }}>
                        {sar} {h.totalValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                      </span>
                      <p className="font-num" style={{ fontSize: 10, color: "var(--c-dim)", marginTop: 1 }}>
                        {h.shares} × {h.avgCost.toFixed(2)}
                      </p>
                    </div>
                  </td>

                  {/* Gain/Loss */}
                  <td style={{ textAlign: "right" }}>
                    <div className="flex flex-col items-end gap-0.5">
                      <span
                        className="font-num font-semibold"
                        style={{ fontSize: 13, color: isUp ? "var(--c-green)" : "var(--c-red)" }}
                      >
                        {isUp ? "+" : ""}
                        {h.gainLoss.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                      </span>
                      <span className={`badge font-num ${isUp ? "badge-up" : "badge-down"}`}>
                        {isUp ? "+" : ""}
                        {h.gainPct.toFixed(1)}%
                      </span>
                    </div>
                  </td>

                  {/* Fair Value Status */}
                  <td style={{ textAlign: "center" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "2px 8px",
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 700,
                        color: fv.color,
                        background: fv.bg,
                        border: fv.bg !== "transparent" ? `1px solid ${fv.color}20` : "none",
                      }}
                    >
                      {fv.text}
                      {h.fairValueDiff !== null && Math.abs(h.fairValueDiff) > 10 && (
                        <> {Math.abs(h.fairValueDiff).toFixed(0)}%</>
                      )}
                    </span>
                  </td>

                  {/* Weight */}
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                      <span className="font-num" style={{ fontSize: 12, color: "var(--c-text-sm)" }}>
                        {h.weight.toFixed(1)}%
                      </span>
                      <div className="progress-bar" style={{ width: 48, height: 3 }}>
                        <div
                          className="progress-bar-fill"
                          style={{
                            width: `${Math.min(h.weight, 100)}%`,
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
  );
}
