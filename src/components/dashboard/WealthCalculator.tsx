"use client";

import { useState, useMemo } from "react";
import { Calculator, TrendingUp, Target } from "lucide-react";

interface WealthCalculatorProps {
  locale: string;
  sar: string;
  portfolioValue?: number;
}

type Mode = "grow" | "target";

function fmtCurrency(val: number, sar: string): string {
  const abs = Math.abs(val);
  if (abs >= 1e6) return `${sar} ${(val / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sar} ${(val / 1e3).toFixed(0)}K`;
  return `${sar} ${val.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export default function WealthCalculator({ locale, sar, portfolioValue }: WealthCalculatorProps) {
  const isAr = locale === "ar";
  const [mode, setMode] = useState<Mode>("grow");
  const [initial, setInitial] = useState(portfolioValue ?? 50000);
  const [monthly, setMonthly] = useState(5000);
  const [years, setYears] = useState(20);
  const [rate, setRate] = useState(8);
  const [reinvest, setReinvest] = useState(true);
  const [targetAmount, setTargetAmount] = useState(3000000);

  // Presets
  const monthlyPresets = [1000, 5000, 10000];
  const yearPresets = [10, 20, 25];
  const ratePresets = [6, 8, 10];

  // Grow mode: compute future value
  const growResult = useMemo(() => {
    const r = rate / 100;
    const mr = r / 12;
    const months = years * 12;
    let balance = initial;
    const milestones: Array<{ year: number; value: number }> = [];
    const chartData: Array<{ year: number; contributions: number; growth: number; total: number }> = [];

    for (let m = 1; m <= months; m++) {
      balance = balance * (1 + mr) + monthly;
      const yr = Math.floor(m / 12);
      if (m % 12 === 0) {
        const contributed = initial + monthly * m;
        milestones.push({ year: yr, value: balance });
        chartData.push({ year: yr, contributions: contributed, growth: balance - contributed, total: balance });
      }
    }
    const totalContributed = initial + monthly * months;
    return { balance, totalContributed, growth: balance - totalContributed, milestones, chartData };
  }, [initial, monthly, years, rate]);

  // Target mode: compute required monthly
  const targetResult = useMemo(() => {
    const r = rate / 100;
    const mr = r / 12;
    const months = years * 12;
    // Future value of initial
    const fvInitial = initial * Math.pow(1 + mr, months);
    const remaining = targetAmount - fvInitial;
    if (remaining <= 0) return { monthlyNeeded: 0, feasible: true };
    // Monthly payment for annuity
    const factor = (Math.pow(1 + mr, months) - 1) / mr;
    const monthlyNeeded = remaining / factor;
    return { monthlyNeeded: Math.max(0, monthlyNeeded), feasible: monthlyNeeded < 100000 };
  }, [initial, targetAmount, years, rate]);

  // Milestone years to show
  const displayMilestones = growResult.milestones.filter((m) => [5, 10, 15, 20, 25, 30].includes(m.year) && m.year <= years);

  // Chart bars
  const chartBars = growResult.chartData.filter((d) => d.year % (years <= 10 ? 1 : years <= 20 ? 2 : 5) === 0 || d.year === years);
  const maxVal = chartBars.length > 0 ? Math.max(...chartBars.map((d) => d.total)) : 1;

  const sliderStyle = { width: "100%", height: 4, borderRadius: 2, appearance: "none" as const, background: "var(--c-border)", outline: "none", cursor: "pointer" };

  return (
    <div style={{ marginBottom: 16 }}>
      <div className="flex items-center gap-2 mb-1">
        <Calculator size={14} style={{ color: "var(--c-gold)" }} />
        <h3 className="font-bold" style={{ fontSize: 14, color: "var(--c-text)", fontFamily: "var(--font-grotesk)" }}>
          {isAr ? "حاسبة الثروة المستقبلية" : "Future wealth calculator"}
        </h3>
      </div>
      <p style={{ fontSize: 10, color: "var(--c-dim)", marginBottom: 14 }}>
        {isAr ? "شاهد كيف يمكن للاستثمار المنتظم والتراكم طويل المدى أن ينمّي أموالك" : "See how regular investing and long-term compounding could grow your money"}
      </p>

      <div className="calc-layout" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {/* Left: Inputs */}
        <div className="card" style={{ padding: "20px 22px" }}>
          {/* Mode toggle */}
          <div className="flex items-center gap-2 mb-4" style={{ background: "var(--c-base)", borderRadius: 8, padding: 2, border: "1px solid var(--c-border)" }}>
            {(["grow", "target"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="flex items-center gap-1.5"
                style={{
                  flex: 1, padding: "6px 0", borderRadius: 6, fontSize: 10, fontWeight: mode === m ? 700 : 500,
                  color: mode === m ? "var(--c-gold)" : "var(--c-muted)",
                  background: mode === m ? "var(--c-gold-dim)" : "transparent",
                  border: "none", cursor: "pointer", justifyContent: "center",
                }}
              >
                {m === "grow" ? <TrendingUp size={10} /> : <Target size={10} />}
                {m === "grow" ? (isAr ? "نمو أموالي" : "Grow my money") : (isAr ? "الوصول لهدف" : "Reach a target")}
              </button>
            ))}
          </div>

          {/* Sliders */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Starting amount */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span style={{ fontSize: 10, color: "var(--c-muted)", fontWeight: 600 }}>{isAr ? "المبلغ الأولي" : "Starting amount"}</span>
                <span className="font-num font-bold" style={{ fontSize: 11, color: "var(--c-text)" }}>{fmtCurrency(initial, sar)}</span>
              </div>
              <input type="range" min={0} max={500000} step={1000} value={initial} onChange={(e) => setInitial(Number(e.target.value))} style={sliderStyle} />
            </div>

            {mode === "target" && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span style={{ fontSize: 10, color: "var(--c-muted)", fontWeight: 600 }}>{isAr ? "المبلغ المستهدف" : "Target amount"}</span>
                  <span className="font-num font-bold" style={{ fontSize: 11, color: "var(--c-gold)" }}>{fmtCurrency(targetAmount, sar)}</span>
                </div>
                <input type="range" min={100000} max={10000000} step={50000} value={targetAmount} onChange={(e) => setTargetAmount(Number(e.target.value))} style={sliderStyle} />
              </div>
            )}

            {mode === "grow" && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span style={{ fontSize: 10, color: "var(--c-muted)", fontWeight: 600 }}>{isAr ? "الإضافة الشهرية" : "Monthly contribution"}</span>
                  <span className="font-num font-bold" style={{ fontSize: 11, color: "var(--c-text)" }}>{fmtCurrency(monthly, sar)}</span>
                </div>
                <input type="range" min={0} max={20000} step={100} value={monthly} onChange={(e) => setMonthly(Number(e.target.value))} style={sliderStyle} />
                <div className="flex items-center gap-2 mt-1.5">
                  {monthlyPresets.map((p) => (
                    <button key={p} onClick={() => setMonthly(p)} style={{ fontSize: 9, padding: "2px 8px", borderRadius: 4, background: monthly === p ? "var(--c-gold-dim)" : "var(--c-elevated)", border: `1px solid ${monthly === p ? "var(--c-gold-ring)" : "var(--c-border)"}`, color: monthly === p ? "var(--c-gold)" : "var(--c-dim)", cursor: "pointer", fontWeight: 600 }}>
                      {fmtCurrency(p, sar)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Years */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span style={{ fontSize: 10, color: "var(--c-muted)", fontWeight: 600 }}>{isAr ? "المدة (سنوات)" : "Time horizon"}</span>
                <span className="font-num font-bold" style={{ fontSize: 11, color: "var(--c-text)" }}>{years} {isAr ? "سنة" : "years"}</span>
              </div>
              <input type="range" min={1} max={30} step={1} value={years} onChange={(e) => setYears(Number(e.target.value))} style={sliderStyle} />
              <div className="flex items-center gap-2 mt-1.5">
                {yearPresets.map((p) => (
                  <button key={p} onClick={() => setYears(p)} style={{ fontSize: 9, padding: "2px 8px", borderRadius: 4, background: years === p ? "var(--c-gold-dim)" : "var(--c-elevated)", border: `1px solid ${years === p ? "var(--c-gold-ring)" : "var(--c-border)"}`, color: years === p ? "var(--c-gold)" : "var(--c-dim)", cursor: "pointer", fontWeight: 600 }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Return rate */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span style={{ fontSize: 10, color: "var(--c-muted)", fontWeight: 600 }}>{isAr ? "العائد السنوي المتوقع" : "Expected annual return"}</span>
                <span className="font-num font-bold" style={{ fontSize: 11, color: "var(--c-gold)" }}>{rate}%</span>
              </div>
              <input type="range" min={1} max={15} step={0.5} value={rate} onChange={(e) => setRate(Number(e.target.value))} style={sliderStyle} />
              <div className="flex items-center gap-2 mt-1.5">
                {ratePresets.map((p) => (
                  <button key={p} onClick={() => setRate(p)} style={{ fontSize: 9, padding: "2px 8px", borderRadius: 4, background: rate === p ? "var(--c-gold-dim)" : "var(--c-elevated)", border: `1px solid ${rate === p ? "var(--c-gold-ring)" : "var(--c-border)"}`, color: rate === p ? "var(--c-gold)" : "var(--c-dim)", cursor: "pointer", fontWeight: 600 }}>
                    {p}%
                  </button>
                ))}
              </div>
            </div>

            {/* Reinvest toggle */}
            <div className="flex items-center justify-between">
              <span style={{ fontSize: 10, color: "var(--c-muted)", fontWeight: 600 }}>{isAr ? "إعادة استثمار التوزيعات" : "Dividend reinvestment"}</span>
              <button
                onClick={() => setReinvest(!reinvest)}
                style={{
                  width: 36, height: 20, borderRadius: 10, padding: 2, cursor: "pointer",
                  background: reinvest ? "var(--c-gold)" : "var(--c-border)", border: "none", position: "relative",
                  transition: "background 0.2s",
                }}
              >
                <div style={{ width: 16, height: 16, borderRadius: "50%", background: "var(--c-text)", transition: "transform 0.2s", transform: reinvest ? "translateX(16px)" : "translateX(0)" }} />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Result */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Main result card */}
          <div style={{ padding: "20px 22px", borderRadius: 12, background: "var(--c-gold-dim)", border: "1px solid var(--c-gold-ring)" }}>
            {mode === "grow" ? (
              <>
                <span style={{ fontSize: 9, fontWeight: 700, color: "var(--c-gold)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  {isAr ? "القيمة المتوقعة" : "Projected value"}
                </span>
                <div className="font-num font-bold" style={{ fontSize: 28, color: "var(--c-text)", lineHeight: 1.15, marginTop: 4 }}>
                  {fmtCurrency(growResult.balance, sar)}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
                  <div>
                    <span style={{ fontSize: 9, color: "var(--c-dim)" }}>{isAr ? "إجمالي المستثمر" : "Total contributed"}</span>
                    <p className="font-num font-semibold" style={{ fontSize: 12, color: "var(--c-muted)", margin: 0, marginTop: 2 }}>{fmtCurrency(growResult.totalContributed, sar)}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: 9, color: "var(--c-dim)" }}>{isAr ? "النمو المقدر" : "Estimated growth"}</span>
                    <p className="font-num font-semibold" style={{ fontSize: 12, color: "var(--c-green)", margin: 0, marginTop: 2 }}>+{fmtCurrency(growResult.growth, sar)}</p>
                  </div>
                </div>
                <p style={{ fontSize: 10, color: "var(--c-muted)", marginTop: 12, lineHeight: 1.5 }}>
                  {isAr
                    ? `لو استثمرت ${fmtCurrency(monthly, sar)} شهريًا لمدة ${years} سنة بعائد سنوي ${rate}%، يمكن أن تنمو محفظتك إلى ${fmtCurrency(growResult.balance, sar)}.`
                    : `If you invest ${fmtCurrency(monthly, sar)} every month for ${years} years at an average ${rate}% annual return, your portfolio could grow to ${fmtCurrency(growResult.balance, sar)}.`}
                </p>
              </>
            ) : (
              <>
                <span style={{ fontSize: 9, fontWeight: 700, color: "var(--c-gold)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  {isAr ? "المبلغ الشهري المطلوب" : "Monthly needed"}
                </span>
                <div className="font-num font-bold" style={{ fontSize: 28, color: "var(--c-text)", lineHeight: 1.15, marginTop: 4 }}>
                  {fmtCurrency(targetResult.monthlyNeeded, sar)}
                </div>
                <p style={{ fontSize: 10, color: "var(--c-muted)", marginTop: 10, lineHeight: 1.5 }}>
                  {isAr
                    ? `للوصول إلى ${fmtCurrency(targetAmount, sar)} خلال ${years} سنة بعائد ${rate}%، قد تحتاج لاستثمار حوالي ${fmtCurrency(targetResult.monthlyNeeded, sar)} شهريًا.`
                    : `To reach ${fmtCurrency(targetAmount, sar)} in ${years} years at ${rate}%, you may need to invest about ${fmtCurrency(targetResult.monthlyNeeded, sar)} per month.`}
                </p>
              </>
            )}
          </div>

          {/* Milestone cards */}
          {mode === "grow" && displayMilestones.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(displayMilestones.length, 4)}, 1fr)`, gap: 6 }}>
              {displayMilestones.map((m) => (
                <div key={m.year} style={{ padding: "10px 12px", borderRadius: 8, background: "var(--c-elevated)", border: "1px solid var(--c-border)", textAlign: "center" }}>
                  <span style={{ fontSize: 9, color: "var(--c-dim)", fontWeight: 600 }}>
                    {isAr ? `السنة ${m.year}` : `Year ${m.year}`}
                  </span>
                  <p className="font-num font-bold" style={{ fontSize: 12, color: m.year === years ? "var(--c-gold)" : "var(--c-text)", margin: 0, marginTop: 2 }}>
                    {fmtCurrency(m.value, sar)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Chart: contributions vs growth */}
          {mode === "grow" && chartBars.length > 1 && (
            <div className="card" style={{ padding: "14px 16px" }}>
              <div className="flex items-center gap-4 mb-2">
                <div className="flex items-center gap-1.5"><div style={{ width: 8, height: 3, borderRadius: 1, background: "var(--c-muted)" }} /><span style={{ fontSize: 9, color: "var(--c-dim)" }}>{isAr ? "المساهمات" : "Contributions"}</span></div>
                <div className="flex items-center gap-1.5"><div style={{ width: 8, height: 3, borderRadius: 1, background: "var(--c-green)" }} /><span style={{ fontSize: 9, color: "var(--c-dim)" }}>{isAr ? "النمو" : "Growth"}</span></div>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 80 }}>
                {chartBars.map((d) => {
                  const contH = (d.contributions / maxVal) * 80;
                  const growH = (d.growth / maxVal) * 80;
                  return (
                    <div key={d.year} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
                      <div style={{ width: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", height: 80 }}>
                        <div style={{ height: growH, background: "var(--c-green)", borderRadius: "2px 2px 0 0", opacity: 0.7 }} />
                        <div style={{ height: contH, background: "var(--c-muted)", borderRadius: 0, opacity: 0.5 }} />
                      </div>
                      <span style={{ fontSize: 7, color: "var(--c-dim)", marginTop: 3 }}>{d.year}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <p style={{ fontSize: 8, color: "var(--c-dim)", fontStyle: "italic", textAlign: "center" }}>
            {isAr ? "هذا توقع توضيحي وليس ضمانًا للعوائد" : "This is an illustrative projection, not a guarantee"}
          </p>
        </div>
      </div>

      <style>{`
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%; background: var(--c-gold); cursor: pointer; border: 2px solid var(--c-base); box-shadow: 0 0 0 2px var(--c-gold-ring); }
        input[type="range"]::-moz-range-thumb { width: 14px; height: 14px; border-radius: 50%; background: var(--c-gold); cursor: pointer; border: 2px solid var(--c-base); }
        @media (max-width: 800px) { .calc-layout { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
