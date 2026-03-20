"use client";

import Link from "next/link";
import { SlidersHorizontal, Play, Sparkles } from "lucide-react";

export interface SavedScreen {
  name: { en: string; ar: string };
  matchCount: number;
  newSinceLastVisit: number;
  topMatch: { ticker: string; name: string } | null;
}

interface SavedScreensProps {
  screens: SavedScreen[];
  locale: string;
}

export default function SavedScreens({ screens, locale }: SavedScreensProps) {
  const isAr = locale === "ar";

  return (
    <div style={{ marginBottom: 16 }}>
      <div className="flex items-center gap-2 mb-2">
        <SlidersHorizontal size={13} style={{ color: "var(--c-muted)" }} />
        <h3 className="font-bold" style={{ fontSize: 14, color: "var(--c-text)", fontFamily: "var(--font-grotesk)" }}>
          {isAr ? "الفلاتر المحفوظة" : "Saved screens"}
        </h3>
      </div>

      {screens.length === 0 ? (
        <div className="card" style={{ padding: "20px", textAlign: "center" }}>
          <p style={{ fontSize: 11, color: "var(--c-dim)" }}>
            {isAr ? "احفظ فلترًا من صفحة التصفية للوصول السريع" : "Save a screen from the Screener for quick access"}
          </p>
        </div>
      ) : (
        <div className="screens-grid" style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(screens.length, 3)}, 1fr)`, gap: 10 }}>
          {screens.map((scr, i) => (
            <div key={i} className="card" style={{ padding: "14px 16px" }}>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: "var(--c-text)", marginBottom: 8 }}>
                {isAr ? scr.name.ar : scr.name.en}
              </h4>

              <div className="flex items-center justify-between mb-1">
                <span style={{ fontSize: 10, color: "var(--c-muted)" }}>{isAr ? "نتائج حالية" : "Matches now"}</span>
                <span className="font-num font-bold" style={{ fontSize: 13, color: "var(--c-text)" }}>{scr.matchCount}</span>
              </div>

              {scr.newSinceLastVisit > 0 && (
                <div className="flex items-center justify-between mb-1">
                  <span style={{ fontSize: 10, color: "var(--c-muted)" }}>{isAr ? "جديد هذا الأسبوع" : "New this week"}</span>
                  <span className="font-num font-bold" style={{ fontSize: 12, color: "var(--c-gold)" }}>+{scr.newSinceLastVisit}</span>
                </div>
              )}

              {scr.topMatch && (
                <div className="flex items-center gap-1.5 mb-3" style={{ marginTop: 6 }}>
                  <Sparkles size={9} style={{ color: "var(--c-gold)" }} />
                  <span style={{ fontSize: 9, color: "var(--c-dim)" }}>{isAr ? "أفضل تطابق:" : "Top match:"}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: "var(--c-text)" }}>{scr.topMatch.ticker}</span>
                  <span style={{ fontSize: 9, color: "var(--c-muted)" }}>{scr.topMatch.name}</span>
                </div>
              )}

              <Link
                href={`/${locale}/screener`}
                className="flex items-center gap-1.5"
                style={{
                  fontSize: 10, fontWeight: 700, color: "var(--c-gold)", textDecoration: "none",
                  marginTop: 4,
                }}
              >
                <Play size={9} />
                {isAr ? "تشغيل الفلتر" : "Run screen"}
              </Link>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 700px) { .screens-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
