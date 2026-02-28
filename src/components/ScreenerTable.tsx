"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronUp, ChevronDown, ChevronsUpDown, Filter } from "lucide-react";
import { t, tSector } from "@/lib/i18n";

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
}

type SortKey = "ticker" | "name_en" | "price" | "change_pct" | "volume";
type SortDir = "asc" | "desc";

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
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("ticker");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [shariah, setShariah] = useState(false);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
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

    return [...list].sort((a, b) => {
      let av: any = a[sortKey] ?? -Infinity;
      let bv: any = b[sortKey] ?? -Infinity;
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [companies, query, sector, sortKey, sortDir, shariah]);

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

          {/* Count */}
          <span style={{ fontSize: 12, color: "var(--c-muted)", marginLeft: "auto" }}>
            {filtered.length} {t(locale, "screener.of")} {companies.length} {t(locale, "screener.companies")}
          </span>
        </div>
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
                  <TH label={t(locale, "screener.col.price")} k="price" right />
                  <TH label={t(locale, "screener.col.change")} k="change_pct" right />
                  <TH label={t(locale, "screener.col.volume")} k="volume" right />
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
                  const name = locale === "ar" && c.name_ar ? c.name_ar : c.name_en;
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
                            <span style={{ fontSize: 8, fontWeight: 800, color: "var(--c-gold)" }}>
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
                            <span className="badge badge-gold" style={{ padding: "1px 6px", fontSize: 9 }}>☽ S</span>
                          )}
                        </div>
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
                      {/* Volume */}
                      <td style={{ textAlign: "right", padding: "10px 14px" }}>
                        <span className="font-num" style={{ color: "var(--c-text-sm)", fontSize: 12 }}>
                          {c.volume
                            ? c.volume >= 1e6
                              ? `${(c.volume / 1e6).toFixed(1)}M`
                              : `${(c.volume / 1e3).toFixed(0)}K`
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
