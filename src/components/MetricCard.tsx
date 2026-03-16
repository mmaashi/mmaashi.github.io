"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  BarChart3,
  DollarSign,
  Calendar,
  TrendingUp,
  Building2,
  Activity,
  Target,
  ShieldCheck,
  Zap,
  Shield,
  LineChart,
  PieChart,
  Gauge,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* ── Icon registry ── */
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
  /** Stock-specific interpretation (null = no interpretation available) */
  interpretation?: MetricInterpretationData | null;
}

export default function MetricCard({
  iconName,
  label,
  value,
  signal,
  sub,
  note,
  locale,
  interpretation,
}: MetricCardProps) {
  const [expanded, setExpanded] = useState(false);
  const Icon = iconMap[iconName] || BarChart3;
  const isAr = locale === "ar";
  const interp = interpretation;

  return (
    <div className="card" style={{ padding: "16px 18px", position: "relative" }}>
      {/* Row 1: Icon + Label */}
      <div className="flex items-center gap-2 mb-1">
        <Icon size={13} style={{ color: "var(--c-muted)" }} />
        <span style={{ fontSize: 11, color: "var(--c-muted)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", flex: 1 }}>
          {label}
        </span>
      </div>

      {/* Row 2: Value + Signal Badge */}
      <div className="flex items-center gap-2">
        <span className="font-num font-bold text-lg" style={{ color: signal !== "insufficient_data" ? "var(--c-text)" : "var(--c-dim)" }}>
          {value}
        </span>
        {interp && (
          <span style={{
            fontSize: 9,
            fontWeight: 700,
            padding: "2px 7px",
            borderRadius: 4,
            background: interp.badgeBg,
            color: interp.badgeColor,
            whiteSpace: "nowrap",
          }}>
            {isAr ? interp.badge.ar : interp.badge.en}
          </span>
        )}
      </div>

      {/* Row 3: Sub-value */}
      {sub && <p className="font-num" style={{ fontSize: 11, color: "var(--c-dim)", marginTop: 2 }}>{sub}</p>}
      {note && <p style={{ fontSize: 10, color: "var(--c-dim)", marginTop: 2, fontStyle: "italic" }}>{note}</p>}

      {/* Row 4: One-liner interpretation (visible by default) */}
      {interp && (
        <p style={{ fontSize: 11, color: "var(--c-muted)", marginTop: 6, lineHeight: 1.5 }}>
          {isAr ? interp.oneLiner.ar : interp.oneLiner.en}
        </p>
      )}

      {/* Row 5: "Why?" expand trigger */}
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
            gap: 3,
            fontSize: 10,
            color: "var(--c-gold)",
            fontWeight: 600,
            opacity: 0.8,
            transition: "opacity 0.15s",
            marginTop: 6,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.8")}
        >
          {isAr ? (expanded ? "إغلاق" : "لماذا؟") : (expanded ? "Close" : "Why?")}
          {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
        </button>
      )}

      {/* Expanded detail */}
      {interp && expanded && (
        <div style={{
          marginTop: 8,
          padding: "10px 12px",
          borderRadius: 8,
          background: "var(--c-elevated)",
          border: "1px solid var(--c-border)",
          direction: isAr ? "rtl" : "ltr",
        }}>
          <p style={{ fontSize: 12, color: "var(--c-text)", lineHeight: 1.6, margin: "0 0 8px 0" }}>
            {isAr ? interp.detail.ar : interp.detail.en}
          </p>
          <div style={{ padding: "8px 10px", borderRadius: 6, background: "rgba(245,158,11,0.06)", borderLeft: isAr ? "none" : "3px solid var(--c-gold)", borderRight: isAr ? "3px solid var(--c-gold)" : "none" }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: "var(--c-gold)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 3 }}>
              {isAr ? "ما يجب مراقبته" : "What to watch"}
            </p>
            <p style={{ fontSize: 11, color: "var(--c-muted)", lineHeight: 1.5, margin: 0 }}>
              {isAr ? interp.watch.ar : interp.watch.en}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
