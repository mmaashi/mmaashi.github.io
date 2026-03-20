"use client";

import { useState } from "react";
import { t } from "@/lib/i18n";

/* ── Types ── */
interface ScoreDimension {
  key: string;
  label: string;
  score: number; // 0-5
  color: string;
  meaning: { en: string; ar: string };
}

interface Props {
  value: number;
  growth: number;
  dividend: number;
  health: number;
  momentum: number;
  locale?: string;
  size?: number;
  companyName?: string;
  onDimensionClick?: (dimensionKey: string) => void;
  /** Override the center score display (e.g., from company_metrics_daily.suqai_score) */
  overrideScore?: number | null;
}

/* ── Pillar interpretation helpers ── */
function pillarMeaning(key: string, score: number): { en: string; ar: string } {
  const s = score / 5; // 0-1
  const map: Record<string, { en: string; ar: string }[]> = {
    value: [
      { en: "Valuation looks expensive relative to fundamentals", ar: "التقييم يبدو مرتفعًا مقارنة بالأساسيات" },
      { en: "Valuation is moderate — not cheap, not expensive", ar: "التقييم معتدل — ليس رخيصًا ولا مرتفعًا" },
      { en: "Valuation looks reasonable on trailing earnings", ar: "التقييم يبدو معقولًا على أساس الأرباح" },
    ],
    growth: [
      { en: "Growth profile is limited on available data", ar: "ملف النمو محدود بناءً على البيانات المتاحة" },
      { en: "Moderate growth — revenue and earnings are steady", ar: "نمو معتدل — الإيرادات والأرباح مستقرة" },
      { en: "Strong growth trajectory on revenue and earnings", ar: "مسار نمو قوي في الإيرادات والأرباح" },
    ],
    dividend: [
      { en: "Limited or no dividend support", ar: "دعم محدود أو معدوم من التوزيعات" },
      { en: "Moderate dividend yield — some income support", ar: "عائد توزيعات معتدل — بعض الدعم للدخل" },
      { en: "Attractive dividend profile with meaningful yield", ar: "ملف توزيعات جاذب مع عائد مجدٍ" },
    ],
    health: [
      { en: "Balance sheet shows elevated leverage", ar: "الميزانية تظهر رافعة مالية مرتفعة" },
      { en: "Financial health is adequate — no major red flags", ar: "الصحة المالية كافية — لا علامات تحذير كبيرة" },
      { en: "Strong financial health with low leverage", ar: "صحة مالية قوية مع رافعة منخفضة" },
    ],
    momentum: [
      { en: "Price momentum is weak or negative", ar: "زخم السعر ضعيف أو سلبي" },
      { en: "Price action is stable — no strong direction", ar: "حركة السعر مستقرة — لا اتجاه واضح" },
      { en: "Positive momentum with price near highs", ar: "زخم إيجابي مع سعر قريب من القمم" },
    ],
  };
  const arr = map[key] || map.value;
  if (s < 0.33) return arr[0];
  if (s < 0.67) return arr[1];
  return arr[2];
}

function profileSummary(
  dims: ScoreDimension[],
  locale: string
): string {
  const sorted = [...dims].sort((a, b) => b.score - a.score);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];
  const isAr = locale === "ar";

  const labelMap: Record<string, { en: string; ar: string }> = {
    value: { en: "value", ar: "القيمة" },
    growth: { en: "growth", ar: "النمو" },
    dividend: { en: "dividends", ar: "التوزيعات" },
    health: { en: "financial health", ar: "الصحة المالية" },
    momentum: { en: "momentum", ar: "الزخم" },
  };

  const sName = labelMap[strongest.key] || { en: strongest.key, ar: strongest.key };
  const wName = labelMap[weakest.key] || { en: weakest.key, ar: weakest.key };

  if (strongest.score - weakest.score < 0.8) {
    return isAr
      ? "ملف متوازن عبر معظم الأبعاد."
      : "Balanced profile across most dimensions.";
  }

  if (isAr) {
    return `يتميّز في ${sName.ar}، لكن ${wName.ar} أضعف نسبيًا.`;
  }
  return `Stands out on ${sName.en}, but ${wName.en} is relatively weaker.`;
}

