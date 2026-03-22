"use client";

import { useState, useRef, useEffect } from "react";
import { t } from "@/lib/i18n";
import { X, ChevronDown, TrendingUp, TrendingDown, AlertCircle, Trophy, Search, Zap, BarChart3, Shield, DollarSign, Activity, Scale } from "lucide-react";
import Link from "next/link";

interface Company {
  id: string;
  ticker: string;
  name_en: string;
  name_ar: string;
  sector: string;
}

interface ComparisonData {
  id: string;
  ticker: string;
  name_en: string;
  name_ar: string;
  sector: string;
  is_shariah_compliant: boolean;
  market: string;
  price: number | null;
  changePct: number | null;
  open: number | null;
  high: number | null;
  low: number | null;
  volume: number | null;
  suqai_score: number | null;
  score_tier: string | null;
  pe_ratio: number | null;
  pb_ratio: number | null;
  dividend_yield: number | null;
  roe: number | null;
  revenue_growth_yoy: number | null;
  debt_to_equity: number | null;
  current_ratio: number | null;
  market_cap: number | null;
  net_margin: number | null;
  gross_margin: number | null;
  as_of_date: string | null;
}

interface CompareClientProps {
  companies: Company[];
  locale: string;
}

// Popular comparison pairs for quick access
const POPULAR_PAIRS = [
  { a: "1120", b: "1180", label: { en: "Al Rajhi vs Al Bilad", ar: "الراجحي vs البلاد" } },
  { a: "2222", b: "2010", label: { en: "Aramco vs SABIC", ar: "أرامكو vs سابك" } },
  { a: "7010", b: "7020", label: { en: "STC vs Etihad Etisalat", ar: "STC vs موبايلي" } },
  { a: "1010", b: "1120", label: { en: "Riyad Bank vs Al Rajhi", ar: "الرياض vs الراجحي" } },
  { a: "2350", b: "2380", label: { en: "Almarai vs NADEC", ar: "المراعي vs نادك" } },
  { a: "3010", b: "3020", label: { en: "Arabian Cement vs Yamama", ar: "الاسمنت العربية vs اليمامة" } },
];

