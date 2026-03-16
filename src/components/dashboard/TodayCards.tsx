"use client";

import Link from "next/link";
import { AlertTriangle, Sparkles, Calendar, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";

export interface TodayCardsData {
  alertCount: number;
  alertLine: { en: string; ar: string };
  newMatches: number;
  matchesLine: { en: string; ar: string };
  nextDividend: { ticker: string; date: string; amount: number } | null;
  biggestMover: { ticker: string; name: string; change: number } | null;
  sar: string;
}

interface TodayCardsProps {
  data: TodayCardsData;
  locale: string;
}

export default function TodayCards({ data, locale }: TodayCardsProps) {
  const isAr = locale === "ar";
  const d = data;

  const cards = [
    {
      icon: AlertTriangle,
      color: d.alertCount > 0 ? "var(--c-red)" : "var(--c-green)",
      bg: d.alertCount > 0 ? "rgba(239,68,68,0.07)" : "rgba(34,197,94,0.07)",
      label: isAr ? "تنبيهات اليوم" : "Alerts today",
      value: d.alertCount > 0 ? String(d.alertCount) : (isAr ? "لا شيء" : "None"),
      line: isAr ? d.alertLine.ar : d.alertLine.en,
      cta: isAr ? "مراجعة التنبيهات" : "Review alerts",
      href: null as string | null,
    },
    {
      icon: Sparkles,
      color: d.newMatches > 0 ? "var(--c-gold)" : "var(--c-dim)",
      bg: d.newMatches > 0 ? "rgba(200,169,81,0.07)" : "rgba(107,114,128,0.05)",
      label: isAr ? "فرص جديدة" : "New matches",
      value: String(d.newMatches),
      line: isAr ? d.matchesLine.ar : d.matchesLine.en,
      cta: isAr ? "عرض الفرص" : "See matches",
      href: null,
    },
    {
      icon: Calendar,
      color: d.nextDividend ? "var(--c-gold)" : "var(--c-dim)",
      bg: d.nextDividend ? "rgba(200,169,81,0.07)" : "rgba(107,114,128,0.05)",
      label: isAr ? "التوزيع التالي" : "Next dividend",
      value: d.nextDividend ? d.nextDividend.ticker : "—",
      line: d.nextDividend
        ? `${d.sar} ${d.nextDividend.amount.toFixed(2)} · ${d.nextDividend.date}`
        : (isAr ? "لا توزيعات قادمة" : "None upcoming"),
      cta: d.nextDividend ? (isAr ? "تفاصيل التوزيعات" : "Open dividend details") : "",
      href: d.nextDividend ? `/${locale}/stock/${d.nextDividend.ticker}` : null,
    },
    {
      icon: d.biggestMover && d.biggestMover.change >= 0 ? TrendingUp : TrendingDown,
      color: d.biggestMover ? (d.biggestMover.change >= 0 ? "var(--c-green)" : "var(--c-red)") : "var(--c-dim)",
      bg: d.biggestMover
        ? (d.biggestMover.change >= 0 ? "rgba(34,197,94,0.07)" : "rgba(239,68,68,0.07)")
        : "rgba(107,114,128,0.05)",
      label: isAr ? "أكبر حركة" : "Biggest mover",
      value: d.biggestMover
        ? `${d.biggestMover.change >= 0 ? "+" : ""}${d.biggestMover.change.toFixed(1)}%`
        : "—",
      line: d.biggestMover
        ? `${d.biggestMover.name} ${isAr ? "قاد محفظتك اليوم" : "led your portfolio today"}`
        : "",
      cta: d.biggestMover ? (isAr ? "عرض السهم" : "View stock") : "",
      href: d.biggestMover ? `/${locale}/stock/${d.biggestMover.ticker}` : null,
    },
  ];

  return (
    <div className="today-cards-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
      {cards.map((card, i) => {
        const Icon = card.icon;
        const inner = (
          <div
            style={{
              padding: "14px 16px",
              borderRadius: 10,
              background: card.bg,
              border: `1px solid ${card.color}12`,
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon size={12} style={{ color: card.color }} />
              <span style={{ fontSize: 9, fontWeight: 700, color: "var(--c-dim)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {card.label}
              </span>
            </div>
            <div className="font-num font-bold" style={{ fontSize: 18, color: card.color, lineHeight: 1.2 }}>
              {card.value}
            </div>
            {card.line && (
              <p style={{ fontSize: 10, color: "var(--c-muted)", marginTop: 4, lineHeight: 1.4, flex: 1 }}>
                {card.line}
              </p>
            )}
            {card.cta && (
              <div className="flex items-center gap-1" style={{ marginTop: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: card.color, opacity: 0.85 }}>{card.cta}</span>
                <ArrowRight size={9} style={{ color: card.color, opacity: 0.6 }} />
              </div>
            )}
          </div>
        );

        if (card.href) {
          return <Link key={i} href={card.href} style={{ textDecoration: "none", color: "inherit" }}>{inner}</Link>;
        }
        return <div key={i}>{inner}</div>;
      })}

      <style>{`
        @media (max-width: 700px) { .today-cards-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 400px) { .today-cards-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
