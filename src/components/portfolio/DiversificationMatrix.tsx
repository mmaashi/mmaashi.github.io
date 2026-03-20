"use client";

import { useMemo } from "react";
import { AlertTriangle, TrendingDown, CheckCircle } from "lucide-react";

interface Holding {
  ticker: string;
  companyName: string;
  sector: string;
  weight: number; // 0-100 percentage
  value: number;
}

interface Props {
  locale: string;
  holdings: Holding[];
  totalValue: number;
}

const SECTOR_COLORS: Record<string, string> = {
  "Banks": "#FFD700",
  "Insurance": "#FFA500",
  "Petrochemicals": "#FF6347",
  "Cement": "#A9A9A9",
  "Real Estate": "#8B7355",
  "Retail": "#9370DB",
  "Technology": "#00CED1",
  "Utilities": "#3CB371",
  "Healthcare": "#FF69B4",
  "Energy": "#DC143C",
  "Materials": "#87CEEB",
  "Telecommunications": "#20B2AA",
};

const SECTOR_COLORS_AR: Record<string, string> = {
  "البنوك": "#FFD700",
  "التأمين": "#FFA500",
  "البتروكيماويات": "#FF6347",
  "الأسمنت": "#A9A9A9",
  "العقارات": "#8B7355",
  "التجزئة": "#9370DB",
  "التكنولوجيا": "#00CED1",
  "المرافق": "#3CB371",
  "الرعاية الصحية": "#FF69B4",
  "الطاقة": "#DC143C",
  "المواد الخام": "#87CEEB",
  "الاتصالات": "#20B2AA",
};

// Correlation relationships between sectors
const SECTOR_CORRELATIONS: Record<string, Set<string>> = {
  "Banks": new Set(["Insurance", "التأمين", "Petrochemicals", "البتروكيماويات"]),
  "Insurance": new Set(["Banks", "البنوك", "Real Estate", "العقارات"]),
  "Petrochemicals": new Set(["Banks", "البنوك", "Energy", "الطاقة", "Materials", "المواد الخام"]),
  "Cement": new Set(["Real Estate", "العقارات", "Materials", "المواد الخام"]),
  "Real Estate": new Set(["Insurance", "التأمين", "Cement", "الأسمنت"]),
  "Retail": new Set(["Telecommunications", "الاتصالات"]),
  "Technology": new Set(["Telecommunications", "الاتصالات"]),
  "Utilities": new Set(["Energy", "الطاقة"]),
  "Healthcare": new Set(["Technology", "التكنولوجيا"]),
  "Energy": new Set(["Petrochemicals", "البتروكيماويات", "Utilities", "المرافق", "Materials", "المواد الخام"]),
  "Materials": new Set(["Petrochemicals", "البتروكيماويات", "Energy", "الطاقة", "Cement", "الأسمنت"]),
  "Telecommunications": new Set(["Technology", "التكنولوجيا", "Retail", "التجزئة"]),

  // Arabic names
  "البنوك": new Set(["Insurance", "التأمين", "Petrochemicals", "البتروكيماويات"]),
  "التأمين": new Set(["Banks", "البنوك", "Real Estate", "العقارات"]),
  "البتروكيماويات": new Set(["Banks", "البنوك", "Energy", "الطاقة", "Materials", "المواد الخام"]),
  "الأسمنت": new Set(["Real Estate", "العقارات", "Materials", "المواد الخام"]),
  "العقارات": new Set(["Insurance", "التأمين", "Cement", "الأسمنت"]),
  "التجزئة": new Set(["Telecommunications", "الاتصالات"]),
  "التكنولوجيا": new Set(["Telecommunications", "الاتصالات"]),
  "المرافق": new Set(["Energy", "الطاقة"]),
  "الرعاية الصحية": new Set(["Technology", "التكنولوجيا"]),
  "الطاقة": new Set(["Petrochemicals", "البتروكيماويات", "Utilities", "المرافق", "Materials", "المواد الخام"]),
  "المواد الخام": new Set(["Petrochemicals", "البتروكيماويات", "Energy", "الطاقة", "Cement", "الأسمنت"]),
  "الاتصالات": new Set(["Technology", "التكنولوجيا", "Retail", "التجزئة"]),
};

