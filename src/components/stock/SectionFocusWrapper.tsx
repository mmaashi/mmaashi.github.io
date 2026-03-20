"use client";

import { useState, useEffect, ReactNode } from "react";

interface Section {
  id: string;
  labelEn: string;
  labelAr: string;
  num: number;
  color: string;
}

const SECTIONS: Section[] = [
  { id: "valuation", labelEn: "Valuation", labelAr: "التقييم", num: 1, color: "#C8A951" },
  { id: "quality", labelEn: "Quality", labelAr: "الجودة", num: 2, color: "#A78BFA" },
  { id: "growth", labelEn: "Growth", labelAr: "النمو", num: 3, color: "#0ECB81" },
  { id: "safety", labelEn: "Safety", labelAr: "السلامة المالية", num: 4, color: "#14B8A6" },
  { id: "dividend", labelEn: "Dividend", labelAr: "التوزيعات", num: 5, color: "#F59E0B" },
  { id: "momentum", labelEn: "Momentum", labelAr: "الزخم", num: 6, color: "#60A5FA" },
];

interface Props {
  locale: string;
  hasNews?: boolean;
  /** Slot: content shown when NO section is focused (overview mode) */
  overviewContent: ReactNode;
  /** Slot: content for each section when focused */
  sectionContent: Record<string, ReactNode>;
  /** Always-visible content above the sections (verdict, metrics, etc.) */
  topContent?: ReactNode;
  /** Always-visible content below (news, peers, etc.) */
  bottomContent?: ReactNode;
}

