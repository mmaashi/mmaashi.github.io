"use client";

import Link from "next/link";
import { Eye, ArrowUpRight, ArrowDownRight, Sparkles, X } from "lucide-react";

export interface WatchlistStock {
  ticker: string;
  name: string;
  price: number;
  change: number;
  score: number | null;
  signal: string; // "strong" | "positive" | "neutral" | "caution" | "negative"
  divYield: number | null;
}

interface WatchlistModuleProps {
  stocks: WatchlistStock[];
  locale: string;
  sar: string;
}

const labels: Record<string, { en: string; ar: string }> = {
  title: { en: "My Watchlist", ar: "قائمة المتابعة" },
  empty: { en: "Add stocks to your watchlist from any stock page", ar: "أضف أسهمًا لقائمة المتابعة من أي صفحة سهم" },
  score: { en: "Score", ar: "التقييم" },
  yield: { en: "Yield", ar: "العائد" },
};

function l(locale: string, key: string) {
  return locale === "ar" ? labels[key]?.ar ?? key : labels[key]?.en ?? key;
}

function signalColor(signal: string): string {
  switch (signal) {
    case "strong": return "var(--c-green)";
    case "positive": return "#4ade80";
    case "caution": return "var(--c-gold)";
    case "negative": return "var(--c-red)";
    default: return "var(--c-muted)";
  }
}

export default function WatchlistModule({ stocks, locale, sar }: WatchlistModuleProps) {
  const isAr = locale === "ar";

  return (
    <div className="card" style={{ padding: "18px 20px" }}>
      <div className="flex items-center gap-2 mb-3">
        <Eye size={14} style={{ color: "var(--c-gold)" }} />
        <h3 className="font-bold" style={{ fontSize: 13, color: "var(--c-text)", flex: 1 }}>
          {l(locale, "title")}
        </h3>
        <span style={{ fontSize: 10, color: "var(--c-dim)", fontWeight: 600 }}>{stocks.length}</span>
      </div>

      {stocks.length === 0 ? (
        <p style={{ fontSize: 11, color: "var(--c-dim)", lineHeight: 1.5 }}>{l(locale, "empty")}</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {stocks.map((s) => {
            const isUp = s.change >= 0;
            return (
              <Link
                key={s.ticker}
                href={`/${locale}/stock/${s.ticker}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 10px",
                  borderRadius: 8,
                  background: "var(--c-elevated)",
                  textDecoration: "none",
                  transition: "background 0.15s",
                }}
              >
                {/* Ticker badge */}
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "var(--c-gold-dim)",
                    border: "1px solid var(--c-gold-ring)",
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: 8, fontWeight: 800, color: "var(--c-gold)" }}>
                    {s.ticker.slice(0, 4)}
                  </span>
                </div>

                {/* Name + signal */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex items-center gap-1.5">
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--c-text)" }}>{s.ticker}</span>
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: signalColor(s.signal),
                        flexShrink: 0,
                      }}
                    />
                  </div>
                  <p style={{ fontSize: 9, color: "var(--c-dim)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.name}
                  </p>
                </div>

                {/* Score */}
                {s.score !== null && (
                  <div className="flex items-center gap-1" style={{ flexShrink: 0 }}>
                    <Sparkles size={9} style={{ color: "var(--c-gold)" }} />
                    <span className="font-num font-bold" style={{ fontSize: 12, color: "var(--c-text)" }}>
                      {Math.round(s.score)}
                    </span>
                  </div>
                )}

                {/* Price + change */}
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <span className="font-num font-semibold" style={{ fontSize: 12, color: "var(--c-text)" }}>
                    {s.price.toFixed(2)}
                  </span>
                  <div className="flex items-center justify-end gap-0.5" style={{ marginTop: 1 }}>
                    {isUp ? <ArrowUpRight size={9} style={{ color: "var(--c-green)" }} /> : <ArrowDownRight size={9} style={{ color: "var(--c-red)" }} />}
                    <span className="font-num" style={{ fontSize: 9, color: isUp ? "var(--c-green)" : "var(--c-red)" }}>
                      {isUp ? "+" : ""}{s.change.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
