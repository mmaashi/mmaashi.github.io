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

// Re-export from server-safe utility so existing imports don't break
export { calculateScores } from "@/lib/scores";
