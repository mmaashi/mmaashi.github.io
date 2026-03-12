"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface DataPoint {
  date: string;
  portfolio: number;
  tasi?: number;
}

interface PortfolioPerformanceChartProps {
  data: DataPoint[];
  locale: string;
  sar: string;
}

const RANGES = ["1W", "1M", "3M", "YTD", "1Y", "ALL"] as const;
type Range = (typeof RANGES)[number];

const rangeLabels: Record<Range, { en: string; ar: string }> = {
  "1W": { en: "1W", ar: "أسبوع" },
  "1M": { en: "1M", ar: "شهر" },
  "3M": { en: "3M", ar: "3 أشهر" },
  YTD: { en: "YTD", ar: "السنة" },
  "1Y": { en: "1Y", ar: "سنة" },
  ALL: { en: "All", ar: "الكل" },
};

function filterByRange(data: DataPoint[], range: Range): DataPoint[] {
  if (range === "ALL" || data.length === 0) return data;
  const now = new Date();
  let cutoff: Date;
  switch (range) {
    case "1W":
      cutoff = new Date(now.getTime() - 7 * 86400000);
      break;
    case "1M":
      cutoff = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      break;
    case "3M":
      cutoff = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      break;
    case "YTD":
      cutoff = new Date(now.getFullYear(), 0, 1);
      break;
    case "1Y":
      cutoff = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      break;
    default:
      return data;
  }
  const filtered = data.filter((d) => new Date(d.date) >= cutoff);
  return filtered.length > 1 ? filtered : data;
}

function CustomTooltip({ active, payload, label, sar }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--c-elevated)",
        border: "1px solid var(--c-border-md)",
        borderRadius: 8,
        padding: "10px 14px",
        fontSize: 12,
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
      }}
    >
      <p style={{ color: "var(--c-muted)", marginBottom: 4, fontSize: 10 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color, fontWeight: 600 }}>
          {p.name === "portfolio" ? "Portfolio" : "TASI"}: {sar}{" "}
          {Number(p.value).toLocaleString("en-US", { maximumFractionDigits: 0 })}
        </p>
      ))}
    </div>
  );
}

export default function PortfolioPerformanceChart({
  data,
  locale,
  sar,
}: PortfolioPerformanceChartProps) {
  const [range, setRange] = useState<Range>("3M");
  const isAr = locale === "ar";
  const filtered = filterByRange(data, range);
  const hasTasi = filtered.some((d) => d.tasi !== undefined);

  // Calculate return over selected period
  const firstVal = filtered[0]?.portfolio ?? 0;
  const lastVal = filtered[filtered.length - 1]?.portfolio ?? 0;
  const periodReturn = firstVal > 0 ? ((lastVal - firstVal) / firstVal) * 100 : 0;

  if (data.length < 2) {
    return (
      <div className="card" style={{ padding: "32px 24px", textAlign: "center" }}>
        <p style={{ fontSize: 13, color: "var(--c-muted)" }}>
          {isAr ? "لا تتوفر بيانات كافية للرسم البياني" : "Not enough data for chart"}
        </p>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: "20px 22px" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3
            className="font-bold"
            style={{ fontSize: 15, color: "var(--c-text)", fontFamily: "var(--font-grotesk)" }}
          >
            {isAr ? "أداء المحفظة" : "Portfolio Performance"}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span
              className="font-num font-bold"
              style={{
                fontSize: 18,
                color: periodReturn >= 0 ? "var(--c-green)" : "var(--c-red)",
              }}
            >
              {periodReturn >= 0 ? "+" : ""}{periodReturn.toFixed(1)}%
            </span>
            <span style={{ fontSize: 11, color: "var(--c-dim)" }}>
              {rangeLabels[range][isAr ? "ar" : "en"]}
            </span>
          </div>
        </div>

        {/* Range selector */}
        <div
          style={{
            display: "flex",
            gap: 2,
            background: "var(--c-base)",
            borderRadius: 8,
            padding: 2,
            border: "1px solid var(--c-border)",
          }}
        >
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              style={{
                padding: "4px 10px",
                fontSize: 11,
                fontWeight: range === r ? 700 : 500,
                color: range === r ? "var(--c-gold)" : "var(--c-muted)",
                background: range === r ? "var(--c-gold-dim)" : "transparent",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {rangeLabels[r][isAr ? "ar" : "en"]}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-1">
          <div style={{ width: 10, height: 3, borderRadius: 2, background: "var(--c-gold)" }} />
          <span style={{ fontSize: 10, color: "var(--c-muted)" }}>
            {isAr ? "المحفظة" : "Portfolio"}
          </span>
        </div>
        {hasTasi && (
          <div className="flex items-center gap-1">
            <div style={{ width: 10, height: 3, borderRadius: 2, background: "#60A5FA" }} />
            <span style={{ fontSize: 10, color: "var(--c-muted)" }}>TASI</span>
          </div>
        )}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={filtered} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--c-gold)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--c-gold)" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="tasiGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#60A5FA" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--c-border)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tickFormatter={(v) => {
              const d = new Date(v);
              return `${d.getDate()}/${d.getMonth() + 1}`;
            }}
            tick={{ fontSize: 10, fill: "var(--c-dim)" }}
            axisLine={{ stroke: "var(--c-border)" }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: "var(--c-dim)" }}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`}
            axisLine={false}
            tickLine={false}
            width={45}
          />
          <Tooltip content={<CustomTooltip sar={sar} />} />
          <Area
            type="monotone"
            dataKey="portfolio"
            stroke="var(--c-gold)"
            strokeWidth={2}
            fill="url(#portfolioGrad)"
            dot={false}
            activeDot={{ r: 4, fill: "var(--c-gold)", stroke: "var(--c-surface)", strokeWidth: 2 }}
          />
          {hasTasi && (
            <Area
              type="monotone"
              dataKey="tasi"
              stroke="#60A5FA"
              strokeWidth={1.5}
              fill="url(#tasiGrad)"
              dot={false}
              strokeDasharray="4 2"
              activeDot={{ r: 3, fill: "#60A5FA", stroke: "var(--c-surface)", strokeWidth: 2 }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
