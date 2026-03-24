"use client";

import { useState } from "react";
import { Briefcase, Eye, Plus, Minus, ArrowUpRight, ArrowDownRight, ChevronRight, Search, X, TrendingUp, TrendingDown } from "lucide-react";
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

export default function PortfolioTabs({
  holdings,
  watchlist,
  sectors,
  locale,
  totalValue,
  totalCost,
  totalGain,
  totalGainPct,
  todayGainAmount,
  todayGainPct,
  annualDividend,
  divYield,
}: {
  holdings: Holding[];
  watchlist: WatchItem[];
  sectors: SectorSlice[];
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
  const [showAddHint, setShowAddHint] = useState(false);

  const sorted = [...holdings].sort((a, b) => {
    if (sortBy === "gain") return b.gainPct - a.gainPct;
    if (sortBy === "today") return b.todayChange - a.todayChange;
    return b.totalValue - a.totalValue;
  });

  const todayUp = todayGainPct >= 0;
  const totalUp = totalGainPct >= 0;

  return (
    <div>
      <style>{`
        .ptab { padding: 10px 20px; font-size: 13px; font-weight: 700; border: none; background: none; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.15s; font-family: var(--font-grotesk); }
        .ptab.active { color: var(--c-gold); border-bottom-color: var(--c-gold); }
        .ptab:not(.active) { color: var(--c-muted); }
        .ptab:not(.active):hover { color: var(--c-text); }
        .hrow { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 40px; align-items: center; padding: 12px 16px; border-bottom: 1px solid var(--c-border); transition: background 0.15s; cursor: pointer; text-decoration: none; gap: 8px; }
        .hrow:hover { background: rgba(200,169,81,0.04); }
        .hrow-head { font-size: 9px; color: var(--c-dim); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; cursor: pointer; }
        .hrow-head:hover { color: var(--c-text); }
        .sort-pill { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 6px; font-size: 10px; font-weight: 600; border: 1px solid var(--c-border); background: none; cursor: pointer; transition: all 0.15s; color: var(--c-muted); }
        .sort-pill.active { background: var(--c-gold-dim); border-color: var(--c-gold-ring); color: var(--c-gold); }
        .wrow { display: flex; align-items: center; padding: 14px 16px; border-bottom: 1px solid var(--c-border); transition: background 0.15s; cursor: pointer; text-decoration: none; gap: 12px; }
        .wrow:hover { background: rgba(200,169,81,0.04); }
        @media (max-width: 700px) {
          .hrow { grid-template-columns: 1.5fr 1fr 1fr 40px; }
          .hrow .hide-m { display: none; }
        }
      `}</style>

      {/* ── Tab bar ── */}
      <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid var(--c-border)", marginBottom: 0, gap: 0 }}>
        <button className={`ptab ${tab === "portfolio" ? "active" : ""}`} onClick={() => setTab("portfolio")}>
          <Briefcase size={13} style={{ marginInlineEnd: 6, verticalAlign: -2 }} />
          {isAr ? "محفظتي" : "Portfolio"}
          <span style={{ fontSize: 10, color: "var(--c-dim)", marginInlineStart: 6 }}>{holdings.length}</span>
        </button>
        <button className={`ptab ${tab === "watchlist" ? "active" : ""}`} onClick={() => setTab("watchlist")}>
          <Eye size={13} style={{ marginInlineEnd: 6, verticalAlign: -2 }} />
          {isAr ? "قائمة المتابعة" : "Watchlist"}
          <span style={{ fontSize: 10, color: "var(--c-dim)", marginInlineStart: 6 }}>{watchlist.length}</span>
        </button>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => setShowAddHint(!showAddHint)}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "7px 14px", borderRadius: 8,
            background: "var(--c-gold)", color: "var(--c-base)",
            fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer",
            fontFamily: "var(--font-grotesk)",
          }}
        >
          <Plus size={13} />
          {isAr ? "إضافة" : "Add"}
        </button>
      </div>

      {/* Add hint */}
      {showAddHint && (
        <div style={{
          padding: "12px 16px", background: "rgba(200,169,81,0.06)", border: "1px solid var(--c-gold-ring)",
          borderRadius: "0 0 10px 10px", display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 8,
        }}>
          <span style={{ fontSize: 12, color: "var(--c-muted)" }}>
            {isAr
              ? "ابحث عن أي سهم سعودي لإضافته إلى محفظتك أو قائمة المتابعة"
              : "Search any Saudi stock to add to your portfolio or watchlist"}
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            <Link href={`/${locale}/screener`} style={{
              padding: "6px 14px", borderRadius: 6, background: "var(--c-gold-dim)",
              border: "1px solid var(--c-gold-ring)", color: "var(--c-gold)",
              fontSize: 11, fontWeight: 600, textDecoration: "none",
            }}>
              <Search size={10} style={{ marginInlineEnd: 4, verticalAlign: -1 }} />
              {isAr ? "تصفح الأسهم" : "Browse Stocks"}
            </Link>
            <button onClick={() => setShowAddHint(false)} style={{
              padding: "6px 8px", borderRadius: 6, background: "none",
              border: "1px solid var(--c-border)", color: "var(--c-muted)",
              fontSize: 11, cursor: "pointer",
            }}>
              <X size={12} />
            </button>
          </div>
        </div>
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
              <Link key={h.ticker} href={`/${locale}/stock/${h.ticker}`} className="hrow" style={{ color: "inherit" }}>
                {/* Stock info */}
                <div>
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
                </div>

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

                {/* Arrow */}
                <div style={{ textAlign: "center" }}>
                  <ChevronRight size={14} style={{ color: "var(--c-dim)" }} />
                </div>
              </Link>
            );
          })}

          {/* ── Total row ── */}
          <div style={{
            display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 40px",
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
        </div>
      )}

      {/* ══════════════════════════════════════════════ */}
      {/* WATCHLIST TAB */}
      {/* ══════════════════════════════════════════════ */}
      {tab === "watchlist" && (
        <div>
          {watchlist.length === 0 ? (
            <div style={{ padding: "60px 20px", textAlign: "center" }}>
              <Eye size={32} style={{ color: "var(--c-dim)", marginBottom: 12 }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--c-text)", marginBottom: 4 }}>
                {isAr ? "قائمة المتابعة فارغة" : "Your watchlist is empty"}
              </p>
              <p style={{ fontSize: 12, color: "var(--c-muted)", marginBottom: 16 }}>
                {isAr ? "أضف أسهمًا لمتابعة أسعارها وتقييماتها" : "Add stocks to track their prices and scores"}
              </p>
              <Link href={`/${locale}/screener`} style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "10px 20px", borderRadius: 8, background: "var(--c-gold)",
                color: "var(--c-base)", fontSize: 12, fontWeight: 700, textDecoration: "none",
              }}>
                <Search size={13} /> {isAr ? "تصفح الأسهم" : "Browse Stocks"}
              </Link>
            </div>
          ) : (
            <>
              {/* Watchlist header */}
              <div style={{
                display: "grid", gridTemplateColumns: "2fr 1fr 1fr 80px",
                padding: "12px 16px", background: "rgba(123,148,184,0.03)",
                borderBottom: "1px solid var(--c-border)", gap: 8,
              }}>
                <span style={{ fontSize: 9, color: "var(--c-dim)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{isAr ? "السهم" : "Stock"}</span>
                <span style={{ fontSize: 9, color: "var(--c-dim)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, textAlign: "right" }}>{isAr ? "السعر" : "Price"}</span>
                <span style={{ fontSize: 9, color: "var(--c-dim)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, textAlign: "right" }}>{isAr ? "التغير" : "Change"}</span>
                <span style={{ fontSize: 9, color: "var(--c-dim)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, textAlign: "center" }}>{isAr ? "التقييم" : "Score"}</span>
              </div>

              {watchlist.map((s) => {
                const wUp = s.change >= 0;
                return (
                  <Link key={s.ticker} href={`/${locale}/stock/${s.ticker}`} style={{ textDecoration: "none", color: "inherit" }}>
                    <div style={{
                      display: "grid", gridTemplateColumns: "2fr 1fr 1fr 80px",
                      padding: "14px 16px", borderBottom: "1px solid var(--c-border)",
                      transition: "background 0.15s", cursor: "pointer", gap: 8,
                    }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(200,169,81,0.04)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <div>
                        <div className="font-num" style={{ fontSize: 14, fontWeight: 700, color: "var(--c-text)" }}>{s.ticker}</div>
                        <div style={{ fontSize: 10, color: "var(--c-muted)", marginTop: 2 }}>{s.name}</div>
                      </div>
                      <div className="font-num" style={{ textAlign: "right", fontSize: 13, fontWeight: 600, color: "var(--c-text)", alignSelf: "center" }}>
                        {s.price.toFixed(2)}
                      </div>
                      <div className="font-num" style={{ textAlign: "right", fontSize: 12, fontWeight: 600, color: wUp ? "var(--c-green)" : "var(--c-red)", alignSelf: "center", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 2 }}>
                        {wUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                        {wUp ? "+" : ""}{s.change.toFixed(2)}%
                      </div>
                      <div style={{ textAlign: "center", alignSelf: "center" }}>
                        {s.score !== null ? (
                          <span className="font-num" style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: `${scoreColor(s.score)}15`, color: scoreColor(s.score) }}>
                            {Math.round(s.score)}
                          </span>
                        ) : (
                          <span style={{ fontSize: 10, color: "var(--c-dim)" }}>—</span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
