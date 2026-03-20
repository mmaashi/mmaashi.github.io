"use client";

import Link from "next/link";
import { Award, ArrowRight, TrendingUp } from "lucide-react";

export interface ContractWin {
  ticker: string;
  companyName: string;
  disclosureLabelEn: string;
  disclosureLabelAr: string;
  value: number | null;
  currency: string;
  counterparty: string | null;
  materialityLabel: string;
  announcementDate: string;
  daysAgo: number;
  whatHappened: { en: string; ar: string };
}

export interface ContractWinner {
  ticker: string;
  companyName: string;
  contractCount12m: number;
  disclosedValue12m: number;
  momentumSignal: string;
  momentumSignalAr: string;
}

interface ContractWinsSectionProps {
  recentWins: ContractWin[];
  topWinners: ContractWinner[];
  locale: string;
  sar: string;
}

function fmtVal(val: number): string {
  if (val >= 1e9) return `${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e6) return `${(val / 1e6).toFixed(0)}M`;
  if (val >= 1e3) return `${(val / 1e3).toFixed(0)}K`;
  return val.toLocaleString();
}

function materialityColor(label: string): string {
  switch (label) {
    case "major": return "var(--c-green)";
    case "meaningful": return "var(--c-gold)";
    case "moderate": return "var(--c-muted)";
    default: return "var(--c-dim)";
  }
}

function momentumColor(signal: string): string {
  switch (signal) {
    case "active": return "var(--c-green)";
    case "improving": return "#4ade80";
    case "steady": return "var(--c-gold)";
    case "slowing": return "var(--c-red)";
    default: return "var(--c-dim)";
  }
}

/**
 * Homepage section: Notable contract wins this week + most active winners.
 * Only renders if there is data — gracefully returns null otherwise.
 */
export default function ContractWinsSection({
  recentWins,
  topWinners,
  locale,
  sar,
}: ContractWinsSectionProps) {
  const isAr = locale === "ar";

  if (recentWins.length === 0 && topWinners.length === 0) return null;

  return (
    <section className="fade-up" style={{ marginBottom: 32 }}>
      <div className="flex items-center gap-2 mb-4">
        <Award size={16} style={{ color: "var(--c-gold)" }} />
        <h2
          className="font-bold"
          style={{
            fontSize: 17,
            color: "var(--c-text)",
            fontFamily: "var(--font-grotesk)",
            letterSpacing: "-0.01em",
          }}
        >
          {isAr ? "عقود وأعمال جديدة" : "Contract & business wins"}
        </h2>
      </div>

      <div
        className="contract-wins-grid"
        style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14 }}
      >
        {/* Left: Recent wins */}
        <div className="card" style={{ padding: "18px 20px" }}>
          <h3
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--c-dim)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            {isAr ? "أحدث الإعلانات" : "Notable wins this week"}
          </h3>

          {recentWins.length === 0 ? (
            <p style={{ fontSize: 11, color: "var(--c-dim)" }}>
              {isAr ? "لا إعلانات عقود هذا الأسبوع" : "No contract announcements this week"}
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {recentWins.map((w, i) => (
                <Link
                  key={`${w.ticker}-${i}`}
                  href={`/${locale}/stock/${w.ticker}`}
                  style={{ textDecoration: "none" }}
                >
                  <div
                    style={{
                      padding: "10px 12px",
                      borderRadius: 8,
                      background: "var(--c-elevated)",
                      border: "1px solid var(--c-border)",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      transition: "border-color 0.15s",
                    }}
                  >
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: materialityColor(w.materialityLabel),
                        marginTop: 5,
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--c-text)" }}>
                          {w.ticker}
                        </span>
                        <span style={{ fontSize: 9, color: "var(--c-muted)" }}>
                          {w.companyName}
                        </span>
                        <span style={{ flex: 1 }} />
                        <span
                          style={{
                            fontSize: 8,
                            fontWeight: 700,
                            color: materialityColor(w.materialityLabel),
                            textTransform: "uppercase",
                          }}
                        >
                          {isAr ? w.disclosureLabelAr : w.disclosureLabelEn}
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: 10,
                          color: "var(--c-text-sm)",
                          lineHeight: 1.45,
                          margin: 0,
                        }}
                      >
                        {isAr ? w.whatHappened.ar : w.whatHappened.en}
                      </p>
                      {w.value && (
                        <span
                          className="font-num"
                          style={{ fontSize: 10, fontWeight: 600, color: "var(--c-gold)", marginTop: 2, display: "inline-block" }}
                        >
                          {w.currency} {fmtVal(w.value)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right: Most active contract winners */}
        <div className="card" style={{ padding: "18px 20px" }}>
          <h3
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--c-dim)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            {isAr ? "أكثر الشركات نشاطًا" : "Most active winners (12m)"}
          </h3>

          {topWinners.length === 0 ? (
            <p style={{ fontSize: 11, color: "var(--c-dim)" }}>
              {isAr ? "لا بيانات كافية" : "Not enough data yet"}
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {topWinners.map((w, i) => (
                <Link
                  key={w.ticker}
                  href={`/${locale}/stock/${w.ticker}`}
                  style={{ textDecoration: "none" }}
                >
                  <div
                    style={{
                      padding: "10px 12px",
                      borderRadius: 8,
                      background: i === 0 ? "var(--c-gold-dim)" : "var(--c-elevated)",
                      border: `1px solid ${i === 0 ? "var(--c-gold-ring)" : "var(--c-border)"}`,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        color: i === 0 ? "var(--c-gold)" : "var(--c-muted)",
                        width: 16,
                      }}
                    >
                      {i + 1}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--c-text)" }}>
                        {w.companyName}
                      </span>
                      <span
                        className="font-num"
                        style={{ fontSize: 10, color: "var(--c-muted)", marginLeft: 6 }}
                      >
                        {w.ticker}
                      </span>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <span
                        className="font-num font-bold"
                        style={{ fontSize: 12, color: "var(--c-text)" }}
                      >
                        {w.contractCount12m}
                      </span>
                      <span style={{ fontSize: 9, color: "var(--c-dim)", marginLeft: 3 }}>
                        {isAr ? "عقد" : "wins"}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: 8,
                        fontWeight: 700,
                        color: momentumColor(w.momentumSignal),
                        padding: "2px 6px",
                        borderRadius: 3,
                        background: `${momentumColor(w.momentumSignal)}12`,
                      }}
                    >
                      {isAr ? w.momentumSignalAr : w.momentumSignal}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 800px) { .contract-wins-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}
