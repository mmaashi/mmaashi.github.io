"use client";

import { useState, useMemo, forwardRef, useImperativeHandle } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronUp, ChevronDown, ChevronsUpDown, Filter, Gauge, Sparkles, TrendingUp, DollarSign, Shield, Zap, BarChart3, Crown, Target } from "lucide-react";
import { t, tSector, tTier } from "@/lib/i18n";
import { displayName } from "@/lib/display-names";
import MiniSnowflake from "@/components/stock/MiniSnowflake";

interface Company {
  id: string;
  ticker: string;
  name_en: string;
  name_ar: string;
  sector: string;
  market: string;
  is_shariah_compliant: boolean;
  price: number | null;
  open: number | null;
  volume: number | null;
  change_pct: number | null;
  // SŪQAI metrics
  suqai_score: number | null;
  score_tier: string | null;
  pe_ratio: number | null;
  pb_ratio: number | null;
  dividend_yield: number | null;
  roe: number | null;
  revenue_growth_yoy: number | null;
  debt_to_equity: number | null;
  market_cap: number | null;
  net_margin: number | null;
}

/* ── Smart Category Presets ── */
interface CategoryPreset {
  key: string;
  labelEn: string;
  labelAr: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  descEn: string;
  descAr: string;
  filter: (c: Company) => boolean;
  sort?: SortKey;
  sortDir?: SortDir;
}

const CATEGORY_PRESETS: CategoryPreset[] = [
  {
    key: "undervalued",
    labelEn: "Undervalued",
    labelAr: "مقيّمة بأقل",
    icon: <Target size={13} />,
    color: "#22c55e",
    bg: "rgba(34,197,94,0.10)",
    descEn: "P/E below 15 with positive earnings",
    descAr: "مكرر أرباح أقل من 15 مع أرباح إيجابية",
    filter: (c) => c.pe_ratio !== null && c.pe_ratio > 0 && c.pe_ratio < 15 && c.roe !== null && c.roe > 0,
    sort: "pe_ratio",
    sortDir: "asc",
  },
  {
    key: "growth",
    labelEn: "Growth",
    labelAr: "نمو",
    icon: <TrendingUp size={13} />,
    color: "#0ECB81",
    bg: "rgba(14,203,129,0.10)",
    descEn: "Revenue growing with strong momentum",
    descAr: "إيرادات متنامية مع زخم قوي",
    filter: (c) => c.revenue_growth_yoy !== null && c.revenue_growth_yoy > 0.05 && c.suqai_score !== null && c.suqai_score > 40,
    sort: "suqai_score",
    sortDir: "desc",
  },
  {
    key: "dividend",
    labelEn: "High Dividend",
    labelAr: "توزيعات عالية",
    icon: <DollarSign size={13} />,
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.10)",
    descEn: "Yield above 4% with consistent payouts",
    descAr: "عائد أعلى من 4% مع توزيعات مستمرة",
    filter: (c) => c.dividend_yield !== null && c.dividend_yield > 0.04,
    sort: "dividend_yield",
    sortDir: "desc",
  },
  {
    key: "quality",
    labelEn: "Quality",
    labelAr: "جودة عالية",
    icon: <Crown size={13} />,
    color: "#A78BFA",
    bg: "rgba(167,139,250,0.10)",
    descEn: "ROE above 15% and positive margins",
    descAr: "عائد على الملكية أعلى من 15% وهوامش إيجابية",
    filter: (c) => c.roe !== null && c.roe > 0.15 && c.net_margin !== null && c.net_margin > 0.05,
    sort: "roe",
    sortDir: "desc",
  },
  {
    key: "safe_haven",
    labelEn: "Safe Haven",
    labelAr: "ملاذ آمن",
    icon: <Shield size={13} />,
    color: "#14B8A6",
    bg: "rgba(20,184,166,0.10)",
    descEn: "Low debt with strong balance sheet",
    descAr: "ديون منخفضة وميزانية قوية",
    filter: (c) => c.debt_to_equity !== null && c.debt_to_equity < 0.5 && c.debt_to_equity >= 0 && c.suqai_score !== null && c.suqai_score > 30,
    sort: "suqai_score",
    sortDir: "desc",
  },
  {
    key: "momentum",
    labelEn: "Momentum",
    labelAr: "زخم",
    icon: <Zap size={13} />,
    color: "#60A5FA",
    bg: "rgba(96,165,250,0.10)",
    descEn: "Positive price action today",
    descAr: "حركة سعرية إيجابية اليوم",
    filter: (c) => c.change_pct !== null && c.change_pct > 1,
    sort: "change_pct",
    sortDir: "desc",
  },
  {
    key: "top_rated",
    labelEn: "Top Rated",
    labelAr: "الأعلى تقييماً",
    icon: <Sparkles size={13} />,
    color: "#C8A951",
    bg: "rgba(200,169,81,0.10)",
    descEn: "SŪQAI Score 70+ (Strong Buy / Buy)",
    descAr: "نتيجة سوقاي 70+ (شراء قوي / شراء)",
    filter: (c) => c.suqai_score !== null && c.suqai_score >= 70,
    sort: "suqai_score",
    sortDir: "desc",
  },
  {
    key: "large_cap",
    labelEn: "Large Cap",
    labelAr: "رأس مال كبير",
    icon: <BarChart3 size={13} />,
    color: "#818CF8",
    bg: "rgba(129,140,248,0.10)",
    descEn: "Market cap above 50B SAR",
    descAr: "قيمة سوقية أعلى من 50 مليار ريال",
    filter: (c) => c.market_cap !== null && c.market_cap > 50e9,
    sort: "market_cap",
    sortDir: "desc",
  },
];

