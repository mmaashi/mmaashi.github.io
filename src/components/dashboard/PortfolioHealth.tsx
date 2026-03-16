"use client";

import Link from "next/link";
import { ShieldCheck, BarChart3, ArrowRight, Zap, CheckCircle, AlertTriangle } from "lucide-react";

export interface HealthDimension {
  key: string;
  label: { en: string; ar: string };
  score: number; // 0-100
  signal: "strong" | "healthy" | "mixed" | "weak";
}

export interface PortfolioHealthData {
  overallLabel: { en: string; ar: string };
  overallColor: string;
  summaryLine: { en: string; ar: string };
  dimensions: HealthDimension[];
  strengths: Array<{ en: string; ar: string }>;
  watchouts: Array<{ en: string; ar: string }>;
  benchmarkVerdict: { en: string; ar: string };
  benchmarkReturn: number | null;
  tasiReturn: number | null;
  // NEW: brain-mode fields
  topStrength?: { en: string; ar: string };
  topIssue?: { en: string; ar: string };
  nextAction?: { en: string; ar: string; href: string };
}

interface PortfolioHealthProps {
  data: PortfolioHealthData;
  locale: string;
}

function signalColor(signal: string): string {
  switch (signal) {
    case "strong": return "var(--c-green)";
    case "healthy": return "#4ade80";
    case "mixed": return "var(--c-gold)";
    case "weak": return "var(--c-red)";
    default: return "var(--c-muted)";
  }
}

function signalLabel(signal: string, isAr: boolean): string {
  const map: Record<string, { en: string; ar: string }> = {
    strong: { en: "Strong", ar: "قوي" },
    healthy: { en: "Healthy", ar: "صحي" },
    mixed: { en: "Mixed", ar: "مختلط" },
    weak: { en: "Weak", ar: "ضعيف" },
  };
  return isAr ? map[signal]?.ar ?? signal : map[signal]?.en ?? signal;
}

