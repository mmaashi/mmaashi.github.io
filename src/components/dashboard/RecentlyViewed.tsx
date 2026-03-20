"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, ArrowUpRight, ArrowDownRight } from "lucide-react";

export interface RecentStock {
  ticker: string;
  name: string;
  price: number;
  change: number;
}

interface RecentlyViewedProps {
  stocks: RecentStock[];
  locale: string;
}

const labels: Record<string, { en: string; ar: string }> = {
  title: { en: "Recently Viewed", ar: "شوهدت مؤخرًا" },
  empty: { en: "Stocks you visit will appear here", ar: "الأسهم التي تزورها ستظهر هنا" },
};

function l(locale: string, key: string) {
  return locale === "ar" ? labels[key]?.ar ?? key : labels[key]?.en ?? key;
}

export default function RecentlyViewed({ stocks, locale }: RecentlyViewedProps) {
  return (
    <div className="card" style={{ padding: "18px 20px" }}>
      <div className="flex items-center gap-2 mb-3">
        <Clock size={14} style={{ color: "var(--c-muted)" }} />
        <h3 className="font-bold" style={{ fontSize: 13, color: "var(--c-text)", flex: 1 }}>
          {l(locale, "title")}
        </h3>
      </div>

      {stocks.length === 0 ? (
        <p style={{ fontSize: 11, color: "var(--c-dim)" }}>{l(locale, "empty")}</p>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {stocks.map((s) => {
            const isUp = s.change >= 0;
            return (
              <Link
                key={s.ticker}
                href={`/${locale}/stock/${s.ticker}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 10px",
                  borderRadius: 8,
                  background: "var(--c-elevated)",
                  textDecoration: "none",
                  border: "1px solid var(--c-border)",
                  transition: "border-color 0.15s",
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--c-text)" }}>{s.ticker}</span>
                <span className="font-num" style={{ fontSize: 11, color: "var(--c-muted)" }}>{s.price.toFixed(2)}</span>
                <span className="font-num flex items-center gap-0.5" style={{ fontSize: 10, color: isUp ? "var(--c-green)" : "var(--c-red)" }}>
                  {isUp ? <ArrowUpRight size={9} /> : <ArrowDownRight size={9} />}
                  {isUp ? "+" : ""}{s.change.toFixed(1)}%
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
