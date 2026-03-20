"use client";

import { BarChart3, TrendingUp, TrendingDown } from "lucide-react";

interface ReturnComparisonProps {
  locale: string;
  stockReturns: {
    return_7d?: number | null;
    return_1m?: number | null;
    return_3m?: number | null;
    return_1y?: number | null;
    return_3y?: number | null;
  };
  sectorReturns?: {
    return_7d?: number | null;
    return_1m?: number | null;
    return_3m?: number | null;
    return_1y?: number | null;
    return_3y?: number | null;
  };
  tasiReturns?: {
    return_7d?: number | null;
    return_1m?: number | null;
    return_3m?: number | null;
    return_1y?: number | null;
    return_3y?: number | null;
  };
  ticker: string;
  sectorName: string;
}

const periods = [
  { key: "return_7d", label: "7D" },
  { key: "return_1m", label: "1M" },
  { key: "return_3m", label: "3M" },
  { key: "return_1y", label: "1Y" },
  { key: "return_3y", label: "3Y" },
];

function ReturnCell({
  value,
  isBest,
  locale,
}: {
  value: number | null | undefined;
  isBest: boolean;
  locale: string;
}) {
  if (value === null || value === undefined) {
    return (
      <td
        style={{
          padding: "10px 12px",
          fontSize: 12,
          color: "var(--c-dim)",
          textAlign: "right",
          fontWeight: isBest ? 700 : 500,
        }}
      >
        —
      </td>
    );
  }

  const isPositive = value >= 0;
  const color = isPositive ? "var(--c-green)" : "var(--c-red)";

  return (
    <td
      className="font-num"
      style={{
        padding: "10px 12px",
        fontSize: 12,
        color: isBest ? "var(--c-gold)" : color,
        fontWeight: isBest ? 700 : 600,
        textAlign: "right",
        background: isBest ? "rgba(200,169,81,0.06)" : "transparent",
      }}
    >
      {isPositive ? "+" : ""}{value.toFixed(2)}%
    </td>
  );
}

