"use client";

/**
 * MiniSparkline — a tiny inline price chart for the stock hero card.
 * Shows last 30 data points as a sparkline with gradient fill.
 * Inspired by Simply Wall St's inline price charts.
 */
interface Props {
  data: { close: number }[];
  width?: number;
  height?: number;
  color?: string;
  isPositive?: boolean;
}

export default function MiniSparkline({
  data,
  width = 120,
  height = 36,
  isPositive = true,
}: Props) {
  if (!data || data.length < 2) return null;

  // Take last 30 points
  const points = data.slice(-30);
  const closes = points.map(p => p.close);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const range = max - min || 1;

  const padding = 2;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  const pathPoints = closes.map((v, i) => {
    const x = padding + (i / (closes.length - 1)) * innerW;
    const y = padding + innerH - ((v - min) / range) * innerH;
    return `${x},${y}`;
  });

  const linePath = `M${pathPoints.join(" L")}`;

  // Fill area path (close polygon to bottom)
  const lastX = padding + innerW;
  const firstX = padding;
  const fillPath = `${linePath} L${lastX},${height} L${firstX},${height} Z`;

  const strokeColor = isPositive ? "#0ECB81" : "#F6465D";
  const gradientId = `spark-fill-${isPositive ? "up" : "down"}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: "block" }}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity={0.25} />
          <stop offset="100%" stopColor={strokeColor} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      {/* Fill area */}
      <path d={fillPath} fill={`url(#${gradientId})`} />
      {/* Line */}
      <path d={linePath} fill="none" stroke={strokeColor} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      {/* Current price dot */}
      <circle
        cx={padding + innerW}
        cy={padding + innerH - ((closes[closes.length - 1] - min) / range) * innerH}
        r={2.5}
        fill={strokeColor}
        stroke="var(--c-base)"
        strokeWidth={1}
      />
    </svg>
  );
}
