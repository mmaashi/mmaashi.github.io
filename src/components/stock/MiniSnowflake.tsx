"use client";

interface Props {
  scores: {
    value: number;
    growth: number;
    dividend: number;
    health: number;
    momentum: number;
  } | null;
  size?: number;
}

export default function MiniSnowflake({ scores, size = 40 }: Props) {
  if (!scores) {
    // Greyed-out placeholder pentagon
    return (
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ flexShrink: 0 }}
      >
        {/* Pentagon outline */}
        <polygon
          points={generatePentagonPoints(size, 5)}
          fill="none"
          stroke="var(--c-border)"
          strokeWidth="1"
          opacity="0.5"
        />
      </svg>
    );
  }

  // Normalize scores (assume 0-5 scale, convert to 0-1 for SVG)
  const normalize = (val: number) => Math.max(0, Math.min(1, val / 5));

  const n = {
    value: normalize(scores.value),
    growth: normalize(scores.growth),
    dividend: normalize(scores.dividend),
    health: normalize(scores.health),
    momentum: normalize(scores.momentum),
  };

  // Pentagon points in order: Value, Growth, Dividend, Health, Momentum
  const order = ["value", "growth", "dividend", "health", "momentum"];

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ flexShrink: 0 }}
    >
      {/* Pentagon outline */}
      <polygon
        points={generatePentagonPoints(size, 5)}
        fill="none"
        stroke="var(--c-gold)"
        strokeWidth="1"
        opacity="0.3"
      />

      {/* Data polygon (filled) */}
      <polygon
        points={generateDataPolygonPoints(size, order, n)}
        fill="var(--c-gold)"
        fillOpacity="0.15"
        stroke="var(--c-gold)"
        strokeWidth="1.5"
      />

      {/* Axis lines (light) */}
      {order.map((_, idx) => {
        const angle = (idx / 5) * Math.PI * 2 - Math.PI / 2;
        const x1 = size / 2;
        const y1 = size / 2;
        const x2 = size / 2 + (size / 2.2) * Math.cos(angle);
        const y2 = size / 2 + (size / 2.2) * Math.sin(angle);
        return (
          <line
            key={`axis-${idx}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="var(--c-gold)"
            strokeWidth="0.5"
            opacity="0.2"
          />
        );
      })}
    </svg>
  );
}

/**
 * Generate pentagon points (regular polygon with 5 sides)
 */
function generatePentagonPoints(size: number, sides: number): string {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2.2;

  const points: string[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    points.push(`${x},${y}`);
  }

  return points.join(" ");
}

/**
 * Generate data polygon points based on scores
 */
function generateDataPolygonPoints(
  size: number,
  order: string[],
  normalized: Record<string, number>
): string {
  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = size / 2.2;

  const points: string[] = [];
  order.forEach((key, idx) => {
    const angle = (idx / order.length) * Math.PI * 2 - Math.PI / 2;
    const dataValue = normalized[key] || 0;
    const radius = maxRadius * dataValue;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    points.push(`${x},${y}`);
  });

  return points.join(" ");
}
