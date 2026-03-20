"use client";

import Link from "next/link";
import { Zap, ArrowRight } from "lucide-react";

export interface AttentionItem {
  priority: number;
  line: { en: string; ar: string };
  action: { en: string; ar: string };
  href: string;
  color: string;
}

interface AttentionModuleProps {
  items: AttentionItem[];
  locale: string;
}

export default function AttentionModule({ items, locale }: AttentionModuleProps) {
  const isAr = locale === "ar";

  if (items.length === 0) return null;

  return (
    <div
      style={{
        padding: "18px 22px",
        borderRadius: 12,
        background: "linear-gradient(135deg, rgba(200,169,81,0.04) 0%, rgba(6,13,24,0.6) 100%)",
        border: "1px solid var(--c-gold-ring)",
        marginBottom: 20,
      }}
    >
      <div className="flex items-center gap-2" style={{ marginBottom: 14 }}>
        <Zap size={13} style={{ color: "var(--c-gold)" }} />
        <h3
          className="font-bold"
          style={{
            fontSize: 13,
            color: "var(--c-text)",
            fontFamily: "var(--font-grotesk)",
            margin: 0,
          }}
        >
          {isAr ? "ما يستحق انتباهك الآن" : "What deserves your attention"}
        </h3>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map((item, i) => (
          <Link
            key={i}
            href={item.href}
            className="attention-row"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 14px",
              borderRadius: 8,
              background: "var(--c-elevated)",
              border: "1px solid var(--c-border)",
              textDecoration: "none",
              transition: "border-color 0.15s, background 0.15s",
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: item.color,
                flexShrink: 0,
              }}
            />
            <p
              style={{
                fontSize: 11,
                color: "var(--c-text-sm)",
                lineHeight: 1.45,
                margin: 0,
                flex: 1,
              }}
            >
              {isAr ? item.line.ar : item.line.en}
            </p>
            <span
              className="flex items-center gap-1"
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: item.color,
                flexShrink: 0,
                whiteSpace: "nowrap",
              }}
            >
              {isAr ? item.action.ar : item.action.en}
              <ArrowRight size={9} />
            </span>
          </Link>
        ))}
      </div>

      <style>{`
        .attention-row:hover { border-color: var(--c-gold-ring) !important; background: rgba(200,169,81,0.04) !important; }
      `}</style>
    </div>
  );
}
