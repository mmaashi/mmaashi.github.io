"use client";

import { useMemo } from "react";

interface PriceData {
  close: number;
  volume: number;
  date: string;
}

interface Props {
  locale: string;
  priceData: PriceData[];
  currentPrice: number | null;
}

interface VolumeBin {
  priceLevel: number;
  volume: number;
}

export default function VolumeProfile({ locale, priceData, currentPrice }: Props) {
  const isAr = locale === "ar";

  // Calculate volume profile and support/resistance levels
  const { bins, poc, support, resistance, maxVolume } = useMemo(() => {
    if (!priceData || priceData.length === 0) {
      return { bins: [], poc: null, support: null, resistance: null, maxVolume: 0 };
    }

    // Get price range
    const closes = priceData.map((p) => Number(p.close));
    const minPrice = Math.min(...closes);
    const maxPrice = Math.max(...closes);

    // Create 20 equal-sized bins
    const binCount = 20;
    const binSize = (maxPrice - minPrice) / binCount;
    const bins: VolumeBin[] = Array(binCount)
      .fill(0)
      .map((_, i) => ({
        priceLevel: minPrice + (i + 0.5) * binSize,
        volume: 0,
      }));

    // Assign volume to bins based on close price
    priceData.forEach((data) => {
      const closePrice = Number(data.close);
      const volume = Number(data.volume);
      const binIndex = Math.floor((closePrice - minPrice) / binSize);
      // Handle edge case where close equals max price
      const adjustedIndex = binIndex >= binCount ? binCount - 1 : binIndex;
      if (adjustedIndex >= 0) {
        bins[adjustedIndex].volume += volume;
      }
    });

    // Find POC (Point of Control)
    const maxVolumeValue = Math.max(...bins.map((b) => b.volume));
    const pocIndex = bins.findIndex((b) => b.volume === maxVolumeValue);
    const poc = pocIndex >= 0 ? bins[pocIndex].priceLevel : null;

    // Find support (highest volume below current price)
    let support = null;
    if (currentPrice !== null) {
      const belowBins = bins.filter((b) => b.priceLevel < currentPrice);
      if (belowBins.length > 0) {
        support = belowBins.reduce((prev, current) =>
          current.volume > prev.volume ? current : prev
        ).priceLevel;
      }
    }

    // Find resistance (highest volume above current price)
    let resistance = null;
    if (currentPrice !== null) {
      const aboveBins = bins.filter((b) => b.priceLevel > currentPrice);
      if (aboveBins.length > 0) {
        resistance = aboveBins.reduce((prev, current) =>
          current.volume > prev.volume ? current : prev
        ).priceLevel;
      }
    }

    return {
      bins,
      poc,
      support,
      resistance,
      maxVolume: maxVolumeValue,
    };
  }, [priceData, currentPrice]);

  if (!priceData || priceData.length === 0 || !currentPrice) {
    return null;
  }

  // Calculate distances from current price
  const supportDistance = support ? currentPrice - support : null;
  const resistanceDistance = resistance ? resistance - currentPrice : null;

  // Determine verdict
  const getVerdict = () => {
    if (!support || !resistance) return null;
    const distToSupport = Math.abs(supportDistance || 0);
    const distToResistance = Math.abs(resistanceDistance || 0);

    if (distToSupport < distToResistance * 0.5) {
      return isAr
        ? "بالقرب من الدعم - احتمالية ارتداد"
        : "Near support — potential bounce";
    }
    if (distToResistance < distToSupport * 0.5) {
      return isAr
        ? "بالقرب من المقاومة - راقب الاختراق"
        : "Near resistance — watch for breakout";
    }
    return isAr ? "وسط النطاق" : "Mid-range";
  };

  const verdict = getVerdict();

  // Format price for display
  const formatPrice = (price: number | null) => {
    if (price === null) return "—";
    return price.toFixed(2);
  };

  // Format volume
  const formatVolume = (vol: number) => {
    if (vol >= 1000000) return (vol / 1000000).toFixed(1) + "M";
    if (vol >= 1000) return (vol / 1000).toFixed(1) + "K";
    return vol.toString();
  };

  return (
    <div
      style={{
        background: "var(--c-elevated)",
        borderRadius: "12px",
        padding: "20px",
        marginBottom: "20px",
      }}
    >
      {/* Title */}
      <p
        style={{
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "0.08em",
          color: "var(--c-gold)",
          fontFamily: "var(--font-grotesk)",
          marginBottom: "20px",
        }}
      >
        {isAr ? "ملف التصويت و الدعم/المقاومة" : "VOLUME PROFILE & SUPPORT/RESISTANCE"}
      </p>

      {/* Volume Profile Chart */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "24px", minHeight: "250px" }}>
        {/* Y-axis labels (prices) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "flex-end",
            width: "60px",
            paddingRight: "8px",
            fontSize: "10px",
            color: "var(--c-muted)",
          }}
        >
          {bins.length > 0 &&
            [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const index = Math.floor(ratio * (bins.length - 1));
              const price = bins[index]?.priceLevel;
              return (
                <div key={ratio}>{price ? price.toFixed(2) : ""}</div>
              );
            })}
        </div>

        {/* Volume bars container */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
          {bins.map((bin, idx) => {
            const barWidth = maxVolume > 0 ? (bin.volume / maxVolume) * 100 : 0;
            const isPOC = poc !== null && Math.abs(bin.priceLevel - poc) < 0.01;
            const isSupportLine = support !== null && Math.abs(bin.priceLevel - support) < 0.01;
            const isResistanceLine =
              resistance !== null && Math.abs(bin.priceLevel - resistance) < 0.01;
            const isCurrentPriceLine =
              currentPrice !== null && Math.abs(bin.priceLevel - currentPrice) < 0.01;

            return (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  height: "12px",
                }}
              >
                {/* Bar */}
                <div style={{ flex: 1, position: "relative", height: "100%" }}>
                  {/* Support line */}
                  {isSupportLine && (
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        borderLeft: "2px dashed rgba(34,197,94,0.8)",
                        zIndex: 2,
                      }}
                    />
                  )}
                  {/* Resistance line */}
                  {isResistanceLine && (
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        borderLeft: "2px dashed rgba(239,68,68,0.8)",
                        zIndex: 2,
                      }}
                    />
                  )}
                  {/* Current price line */}
                  {isCurrentPriceLine && (
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        borderLeft: "2px dashed rgba(255,255,255,0.8)",
                        zIndex: 2,
                      }}
                    />
                  )}
                  {/* Volume bar */}
                  <div
                    style={{
                      height: "100%",
                      width: barWidth + "%",
                      background: isPOC
                        ? "rgba(200,169,81,0.6)"
                        : "rgba(96,165,250,0.4)",
                      borderRadius: "2px",
                      transition: "all 200ms ease",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Key Levels Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" }}>
        {/* Support Card */}
        {support !== null && (
          <div
            style={{
              background: "rgba(34,197,94,0.1)",
              border: "1px solid rgba(34,197,94,0.3)",
              borderRadius: "8px",
              padding: "12px",
              fontSize: "12px",
            }}
          >
            <div style={{ color: "var(--c-muted)", marginBottom: "6px", fontSize: "10px" }}>
              {isAr ? "الدعم" : "Support"}
            </div>
            <div style={{ color: "rgba(34,197,94,1)", fontWeight: 600, fontSize: "14px" }}>
              {formatPrice(support)}
            </div>
            <div style={{ color: "var(--c-muted)", fontSize: "10px", marginTop: "4px" }}>
              {supportDistance !== null ? formatPrice(supportDistance) : "—"}{" "}
              {isAr ? "أسفل" : "below"}
            </div>
          </div>
        )}

        {/* Current Price Card */}
        <div
          style={{
            background: "rgba(96,165,250,0.1)",
            border: "1px solid rgba(96,165,250,0.3)",
            borderRadius: "8px",
            padding: "12px",
            fontSize: "12px",
          }}
        >
          <div style={{ color: "var(--c-muted)", marginBottom: "6px", fontSize: "10px" }}>
            {isAr ? "السعر الحالي" : "Current"}
          </div>
          <div style={{ color: "rgba(96,165,250,1)", fontWeight: 600, fontSize: "14px" }}>
            {formatPrice(currentPrice)}
          </div>
        </div>

        {/* Resistance Card */}
        {resistance !== null && (
          <div
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: "8px",
              padding: "12px",
              fontSize: "12px",
            }}
          >
            <div style={{ color: "var(--c-muted)", marginBottom: "6px", fontSize: "10px" }}>
              {isAr ? "المقاومة" : "Resistance"}
            </div>
            <div style={{ color: "rgba(239,68,68,1)", fontWeight: 600, fontSize: "14px" }}>
              {formatPrice(resistance)}
            </div>
            <div style={{ color: "var(--c-muted)", fontSize: "10px", marginTop: "4px" }}>
              {resistanceDistance !== null ? formatPrice(resistanceDistance) : "—"}{" "}
              {isAr ? "أعلى" : "above"}
            </div>
          </div>
        )}
      </div>

      {/* Verdict Section */}
      {verdict && (
        <div
          style={{
            marginTop: "16px",
            padding: "12px",
            background: "rgba(200,169,81,0.1)",
            borderLeft: "3px solid var(--c-gold)",
            borderRadius: "4px",
            fontSize: "12px",
            color: "var(--c-text)",
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: "4px" }}>
            {isAr ? "الحكم" : "Verdict"}
          </div>
          <div>{verdict}</div>
        </div>
      )}
    </div>
  );
}