export default function PortfolioHealth({ data, locale }: PortfolioHealthProps) {
  const isAr = locale === "ar";
  const d = data;

  return (
    <div className="card" style={{ padding: "22px 24px" }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <ShieldCheck size={14} style={{ color: d.overallColor }} />
        <h3
          className="font-bold"
          style={{
            fontSize: 14,
            color: "var(--c-text)",
            fontFamily: "var(--font-grotesk)",
            flex: 1,
          }}
        >
          {isAr ? "صحة المحفظة" : "Portfolio health"}
        </h3>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: d.overallColor,
            padding: "3px 10px",
            borderRadius: 6,
            background: `${d.overallColor}15`,
            border: `1px solid ${d.overallColor}25`,
          }}
        >
          {isAr ? d.overallLabel.ar : d.overallLabel.en}
        </span>
      </div>

      <p style={{ fontSize: 11, color: "var(--c-muted)", marginBottom: 16, lineHeight: 1.5 }}>
        {isAr ? d.summaryLine.ar : d.summaryLine.en}
      </p>

      {/* ── Brain: Top Strength / Top Issue / Next Action ── */}
      {(d.topStrength || d.topIssue || d.nextAction) && (
        <div
          style={{
            padding: "12px 14px",
            borderRadius: 8,
            background: "linear-gradient(135deg, rgba(200,169,81,0.04), rgba(6,13,24,0.3))",
            border: "1px solid var(--c-gold-ring)",
            marginBottom: 16,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {d.topStrength && (
            <div className="flex items-start gap-2">
              <CheckCircle size={11} style={{ color: "var(--c-green)", marginTop: 2, flexShrink: 0 }} />
              <div>
                <span style={{ fontSize: 8, fontWeight: 700, color: "var(--c-green)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  {isAr ? "نقطة قوة" : "Top strength"}
                </span>
                <p style={{ fontSize: 10, color: "var(--c-text-sm)", margin: 0, marginTop: 1, lineHeight: 1.45 }}>
                  {isAr ? d.topStrength.ar : d.topStrength.en}
                </p>
              </div>
            </div>
          )}

          {d.topIssue && (
            <div className="flex items-start gap-2">
              <AlertTriangle size={11} style={{ color: "var(--c-gold)", marginTop: 2, flexShrink: 0 }} />
              <div>
                <span style={{ fontSize: 8, fontWeight: 700, color: "var(--c-gold)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  {isAr ? "أهم ملاحظة" : "Top issue"}
                </span>
                <p style={{ fontSize: 10, color: "var(--c-text-sm)", margin: 0, marginTop: 1, lineHeight: 1.45 }}>
                  {isAr ? d.topIssue.ar : d.topIssue.en}
                </p>
              </div>
            </div>
          )}

          {d.nextAction && (
            <Link
              href={d.nextAction.href}
              className="flex items-center gap-2"
              style={{ textDecoration: "none" }}
            >
              <Zap size={11} style={{ color: "var(--c-gold)", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 8, fontWeight: 700, color: "var(--c-gold)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  {isAr ? "الخطوة التالية" : "Next action"}
                </span>
                <p style={{ fontSize: 10, color: "var(--c-gold)", margin: 0, marginTop: 1, lineHeight: 1.45, fontWeight: 600 }}>
                  {isAr ? d.nextAction.ar : d.nextAction.en}
                </p>
              </div>
              <ArrowRight size={10} style={{ color: "var(--c-gold)" }} />
            </Link>
          )}
        </div>
      )}

      {/* Dimension bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 18 }}>
        {d.dimensions.map((dim) => (
          <div key={dim.key} className="flex items-center gap-3">
            <span
              style={{
                fontSize: 10,
                color: "var(--c-muted)",
                width: 90,
                flexShrink: 0,
                fontWeight: 600,
              }}
            >
              {isAr ? dim.label.ar : dim.label.en}
            </span>
            <div
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                background: "var(--c-border)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${Math.min(dim.score, 100)}%`,
                  height: "100%",
                  borderRadius: 2,
                  background: signalColor(dim.signal),
                  transition: "width 0.4s ease",
                }}
              />
            </div>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: signalColor(dim.signal),
                width: 44,
                textAlign: "right",
                flexShrink: 0,
              }}
            >
              {signalLabel(dim.signal, isAr)}
            </span>
          </div>
        ))}
      </div>

      {/* Strengths + Watchouts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* Strengths */}
        <div>
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: "var(--c-green)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: 8,
              display: "block",
            }}
          >
            {isAr ? "ما يبدو قويًا" : "What looks strong"}
          </span>
          {d.strengths.map((s, i) => (
            <div key={i} className="flex items-start gap-2" style={{ marginBottom: 6 }}>
              <div
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  background: "var(--c-green)",
                  marginTop: 5,
                  flexShrink: 0,
                }}
              />
              <p
                style={{
                  fontSize: 10,
                  color: "var(--c-text-sm)",
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                {isAr ? s.ar : s.en}
              </p>
            </div>
          ))}
        </div>

        {/* Watchouts */}
        <div>
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: "var(--c-gold)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: 8,
              display: "block",
            }}
          >
            {isAr ? "ما يستحق المراقبة" : "What to watch"}
          </span>
          {d.watchouts.map((w, i) => (
            <div key={i} className="flex items-start gap-2" style={{ marginBottom: 6 }}>
              <div
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  background: "var(--c-gold)",
                  marginTop: 5,
                  flexShrink: 0,
                }}
              />
              <p
                style={{
                  fontSize: 10,
                  color: "var(--c-text-sm)",
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                {isAr ? w.ar : w.en}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Benchmark mini-card */}
      <div
        style={{
          padding: "10px 14px",
          borderRadius: 8,
          background: "var(--c-elevated)",
          border: "1px solid var(--c-border)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <BarChart3 size={12} style={{ color: "var(--c-muted)", flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: "var(--c-dim)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            {isAr ? "مقابل تاسي" : "Versus TASI"}
          </span>
          <p
            style={{
              fontSize: 10,
              color: "var(--c-muted)",
              margin: 0,
              marginTop: 2,
              lineHeight: 1.4,
            }}
          >
            {isAr ? d.benchmarkVerdict.ar : d.benchmarkVerdict.en}
          </p>
        </div>
        {d.benchmarkReturn !== null && d.tasiReturn !== null && (
          <div className="flex items-center gap-3">
            <div style={{ textAlign: "center" }}>
              <span style={{ fontSize: 8, color: "var(--c-dim)", display: "block" }}>
                {isAr ? "أنت" : "You"}
              </span>
              <span
                className="font-num font-bold"
                style={{
                  fontSize: 12,
                  color: d.benchmarkReturn >= 0 ? "var(--c-green)" : "var(--c-red)",
                }}
              >
                {d.benchmarkReturn >= 0 ? "+" : ""}
                {d.benchmarkReturn.toFixed(1)}%
              </span>
            </div>
            <div style={{ textAlign: "center" }}>
              <span style={{ fontSize: 8, color: "var(--c-dim)", display: "block" }}>TASI</span>
              <span
                className="font-num font-bold"
                style={{
                  fontSize: 12,
                  color:
                    d.tasiReturn !== null && d.tasiReturn >= 0
                      ? "var(--c-green)"
                      : "var(--c-red)",
                }}
              >
                {d.tasiReturn >= 0 ? "+" : ""}
                {d.tasiReturn.toFixed(1)}%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
