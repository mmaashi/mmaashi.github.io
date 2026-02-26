"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const TABS = [
  { key: "overview",   en: "Overview",    ar: "نظرة عامة",       icon: "◈" },
  { key: "chart",      en: "Chart",       ar: "الرسم البياني",    icon: "📈" },
  { key: "financials", en: "Financials",  ar: "المالية",          icon: "₿" },
  { key: "dividends",  en: "Dividends",   ar: "التوزيعات",        icon: "💰" },
  { key: "news",       en: "News",        ar: "الأخبار",          icon: "📰" },
  { key: "info",       en: "Info",        ar: "معلومات",          icon: "ⓘ" },
] as const;

type TabKey = typeof TABS[number]["key"];

interface StockTabsProps {
  locale: string;
  ticker: string;
  activeTab: TabKey;
  /** Pass news count so we can show a badge */
  newsCount?: number;
}

function TabsInner({ locale, ticker, activeTab, newsCount = 0 }: StockTabsProps) {
  const isAr = locale === "ar";

  return (
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

          return (
            <Link
              key={tab.key}
              href={`/${locale}/stock/${ticker}?tab=${tab.key}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "12px 18px",
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
              }}
            >
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
                    background: "var(--c-gold)",
                    color: "var(--c-base)",
                    fontSize: 10,
                    fontWeight: 800,
                    padding: "0 5px",
                  }}
                >
                  {newsCount > 99 ? "99+" : newsCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function StockTabs(props: StockTabsProps) {
  return (
    <Suspense
      fallback={
        <div
          style={{
            height: 46,
            marginBottom: 20,
            background: "var(--c-surface)",
            borderRadius: "var(--radius-md)",
            borderBottom: "1px solid var(--c-border)",
          }}
        />
      }
    >
      <TabsInner {...props} />
    </Suspense>
  );
}
