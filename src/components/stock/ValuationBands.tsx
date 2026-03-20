"use client";

import { useState } from "react";

interface Props {
  locale: string;
  currentPE: number | null;
  currentPB: number | null;
  currentPS: number | null;
  currentEVEBITDA: number | null;
  sectorAvgPE: number | null;
  sectorAvgPB?: number | null;
}

interface MetricBandData {
  label: string;
  labelAr: string;
  current: number | null;
  min: number;
  max: number;
  sectorAvg: number;
}

export default function ValuationBands({
  locale,
  currentPE,
  currentPB,
  currentPS,
  currentEVEBITDA,
  sectorAvgPE,
  sectorAvgPB,
}: Props) {
  const isAr = locale === "ar";
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);

  // Estimate historical ranges using sector averages
  // Strategy: min = sector_avg * 0.5 (cheap/undervalued), max = sector_avg * 2.0 (expensive/overvalued)
  // This creates a reasonable range centered on the median
  const getHistoricalRange = (sectorAvg: number | null) => {
    if (!sectorAvg || sectorAvg <= 0) {
      return { min: 0, max: 0 };
    }
    return {
      min: Math.max(0, sectorAvg * 0.5),
      max: sectorAvg * 2.0,
    };
  };

  // Build metric data
  const peRange = getHistoricalRange(sectorAvgPE);
  const pbRange = getHistoricalRange(sectorAvgPB);
  const psRange = getHistoricalRange(null); // No sector avg, use a default range
  const evRange = getHistoricalRange(null);

  const metrics: MetricBandData[] = [
    {
      label: "P/E Ratio",
      labelAr: "مكرر الأرباح",
      current: currentPE,
      min: peRange.min,
      max: peRange.max,
      sectorAvg: sectorAvgPE || 15,
    },
    {
      label: "P/B Ratio",
      labelAr: "مكرر الدفترية",
      current: currentPB,
      min: pbRange.min,
      max: pbRange.max,
      sectorAvg: sectorAvgPB || 2.0,
    },
    {
      label: "P/S Ratio",
      labelAr: "مكرر المبيعات",
      current: currentPS,
      min: 0.5,
      max: 4.0,
      sectorAvg: 2.0,
    },
    {
      label: "EV/EBITDA",
      labelAr: "EV/EBITDA",
      current: currentEVEBITDA,
      min: 3,
      max: 18,
      sectorAvg: 10,
    },
  ];

  // Determine valuation position: cheap (0-0.33), fair (0.33-0.67), expensive (0.67-1.0)
  const getMetricPosition = (current: number | null, min: number, max: number): number => {
    if (!current || !isFinite(current)) return 0.5; // Center if no data
    if (max <= min) return 0.5;
    return Math.max(0, Math.min(1, (current - min) / (max - min)));
  };

  // Zone colors (as percentages across the band)
  const cheapColor = "#0ECB81"; // green
  const fairColor = "#C8A951"; // gold
  const expensiveColor = "#FF6B6B"; // red

  const getZoneColor = (position: number): string => {
    if (position < 0.33) return cheapColor;
    if (position < 0.67) return fairColor;
    return expensiveColor;
  };

  const getZoneLabel = (position: number): { en: string; ar: string } => {
    if (position < 0.33) return { en: "Cheap", ar: "رخيص" };
    if (position < 0.67) return { en: "Fair", ar: "عادل" };
    return { en: "Expensive", ar: "مرتفع" };
  };

  const isBelowAverage = (metric: MetricBandData): boolean => {
    if (!metric.current || !isFinite(metric.current)) return false;
    return metric.current < metric.sectorAvg;
  };

  return (
    <div
      style={{
        background: "var(--c-elevated)",
        borderRadius: "12px",
        padding: "20px",
        marginTop: "16px",
        border: "1px solid var(--c-border)",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <h3
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: "var(--c-text)",
            margin: 0,
            marginBottom: "4px",
            fontFamily: "var(--font-grotesk)",
          }}
        >
          {isAr ? "نطاقات التقييم التاريخية" : "Historical Valuation Bands"}
        </h3>
        <p style={{ fontSize: "11px", color: "var(--c-muted)", margin: 0 }}>
          {isAr
            ? "موقع النسب الحالية نسبة إلى النطاق التاريخي"
            : "Where current ratios sit relative to historical range"}
        </p>
      </div>

      {/* Metric bands */}
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {metrics.map((metric) => {
          const position = getMetricPosition(metric.current, metric.min, metric.max);
          const zoneColor = getZoneColor(position);
          const zoneLabel = getZoneLabel(position);
          const isHovered = hoveredMetric === metric.label;

          return (
            <div key={metric.label} style={{ direction: isAr ? "rtl" : "ltr" }}>
              {/* Metric label */}
              <div style={{ marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--c-text)" }}>
                  {isAr ? metric.labelAr : metric.label}
                </span>
                {metric.current !== null && (
                  <span style={{ fontSize: "12px", fontWeight: 600, color: zoneColor, fontFamily: "var(--font-grotesk)" }}>
                    {metric.current.toFixed(2)}
                  </span>
                )}
              </div>

              {/* Band container */}
              <div
                onMouseEnter={() => setHoveredMetric(metric.label)}
                onMouseLeave={() => setHoveredMetric(null)}
                style={{
                  position: "relative",
                  height: "40px",
                  background: "var(--c-border)",
                  borderRadius: "8px",
                  overflow: "hidden",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: isHovered ? "0 0 12px rgba(200, 169, 81, 0.2)" : "none",
                }}
              >
                {/* Gradient band: green (cheap) → gold (fair) → red (expensive) */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: `linear-gradient(to right, ${cheapColor}, ${fairColor}, ${expensiveColor})`,
                    opacity: 0.15,
                  }}
                />

                {/* Zone labels */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "0 12px",
                    fontSize: "9px",
                    fontWeight: 700,
                    color: "var(--c-dim)",
                    opacity: isHovered ? 1 : 0,
                    transition: "opacity 0.2s ease",
                    pointerEvents: "none",
                  }}
                >
                  <span style={{ color: cheapColor }}>{isAr ? "رخيص" : "Cheap"}</span>
                  <span style={{ color: fairColor }}>{isAr ? "عادل" : "Fair"}</span>
                  <span style={{ color: expensiveColor }}>{isAr ? "مرتفع" : "Expensive"}</span>
                </div>

                {/* Current value marker (gold dot) */}
                {metric.current !== null && isFinite(metric.current) && (
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: `${position * 100}%`,
                      transform: "translate(-50%, -50%)",
                      width: "14px",
                      height: "14px",
                      background: "#C8A951",
                      borderRadius: "50%",
                      border: "2px solid var(--c-bg)",
                      boxShadow: "0 0 8px rgba(200, 169, 81, 0.6)",
                      zIndex: 2,
                      transition: "all 0.2s ease",
                    }}
                  />
                )}

                {/* Min/Max labels */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "0 8px",
                    fontSize: "8px",
                    color: "var(--c-dim)",
                    alignItems: "center",
                    pointerEvents: "none",
                    opacity: isHovered ? 0.7 : 0.5,
                    transition: "opacity 0.2s ease",
                  }}
                >
                  <span>{metric.min.toFixed(1)}</span>
                  <span>{metric.max.toFixed(1)}</span>
                </div>
              </div>

              {/* Hover tooltip */}
              {isHovered && metric.current !== null && (
                <div
                  style={{
                    marginTop: "6px",
                    padding: "8px 12px",
                    background: "rgba(200, 169, 81, 0.08)",
                    borderRadius: "6px",
                    fontSize: "10px",
                    color: "var(--c-muted)",
                    border: "1px solid rgba(200, 169, 81, 0.2)",
                  }}
                >
                  <p style={{ margin: 0, marginBottom: "4px" }}>
                    {isAr ? "المنطقة: " : "Zone: "}
                    <span style={{ color: zoneColor, fontWeight: 600 }}>
                      {isAr ? zoneLabel.ar : zoneLabel.en}
                    </span>
                  </p>
                  <p style={{ margin: 0 }}>
                    {isAr ? "النطاق التاريخي: " : "Historical range: "}
                    <span style={{ color: "var(--c-text)", fontWeight: 600 }}>
                      {metric.min.toFixed(2)} - {metric.max.toFixed(2)}
                    </span>
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Valuation verdict */}
      <div
        style={{
          marginTop: "20px",
          paddingTop: "16px",
          borderTop: "1px solid var(--c-border)",
          padding: "16px 0 0 0",
        }}
      >
        {currentPE !== null && sectorAvgPE !== null ? (
          <div
            style={{
              background: isBelowAverage({ ...metrics[0], sectorAvg: sectorAvgPE, current: currentPE })
                ? "rgba(14, 203, 129, 0.08)"
                : "rgba(255, 107, 107, 0.08)",
              borderLeft: `3px solid ${
                isBelowAverage({ ...metrics[0], sectorAvg: sectorAvgPE, current: currentPE })
                  ? "#0ECB81"
                  : "#FF6B6B"
              }`,
              padding: "12px 12px",
              borderRadius: "6px",
            }}
          >
            <p style={{ margin: 0, fontSize: "12px", fontWeight: 600, color: "var(--c-text)", marginBottom: "4px" }}>
              {isBelowAverage({ ...metrics[0], sectorAvg: sectorAvgPE, current: currentPE })
                ? isAr
                  ? "يتم التداول أقل من المتوسط التاريخي"
                  : "Trading below historical average"
                : isAr
                ? "يتم التداول بعلاوة على المتوسط التاريخي"
                : "Trading at premium to history"}
            </p>
            <p style={{ margin: 0, fontSize: "10px", color: "var(--c-muted)" }}>
              {isAr
                ? `مكرر الأرباح الحالي: ${currentPE.toFixed(2)} | المتوسط القطاعي: ${sectorAvgPE.toFixed(2)}`
                : `Current P/E: ${currentPE.toFixed(2)} | Sector avg: ${sectorAvgPE.toFixed(2)}`}
            </p>
          </div>
        ) : (
          <p style={{ fontSize: "11px", color: "var(--c-muted)", margin: 0, fontStyle: "italic" }}>
            {isAr ? "بيانات غير كافية للتقييم" : "Insufficient data for valuation"}
          </p>
        )}
      </div>
    </div>
  );
}
