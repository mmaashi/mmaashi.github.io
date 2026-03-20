"use client";

import Link from "next/link";
import { Coins, Newspaper, Sparkles, AlertTriangle, TrendingUp, Calendar } from "lucide-react";

export type FeedItemType = "dividend" | "news" | "score_alert" | "price_alert" | "earnings";

export interface FeedItem {
  id: string;
  type: FeedItemType;
  ticker: string;
  title: string;
  subtitle: string;
  date: string; // ISO string
  color: string;
  link?: string;
}

interface UpdatesFeedProps {
  items: FeedItem[];
  locale: string;
  maxItems?: number;
}

const typeIcons: Record<FeedItemType, typeof Coins> = {
  dividend: Coins,
  news: Newspaper,
  score_alert: Sparkles,
  price_alert: TrendingUp,
  earnings: Calendar,
};

function timeAgo(dateStr: string, isAr: boolean): string {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return isAr ? `منذ ${diffMins} دقيقة` : `${diffMins}m ago`;
  }
  if (diffHours < 24) {
    return isAr ? `منذ ${diffHours} ساعة` : `${diffHours}h ago`;
  }
  if (diffDays < 7) {
    return isAr ? `منذ ${diffDays} يوم` : `${diffDays}d ago`;
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function UpdatesFeed({ items, locale, maxItems = 8 }: UpdatesFeedProps) {
  const isAr = locale === "ar";
  const displayed = items.slice(0, maxItems);

  if (!displayed.length) {
    return (
      <div className="card" style={{ padding: "32px 24px", textAlign: "center" }}>
        <p style={{ fontSize: 13, color: "var(--c-muted)" }}>
          {isAr ? "لا توجد تحديثات حديثة" : "No recent updates"}
        </p>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: "20px 22px" }}>
      <div className="flex items-center justify-between mb-4">
        <h3
          className="font-bold"
          style={{ fontSize: 15, color: "var(--c-text)", fontFamily: "var(--font-grotesk)" }}
        >
          {isAr ? "آخر التحديثات" : "Latest Updates"}
        </h3>
        {items.length > maxItems && (
          <span style={{ fontSize: 11, color: "var(--c-dim)" }}>
            +{items.length - maxItems} {isAr ? "أكثر" : "more"}
          </span>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {displayed.map((item, i) => {
          const Icon = typeIcons[item.type] ?? AlertTriangle;
          const content = (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "10px 0",
                borderBottom:
                  i < displayed.length - 1 ? "1px solid var(--c-border)" : "none",
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: `${item.color}15`,
                  border: `1px solid ${item.color}25`,
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                <Icon size={13} style={{ color: item.color }} />
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="flex items-center gap-2">
                  <span className="ticker-tag" style={{ fontSize: 10 }}>
                    {item.ticker}
                  </span>
                  <span style={{ fontSize: 10, color: "var(--c-dim)" }}>
                    {timeAgo(item.date, isAr)}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--c-text-sm)",
                    marginTop: 2,
                    lineHeight: 1.4,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.title}
                </p>
                {item.subtitle && (
                  <p style={{ fontSize: 10, color: "var(--c-dim)", marginTop: 1 }}>
                    {item.subtitle}
                  </p>
                )}
              </div>
            </div>
          );

          if (item.link) {
            return (
              <Link
                key={item.id}
                href={item.link}
                style={{ textDecoration: "none", color: "inherit" }}
                className="group"
              >
                {content}
              </Link>
            );
          }
          return <div key={item.id}>{content}</div>;
        })}
      </div>
    </div>
  );
}
