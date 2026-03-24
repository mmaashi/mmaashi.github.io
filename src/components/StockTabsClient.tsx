"use client";

import { useState, ReactNode, useCallback } from "react";
import {
  LayoutGrid,
  LineChart,
  BarChart3,
  Coins,
  Newspaper,
  Info,
  Sparkles,
} from "lucide-react";

const TABS = [
  { key: "overview",   en: "Overview",    ar: "نظرة عامة",       Icon: LayoutGrid },
  { key: "chart",      en: "Chart",       ar: "الرسم البياني",    Icon: LineChart },
  { key: "financials", en: "Financials",  ar: "المالية",          Icon: BarChart3 },
  { key: "dividends",  en: "Dividends",   ar: "التوزيعات",        Icon: Coins },
  { key: "news",       en: "News",        ar: "الأخبار",          Icon: Newspaper },
  { key: "info",       en: "Info",        ar: "معلومات",          Icon: Info },
  { key: "analysis",   en: "Analysis",    ar: "التحليل",          Icon: Sparkles },
] as const;

type TabKey = typeof TABS[number]["key"];

interface Props {
  locale: string;
  ticker: string;
  initialTab: TabKey;
  newsCount: number;
  children: Record<TabKey, ReactNode>;
}

export default function StockTabsClient({ locale, ticker, initialTab, newsCount, children }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const isAr = locale === "ar";

  const handleTabClick = useCallback((key: TabKey) => {
    setActiveTab(key);
    // Update URL without navigation (cosmetic only)
    const url = new URL(window.location.href);
    url.searchParams.set("tab", key);
    window.history.replaceState({}, "", url.toString());
  }, []);

  return (
    <>
      {/* ── Tab bar ── */}
      <div
        className="mb-5"
        style={{
          borderBottom: "1px solid var(--c-border)",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
        }}
      >
        <div
          className="flex"
          style={{
            gap: 0,
            minWidth: "max-content",
            direction: isAr ? "rtl" : "ltr",
          }}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const label = isAr ? tab.ar : tab.en;
            const { Icon } = tab;

            return (
              <button
                key={tab.key}
                onClick={() => handleTabClick(tab.key)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "11px 16px",
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? "var(--c-gold)" : "var(--c-muted)",
                  textDecoration: "none",
                  borderBottom: isActive
                    ? "2px solid var(--c-gold)"
                    : "2px solid transparent",
                  background: isActive ? "var(--c-gold-dim)" : "transparent",
                  transition: "all 0.18s ease",
                  whiteSpace: "nowrap",
                  position: "relative",
                  letterSpacing: "0.01em",
                  border: "none",
                  borderTop: "none",
                  borderLeft: "none",
                  borderRight: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                <Icon
                  size={13}
                  style={{ color: isActive ? "var(--c-gold)" : "var(--c-dim)", flexShrink: 0 }}
                />
                {label}
                {tab.key === "news" && newsCount > 0 && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      minWidth: 18,
                      height: 18,
                      borderRadius: 9,
                      background: isActive ? "var(--c-gold)" : "var(--c-elevated)",
                      color: isActive ? "var(--c-base)" : "var(--c-text-sm)",
                      border: isActive ? "none" : "1px solid var(--c-border-md)",
                      fontSize: 10,
                      fontWeight: 800,
                      padding: "0 5px",
                    }}
                  >
                    {newsCount > 99 ? "99+" : newsCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab content — all rendered, only active visible ── */}
      {TABS.map((tab) => (
        <div
          key={tab.key}
          style={{ display: activeTab === tab.key ? "block" : "none" }}
        >
          {children[tab.key]}
        </div>
      ))}
    </>
  );
}
