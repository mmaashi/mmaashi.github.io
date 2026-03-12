"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface SectorSlice {
  sector: string;
  sectorAr: string;
  value: number;
  weight: number;
  count: number;
  change: number; // today's change %
}

interface SectorAllocationChartProps {
  sectors: SectorSlice[];
  locale: string;
  sar: string;
}

const SECTOR_COLORS = [
  "var(--c-gold)",
  "#60A5FA",
  "#34D399",
  "#F472B6",
  "#A78BFA",
  "#FB923C",
  "#38BDF8",
  "#E879F9",
  "#FBBF24",
  "#94A3B8",
];

function fmtValue(v: number): string {
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
  return v.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function CustomTooltip({ active, payload, sar }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as SectorSlice;
  return (
    <div
      style={{
        background: "var(--c-elevated)",
        border: "1px solid var(--c-border-md)",
        borderRadius: 8,
        padding: "10px 14px",
        fontSize: 12,
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        minWidth: 140,
      }}
    >
      <p style={{ fontWeight: 700, color: "var(--c-text)", marginBottom: 4 }}>{d.sector}</p>
      <p style={{ color: "var(--c-muted)" }}>
        {sar} {fmtValue(d.value)} · {d.weight.toFixed(1)}%
      </p>
      <p style={{ color: "var(--c-dim)", fontSize: 10 }}>
        {d.count} {d.count === 1 ? "stock" : "stocks"}
      </p>
    </div>
  );
}

export default function SectorAllocationChart({
  sectors,
  locale,
  sar,
}: SectorAllocationChartProps) {
  const isAr = locale === "ar";

  if (!sectors.length) {
    return (
      <div className="card" style={{ padding: "32px 24px", textAlign: "center" }}>
        <p style={{ fontSize: 13, color: "var(--c-muted)" }}>
          {isAr ? "لا توجد بيانات توزيع القطاعات" : "No sector data available"}
        </p>
      </div>
    );
  }

  // Sort by weight descending
  const sorted = [...sectors].sort((a, b) => b.weight - a.weight);

  return (
    <div className="card" style={{ padding: "20px 22px" }}>
      <h3
        className="font-bold mb-4"
        style={{ fontSize: 15, color: "var(--c-text)", fontFamily: "var(--font-grotesk)" }}
      >
        {isAr ? "توزيع القطاعات" : "Sector Allocation"}
      </h3>

      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        {/* Donut chart */}
        <div style={{ width: 160, height: 160, flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={sorted}
                cx="50%"
                cy="50%"
                innerRadius={42}
                outerRadius={72}
                paddingAngle={2}
                dataKey="weight"
                stroke="var(--c-surface)"
                strokeWidth={2}
              >
                {sorted.map((_, i) => (
                  <Cell key={i} fill={SECTOR_COLORS[i % SECTOR_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip sar={sar} />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend list */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
          {sorted.map((s, i) => (
            <div
              key={s.sector}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  background: SECTOR_COLORS[i % SECTOR_COLORS.length],
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  flex: 1,
                  color: "var(--c-text-sm)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {isAr ? s.sectorAr : s.sector}
              </span>
              <span className="font-num" style={{ color: "var(--c-muted)", fontSize: 11 }}>
                {s.weight.toFixed(1)}%
              </span>
              <span
                className="font-num"
                style={{
                  fontSize: 10,
                  color: s.change >= 0 ? "var(--c-green)" : "var(--c-red)",
                  minWidth: 40,
                  textAlign: "right",
                }}
              >
                {s.change >= 0 ? "+" : ""}
                {s.change.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
