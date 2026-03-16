"use client";

import { MetricExplainer, SectionExplainerToggle } from "./MetricExplainer";
import type { LucideIcon } from "lucide-react";

interface GlossaryData {
  what: string;
  why: string;
  how: string;
  watch: string;
}

interface SubMetric {
  key: string;
  label: string;
  value: string;
  signal: string;
  raw?: number | null;
  note?: string;
  hidden?: boolean;
  glossary?: GlossaryData | null;
  /** Color override for growth metrics */
  colorBySign?: boolean;
}

interface InterpretationCardProps {
  icon: LucideIcon;
  iconColor: string;
  title: string;
  signalLabel: string;
  signalBg: string;
  signalColor: string;
  detail: string;
  subMetrics: SubMetric[];
  locale: string;
  /** Section explainer text */
  sectionExplainer?: string;
  /** Extra content below sub-metrics (e.g. sector percentiles, volatility) */
  children?: React.ReactNode;
  /** Grid columns for sub-metrics */
  cols?: 2 | 3;
}

export default function InterpretationCard({
  icon: Icon,
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
  const isAr = locale === "ar";

  return (
    <div className="card" style={{ padding: "20px 22px" }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Icon size={14} style={{ color: iconColor }} />
        <h3 className="font-bold" style={{ fontSize: 14, color: "var(--c-text)" }}>{title}</h3>
        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: sigBg, color: sigColor }}>
          {signalLabel}
        </span>
      </div>

      {/* Interpretation detail */}
      <p style={{ fontSize: 12, color: "var(--c-muted)", marginBottom: 12, lineHeight: 1.5 }}>
        {detail}
      </p>

      {/* Section explainer toggle */}
      {sectionExplainer && (
        <SectionExplainerToggle text={sectionExplainer} locale={locale} />
      )}

      {/* Sub-metrics grid */}
      <div className={`grid gap-2 ${cols === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
        {subMetrics.filter(m => !m.hidden).map(({ key, label, value, signal, raw, note, glossary, colorBySign }) => (
          <div key={key} style={{ padding: "8px 10px", background: "var(--c-elevated)", borderRadius: 6 }}>
            <div className="flex items-center gap-1" style={{ marginBottom: 2 }}>
              <p style={{ fontSize: 10, color: "var(--c-dim)", fontWeight: 600, flex: 1, margin: 0 }}>{label}</p>
              {glossary && (
                <MetricExplainer metricKey={key} glossary={glossary} locale={locale} size={10} />
              )}
            </div>
            <span
              className="font-num font-semibold"
              style={{
                fontSize: 14,
                color:
                  signal === "insufficient_data"
                    ? "var(--c-dim)"
                    : colorBySign && raw && raw > 0
                    ? "var(--c-green)"
                    : colorBySign && raw && raw < 0
                    ? "var(--c-red)"
                    : "var(--c-text)",
              }}
            >
              {value}{note ? " *" : ""}
            </span>
            {note && <p style={{ fontSize: 9, color: "var(--c-dim)", marginTop: 1, fontStyle: "italic" }}>{note}</p>}
          </div>
        ))}
      </div>

      {/* Extra content */}
      {children}
    </div>
  );
}
