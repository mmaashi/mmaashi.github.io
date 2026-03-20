"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, Zap } from "lucide-react";
import { t } from "@/lib/i18n";
import Link from "next/link";

interface StockMover {
  symbol: string;
  name: string;
  name_en: string | null;
  name_ar?: string;
  price: number;
  change: number;
  change_percent: number;
  volume: number;
}

interface MoversClientProps {
  locale: string;
  gainers: StockMover[];
  losers: StockMover[];
  mostActive: StockMover[];
}

function StockCard({
  stock,
  locale,
  showChange = true,
}: {
  stock: StockMover;
  locale: string;
  showChange?: boolean;
}) {
  const isAr = locale === "ar";
  const displayName = isAr && stock.name_ar ? stock.name_ar : stock.name_en || stock.name;
  const isPositive = stock.change_percent > 0;
  const isNegative = stock.change_percent < 0;
  const changeColor = isPositive ? "var(--c-green)" : isNegative ? "var(--c-red)" : "var(--c-muted)";

  const minValue = showChange ? Math.min(0, stock.change_percent) : 0;
  const maxValue = showChange ? Math.max(100, stock.change_percent) : 100;
  const range = maxValue - minValue;
  const safeRange = range === 0 ? 1 : range;
  const barWidth = showChange ? Math.abs((stock.change_percent - minValue) / safeRange * 100) : 50;
  const barMarginLeft = showChange && stock.change_percent < 0 ? Math.abs((stock.change_percent - minValue) / safeRange * 100) : 0;

  return (
    <Link
      href={`/${locale}/stock/${stock.symbol}`}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: "16px",
        background: "var(--c-surface)",
        border: "1px solid var(--c-border)",
        borderRadius: "var(--radius-md)",
        cursor: "pointer",
        textDecoration: "none",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = "var(--c-gold)";
        el.style.boxShadow = "0 0 0 1px var(--c-gold)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = "var(--c-border)";
        el.style.boxShadow = "none";
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: "var(--c-text)", margin: 0, marginBottom: 4 }}>
            {stock.symbol}
          </p>
          <p style={{ fontSize: 11, color: "var(--c-muted)", margin: 0 }}>
            {displayName}
          </p>
        </div>
        {showChange && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 8px",
              background: isPositive ? "rgba(14,203,129,0.10)" : isNegative ? "rgba(246,70,93,0.10)" : "rgba(123,148,184,0.10)",
              borderRadius: 6,
            }}
          >
            {isPositive && <TrendingUp size={11} style={{ color: "var(--c-green)" }} />}
            {isNegative && <TrendingDown size={11} style={{ color: "var(--c-red)" }} />}
            <span className="font-num" style={{ fontSize: 11, fontWeight: 600, color: changeColor }}>
              {stock.change_percent > 0 ? "+" : ""}
              {stock.change_percent.toFixed(2)}%
            </span>
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span className="font-num" style={{ fontSize: 13, fontWeight: 700, color: "var(--c-text)" }}>
          {stock.price.toFixed(2)}
        </span>
        {showChange && (
          <div style={{ flex: 1, height: 4, background: "var(--c-elevated)", borderRadius: 2, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${barWidth}%`,
                background: changeColor,
                marginLeft: barMarginLeft > 0 ? undefined : 0,
              }}
            />
          </div>
        )}
      </div>

      {!showChange && (
        <p className="font-num" style={{ fontSize: 11, color: "var(--c-muted)", margin: 0 }}>
          {t(locale, "movers.volume")}: {stock.volume >= 1e6 ? `${(stock.volume / 1e6).toFixed(1)}M` : stock.volume >= 1e3 ? `${(stock.volume / 1e3).toFixed(0)}K` : stock.volume.toString()}
        </p>
      )}
    </Link>
  );
}

export default function MoversClient({
  locale,
  gainers,
  losers,
  mostActive,
}: MoversClientProps) {
  const [activeTab, setActiveTab] = useState<"gainers" | "losers" | "active">("gainers");
  const isAr = locale === "ar";

  const tabs = [
    { id: "gainers", label: t(locale, "movers.gainers"), icon: <TrendingUp size={14} />, data: gainers },
    { id: "losers", label: t(locale, "movers.losers"), icon: <TrendingDown size={14} />, data: losers },
    { id: "active", label: t(locale, "movers.active"), icon: <Zap size={14} />, data: mostActive },
  ];

  const currentData =
    activeTab === "gainers" ? gainers : activeTab === "losers" ? losers : mostActive;

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 24,
          borderBottom: "1px solid var(--c-border)",
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as "gainers" | "losers" | "active")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "12px 16px",
              background: activeTab === tab.id ? "transparent" : "transparent",
              border: "none",
              borderBottom: activeTab === tab.id ? "2px solid var(--c-gold)" : "2px solid transparent",
              color: activeTab === tab.id ? "var(--c-gold)" : "var(--c-muted)",
              fontSize: 14,
              fontWeight: activeTab === tab.id ? 600 : 500,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab.id) {
                (e.target as HTMLButtonElement).style.color = "var(--c-text)";
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab.id) {
                (e.target as HTMLButtonElement).style.color = "var(--c-muted)";
              }
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {currentData.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {currentData.map((stock) => (
            <StockCard
              key={stock.symbol}
              stock={stock}
              locale={locale}
              showChange={activeTab !== "active"}
            />
          ))}
        </div>
      ) : (
        <div
          style={{
            padding: "40px 24px",
            textAlign: "center",
            background: "var(--c-surface)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--c-border)",
          }}
        >
          <Zap size={32} style={{ color: "var(--c-dim)", marginBottom: 12, margin: "0 auto 12px" }} />
          <p style={{ fontSize: 14, color: "var(--c-muted)", margin: 0 }}>
            {isAr ? "لا توجد بيانات متاحة حالياً" : "No data available"}
          </p>
        </div>
      )}
    </div>
  );
}
