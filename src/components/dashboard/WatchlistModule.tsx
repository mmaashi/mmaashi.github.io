"use client";

import Link from "next/link";
import { Eye, ArrowUpRight, ArrowDownRight, Sparkles, Info } from "lucide-react";

export interface WatchlistStock {
  ticker: string;
  name: string;
  price: number;
  change: number;
  score: number | null;
  signal: string;
  signalLine: { en: string; ar: string };
  divYield: number | null;
}

export interface WatchlistInsight {
  line: { en: string; ar: string };
  color: string;
}

interface WatchlistModuleProps {
  stocks: WatchlistStock[];
  insights: WatchlistInsight[];
  locale: string;
  sar: string;
}

function signalDot(signal: string): string {
  switch (signal) {
    case "strong": return "var(--c-green)";
    case "positive": return "#4ade80";
    case "caution": return "var(--c-gold)";
    case "negative": return "var(--c-red)";
    default: return "var(--c-muted)";
  }
}

export default function WatchlistModule({ stocks, insights, locale, sar }: WatchlistModuleProps) {
  const isAr = locale === "ar";

  return (
    <div className="watchlist-block" style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 14 }}>
      {/* Left: Table */}
      <div className="card" style={{ padding: "18px 20px", overflow: "hidden" }}>
        <div className="flex items-center gap-2 mb-3">
          <Eye size={13} style={{ color: "var(--c-gold)" }} />
          <h3 className="font-bold" style={{ fontSize: 13, color: "var(--c-text)", flex: 1 }}>
            {isAr ? "قائمة المتابعة" : "My watchlist"}
          </h3>
          <span style={{ fontSize: 10, color: "var(--c-dim)", fontWeight: 600 }}>{stocks.length}</span>
        </div>

        {stocks.length === 0 ? (
          <p style={{ fontSize: 11, color: "var(--c-dim)" }}>{isAr ? "أضف أسهمًا لقائمة المتابعة" : "Add stocks to track them here"}</p>
        ) : (
          <div className="overflow-x-auto">
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {[
                    isAr ? "السهم" : "Stock",
                    isAr ? "السعر" : "Price",
                    isAr ? "اليوم" : "Today",
                    isAr ? "التقييم" : "Score",
                    isAr ? "الإشارة" : "Signal",
                  ].map((h, i) => (
                    <th key={i} style={{ fontSize: 9, fontWeight: 700, color: "var(--c-dim)", letterSpacing: "0.06em", textTransform: "uppercase", padding: "6px 4px", textAlign: i === 0 ? "left" : "right", borderBottom: "1px solid var(--c-border)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stocks.map((s) => {
                  const isUp = s.change >= 0;
                  return (
                    <tr key={s.ticker}>
                      <td style={{ padding: "8px 4px" }}>
                        <Link href={`/${locale}/stock/${s.ticker}`} style={{ textDecoration: "none" }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--c-text)" }}>{s.ticker}</span>
                          <span style={{ fontSize: 9, color: "var(--c-dim)", marginLeft: 6 }}>{s.name}</span>
                        </Link>
                      </td>
                      <td style={{ padding: "8px 4px", textAlign: "right" }}>
                        <span className="font-num" style={{ fontSize: 11, color: "var(--c-text)" }}>{s.price.toFixed(2)}</span>
                      </td>
                      <td style={{ padding: "8px 4px", textAlign: "right" }}>
                        <span className="font-num flex items-center justify-end gap-0.5" style={{ fontSize: 10, color: isUp ? "var(--c-green)" : "var(--c-red)" }}>
                          {isUp ? <ArrowUpRight size={9} /> : <ArrowDownRight size={9} />}
                          {isUp ? "+" : ""}{s.change.toFixed(1)}%
                        </span>
                      </td>
                      <td style={{ padding: "8px 4px", textAlign: "right" }}>
                        {s.score !== null ? (
                          <span className="font-num font-bold" style={{ fontSize: 11, color: "var(--c-gold)" }}>
                            {Math.round(s.score)}
                          </span>
                        ) : (
                          <span style={{ fontSize: 10, color: "var(--c-dim)" }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "8px 4px", textAlign: "right" }}>
                        <div className="flex items-center justify-end gap-1.5">
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: signalDot(s.signal), flexShrink: 0 }} />
                          <span style={{ fontSize: 9, color: "var(--c-muted)" }}>
                            {isAr ? s.signalLine.ar : s.signalLine.en}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Right: Insights */}
      <div className="card" style={{ padding: "18px 20px" }}>
        <div className="flex items-center gap-2 mb-3">
          <Info size={13} style={{ color: "var(--c-muted)" }} />
          <h3 className="font-bold" style={{ fontSize: 13, color: "var(--c-text)" }}>
            {isAr ? "ملخص قائمتك" : "Watchlist insights"}
          </h3>
        </div>

        {insights.length === 0 ? (
          <p style={{ fontSize: 11, color: "var(--c-dim)" }}>{isAr ? "لا تغييرات ملحوظة" : "No notable changes"}</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {insights.map((ins, i) => (
              <div key={i} className="flex items-start gap-2">
                <div style={{ width: 4, height: 4, borderRadius: "50%", background: ins.color, marginTop: 5, flexShrink: 0 }} />
                <p style={{ fontSize: 11, color: "var(--c-text-sm)", lineHeight: 1.5, margin: 0 }}>
                  {isAr ? ins.line.ar : ins.line.en}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 800px) { .watchlist-block { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
