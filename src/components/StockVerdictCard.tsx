"use client";

/**
 * SŪQAI Stock Verdict Card
 *
 * Shows at the top of each stock page:
 *   - Overall verdict (one line, stock-specific)
 *   - Top 3 strengths
 *   - Key watchouts
 *   - Score confidence
 *   - Peer context
 *
 * All bilingual. Premium, scannable, investor-friendly.
 */

interface VerdictCardProps {
  locale: string;
  verdict: { en: string; ar: string };
  strengths: Array<{ en: string; ar: string }>;
  watchouts: Array<{ en: string; ar: string }>;
  peerContext?: Array<{ en: string; ar: string }>;
  confidenceLabel: { en: string; ar: string };
  confidenceColor: string;
}

export default function StockVerdictCard({
  locale,
  verdict,
  strengths,
  watchouts,
  peerContext,
  confidenceLabel,
  confidenceColor,
}: VerdictCardProps) {
  const isAr = locale === "ar";

  return (
    <div
      className="card"
      style={{
        padding: "20px 22px",
        marginBottom: 16,
        borderLeft: isAr ? "none" : "3px solid var(--c-gold)",
        borderRight: isAr ? "3px solid var(--c-gold)" : "none",
      }}
    >
      {/* Verdict headline */}
      <p style={{ fontSize: 14, fontWeight: 700, color: "var(--c-text)", lineHeight: 1.5, margin: 0 }}>
        {isAr ? verdict.ar : verdict.en}
      </p>

      {/* Strengths + Watchouts side by side */}
      <div className="grid grid-cols-2 gap-4" style={{ marginTop: 14 }}>
        {/* Strengths */}
        {strengths.length > 0 && (
          <div>
            <p style={{ fontSize: 9, fontWeight: 700, color: "var(--c-green)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
              {isAr ? "نقاط القوة" : "Strengths"}
            </p>
            {strengths.map((s, i) => (
              <p key={i} style={{ fontSize: 11, color: "var(--c-muted)", lineHeight: 1.45, margin: 0, marginBottom: 3 }}>
                <span style={{ color: "var(--c-green)", marginRight: isAr ? 0 : 4, marginLeft: isAr ? 4 : 0 }}>+</span>
                {isAr ? s.ar : s.en}
              </p>
            ))}
          </div>
        )}

        {/* Watchouts */}
        {watchouts.length > 0 && (
          <div>
            <p style={{ fontSize: 9, fontWeight: 700, color: "var(--c-caution, #F59E0B)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
              {isAr ? "نقاط المراقبة" : "Watch"}
            </p>
            {watchouts.map((w, i) => (
              <p key={i} style={{ fontSize: 11, color: "var(--c-muted)", lineHeight: 1.45, margin: 0, marginBottom: 3 }}>
                <span style={{ color: "var(--c-caution, #F59E0B)", marginRight: isAr ? 0 : 4, marginLeft: isAr ? 4 : 0 }}>!</span>
                {isAr ? w.ar : w.en}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Peer context */}
      {peerContext && peerContext.length > 0 && (
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--c-border)" }}>
          <p style={{ fontSize: 9, fontWeight: 700, color: "var(--c-dim)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 5 }}>
            {isAr ? "مقارنة بالقطاع" : "Vs. Sector"}
          </p>
          {peerContext.map((p, i) => (
            <p key={i} style={{ fontSize: 10, color: "var(--c-muted)", lineHeight: 1.4, margin: 0, marginBottom: 2 }}>
              {isAr ? p.ar : p.en}
            </p>
          ))}
        </div>
      )}

      {/* Confidence */}
      <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 8, fontWeight: 700, padding: "1px 6px", borderRadius: 3, background: "rgba(107,114,128,0.08)", color: confidenceColor }}>
          {isAr ? confidenceLabel.ar : confidenceLabel.en}
        </span>
      </div>
    </div>
  );
}
