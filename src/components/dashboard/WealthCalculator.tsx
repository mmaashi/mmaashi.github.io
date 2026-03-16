"use client";

import { useState, useMemo } from "react";
import { Calculator, TrendingUp } from "lucide-react";

interface WealthCalculatorProps {
  locale: string;
  sar: string;
}

const labels: Record<string, { en: string; ar: string }> = {
  title: { en: "Wealth Calculator", ar: "حاسبة الثروة" },
  subtitle: { en: "Project your investment growth", ar: "توقّع نمو استثمارك" },
  initial: { en: "Initial Investment", ar: "المبلغ الأولي" },
  monthly: { en: "Monthly Addition", ar: "الإضافة الشهرية" },
  years: { en: "Investment Period (years)", ar: "مدة الاستثمار (سنوات)" },
  returnRate: { en: "Expected Annual Return", ar: "العائد السنوي المتوقع" },
  result: { en: "Projected Value", ar: "القيمة المتوقعة" },
  totalInvested: { en: "Total Invested", ar: "إجمالي المستثمر" },
  totalGrowth: { en: "Growth", ar: "النمو" },
  divReinvest: { en: "Includes dividend reinvestment", ar: "يشمل إعادة استثمار التوزيعات" },
  disclaimer: { en: "For illustration only — not a guarantee of returns", ar: "للتوضيح فقط — لا يعد ضمانًا للعوائد" },
};

function l(locale: string, key: string) {
  return locale === "ar" ? labels[key]?.ar ?? key : labels[key]?.en ?? key;
}

function fmtCurrency(val: number, sar: string): string {
  const abs = Math.abs(val);
  if (abs >= 1e6) return `${sar} ${(val / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sar} ${(val / 1e3).toFixed(0)}K`;
  return `${sar} ${val.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export default function WealthCalculator({ locale, sar }: WealthCalculatorProps) {
  const [initial, setInitial] = useState(50000);
  const [monthly, setMonthly] = useState(2000);
  const [years, setYears] = useState(10);
  const [rate, setRate] = useState(8);

  const result = useMemo(() => {
    const r = rate / 100;
    const monthlyRate = r / 12;
    const months = years * 12;
    let balance = initial;
    for (let i = 0; i < months; i++) {
      balance = balance * (1 + monthlyRate) + monthly;
    }
    const totalInvested = initial + monthly * months;
    const growth = balance - totalInvested;
    return { balance, totalInvested, growth };
  }, [initial, monthly, years, rate]);

  const sliderStyle = {
    width: "100%",
    height: 4,
    borderRadius: 2,
    appearance: "none" as const,
    background: "var(--c-border)",
    outline: "none",
    cursor: "pointer",
  };

  return (
    <div className="card" style={{ padding: "18px 20px" }}>
      <div className="flex items-center gap-2 mb-1">
        <Calculator size={14} style={{ color: "var(--c-gold)" }} />
        <h3 className="font-bold" style={{ fontSize: 13, color: "var(--c-text)", flex: 1 }}>
          {l(locale, "title")}
        </h3>
      </div>
      <p style={{ fontSize: 10, color: "var(--c-dim)", marginBottom: 14 }}>{l(locale, "subtitle")}</p>

      {/* Sliders */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Initial Investment */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span style={{ fontSize: 10, color: "var(--c-muted)", fontWeight: 600 }}>{l(locale, "initial")}</span>
            <span className="font-num font-bold" style={{ fontSize: 12, color: "var(--c-text)" }}>
              {fmtCurrency(initial, sar)}
            </span>
          </div>
          <input
            type="range"
            min={1000}
            max={500000}
            step={1000}
            value={initial}
            onChange={(e) => setInitial(Number(e.target.value))}
            style={sliderStyle}
          />
        </div>

        {/* Monthly Addition */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span style={{ fontSize: 10, color: "var(--c-muted)", fontWeight: 600 }}>{l(locale, "monthly")}</span>
            <span className="font-num font-bold" style={{ fontSize: 12, color: "var(--c-text)" }}>
              {fmtCurrency(monthly, sar)}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={20000}
            step={100}
            value={monthly}
            onChange={(e) => setMonthly(Number(e.target.value))}
            style={sliderStyle}
          />
        </div>

        {/* Years */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span style={{ fontSize: 10, color: "var(--c-muted)", fontWeight: 600 }}>{l(locale, "years")}</span>
            <span className="font-num font-bold" style={{ fontSize: 12, color: "var(--c-text)" }}>
              {years}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={30}
            step={1}
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            style={sliderStyle}
          />
        </div>

        {/* Return Rate */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span style={{ fontSize: 10, color: "var(--c-muted)", fontWeight: 600 }}>{l(locale, "returnRate")}</span>
            <span className="font-num font-bold" style={{ fontSize: 12, color: "var(--c-gold)" }}>
              {rate}%
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={20}
            step={0.5}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            style={sliderStyle}
          />
        </div>
      </div>

      {/* Result */}
      <div
        style={{
          marginTop: 16,
          padding: "14px 16px",
          borderRadius: 10,
          background: "var(--c-gold-dim)",
          border: "1px solid var(--c-gold-ring)",
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp size={12} style={{ color: "var(--c-gold)" }} />
          <span style={{ fontSize: 9, fontWeight: 700, color: "var(--c-gold)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {l(locale, "result")}
          </span>
        </div>
        <span className="font-num font-bold" style={{ fontSize: 22, color: "var(--c-text)", lineHeight: 1.2 }}>
          {fmtCurrency(result.balance, sar)}
        </span>
        <div className="flex items-center gap-4 mt-2">
          <div>
            <span style={{ fontSize: 9, color: "var(--c-dim)" }}>{l(locale, "totalInvested")}</span>
            <p className="font-num font-semibold" style={{ fontSize: 11, color: "var(--c-muted)", margin: 0, marginTop: 1 }}>
              {fmtCurrency(result.totalInvested, sar)}
            </p>
          </div>
          <div>
            <span style={{ fontSize: 9, color: "var(--c-dim)" }}>{l(locale, "totalGrowth")}</span>
            <p className="font-num font-semibold" style={{ fontSize: 11, color: "var(--c-green)", margin: 0, marginTop: 1 }}>
              +{fmtCurrency(result.growth, sar)}
            </p>
          </div>
        </div>
      </div>

      <p style={{ fontSize: 9, color: "var(--c-dim)", marginTop: 8, fontStyle: "italic" }}>
        {l(locale, "disclaimer")}
      </p>

      {/* Custom slider thumb styling */}
      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--c-gold);
          cursor: pointer;
          border: 2px solid var(--c-base);
          box-shadow: 0 0 0 2px var(--c-gold-ring);
        }
        input[type="range"]::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--c-gold);
          cursor: pointer;
          border: 2px solid var(--c-base);
        }
      `}</style>
    </div>
  );
}
