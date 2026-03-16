"use client";

import Link from "next/link";
import { TrendingUp, TrendingDown, Sparkles, ShieldCheck, Search } from "lucide-react";

export interface HeroData {
  portfolioValue: number;
  dailyChange: number;
  dailyChangeAmount: number;
  totalReturn: number;
  totalReturnAmount: number;
  weightedScore: number | null;
  healthLabel: { en: string; ar: string };
  healthColor: string;
  summaryLine: { en: string; ar: string };
  holdingsCount: number;
  sar: string;
  // NEW: action-oriented additions
  primaryCta?: { label: { en: string; ar: string }; href: string };
  secondaryCta?: { label: { en: string; ar: string }; href: string };
}

interface HeroStripProps {
  data: HeroData;
  locale: string;
}

function fmtCurrency(value: number, sar: string): string {
  const abs = Math.abs(value);
  if (abs >= 1e6) return `${sar} ${(value / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sar} ${(value / 1e3).toFixed(0)}K`;
  return `${sar} ${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function scoreColor(s: number): string {
  if (s >= 75) return "var(--c-green)";
  if (s >= 55) return "var(--c-gold)";
  if (s >= 35) return "var(--c-text)";
  return "var(--c-red)";
}

export default function HeroStrip({ data, locale }: HeroStripProps) {
  const isAr = locale === "ar";
  const d = data;
  const up = d.dailyChange >= 0;
  const totalUp = d.totalReturn >= 0;

  const primaryHref = d.primaryCta?.href || `/${locale}/portfolio`;
  const primaryLabel = d.primaryCta?.label || { en: "Review risks", ar: "راجع المخاطر" };
  const secondaryHref = d.secondaryCta?.href || `/${locale}/screener`;
  const secondaryLabel = d.secondaryCta?.label || { en: "Explore matches", ar: "استكشف الفرص" };

  return (
    <div
      className="hero-strip"
      style={{
        display: "flex",
        gap: 32,
        padding: "28px 30px",
        borderRadius: 14,
        background: "linear-gradient(135deg, rgba(200,169,81,0.06) 0%, rgba(6,13,24,0.95) 70%)",
        border: "1px solid var(--c-gold-ring)",
        marginBottom: 20,
        flexWrap: "wrap",
      }}
    >
      {/* Left: Greeting + Summary + CTAs */}
      <div style={{ flex: "1 1 300px", minWidth: 0 }}>
        <p
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "var(--c-text)",
            marginBottom: 6,
            fontFamily: "var(--font-grotesk)",
          }}
        >
          {isAr ? "مرحبًا" : "Good morning"}
        </p>
        <p
          style={{
            fontSize: 12,
            color: "var(--c-muted)",
            marginBottom: 20,
            lineHeight: 1.6,
            maxWidth: 380,
          }}
        >
          {isAr ? d.summaryLine.ar : d.summaryLine.en}
        </p>

        <div className="flex items-center gap-3" style={{ flexWrap: "wrap" }}>
          <Link
            href={primaryHref}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "9px 18px",
              borderRadius: 8,
              background: "var(--c-gold-dim)",
              border: "1px solid var(--c-gold-ring)",
              color: "var(--c-gold)",
              fontSize: 11,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            {isAr ? primaryLabel.ar : primaryLabel.en}
          </Link>
          <Link
            href={secondaryHref}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "9px 18px",
              borderRadius: 8,
              background: "var(--c-elevated)",
              border: "1px solid var(--c-border)",
              color: "var(--c-muted)",
              fontSize: 11,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            <Search size={10} />
            {isAr ? secondaryLabel.ar : secondaryLabel.en}
          </Link>
        </div>
      </div>

      {/* Right: Key Metrics */}
      <div style={{ display: "flex", gap: 28, flexWrap: "wrap", alignItems: "flex-start" }}>
        {/* Portfolio Value */}
        <div>
          <span className="hero-label">{isAr ? "قيمة المحفظة" : "Portfolio value"}</span>
          <div
            className="font-num font-bold"
            style={{ fontSize: 28, color: "var(--c-text)", lineHeight: 1.15, marginTop: 4 }}
          >
            {fmtCurrency(d.portfolioValue, d.sar)}
          </div>
        </div>

        {/* Daily Change */}
        <div>
          <span className="hero-label">{isAr ? "اليوم" : "Today"}</span>
          <div className="flex items-center gap-1" style={{ marginTop: 6 }}>
            {up ? (
              <TrendingUp size={13} style={{ color: "var(--c-green)" }} />
            ) : (
              <TrendingDown size={13} style={{ color: "var(--c-red)" }} />
            )}
            <span
              className="font-num font-bold"
              style={{ fontSize: 15, color: up ? "var(--c-green)" : "var(--c-red)" }}
            >
              {up ? "+" : ""}
              {d.dailyChange.toFixed(2)}%
            </span>
          </div>
          <span className="font-num" style={{ fontSize: 10, color: "var(--c-dim)" }}>
            {up ? "+" : ""}
            {fmtCurrency(Math.abs(d.dailyChangeAmount), d.sar)}
          </span>
        </div>

        {/* Total Return */}
        <div>
          <span className="hero-label">{isAr ? "العائد الكلي" : "Total return"}</span>
          <div
            className="font-num font-bold"
            style={{
              fontSize: 15,
              color: totalUp ? "var(--c-green)" : "var(--c-red)",
              marginTop: 6,
            }}
          >
            {totalUp ? "+" : ""}
            {d.totalReturn.toFixed(1)}%
          </div>
          <span className="font-num" style={{ fontSize: 10, color: "var(--c-dim)" }}>
            {totalUp ? "+" : ""}
            {fmtCurrency(Math.abs(d.totalReturnAmount), d.sar)}
          </span>
        </div>

        {/* Weighted Score */}
        {d.weightedScore !== null && (
          <div>
            <span className="hero-label">{isAr ? "تقييم SUQAI" : "SUQAI Score"}</span>
            <div className="flex items-center gap-1.5" style={{ marginTop: 6 }}>
              <Sparkles size={12} style={{ color: scoreColor(d.weightedScore) }} />
              <span
                className="font-num font-bold"
                style={{ fontSize: 17, color: scoreColor(d.weightedScore) }}
              >
                {Math.round(d.weightedScore)}
              </span>
            </div>
          </div>
        )}

        {/* Health Badge */}
        <div>
          <span className="hero-label">{isAr ? "الصحة" : "Health"}</span>
          <div className="flex items-center gap-1.5" style={{ marginTop: 7 }}>
            <ShieldCheck size={12} style={{ color: d.healthColor }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: d.healthColor }}>
              {isAr ? d.healthLabel.ar : d.healthLabel.en}
            </span>
          </div>
        </div>
      </div>

      <style>{`
        .hero-label { font-size: 9px; font-weight: 700; color: var(--c-dim); letter-spacing: 0.07em; text-transform: uppercase; }
        @media (max-width: 700px) { .hero-strip { flex-direction: column !important; gap: 20px !important; } }
      `}</style>
    </div>
  );
}
