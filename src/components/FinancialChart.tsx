"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";

interface FinancialPoint {
  year: number;
  period: string;
  revenue: number | null;
  net_income: number | null;
  earnings_per_share: number | null;
}

interface Props {
  data: FinancialPoint[];
}

function fmt(val: number): string {
  const abs = Math.abs(val);
  if (abs >= 1e12) return `${(val / 1e12).toFixed(1)}T`;
  if (abs >= 1e9)  return `${(val / 1e9).toFixed(1)}B`;
  if (abs >= 1e6)  return `${(val / 1e6).toFixed(0)}M`;
  if (abs >= 1e3)  return `${(val / 1e3).toFixed(0)}K`;
  return val.toFixed(0);
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--c-elevated)",
      border: "1px solid var(--c-border-md)",
      borderRadius: 10,
      padding: "10px 14px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
      fontSize: 12,
    }}>
      <p style={{ color: "var(--c-muted)", marginBottom: 6, fontWeight: 600 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.fill || "var(--c-text)", marginBottom: 2, fontWeight: 600 }}>
          {p.name}: SAR {fmt(Number(p.value))}
        </p>
      ))}
    </div>
  );
}

export default function FinancialChart({ data }: Props) {
  if (!data || data.length === 0) return null;

  const sorted = [...data]
    .sort((a, b) => a.year !== b.year ? a.year - b.year : a.period.localeCompare(b.period))
    .map(d => ({
      label: `${d.period !== "annual" ? d.period.toUpperCase() + " " : ""}${d.year}`,
      revenue:   d.revenue,
      netIncome: d.net_income,
    }));

  // Filter to only rows that have actual data
  const revenueData   = sorted.filter(d => d.revenue != null && d.revenue !== 0);
  const netIncomeData = sorted.filter(d => d.netIncome != null);

  // Check if we have enough meaningful data
  const hasRevenue   = revenueData.length >= 2;
  const hasNetIncome = netIncomeData.length >= 2;

  if (!hasRevenue && !hasNetIncome) {
    return (
      <div style={{ textAlign: "center", padding: "24px 16px" }}>
        <p style={{ color: "var(--c-dim)", fontSize: 13 }}>
          Not enough financial data to show trends. Data is being collected.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* Revenue trend */}
      {hasRevenue && (
        <div>
          <p style={{ fontSize: 11, color: "var(--c-muted)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>
            Revenue Trend (SAR)
          </p>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={revenueData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "var(--c-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "var(--c-muted)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmt} width={52} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(200,169,81,0.06)" }} />
              <Bar dataKey="revenue" name="Revenue" radius={[5, 5, 0, 0]}>
                {revenueData.map((_, i) => (
                  <Cell key={i} fill={i === revenueData.length - 1 ? "rgba(200,169,81,1)" : "rgba(200,169,81,0.38)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Net Income trend */}
      {hasNetIncome && (
        <div>
          <p style={{ fontSize: 11, color: "var(--c-muted)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>
            Net Income Trend (SAR)
          </p>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={netIncomeData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "var(--c-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "var(--c-muted)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmt} width={52} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(14,203,129,0.06)" }} />
              <Bar dataKey="netIncome" name="Net Income" radius={[5, 5, 0, 0]}>
                {netIncomeData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={
                      (entry.netIncome ?? 0) < 0
                        ? i === netIncomeData.length - 1 ? "rgba(246,70,93,1)" : "rgba(246,70,93,0.38)"
                        : i === netIncomeData.length - 1 ? "rgba(14,203,129,1)" : "rgba(14,203,129,0.38)"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
