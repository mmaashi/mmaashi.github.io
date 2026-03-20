"use client";

import { useState, useRef, useEffect } from "react";
import { Info, X, ChevronDown, ChevronUp } from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface GlossaryData {
  what: string;
  why: string;
  how: string;
  watch: string;
}

interface MetricExplainerProps {
  /** Metric key for glossary lookup */
  metricKey: string;
  /** Pre-resolved glossary data for the current locale */
  glossary: GlossaryData;
  /** Size of the info icon */
  size?: number;
  /** Current locale */
  locale: string;
}

interface SectionExplainerProps {
  /** Section text for the current locale */
  text: string;
  /** Current locale */
  locale: string;
}

// ─── Metric Info Icon + Bottom Sheet ────────────────────────────────────────

export function MetricExplainer({ metricKey, glossary, size = 12, locale }: MetricExplainerProps) {
  const [open, setOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const isAr = locale === "ar";

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  return (
    <>
      {/* Info icon trigger */}
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        aria-label={isAr ? "اعرف أكثر" : "Learn more"}
        style={{
          background: "none",
          border: "none",
          padding: 2,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: 0.45,
          transition: "opacity 0.15s",
          flexShrink: 0,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.45")}
      >
        <Info size={size} style={{ color: "var(--c-muted)" }} />
      </button>

      {/* Bottom Sheet / Overlay */}
      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            background: "rgba(0,0,0,0.5)",
            animation: "fadeIn 0.15s ease-out",
          }}
          onClick={() => setOpen(false)}
        >
          <div
            ref={sheetRef}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 520,
              maxHeight: "70vh",
              overflowY: "auto",
              background: "var(--c-surface, #1a1a2e)",
              borderRadius: "16px 16px 0 0",
              padding: "24px 24px 32px",
              boxShadow: "0 -8px 40px rgba(0,0,0,0.4)",
              animation: "slideUp 0.2s ease-out",
              direction: isAr ? "rtl" : "ltr",
            }}
          >
            {/* Handle bar */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--c-border)" }} />
            </div>

            {/* Close button */}
            <button
              onClick={() => setOpen(false)}
              aria-label={isAr ? "إغلاق" : "Close"}
              style={{
                position: "absolute",
                top: 16,
                [isAr ? "left" : "right"]: 16,
                background: "var(--c-elevated)",
                border: "1px solid var(--c-border)",
                borderRadius: 8,
                padding: 6,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={14} style={{ color: "var(--c-muted)" }} />
            </button>

            {/* Content */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* What */}
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: "var(--c-gold)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
                  {isAr ? "ما هو" : "What it is"}
                </p>
                <p style={{ fontSize: 14, color: "var(--c-text)", lineHeight: 1.7, margin: 0 }}>
                  {glossary.what}
                </p>
              </div>

              {/* Why */}
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: "var(--c-gold)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
                  {isAr ? "لماذا يهم" : "Why it matters"}
                </p>
                <p style={{ fontSize: 14, color: "var(--c-text)", lineHeight: 1.7, margin: 0 }}>
                  {glossary.why}
                </p>
              </div>

              {/* How */}
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: "var(--c-gold)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
                  {isAr ? "كيف تقرأه" : "How to read it"}
                </p>
                <p style={{ fontSize: 14, color: "var(--c-text)", lineHeight: 1.7, margin: 0 }}>
                  {glossary.how}
                </p>
              </div>

              {/* Watch out */}
              <div style={{ padding: "12px 14px", borderRadius: 8, background: "var(--c-elevated)", border: "1px solid var(--c-border)" }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "var(--c-caution, #F59E0B)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
                  {isAr ? "انتبه" : "Watch out"}
                </p>
                <p style={{ fontSize: 13, color: "var(--c-muted)", lineHeight: 1.7, margin: 0 }}>
                  {glossary.watch}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Keyframe animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </>
  );
}

// ─── Section Explainer (accordion) ──────────────────────────────────────────

export function SectionExplainerToggle({ text, locale }: SectionExplainerProps) {
  const [expanded, setExpanded] = useState(false);
  const isAr = locale === "ar";

  return (
    <div style={{ marginBottom: expanded ? 12 : 0 }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          fontSize: 11,
          color: "var(--c-gold)",
          fontWeight: 600,
          opacity: 0.8,
          transition: "opacity 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.8")}
      >
        {isAr ? "كيف تقرأ هذا القسم؟" : "How to read this section"}
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {expanded && (
        <p style={{
          fontSize: 12,
          color: "var(--c-muted)",
          lineHeight: 1.7,
          marginTop: 8,
          padding: "10px 14px",
          borderRadius: 8,
          background: "var(--c-elevated)",
          border: "1px solid var(--c-border)",
          direction: isAr ? "rtl" : "ltr",
        }}>
          {text}
        </p>
      )}
    </div>
  );
}

// ─── Default export for convenience ─────────────────────────────────────────

export default MetricExplainer;
