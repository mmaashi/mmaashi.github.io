"use client";

import { useState, useRef, useEffect } from "react";
import { Briefcase, Eye, Plus, ArrowUpRight, ArrowDownRight, ChevronRight, X, TrendingUp, TrendingDown, Check, Trash2 } from "lucide-react";
import Link from "next/link";

// ── Types ──
interface Holding {
  ticker: string;
  name: string;
  sector: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  totalValue: number;
  gainLoss: number;
  gainPct: number;
  todayChange: number;
  weight: number;
  overallScore: number | null;
}

interface WatchItem {
  ticker: string;
  name: string;
  price: number;
  change: number;
  score: number | null;
  divYield: number | null;
}

interface SectorSlice {
  sector: string;
  sectorLocal: string;
  weight: number;
  color: string;
}

interface StockOption {
  ticker: string;
  name: string;
}

function scoreColor(s: number): string {
  if (s >= 75) return "var(--c-green)";
  if (s >= 55) return "var(--c-gold)";
  if (s >= 35) return "var(--c-text)";
  return "var(--c-red)";
}

function fmtSAR(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

// ══════════════════════════════════════════════════
// Inline Stock Search + Add Component
// ══════════════════════════════════════════════════
function InlineAddStock({
  allStocks,
  existingTickers,
  locale,
  mode,
  onAdd,
  onClose,
}: {
  allStocks: StockOption[];
  existingTickers: Set<string>;
  locale: string;
  mode: "portfolio" | "watchlist";
  onAdd: (ticker: string, shares?: number, avgCost?: number) => void;
  onClose: () => void;
}) {
  const isAr = locale === "ar";
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<StockOption | null>(null);
  const [shares, setShares] = useState("");
  const [avgCost, setAvgCost] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const filtered = query.length > 0
    ? allStocks
        .filter((s) => !existingTickers.has(s.ticker))
        .filter((s) =>
          s.ticker.includes(query) ||
          s.name.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 8)
    : [];

  const handleSelect = (stock: StockOption) => {
    if (mode === "watchlist") {
      onAdd(stock.ticker);
      setQuery("");
      setSelected(null);
    } else {
      setSelected(stock);
      setQuery("");
    }
  };

  const handleConfirm = () => {
    if (!selected) return;
    const s = parseInt(shares) || 0;
    const c = parseFloat(avgCost) || 0;
    if (s <= 0) return;
    onAdd(selected.ticker, s, c);
    setSelected(null);
    setShares("");
    setAvgCost("");
  };

  return (
    <div style={{
      padding: "14px 16px",
      background: "rgba(200,169,81,0.04)",
      borderBottom: "1px solid var(--c-gold-ring)",
    }}>
      {!selected ? (
        /* ── Search mode ── */
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{
              flex: 1, display: "flex", alignItems: "center", gap: 8,
              padding: "8px 12px", borderRadius: 8,
              background: "var(--c-surface)", border: "1px solid var(--c-border)",
            }}>
              <span style={{ fontSize: 12, color: "var(--c-dim)" }}>#</span>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={isAr ? "اكتب رمز السهم أو اسمه..." : "Type ticker or name..."}
                style={{
                  flex: 1, background: "none", border: "none", outline: "none",
                  color: "var(--c-text)", fontSize: 13, fontFamily: "var(--font-grotesk)",
                }}
              />
              {query && (
                <button onClick={() => setQuery("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  <X size={12} style={{ color: "var(--c-dim)" }} />
                </button>
              )}
            </div>
            <button onClick={onClose} style={{
              padding: "8px 12px", borderRadius: 8,
              background: "none", border: "1px solid var(--c-border)",
              color: "var(--c-muted)", fontSize: 11, cursor: "pointer",
            }}>
              {isAr ? "إلغاء" : "Cancel"}
            </button>
          </div>

          {/* Results dropdown */}
          {filtered.length > 0 && (
            <div style={{
              borderRadius: 8, overflow: "hidden",
              border: "1px solid var(--c-border)", background: "var(--c-surface)",
            }}>
              {filtered.map((s) => (
                <button
                  key={s.ticker}
                  onClick={() => handleSelect(s)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, width: "100%",
                    padding: "10px 14px", background: "none", border: "none",
                    borderBottom: "1px solid var(--c-border)", cursor: "pointer",
                    textAlign: "left", transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(200,169,81,0.06)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <span className="font-num" style={{
                    fontSize: 13, fontWeight: 700, color: "var(--c-gold)",
                    minWidth: 40,
                  }}>
                    {s.ticker}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--c-text)", flex: 1 }}>{s.name}</span>
                  {mode === "watchlist" ? (
                    <Eye size={13} style={{ color: "var(--c-dim)" }} />
                  ) : (
                    <Plus size={13} style={{ color: "var(--c-dim)" }} />
                  )}
                </button>
              ))}
            </div>
          )}

          {query.length > 0 && filtered.length === 0 && (
            <div style={{ padding: "12px 0", textAlign: "center", fontSize: 12, color: "var(--c-muted)" }}>
              {isAr ? "لم يتم العثور على نتائج" : "No stocks found"}
            </div>
          )}
        </div>
      ) : (
        /* ── Shares & cost input mode ── */
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span className="font-num" style={{ fontSize: 14, fontWeight: 700, color: "var(--c-gold)" }}>
              {selected.ticker}
            </span>
            <span style={{ fontSize: 12, color: "var(--c-text)" }}>{selected.name}</span>
            <button onClick={() => setSelected(null)} style={{
              marginInlineStart: "auto", background: "none", border: "none",
              cursor: "pointer", color: "var(--c-muted)", fontSize: 11,
            }}>
              {isAr ? "تغيير" : "Change"}
            </button>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 9, color: "var(--c-dim)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>
                {isAr ? "عدد الأسهم" : "Shares"} *
              </label>
              <input
                type="number"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                placeholder="100"
                autoFocus
                style={{
                  width: "100%", padding: "8px 12px", borderRadius: 8,
                  background: "var(--c-surface)", border: "1px solid var(--c-border)",
                  color: "var(--c-text)", fontSize: 14, fontFamily: "var(--font-grotesk)",
                  outline: "none",
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 9, color: "var(--c-dim)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>
                {isAr ? "متوسط التكلفة" : "Avg Cost"} (SAR)
              </label>
              <input
                type="number"
                value={avgCost}
                onChange={(e) => setAvgCost(e.target.value)}
                placeholder="0.00"
                step="0.01"
                style={{
                  width: "100%", padding: "8px 12px", borderRadius: 8,
                  background: "var(--c-surface)", border: "1px solid var(--c-border)",
                  color: "var(--c-text)", fontSize: 14, fontFamily: "var(--font-grotesk)",
                  outline: "none",
                }}
              />
            </div>
            <button
              onClick={handleConfirm}
              disabled={!shares || parseInt(shares) <= 0}
              style={{
                padding: "8px 16px", borderRadius: 8,
                background: parseInt(shares) > 0 ? "var(--c-green)" : "var(--c-border)",
                color: parseInt(shares) > 0 ? "#fff" : "var(--c-dim)",
                border: "none", cursor: parseInt(shares) > 0 ? "pointer" : "default",
                fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4,
                fontFamily: "var(--font-grotesk)", whiteSpace: "nowrap",
              }}
            >
              <Check size={13} />
              {isAr ? "أضف" : "Add"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════
// Main PortfolioTabs Component
// ══════════════════════════════════════════════════
export default function PortfolioTabs({
  holdings: initialHoldings,
  watchlist: initialWatchlist,
  sectors,
  allStocks,
  locale,
  totalValue: initTotalValue,
  totalCost: initTotalCost,
  totalGain: initTotalGain,
  totalGainPct: initTotalGainPct,
  todayGainAmount,
  todayGainPct,
  annualDividend,
  divYield,
}: {
  holdings: Holding[];
  watchlist: WatchItem[];
  sectors: SectorSlice[];
  allStocks: StockOption[];
  locale: string;
  totalValue: number;
  totalCost: number;
  totalGain: number;
  totalGainPct: number;
  todayGainAmount: number;
  todayGainPct: number;
  annualDividend: number;
  divYield: number;
}) {
  const isAr = locale === "ar";
  const [tab, setTab] = useState<"portfolio" | "watchlist">("portfolio");
  const [sortBy, setSortBy] = useState<"value" | "gain" | "today">("value");
  const [showAdd, setShowAdd] = useState(false);

  // Client-side added holdings (demo — not persisted)
  const [extraHoldings, setExtraHoldings] = useState<Holding[]>([]);
  const [extraWatchlist, setExtraWatchlist] = useState<WatchItem[]>([]);
  const [removedTickers, setRemovedTickers] = useState<Set<string>>(new Set());

  const holdings = [
    ...initialHoldings.filter((h) => !removedTickers.has(h.ticker)),
    ...extraHoldings,
  ];
  const watchlist = [
    ...initialWatchlist.filter((w) => !removedTickers.has(w.ticker)),
    ...extraWatchlist,
  ];

  // Recalculate totals with extras
  const totalValue = holdings.reduce((s, h) => s + h.totalValue, 0);
  const totalCost = holdings.reduce((s, h) => s + h.shares * h.avgCost, 0);
  const totalGain = totalValue - totalCost;
  const totalGainPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

  const existingTickers = new Set([
    ...holdings.map((h) => h.ticker),
    ...watchlist.map((w) => w.ticker),
  ]);

  const sorted = [...holdings].sort((a, b) => {
    if (sortBy === "gain") return b.gainPct - a.gainPct;
    if (sortBy === "today") return b.todayChange - a.todayChange;
    return b.totalValue - a.totalValue;
  });

  // Recalculate weights
  for (const h of sorted) h.weight = totalValue > 0 ? (h.totalValue / totalValue) * 100 : 0;

  const todayUp = todayGainPct >= 0;
  const totalUp = totalGainPct >= 0;

  const handleAddHolding = (ticker: string, shares?: number, avgCost?: number) => {
    const stock = allStocks.find((s) => s.ticker === ticker);
    if (!stock || !shares) return;
    const cost = avgCost || 0;
    setExtraHoldings((prev) => [
      ...prev,
      {
        ticker,
        name: stock.name,
        sector: "Other",
        shares,
        avgCost: cost,
        currentPrice: cost || 0,
        totalValue: (cost || 0) * shares,
        gainLoss: 0,
        gainPct: 0,
        todayChange: 0,
        weight: 0,
        overallScore: null,
      },
    ]);
    setShowAdd(false);
  };

  const handleAddWatchlist = (ticker: string) => {
    const stock = allStocks.find((s) => s.ticker === ticker);
    if (!stock) return;
    setExtraWatchlist((prev) => [
      ...prev,
      { ticker, name: stock.name, price: 0, change: 0, score: null, divYield: null },
    ]);
  };

  const handleRemove = (ticker: string) => {
    setRemovedTickers((prev) => new Set([...prev, ticker]));
    setExtraHoldings((prev) => prev.filter((h) => h.ticker !== ticker));
    setExtraWatchlist((prev) => prev.filter((w) => w.ticker !== ticker));
  };

  return (
    <div>
      <style>{`
        .ptab { padding: 10px 20px; font-size: 13px; font-weight: 700; border: none; background: none; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.15s; font-family: var(--font-grotesk); }
        .ptab.active { color: var(--c-gold); border-bottom-color: var(--c-gold); }
        .ptab:not(.active) { color: var(--c-muted); }
        .ptab:not(.active):hover { color: var(--c-text); }
        .hrow { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 36px; align-items: center; padding: 12px 16px; border-bottom: 1px solid var(--c-border); transition: background 0.15s; cursor: pointer; text-decoration: none; gap: 8px; }
        .hrow:hover { background: rgba(200,169,81,0.04); }
        .hrow-head { font-size: 9px; color: var(--c-dim); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; cursor: pointer; }
        .sort-pill { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 6px; font-size: 10px; font-weight: 600; border: 1px solid var(--c-border); background: none; cursor: pointer; transition: all 0.15s; color: var(--c-muted); }
        .sort-pill.active { background: var(--c-gold-dim); border-color: var(--c-gold-ring); color: var(--c-gold); }
        .rm-btn { opacity: 0; transition: opacity 0.15s; background: none; border: none; cursor: pointer; padding: 4px; border-radius: 4px; }
        .hrow:hover .rm-btn { opacity: 1; }
        .rm-btn:hover { background: rgba(248,113,113,0.1); }
        @media (max-width: 700px) {
          .hrow { grid-template-columns: 1.5fr 1fr 1fr 36px; }
          .hrow .hide-m { display: none; }
        }
      `}</style>

      {/* ── Tab bar ── */}
      <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid var(--c-border)", gap: 0 }}>
        <button className={`ptab ${tab === "portfolio" ? "active" : ""}`} onClick={() => { setTab("portfolio"); setShowAdd(false); }}>
          <Briefcase size={13} style={{ marginInlineEnd: 6, verticalAlign: -2 }} />
          {isAr ? "محفظتي" : "Portfolio"}
          <span style={{ fontSize: 10, color: "var(--c-dim)", marginInlineStart: 6 }}>{holdings.length}</span>
        </button>
        <button className={`ptab ${tab === "watchlist" ? "active" : ""}`} onClick={() => { setTab("watchlist"); setShowAdd(false); }}>
          <Eye size={13} style={{ marginInlineEnd: 6, verticalAlign: -2 }} />
          {isAr ? "قائمة المتابعة" : "Watchlist"}
          <span style={{ fontSize: 10, color: "var(--c-dim)", marginInlineStart: 6 }}>{watchlist.length}</span>
        </button>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => setShowAdd(!showAdd)}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "7px 14px", marginInlineEnd: 12, borderRadius: 8,
            background: showAdd ? "var(--c-border)" : "var(--c-gold)",
            color: showAdd ? "var(--c-muted)" : "var(--c-base)",
            fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer",
            fontFamily: "var(--font-grotesk)", transition: "all 0.15s",
          }}
        >
          {showAdd ? <X size={13} /> : <Plus size={13} />}
          {showAdd ? (isAr ? "إلغاء" : "Cancel") : (isAr ? "إضافة" : "Add")}
        </button>
      </div>

      {/* ── Inline Add ── */}
      {showAdd && (
        <InlineAddStock
          allStocks={allStocks}
          existingTickers={existingTickers}
          locale={locale}
          mode={tab}
          onAdd={tab === "portfolio" ? handleAddHolding : handleAddWatchlist}
          onClose={() => setShowAdd(false)}
        />
      )}

      {/* ══════════════════════════════════════════════ */}
      {/* PORTFOLIO TAB */}
      {/* ══════════════════════════════════════════════ */}
      {tab === "portfolio" && (
        <div>
          {/* ── Value Hero ── */}
          <div style={{ padding: "28px 20px 24px", borderBottom: "1px solid var(--c-border)" }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--c-dim)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
                  {isAr ? "إجمالي القيمة" : "Total Value"}
                </div>
                <div className="font-num" style={{ fontSize: 36, fontWeight: 800, color: "var(--c-text)", lineHeight: 1 }}>
                  {fmtSAR(totalValue)} <span style={{ fontSize: 16, color: "var(--c-muted)", fontWeight: 600 }}>SAR</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 20, paddingBottom: 4 }}>
                <div>
                  <div style={{ fontSize: 9, color: "var(--c-dim)", textTransform: "uppercase", marginBottom: 2 }}>{isAr ? "اليوم" : "Today"}</div>
                  <div className="font-num" style={{ fontSize: 15, fontWeight: 700, color: todayUp ? "var(--c-green)" : "var(--c-red)", display: "flex", alignItems: "center", gap: 3 }}>
                    {todayUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {todayUp ? "+" : ""}{todayGainPct.toFixed(2)}%
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: "var(--c-dim)", textTransform: "uppercase", marginBottom: 2 }}>{isAr ? "إجمالي العائد" : "Total Return"}</div>
                  <div className="font-num" style={{ fontSize: 15, fontWeight: 700, color: totalUp ? "var(--c-green)" : "var(--c-red)" }}>
                    {totalUp ? "+" : ""}{totalGainPct.toFixed(1)}%
                    <span style={{ fontSize: 11, fontWeight: 500, color: "var(--c-muted)", marginInlineStart: 4 }}>
                      ({totalUp ? "+" : ""}{fmtSAR(totalGain)})
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick stats */}
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              {[
                { label: isAr ? "المستثمر" : "Invested", value: `${fmtSAR(totalCost)} SAR`, color: "var(--c-text)" },
                { label: isAr ? "التوزيعات/سنة" : "Dividends/yr", value: `${fmtSAR(annualDividend)} SAR`, color: "var(--c-green)" },
                { label: isAr ? "عائد التوزيعات" : "Div. Yield", value: `${divYield.toFixed(1)}%`, color: divYield > 3 ? "var(--c-green)" : "var(--c-gold)" },
              ].map((s, i) => (
                <div key={i}>
                  <div style={{ fontSize: 9, color: "var(--c-dim)", textTransform: "uppercase", marginBottom: 2, letterSpacing: "0.04em" }}>{s.label}</div>
                  <div className="font-num" style={{ fontSize: 13, fontWeight: 600, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Sector Bar ── */}
          {sectors.length > 0 && (
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--c-border)" }}>
              <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", marginBottom: 10 }}>
                {sectors.map((s, i) => (
                  <div key={i} style={{ width: `${s.weight}%`, background: s.color, minWidth: s.weight > 3 ? 3 : 1 }} title={`${s.sectorLocal}: ${s.weight.toFixed(1)}%`} />
                ))}
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {sectors.slice(0, 6).map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 6, height: 6, borderRadius: 2, background: s.color }} />
                    <span style={{ fontSize: 10, color: "var(--c-muted)" }}>{s.sectorLocal} <span className="font-num" style={{ fontWeight: 600, color: "var(--c-text)" }}>{s.weight.toFixed(0)}%</span></span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Sort bar ── */}
          <div style={{ padding: "12px 20px", display: "flex", alignItems: "center", gap: 6, borderBottom: "1px solid var(--c-border)" }}>
            <span style={{ fontSize: 10, color: "var(--c-dim)", marginInlineEnd: 4 }}>{isAr ? "ترتيب:" : "Sort:"}</span>
            {(["value", "gain", "today"] as const).map((s) => (
              <button key={s} className={`sort-pill ${sortBy === s ? "active" : ""}`} onClick={() => setSortBy(s)}>
                {s === "value" ? (isAr ? "القيمة" : "Value") : s === "gain" ? (isAr ? "الربح" : "P&L") : (isAr ? "اليوم" : "Today")}
              </button>
            ))}
          </div>

          {/* ── Holdings table header ── */}
          <div className="hrow" style={{ background: "rgba(123,148,184,0.03)", cursor: "default" }}>
            <span className="hrow-head">{isAr ? "السهم" : "Stock"}</span>
            <span className="hrow-head" style={{ textAlign: "right" }}>{isAr ? "السعر" : "Price"}</span>
            <span className="hrow-head hide-m" style={{ textAlign: "right" }}>{isAr ? "الأسهم" : "Shares"}</span>
            <span className="hrow-head" style={{ textAlign: "right" }}>{isAr ? "القيمة" : "Value"}</span>
            <span className="hrow-head hide-m" style={{ textAlign: "right" }}>{isAr ? "الربح/الخسارة" : "P&L"}</span>
            <span />
          </div>

          {/* ── Holdings rows ── */}
          {sorted.map((h) => {
            const gainUp = h.gainPct >= 0;
            const dayUp = h.todayChange >= 0;

            return (
              <div key={h.ticker} className="hrow" style={{ position: "relative" }}>
                {/* Stock info — clickable link */}
                <Link href={`/${locale}/stock/${h.ticker}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span className="font-num" style={{ fontSize: 14, fontWeight: 700, color: "var(--c-text)" }}>{h.ticker}</span>
                    {h.overallScore !== null && (
                      <span className="font-num" style={{ fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 4, background: `${scoreColor(h.overallScore)}15`, color: scoreColor(h.overallScore) }}>
                        {Math.round(h.overallScore)}
                      </span>
                    )}
                    <span style={{ fontSize: 10, fontWeight: 600, color: dayUp ? "var(--c-green)" : "var(--c-red)", display: "flex", alignItems: "center", gap: 1 }}>
                      {dayUp ? <ArrowUpRight size={9} /> : <ArrowDownRight size={9} />}
                      {dayUp ? "+" : ""}{h.todayChange.toFixed(1)}%
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: "var(--c-muted)", marginTop: 2 }}>{h.name}</div>
                </Link>

                {/* Price */}
                <div className="font-num" style={{ textAlign: "right", fontSize: 13, fontWeight: 600, color: "var(--c-text)" }}>
                  {h.currentPrice.toFixed(2)}
                </div>

                {/* Shares */}
                <div className="font-num hide-m" style={{ textAlign: "right", fontSize: 12, color: "var(--c-muted)" }}>
                  {h.shares}
                  <div style={{ fontSize: 9, color: "var(--c-dim)" }}>@ {h.avgCost.toFixed(2)}</div>
                </div>

                {/* Value */}
                <div style={{ textAlign: "right" }}>
                  <div className="font-num" style={{ fontSize: 13, fontWeight: 600, color: "var(--c-text)" }}>
                    {fmtSAR(h.totalValue)}
                  </div>
                  <div style={{ fontSize: 9, color: "var(--c-dim)" }}>{h.weight.toFixed(0)}%</div>
                </div>

                {/* P&L */}
                <div className="hide-m" style={{ textAlign: "right" }}>
                  <div className="font-num" style={{ fontSize: 12, fontWeight: 600, color: gainUp ? "var(--c-green)" : "var(--c-red)" }}>
                    {gainUp ? "+" : ""}{h.gainPct.toFixed(1)}%
                  </div>
                  <div className="font-num" style={{ fontSize: 9, color: gainUp ? "var(--c-green)" : "var(--c-red)" }}>
                    {gainUp ? "+" : ""}{fmtSAR(h.gainLoss)}
                  </div>
                </div>

                {/* Remove button */}
                <div style={{ textAlign: "center" }}>
                  <button className="rm-btn" onClick={() => handleRemove(h.ticker)} title={isAr ? "إزالة" : "Remove"}>
                    <Trash2 size={12} style={{ color: "var(--c-red)" }} />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Empty state */}
          {sorted.length === 0 && (
            <div style={{ padding: "48px 20px", textAlign: "center" }}>
              <Briefcase size={28} style={{ color: "var(--c-dim)", marginBottom: 8 }} />
              <p style={{ fontSize: 13, color: "var(--c-muted)" }}>
                {isAr ? "محفظتك فارغة — اضغط \"إضافة\" لبدء التتبع" : "Portfolio is empty — tap \"Add\" to start tracking"}
              </p>
            </div>
          )}

          {/* ── Total row ── */}
          {sorted.length > 0 && (
            <div style={{
              display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 36px",
              padding: "14px 16px", background: "rgba(200,169,81,0.04)", borderTop: "2px solid var(--c-gold-ring)",
              gap: 8,
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--c-gold)" }}>{isAr ? "الإجمالي" : "Total"}</span>
              <span />
              <span className="hide-m" />
              <div className="font-num" style={{ textAlign: "right", fontSize: 13, fontWeight: 700, color: "var(--c-text)" }}>
                {fmtSAR(totalValue)}
              </div>
              <div className="font-num hide-m" style={{ textAlign: "right", fontSize: 12, fontWeight: 700, color: totalUp ? "var(--c-green)" : "var(--c-red)" }}>
                {totalUp ? "+" : ""}{totalGainPct.toFixed(1)}%
              </div>
              <span />
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════ */}
      {/* WATCHLIST TAB */}
      {/* ══════════════════════════════════════════════ */}
      {tab === "watchlist" && (
        <div>
          {watchlist.length === 0 && !showAdd ? (
            <div style={{ padding: "60px 20px", textAlign: "center" }}>
              <Eye size={32} style={{ color: "var(--c-dim)", marginBottom: 12 }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--c-text)", marginBottom: 4 }}>
                {isAr ? "قائمة المتابعة فارغة" : "Your watchlist is empty"}
              </p>
              <p style={{ fontSize: 12, color: "var(--c-muted)", marginBottom: 16 }}>
                {isAr ? "اضغط \"إضافة\" لمتابعة أسهم" : "Tap \"Add\" to start watching stocks"}
              </p>
            </div>
          ) : (
            <>
              {/* Watchlist header */}
              <div style={{
                display: "grid", gridTemplateColumns: "2fr 1fr 1fr 80px 36px",
                padding: "12px 16px", background: "rgba(123,148,184,0.03)",
                borderBottom: "1px solid var(--c-border)", gap: 8,
              }}>
                <span style={{ fontSize: 9, color: "var(--c-dim)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{isAr ? "السهم" : "Stock"}</span>
                <span style={{ fontSize: 9, color: "var(--c-dim)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, textAlign: "right" }}>{isAr ? "السعر" : "Price"}</span>
                <span style={{ fontSize: 9, color: "var(--c-dim)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, textAlign: "right" }}>{isAr ? "التغير" : "Change"}</span>
                <span style={{ fontSize: 9, color: "var(--c-dim)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, textAlign: "center" }}>{isAr ? "التقييم" : "Score"}</span>
                <span />
              </div>

              {watchlist.map((s) => {
                const wUp = s.change >= 0;
                return (
                  <div key={s.ticker} style={{
                    display: "grid", gridTemplateColumns: "2fr 1fr 1fr 80px 36px",
                    padding: "14px 16px", borderBottom: "1px solid var(--c-border)",
                    transition: "background 0.15s", gap: 8, alignItems: "center",
                  }}
                    className="hrow-wrap"
                  >
                    <Link href={`/${locale}/stock/${s.ticker}`} style={{ textDecoration: "none", color: "inherit" }}>
                      <div className="font-num" style={{ fontSize: 14, fontWeight: 700, color: "var(--c-text)" }}>{s.ticker}</div>
                      <div style={{ fontSize: 10, color: "var(--c-muted)", marginTop: 2 }}>{s.name}</div>
                    </Link>
                    <div className="font-num" style={{ textAlign: "right", fontSize: 13, fontWeight: 600, color: "var(--c-text)" }}>
                      {s.price > 0 ? s.price.toFixed(2) : "—"}
                    </div>
                    <div className="font-num" style={{ textAlign: "right", fontSize: 12, fontWeight: 600, color: wUp ? "var(--c-green)" : "var(--c-red)", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 2 }}>
                      {s.price > 0 ? (
                        <>
                          {wUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                          {wUp ? "+" : ""}{s.change.toFixed(2)}%
                        </>
                      ) : "—"}
                    </div>
                    <div style={{ textAlign: "center" }}>
                      {s.score !== null ? (
                        <span className="font-num" style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: `${scoreColor(s.score)}15`, color: scoreColor(s.score) }}>
                          {Math.round(s.score)}
                        </span>
                      ) : (
                        <span style={{ fontSize: 10, color: "var(--c-dim)" }}>—</span>
                      )}
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <button
                        onClick={() => handleRemove(s.ticker)}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 4, opacity: 0.4, transition: "opacity 0.15s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.4")}
                        title={isAr ? "إزالة" : "Remove"}
                      >
                        <X size={12} style={{ color: "var(--c-red)" }} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
