"use client";

import { Sun, TrendingUp, TrendingDown, BarChart3, Activity, Calendar } from "lucide-react";

export interface TodayData {
  tasiValue: string;
  tasiChange: string;
  tasiIsPositive: boolean;
  isOpen: boolean;
  advancing: number;
  declining: number;
  unchanged: number;
  tradedValue: string;
  portfolioChange: number;
  portfolioChangeAmount: number;
  upcomingDividends: number;
  alertCount: number;
}

interface TodayAtGlanceProps {
  data: TodayData;
  locale: string;
  sar: string;
}

const labels: Record<string, { en: string; ar: string }> = {
  title: { en: "Today at a Glance", ar: "نظرة اليوم" },
  tasi: { en: "TASI", ar: "تاسي" },
  breadth: { en: "Market Breadth", ar: "اتساع السوق" },
  yourPortfolio: { en: "Your Portfolio", ar: "محفظتك" },
  divDue: { en: "Dividends Due Soon", ar: "توزيعات قريبة" },
  alerts: { en: "Active Alerts", ar: "تنبيهات نشطة" },
  up: { en: "up", ar: "صاعد" },
  down: { en: "down", ar: "هابط" },
  flat: { en: "flat", ar: "مستقر" },
  open: { en: "OPEN", ar: "مفتوح" },
  closed: { en: "CLOSED", ar: "مغلق" },
};

function l(locale: string, key: string) {
  return locale === "ar" ? labels[key]?.ar ?? key : labels[key]?.en ?? key;
}

export default function TodayAtGlance({ data, locale, sar }: TodayAtGlanceProps) {
  const isAr = locale === "ar";

  const items = [
    {
      icon: BarChart3,
      label: l(locale, "tasi"),
      value: data.tasiValue,
      sub: data.tasiChange,
      subColor: data.tasiIsPositive ? "var(--c-green)" : "var(--c-red)",
      badge: data.isOpen ? l(locale, "open") : l(locale, "closed"),
      badgeBg: data.isOpen ? "rgba(34,197,94,0.12)" : "rgba(107,114,128,0.12)",
      badgeColor: data.isOpen ? "var(--c-green)" : "var(--c-dim)",
    },
    {
      icon: Activity,
      label: l(locale, "breadth"),
      value: `${data.advancing}`,
      sub: `${l(locale, "up")} · ${data.declining} ${l(locale, "down")} · ${data.unchanged} ${l(locale, "flat")}`,
      subColor: "var(--c-muted)",
      badge: null,
      badgeBg: "",
      badgeColor: "",
    },
    {
      icon: data.portfolioChange >= 0 ? TrendingUp : TrendingDown,
      label: l(locale, "yourPortfolio"),
      value: `${data.portfolioChange >= 0 ? "+" : ""}${data.portfolioChange.toFixed(2)}%`,
      sub: `${data.portfolioChangeAmount >= 0 ? "+" : ""}${sar} ${Math.abs(data.portfolioChangeAmount).toLocaleString("en-US", { maximumFractionDigits: 0 })}`,
      subColor: data.portfolioChange >= 0 ? "var(--c-green)" : "var(--c-red)",
      badge: null,
      badgeBg: "",
      badgeColor: "",
    },
    {
      icon: Calendar,
      label: l(locale, "divDue"),
      value: String(data.upcomingDividends),
      sub: "",
      subColor: "var(--c-muted)",
      badge: null,
      badgeBg: "",
      badgeColor: "",
    },
  ];

  return (
    <div
      className="card-gold"
      style={{
        padding: "16px 20px",
        marginBottom: 16,
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Sun size={14} style={{ color: "var(--c-gold)" }} />
        <h3 className="font-bold" style={{ fontSize: 13, color: "var(--c-text)" }}>
          {l(locale, "title")}
        </h3>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} style={{ minWidth: 0 }}>
              <div className="flex items-center gap-1.5 mb-1">
                <Icon size={11} style={{ color: "var(--c-muted)", opacity: 0.7 }} />
                <span style={{ fontSize: 9, fontWeight: 700, color: "var(--c-dim)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  {item.label}
                </span>
                {item.badge && (
                  <span style={{ fontSize: 7, fontWeight: 700, padding: "1px 5px", borderRadius: 3, background: item.badgeBg, color: item.badgeColor }}>
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="font-num font-bold" style={{ fontSize: 16, color: "var(--c-text)", lineHeight: 1.2 }}>
                {item.value}
              </span>
              {item.sub && (
                <p className="font-num" style={{ fontSize: 10, color: item.subColor, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.sub}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Responsive */}
      <style>{`
        @media (max-width: 700px) {
          .card-gold > div:last-of-type { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}
