"use client";

import { useState, useRef, useEffect } from "react";
import { t } from "@/lib/i18n";
import { X, ChevronDown, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

interface Company {
  id: string;
  ticker: string;
  name_en: string;
  name_ar: string;
  sector: string;
}

interface ComparisonData {
  id: string;
  ticker: string;
  name_en: string;
  name_ar: string;
  sector: string;
  is_shariah_compliant: boolean;
  market: string;
  price: number | null;
  changePct: number | null;
  open: number | null;
  high: number | null;
  low: number | null;
  volume: number | null;
  suqai_score: number | null;
  score_tier: string | null;
  pe_ratio: number | null;
  pb_ratio: number | null;
  dividend_yield: number | null;
  roe: number | null;
  revenue_growth_yoy: number | null;
  debt_to_equity: number | null;
  current_ratio: number | null;
  market_cap: number | null;
  net_margin: number | null;
  gross_margin: number | null;
  as_of_date: string | null;
}

interface CompareClientProps {
  companies: Company[];
  locale: string;
}

export default function CompareClient({ companies: allCompanies, locale }: CompareClientProps) {
  const isAr = locale === "ar";
  const [selectedTickers, setSelectedTickers] = useState<string[]>([]);
  const [searchInputs, setSearchInputs] = useState<string[]>(["", "", "", ""]);
  const [openDropdowns, setOpenDropdowns] = useState<{ [key: number]: boolean }>({});
  const [comparisonData, setComparisonData] = useState<ComparisonData[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      Object.values(dropdownRefs.current).forEach((ref) => {
        if (ref && !ref.contains(event.target as Node)) {
          setOpenDropdowns((prev) => ({ ...prev, [ref.id]: false }));
        }
      });
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (index: number, ticker: string) => {
    const newTickers = [...selectedTickers];
    newTickers[index] = ticker;
    setSelectedTickers(newTickers.filter(Boolean));
    setSearchInputs((prev) => {
      const newInputs = [...prev];
      newInputs[index] = ticker;
      return newInputs;
    });
    setOpenDropdowns((prev) => ({ ...prev, [index]: false }));
  };

  const handleRemove = (index: number) => {
    const newTickers = selectedTickers.filter((_, i) => i !== index);
    setSelectedTickers(newTickers);
    setSearchInputs((prev) => {
      const newInputs = [...prev];
      newInputs[index] = "";
      return newInputs;
    });
    setComparisonData(null);
  };

  const handleSearchChange = (index: number, value: string) => {
    setSearchInputs((prev) => {
      const newInputs = [...prev];
      newInputs[index] = value;
      return newInputs;
    });
    setOpenDropdowns((prev) => ({ ...prev, [index]: true }));
  };

  const filteredCompanies = (index: number) => {
    const searchValue = searchInputs[index].toUpperCase();
    return allCompanies.filter(
      (c) =>
        !selectedTickers.includes(c.ticker) &&
        (c.ticker.includes(searchValue) || c.name_en.toUpperCase().includes(searchValue))
    );
  };

  const handleCompare = async () => {
    if (selectedTickers.length < 2) {
      setError(t(locale, "common.na"));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/compare?tickers=${selectedTickers.join(",")}`);
      if (!response.ok) {
        throw new Error("Failed to fetch comparison data");
      }
      const data = await response.json();
      setComparisonData(data);
    } catch (err) {
      setError("Failed to load comparison data. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number | null, decimals = 2, isCurrency = false) => {
    if (num === null || num === undefined) return "—";
    if (isNaN(num)) return "—";

    const formatted = num.toFixed(decimals);
    if (isCurrency) return `${formatted}`;
    return formatted;
  };

  const formatMarketCap = (marketCap: number | null) => {
    if (marketCap === null) return "—";
    if (marketCap >= 1_000_000_000) {
      return `${(marketCap / 1_000_000_000).toFixed(1)}B`;
    }
    if (marketCap >= 1_000_000) {
      return `${(marketCap / 1_000_000).toFixed(1)}M`;
    }
    return formatNumber(marketCap, 0);
  };

  const findBest = (metricKey: keyof ComparisonData, higherIsBetter = true) => {
    if (!comparisonData) return null;
    const validValues = comparisonData
      .map((d, i) => ({ index: i, value: d[metricKey] }))
      .filter((x) => x.value !== null && !isNaN(x.value as number));

    if (validValues.length === 0) return null;

    const best = higherIsBetter
      ? validValues.reduce((a, b) => ((a.value as number) > (b.value as number) ? a : b))
      : validValues.reduce((a, b) => ((a.value as number) < (b.value as number) ? a : b));

    return best.index;
  };

  const MetricBadge = ({ value, unit = "", best = false }: { value: string; unit?: string; best?: boolean }) => (
    <div
      style={{
        padding: "6px 10px",
        borderRadius: "var(--radius-md)",
        background: best ? "rgba(34, 197, 94, 0.1)" : "var(--c-surface)",
        border: best ? "1px solid var(--c-green)" : "1px solid var(--c-border)",
        fontSize: 12,
        fontWeight: best ? 600 : 500,
        color: best ? "var(--c-green)" : "var(--c-text)",
      }}
    >
      {value}
      {unit && <span style={{ marginLeft: 3, opacity: 0.7 }}>{unit}</span>}
    </div>
  );

  const Metric = ({
    label,
    metricKey,
    formatFn,
    higherIsBetter = true,
  }: {
    label: string;
    metricKey: keyof ComparisonData;
    formatFn: (val: number | null) => string;
    higherIsBetter?: boolean;
  }) => {
    if (!comparisonData) return null;
    const bestIndex = findBest(metricKey, higherIsBetter);

    return (
      <div style={{ marginBottom: 20 }}>
        <h4 style={{ fontSize: 11, fontWeight: 600, color: "var(--c-muted)", textTransform: "uppercase", marginBottom: 8, opacity: 0.8 }}>
          {label}
        </h4>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${comparisonData.length}, 1fr)`,
            gap: 10,
          }}
        >
          {comparisonData.map((data, i) => (
            <MetricBadge
              key={`${data.ticker}-${metricKey}`}
              value={formatFn(data[metricKey] as number | null)}
              best={bestIndex === i}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{ direction: isAr ? "rtl" : "ltr" }}>
      {/* Selection Section */}
      <div style={{ marginBottom: 30 }}>
        <p style={{ fontSize: 12, color: "var(--c-muted)", marginBottom: 12, fontWeight: 500 }}>
          {t(locale, "compare.add_stock")} ({selectedTickers.length}/4)
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 12,
          }}
        >
          {[0, 1, 2, 3].map((index) => (
            <div key={index} style={{ position: "relative" }}>
              <div
                ref={(el) => {
                  if (el) dropdownRefs.current[index] = el;
                }}
                id={String(index)}
                style={{
                  position: "relative",
                  border: "1px solid var(--c-border)",
                  borderRadius: "var(--radius-md)",
                  background: "var(--c-surface)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    cursor: "pointer",
                    minHeight: 40,
                  }}
                  onClick={() => setOpenDropdowns((prev) => ({ ...prev, [index]: !prev[index] }))}
                >
                  <input
                    type="text"
                    placeholder={selectedTickers[index] ? "" : t(locale, "compare.add_stock")}
                    value={searchInputs[index]}
                    onChange={(e) => handleSearchChange(index, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      flex: 1,
                      border: "none",
                      background: "transparent",
                      fontSize: 13,
                      color: "var(--c-text)",
                      outline: "none",
                      fontWeight: selectedTickers[index] ? 600 : 400,
                      textAlign: isAr ? "right" : "left",
                    }}
                  />
                  {selectedTickers[index] ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(index);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 4,
                        marginLeft: isAr ? 8 : 0,
                        marginRight: isAr ? 0 : 8,
                      }}
                    >
                      <X size={16} style={{ color: "var(--c-muted)" }} />
                    </button>
                  ) : (
                    <ChevronDown
                      size={16}
                      style={{
                        color: "var(--c-muted)",
                        transform: openDropdowns[index] ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.2s",
                        marginLeft: isAr ? 8 : 0,
                        marginRight: isAr ? 0 : 8,
                      }}
                    />
                  )}
                </div>

                {/* Dropdown */}
                {openDropdowns[index] && !selectedTickers[index] && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: isAr ? "auto" : 0,
                      right: isAr ? 0 : "auto",
                      width: "100%",
                      background: "var(--c-elevated)",
                      border: "1px solid var(--c-border)",
                      borderTop: "none",
                      maxHeight: 200,
                      overflowY: "auto",
                      zIndex: 10,
                    }}
                  >
                    {filteredCompanies(index).slice(0, 8).map((company) => (
                      <div
                        key={company.id}
                        onClick={() => handleSelect(index, company.ticker)}
                        style={{
                          padding: "10px 12px",
                          cursor: "pointer",
                          borderBottom: "1px solid var(--c-border)",
                          fontSize: 13,
                          color: "var(--c-text)",
                          textAlign: isAr ? "right" : "left",
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLDivElement).style.background = "var(--c-surface)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLDivElement).style.background = "transparent";
                        }}
                      >
                        <div style={{ fontWeight: 600 }}>{company.ticker}</div>
                        <div style={{ fontSize: 11, color: "var(--c-muted)", marginTop: 2 }}>
                          {isAr ? company.name_ar : company.name_en}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div
            style={{
              marginTop: 12,
              padding: 10,
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid var(--c-red)",
              borderRadius: "var(--radius-md)",
              fontSize: 12,
              color: "var(--c-red)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        <button
          onClick={handleCompare}
          disabled={selectedTickers.length < 2 || loading}
          style={{
            marginTop: 12,
            padding: "10px 20px",
            background: selectedTickers.length < 2 ? "var(--c-border)" : "var(--c-gold)",
            color: selectedTickers.length < 2 ? "var(--c-muted)" : "#000",
            border: "none",
            borderRadius: "var(--radius-md)",
            fontSize: 13,
            fontWeight: 600,
            cursor: selectedTickers.length < 2 ? "default" : "pointer",
            opacity: loading ? 0.7 : 1,
            transition: "all 0.2s",
          }}
        >
          {loading ? t(locale, "common.loading") : "Compare"}
        </button>
      </div>

      {/* Comparison Cards */}
      {comparisonData && comparisonData.length > 0 && (
        <div style={{ marginTop: 30 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 16,
              marginBottom: 30,
            }}
          >
            {comparisonData.map((data) => {
              const changeIsPositive = (data.changePct ?? 0) >= 0;

              return (
                <div
                  key={data.ticker}
                  className="card"
                  style={{
                    padding: 16,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {/* Header */}
                  <div style={{ marginBottom: 16, borderBottom: "1px solid var(--c-border)", paddingBottom: 12 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--c-text)", margin: 0 }}>
                      {isAr ? data.name_ar : data.name_en}
                    </h3>
                    <p style={{ fontSize: 11, color: "var(--c-muted)", margin: "4px 0 0 0", fontWeight: 500 }}>
                      {data.ticker}
                    </p>
                  </div>

                  {/* Price Section */}
                  {data.price !== null && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                        <span
                          className="font-num"
                          style={{
                            fontSize: 18,
                            fontWeight: 700,
                            color: "var(--c-text)",
                          }}
                        >
                          {formatNumber(data.price, 2)}
                        </span>
                        <span style={{ fontSize: 11, color: "var(--c-muted)" }}>SAR</span>
                      </div>
                      {data.changePct !== null && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 12,
                            fontWeight: 600,
                            color: changeIsPositive ? "var(--c-green)" : "var(--c-red)",
                          }}
                        >
                          {changeIsPositive ? (
                            <TrendingUp size={14} />
                          ) : (
                            <TrendingDown size={14} />
                          )}
                          {changeIsPositive ? "+" : ""}{formatNumber(data.changePct, 2)}%
                        </div>
                      )}
                    </div>
                  )}

                  {/* SUQAI Score */}
                  {data.suqai_score !== null && (
                    <div
                      style={{
                        padding: 10,
                        background: "rgba(217, 119, 6, 0.1)",
                        border: "1px solid var(--c-gold-ring)",
                        borderRadius: "var(--radius-md)",
                        marginBottom: 12,
                        textAlign: "center",
                      }}
                    >
                      <p style={{ fontSize: 10, color: "var(--c-gold)", fontWeight: 600, margin: 0, textTransform: "uppercase" }}>
                        SUQAI Score
                      </p>
                      <p
                        className="font-num"
                        style={{
                          fontSize: 20,
                          fontWeight: 700,
                          color: "var(--c-gold)",
                          margin: "4px 0 0 0",
                        }}
                      >
                        {formatNumber(data.suqai_score, 1)}
                      </p>
                      {data.score_tier && (
                        <p style={{ fontSize: 10, color: "var(--c-muted)", margin: "4px 0 0 0" }}>
                          {data.score_tier}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Key Metrics */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 8,
                      fontSize: 11,
                    }}
                  >
                    {data.pe_ratio !== null && (
                      <div style={{ padding: 8, background: "var(--c-surface)", borderRadius: "var(--radius-md)" }}>
                        <p style={{ fontSize: 9, color: "var(--c-muted)", margin: 0, fontWeight: 500 }}>P/E</p>
                        <p className="font-num" style={{ fontSize: 13, fontWeight: 700, color: "var(--c-text)", margin: "4px 0 0 0" }}>
                          {formatNumber(data.pe_ratio, 2)}
                        </p>
                      </div>
                    )}
                    {data.roe !== null && (
                      <div style={{ padding: 8, background: "var(--c-surface)", borderRadius: "var(--radius-md)" }}>
                        <p style={{ fontSize: 9, color: "var(--c-muted)", margin: 0, fontWeight: 500 }}>ROE</p>
                        <p className="font-num" style={{ fontSize: 13, fontWeight: 700, color: "var(--c-text)", margin: "4px 0 0 0" }}>
                          {formatNumber(data.roe, 2)}%
                        </p>
                      </div>
                    )}
                    {data.dividend_yield !== null && (
                      <div style={{ padding: 8, background: "var(--c-surface)", borderRadius: "var(--radius-md)" }}>
                        <p style={{ fontSize: 9, color: "var(--c-muted)", margin: 0, fontWeight: 500 }}>Yield</p>
                        <p className="font-num" style={{ fontSize: 13, fontWeight: 700, color: "var(--c-text)", margin: "4px 0 0 0" }}>
                          {formatNumber(data.dividend_yield, 2)}%
                        </p>
                      </div>
                    )}
                    {data.debt_to_equity !== null && (
                      <div style={{ padding: 8, background: "var(--c-surface)", borderRadius: "var(--radius-md)" }}>
                        <p style={{ fontSize: 9, color: "var(--c-muted)", margin: 0, fontWeight: 500 }}>D/E</p>
                        <p className="font-num" style={{ fontSize: 13, fontWeight: 700, color: "var(--c-text)", margin: "4px 0 0 0" }}>
                          {formatNumber(data.debt_to_equity, 2)}
                        </p>
                      </div>
                    )}
                    {data.market_cap !== null && (
                      <div style={{ padding: 8, background: "var(--c-surface)", borderRadius: "var(--radius-md)", gridColumn: "1 / -1" }}>
                        <p style={{ fontSize: 9, color: "var(--c-muted)", margin: 0, fontWeight: 500 }}>Market Cap</p>
                        <p className="font-num" style={{ fontSize: 13, fontWeight: 700, color: "var(--c-text)", margin: "4px 0 0 0" }}>
                          {formatMarketCap(data.market_cap)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Comparison Tables */}
          <div style={{ marginTop: 30 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--c-text)", marginBottom: 16 }}>
              Detailed Comparison
            </h3>

            {/* Price Metrics */}
            <div className="card" style={{ padding: 16, marginBottom: 16 }}>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: "var(--c-text)", marginBottom: 12 }}>Price Metrics</h4>
              <Metric
                label="Current Price"
                metricKey="price"
                formatFn={(val) => (val !== null ? `${formatNumber(val, 2)} SAR` : "—")}
                higherIsBetter={false}
              />
              <Metric
                label="Change %"
                metricKey="changePct"
                formatFn={(val) => (val !== null ? `${val > 0 ? "+" : ""}${formatNumber(val, 2)}%` : "—")}
                higherIsBetter={true}
              />
              {comparisonData[0]?.open !== null && (
                <Metric
                  label="Open"
                  metricKey="open"
                  formatFn={(val) => (val !== null ? `${formatNumber(val, 2)}` : "—")}
                />
              )}
            </div>

            {/* Financial Metrics */}
            <div className="card" style={{ padding: 16, marginBottom: 16 }}>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: "var(--c-text)", marginBottom: 12 }}>Financial Metrics</h4>
              <Metric
                label="P/E Ratio"
                metricKey="pe_ratio"
                formatFn={(val) => (val !== null ? formatNumber(val, 2) : "—")}
                higherIsBetter={false}
              />
              <Metric
                label="ROE %"
                metricKey="roe"
                formatFn={(val) => (val !== null ? `${formatNumber(val, 2)}%` : "—")}
                higherIsBetter={true}
              />
              <Metric
                label="Dividend Yield %"
                metricKey="dividend_yield"
                formatFn={(val) => (val !== null ? `${formatNumber(val, 2)}%` : "—")}
                higherIsBetter={true}
              />
              <Metric
                label="Debt/Equity"
                metricKey="debt_to_equity"
                formatFn={(val) => (val !== null ? formatNumber(val, 2) : "—")}
                higherIsBetter={false}
              />
              <Metric
                label="Net Margin %"
                metricKey="net_margin"
                formatFn={(val) => (val !== null ? `${formatNumber(val, 2)}%` : "—")}
                higherIsBetter={true}
              />
              <Metric
                label="Revenue Growth YoY %"
                metricKey="revenue_growth_yoy"
                formatFn={(val) => (val !== null ? `${formatNumber(val, 2)}%` : "—")}
                higherIsBetter={true}
              />
            </div>

            {/* Market Metrics */}
            <div className="card" style={{ padding: 16 }}>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: "var(--c-text)", marginBottom: 12 }}>Market Metrics</h4>
              <Metric
                label="Market Cap"
                metricKey="market_cap"
                formatFn={(val) => formatMarketCap(val)}
                higherIsBetter={true}
              />
              {comparisonData[0]?.volume !== null && (
                <Metric
                  label="Volume"
                  metricKey="volume"
                  formatFn={(val) => (val !== null ? `${(val / 1_000_000).toFixed(2)}M` : "—")}
                  higherIsBetter={true}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !comparisonData && selectedTickers.length > 0 && (
        <div
          style={{
            textAlign: "center",
            padding: 40,
            background: "var(--c-surface)",
            borderRadius: "var(--radius-md)",
            border: "1px dashed var(--c-border)",
          }}
        >
          <p style={{ fontSize: 13, color: "var(--c-muted)", margin: 0 }}>
            {t(locale, "compare.no_stocks")}
          </p>
        </div>
      )}
    </div>
  );
}