export default function ReturnComparison({
  locale,
  stockReturns,
  sectorReturns,
  tasiReturns,
  ticker,
  sectorName,
}: ReturnComparisonProps) {
  const isAr = locale === "ar";

  // Calculate verdict
  let outperformingSector = 0; // 1 = yes, -1 = no, 0 = insufficient
  let outperformingTasi = 0; // 1 = yes, -1 = no, 0 = insufficient

  // Count outperforming periods (1Y and 3Y weighted)
  const oneYearStock = stockReturns.return_1y;
  const oneYearSector = sectorReturns?.return_1y;
  const oneYearTasi = tasiReturns?.return_1y;
  const threeYearStock = stockReturns.return_3y;
  const threeYearSector = sectorReturns?.return_3y;
  const threeYearTasi = tasiReturns?.return_3y;

  // Sector comparison
  const hasDataSector =
    (oneYearStock !== null && oneYearSector !== null) ||
    (threeYearStock !== null && threeYearSector !== null);
  if (hasDataSector) {
    let sectorScore = 0;
    if (oneYearStock !== null && oneYearSector !== null) {
      sectorScore += oneYearStock > oneYearSector ? 1 : -1;
    }
    if (threeYearStock !== null && threeYearSector !== null) {
      sectorScore += threeYearStock > threeYearSector ? 1 : -1;
    }
    outperformingSector = sectorScore > 0 ? 1 : -1;
  }

  // TASI comparison
  const hasDataTasi =
    (oneYearStock !== null && oneYearTasi !== null) ||
    (threeYearStock !== null && threeYearTasi !== null);
  if (hasDataTasi) {
    let tasiScore = 0;
    if (oneYearStock !== null && oneYearTasi !== null) {
      tasiScore += oneYearStock > oneYearTasi ? 1 : -1;
    }
    if (threeYearStock !== null && threeYearTasi !== null) {
      tasiScore += threeYearStock > threeYearTasi ? 1 : -1;
    }
    outperformingTasi = tasiScore > 0 ? 1 : -1;
  }

  let verdictText = "";
  if (outperformingSector === 1) {
    verdictText = isAr
      ? `${ticker} يتفوق على ${sectorName}`
      : `${ticker} outperforming ${sectorName}`;
  } else if (outperformingSector === -1) {
    verdictText = isAr
      ? `${ticker} متأخر عن ${sectorName}`
      : `${ticker} underperforming ${sectorName}`;
  }

  if (outperformingTasi === 1) {
    verdictText = verdictText
      ? `${verdictText} ${isAr ? "و" : "and"} TASI`
      : isAr
        ? `${ticker} يتفوق على TASI`
        : `${ticker} outperforming TASI`;
  } else if (outperformingTasi === -1) {
    verdictText = verdictText
      ? `${verdictText} ${isAr ? "لكن متأخر عن" : "but underperforming"} TASI`
      : isAr
        ? `${ticker} متأخر عن TASI`
        : `${ticker} underperforming TASI`;
  }

  return (
    <div
      className="card"
      style={{ padding: "18px 20px", direction: isAr ? "rtl" : "ltr" }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 size={14} style={{ color: "var(--c-gold)" }} />
        <h3 className="font-bold" style={{ fontSize: 13, color: "var(--c-text)", flex: 1 }}>
          {isAr ? "مقارنة الأداء" : "Performance Comparison"}
        </h3>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto", marginBottom: 12 }}>
        <table
          className="data-table"
          style={{
            minWidth: "100%",
            fontSize: 12,
          }}
        >
          <thead>
            <tr>
              <th style={{ textAlign: isAr ? "right" : "left", paddingLeft: isAr ? 0 : 16, paddingRight: isAr ? 16 : 0 }}>
                {isAr ? "الفترة" : "Period"}
              </th>
              <th style={{ textAlign: "right" }}>{ticker}</th>
              <th style={{ textAlign: "right" }}>{sectorName}</th>
              <th style={{ textAlign: "right" }}>TASI</th>
            </tr>
          </thead>
          <tbody>
            {periods.map(({ key, label }) => {
              const k = key as keyof typeof stockReturns;
              const stock = stockReturns[k];
              const sector = sectorReturns?.[k];
              const tasi = tasiReturns?.[k];

              // Find best value
              const values = [stock, sector, tasi].filter((v) => v !== null && v !== undefined);
              const best = values.length > 0 ? Math.max(...(values as number[])) : null;

              return (
                <tr key={key}>
                  <td
                    style={{
                      padding: "10px 12px",
                      fontSize: 11,
                      color: "var(--c-muted)",
                      fontWeight: 600,
                      textAlign: isAr ? "right" : "left",
                      paddingLeft: isAr ? 0 : 16,
                      paddingRight: isAr ? 16 : 0,
                    }}
                  >
                    {label}
                  </td>
                  <ReturnCell value={stock} isBest={stock === best && best !== null} locale={locale} />
                  <ReturnCell value={sector} isBest={sector === best && best !== null} locale={locale} />
                  <ReturnCell value={tasi} isBest={tasi === best && best !== null} locale={locale} />
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Verdict */}
      {verdictText && (
        <div
          style={{
            paddingTop: 10,
            borderTop: "1px solid var(--c-border)",
            fontSize: 11,
            color: "var(--c-muted)",
            lineHeight: 1.5,
          }}
        >
          {outperformingSector === 1 || outperformingTasi === 1 ? (
            <TrendingUp size={12} style={{ color: "var(--c-green)", marginRight: 6, display: "inline" }} />
          ) : (
            <TrendingDown size={12} style={{ color: "var(--c-red)", marginRight: 6, display: "inline" }} />
          )}
          <span>{verdictText}</span>
        </div>
      )}
    </div>
  );
}
