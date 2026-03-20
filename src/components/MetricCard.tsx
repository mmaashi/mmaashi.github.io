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

export interface MetricInterpretationData {
  signal: string;
  badge: { en: string; ar: string };
  oneLiner: { en: string; ar: string };
  detail: { en: string; ar: string };
  watch: { en: string; ar: string };
  badgeColor: string;
  badgeBg: string;
}

interface MetricCardProps {
  iconName: string;
  label: string;
  value: string;
  signal: string;
  sub?: string;
  note?: string;
  locale: string;
  interpretation?: MetricInterpretationData | null;
}

export default function MetricCard({
  iconName, label, value, signal, sub, note, locale, interpretation,
}: MetricCardProps) {
  const [expanded, setExpanded] = useState(false);
  const Icon = iconMap[iconName] || BarChart3;
  const isAr = locale === "ar";
  const i = interpretation;

  return (
    <div
      className="card"
      style={{ padding: "14px 16px", cursor: i ? "pointer" : "default" }}
      onClick={() => i && setExpanded(!expanded)}
    >
      {/* Label row */}
      <div className="flex items-center gap-2 mb-1">
        <Icon size={12} style={{ color: "var(--c-muted)", opacity: 0.7 }} />
        <span style={{ fontSize: 10, color: "var(--c-dim)", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", flex: 1 }}>
          {label}
        </span>
        {i && (
          <span style={{
            fontSize: 8, fontWeight: 700, padding: "1px 6px", borderRadius: 3,
            background: i.badgeBg, color: i.badgeColor, whiteSpace: "nowrap",
          }}>
            {isAr ? i.badge.ar : i.badge.en}
          </span>
        )}
      </div>

      {/* Value */}
      <span className="font-num font-bold" style={{ fontSize: 18, color: signal !== "insufficient_data" ? "var(--c-text)" : "var(--c-dim)", lineHeight: 1.2 }}>
        {value}
      </span>
      {sub && <p className="font-num" style={{ fontSize: 10, color: "var(--c-dim)", marginTop: 2 }}>{sub}</p>}
      {note && <p style={{ fontSize: 9, color: "var(--c-dim)", marginTop: 1, fontStyle: "italic" }}>{note}</p>}

      {/* One-liner — compact, visible */}
      {i && (
        <p style={{ fontSize: 10, color: "var(--c-muted)", marginTop: 5, lineHeight: 1.4, opacity: 0.85 }}>
          {isAr ? i.oneLiner.ar : i.oneLiner.en}
        </p>
      )}

      {/* Expanded — inline, no box-inside-box */}
      {i && expanded && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--c-border)", direction: isAr ? "rtl" : "ltr" }}>
          <p style={{ fontSize: 11, color: "var(--c-text)", lineHeight: 1.55, margin: 0 }}>
            {isAr ? i.detail.ar : i.detail.en}
          </p>
          <p style={{ fontSize: 10, color: "var(--c-gold)", margin: 0, marginTop: 6, opacity: 0.9 }}>
            {isAr ? "👁 " : "👁 "}{isAr ? i.watch.ar : i.watch.en}
          </p>
        </div>
      )}
    </div>
  );
}
