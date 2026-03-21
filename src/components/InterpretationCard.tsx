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
function SubMetricGaugeRow({ m, locale, sectionColor, isLast }: { m: SubMetric; locale: string; sectionColor: string; isLast: boolean }) {
  const isAr = locale === "ar";
  const i = m.interpretation;
  const score = signalToScore(m.signal);

  return (
    <div style={{ direction: isAr ? "rtl" : "ltr" }}>
      <div style={{ padding: "16px 0" }}>
        {/* Label, value, and badge in header row */}
        <div className="flex items-baseline gap-3 flex-wrap" style={{ marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: "var(--c-muted)", fontWeight: 700, letterSpacing: "0.5px" }}>{m.label}</span>
          <span
            className="font-num font-semibold"
            style={{
              fontSize: 20,
              color:
                m.signal === "insufficient_data" ? "var(--c-dim)"
                : m.colorBySign && m.raw && m.raw > 0 ? "var(--c-green)"
                : m.colorBySign && m.raw && m.raw < 0 ? "var(--c-red)"
                : "var(--c-text)",
              fontWeight: 700,
            }}
          >
            {m.value}
          </span>
          {i && (
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 4,
              background: i.badgeBg, color: i.badgeColor, whiteSpace: "nowrap",
            }}>
              {isAr ? i.badge.ar : i.badge.en}
            </span>
          )}
        </div>

        {/* Horizontal progress bar gauge — bigger and more prominent */}
        {m.signal !== "insufficient_data" && (
          <div style={{
            width: "100%", height: 14, borderRadius: 7,
            background: "var(--c-surface)",
            position: "relative", overflow: "hidden",
            marginBottom: 12,
            border: "1px solid var(--c-border)",
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
                  borderRadius: 6,
                  transition: "width 0.3s ease-out",
                }} />
                <div style={{
                  position: "absolute",
                  left: `${Math.min(score, 100)}%`,
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 16,
                  height: 16,
                  background: getScoreColor(score),
                  borderRadius: "50%",
                  border: "3px solid var(--c-base)",
                  boxShadow: `0 0 8px ${getScoreColor(score)}, 0 2px 6px rgba(0,0,0,0.15)`,
                }} />
              </>
            )}
          </div>
        )}

        {/* Detail explanation — conversational and more visible */}
        {i && (
          <div style={{ direction: isAr ? "rtl" : "ltr" }}>
            <p style={{ fontSize: 13, color: "var(--c-text)", lineHeight: 1.6, margin: "8px 0 0 0", fontWeight: 500 }}>
              {isAr ? i.oneLiner.ar : i.oneLiner.en}
            </p>
            <p style={{
              fontSize: 12,
              color: "var(--c-yellow)",
              margin: "6px 0 0 0",
              padding: "6px 10px",
              background: "rgba(234, 179, 8, 0.15)",
              borderRadius: 4,
              display: "inline-block",
              fontWeight: 500,
            }}>
              {isAr ? "👁 " : "👁 "}{isAr ? i.watch.ar : i.watch.en}
            </p>
          </div>
        )}
      </div>

      {/* Divider line between metrics */}
      {!isLast && (
        <div style={{
          height: "1px",
          background: "var(--c-border)",
          opacity: 0.5,
        }} />
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
  const visibleMetrics = subMetrics.filter(m => !m.hidden);

  return (
    <div className="card" style={{
      padding: "32px 28px",
      background: `linear-gradient(135deg, var(--c-base) 0%, ${iconColor}12 100%)`,
      border: `1.5px solid ${iconColor}40`,
      minHeight: "400px",
      boxShadow: `inset 0 1px 2px rgba(255, 255, 255, 0.05)`,
    }}>
      {/* Header: icon + title + verdict badge */}
      <div className="flex items-center gap-3 mb-6">
        <Icon size={22} style={{ color: iconColor, flexShrink: 0 }} />
        <h3 className="font-bold" style={{ fontSize: 18, color: "var(--c-text)", flex: 1 }}>{title}</h3>
        <span style={{ fontSize: 11, fontWeight: 700, padding: "6px 12px", borderRadius: 6, background: sigBg, color: sigColor, whiteSpace: "nowrap" }}>
          {signalLabel}
        </span>
      </div>

      {/* Section explainer — premium styling with left border accent */}
      {sectionExplainer && (
        <div style={{
          padding: "16px 18px",
          paddingLeft: "18px",
          borderRadius: 8,
          background: `${iconColor}12`,
          border: `1px solid ${iconColor}35`,
          borderLeft: `4px solid ${iconColor}`,
          marginBottom: 20,
        }}>
          <p style={{
            fontSize: 15,
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
      <p style={{ fontSize: 13, color: "var(--c-text)", marginBottom: 20, lineHeight: 1.6, fontWeight: 500 }}>
        {detail}
      </p>

      {/* Sub-metrics grid with gauges */}
      <div className={`${cols === 3 ? "grid-cols-3" : "grid-cols-2"}`} style={{
        display: "grid",
        background: "var(--c-elevated)",
        borderRadius: 10,
        padding: "20px",
        border: `1px solid var(--c-border)`,
        gap: 0,
      }}>
        {visibleMetrics.map((m, idx) => (
          <SubMetricGaugeRow
            key={m.key}
            m={m}
            locale={locale}
            sectionColor={iconColor}
            isLast={idx === visibleMetrics.length - 1}
          />
        ))}
      </div>

      {children}
    </div>
  );
}