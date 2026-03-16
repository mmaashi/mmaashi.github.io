"use client";

import Link from "next/link";
import { Sparkles, TrendingUp, DollarSign, ShieldCheck } from "lucide-react";

export interface Opportunity {
  ticker: string;
  name: string;
  price: number;
  score: number;
  reason: { en: string; ar: string };
  tag: "undervalued" | "high_quality" | "dividend_leader" | "momentum";
}

interface OpportunitiesModuleProps {
  opportunities: Opportunity[];
  locale: string;
  sar: string;
}

const labels: Record<string, { en: string; ar: string }> = {
  title: { en: "Opportunities", ar: "فرص استثمارية" },
  subtitle: { en: "AI-detected based on SŪQAI Score analysis", ar: "مكتشفة بالذكاء الاصطناعي بناءً على تحليل SŪQAI" },
  empty: { en: "No opportunities flagged right now", ar: "لا توجد فرص مكتشفة حاليًا" },
  undervalued: { en: "Undervalued", ar: "أقل من قيمته" },
  high_quality: { en: "High Quality", ar: "جودة عالية" },
  dividend_leader: { en: "Dividend Leader", ar: "رائد توزيعات" },
  momentum: { en: "Momentum", ar: "زخم إيجابي" },
  view: { en: "View →", ar: "← عرض" },
};

function l(locale: string, key: string) {
  return locale === "ar" ? labels[key]?.ar ?? key : labels[key]?.en ?? key;
}

const tagConfig: Record<string, { icon: typeof Sparkles; color: string; bg: string }> = {
  undervalued: { icon: DollarSign, color: "var(--c-green)", bg: "rgba(34,197,94,0.08)" },
  high_quality: { icon: ShieldCheck, color: "var(--c-gold)", bg: "rgba(200,169,81,0.08)" },
  dividend_leader: { icon: Sparkles, color: "#a78bfa", bg: "rgba(167,139,250,0.08)" },
  momentum: { icon: TrendingUp, color: "#60a5fa", bg: "rgba(96,165,250,0.08)" },
};

export default function OpportunitiesModule({ opportunities, locale, sar }: OpportunitiesModuleProps) {
  const isAr = locale === "ar";

  return (
    <div className="card" style={{ padding: "18px 20px" }}>
      <div className="flex items-center gap-2 mb-1">
        <Sparkles size={14} style={{ color: "var(--c-gold)" }} />
        <h3 className="font-bold" style={{ fontSize: 13, color: "var(--c-text)", flex: 1 }}>
          {l(locale, "title")}
        </h3>
      </div>
      <p style={{ fontSize: 10, color: "var(--c-dim)", marginBottom: 12 }}>{l(locale, "subtitle")}</p>

      {opportunities.length === 0 ? (
        <p style={{ fontSize: 11, color: "var(--c-dim)" }}>{l(locale, "empty")}</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {opportunities.map((o) => {
            const cfg = tagConfig[o.tag] || tagConfig.high_quality;
            const TagIcon = cfg.icon;

            return (
              <Link
                key={o.ticker}
                href={`/${locale}/stock/${o.ticker}`}
                style={{
                  display: "block",
                  padding: "12px 14px",
                  borderRadius: 8,
                  background: cfg.bg,
                  border: `1px solid ${cfg.color}15`,
                  textDecoration: "none",
                  transition: "transform 0.15s",
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <TagIcon size={11} style={{ color: cfg.color }} />
                  <span style={{ fontSize: 9, fontWeight: 700, color: cfg.color, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {l(locale, o.tag)}
                  </span>
                  <span style={{ flex: 1 }} />
                  <div className="flex items-center gap-1">
                    <Sparkles size={9} style={{ color: "var(--c-gold)" }} />
                    <span className="font-num font-bold" style={{ fontSize: 12, color: "var(--c-text)" }}>
                      {Math.round(o.score)}
                    </span>
                  </div>
                </div>

                <div className="flex items-baseline gap-2">
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--c-text)" }}>{o.ticker}</span>
                  <span style={{ fontSize: 10, color: "var(--c-muted)" }}>{o.name}</span>
                  <span style={{ flex: 1 }} />
                  <span className="font-num font-semibold" style={{ fontSize: 12, color: "var(--c-text)" }}>
                    {sar} {o.price.toFixed(2)}
                  </span>
                </div>

                <p style={{ fontSize: 10, color: "var(--c-muted)", marginTop: 4, lineHeight: 1.4 }}>
                  {isAr ? o.reason.ar : o.reason.en}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
