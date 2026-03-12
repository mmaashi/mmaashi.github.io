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
  gross_profit?: number | null;
  operating_income?: number | null;
}

interface Props {
  data: FinancialPoint[];
  locale?: string;
}

function fmt(val: number): string {
  const abs = Math.abs(val);
  if (abs >= 1e12) return `${(val / 1e12).toFixed(1)}T`;
  if (abs >= 1e9)  return `${(val / 1e9).toFixed(1)}B`;
  if (abs >= 1e6)  return `${(val / 1e6).toFixed(0)}M`;
  if (abs >= 1e3)  return `${(val / 1e3).toFixed(0)}K`;
  return val.toFixed(0);
}

function fmtFull(val: number): string {
  const abs = Math.abs(val);
  if (abs >= 1e12) return `${(val / 1e12).toFixed(2)}T`;
  if (abs >= 1e9)  return `${(val / 1e9).toFixed(2)}B`;
  if (abs >= 1e6)  return `${(val / 1e6).toFixed(1)}M`;
  if (abs >= 1e3)  return `${(val / 1e3).toFixed(1)}K`;
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
          {p.name}: SAR {fmtFull(Number(p.value))}
        </p>
      ))}
    </div>
  );
}

interface ChartSectionProps {
  title: string;
  data: Array<Record<string, any>>;
  dataKey: string;
  name: string;
  color: string;
  negColor?: string;
  height?: number;
}

function ChartSection({ title, data, dataKey, name, color, negColor, height = 170 }: ChartSectionProps) {
  return (
    <div>
      <p style={{ fontSize: 11, color: "var(--c-muted)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>
        {title}
      </p>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "var(--c-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "var(--c-muted)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmt} width={52} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: `${color}11` }} />
          <Bar dataKey={dataKey} name={name} radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => {
              const val = entry[dataKey] ?? 0;
              const isLast = i === data.length - 1;
              let fill: string;
              if (negColor && val < 0) {
                fill = isLast ? negColor : `${negColor}60`;
              } else {
                fill = isLast ? color : `${color}60`;
              }
              return <Cell key={i} fill={fill} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function FinancialChart({ data, locale = "en" }: Props) {
  if (!data || data.length === 0) return null;

  const isAr = locale === "ar";

  const sorted = [...data]
    .sort((a, b) => a.year !== b.year ? a.year - b.year : a.period.localeCompare(b.period))
    .map(d => ({
      label: `${d.period !== "annual" ? d.period.toUpperCase() + " " : ""}${d.year}`,
      revenue:     d.revenue,
      netIncome:   d.net_income,
      grossProfit: d.gross_profit ?? null,
      opIncome:    d.operating_income ?? null,
    }));

  const revenueData   = sorted.filter(d => d.revenue != null && d.revenue !== 0);
  const netIncomeData = sorted.filter(d => d.netIncome != null);
  const gpData        = sorted.filter(d => d.grossProfit != null && d.grossProfit !== 0);
  const opData        = sorted.filter(d => d.opIncome != null && d.opIncome !== 0);

  const hasRevenue   = revenueData.length >= 2;
  const hasNetIncome = netIncomeData.length >= 2;
  const hasGP        = gpData.length >= 2;
  const hasOp        = opData.length >= 2;

  if (!hasRevenue && !hasNetIncome) {
    return (
      <div style={{ textAlign: "center", padding: "24px 16px" }}>
        <p style={{ color: "var(--c-dim)", fontSize: 13 }}>
          {isAr
            ? "لا توجد بيانات مالية كافية لعرض الاتجاهات. جارٍ جمع البيانات."
            : "Not enough financial data to show trends. Data is being collected."}
        </p>
      </div>
    );
  }

  const gold  = "rgba(200,169,81,1)";
  const green = "rgba(14,203,129,1)";
  const red   = "rgba(246,70,93,1)";
  const blue  = "rgba(100,149,237,1)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {hasRevenue && (
        <ChartSection
          title={isAr ? "اتجاه الإيرادات (ر.س)" : "Revenue Trend (SAR)"}
          data={revenueData}
          dataKey="revenue"
          name={isAr ? "الإيرادات" : "Revenue"}
          color={gold}
        />
      )}

      {hasGP && (
        <ChartSection
          title={isAr ? "إجمالي الربح (ر.س)" : "Gross Profit Trend (SAR)"}
          data={gpData}
          dataKey="grossProfit"
          name={isAr ? "إجمالي الربح" : "Gross Profit"}
          color={blue}
          negColor={red}
        />
      )}

      {hasOp && (
        <ChartSection
          title={isAr ? "الدخل التشغيلي (ر.س)" : "Operating Income Trend (SAR)"}
          data={opData}
          dataKey="opIncome"
          name={isAr ? "الدخل التشغيلي" : "Operating Income"}
          color={green}
          negColor={red}
        />
      )}

      {hasNetIncome && (
        <ChartSection
          title={isAr ? "اتجاه صافي الدخل (ر.س)" : "Net Income Trend (SAR)"}
          data={netIncomeData}
          dataKey="netIncome"
          name={isAr ? "صافي الدخل" : "Net Income"}
          color={green}
          negColor={red}
        />
      )}
    </div>
  );
}
