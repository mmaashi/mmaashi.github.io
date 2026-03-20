"use client";

import { useState, useEffect } from "react";

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
  hasContracts?: boolean;
  hasNews?: boolean;
}

export default function SectionNav({ locale, hasContracts, hasNews }: Props) {
  const isAr = locale === "ar";
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pulseId, setPulseId] = useState<string | null>(null);

  const allSections = [
    ...SECTIONS,
    ...(hasContracts ? [{ id: "contracts", labelEn: "Contracts", labelAr: "العقود", num: 7, color: "#818CF8" }] : []),
    ...(hasNews ? [{ id: "news-section", labelEn: "News", labelAr: "الأخبار", num: hasContracts ? 8 : 7, color: "#F97316" }] : []),
  ];

  // Intersection observer to track active section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
    );

    for (const s of allSections) {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveId(id);
      // Trigger pulse animation
      setPulseId(id);
      setTimeout(() => setPulseId(null), 600);
    }
  }

  // Add pulse animation styles
  const pulseStyles = `
    @keyframes section-pulse {
      0% { box-shadow: 0 0 0 0 rgba(200, 169, 81, 0.4); }
      50% { box-shadow: 0 0 0 8px rgba(200, 169, 81, 0); }
      100% { box-shadow: 0 0 0 0 rgba(200, 169, 81, 0); }
    }
    .section-pulse {
      animation: section-pulse 0.6s ease-out;
    }
  `;

  return (
    <>
      <style>{pulseStyles}</style>
      
      {/* Desktop: sticky vertical side-nav */}
      <nav
        className="hidden md:flex"
        style={{
          position: "sticky",
          top: 80,
          flexDirection: "column",
          gap: 4,
          minWidth: 160,
          alignSelf: "flex-start",
        }}
      >
        <p style={{ fontSize: 9, fontWeight: 700, color: "var(--c-dim)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
          {isAr ? "الأقسام" : "SECTIONS"}
        </p>
        {allSections.map((s) => {
          const isActive = activeId === s.id;
          const isPulsing = pulseId === s.id;
          return (
            <button
              key={s.id}
              onClick={() => scrollTo(s.id)}
              className={`flex items-center gap-2 text-left transition-all ${isPulsing ? "section-pulse" : ""}`}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                background: isActive ? `${s.color}20` : "transparent",
                borderLeft: isActive ? `4px solid ${s.color}` : "4px solid transparent",
                transition: "all 0.2s ease-out",
              }}
            >
              <span className="font-num" style={{
                fontSize: 11,
                fontWeight: 800,
                color: isActive ? s.color : "var(--c-dim)",
                width: 18,
                textAlign: "center",
                transition: "color 0.2s ease-out",
              }}>
                {s.num}
              </span>
              <span style={{
                fontSize: isActive ? 13 : 12,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? s.color : "var(--c-muted)",
                whiteSpace: "nowrap",
                transition: "all 0.2s ease-out",
              }}>
                {isAr ? s.labelAr : s.labelEn}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Mobile: horizontal scroll chips */}
      <div
        className="md:hidden mb-4"
        style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}
      >
        <div className="flex gap-2" style={{ minWidth: "max-content", paddingBottom: 4 }}>
          {allSections.map((s) => {
            const isActive = activeId === s.id;
            const isPulsing = pulseId === s.id;
            return (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${isPulsing ? "section-pulse" : ""}`}
                style={{
                  border: "1px solid",
                  borderColor: isActive ? s.color : "var(--c-border-md)",
                  background: isActive ? `${s.color}20` : "var(--c-surface)",
                  color: isActive ? s.color : "var(--c-muted)",
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  transition: "all 0.2s ease-out",
                }}
              >
                <span className="font-num" style={{ fontWeight: 800, fontSize: 10 }}>{s.num}</span>
                {isAr ? s.labelAr : s.labelEn}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
