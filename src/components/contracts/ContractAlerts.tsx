"use client";

import Link from "next/link";
import { Award, FileText, ArrowRight, TrendingUp } from "lucide-react";

export interface ContractAlert {
  ticker: string;
  companyName: string;
  disclosureType: string;
  disclosureLabelEn: string;
  disclosureLabelAr: string;
  value: number | null;
  currency: string;
  counterparty: string | null;
  materialityLabel: string;
  announcementDate: string;
  daysAgo: number;
  interpretation: { en: string; ar: string };
}

interface ContractAlertsProps {
  alerts: ContractAlert[];
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

/**
 * Contract alerts for portfolio holdings.
 * Shows recent business wins / contract awards for companies the user holds.
 */
export default function ContractAlerts({ alerts, locale, sar }: ContractAlertsProps) {
  const isAr = locale === "ar";

  if (alerts.length === 0) return null;

  return (
    <div style={{ marginBottom: 24 }}>
      <div className="flex items-center gap-2 mb-3">
        <Award size={14} style={{ color: "var(--c-gold)" }} />
        <h3
          className="font-bold"
          style={{
            fontSize: 13,
            color: "var(--c-text)",
            fontFamily: "var(--font-grotesk)",
            flex: 1,
          }}
        >
          {isAr ? "عقود جديدة لمقتنياتك" : "New contracts for your holdings"}
        </h3>
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: "var(--c-gold)",
            padding: "2px 8px",
            borderRadius: 4,
            background: "var(--c-gold-dim)",
            border: "1px solid var(--c-gold-ring)",
          }}
        >
          {alerts.length} {isAr ? "جديد" : "new"}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {alerts.map((a, i) => (
          <Link
            key={`${a.ticker}-${i}`}
            href={`/${locale}/stock/${a.ticker}`}
            style={{ textDecoration: "none" }}
          >
            <div
              className="card"
              style={{
                padding: "14px 16px",
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                transition: "border-color 0.15s",
              }}
            >
              {/* Dot */}
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: materialityColor(a.materialityLabel),
                  marginTop: 4,
                  flexShrink: 0,
                }}
              />

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="flex items-center gap-2 mb-1" style={{ flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--c-text)" }}>
                    {a.ticker}
                  </span>
                  <span style={{ fontSize: 10, color: "var(--c-muted)" }}>
                    {a.companyName}
                  </span>
                  <span style={{ flex: 1 }} />
                  <span
                    style={{
                      fontSize: 8,
                      fontWeight: 700,
                      color: materialityColor(a.materialityLabel),
                      padding: "1px 6px",
                      borderRadius: 3,
                      background: `${materialityColor(a.materialityLabel)}12`,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {isAr ? a.disclosureLabelAr : a.disclosureLabelEn}
                  </span>
                </div>

                <p style={{ fontSize: 10, color: "var(--c-text-sm)", lineHeight: 1.5, margin: 0 }}>
                  {isAr ? a.interpretation.ar : a.interpretation.en}
                </p>

                <div className="flex items-center gap-3 mt-1">
                  {a.value && (
                    <span
                      className="font-num"
                      style={{ fontSize: 10, fontWeight: 600, color: "var(--c-gold)" }}
                    >
                      {a.currency} {fmtVal(a.value)}
                    </span>
                  )}
                  <span style={{ fontSize: 9, color: "var(--c-dim)" }}>
                    {a.daysAgo === 0
                      ? (isAr ? "اليوم" : "Today")
                      : a.daysAgo === 1
                        ? (isAr ? "أمس" : "Yesterday")
                        : (isAr ? `منذ ${a.daysAgo} يومًا` : `${a.daysAgo}d ago`)}
                  </span>
                </div>
              </div>

              {/* Arrow */}
              <ArrowRight
                size={12}
                style={{ color: "var(--c-dim)", marginTop: 4, flexShrink: 0 }}
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
