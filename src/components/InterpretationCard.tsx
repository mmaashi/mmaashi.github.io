"use client";

import { useState } from "react";
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

/* ── Compact sub-metric row ── */
function SubMetricRow({ m, locale }: { m: SubMetric; locale: string }) {
  const [open, setOpen] = useState(false);
  const isAr = locale === "ar";
  const i = m.interpretation;

  return (
    <div
      style={{ padding: "8px 10px", borderRadius: 6, cursor: i ? "pointer" : "default" }}
      onClick={() => i && setOpen(!open)}
    >
      {/* Label + value + badge — single tight row */}
      <div className="flex items-baseline gap-1 flex-wrap" style={{ marginBottom: 1 }}>
        <span style={{ fontSize: 10, color: "var(--c-dim)", fontWeight: 600 }}>{m.label}</span>
        {i && (
          <span style={{
            fontSize: 7, fontWeight: 700, padding: "1px 4px", borderRadius: 2,
            background: i.badgeBg, color: i.badgeColor, whiteSpace: "nowrap", position: "relative", top: -1,
          }}>
            {isAr ? i.badge.ar : i.badge.en}
          </span>
        )}
      </div>

      <span
        className="font-num font-semibold"
        style={{
          fontSize: 14,
          color:
            m.signal === "insufficient_data" ? "var(--c-dim)"
            : m.colorBySign && m.raw && m.raw > 0 ? "var(--c-green)"
            : m.colorBySign && m.raw && m.raw < 0 ? "var(--c-red)"
            : "var(--c-text)",
        }}
      >
        {m.value}
      </span>
      {m.note && <span style={{ fontSize: 8, color: "var(--c-dim)", fontStyle: "italic", marginLeft: 4 }}>{m.note}</span>}

      {/* Collapsed: no one-liner in sub-metrics (too dense). Only badge conveys signal. */}

      {/* Expanded: detail + watch — flat, no nested box */}
      {i && open && (
        <div style={{ marginTop: 6, paddingTop: 5, borderTop: "1px solid var(--c-border)", direction: isAr ? "rtl" : "ltr" }}>
          <p style={{ fontSize: 10, color: "var(--c-muted)", lineHeight: 1.45, margin: 0 }}>
            {isAr ? i.oneLiner.ar : i.oneLiner.en}
          </p>
          <p style={{ fontSize: 10, color: "var(--c-gold)", margin: 0, marginTop: 4, opacity: 0.85 }}>
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
    <div className="card" style={{ padding: "18px 20px" }}>
      {/* Header: icon + title + verdict badge */}
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} style={{ color: iconColor }} />
        <h3 className="font-bold" style={{ fontSize: 13, color: "var(--c-text)", flex: 1 }}>{title}</h3>
        <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: sigBg, color: sigColor }}>
          {signalLabel}
        </span>
      </div>

      {/* Section verdict — one line, visible */}
      <p style={{ fontSize: 11, color: "var(--c-muted)", marginBottom: 12, lineHeight: 1.5 }}>
        {detail}
      </p>

      {/* Sub-metrics grid */}
      <div className={`grid gap-1.5 ${cols === 3 ? "grid-cols-3" : "grid-cols-2"}`} style={{ background: "var(--c-elevated)", borderRadius: 8, padding: 4 }}>
        {subMetrics.filter(m => !m.hidden).map((m) => (
          <SubMetricRow key={m.key} m={m} locale={locale} />
        ))}
      </div>

      {children}
    </div>
  );
}
