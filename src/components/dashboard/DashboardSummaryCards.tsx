"use client";

import {
  Briefcase,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Coins,
  AlertTriangle,
} from "lucide-react";

interface SummaryData {
  totalValue: number;
  totalCost: number;
  totalGain: number;
  totalGainPct: number;
  todayGainAmount: number;
  todayGainPct: number;
  annualDividendEst: number;
  alertCount: number;
  holdingsCount: number;
  sar: string;
  locale: string;
}

const labels: Record<string, { en: string; ar: string }> = {
  portfolioValue: { en: "Portfolio Value", ar: "قيمة المحفظة" },
  todayChange: { en: "Today's Change", ar: "تغيير اليوم" },
  totalReturn: { en: "Total Return", ar: "العائد الكلي" },
  divIncome: { en: "Dividend Income (Est.)", ar: "دخل التوزيعات (تقدير)" },
  alerts: { en: "Alerts", ar: "تنبيهات" },
  perYear: { en: "/yr", ar: "/سنة" },
  invested: { en: "Invested", ar: "المستثمر" },
  holdings: { en: "holdings", ar: "سهم" },
  noAlerts: { en: "All clear", ar: "لا تنبيهات" },
};

function l(locale: string, key: string) {
  const entry = labels[key];
  return entry ? (locale === "ar" ? entry.ar : entry.en) : key;
}

function fmtCurrency(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
  return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export default function DashboardSummaryCards({
  totalValue,
  totalCost,
  totalGain,
  totalGainPct,
  todayGainAmount,
  todayGainPct,
  annualDividendEst,
  alertCount,
  holdingsCount,
  sar,
  locale,
}: SummaryData) {
  const cards = [
    {
      icon: Briefcase,
      iconColor: "var(--c-gold)",
      label: l(locale, "portfolioValue"),
      value: `${sar} ${fmtCurrency(totalValue)}`,
      valueColor: "var(--c-text)",
      sub: `${holdingsCount} ${l(locale, "holdings")} · ${l(locale, "invested")} ${sar} ${fmtCurrency(totalCost)}`,
      subColor: "var(--c-muted)",
    },
    {
      icon: todayGainPct >= 0 ? ArrowUpRight : ArrowDownRight,
      iconColor: todayGainPct >= 0 ? "var(--c-green)" : "var(--c-red)",
      label: l(locale, "todayChange"),
      value: `${todayGainPct >= 0 ? "+" : ""}${todayGainPct.toFixed(2)}%`,
      valueColor: todayGainPct >= 0 ? "var(--c-green)" : "var(--c-red)",
      sub: `${todayGainAmount >= 0 ? "+" : ""}${sar} ${fmtCurrency(Math.abs(todayGainAmount))}`,
      subColor: todayGainPct >= 0 ? "var(--c-green)" : "var(--c-red)",
    },
    {
      icon: totalGain >= 0 ? TrendingUp : TrendingDown,
      iconColor: totalGain >= 0 ? "var(--c-green)" : "var(--c-red)",
      label: l(locale, "totalReturn"),
      value: `${totalGainPct >= 0 ? "+" : ""}${totalGainPct.toFixed(1)}%`,
      valueColor: totalGain >= 0 ? "var(--c-green)" : "var(--c-red)",
      sub: `${totalGain >= 0 ? "+" : ""}${sar} ${fmtCurrency(Math.abs(totalGain))}`,
      subColor: totalGain >= 0 ? "var(--c-green)" : "var(--c-red)",
    },
    {
      icon: Coins,
      iconColor: "var(--c-gold)",
      label: l(locale, "divIncome"),
      value: `${sar} ${fmtCurrency(annualDividendEst)}`,
      valueColor: annualDividendEst > 0 ? "var(--c-gold)" : "var(--c-dim)",
      sub: annualDividendEst > 0
        ? `${((annualDividendEst / totalValue) * 100).toFixed(1)}% ${l(locale, "perYear")}`
        : "—",
      subColor: "var(--c-muted)",
    },
    {
      icon: AlertTriangle,
      iconColor: alertCount > 0 ? "var(--c-red)" : "var(--c-green)",
      label: l(locale, "alerts"),
      value: alertCount > 0 ? String(alertCount) : l(locale, "noAlerts"),
      valueColor: alertCount > 0 ? "var(--c-red)" : "var(--c-green)",
      sub: "",
      subColor: "var(--c-dim)",
    },
  ];

  return (
    <div
      className="stagger"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        gap: 12,
        marginBottom: 20,
      }}
    >
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div key={i} className="stat-card" style={{ padding: "16px 18px" }}>
            <div className="flex items-center gap-2 mb-2">
              <Icon size={13} style={{ color: card.iconColor }} />
              <span className="metric-label">{card.label}</span>
            </div>
            <span
              className="font-num font-bold"
              style={{ fontSize: 20, color: card.valueColor, lineHeight: 1.2 }}
            >
              {card.value}
            </span>
            {card.sub && (
              <p
                className="font-num"
                style={{ fontSize: 11, color: card.subColor, marginTop: 4 }}
              >
                {card.sub}
              </p>
            )}
          </div>
        );
      })}

      {/* Responsive: collapse to 2 cols on mobile via CSS media query */}
      <style>{`
        @media (max-width: 900px) {
          .stagger { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 480px) {
          .stagger { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