type SortKey = "ticker" | "name_en" | "price" | "change_pct" | "volume" | "suqai_score" | "pe_ratio" | "dividend_yield" | "roe" | "market_cap";
type SortDir = "asc" | "desc";

function tierColor(tier: string | null): string {
  switch (tier) {
    case "Strong Buy": return "#22c55e";
    case "Buy": return "#4ade80";
    case "Hold": return "#d4a574";
    case "Underperform": return "#f97316";
    case "Sell": return "#ef4444";
    default: return "#6b7280";
  }
}

function tierBg(tier: string | null): string {
  switch (tier) {
    case "Strong Buy": return "rgba(34,197,94,0.12)";
    case "Buy": return "rgba(74,222,128,0.10)";
    case "Hold": return "rgba(212,165,116,0.08)";
    case "Underperform": return "rgba(249,115,22,0.10)";
    case "Sell": return "rgba(239,68,68,0.10)";
    default: return "rgba(107,114,128,0.08)";
  }
}

// Helper function to calculate pillar scores (0-5 scale) from company metrics
// Returns numeric values for all pillars (defaults to 2.5 neutral when data missing)
// so the MiniSnowflake SVG always renders a visible shape
function calculatePillarScores(company: Company): {
  value: number; growth: number; dividend: number; health: number; momentum: number;
} {
  // Value pillar: based on P/E ratio (lower is better, capped at 5)
  const valuePillar = company.pe_ratio !== null && company.pe_ratio > 0
    ? Math.max(1, 5 - (company.pe_ratio / 10))
    : null;

  // Growth pillar: based on revenue growth YoY
  const growthPillar = company.revenue_growth_yoy !== null
    ? Math.min(5, Math.max(1, company.revenue_growth_yoy * 25))
    : null;

  // Dividend pillar: based on dividend yield
  const dividendPillar = company.dividend_yield !== null
    ? Math.min(5, Math.max(1, company.dividend_yield * 100))
    : null;

  // Health pillar: based on debt_to_equity (lower is better)
  const healthPillar = company.debt_to_equity !== null && company.debt_to_equity >= 0
    ? Math.max(1, 5 - (company.debt_to_equity * 2))
    : null;

  // Momentum pillar: estimated from price change (approximation)
  const momentumPillar = company.change_pct !== null
    ? Math.min(5, Math.max(1, 2.5 + (company.change_pct * 10)))
    : null;

  // Count how many pillars have real data
  const pillars = [valuePillar, growthPillar, dividendPillar, healthPillar, momentumPillar];
  const dataCount = pillars.filter(p => p !== null).length;

  // If we have at least 2 pillars with data, render the shape
  // Null pillars default to 1.0 (small sliver) to keep the shape visible
  const fallback = dataCount >= 2 ? 1.0 : 0;

  return {
    value: valuePillar ?? fallback,
    growth: growthPillar ?? fallback,
    dividend: dividendPillar ?? fallback,
    health: healthPillar ?? fallback,
    momentum: momentumPillar ?? fallback,
  };
}

