"use client";

import { Users } from "lucide-react";

interface PeerData {
  ticker: string;
  name: string;
  pe?: number | null;
  roe?: number | null;
  divYield?: number | null;
  marketCap?: number | null;
}

interface PeerMiniTableProps {
  locale: string;
  currentStock: PeerData;
  peers: PeerData[];
  sectorName: string;
  compareLink?: string;
}

function formatMarketCap(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";

  if (value >= 1e12) {
    return `${(value / 1e12).toFixed(1)}T`;
  }
  if (value >= 1e9) {
    return `${(value / 1e9).toFixed(1)}B`;
  }
  if (value >= 1e6) {
    return `${(value / 1e6).toFixed(0)}M`;
  }
  return value.toFixed(0);
}

function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${value.toFixed(2)}%`;
}

function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value.toFixed(2);
}

function ComparisonCell({
  value,
  isBest,
  isHigherBetter,
  locale,
  type,
}: {
  value: number | null | undefined;
  isBest: boolean;
  isHigherBetter: boolean;
  locale: string;
  type: "pe" | "roe" | "divYield" | "marketCap";
}) {
  let display = "—";
  if (type === "roe" || type === "divYield") {
    display = formatPercent(value);
  } else if (type === "marketCap") {
    display = formatMarketCap(value);
  } else {
    display = formatNumber(value);
  }

  const isPositive = isHigherBetter;
  const textColor = isBest ? "var(--c-gold)" : isPositive ? "var(--c-text)" : "var(--c-text)";

  return (
    <td
      className="font-num"
      style={{
        padding: "10px 12px",
        fontSize: 12,
        color: textColor,
        fontWeight: isBest ? 700 : 600,
        textAlign: "right",
        background: isBest ? "rgba(200,169,81,0.06)" : "transparent",
      }}
    >
      {display}
    </td>
  );
}

export default function PeerMiniTable({
  locale,
  currentStock,
  peers,
  sectorName,
  compareLink,
}: PeerMiniTableProps) {
  const isAr = locale === "ar";
  const displayPeers = peers.slice(0, 4);
  const allStocks = [currentStock, ...displayPeers];

  // Find best values for each metric (PE: lower is better, ROE: higher is better, Div Yield: higher is better, Market Cap: for display only)
  const getBestValue = (
    metric: "pe" | "roe" | "divYield" | "marketCap",
    isHigherBetter: boolean
  ) => {
    const values = allStocks
      .map((s) => s[metric])
      .filter((v) => v !== null && v !== undefined);

    if (values.length === 0) return null;

    return isHigherBetter ? Math.max(...(values as number[])) : Math.min(...(values as number[]));
  };

  const bestPE = getBestValue("pe", false);
  const bestROE = getBestValue("roe", true);
  const bestDivYield = getBestValue("divYield", true);

  const columns = [
    { key: "company", label: isAr ? "الشركة" : "Company" },
    { key: "pe", label: "P/E" },
    { key: "roe", label: "ROE" },
    { key: "divYield", label: isAr ? "عائد الأرباح" : "Div Yield" },
    { key: "marketCap", label: isAr ? "القيمة السوقية" : "Market Cap" },
  ];

  return (
    <div
      className="card"
      style={{ padding: "18px 20px", direction: isAr ? "rtl" : "ltr" }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Users size={14} style={{ color: "var(--c-gold)" }} />
        <h3 className="font-bold" style={{ fontSize: 13, color: "var(--c-text)", flex: 1 }}>
          {isAr ? "مقارنة مع الأقران" : "Peer Comparison"}
        </h3>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto", marginBottom: displayPeers.length > 0 ? 12 : 0 }}>
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
                {isAr ? "الشركة" : "Company"}
              </th>
              <th style={{ textAlign: "right" }}>P/E</th>
              <th style={{ textAlign: "right" }}>ROE</th>
              <th style={{ textAlign: "right" }}>{isAr ? "عائد" : "Div"}</th>
              <th style={{ textAlign: "right" }}>{isAr ? "القيمة" : "Market Cap" }</th>
            </tr>
          </thead>
          <tbody>
            {/* Current stock row with gold left border */}
            <tr
              style={{
                borderLeft: `3px solid var(--c-gold)`,
                background: "rgba(200,169,81,0.02)",
              }}
            >
              <td
                style={{
                  padding: "10px 12px",
                  fontSize: 12,
                  color: "var(--c-gold)",
                  fontWeight: 700,
                  textAlign: isAr ? "right" : "left",
                  paddingLeft: isAr ? 0 : 16,
                  paddingRight: isAr ? 16 : 0,
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 600, opacity: 0.8 }}>
                  {currentStock.ticker}
                </span>
                <div style={{ fontSize: 10, opacity: 0.6, marginTop: 2 }}>
                  {currentStock.name}
                </div>
              </td>
              <ComparisonCell
                value={currentStock.pe}
                isBest={currentStock.pe === bestPE && bestPE !== null}
                isHigherBetter={false}
                locale={locale}
                type="pe"
              />
              <ComparisonCell
                value={currentStock.roe}
                isBest={currentStock.roe === bestROE && bestROE !== null}
                isHigherBetter={true}
                locale={locale}
                type="roe"
              />
              <ComparisonCell
                value={currentStock.divYield}
                isBest={currentStock.divYield === bestDivYield && bestDivYield !== null}
                isHigherBetter={true}
                locale={locale}
                type="divYield"
              />
              <ComparisonCell
                value={currentStock.marketCap}
                isBest={false}
                isHigherBetter={false}
                locale={locale}
                type="marketCap"
              />
            </tr>

            {/* Peer rows */}
            {displayPeers.map((peer) => (
              <tr key={peer.ticker}>
                <td
                  style={{
                    padding: "10px 12px",
                    fontSize: 12,
                    color: "var(--c-text)",
                    fontWeight: 600,
                    textAlign: isAr ? "right" : "left",
                    paddingLeft: isAr ? 0 : 16,
                    paddingRight: isAr ? 16 : 0,
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 600 }}>
                    {peer.ticker}
                  </span>
                  <div style={{ fontSize: 10, color: "var(--c-muted)", marginTop: 2 }}>
                    {peer.name}
                  </div>
                </td>
                <ComparisonCell
                  value={peer.pe}
                  isBest={peer.pe === bestPE && bestPE !== null}
                  isHigherBetter={false}
                  locale={locale}
                  type="pe"
                />
                <ComparisonCell
                  value={peer.roe}
                  isBest={peer.roe === bestROE && bestROE !== null}
                  isHigherBetter={true}
                  locale={locale}
                  type="roe"
                />
                <ComparisonCell
                  value={peer.divYield}
                  isBest={peer.divYield === bestDivYield && bestDivYield !== null}
                  isHigherBetter={true}
                  locale={locale}
                  type="divYield"
                />
                <ComparisonCell
                  value={peer.marketCap}
                  isBest={false}
                  isHigherBetter={false}
                  locale={locale}
                  type="marketCap"
                />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Compare link */}
      {compareLink && (
        <div style={{ paddingTop: 10, borderTop: "1px solid var(--c-border)" }}>
          <a
            href={compareLink}
            style={{
              fontSize: 11,
              color: "var(--c-gold)",
              textDecoration: "none",
              fontWeight: 600,
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.opacity = "0.8";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.opacity = "1";
            }}
          >
            {isAr ? "مقارنة الكل →" : "Compare all →"}
          </a>
        </div>
      )}
    </div>
  );
}
