"use client";

import { TrendingUp, TrendingDown, Minus, Shield, Sparkles } from "lucide-react";
import { scoreVerdict } from "@/lib/format";

interface VerdictHeaderProps {
  overallScore: number;
  valuePillars: {
    value: number;
    growth: number;
    performance: number;
    health: number;
    dividend: number;
  };
  insightBadges: string[];
  riskFlags: string[];
  locale: string;
}

const badgeLabels: Record<string, { en: string; ar: string }> = {
  undervalued: { en: "Undervalued", ar: "مخفّض" },
  overvalued: { en: "Overvalued", ar: "مرتفع" },
  dividend_champion: { en: "Dividend Champion", ar: "بطل التوزيعات" },
  high_growth: { en: "High Growth", ar: "نمو عالي" },
  low_debt: { en: "Low Debt", ar: "ديون منخفضة" },
  shariah_compliant: { en: "Shariah Compliant", ar: "متوافق مع الشريعة" },
  momentum_up: { en: "Strong Momentum", ar: "زخم قوي" },
  high_yield: { en: "High Yield", ar: "عائد عالي" },
};

const riskLabels: Record<string, { en: string; ar: string }> = {
  high_debt: { en: "High Debt", ar: "ديون عالية" },
  declining_revenue: { en: "Declining Revenue", ar: "إيرادات متراجعة" },
  negative_earnings: { en: "Negative Earnings", ar: "أرباح سالبة" },
  low_liquidity: { en: "Low Liquidity", ar: "سيولة منخفضة" },
  overvalued: { en: "Overvalued", ar: "مرتفع القيمة" },
  no_dividend: { en: "No Dividend", ar: "بدون توزيعات" },
  volatile: { en: "High Volatility", ar: "تقلبات عالية" },
};

export default function VerdictHeader({
  overallScore,
  valuePillars,
  insightBadges,
  riskFlags,
  locale,
}: VerdictHeaderProps) {
  const isAr = locale === "ar";
  const verdict = scoreVerdict(overallScore, locale);

  const pillars = [
    { key: "value", score: valuePillars.value, label: isAr ? "القيمة" : "Value", color: "#C8A951" },
    { key: "growth", score: valuePillars.growth, label: isAr ? "النمو" : "Growth", color: "#0ECB81" },
    { key: "perf", score: valuePillars.performance, label: isAr ? "الأداء" : "Performance", color: "#60A5FA" },
    { key: "health", score: valuePillars.health, label: isAr ? "الصحة" : "Health", color: "#A78BFA" },
    { key: "div", score: valuePillars.dividend, label: isAr ? "التوزيعات" : "Dividends", color: "#F59E0B" },
  ];

  return (
    <div className="card" style={{ padding: "24px 28px", marginBottom: 16 }}>
      {/* Score + Verdict */}
      <div className="flex items-center gap-5 mb-4">
        {/* Big score circle */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: `conic-gradient(${verdict.color} ${overallScore * 3.6}deg, var(--c-border) 0deg)`,
            position: "relative",
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              background: "var(--c-surface)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
            }}
          >
            <span
              className="font-num font-bold"
              style={{ fontSize: 22, color: verdict.color, lineHeight: 1 }}
            >
              {Math.round(overallScore)}
            </span>
            <span style={{ fontSize: 8, color: "var(--c-dim)" }}>/100</span>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div className="flex items-center gap-2 mb-1">
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "3px 10px",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 700,
                background: verdict.bg,
                color: verdict.color,
                border: `1px solid ${verdict.ring}`,
              }}
            >
              {overallScore >= 60 ? (
                <TrendingUp size={12} />
              ) : overallScore >= 40 ? (
                <Minus size={12} />
              ) : (
                <TrendingDown size={12} />
              )}
              {verdict.label}
            </span>
            <span style={{ fontSize: 11, color: "var(--c-dim)" }}>
              {isAr ? "تقييم سوقAI" : "SŪQAI Score"}
            </span>
          </div>

          {/* Pillar mini-bars */}
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            {pillars.map((p) => (
              <div key={p.key} style={{ flex: 1 }}>
                <div className="flex items-center justify-between" style={{ marginBottom: 3 }}>
                  <span style={{ fontSize: 9, color: "var(--c-dim)", fontWeight: 600 }}>
                    {p.label}
                  </span>
                  <span
                    className="font-num"
                    style={{ fontSize: 9, color: p.color, fontWeight: 700 }}
                  >
                    {p.score.toFixed(1)}
                  </span>
                </div>
                <div
                  style={{
                    height: 3,
                    borderRadius: 2,
                    background: "var(--c-border)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${(p.score / 5) * 100}%`,
                      height: "100%",
                      background: p.color,
                      borderRadius: 2,
                      transition: "width 0.5s ease-out",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Badges row */}
      {(insightBadges.length > 0 || riskFlags.length > 0) && (
        <div className="flex flex-wrap gap-2" style={{ marginTop: 4 }}>
          {insightBadges.map((badge) => {
            const label = badgeLabels[badge];
            return (
              <span
                key={badge}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  padding: "2px 8px",
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 600,
                  background: "var(--c-gold-dim)",
                  color: "var(--c-gold)",
                  border: "1px solid var(--c-gold-ring)",
                }}
              >
                <Sparkles size={9} />
                {label ? (isAr ? label.ar : label.en) : badge}
              </span>
            );
          })}
          {riskFlags.map((flag) => {
            const label = riskLabels[flag];
            return (
              <span
                key={flag}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  padding: "2px 8px",
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 600,
                  background: "var(--c-red-bg)",
                  color: "var(--c-red)",
                  border: "1px solid var(--c-red-ring)",
                }}
              >
                <Shield size={9} />
                {label ? (isAr ? label.ar : label.en) : flag}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
