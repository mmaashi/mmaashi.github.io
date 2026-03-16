"use client";

import Link from "next/link";
import { Sparkles, TrendingUp, DollarSign, ShieldCheck, Eye, Plus } from "lucide-react";

export interface Opportunity {
  ticker: string;
  name: string;
  price: number;
  score: number;
  matchReason: { en: string; ar: string };
  insight: { en: string; ar: string };
  tag: "undervalued" | "high_quality" | "dividend_leader" | "momentum";
  confidence: "high" | "medium" | "low";
}

interface OpportunitiesModuleProps {
  opportunities: Opportunity[];
  locale: string;
  sar: string;
}

const tagConfig: Record<string, { icon: typeof Sparkles; color: string; bg: string; labelEn: string; labelAr: string }> = {
  undervalued: { icon: DollarSign, color: "var(--c-green)", bg: "rgba(34,197,94,0.06)", labelEn: "Undervalued", labelAr: "أقل من قيمته" },
  high_quality: { icon: ShieldCheck, color: "var(--c-gold)", bg: "rgba(200,169,81,0.06)", labelEn: "High Quality", labelAr: "جودة عالية" },
  dividend_leader: { icon: Sparkles, color: "#a78bfa", bg: "rgba(167,139,250,0.06)", labelEn: "Dividend Idea", labelAr: "فرصة توزيعات" },
  momentum: { icon: TrendingUp, color: "#60a5fa", bg: "rgba(96,165,250,0.06)", labelEn: "Quality + Momentum", labelAr: "جودة + زخم" },
};

const confConfig: Record<string, { color: string; labelEn: string; labelAr: string }> = {
  high: { color: "var(--c-green)", labelEn: "High confidence", labelAr: "ثقة عالية" },
  medium: { color: "var(--c-gold)", labelEn: "Medium confidence", labelAr: "ثقة متوسطة" },
  low: { color: "var(--c-dim)", labelEn: "Low confidence", labelAr: "ثقة منخفضة" },
};

export default function OpportunitiesModule({ opportunities, locale, sar }: OpportunitiesModuleProps) {
  const isAr = locale === "ar";

  return (
    <div style={{ marginBottom: 16 }}>
      <div className="flex items-center gap-2 mb-1">
        <Sparkles size={14} style={{ color: "var(--c-gold)" }} />
        <h3 className="font-bold" style={{ fontSize: 14, color: "var(--c-text)", fontFamily: "var(--font-grotesk)" }}>
          {isAr ? "فرص لك" : "Opportunities for you"}
        </h3>
      </div>
      <p style={{ fontSize: 10, color: "var(--c-dim)", marginBottom: 12 }}>
        {isAr ? "أفكار مطابقة لأسلوبك ومحفظتك وفلاترك المحفوظة" : "Ideas matched to your style, watchlist, and saved screens"}
      </p>

      {opportunities.length === 0 ? (
        <div className="card" style={{ padding: "24px", textAlign: "center" }}>
          <p style={{ fontSize: 11, color: "var(--c-dim)" }}>{isAr ? "لا توجد فرص حاليًا" : "No opportunities right now"}</p>
        </div>
      ) : (
        <div className="opp-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
          {opportunities.map((o) => {
            const cfg = tagConfig[o.tag] || tagConfig.high_quality;
            const conf = confConfig[o.confidence] || confConfig.medium;
            const TagIcon = cfg.icon;

            return (
              <div
                key={o.ticker}
                className="card"
                style={{ padding: "16px 18px", background: cfg.bg, border: `1px solid ${cfg.color}12` }}
              >
                {/* Tag + Confidence */}
                <div className="flex items-center gap-2 mb-2">
                  <TagIcon size={10} style={{ color: cfg.color }} />
                  <span style={{ fontSize: 9, fontWeight: 700, color: cfg.color, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    {isAr ? cfg.labelAr : cfg.labelEn}
                  </span>
                  <span style={{ flex: 1 }} />
                  <span style={{ fontSize: 8, fontWeight: 600, color: conf.color, padding: "2px 6px", borderRadius: 4, background: `${conf.color}12`, border: `1px solid ${conf.color}20` }}>
                    {isAr ? conf.labelAr : conf.labelEn}
                  </span>
                </div>

                {/* Stock name + price */}
                <div className="flex items-baseline gap-2 mb-1">
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--c-text)" }}>{o.ticker}</span>
                  <span style={{ fontSize: 10, color: "var(--c-muted)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.name}</span>
                  <span className="font-num font-semibold" style={{ fontSize: 11, color: "var(--c-text)" }}>{sar} {o.price.toFixed(2)}</span>
                </div>

                {/* Match reason */}
                <p style={{ fontSize: 10, color: cfg.color, marginBottom: 3, fontWeight: 600 }}>
                  {isAr ? o.matchReason.ar : o.matchReason.en}
                </p>

                {/* One-line insight */}
                <p style={{ fontSize: 10, color: "var(--c-muted)", lineHeight: 1.45, marginBottom: 10 }}>
                  {isAr ? o.insight.ar : o.insight.en}
                </p>

                {/* CTAs */}
                <div className="flex items-center gap-3">
                  <Link
                    href={`/${locale}/stock/${o.ticker}`}
                    style={{ fontSize: 10, fontWeight: 600, color: cfg.color, textDecoration: "none" }}
                  >
                    {isAr ? "افتح السهم" : "Open stock"}
                  </Link>
                  <button
                    style={{ fontSize: 10, fontWeight: 600, color: "var(--c-dim)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}
                  >
                    <Eye size={9} />
                    {isAr ? "أضف للمتابعة" : "Add to watchlist"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @media (max-width: 700px) { .opp-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