export default function CompareClient({ companies: allCompanies, locale }: CompareClientProps) {
  const isAr = locale === "ar";
  const [selectedTickers, setSelectedTickers] = useState<string[]>([]);
  const [searchInputs, setSearchInputs] = useState<string[]>(["", "", "", ""]);
  const [openDropdowns, setOpenDropdowns] = useState<{ [key: number]: boolean }>({});
  const [comparisonData, setComparisonData] = useState<ComparisonData[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      Object.entries(dropdownRefs.current).forEach(([key, ref]) => {
        if (ref && !ref.contains(event.target as Node)) {
          setOpenDropdowns((prev) => ({ ...prev, [key]: false }));
        }
      });
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-compare when 2+ stocks selected
  useEffect(() => {
    if (selectedTickers.length >= 2) {
      doCompare(selectedTickers);
    } else {
      setComparisonData(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTickers]);

  const doCompare = async (tickers: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/compare?tickers=${tickers.join(",")}`);
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setComparisonData(data);
    } catch {
      setError("Failed to load comparison data.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (index: number, ticker: string) => {
    const newTickers = [...selectedTickers];
    newTickers[index] = ticker;
    setSelectedTickers(newTickers.filter(Boolean));
    setSearchInputs((prev) => { const n = [...prev]; n[index] = ticker; return n; });
    setOpenDropdowns((prev) => ({ ...prev, [index]: false }));
  };

  const handleRemove = (index: number) => {
    const newTickers = selectedTickers.filter((_, i) => i !== index);
    setSelectedTickers(newTickers);
    setSearchInputs((prev) => { const n = [...prev]; n[index] = ""; return n; });
  };

  const handleSearchChange = (index: number, value: string) => {
    setSearchInputs((prev) => { const n = [...prev]; n[index] = value; return n; });
    setOpenDropdowns((prev) => ({ ...prev, [index]: true }));
  };

  const handleQuickPair = (a: string, b: string) => {
    setSelectedTickers([a, b]);
    setSearchInputs([a, b, "", ""]);
  };

  const filteredCompanies = (index: number) => {
    const sv = searchInputs[index].toUpperCase();
    return allCompanies.filter(
      (c) => !selectedTickers.includes(c.ticker) && (c.ticker.includes(sv) || c.name_en.toUpperCase().includes(sv))
    );
  };

  const fmt = (num: number | null, d = 2) => (num === null || isNaN(num)) ? "—" : num.toFixed(d);
  const fmtCap = (mc: number | null) => mc === null ? "—" : mc >= 1e9 ? `${(mc / 1e9).toFixed(1)}B` : mc >= 1e6 ? `${(mc / 1e6).toFixed(0)}M` : fmt(mc, 0);

  const findBest = (key: keyof ComparisonData, higher = true): number | null => {
    if (!comparisonData) return null;
    const valid = comparisonData.map((d, i) => ({ i, v: d[key] as number | null })).filter((x) => x.v !== null && !isNaN(x.v));
    if (!valid.length) return null;
    return (higher ? valid.reduce((a, b) => (a.v! > b.v! ? a : b)) : valid.reduce((a, b) => (a.v! < b.v! ? a : b))).i;
  };

  // Colors per stock slot
  const SLOT_COLORS = ["#c8a951", "#60a5fa", "#a78bfa", "#34d399"];
  const SLOT_BG = ["rgba(200,169,81,0.12)", "rgba(96,165,250,0.12)", "rgba(167,139,250,0.12)", "rgba(52,211,153,0.12)"];

  // ── Visual bar for a metric row ──
  const MetricBar = ({ label, icon, values, unit = "", higher = true, format }: {
    label: string; icon?: React.ReactNode; values: (number | null)[]; unit?: string; higher?: boolean;
    format?: (v: number | null) => string;
  }) => {
    if (!comparisonData) return null;
    const nums = values.map((v) => (v !== null && !isNaN(v) ? v : null));
    const absNums = nums.filter((n): n is number => n !== null).map(Math.abs);
    const maxVal = absNums.length > 0 ? Math.max(...absNums) : 1;
    const bestIdx = (() => {
      const valid = nums.map((v, i) => ({ i, v })).filter((x) => x.v !== null);
      if (!valid.length) return -1;
      return (higher ? valid.reduce((a, b) => (a.v! > b.v! ? a : b)) : valid.reduce((a, b) => (a.v! < b.v! ? a : b))).i;
    })();

    return (
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          {icon}
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--c-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {comparisonData.map((d, i) => {
            const v = nums[i];
            const pct = v !== null ? (Math.abs(v) / maxVal) * 100 : 0;
            const display = format ? format(v) : (v !== null ? `${fmt(v)}${unit}` : "—");
            const isBest = i === bestIdx;
            return (
              <div key={d.ticker} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: SLOT_COLORS[i], width: 42, textAlign: "right", flexShrink: 0 }}>{d.ticker}</span>
                <div style={{ flex: 1, height: 24, background: "var(--c-surface)", borderRadius: 6, overflow: "hidden", position: "relative" }}>
                  <div style={{
                    height: "100%", width: `${Math.max(pct, 3)}%`, borderRadius: 6,
                    background: `linear-gradient(90deg, ${SLOT_COLORS[i]}40, ${SLOT_COLORS[i]}90)`,
                    transition: "width 0.6s ease",
                  }} />
                  <span style={{
                    position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                    fontSize: 11, fontWeight: isBest ? 700 : 500, color: isBest ? SLOT_COLORS[i] : "var(--c-text)",
                  }}>
                    {display}
                  </span>
                </div>
                {isBest && <Trophy size={12} style={{ color: SLOT_COLORS[i], flexShrink: 0 }} />}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ── Pentagon/Radar mini chart (CSS-based) ──
  const MiniRadar = ({ data, index }: { data: ComparisonData; index: number }) => {
    const dims = [
      { key: "suqai_score", max: 100, label: "Score" },
      { key: "roe", max: 30, label: "ROE" },
      { key: "dividend_yield", max: 8, label: "Yield" },
      { key: "net_margin", max: 40, label: "Margin" },
      { key: "revenue_growth_yoy", max: 50, label: "Growth" },
    ];
    const scores = dims.map((d) => {
      const raw = data[d.key as keyof ComparisonData] as number | null;
      if (raw === null || isNaN(raw)) return 20;
      return Math.min(100, Math.max(5, (Math.abs(raw) / d.max) * 100));
    });
    const color = SLOT_COLORS[index];
    // Simple bar representation since CSS radar is complex
    return (
      <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 50 }}>
        {scores.map((s, i) => (
          <div key={dims[i].label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, flex: 1 }}>
            <div style={{ width: "100%", height: `${s * 0.45}px`, background: `${color}80`, borderRadius: "3px 3px 0 0", minHeight: 3 }} />
            <span style={{ fontSize: 7, color: "var(--c-muted)", lineHeight: 1 }}>{dims[i].label}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ direction: isAr ? "rtl" : "ltr" }}>
      {/* ── Stock Selection ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12,
        }}>
          {[0, 1, 2, 3].map((index) => (
            <div key={index} style={{ position: "relative" }}>
              <div
                ref={(el) => { if (el) dropdownRefs.current[index] = el; }}
                id={String(index)}
                style={{ position: "relative", border: selectedTickers[index] ? `2px solid ${SLOT_COLORS[index]}` : "1px solid var(--c-border)", borderRadius: 10, background: selectedTickers[index] ? SLOT_BG[index] : "var(--c-surface)", overflow: "visible", transition: "all 0.2s" }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", cursor: "pointer", minHeight: 44 }}
                  onClick={() => setOpenDropdowns((prev) => ({ ...prev, [index]: !prev[index] }))}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                    {!selectedTickers[index] && <Search size={14} style={{ color: "var(--c-muted)", flexShrink: 0 }} />}
                    {selectedTickers[index] && (
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: SLOT_COLORS[index], flexShrink: 0 }} />
                    )}
                    <input
                      type="text"
                      placeholder={selectedTickers[index] ? "" : (isAr ? "ابحث عن سهم..." : "Search stock...")}
                      value={searchInputs[index]}
                      onChange={(e) => handleSearchChange(index, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        flex: 1, border: "none", background: "transparent", fontSize: 13,
                        color: selectedTickers[index] ? SLOT_COLORS[index] : "var(--c-text)",
                        outline: "none", fontWeight: selectedTickers[index] ? 700 : 400,
                        textAlign: isAr ? "right" : "left",
                      }}
                    />
                  </div>
                  {selectedTickers[index] ? (
                    <button onClick={(e) => { e.stopPropagation(); handleRemove(index); }}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                      <X size={14} style={{ color: "var(--c-muted)" }} />
                    </button>
                  ) : (
                    <ChevronDown size={14} style={{ color: "var(--c-muted)", transform: openDropdowns[index] ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
                  )}
                </div>
                {openDropdowns[index] && !selectedTickers[index] && (
                  <div style={{
                    position: "absolute", top: "100%", left: 0, right: 0, width: "100%",
                    background: "var(--c-elevated)", border: "1px solid var(--c-border)", borderTop: "none",
                    maxHeight: 220, overflowY: "auto", zIndex: 50, borderRadius: "0 0 10px 10px",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                  }}>
                    {filteredCompanies(index).slice(0, 10).map((company) => (
                      <div key={company.id} onClick={() => handleSelect(index, company.ticker)}
                        className="compare-dropdown-item"
                        style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid var(--c-border)", fontSize: 13, color: "var(--c-text)", textAlign: isAr ? "right" : "left" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontWeight: 700, color: SLOT_COLORS[index] }}>{company.ticker}</span>
                          <span style={{ fontSize: 10, color: "var(--c-dim)", background: "var(--c-surface)", padding: "2px 6px", borderRadius: 4 }}>{company.sector}</span>
                        </div>
                        <div style={{ fontSize: 11, color: "var(--c-muted)", marginTop: 2 }}>
                          {isAr ? company.name_ar : company.name_en}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div style={{ marginTop: 12, padding: 10, background: "rgba(239,68,68,0.1)", border: "1px solid var(--c-red)", borderRadius: 8, fontSize: 12, color: "var(--c-red)", display: "flex", alignItems: "center", gap: 8 }}>
            <AlertCircle size={14} /> {error}
          </div>
        )}
      </div>

      {/* ── Popular Comparisons (show when no data) ── */}
      {!comparisonData && !loading && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--c-muted)", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            <Zap size={13} style={{ display: "inline", verticalAlign: "-2px", marginRight: 6, color: "var(--c-gold)" }} />
            {isAr ? "مقارنات شائعة" : "Popular Comparisons"}
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
            {POPULAR_PAIRS.map((pair) => (
              <button
                key={pair.a + pair.b}
                onClick={() => handleQuickPair(pair.a, pair.b)}
                className="compare-pair-btn"
                style={{
                  display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", gap: 2,
                  padding: "14px 18px", background: "var(--c-surface)", border: "1px solid var(--c-border)",
                  borderRadius: 12, cursor: "pointer", transition: "all 0.2s", color: "var(--c-text)",
                  fontSize: 13, fontWeight: 600, fontFamily: "var(--font-grotesk)",
                }}
              >
                <span style={{ fontSize: 13, color: "var(--c-text)", fontWeight: 600 }}>
                  {isAr ? pair.label.ar : pair.label.en}
                </span>
                <span style={{ fontSize: 10, color: "var(--c-dim)", fontWeight: 400, display: "block", marginTop: 2 }}>
                  <span style={{ color: SLOT_COLORS[0] }}>{pair.a}</span>
                  {" vs "}
                  <span style={{ color: SLOT_COLORS[1] }}>{pair.b}</span>
                </span>
              </button>
            ))}
          </div>

          {/* Empty state illustration */}
          <div style={{
            marginTop: 40, textAlign: "center", padding: "48px 24px",
            background: "linear-gradient(180deg, rgba(200,169,81,0.03) 0%, transparent 100%)",
            borderRadius: 16, border: "1px dashed var(--c-border)",
          }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>⚖️</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--c-text)", marginBottom: 8 }}>
              {isAr ? "قارن بين الأسهم السعودية" : "Compare Saudi Stocks Side-by-Side"}
            </h3>
            <p style={{ fontSize: 13, color: "var(--c-muted)", maxWidth: 420, margin: "0 auto", lineHeight: 1.6 }}>
              {isAr
                ? "اختر سهمين أو أكثر لرؤية مقارنة مرئية شاملة — التقييم، الربحية، التوزيعات، النمو، والمزيد"
                : "Select 2 or more stocks to see a comprehensive visual comparison — valuation, profitability, dividends, growth, and more"}
            </p>
          </div>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div style={{ textAlign: "center", padding: 60 }}>
          <div style={{ width: 40, height: 40, border: "3px solid var(--c-border)", borderTop: "3px solid var(--c-gold)", borderRadius: "50%", margin: "0 auto 16px", animation: "spin 0.8s linear infinite" }} />
          <p style={{ fontSize: 13, color: "var(--c-muted)" }}>{isAr ? "جاري التحليل..." : "Analyzing..."}</p>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          COMPARISON RESULTS
         ══════════════════════════════════════════════════ */}
      {comparisonData && comparisonData.length > 0 && !loading && (
        <div>
          {/* ── Header Cards ── */}
          <div style={{
            display: "grid", gridTemplateColumns: `repeat(${comparisonData.length}, 1fr)`, gap: 12, marginBottom: 24,
          }}>
            {comparisonData.map((data, i) => {
              const up = (data.changePct ?? 0) >= 0;
              return (
                <Link key={data.ticker} href={`/${locale}/stock/${data.ticker}`} style={{ textDecoration: "none" }}>
                  <div style={{
                    padding: "18px 16px", borderRadius: 14, background: SLOT_BG[i],
                    border: `2px solid ${SLOT_COLORS[i]}30`, transition: "all 0.2s",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ width: 10, height: 10, borderRadius: "50%", background: SLOT_COLORS[i] }} />
                          <span style={{ fontSize: 15, fontWeight: 800, color: SLOT_COLORS[i] }}>{data.ticker}</span>
                        </div>
                        <p style={{ fontSize: 12, color: "var(--c-muted)", margin: "3px 0 0 16px" }}>
                          {isAr ? data.name_ar : data.name_en}
                        </p>
                      </div>
                      {data.suqai_score !== null && (
                        <div style={{ textAlign: "center", padding: "4px 10px", borderRadius: 8, background: `${SLOT_COLORS[i]}20`, border: `1px solid ${SLOT_COLORS[i]}40` }}>
                          <div style={{ fontSize: 8, fontWeight: 600, color: SLOT_COLORS[i], textTransform: "uppercase", letterSpacing: "0.05em" }}>SŪQAI</div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: SLOT_COLORS[i] }}>{fmt(data.suqai_score, 0)}</div>
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                      <span style={{ fontSize: 22, fontWeight: 800, color: "var(--c-text)", fontFamily: "var(--font-grotesk)" }}>
                        {data.price !== null ? fmt(data.price) : "—"}
                      </span>
                      <span style={{ fontSize: 11, color: "var(--c-muted)" }}>SAR</span>
                      {data.changePct !== null && (
                        <span style={{ fontSize: 12, fontWeight: 700, color: up ? "var(--c-green)" : "var(--c-red)", display: "flex", alignItems: "center", gap: 3 }}>
                          {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          {up ? "+" : ""}{fmt(data.changePct)}%
                        </span>
                      )}
                    </div>
                    {/* Mini strength bars */}
                    <div style={{ marginTop: 12 }}>
                      <MiniRadar data={data} index={i} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* ── Visual Metric Bars ── */}
          <div style={{ borderRadius: 16, background: "var(--c-surface)", border: "1px solid var(--c-border)", padding: "24px 20px", marginBottom: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--c-text)", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
              <BarChart3 size={16} style={{ color: "var(--c-gold)" }} />
              {isAr ? "مقارنة التقييم" : "Valuation Comparison"}
            </h3>
            <MetricBar label={isAr ? "مكرر الأرباح" : "P/E Ratio"} icon={<Scale size={12} style={{ color: "var(--c-dim)" }} />} values={comparisonData.map((d) => d.pe_ratio)} higher={false} />
            <MetricBar label={isAr ? "السعر / القيمة الدفترية" : "P/B Ratio"} values={comparisonData.map((d) => d.pb_ratio)} higher={false} />
            <MetricBar label={isAr ? "القيمة السوقية" : "Market Cap"} icon={<DollarSign size={12} style={{ color: "var(--c-dim)" }} />} values={comparisonData.map((d) => d.market_cap)} format={(v) => fmtCap(v)} />
          </div>

          <div style={{ borderRadius: 16, background: "var(--c-surface)", border: "1px solid var(--c-border)", padding: "24px 20px", marginBottom: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--c-text)", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
              <Shield size={16} style={{ color: "var(--c-green)" }} />
              {isAr ? "الربحية والجودة" : "Profitability & Quality"}
            </h3>
            <MetricBar label="ROE" values={comparisonData.map((d) => d.roe)} unit="%" />
            <MetricBar label={isAr ? "هامش صافي الربح" : "Net Margin"} values={comparisonData.map((d) => d.net_margin)} unit="%" />
            <MetricBar label={isAr ? "هامش الربح الإجمالي" : "Gross Margin"} values={comparisonData.map((d) => d.gross_margin)} unit="%" />
            <MetricBar label={isAr ? "نمو الإيرادات" : "Revenue Growth"} icon={<Activity size={12} style={{ color: "var(--c-dim)" }} />} values={comparisonData.map((d) => d.revenue_growth_yoy)} unit="%" />
          </div>

          <div style={{ borderRadius: 16, background: "var(--c-surface)", border: "1px solid var(--c-border)", padding: "24px 20px", marginBottom: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--c-text)", marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
              <DollarSign size={16} style={{ color: "#a78bfa" }} />
              {isAr ? "التوزيعات والمخاطر" : "Dividends & Risk"}
            </h3>
            <MetricBar label={isAr ? "عائد التوزيعات" : "Dividend Yield"} values={comparisonData.map((d) => d.dividend_yield)} unit="%" />
            <MetricBar label={isAr ? "الدين / حقوق الملكية" : "Debt / Equity"} values={comparisonData.map((d) => d.debt_to_equity)} higher={false} />
            <MetricBar label={isAr ? "نسبة التداول" : "Current Ratio"} values={comparisonData.map((d) => d.current_ratio)} />
          </div>

          {/* ── Winner Summary ── */}
          <div style={{
            borderRadius: 16, padding: "20px 24px", marginBottom: 20,
            background: "linear-gradient(135deg, rgba(200,169,81,0.08), rgba(6,13,24,0.9))",
            border: "1px solid var(--c-gold-ring)",
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--c-gold)", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <Trophy size={16} /> {isAr ? "ملخص المقارنة" : "Comparison Verdict"}
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
              {([
                { label: isAr ? "أفضل قيمة" : "Best Value", key: "pe_ratio" as keyof ComparisonData, higher: false },
                { label: isAr ? "أعلى ربحية" : "Most Profitable", key: "roe" as keyof ComparisonData, higher: true },
                { label: isAr ? "أعلى عائد" : "Highest Yield", key: "dividend_yield" as keyof ComparisonData, higher: true },
                { label: isAr ? "أقل مخاطرة" : "Lowest Risk", key: "debt_to_equity" as keyof ComparisonData, higher: false },
                { label: isAr ? "أعلى نمو" : "Fastest Growth", key: "revenue_growth_yoy" as keyof ComparisonData, higher: true },
                { label: isAr ? "أفضل تقييم SŪQAI" : "Best SŪQAI Score", key: "suqai_score" as keyof ComparisonData, higher: true },
              ]).map((item) => {
                const bestIdx = findBest(item.key, item.higher);
                const winner = bestIdx !== null ? comparisonData[bestIdx] : null;
                return (
                  <div key={item.label} style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid var(--c-border)" }}>
                    <div style={{ fontSize: 10, color: "var(--c-muted)", fontWeight: 500, marginBottom: 4 }}>{item.label}</div>
                    {winner ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: SLOT_COLORS[bestIdx!] }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: SLOT_COLORS[bestIdx!] }}>{winner.ticker}</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: "var(--c-dim)" }}>—</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Styles */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .compare-pair-btn:hover { border-color: var(--c-gold) !important; background: rgba(200,169,81,0.08) !important; transform: translateY(-1px); }
        .compare-dropdown-item:hover { background: var(--c-surface) !important; }
      `}</style>
    </div>
  );
}
