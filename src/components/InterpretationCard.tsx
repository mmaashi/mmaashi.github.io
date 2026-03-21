"use client";

import {
  BarChart3, DollarSign, Calendar, TrendingUp, Building2, Activity,
  Target, ShieldCheck, Zap, Shield, LineChart, PieChart, Gauge,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  BarChart3, DollarSign, Calendar, TrendingUp, Building2, Activity,
  Target, ShieldCheck, Zap, Shield, LineChart, PieChart, Gauge,
};

export interface SubMetricInterpretation {
  signal: string;
  badge: { en: string; ar: string };
  oneLiner: { en: string; ar: string };
  detail: { en: string; ar: string };
  watch: { en: string; ar: string };
  badgeColor: string;
  badgeBg: string;
}

interface SubMetric {
  key: string;
  label: string;
  value: string;
  signal: string;
  raw?: number | null;
  note?: string;
  hidden?: boolean;
  colorBySign?: boolean;
  interpretation?: SubMetricInterpretation | null;
}

interface InterpretationCardProps {
  iconName: string;
  iconColor: string;
  title: string;
  signalLabel: string;
  signalBg: string;
  signalColor: string;
  detail: string;
  subMetrics: SubMetric[];
  locale: string;
  sectionExplainer?: string;
  children?: React.ReactNode;
  cols?: 2 | 3;
}

/* ── Helper: Map signal to score (0-100) for visual gauge ── */
function signalToScore(signal: string): number {
  switch (signal) {
    case "excellent": return 90;
    case "good": return 70;
    case "fair": return 50;
    case "weak": return 25;
    case "insufficient_data": return 0;
    default: return 50;
  }
}

/* ── Helper: Get color for score ── */
function getScoreColor(score: number): string {
  if (score >= 75) return "var(--c-green)"; // Gold zone
  if (score >= 50) return "var(--c-green)"; // Green zone
  if (score >= 25) return "var(--c-yellow)"; // Yellow zone
  return "var(--c-red)"; // Red zone
}

/* ── Visual gauge row for sub-metric ── */
function SubMetricGaugeRow({ m, locale, sectionColor }: { m: SubMetric; locale: string; sectionColor: string }) {
  const isAr = locale === "ar";
  const i = m.interpretation;
  const score = signalToScore(m.signal);

  return (
    <div style={{ padding: "12px 0", direction: isAr ? "rtl" : "ltr" }}>
      {/* Label, value, and badge in header row */}
      <div className="flex items-baseline gap-2 flex-wrap" style={{ marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: "var(--c-muted)", fontWeight: 600 }}>{m.label}</span>
        <span
          className="font-num font-semibold"
          style={{
            fontSize: 16,
            color:
              m.signal === "insufficient_data" ? "var(--c-dim)"
              : m.colorBySign && m.raw && m.raw > 0 ? "var(--c-green)"
              : m.colorBySign && m.raw && m.raw < 0 ? "var(--c-red)"
              : "var(--c-text)",
          }}
        >
          {m.value}
        </span>
        {i && (
          <span style={{
            fontSize: 8, fontWeight: 700, padding: "2px 6px", borderRadius: 3,
            background: i.badgeBg, color: i.badgeColor, whiteSpace: "nowrap",
          }}>
            {isAr ? i.badge.ar : i.badge.en}
          </span>
        )}
      </div>

      {/* Horizontal progress bar gauge */}
      {m.signal !== "insufficient_data" && (
        <div style={{
          width: "100%", height: 8, borderRadius: 4,
          background: "var(--c-surface)",
          position: "relative", overflow: "hidden",
          marginBottom: 8,
        }}>
          {/* Segmented zones */}
          <div style={{ width: "25%", height: "100%", background: "rgba(239, 68, 68, 0.3)", position: "absolute", left: 0 }} />
          <div style={{ width: "25%", height: "100%", background: "rgba(234, 179, 8, 0.3)", position: "absolute", left: "25%" }} />
          <div style={{ width: "25%", height: "100%", background: "rgba(34, 197, 94, 0.3)", position: "absolute", left: "50%" }} />
          <div style={{ width: "25%", height: "100%", background: "rgba(34, 197, 94, 0.5)", position: "absolute", left: "75%" }} />

          {/* Progress fill and marker */}
          {score > 0 && (
            <>
              <div style={{
                width: `${Math.min(score, 100)}%`,
                height: "100%",
                background: getScoreColor(score),
                borderRadius: 4,
                transition: "width 0.3s ease-out",
              }} />
              <div style={{
                position: "absolute",
                left: `${Math.min(score, 100)}%`,
                top: "50%",
                transform: "translate(-50%, -50%)",
                width: 12,
                height: 12,
                background: getScoreColor(score),
                borderRadius: "50%",
                border: "2px solid var(--c-base)",
                boxShadow: `0 2px 4px rgba(0,0,0,0.1)`,
              }} />
            </>
          )}
        </div>
      )}

      {/* Detail explanation — always visible */}
      {i && (
        <div style={{ direction: isAr ? "rtl" : "ltr" }}>
          <p style={{ fontSize: 11, color: "var(--c-muted)", lineHeight: 1.5, margin: "6px 0 0 0" }}>
            {isAr ? i.oneLiner.ar : i.oneLiner.en}
          </p>
          <p style={{ fontSize: 10, color: "var(--c-gold)", margin: "4px 0 0 0", opacity: 0.85 }}>
            {isAr ? "👁 " : "👁 "}{isAr ? i.watch.ar : i.watch.en}
          </p>
        </div>
      )}
    </div>
  );
}

