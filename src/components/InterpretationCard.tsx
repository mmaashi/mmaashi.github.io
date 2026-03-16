"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  BarChart3, DollarSign, Calendar, TrendingUp, Building2, Activity,
  Target, ShieldCheck, Zap, Shield, LineChart, PieChart, Gauge,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* ── Icon registry ── */
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
  /** Stock-specific interpretation */
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

function SubMetricCard({ m, locale }: { m: SubMetric; locale: string }) {
  const [expanded, setExpanded] = useState(false);
  const isAr = locale === "ar";
  const interp = m.interpretation;

  return (
    <div style={{ padding: "10px 12px", background: "var(--c-elevated)", borderRadius: 8 }}>
      {/* Label + Badge row */}
      <div className="flex items-center gap-1 flex-wrap" style={{ marginBottom: 3 }}>
        <p style={{ fontSize: 10, color: "var(--c-dim)", fontWeight: 600, margin: 0 }}>{m.label}</p>
        {interp && (
          <span style={{
            fontSize: 8,
            fontWeight: 700,
            padding: "1px 5px",
            borderRadius: 3,
            background: interp.badgeBg,
            color: interp.badgeColor,
            whiteSpace: "nowrap",
          }}>
            {isAr ? interp.badge.ar : interp.badge.en}
          </span>
        )}
      </div>

      {/* Value */}
      <span
        className="font-num font-semibold"
        style={{
          fontSize: 15,
          color:
            m.signal === "insufficient_data"
              ? "var(--c-dim)"
              : m.colorBySign && m.raw && m.raw > 0
              ? "var(--c-green)"
              : m.colorBySign && m.raw && m.raw < 0
              ? "var(--c-red)"
              : "var(--c-text)",
        }}
      >
        {m.value}
      </span>
      {m.note && <p style={{ fontSize: 9, color: "var(--c-dim)", marginTop: 1, fontStyle: "italic" }}>{m.note}</p>}

      {/* One-liner (visible by default when interpretation available) */}
      {interp && (
        <p style={{ fontSize: 10, color: "var(--c-muted)", marginTop: 4, lineHeight: 1.4 }}>
          {isAr ? interp.oneLiner.ar : interp.oneLiner.en}
        </p>
      )}

      {/* "Why?" trigger */}
      {interp && (
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 2,
            fontSize: 9,
            color: "var(--c-gold)",
            fontWeight: 600,
            opacity: 0.75,
            transition: "opacity 0.15s",
            marginTop: 4,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.75")}
        >
          {isAr ? (expanded ? "إغلاق" : "لماذا؟") : (expanded ? "Close" : "Why?")}
          {expanded ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
        </button>
      )}

      {/* Expanded detail */}
      {interp && expanded && (
        <div style={{
          marginTop: 6,
          padding: "8px 10px",
          borderRadius: 6,
          background: "var(--c-surface, rgba(0,0,0,0.15))",
          border: "1px solid var(--c-border)",
          direction: isAr ? "rtl" : "ltr",
        }}>
          <p style={{ fontSize: 11, color: "var(--c-text)", lineHeight: 1.5, margin: "0 0 6px 0" }}>
            {isAr ? interp.detail.ar : interp.detail.en}
          </p>
          <p style={{ fontSize: 9, color: "var(--c-gold)", fontWeight: 600, margin: 0 }}>
            {isAr ? "👁 " : "👁 "}{isAr ? interp.watch.ar : interp.watch.en}
          </p>
        </div>
      )}
    </div>
  );
}

export default function InterpretationCard({
  iconName,
  iconColor,
  title,
  signalLabel,
  signalBg: sigBg,
  signalColor: sigColor,
  detail,
  subMetrics,
  locale,
  sectionExplainer,
  children,
  cols = 2,
}: InterpretationCardProps) {
  const [showExplainer, setShowExplainer] = useState(false);
  const isAr = locale === "ar";
  const Icon = iconMap[iconName] || Target;

  return (
    <div className="card" style={{ padding: "20px 22px" }}>
      {/* Header: icon + title + signal badge */}
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} style={{ color: iconColor }} />
        <h3 className="font-bold" style={{ fontSize: 14, color: "var(--c-text)", flex: 1 }}>{title}</h3>
        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: sigBg, color: sigColor }}>
          {signalLabel}
        </span>
      </div>

      {/* Section summary — visible by default (the main interpretation) */}
      <p style={{ fontSize: 12, color: "var(--c-muted)", marginBottom: 14, lineHeight: 1.6 }}>
        {detail}
      </p>

      {/* Section explainer toggle (de-emphasized) */}
      {sectionExplainer && (
        <div style={{ marginBottom: showExplainer ? 10 : 0 }}>
          <button
            onClick={() => setShowExplainer(!showExplainer)}
            style={{
              background: "none", border: "none", padding: 0, cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: 4,
              fontSize: 10, color: "var(--c-dim)", fontWeight: 600, opacity: 0.7,
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
          >
            {isAr ? "ℹ كيف تقرأ هذا القسم" : "ℹ How to read this section"}
            {showExplainer ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
          </button>
          {showExplainer && (
            <p style={{
              fontSize: 11, color: "var(--c-dim)", lineHeight: 1.6,
              marginTop: 6, padding: "8px 12px", borderRadius: 6,
              background: "var(--c-elevated)", border: "1px solid var(--c-border)",
              direction: isAr ? "rtl" : "ltr",
            }}>
              {sectionExplainer}
            </p>
          )}
        </div>
      )}

      {/* Sub-metrics grid — each with its own interpretation */}
      <div className={`grid gap-2 ${cols === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
        {subMetrics.filter(m => !m.hidden).map((m) => (
          <SubMetricCard key={m.key} m={m} locale={locale} />
        ))}
      </div>

      {/* Extra content */}
      {children}
    </div>
  );
}