// Helper to determine if two sectors are similar
function areSectorsSimilar(sector1: string, sector2: string): boolean {
  if (sector1 === sector2) return false;
  return SECTOR_CORRELATIONS[sector1]?.has(sector2) || false;
}

// Calculate Herfindahl-Hirschman Index (HHI)
function calculateHHI(holdings: Holding[]): number {
  return holdings.reduce((sum, h) => sum + Math.pow(h.weight, 2), 0);
}

// Get HHI category
function getHHICategory(hhi: number): {
  label: string;
  labelAr: string;
  color: string;
  description: string;
  descriptionAr: string;
} {
  if (hhi < 1500) {
    return {
      label: "Well Diversified",
      labelAr: "متنوع جيداً",
      color: "var(--c-green)",
      description: "Your portfolio is well diversified across holdings",
      descriptionAr: "محفظتك موزعة بشكل جيد عبر الأوراق المالية",
    };
  } else if (hhi < 2500) {
    return {
      label: "Moderate Concentration",
      labelAr: "تركز معتدل",
      color: "var(--c-gold)",
      description: "Your portfolio shows moderate concentration",
      descriptionAr: "محفظتك تظهر تركيزاً معتدلاً",
    };
  } else {
    return {
      label: "Highly Concentrated",
      labelAr: "مركز جداً",
      color: "var(--c-red)",
      description: "Your portfolio is highly concentrated - consider diversifying",
      descriptionAr: "محفظتك مركزة جداً - فكر في التنويع",
    };
  }
}