/* ── Component ── */
export default function SuqaiScore({
  value,
  growth,
  dividend,
  health,
  momentum,
  locale = "en",
  size = 220,
  companyName,
  onDimensionClick,
  overrideScore,
}: Props) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const isAr = locale === "ar";

  const sectionAnchors: Record<string, string> = {
    value: "valuation",
    growth: "growth",
    dividend: "dividend",
    health: "safety",
    momentum: "momentum",
  };

  const dimensions: ScoreDimension[] = [
    { key: "value", label: t(locale, "score.value"), score: value, color: "#C8A951", meaning: pillarMeaning("value", value) },
    { key: "growth", label: t(locale, "score.growth"), score: growth, color: "#0ECB81", meaning: pillarMeaning("growth", growth) },
    { key: "dividend", label: t(locale, "score.dividend"), score: dividend, color: "#60A5FA", meaning: pillarMeaning("dividend", dividend) },
    { key: "health", label: t(locale, "score.health"), score: health, color: "#A78BFA", meaning: pillarMeaning("health", health) },
    { key: "momentum", label: t(locale, "score.momentum"), score: momentum, color: "#F59E0B", meaning: pillarMeaning("momentum", momentum) },
  ];

  const totalScore = overrideScore != null ? Math.round(overrideScore) : Math.round(((value + growth + dividend + health + momentum) / 25) * 100);
  const sorted = [...dimensions].sort((a, b) => b.score - a.score);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];
  const summary = profileSummary(dimensions, locale);

  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.36;
  const angleStep = (2 * Math.PI) / 5;
  const startAngle = -Math.PI / 2;

  const points = dimensions.map((d, i) => {
    const angle = startAngle + i * angleStep;
    const r = (d.score / 5) * maxR;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
      labelX: cx + (maxR + 28) * Math.cos(angle),
      labelY: cy + (maxR + 28) * Math.sin(angle),
      outerX: cx + maxR * Math.cos(angle),
      outerY: cy + maxR * Math.sin(angle),
    };
  });

  const polygonPoints = points.map((p) => `${p.x},${p.y}`).join(" ");
  const rings = [1, 2, 3, 4, 5];

  // Tooltip position
  const hoveredDim = hoveredIdx !== null ? dimensions[hoveredIdx] : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      {/* ── SVG Snowflake ── */}
      <div style={{ position: "relative" }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ overflow: "visible" }}
        >
          <defs>
            {/* Glow filter */}
            <filter id="sf-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Fill gradient */}
            <linearGradient id="sf-fill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#C8A951" stopOpacity={0.15} />
              <stop offset="40%" stopColor="#0ECB81" stopOpacity={0.1} />
              <stop offset="80%" stopColor="#60A5FA" stopOpacity={0.12} />
              <stop offset="100%" stopColor="#A78BFA" stopOpacity={0.08} />
            </linearGradient>
            {/* Stroke gradient */}
            <linearGradient id="sf-stroke" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#C8A951" />
              <stop offset="50%" stopColor="#0ECB81" />
              <stop offset="100%" stopColor="#60A5FA" />
            </linearGradient>
          </defs>

          {/* Grid rings */}
          {rings.map((ring) => {
            const r = (ring / 5) * maxR;
            const rPts = dimensions
              .map((_, i) => {
                const angle = startAngle + i * angleStep;
                return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
              })
              .join(" ");
            return (
              <polygon
                key={ring}
                points={rPts}
                fill="none"
                stroke="var(--c-border)"
                strokeWidth={ring === 5 ? 1 : 0.4}
                opacity={ring === 5 ? 0.5 : 0.2}
              />
            );
          })}

          {/* Axis lines */}
          {dimensions.map((_, i) => {
            const angle = startAngle + i * angleStep;
            return (
              <line
                key={i}
                x1={cx}
                y1={cy}
                x2={cx + maxR * Math.cos(angle)}
                y2={cy + maxR * Math.sin(angle)}
                stroke="var(--c-border)"
                strokeWidth={0.4}
                opacity={0.2}
              />
            );
          })}

          {/* Filled snowflake polygon */}
          <polygon
            points={polygonPoints}
            fill="url(#sf-fill)"
            stroke="url(#sf-stroke)"
            strokeWidth={2.5}
            strokeLinejoin="round"
            filter="url(#sf-glow)"
            className="sf-shape"
          />

          {/* Vertex dots */}
          {points.map((p, i) => {
            const isHovered = hoveredIdx === i;
            const isStrongest = dimensions[i].key === strongest.key;
            const dotR = isHovered ? 6 : isStrongest ? 5 : 4;
            return (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={dotR}
                fill={dimensions[i].color}
                stroke="var(--c-surface)"
                strokeWidth={2}
                style={{
                  filter: `drop-shadow(0 0 ${isHovered ? 8 : 4}px ${dimensions[i].color}60)`,
                  cursor: "pointer",
                  transition: "r 0.2s ease",
                }}
              />
            );
          })}

          {/* Hover hit areas (invisible, larger) */}
          {points.map((p, i) => (
            <circle
              key={`hit-${i}`}
              cx={p.outerX}
              cy={p.outerY}
              r={20}
              fill="transparent"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => {
                const anchor = sectionAnchors[dimensions[i].key];
                if (anchor) {
                  const el = document.getElementById(anchor);
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                }
                if (onDimensionClick) onDimensionClick(dimensions[i].key);
              }}
              style={{ cursor: "pointer" }}
            />
          ))}

        </svg>

        {/* ── HTML labels (replaces SVG text for proper Arabic BiDi) ── */}
        {points.map((p, i) => {
          const isHovered = hoveredIdx === i;
          return (
            <div
              key={`lbl-${i}`}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => {
                const anchor = sectionAnchors[dimensions[i].key];
                if (anchor) {
                  const el = document.getElementById(anchor);
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                }
                if (onDimensionClick) onDimensionClick(dimensions[i].key);
              }}
              style={{
                position: "absolute",
                left: p.labelX,
                top: p.labelY,
                transform: "translate(-50%, -50%)",
                color: isHovered ? dimensions[i].color : "var(--c-muted)",
                fontSize: isHovered ? 11 : 10,
                fontWeight: isHovered ? 700 : 600,
                fontFamily: "var(--font-grotesk), system-ui",
                cursor: "pointer",
                transition: "color 0.2s, font-size 0.2s",
                textDecoration: isHovered ? "underline" : "none",
                whiteSpace: "nowrap",
                textAlign: "center",
                direction: isAr ? "rtl" : "ltr",
                userSelect: "none",
                pointerEvents: "auto",
              }}
            >
              {dimensions[i].label}
            </div>
          );
        })}

        {/* Center score (HTML for proper rendering) */}
        <div style={{
          position: "absolute",
          left: cx,
          top: cy,
          transform: "translate(-50%, -50%)",
          textAlign: "center",
          pointerEvents: "none",
        }}>
          <div style={{
            fontSize: 28,
            fontWeight: 800,
            color: "var(--c-gold)",
            fontFamily: "var(--font-grotesk), system-ui",
            lineHeight: 1,
            filter: "drop-shadow(0 0 14px rgba(200, 169, 81, 0.5))",
          }}>
            {totalScore}
          </div>
          <div style={{
            fontSize: 8,
            fontWeight: 600,
            color: "var(--c-muted)",
            letterSpacing: isAr ? "0" : "0.14em",
            marginTop: 2,
            direction: isAr ? "rtl" : "ltr",
          }}>
            {isAr ? t(locale, "score.label") : t(locale, "score.label").toUpperCase()}
          </div>
        </div>

        {/* Hover tooltip */}
        {hoveredDim && (
          <div
            style={{
              position: "absolute",
              bottom: -8,
              left: "50%",
              transform: "translateX(-50%)",
              background: "var(--c-surface)",
              border: "1px solid var(--c-border)",
              borderRadius: 10,
              padding: "8px 14px",
              minWidth: 180,
              maxWidth: 260,
              zIndex: 20,
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
              pointerEvents: "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: hoveredDim.color,
                  boxShadow: `0 0 6px ${hoveredDim.color}60`,
                }}
              />
              <span style={{ fontSize: 11, fontWeight: 700, color: hoveredDim.color }}>
                {hoveredDim.label}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--c-text)", marginLeft: "auto" }}>
                {hoveredDim.score.toFixed(1)} / 5
              </span>
            </div>
            <p style={{ fontSize: 10, color: "var(--c-muted)", margin: 0, lineHeight: 1.5 }}>
              {isAr ? hoveredDim.meaning.ar : hoveredDim.meaning.en}
            </p>
          </div>
        )}
      </div>

      {/* ── Hint text ── */}
      <p style={{ fontSize: 9, color: "var(--c-dim)", textAlign: "center", margin: "4px 0 0" }}>
        {locale === "ar" ? "اضغط على أي بُعد للانتقال إلى تفاصيله" : "Click any dimension to jump to its details"}
      </p>

      {/* ── Pillar bars ── */}
      <div style={{ display: "flex", gap: 8, width: "100%", maxWidth: size + 40, justifyContent: "center" }}>
        {dimensions.map((d) => (
          <div
            key={d.key}
            style={{ flex: 1, textAlign: "center", cursor: "pointer" }}
            onMouseEnter={() => setHoveredIdx(dimensions.indexOf(d))}
            onMouseLeave={() => setHoveredIdx(null)}
            onClick={() => {
              const anchor = sectionAnchors[d.key];
              if (anchor) {
                const el = document.getElementById(anchor);
                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
              }
              if (onDimensionClick) onDimensionClick(d.key);
            }}
          >
            <div
              style={{
                height: 3,
                borderRadius: 2,
                background: `linear-gradient(90deg, ${d.color}20, ${d.color})`,
                marginBottom: 4,
                width: `${(d.score / 5) * 100}%`,
                minWidth: 4,
                transition: "width 0.6s ease",
              }}
            />
            <div style={{ fontSize: 12, fontWeight: 700, color: d.color, fontFamily: "var(--font-num)" }}>
              {d.score.toFixed(1)}
            </div>
            <div style={{ fontSize: 8, color: "var(--c-muted)", fontWeight: 600, letterSpacing: "0.04em" }}>
              {d.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Interpretation layer ── */}
      <div
        style={{
          width: "100%",
          maxWidth: size + 60,
          marginTop: 6,
          padding: "10px 14px",
          borderRadius: 10,
          background: "rgba(200,169,81,0.04)",
          border: "1px solid var(--c-border)",
        }}
      >
        {/* Summary line */}
        <p style={{ fontSize: 11, color: "var(--c-text)", margin: 0, marginBottom: 6, lineHeight: 1.5, fontWeight: 500 }}>
          {summary}
        </p>

        {/* Strongest / Weakest */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, flex: 1, minWidth: 100 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: strongest.color, boxShadow: `0 0 4px ${strongest.color}50` }} />
            <span style={{ fontSize: 9, color: "var(--c-muted)", fontWeight: 600 }}>
              {isAr ? "الأقوى" : "Strongest"}:
            </span>
            <span style={{ fontSize: 9, color: strongest.color, fontWeight: 700 }}>
              {strongest.label} ({strongest.score.toFixed(1)})
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, flex: 1, minWidth: 100 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: weakest.color, opacity: 0.5 }} />
            <span style={{ fontSize: 9, color: "var(--c-muted)", fontWeight: 600 }}>
              {isAr ? "الأضعف" : "Weakest"}:
            </span>
            <span style={{ fontSize: 9, color: "var(--c-dim)", fontWeight: 600 }}>
              {weakest.label} ({weakest.score.toFixed(1)})
            </span>
          </div>
        </div>
      </div>

      {/* ── Load animation ── */}
      <style>{`
        .sf-shape {
          animation: sf-draw 1s ease-out forwards;
          stroke-dasharray: 800;
          stroke-dashoffset: 800;
        }
        @keyframes sf-draw {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
}

// Re-export so existing imports don't break
export { calculateScores } from "@/lib/scores";
