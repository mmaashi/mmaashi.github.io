"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  LayoutGrid,
  LineChart,
  BarChart3,
  Coins,
  Newspaper,
  Info,
} from "lucide-react";

const TABS = [
  { key: "overview",   en: "Overview",    ar: "نظرة عامة",       Icon: LayoutGrid },
  { key: "chart",      en: "Chart",       ar: "الرسم البياني",    Icon: LineChart },
  { key: "financials", en: "Financials",  ar: "المالية",          Icon: BarChart3 },
  { key: "dividends",  en: "Dividends",   ar: "التوزيعات",        Icon: Coins },
  { key: "news",       en: "News",        ar: "الأخبار",          Icon: Newspaper },
  { key: "info",       en: "Info",        ar: "معلومات",          Icon: Info },
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
          const { Icon } = tab;

          return (
            <Link
              key={tab.key}
              href={`/${locale}/stock/${ticker}?tab=${tab.key}`}
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
