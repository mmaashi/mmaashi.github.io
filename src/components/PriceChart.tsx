"use client";

import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { t } from "@/lib/i18n";

interface PricePoint {
  date: string;
  close: number;
  open?: number;
  high?: number;
  low?: number;
}

interface Props {
  data: PricePoint[];
  color?: string;
  ticker: string;
  locale?: string;
}

const PERIODS = [
  { key: "1W", days: 7 },
  { key: "1M", days: 30 },
  { key: "3M", days: 90 },
  { key: "6M", days: 180 },
  { key: "1Y", days: 365 },
  { key: "ALL", days: 0 },
] as const;

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--c-elevated)",
        border: "1px solid var(--c-border-md)",
        borderRadius: 10,
        padding: "10px 14px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
      }}
    >
      <p style={{ color: "var(--c-muted)", fontSize: 11, marginBottom: 4 }}>{label}</p>
      <p className="font-num" style={{ color: "var(--c-text)", fontSize: 14, fontWeight: 700 }}>
        SAR {Number(payload[0].value).toFixed(2)}
      </p>
    </div>
  );
}

export default function PriceChart({ data, ticker, locale = "en" }: Props) {
  const [period, setPeriod] = useState<string>("ALL");

  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    const p = PERIODS.find((p) => p.key === period);
    if (!p || p.days === 0) return data;
    return data.slice(-p.days);
  }, [data, period]);

  if (!data || data.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center"
        style={{
          height: 220,
          background: "var(--c-surface)",
          borderRadius: 12,
          border: "1px solid var(--c-border)",
        }}
      >
        <svg
          style={{ width: 40, height: 40, color: "var(--c-border-md)", marginBottom: 12 }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
          />
        </svg>
        <p style={{ color: "var(--c-muted)", fontSize: 13 }}>{t(locale, "chart.no_history")}</p>
        <p style={{ color: "var(--c-dim)", fontSize: 11, marginTop: 4 }}>
          {t(locale, "chart.populates")}
        </p>
      </div>
    );
  }

  if (data.length === 1) {
    return (
      <div
        className="flex flex-col items-center justify-center"
        style={{
          height: 220,
          background: "var(--c-surface)",
          borderRadius: 12,
          border: "1px solid var(--c-border)",
        }}
      >
        <p style={{ color: "var(--c-muted)", fontSize: 12, marginBottom: 8 }}>{t(locale, "chart.today")}</p>
        <p className="font-num" style={{ fontSize: 28, fontWeight: 700, color: "var(--c-text)" }}>
          SAR {data[0].close.toFixed(2)}
        </p>
        {data[0].open && (
          <div className="flex gap-4 mt-3" style={{ fontSize: 11, color: "var(--c-muted)" }}>
            <span>Open {data[0].open.toFixed(2)}</span>
            {data[0].high && <span>High {data[0].high.toFixed(2)}</span>}
            {data[0].low && <span>Low {data[0].low.toFixed(2)}</span>}
          </div>
        )}
        <p style={{ color: "var(--c-dim)", fontSize: 11, marginTop: 12 }}>
          {t(locale, "chart.accumulates")}
        </p>
      </div>
    );
  }

  const chartPoints = filteredData.length > 1 ? filteredData : data;
  const minVal = Math.min(...chartPoints.map((d) => d.close)) * 0.995;
  const maxVal = Math.max(...chartPoints.map((d) => d.close)) * 1.005;
  const firstClose = chartPoints[0]?.close ?? 0;
  const lastClose = chartPoints[chartPoints.length - 1]?.close ?? 0;
  const isUp = lastClose >= firstClose;
  const chartColor = isUp ? "#0ECB81" : "#F6465D";
  const changeAmt = lastClose - firstClose;
  const changePct = firstClose > 0 ? ((changeAmt / firstClose) * 100) : 0;

  return (
    <div>
      {/* Period buttons + change indicator */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1">
          {PERIODS.map(({ key }) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className="font-num transition-all"
              style={{
                padding: "4px 10px",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                border: "1px solid transparent",
                cursor: "pointer",
                color: period === key ? "var(--c-text)" : "var(--c-muted)",
                background: period === key ? "var(--c-elevated)" : "transparent",
                borderColor: period === key ? "var(--c-border-md)" : "transparent",
              }}
            >
              {key}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className={`font-num text-sm font-semibold ${isUp ? "text-up" : "text-down"}`}>
            {isUp ? "+" : ""}{changeAmt.toFixed(2)}
          </span>
          <span className={`badge font-num ${isUp ? "badge-up" : "badge-down"}`} style={{ fontSize: 10 }}>
            {isUp ? "+" : ""}{changePct.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartPoints} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${ticker}-${period}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chartColor} stopOpacity={0.2} />
                <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: "rgba(148,163,184,0.6)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => v.slice(5)}
            />
            <YAxis
              domain={[minVal, maxVal]}
              tick={{ fill: "rgba(148,163,184,0.6)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => v.toFixed(2)}
              width={55}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="close"
              stroke={chartColor}
              strokeWidth={2}
              fill={`url(#grad-${ticker}-${period})`}
              dot={false}
              activeDot={{ r: 4, fill: chartColor, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
