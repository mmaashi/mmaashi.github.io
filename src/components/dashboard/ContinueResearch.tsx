"use client";

import Link from "next/link";
import { Clock, ArrowUpRight, ArrowDownRight, SlidersHorizontal, AlertTriangle, BarChart3 } from "lucide-react";

export interface ContinueItem {
  type: "recently_viewed" | "comparison" | "screener" | "alert";
  label: { en: string; ar: string };
  detail: { en: string; ar: string };
  href: string;
}

interface ContinueResearchProps {
  items: ContinueItem[];
  locale: string;
}

const typeIcons = {
  recently_viewed: Clock,
  comparison: BarChart3,
  screener: SlidersHorizontal,
  alert: AlertTriangle,
};

const typeColors = {
  recently_viewed: "var(--c-muted)",
  comparison: "#60a5fa",
  screener: "var(--c-gold)",
  alert: "var(--c-red)",
};

export default function ContinueResearch({ items, locale }: ContinueResearchProps) {
  const isAr = locale === "ar";

  if (items.length === 0) return null;

  return (
    <div style={{ marginBottom: 16 }}>
      <div className="flex items-center gap-2 mb-2">
        <Clock size={13} style={{ color: "var(--c-muted)" }} />
        <h3 className="font-bold" style={{ fontSize: 14, color: "var(--c-text)", fontFamily: "var(--font-grotesk)" }}>
          {isAr ? "عُد إلى بحثك" : "Pick up your research"}
        </h3>
      </div>

      <div className="continue-grid" style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(items.length, 4)}, 1fr)`, gap: 10 }}>
        {items.map((item, i) => {
          const Icon = typeIcons[item.type];
          const color = typeColors[item.type];
          return (
            <Link
              key={i}
              href={item.href}
              style={{
                display: "block",
                padding: "12px 14px",
                borderRadius: 10,
                background: "var(--c-elevated)",
                border: "1px solid var(--c-border)",
                textDecoration: "none",
                transition: "border-color 0.15s",
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon size={11} style={{ color }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: "var(--c-text)" }}>
                  {isAr ? item.label.ar : item.label.en}
                </span>
              </div>
              <p style={{ fontSize: 10, color: "var(--c-muted)", lineHeight: 1.45, margin: 0 }}>
                {isAr ? item.detail.ar : item.detail.en}
              </p>
            </Link>
          );
        })}
      </div>

      <style>{`
        @media (max-width: 700px) { .continue-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 400px) { .continue-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
