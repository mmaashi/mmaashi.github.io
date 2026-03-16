"use client";

import { MetricExplainer } from "./MetricExplainer";
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

/* ── Icon registry (avoids passing component refs across RSC boundary) ── */
const iconMap: Record<string, LucideIcon> = {
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
};

interface GlossaryData {
  what: string;
  why: string;
  how: string;
  watch: string;
}

interface MetricCardProps {
  /** Icon name — must match a key in the internal iconMap */
  iconName: string;
  label: string;
  value: string;
  signal: string;
  sub?: string;
  note?: string;
  glossary?: GlossaryData | null;
  metricKey?: string;
  locale: string;
}

export default function MetricCard({
  iconName,
  label,
  value,
  signal,
  sub,
  note,
  glossary,
  metricKey,
  locale,
}: MetricCardProps) {
  const Icon = iconMap[iconName] || BarChart3;

  return (
    <div className="card" style={{ padding: "16px 18px" }}>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={13} style={{ color: "var(--c-muted)" }} />
        <span style={{ fontSize: 11, color: "var(--c-muted)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", flex: 1 }}>
          {label}
        </span>
        {glossary && metricKey && (
          <MetricExplainer metricKey={metricKey} glossary={glossary} locale={locale} size={12} />
        )}
      </div>
      <span className="font-num font-bold text-lg" style={{ color: signal !== "insufficient_data" ? "var(--c-text)" : "var(--c-dim)" }}>
        {value}
      </span>
      {sub && <p className="font-num" style={{ fontSize: 11, color: "var(--c-dim)", marginTop: 2 }}>{sub}</p>}
      {note && <p style={{ fontSize: 10, color: "var(--c-dim)", marginTop: 2, fontStyle: "italic" }}>{note}</p>}
    </div>
  );
}