export interface ScreenerTableHandle {
  applyTemplate: (filters: Record<string, any>) => void;
}

const ScreenerTableComponent = forwardRef<ScreenerTableHandle, {
  companies: Company[];
  sectors: string[];
  locale: string;
}>(function ScreenerTable({
  companies,
  sectors,
  locale,
}, ref) {
  const router = useRouter();
  const isAr = locale === "ar";
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("suqai_score");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [shariah, setShariah] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Advanced filters
  const [minScore, setMinScore] = useState<string>("");
  const [maxPE, setMaxPE] = useState<string>("");
  const [minDivYield, setMinDivYield] = useState<string>("");
  const [minROE, setMinROE] = useState<string>("");
  const [maxDE, setMaxDE] = useState<string>("");

  // Handler for template application
  function applyTemplate(filters: Record<string, any>) {
    // Clear active category and reset sort
    setActiveCategory(null);
    setSortKey("suqai_score");
    setSortDir("desc");

    // Apply supported filters from template
    // Note: Only the filters in the advanced filter section are directly supported
    if (filters.minScore) setMinScore(filters.minScore);
    if (filters.maxPE) setMaxPE(filters.maxPE);
    if (filters.minDivYield) setMinDivYield(filters.minDivYield);
    if (filters.minROE) setMinROE(filters.minROE);
    if (filters.maxDE) setMaxDE(filters.maxDE);

    // Handle Shariah filter
    if (filters.shariah === "true") setShariah(true);

    // Show advanced filters to indicate active filters have been applied
    setShowAdvanced(true);
  }

  // Expose applyTemplate via ref
  useImperativeHandle(ref, () => ({
    applyTemplate,
  }));

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir(key === "ticker" || key === "name_en" ? "asc" : "desc"); }
  }

  // Category preset handler
  const activeCategoryObj = CATEGORY_PRESETS.find(p => p.key === activeCategory) ?? null;

  function selectCategory(key: string | null) {
    if (key === activeCategory) {
      // Deselect
      setActiveCategory(null);
      setSortKey("suqai_score");
      setSortDir("desc");
    } else {
      setActiveCategory(key);
      const preset = CATEGORY_PRESETS.find(p => p.key === key);
      if (preset?.sort) { setSortKey(preset.sort); setSortDir(preset.sortDir ?? "desc"); }
      // Clear advanced filters when using a preset
      setMinScore(""); setMaxPE(""); setMinDivYield(""); setMinROE(""); setMaxDE("");
    }
  }

  const filtered = useMemo(() => {
    let list = companies;
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(
        (c) => c.ticker.toLowerCase().includes(q) ||
               c.name_en.toLowerCase().includes(q) ||
               (c.name_ar && c.name_ar.includes(q))
      );
    }
    if (sector) list = list.filter((c) => c.sector === sector);
    if (shariah) list = list.filter((c) => c.is_shariah_compliant);

    // Smart category filter
    if (activeCategoryObj) {
      list = list.filter(activeCategoryObj.filter);
    }

    // Advanced filters
    if (minScore) { const v = parseFloat(minScore); if (!isNaN(v)) list = list.filter(c => c.suqai_score !== null && c.suqai_score >= v); }
    if (maxPE) { const v = parseFloat(maxPE); if (!isNaN(v)) list = list.filter(c => c.pe_ratio !== null && c.pe_ratio > 0 && c.pe_ratio <= v); }
    if (minDivYield) { const v = parseFloat(minDivYield) / 100; if (!isNaN(v)) list = list.filter(c => c.dividend_yield !== null && c.dividend_yield >= v); }
    if (minROE) { const v = parseFloat(minROE) / 100; if (!isNaN(v)) list = list.filter(c => c.roe !== null && c.roe >= v); }
    if (maxDE) { const v = parseFloat(maxDE); if (!isNaN(v)) list = list.filter(c => c.debt_to_equity !== null && c.debt_to_equity <= v); }

    return [...list].sort((a, b) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let av: any = (a as any)[sortKey] ?? (sortDir === "desc" ? -Infinity : Infinity);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let bv: any = (b as any)[sortKey] ?? (sortDir === "desc" ? -Infinity : Infinity);
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [companies, query, sector, sortKey, sortDir, shariah, activeCategory, activeCategoryObj, minScore, maxPE, minDivYield, minROE, maxDE]);

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ChevronsUpDown size={12} style={{ color: "var(--c-dim)" }} />;
    return sortDir === "asc"
      ? <ChevronUp size={12} style={{ color: "var(--c-gold)" }} />
      : <ChevronDown size={12} style={{ color: "var(--c-gold)" }} />;
  }

  function TH({ label, k, right }: { label: string; k: SortKey; right?: boolean }) {
    return (
      <th onClick={() => toggleSort(k)} className="cursor-pointer select-none"
          style={{ textAlign: right ? "right" : "left", padding: "10px 14px",
                   color: sortKey === k ? "var(--c-gold)" : "var(--c-muted)",
                   fontSize: 11, fontWeight: 600, letterSpacing: "0.06em",
                   textTransform: "uppercase", background: "var(--c-elevated)",
                   borderBottom: "1px solid var(--c-border-md)", whiteSpace: "nowrap" }}>
        <span className="inline-flex items-center gap-1">
          {right && <SortIcon k={k} />}
          {label}
          {!right && <SortIcon k={k} />}
        </span>
      </th>
    );
  }

  const hasActiveFilters = !!(minScore || maxPE || minDivYield || minROE || maxDE);

  return (
    <div>
      {/* ── Smart Category Presets ── */}
      <div className="mb-4" style={{
        overflowX: "auto", WebkitOverflowScrolling: "touch",
        background: "var(--c-base)",
        paddingTop: 4, paddingBottom: 4,
      }}>
        <div className="flex gap-2" style={{ minWidth: "max-content", paddingBottom: 4 }}>
          {CATEGORY_PRESETS.map((preset) => {
            const isActive = activeCategory === preset.key;
            const matchCount = companies.filter(preset.filter).length;
            return (
              <button
                key={preset.key}
                onClick={() => selectCategory(preset.key)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{
                  border: "1px solid",
                  borderColor: isActive ? preset.color + "66" : "var(--c-border-md)",
                  background: isActive ? preset.bg : "var(--c-surface)",
                  color: isActive ? preset.color : "var(--c-muted)",
                  whiteSpace: "nowrap",
                  boxShadow: isActive ? `0 2px 12px ${preset.color}22` : "none",
                }}
              >
                <span style={{ color: isActive ? preset.color : "var(--c-dim)" }}>{preset.icon}</span>
                <span>{isAr ? preset.labelAr : preset.labelEn}</span>
                <span className="font-num" style={{
                  fontSize: 10, fontWeight: 800, padding: "1px 6px", borderRadius: 6,
                  background: isActive ? preset.color + "22" : "var(--c-elevated)",
                  color: isActive ? preset.color : "var(--c-dim)",
                }}>
                  {matchCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active category description */}
      {activeCategoryObj && (
        <div className="card mb-3" style={{
          padding: "10px 16px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: activeCategoryObj.bg,
          border: `1px solid ${activeCategoryObj.color}33`,
        }}>
          <div className="flex items-center gap-2">
            <span style={{ color: activeCategoryObj.color }}>{activeCategoryObj.icon}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: activeCategoryObj.color }}>
              {isAr ? activeCategoryObj.labelAr : activeCategoryObj.labelEn}
            </span>
            <span style={{ fontSize: 12, color: "var(--c-muted)" }}>
              — {isAr ? activeCategoryObj.descAr : activeCategoryObj.descEn}
            </span>
          </div>
          <button
            onClick={() => selectCategory(null)}
            style={{ fontSize: 11, color: "var(--c-muted)", fontWeight: 600, cursor: "pointer", background: "none", border: "none", padding: "4px 8px" }}
          >
            {isAr ? "مسح" : "Clear"}
          </button>
        </div>
      )}

      {/* Filters bar */}
      <div className="card mb-4" style={{ padding: "14px 16px" }}>
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1" style={{ minWidth: 200 }}>
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: "var(--c-muted)" }} />
            <input
              className="input-field"
              style={{ paddingLeft: 32 }}
              placeholder={t(locale, "screener.search_placeholder")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {/* Sector filter */}
          <div style={{ position: "relative" }}>
            <Filter size={12} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--c-muted)", pointerEvents: "none" }} />
            <select
              className="input-field"
              style={{ paddingLeft: 28, paddingRight: 28, minWidth: 160, cursor: "pointer",
                       appearance: "none", WebkitAppearance: "none" }}
              value={sector}
              onChange={(e) => setSector(e.target.value)}
            >
              <option value="">{t(locale, "screener.all_sectors")}</option>
              {sectors.map((s) => <option key={s} value={s}>{tSector(locale, s)}</option>)}
            </select>
          </div>

          {/* Shariah toggle */}
          <button
            onClick={() => setShariah((v) => !v)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{
              border: "1px solid",
              borderColor: shariah ? "rgba(200,169,81,0.4)" : "var(--c-border-md)",
              background: shariah ? "var(--c-gold-dim)" : "var(--c-elevated)",
              color: shariah ? "var(--c-gold)" : "var(--c-muted)",
            }}
          >
            <span style={{ fontSize: 13 }}>☽</span>
            {t(locale, "screener.shariah")}
          </button>

          {/* Advanced filters toggle */}
          <button
            onClick={() => setShowAdvanced(v => !v)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{
              border: "1px solid",
              borderColor: (showAdvanced || hasActiveFilters) ? "rgba(200,169,81,0.4)" : "var(--c-border-md)",
              background: (showAdvanced || hasActiveFilters) ? "var(--c-gold-dim)" : "var(--c-elevated)",
              color: (showAdvanced || hasActiveFilters) ? "var(--c-gold)" : "var(--c-muted)",
            }}
          >
            <Gauge size={13} />
            {isAr ? "فلاتر متقدمة" : "Filters"}
            {hasActiveFilters && (
              <span style={{ fontSize: 9, fontWeight: 800, padding: "1px 5px", borderRadius: 4, background: "var(--c-gold)", color: "var(--c-base)" }}>!</span>
            )}
          </button>

          {/* Count */}
          <span style={{ fontSize: 12, color: "var(--c-muted)", marginLeft: "auto" }}>
            {filtered.length} {t(locale, "screener.of")} {companies.length} {t(locale, "screener.companies")}
          </span>
        </div>

        {/* Advanced filter row */}
        {showAdvanced && (
          <div className="flex flex-wrap gap-3 mt-3 pt-3" style={{ borderTop: "1px solid var(--c-border)" }}>
            <div>
              <label style={{ fontSize: 10, color: "var(--c-muted)", fontWeight: 600, display: "block", marginBottom: 3 }}>
                {isAr ? "أقل نتيجة" : "MIN SCORE"}
              </label>
              <input className="input-field font-num" style={{ width: 80, fontSize: 12 }} type="number" placeholder="0" value={minScore} onChange={e => setMinScore(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 10, color: "var(--c-muted)", fontWeight: 600, display: "block", marginBottom: 3 }}>
                {isAr ? "أعلى مكرر" : "MAX P/E"}
              </label>
              <input className="input-field font-num" style={{ width: 80, fontSize: 12 }} type="number" placeholder="∞" value={maxPE} onChange={e => setMaxPE(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 10, color: "var(--c-muted)", fontWeight: 600, display: "block", marginBottom: 3 }}>
                {isAr ? "أقل عائد %" : "MIN DIV %"}
              </label>
              <input className="input-field font-num" style={{ width: 80, fontSize: 12 }} type="number" placeholder="0" value={minDivYield} onChange={e => setMinDivYield(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 10, color: "var(--c-muted)", fontWeight: 600, display: "block", marginBottom: 3 }}>
                {isAr ? "أقل عائد حقوق %" : "MIN ROE %"}
              </label>
              <input className="input-field font-num" style={{ width: 80, fontSize: 12 }} type="number" placeholder="0" value={minROE} onChange={e => setMinROE(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 10, color: "var(--c-muted)", fontWeight: 600, display: "block", marginBottom: 3 }}>
                {isAr ? "أعلى دين/ملكية" : "MAX D/E"}
              </label>
              <input className="input-field font-num" style={{ width: 80, fontSize: 12 }} type="number" placeholder="∞" step="0.1" value={maxDE} onChange={e => setMaxDE(e.target.value)} />
            </div>
            {hasActiveFilters && (
              <button
                onClick={() => { setMinScore(""); setMaxPE(""); setMinDivYield(""); setMinROE(""); setMaxDE(""); }}
                style={{ alignSelf: "flex-end", fontSize: 11, color: "var(--c-red)", fontWeight: 600, cursor: "pointer", background: "none", border: "none", padding: "6px 0" }}
              >
                {isAr ? "مسح الفلاتر" : "Clear filters"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <div style={{ padding: "48px 0", textAlign: "center" }}>
            <p style={{ color: "var(--c-muted)", fontSize: 14 }}>{t(locale, "screener.no_results")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <TH label={t(locale, "screener.col.ticker")} k="ticker" />
                  <TH label={t(locale, "screener.col.company")} k="name_en" />
                  <TH label={isAr ? "النتيجة" : "SCORE"} k="suqai_score" right />
                  <TH label={t(locale, "screener.col.price")} k="price" right />
                  <TH label={t(locale, "screener.col.change")} k="change_pct" right />
                  <TH label="P/E" k="pe_ratio" right />
                  <TH label={isAr ? "العائد" : "DIV %"} k="dividend_yield" right />
                  <TH label="ROE" k="roe" right />
                  <TH label={isAr ? "القيمة السوقية" : "MKT CAP"} k="market_cap" right />
                  <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--c-muted)",
                               fontSize: 11, fontWeight: 600, letterSpacing: "0.06em",
                               textTransform: "uppercase", background: "var(--c-elevated)",
                               borderBottom: "1px solid var(--c-border-md)" }}>
                    {t(locale, "screener.col.sector")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const isUp = (c.change_pct ?? 0) >= 0;
                  const name = displayName(locale, c.name_en, c.name_ar);
                  return (
                    <tr
                      key={c.ticker}
                      onClick={() => router.push(`/${locale}/stock/${c.ticker}`)}
                      className="cursor-pointer transition-colors"
                      style={{ borderBottom: "1px solid var(--c-border)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--c-hover)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                    >
                      {/* Ticker */}
                      <td style={{ padding: "10px 14px" }}>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                               style={{ background: "var(--c-gold-dim)", border: "1px solid var(--c-gold-ring)" }}>
                            <span style={{ fontSize: 10, fontWeight: 800, color: "var(--c-gold)" }}>
                              {c.ticker.slice(0, 4)}
                            </span>
                          </div>
                          <span className="ticker-tag">{c.ticker}</span>
                        </div>
                      </td>
                      {/* Name */}
                      <td style={{ padding: "10px 14px" }}>
                        <div className="flex items-center gap-2">
                          <span style={{ color: "var(--c-text)", fontSize: 13 }}>{name}</span>
                          {c.is_shariah_compliant && (
                            <span className="badge badge-gold" style={{ padding: "1px 6px", fontSize: 9 }}>☽</span>
                          )}
                        </div>
                      </td>
                      {/* SŪQAI Score */}
                      <td style={{ textAlign: "right", padding: "10px 14px" }}>
                        {c.suqai_score !== null ? (
                          <div className="flex items-center justify-end gap-2">
                            <MiniSnowflake scores={calculatePillarScores(c)} size={40} />
                            <div>
                              <span className="font-num font-bold" style={{ fontSize: 14, color: tierColor(c.score_tier) }}>
                                {c.suqai_score.toFixed(0)}
                              </span>
                              {c.score_tier && (
                                <span style={{
                                  fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 4,
                                  background: tierBg(c.score_tier), color: tierColor(c.score_tier),
                                  whiteSpace: "nowrap",
                                  display: "block",
                                  marginTop: "2px",
                                }}>
                                  {tTier(locale, c.score_tier)}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : <span style={{ color: "var(--c-dim)", fontSize: 12 }}>—</span>}
                      </td>
                      {/* Price */}
                      <td style={{ textAlign: "right", padding: "10px 14px" }}>
                        {c.price !== null ? (
                          <span className="font-num font-semibold" style={{ color: "var(--c-text)" }}>
                            {c.price.toFixed(2)}
                          </span>
                        ) : <span style={{ color: "var(--c-dim)" }}>—</span>}
                      </td>
                      {/* Change */}
                      <td style={{ textAlign: "right", padding: "10px 14px" }}>
                        {c.change_pct !== null ? (
                          <span className={`badge font-num ${isUp ? "badge-up" : "badge-down"}`}>
                            {isUp ? "+" : ""}{c.change_pct.toFixed(2)}%
                          </span>
                        ) : <span style={{ color: "var(--c-dim)" }}>—</span>}
                      </td>
                      {/* P/E */}
                      <td style={{ textAlign: "right", padding: "10px 14px" }}>
                        <span className="font-num" style={{ fontSize: 12, color: c.pe_ratio !== null ? (c.pe_ratio < 0 ? "var(--c-dim)" : c.pe_ratio < 15 ? "var(--c-green)" : c.pe_ratio < 25 ? "var(--c-text)" : "var(--c-red)") : "var(--c-dim)" }}>
                          {c.pe_ratio !== null ? (c.pe_ratio < 0 ? "N/A" : c.pe_ratio.toFixed(1)) : "—"}
                        </span>
                      </td>
                      {/* Div Yield */}
                      <td style={{ textAlign: "right", padding: "10px 14px" }}>
                        <span className="font-num" style={{ fontSize: 12, color: c.dividend_yield !== null && c.dividend_yield > 0 ? "var(--c-green)" : "var(--c-dim)" }}>
                          {c.dividend_yield !== null ? `${(c.dividend_yield * 100).toFixed(1)}%` : "—"}
                        </span>
                      </td>
                      {/* ROE */}
                      <td style={{ textAlign: "right", padding: "10px 14px" }}>
                        <span className="font-num" style={{ fontSize: 12, color: c.roe !== null ? (c.roe > 0.15 ? "var(--c-green)" : c.roe > 0 ? "var(--c-text)" : "var(--c-red)") : "var(--c-dim)" }}>
                          {c.roe !== null ? `${(c.roe * 100).toFixed(1)}%` : "—"}
                        </span>
                      </td>
                      {/* Market Cap */}
                      <td style={{ textAlign: "right", padding: "10px 14px" }}>
                        <span className="font-num" style={{ fontSize: 12, color: "var(--c-text-sm)" }}>
                          {c.market_cap !== null
                            ? c.market_cap >= 1e12 ? `${(c.market_cap / 1e12).toFixed(1)}T`
                            : c.market_cap >= 1e9 ? `${(c.market_cap / 1e9).toFixed(1)}B`
                            : c.market_cap >= 1e6 ? `${(c.market_cap / 1e6).toFixed(0)}M`
                            : "—"
                            : "—"}
                        </span>
                      </td>
                      {/* Sector */}
                      <td style={{ padding: "10px 14px" }}>
                        <span className="badge badge-neutral" style={{ fontSize: 10 }}>{tSector(locale, c.sector)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
});

export default ScreenerTableComponent;