export default function SectionFocusWrapper({
  locale,
  hasNews,
  overviewContent,
  sectionContent,
  topContent,
  bottomContent,
}: Props) {
  const isAr = locale === "ar";
  const [focused, setFocused] = useState<string | null>(null);
  const [pulseId, setPulseId] = useState<string | null>(null);

  const allSections = [
    ...SECTIONS,
    ...(hasNews ? [{ id: "news-section", labelEn: "News", labelAr: "الأخبار", num: 7, color: "#F97316" }] : []),
  ];

  function selectSection(id: string) {
    if (focused === id) {
      setFocused(null); // back to overview
    } else {
      setFocused(id);
      setPulseId(id);
      setTimeout(() => setPulseId(null), 600);
      // Scroll to the focused section card AFTER React renders
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const el = document.getElementById("focused-section-card");
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        });
      });
    }
  }

  const focusedSection = allSections.find(s => s.id === focused) ?? null;

  // Pulse animation
  const pulseStyles = `
    @keyframes section-pulse {
      0% { box-shadow: 0 0 0 0 rgba(200, 169, 81, 0.4); }
      50% { box-shadow: 0 0 0 8px rgba(200, 169, 81, 0); }
      100% { box-shadow: 0 0 0 0 rgba(200, 169, 81, 0); }
    }
    .section-pulse { animation: section-pulse 0.6s ease-out; }
  `;

  return (
    <>
      <style>{pulseStyles}</style>

      {/* Mobile: horizontal chip nav */}
      <div className="md:hidden mb-4" style={{
        overflowX: "auto", WebkitOverflowScrolling: "touch",
        position: "sticky", top: 56, zIndex: 30,
        background: "var(--c-base)",
        paddingTop: 8, paddingBottom: 8,
        marginLeft: -16, marginRight: -16, paddingLeft: 16, paddingRight: 16,
        borderBottom: "1px solid var(--c-border)",
      }}>
        <div className="flex gap-2" style={{ minWidth: "max-content", paddingBottom: 4 }}>
          {/* "All" chip to go back to overview */}
          <button
            onClick={() => setFocused(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{
              border: "1px solid",
              borderColor: !focused ? "var(--c-gold)" : "var(--c-border-md)",
              background: !focused ? "rgba(200,169,81,0.15)" : "var(--c-surface)",
              color: !focused ? "var(--c-gold)" : "var(--c-muted)",
              cursor: "pointer",
            }}
          >
            {isAr ? "الكل" : "All"}
          </button>
          {allSections.map((s) => {
            const isActive = focused === s.id;
            const isPulsing = pulseId === s.id;
            return (
              <button
                key={s.id}
                onClick={() => selectSection(s.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${isPulsing ? "section-pulse" : ""}`}
                style={{
                  border: "1px solid",
                  borderColor: isActive ? s.color : "var(--c-border-md)",
                  background: isActive ? `${s.color}20` : "var(--c-surface)",
                  color: isActive ? s.color : "var(--c-muted)",
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                }}
              >
                <span className="font-num" style={{ fontWeight: 800, fontSize: 10 }}>{s.num}</span>
                {isAr ? s.labelAr : s.labelEn}
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop: flex layout with side-nav + content */}
      <div className="flex gap-6">
        {/* ── Sticky side-nav (desktop only) ── */}
        <nav
          className="hidden md:flex"
          style={{
            position: "sticky", top: 80, flexDirection: "column", gap: 4,
            minWidth: 170, alignSelf: "flex-start",
          }}
        >
          <p style={{ fontSize: 9, fontWeight: 700, color: "var(--c-dim)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
            {isAr ? "الأقسام" : "SECTIONS"}
          </p>
          {/* "Overview" (all) button */}
          <button
            onClick={() => setFocused(null)}
            className="flex items-center gap-2 text-left transition-all"
            style={{
              padding: "8px 12px", borderRadius: 8, border: "none", cursor: "pointer",
              background: !focused ? "rgba(200,169,81,0.15)" : "transparent",
              borderLeft: !focused ? "4px solid var(--c-gold)" : "4px solid transparent",
            }}
          >
            <span style={{ fontSize: 12, fontWeight: !focused ? 700 : 500, color: !focused ? "var(--c-gold)" : "var(--c-muted)" }}>
              {isAr ? "نظرة عامة" : "Overview"}
            </span>
          </button>

          {allSections.map((s) => {
            const isActive = focused === s.id;
            const isPulsing = pulseId === s.id;
            return (
              <button
                key={s.id}
                onClick={() => selectSection(s.id)}
                className={`flex items-center gap-2 text-left transition-all ${isPulsing ? "section-pulse" : ""}`}
                style={{
                  padding: "8px 12px", borderRadius: 8, border: "none", cursor: "pointer",
                  background: isActive ? `${s.color}20` : "transparent",
                  borderLeft: isActive ? `4px solid ${s.color}` : "4px solid transparent",
                  transition: "all 0.2s ease-out",
                }}
              >
                <span className="font-num" style={{
                  fontSize: 11, fontWeight: 800,
                  color: isActive ? s.color : "var(--c-dim)",
                  width: 18, textAlign: "center",
                }}>
                  {s.num}
                </span>
                <span style={{
                  fontSize: isActive ? 13 : 12,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? s.color : "var(--c-muted)",
                  whiteSpace: "nowrap",
                }}>
                  {isAr ? s.labelAr : s.labelEn}
                </span>
              </button>
            );
          })}
        </nav>

        {/* ── Main content area ── */}
        <div id="section-content-area" style={{ flex: 1, minWidth: 0 }}>
          {/* Always visible: top content */}
          {topContent}

          {/* Focused section header */}
          {focusedSection && (
            <div className="mb-4" style={{
              padding: "16px 20px",
              borderRadius: 12,
              background: `${focusedSection.color}10`,
              border: `1px solid ${focusedSection.color}30`,
            }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-num" style={{ fontSize: 20, fontWeight: 800, color: focusedSection.color }}>
                    {focusedSection.num}
                  </span>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: focusedSection.color, margin: 0, fontFamily: "var(--font-grotesk)" }}>
                    {isAr ? focusedSection.labelAr : focusedSection.labelEn}
                  </h2>
                </div>
                <button
                  onClick={() => setFocused(null)}
                  style={{
                    fontSize: 11, color: "var(--c-muted)", fontWeight: 600,
                    cursor: "pointer", background: "var(--c-elevated)",
                    border: "1px solid var(--c-border)", borderRadius: 6,
                    padding: "4px 12px",
                  }}
                >
                  {isAr ? "← عودة للنظرة العامة" : "← Back to Overview"}
                </button>
              </div>
            </div>
          )}

          {/* Content: overview or focused section */}
          {!focused ? (
            overviewContent
          ) : (
            <div id="focused-section-card" style={{ minHeight: 400, scrollMarginTop: 80 }}>
              {sectionContent[focused] ?? (
                <div style={{ padding: 40, textAlign: "center", color: "var(--c-muted)" }}>
                  {isAr ? "لا توجد بيانات لهذا القسم" : "No data available for this section"}
                </div>
              )}
            </div>
          )}

          {/* Always visible: bottom content */}
          {bottomContent}
        </div>
      </div>
    </>
  );
}
