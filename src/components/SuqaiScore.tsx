"use client";

import { t } from "@/lib/i18n";

interface ScoreDimension {
  key: string;
  label: string;
  score: number; // 0-5
  color: string;
}

interface Props {
  value: number;      // 0-5, overall value score
  growth: number;     // 0-5
  dividend: number;   // 0-5
  health: number;     // 0-5
  momentum: number;   // 0-5
  locale?: string;
  size?: number;
}

export default function SuqaiScore({
  value,
  growth,
  dividend,
  health,
  momentum,
  locale = "en",
  size = 200,
}: Props) {
  const dimensions: ScoreDimension[] = [
    { key: "value", label: t(locale, "score.value"), score: value, color: "#C8A951" },
    { key: "growth", label: t(locale, "score.growth"), score: growth, color: "#0ECB81" },
    { key: "dividend", label: t(locale, "score.dividend"), score: dividend, color: "#60A5FA" },
    { key: "health", label: t(locale, "score.health"), score: health, color: "#A78BFA" },
    { key: "momentum", label: t(locale, "score.momentum"), score: momentum, color: "#F59E0B" },
  ];

  const totalScore = Math.round(
    ((value + growth + dividend + health + momentum) / 25) * 100
  );

  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.38;
  const angleStep = (2 * Math.PI) / 5;
  const startAngle = -Math.PI / 2; // Start from top

  // Generate snowflake polygon points
  const points = dimensions.map((d, i) => {
    const angle = startAngle + i * angleStep;
    const r = (d.score / 5) * maxR;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
      labelX: cx + (maxR + 24) * Math.cos(angle),
      labelY: cy + (maxR + 24) * Math.sin(angle),
      dotX: cx + maxR * Math.cos(angle),
      dotY: cy + maxR * Math.sin(angle),
    };
  });

  const polygonPoints = points.map((p) => `${p.x},${p.y}`).join(" ");

  // Grid rings (1-5)
  const rings = [1, 2, 3, 4, 5];

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background rings */}
        {rings.map((ring) => {
          const r = (ring / 5) * maxR;
          const ringPoints = dimensions.map((_, i) => {
            const angle = startAngle + i * angleStep;
            return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
          }).join(" ");
          return (
            <polygon
              key={ring}
              points={ringPoints}
              fill="none"
              stroke="var(--c-border)"
              strokeWidth={ring === 5 ? 1.5 : 0.5}
              opacity={ring === 5 ? 0.6 : 0.3}
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
              strokeWidth={0.5}
              opacity={0.3}
            />
          );
        })}

        {/* Filled snowflake */}
        <defs>
          <linearGradient id="snowflake-fill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#C8A951" stopOpacity={0.2} />
            <stop offset="50%" stopColor="#0ECB81" stopOpacity={0.15} />
            <stop offset="100%" stopColor="#60A5FA" stopOpacity={0.2} />
          </linearGradient>
        </defs>
        <polygon
          points={polygonPoints}
          fill="url(#snowflake-fill)"
          stroke="var(--c-gold)"
          strokeWidth={2}
          strokeLinejoin="round"
          style={{ filter: "drop-shadow(0 0 8px rgba(200, 169, 81, 0.3))" }}
        />

        {/* Score dots on vertices */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={4}
            fill={dimensions[i].color}
            stroke="var(--c-surface)"
            strokeWidth={2}
            style={{ filter: `drop-shadow(0 0 4px ${dimensions[i].color}50)` }}
          />
        ))}

        {/* Center total score */}
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="var(--c-gold)"
          fontSize={28}
          fontWeight={800}
          fontFamily="var(--font-grotesk), system-ui"
          style={{ filter: "drop-shadow(0 0 12px rgba(200, 169, 81, 0.4))" }}
        >
          {totalScore}
        </text>
        <text
          x={cx}
          y={cy + 14}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="var(--c-muted)"
          fontSize={9}
          fontWeight={600}
          letterSpacing="0.1em"
        >
          {t(locale, "score.label").toUpperCase()}
        </text>
      </svg>

      {/* Dimension labels */}
      <div className="grid grid-cols-5 gap-2 mt-3 w-full" style={{ maxWidth: size + 40 }}>
        {dimensions.map((d) => (
          <div key={d.key} className="text-center">
            <div
              className="font-num font-bold text-sm"
              style={{ color: d.color }}
            >
              {d.score.toFixed(1)}
            </div>
            <div style={{ fontSize: 9, color: "var(--c-muted)", fontWeight: 600, letterSpacing: "0.04em" }}>
              {d.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Score calculation utilities ─────────────────────────────────

export function calculateScores(data: {
  pe: number | null;
  eps: number | null;
  divYield: number | null;
  revenue: number | null;
  netIncome: number | null;
  changePct: number | null;
  currentPrice: number | null;
  fiftyTwoHigh: number | null;
  fiftyTwoLow: number | null;
}) {
  // Value score (based on P/E — lower is better)
  let valueScore = 2.5;
  if (data.pe !== null) {
    const pe = parseFloat(String(data.pe));
    if (pe <= 0) valueScore = 1;
    else if (pe < 10) valueScore = 5;
    else if (pe < 15) valueScore = 4;
    else if (pe < 20) valueScore = 3;
    else if (pe < 30) valueScore = 2;
    else valueScore = 1;
  }

  // Growth score (based on EPS positivity and revenue)
  let growthScore = 2.5;
  if (data.eps !== null) {
    const eps = parseFloat(String(data.eps));
    if (eps > 5) growthScore = 5;
    else if (eps > 2) growthScore = 4;
    else if (eps > 0.5) growthScore = 3;
    else if (eps > 0) growthScore = 2;
    else growthScore = 1;
  }

  // Dividend score (based on yield)
  let dividendScore = 0;
  if (data.divYield !== null) {
    const dy = parseFloat(String(data.divYield));
    if (dy >= 6) dividendScore = 5;
    else if (dy >= 4) dividendScore = 4;
    else if (dy >= 2) dividendScore = 3;
    else if (dy >= 1) dividendScore = 2;
    else if (dy > 0) dividendScore = 1;
  }

  // Health score (based on profitability)
  let healthScore = 2.5;
  if (data.netIncome !== null && data.revenue !== null && data.revenue > 0) {
    const margin = (data.netIncome / data.revenue) * 100;
    if (margin > 30) healthScore = 5;
    else if (margin > 20) healthScore = 4;
    else if (margin > 10) healthScore = 3;
    else if (margin > 0) healthScore = 2;
    else healthScore = 1;
  }

  // Momentum score (based on price position within 52W range)
  let momentumScore = 2.5;
  if (data.currentPrice !== null && data.fiftyTwoHigh !== null && data.fiftyTwoLow !== null) {
    const range = data.fiftyTwoHigh - data.fiftyTwoLow;
    if (range > 0) {
      const position = (data.currentPrice - data.fiftyTwoLow) / range;
      momentumScore = Math.max(0.5, Math.min(5, position * 5));
    }
  }
  if (data.changePct !== null) {
    // Adjust by recent momentum
    if (data.changePct > 3) momentumScore = Math.min(5, momentumScore + 1);
    else if (data.changePct < -3) momentumScore = Math.max(0.5, momentumScore - 1);
  }

  return {
    value: Math.round(valueScore * 10) / 10,
    growth: Math.round(growthScore * 10) / 10,
    dividend: Math.round(dividendScore * 10) / 10,
    health: Math.round(healthScore * 10) / 10,
    momentum: Math.round(momentumScore * 10) / 10,
  };
}
