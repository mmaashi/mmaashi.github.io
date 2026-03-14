"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronUp, ChevronDown, ChevronsUpDown, Filter, Gauge } from "lucide-react";
import { t, tSector } from "@/lib/i18n";
import { displayName } from "@/lib/display-names";

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

export default function ScreenerTable({
  companies,
  sectors,
  locale,
}: {
  companies: Company[];
  sectors: string[];
  locale: string;
}) {
  const router = useRouter();
  const isAr = locale === "ar";
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("suqai_score");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [shariah, setShariah] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Advanced filters
  const [minScore, setMinScore] = useState<string>("");
  const [maxPE, setMaxPE] = useState<string>("");
  const [minDivYield, setMinDivYield] = useState<string>("");
  const [minROE, setMinROE] = useState<string>("");
  const [maxDE, setMaxDE] = useState<string>("");

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir(key === "ticker" || key === "name_en" ? "asc" : "desc"); }
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
  }, [companies, query, sector, sortKey, sortDir, shariah, minScore, maxPE, minDivYield, minROE, maxDE]);

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
                            <span className="font-num font-bold" style={{ fontSize: 14, color: tierColor(c.score_tier) }}>
                              {c.suqai_score.toFixed(0)}
                            </span>
                            {c.score_tier && (
                              <span style={{
                                fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 4,
                                background: tierBg(c.score_tier), color: tierColor(c.score_tier),
                                whiteSpace: "nowrap",
                              }}>
                                {c.score_tier}
                              </span>
                            )}
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
}