export default function DiversificationMatrix({ locale, holdings, totalValue }: Props) {
  const isAr = locale === "ar";

  const analysis = useMemo(() => {
    if (!holdings.length) {
      return {
        bySector: new Map<string, Holding[]>(),
        hhi: 0,
        hhiCategory: getHHICategory(0),
        maxSectorWeight: 0,
        maxSector: null,
        sectorPairs: [] as Array<{ s1: string; s2: string; similar: boolean }>,
      };
    }

    // Group by sector
    const bySector = new Map<string, Holding[]>();
    holdings.forEach((h) => {
      if (!bySector.has(h.sector)) {
        bySector.set(h.sector, []);
      }
      bySector.get(h.sector)!.push(h);
    });

    // Calculate HHI
    const hhi = calculateHHI(holdings);
    const hhiCategory = getHHICategory(hhi);

    // Find max sector weight
    let maxSectorWeight = 0;
    let maxSector: string | null = null;
    bySector.forEach((sectorHoldings, sector) => {
      const sectorWeight = sectorHoldings.reduce((sum, h) => sum + h.weight, 0);
      if (sectorWeight > maxSectorWeight) {
        maxSectorWeight = sectorWeight;
        maxSector = sector;
      }
    });

    // Get all unique sectors
    const uniqueSectors = Array.from(bySector.keys());

    // Generate sector pairs for correlation hints
    const sectorPairs: Array<{ s1: string; s2: string; similar: boolean }> = [];
    for (let i = 0; i < uniqueSectors.length; i++) {
      for (let j = i + 1; j < uniqueSectors.length; j++) {
        const s1 = uniqueSectors[i];
        const s2 = uniqueSectors[j];
        sectorPairs.push({
          s1,
          s2,
          similar: areSectorsSimilar(s1, s2),
        });
      }
    }

    return {
      bySector,
      hhi,
      hhiCategory,
      maxSectorWeight,
      maxSector,
      sectorPairs,
    };
  }, [holdings]);

  if (!holdings.length) {
    return (
      <div className="card" style={{ padding: "32px 24px", textAlign: "center" }}>
        <p style={{ fontSize: 13, color: "var(--c-muted)" }}>
          {isAr ? "لا توجد بيانات" : "No holdings data"}
        </p>
      </div>
    );
  }

  const getSectorColor = (sector: string): string => {
    return SECTOR_COLORS[sector] || SECTOR_COLORS_AR[sector] || "#999999";
  };

  // Generate donut segments
  const segments = Array.from(analysis.bySector.entries()).map((entry, idx) => {
    const [sector, sectorHoldings] = entry;
    const weight = sectorHoldings.reduce((sum, h) => sum + h.weight, 0);
    return { sector, weight, color: getSectorColor(sector), idx };
  });

  // Sort by weight descending
  segments.sort((a, b) => b.weight - a.weight);

  // Create donut SVG
  const donutSvg = createDonutSvg(segments);

  return (
    <div className="card" style={{ padding: "20px 22px" }}>
      {/* Header with gold accent */}
      <h3
        className="font-bold mb-4"
        style={{
          fontSize: 15,
          color: "var(--c-text)",
          fontFamily: "var(--font-grotesk)",
        }}
      >
        {isAr ? "تنويع المحفظة" : "Portfolio Diversification"}
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* 1. Sector Allocation Donut */}
        <div>
          <h4
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--c-muted)",
              marginBottom: 12,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {isAr ? "توزيع القطاعات" : "Sector Allocation"}
          </h4>
          <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
            {/* Donut */}
            <div style={{ width: 200, height: 200, flexShrink: 0 }}>
              <svg
                viewBox="0 0 200 200"
                width="200"
                height="200"
                style={{ display: "block" }}
              >
                {donutSvg}
                {/* Center text - total value */}
                <text
                  x="100"
                  y="92"
                  textAnchor="middle"
                  style={{
                    fontSize: 10,
                    fill: "var(--c-muted)",
                    fontWeight: 500,
                  }}
                >
                  Total
                </text>
                <text
                  x="100"
                  y="108"
                  textAnchor="middle"
                  style={{
                    fontSize: 14,
                    fill: "var(--c-text)",
                    fontWeight: 700,
                  }}
                >
                  {(totalValue / 1000).toFixed(1)}K
                </text>
              </svg>
            </div>

            {/* Sector legend */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              {segments.map((seg) => (
                <div
                  key={seg.sector}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 12,
                  }}
                >
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      background: seg.color,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      flex: 1,
                      color: "var(--c-text-sm)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {seg.sector}
                  </span>
                  <span
                    className="font-num"
                    style={{
                      color: "var(--c-muted)",
                      fontSize: 11,
                      fontWeight: 600,
                      minWidth: 40,
                      textAlign: "right",
                    }}
                  >
                    {seg.weight.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Concentration Risk Gauge */}
        <div>
          <h4
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--c-muted)",
              marginBottom: 12,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {isAr ? "مؤشر المخاطرة التركيزية" : "Concentration Risk (HHI)"}
          </h4>
          <div
            style={{
              padding: "12px 14px",
              borderRadius: 8,
              background: `${analysis.hhiCategory.color}08`,
              border: `1px solid ${analysis.hhiCategory.color}20`,
            }}
          >
            <div style={{ marginBottom: 8 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--c-muted)",
                  }}
                >
                  {isAr ? analysis.hhiCategory.labelAr : analysis.hhiCategory.label}
                </span>
                <span
                  className="font-num"
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: analysis.hhiCategory.color,
                  }}
                >
                  HHI: {analysis.hhi.toFixed(0)}
                </span>
              </div>

              {/* HHI gauge bar */}
              <div
                style={{
                  display: "flex",
                  height: 6,
                  borderRadius: 3,
                  overflow: "hidden",
                  gap: 0,
                }}
              >
                {/* Green segment: 0-1500 */}
                <div
                  style={{
                    flex: 1500,
                    background: "var(--c-green)",
                    opacity: analysis.hhi < 1500 ? 1 : 0.3,
                  }}
                />
                {/* Yellow segment: 1500-2500 */}
                <div
                  style={{
                    flex: 1000,
                    background: "var(--c-gold)",
                    opacity:
                      analysis.hhi >= 1500 && analysis.hhi < 2500 ? 1 : 0.3,
                  }}
                />
                {/* Red segment: 2500+ */}
                <div
                  style={{
                    flex: 7500,
                    background: "var(--c-red)",
                    opacity: analysis.hhi >= 2500 ? 1 : 0.3,
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 6,
                  fontSize: 9,
                  color: "var(--c-muted)",
                }}
              >
                <span>0</span>
                <span>1500</span>
                <span>2500</span>
                <span>10000</span>
              </div>
            </div>

            <p
              style={{
                fontSize: 10,
                color: "var(--c-text-sm)",
                margin: 0,
                lineHeight: 1.4,
              }}
            >
              {isAr
                ? analysis.hhiCategory.descriptionAr
                : analysis.hhiCategory.description}
            </p>
          </div>
        </div>

        {/* 3. Sector Overlap Warning */}
        {analysis.maxSectorWeight > 50 && analysis.maxSector && (
          <div
            style={{
              padding: "12px 14px",
              borderRadius: 8,
              background: "var(--c-red-ring)",
              border: "1px solid var(--c-red-dim)",
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
            }}
          >
            <AlertTriangle
              size={14}
              style={{
                color: "var(--c-red)",
                flexShrink: 0,
                marginTop: 2,
              }}
            />
            <div style={{ flex: 1 }}>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--c-red)",
                  margin: 0,
                  marginBottom: 4,
                }}
              >
                {isAr ? "تحذير من عدم التنويع" : "Diversification Warning"}
              </p>
              <p
                style={{
                  fontSize: 10,
                  color: "var(--c-text-sm)",
                  margin: 0,
                  lineHeight: 1.4,
                }}
              >
                {isAr
                  ? `محفظتك تحتوي على ${analysis.maxSectorWeight.toFixed(
                      1
                    )}% في ${analysis.maxSector} — فكر في التنويع إلى قطاعات أخرى`
                  : `Your portfolio has ${analysis.maxSectorWeight.toFixed(
                      1
                    )}% in ${analysis.maxSector} — consider diversifying into other sectors`}
              </p>
            </div>
          </div>
        )}

        {/* 4. Correlation Hints */}
        {analysis.sectorPairs.length > 0 && (
          <div>
            <h4
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--c-muted)",
                marginBottom: 12,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {isAr ? "العلاقات بين القطاعات" : "Sector Correlations"}
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {analysis.sectorPairs.map((pair, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 10px",
                    borderRadius: 6,
                    background: "var(--c-border-subtle)",
                    fontSize: 10,
                  }}
                >
                  <span style={{ flex: 1, color: "var(--c-text-sm)" }}>
                    {pair.s1}
                    <span style={{ color: "var(--c-muted)" }}> + </span>
                    {pair.s2}
                  </span>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "2px 8px",
                      borderRadius: 4,
                      background: pair.similar
                        ? "var(--c-gold-ring)"
                        : "var(--c-green-ring)",
                    }}
                  >
                    {pair.similar ? (
                      <TrendingDown
                        size={10}
                        style={{ color: "var(--c-gold)" }}
                      />
                    ) : (
                      <CheckCircle
                        size={10}
                        style={{ color: "var(--c-green)" }}
                      />
                    )}
                    <span
                      style={{
                        color: pair.similar
                          ? "var(--c-gold)"
                          : "var(--c-green)",
                        fontWeight: 600,
                      }}
                    >
                      {pair.similar
                        ? isAr
                          ? "متشابهة"
                          : "Similar"
                        : isAr
                        ? "مختلفة"
                        : "Different"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Create SVG donut chart segments
 */
function createDonutSvg(
  segments: Array<{ sector: string; weight: number; color: string; idx: number }>
) {
  const cx = 100;
  const cy = 100;
  const radius = 70;
  const innerRadius = 40;

  let currentAngle = -90; // Start from top
  const elements: JSX.Element[] = [];

  segments.forEach((seg) => {
    const sliceAngle = (seg.weight / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;

    // Convert angles to radians
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    // Calculate points for outer arc
    const outerStart = {
      x: cx + radius * Math.cos(startRad),
      y: cy + radius * Math.sin(startRad),
    };
    const outerEnd = {
      x: cx + radius * Math.cos(endRad),
      y: cy + radius * Math.sin(endRad),
    };

    // Calculate points for inner arc
    const innerStart = {
      x: cx + innerRadius * Math.cos(startRad),
      y: cy + innerRadius * Math.sin(startRad),
    };
    const innerEnd = {
      x: cx + innerRadius * Math.cos(endRad),
      y: cy + innerRadius * Math.sin(endRad),
    };

    // Determine if arc is large (>180 degrees)
    const largeArc = sliceAngle > 180 ? 1 : 0;

    // Build path
    const path = [
      `M ${outerStart.x} ${outerStart.y}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
      `L ${innerEnd.x} ${innerEnd.y}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
      "Z",
    ].join(" ");

    elements.push(
      <path
        key={`segment-${seg.idx}`}
        d={path}
        fill={seg.color}
        stroke="var(--c-surface)"
        strokeWidth="1"
      />
    );

    currentAngle = endAngle;
  });

  return elements;
}