export default function InterpretationCard({
  iconName, iconColor, title, signalLabel, signalBg: sigBg, signalColor: sigColor,
  detail, subMetrics, locale, sectionExplainer, children, cols = 2,
}: InterpretationCardProps) {
  const isAr = locale === "ar";
  const Icon = iconMap[iconName] || Target;

  return (
    <div className="card" style={{
      padding: "28px 24px",
      background: `linear-gradient(135deg, var(--c-base) 0%, ${iconColor}08 100%)`,
      border: `1px solid ${iconColor}20`,
    }}>
      {/* Header: icon + title + verdict badge */}
      <div className="flex items-center gap-2 mb-4">
        <Icon size={18} style={{ color: iconColor }} />
        <h3 className="font-bold" style={{ fontSize: 16, color: "var(--c-text)", flex: 1 }}>{title}</h3>
        <span style={{ fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 6, background: sigBg, color: sigColor }}>
          {signalLabel}
        </span>
      </div>

      {/* Section explainer — highlighted, always visible */}
      {sectionExplainer && (
        <div style={{
          padding: "12px 14px",
          borderRadius: 8,
          background: `${iconColor}15`,
          border: `1px solid ${iconColor}30`,
          marginBottom: 16,
        }}>
          <p style={{
            fontSize: 14,
            color: "var(--c-text)",
            lineHeight: 1.6,
            margin: 0,
            fontWeight: 500,
          }}>
            {sectionExplainer}
          </p>
        </div>
      )}

      {/* Section verdict — one line, visible */}
      <p style={{ fontSize: 12, color: "var(--c-muted)", marginBottom: 16, lineHeight: 1.6 }}>
        {detail}
      </p>

      {/* Sub-metrics grid with gauges */}
      <div className={`grid gap-2 ${cols === 3 ? "grid-cols-3" : "grid-cols-2"}`} style={{
        background: "var(--c-elevated)",
        borderRadius: 10,
        padding: 12,
      }}>
        {subMetrics.filter(m => !m.hidden).map((m) => (
          <SubMetricGaugeRow key={m.key} m={m} locale={locale} sectionColor={iconColor} />
        ))}
      </div>

      {children}
    </div>
  );
}
