"use client";

import { useState, useMemo, useCallback } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import { t } from "@/lib/i18n";

interface PricePoint {
  date: string;
  close: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
  prevClose?: number | null;
}

interface Props {
  data: PricePoint[];
  color?: string;
  ticker: string;
  locale?: string;
  height?: number;
}

const PERIODS = [
  { key: "1W", days: 7 },
  { key: "1M", days: 30 },
  { key: "3M", days: 90 },
  { key: "6M", days: 180 },
  { key: "1Y", days: 365 },
  { key: "ALL", days: 0 },
] as const;

function PremiumTooltip({ active, payload, label, locale }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  const sar = t(locale || "en", "common.sar");
  const isAr = locale === "ar";
  const chg = d.prevClose && d.prevClose > 0 ? ((d.close - d.prevClose) / d.prevClose) * 100 : null;
  const isUp = chg !== null ? chg >= 0 : true;

  return (
    <div style={{
      background: "rgba(15,20,30,0.95)",
      border: "1px solid rgba(200,169,81,0.25)",
      borderRadius: 12,
      padding: "12px 16px",
      boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
      backdropFilter: "blur(12px)",
      minWidth: 180,
    }}>
      <p style={{ color: "var(--c-gold)", fontSize: 11, fontWeight: 600, marginBottom: 8, letterSpacing: "0.04em" }}>{d.date}</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px" }}>
        {d.open != null && (
          <>
            <span style={{ fontSize: 10, color: "var(--c-dim)" }}>{isAr ? "الافتتاح" : "Open"}</span>
            <span className="font-num" style={{ fontSize: 12, fontWeight: 600, color: "var(--c-text)", textAlign: "right" }}>{sar} {d.open.toFixed(2)}</span>
          </>
        )}
        {d.high != null && (
          <>
            <span style={{ fontSize: 10, color: "var(--c-dim)" }}>{isAr ? "أعلى" : "High"}</span>
            <span className="font-num" style={{ fontSize: 12, fontWeight: 600, color: "#22c55e", textAlign: "right" }}>{sar} {d.high.toFixed(2)}</span>
          </>
        )}
        {d.low != null && (
          <>
            <span style={{ fontSize: 10, color: "var(--c-dim)" }}>{isAr ? "أدنى" : "Low"}</span>
            <span className="font-num" style={{ fontSize: 12, fontWeight: 600, color: "#ef4444", textAlign: "right" }}>{sar} {d.low.toFixed(2)}</span>
          </>
        )}
        <span style={{ fontSize: 10, color: "var(--c-dim)" }}>{isAr ? "الإغلاق" : "Close"}</span>
        <span className="font-num" style={{ fontSize: 12, fontWeight: 700, color: "var(--c-text)", textAlign: "right" }}>{sar} {d.close.toFixed(2)}</span>
        {d.volume != null && (
          <>
            <span style={{ fontSize: 10, color: "var(--c-dim)" }}>{isAr ? "الحجم" : "Volume"}</span>
            <span className="font-num" style={{ fontSize: 12, fontWeight: 600, color: "var(--c-muted)", textAlign: "right" }}>
              {d.volume >= 1e6 ? `${(d.volume / 1e6).toFixed(1)}M` : d.volume >= 1e3 ? `${(d.volume / 1e3).toFixed(0)}K` : d.volume.toLocaleString()}
            </span>
          </>
        )}
      </div>
      {chg !== null && (
        <div style={{ marginTop: 8, paddingTop: 6, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <span className="font-num" style={{ fontSize: 12, fontWeight: 700, color: isUp ? "#22c55e" : "#ef4444" }}>
            {isUp ? "+" : ""}{chg.toFixed(2)}% {isAr ? "مقابل الإغلاق السابق" : "vs prev close"}
          </span>
        </div>
      )}
    </div>
  );
}

// Custom crosshair cursor
function CustomCursor({ points, height }: any) {
  if (!points || points.length === 0) return null;
  const x = points[0]?.x;
  const y = points[0]?.y;
  if (x == null || y == null) return null;
  return (
    <g>
      {/* Vertical line */}
      <line x1={x} y1={0} x2={x} y2={height} stroke="rgba(200,169,81,0.3)" strokeWidth={1} strokeDasharray="4 4" />
      {/* Horizontal line */}
      <line x1={0} y1={y} x2={2000} y2={y} stroke="rgba(200,169,81,0.2)" strokeWidth={1} strokeDasharray="4 4" />
      {/* Crosshair dot */}
      <circle cx={x} cy={y} r={5} fill="var(--c-gold)" stroke="var(--c-base)" strokeWidth={2} />
      <circle cx={x} cy={y} r={8} fill="none" stroke="rgba(200,169,81,0.3)" strokeWidth={1} />
    </g>
  );
}

export default function PriceChart({ data, ticker, locale = "en", height }: Props) {
  const [period, setPeriod] = useState<string>("1Y");
  const isAr = locale === "ar";

  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    const p = PERIODS.find((p) => p.key === period);
    if (!p || p.days === 0) return data;
    return data.slice(-p.days);
  }, [data, period]);

  const chartPointsWithPrev = useMemo(() => {
    return filteredData.map((point, i) => ({
      ...point,
      prevClose: i > 0 ? filteredData[i - 1].close : null,
    }));
  }, [filteredData]);

  if (!data || data.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center"
        style={{ height: height || 300, background: "var(--c-surface)", borderRadius: 12, border: "1px solid var(--c-border)" }}>
        <p style={{ color: "var(--c-muted)", fontSize: 13 }}>
          {isAr ? "لا توجد بيانات أسعار تاريخية بعد" : "No price history available yet"}
        </p>
      </div>
    );
  }

  const chartPoints = chartPointsWithPrev.length > 1 ? chartPointsWithPrev : data.map((p, i) => ({
    ...p,
    prevClose: i > 0 ? data[i - 1].close : null,
  }));

  const closes = chartPoints.map(d => d.close);
  const minVal = Math.min(...closes) * 0.995;
  const maxVal = Math.max(...closes) * 1.005;
  const firstClose = chartPoints[0]?.close ?? 0;
  const lastClose = chartPoints[chartPoints.length - 1]?.close ?? 0;
  const isUp = lastClose >= firstClose;
  const chartColor = isUp ? "#0ECB81" : "#F6465D";
  const changeAmt = lastClose - firstClose;
  const changePct = firstClose > 0 ? ((changeAmt / firstClose) * 100) : 0;

  const chartHeight = height || 420;

  return (
    <div>
      {/* Period buttons + stats */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-1" style={{ background: "var(--c-elevated)", borderRadius: 8, padding: 3 }}>
          {PERIODS.map(({ key }) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className="font-num transition-all"
              style={{
                padding: "5px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                border: "none", cursor: "pointer",
                color: period === key ? "var(--c-base)" : "var(--c-muted)",
                background: period === key ? "var(--c-gold)" : "transparent",
              }}
            >
              {key}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="font-num" style={{ fontSize: 20, fontWeight: 800, color: "var(--c-text)" }}>
            {t(locale, "common.sar")} {lastClose.toFixed(2)}
          </span>
          <div className="flex items-center gap-2">
            <span className={`font-num font-semibold ${isUp ? "text-up" : "text-down"}`} style={{ fontSize: 13 }}>
              {isUp ? "+" : ""}{changeAmt.toFixed(2)}
            </span>
            <span className={`badge font-num ${isUp ? "badge-up" : "badge-down"}`} style={{ fontSize: 11, padding: "3px 8px" }}>
              {isUp ? "+" : ""}{changePct.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: chartHeight, cursor: "crosshair" }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartPoints} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${ticker}-${period}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chartColor} stopOpacity={0.25} />
                <stop offset="50%" stopColor={chartColor} stopOpacity={0.08} />
                <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: "rgba(148,163,184,0.5)", fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
              tickFormatter={(v) => v.slice(5)}
              interval={Math.max(0, Math.floor(chartPoints.length / 8))}
            />
            <YAxis
              domain={[minVal, maxVal]}
              tick={{ fill: "rgba(148,163,184,0.5)", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => v.toFixed(1)}
              width={50}
              orientation={isAr ? "right" : "left"}
            />
            {/* Last close reference line */}
            <ReferenceLine y={lastClose} stroke="rgba(200,169,81,0.2)" strokeDasharray="6 6" />
            <Tooltip
              content={<PremiumTooltip locale={locale} />}
              cursor={<CustomCursor />}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="close"
              stroke={chartColor}
              strokeWidth={2}
              fill={`url(#grad-${ticker}-${period})`}
              dot={false}
              activeDot={{ r: 0 }}
              animationDuration={600}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Period stats footer */}
      <div className="flex items-center justify-between mt-2" style={{ padding: "0 4px" }}>
        <span style={{ fontSize: 10, color: "var(--c-dim)" }}>
          {isAr ? `${chartPoints.length} يوم` : `${chartPoints.length} days`}
        </span>
        <span style={{ fontSize: 10, color: "var(--c-dim)" }}>
          {isAr ? "أقل" : "Low"}: {Math.min(...closes).toFixed(2)} · {isAr ? "أعلى" : "High"}: {Math.max(...closes).toFixed(2)}
        </span>
      </div>
    </div>
  );
}
