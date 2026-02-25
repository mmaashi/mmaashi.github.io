"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1F2937] border border-gray-700 rounded-lg p-3 text-sm shadow-xl">
      <p className="text-gray-400 mb-1">{label}</p>
      <p className="text-white font-semibold">SAR {Number(payload[0].value).toFixed(2)}</p>
    </div>
  );
}

export default function PriceChart({ data, color = "#C8A951", ticker }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="h-56 flex flex-col items-center justify-center bg-[#0D1626] rounded-lg border border-gray-800">
        <svg className="w-10 h-10 text-gray-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
        <p className="text-gray-500 text-sm">No price history yet</p>
        <p className="text-gray-600 text-xs mt-1">Populates as daily cron runs</p>
      </div>
    );
  }

  if (data.length === 1) {
    return (
      <div className="h-56 flex flex-col items-center justify-center bg-[#0D1626] rounded-lg border border-gray-800">
        <p className="text-gray-500 text-sm mb-2">Today&apos;s price</p>
        <p className="text-3xl font-bold text-white">SAR {data[0].close.toFixed(2)}</p>
        {data[0].open && (
          <div className="flex gap-4 mt-3 text-xs text-gray-500">
            <span>Open {data[0].open.toFixed(2)}</span>
            {data[0].high && <span>High {data[0].high.toFixed(2)}</span>}
            {data[0].low && <span>Low {data[0].low.toFixed(2)}</span>}
          </div>
        )}
        <p className="text-gray-600 text-xs mt-3">Chart fills as daily data accumulates</p>
      </div>
    );
  }

  const minVal = Math.min(...data.map((d) => d.close)) * 0.995;
  const maxVal = Math.max(...data.map((d) => d.close)) * 1.005;
  const firstClose = data[0]?.close ?? 0;
  const lastClose = data[data.length - 1]?.close ?? 0;
  const isUp = lastClose >= firstClose;
  const chartColor = isUp ? "#10B981" : "#EF4444";

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${ticker}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={chartColor} stopOpacity={0.25} />
              <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: "#6B7280", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => v.slice(5)} // show MM-DD
          />
          <YAxis
            domain={[minVal, maxVal]}
            tick={{ fill: "#6B7280", fontSize: 11 }}
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
            fill={`url(#grad-${ticker})`}
            dot={false}
            activeDot={{ r: 4, fill: chartColor, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
