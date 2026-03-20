"use client";

import { useState } from "react";

interface Props {
  locale: string;
  currentPrice: number | null;
  pe: number | null;
  eps: number | null;
  sectorAvgPE: number | null;
  roe: number | null;
  bookValue: number | null;
}

export default function FairValueCard({
  locale,
  currentPrice,
  pe,
  eps,
  sectorAvgPE,
  roe,
  bookValue,
}: Props) {
  const isAr = locale === "ar";

  // Calculate fair value using simple earnings-based approach
  const fairValue = (() => {
    if (!eps || eps <= 0) return null;
    // Use sector avg PE if available, cap at 20x, otherwise use 15x
    const useablePE = sectorAvgPE ? Math.min(sectorAvgPE, 20) : 15;
    return eps * useablePE;
  })();

  const valuationGap = (() => {
    if (!fairValue || !currentPrice || currentPrice <= 0) return null;
    return ((currentPrice - fairValue) / fairValue) * 100;
  })();

  const isUndervalued = valuationGap !== null && valuationGap < 0;
  const isOvervalued = valuationGap !== null && valuationGap > 0;
  const valPercent = valuationGap !== null ? Math.abs(valuationGap).toFixed(1) : null;

  // Determine status label and color
  const getStatusLabel = () => {
    if (!valuationGap) return null;
    if (valuationGap < -20) return isAr ? "منخفض جداً" : "Significantly Undervalued";
    if (valuationGap < -5) return isAr ? "منخفض" : "Undervalued";
    if (valuationGap < 5) return isAr ? "عادل" : "Fairly Valued";
    if (valuationGap < 20) return isAr ? "مرتفع" : "Overvalued";
    return isAr ? "مرتفع جداً" : "Significantly Overvalued";
  };

  const getStatusColor = () => {
    if (!valuationGap) return "var(--c-muted)";
    if (valuationGap < -20) return "var(--c-green)";
    if (valuationGap < -5) return "#0ECB81";
    if (valuationGap < 5) return "var(--c-gold)";
    if (valuationGap < 20) return "#FF6B6B";
    return "var(--c-red)";
  };

  const getBarColor = () => {
    if (!valuationGap) return "var(--c-muted)";
    if (isUndervalued) return "#0ECB81";
    if (isOvervalued) return "#FF6B6B";
    return "var(--c-gold)";
  };

  return (
    <div
      style={{
        background: "var(--c-elevated)",
        borderRadius: "12px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      {/* Header */}
      <div>
        <p
          style={{
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: "var(--c-gold)",
            marginBottom: "4px",
            fontFamily: "var(--font-grotesk)",
          }}
        >
          {isAr ? "تقدير القيمة العادلة" : "FAIR VALUE ESTIMATE"}
        </p>
      </div>

      {/* Content */}
      {fairValue && currentPrice ? (
        <>
          {/* Fair Value Display */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div>
              <p style={{ fontSize: "12px", color: "var(--c-muted)", marginBottom: "4px" }}>
                {isAr ? "القيمة العادلة" : "Fair Value"}
              </p>
              <p
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "var(--c-text)",
                  fontFamily: "var(--font-grotesk)",
                }}
              >
                {fairValue.toFixed(2)}
                <span style={{ fontSize: "14px", color: "var(--c-muted)", marginLeft: "4px" }}>SAR</span>
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "12px", color: "var(--c-muted)", marginBottom: "4px" }}>
                {isAr ? "السعر الحالي" : "Current Price"}
              </p>
              <p
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "var(--c-text)",
                  fontFamily: "var(--font-grotesk)",
                }}
              >
                {currentPrice.toFixed(2)}
                <span style={{ fontSize: "14px", color: "var(--c-muted)", marginLeft: "4px" }}>SAR</span>
              </p>
            </div>
          </div>

          {/* Visual Range Bar */}
          <div style={{ marginTop: "8px" }}>
            <div
              style={{
                position: "relative",
                height: "8px",
                background: "var(--c-border)",
                borderRadius: "4px",
                overflow: "hidden",
              }}
            >
              {/* Bar showing current price position */}
              <div
                style={{
                  position: "absolute",
                  height: "100%",
                  background: getBarColor(),
                  left: "0%",
                  width: isUndervalued
                    ? `${((fairValue - currentPrice) / fairValue) * 100}%`
                    : `${((currentPrice - fairValue) / currentPrice) * 100}%`,
                  transition: "all 0.3s ease",
                }}
              />
            </div>
          </div>

          {/* Valuation Status */}
          <div style={{ marginTop: "12px" }}>
            <p
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: getStatusColor(),
                marginBottom: "4px",
              }}
            >
              {isAr ? `${valPercent}% ` : ``}
              {getStatusLabel()}
              {!isAr ? ` ${valPercent}%` : ""}
            </p>
            <p style={{ fontSize: "11px", color: "var(--c-muted)" }}>
              {isUndervalued
                ? isAr
                  ? "يتم تداول السهم بأقل من قيمته العادلة"
                  : "Trading below estimated fair value"
                : isAr
                  ? "يتم تداول السهم بأعلى من قيمته العادلة"
                  : "Trading above estimated fair value"}
            </p>
          </div>

          {/* Calculation Details (Small) */}
          <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--c-border)" }}>
            <p
              style={{
                fontSize: "10px",
                color: "var(--c-dim)",
                fontWeight: 600,
                marginBottom: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {isAr ? "الحساب" : "CALCULATION"}
            </p>
            <div style={{ fontSize: "11px", color: "var(--c-muted)", lineHeight: "1.6" }}>
              <p>
                {isAr ? "EPS × مكرر السعر" : "EPS × P/E Multiple"}
              </p>
              <p style={{ marginTop: "4px", color: "var(--c-text)", fontWeight: 600 }}>
                {eps?.toFixed(2)} × {sectorAvgPE ? Math.min(sectorAvgPE, 20) : 15} = {fairValue.toFixed(2)}
              </p>
            </div>
          </div>
        </>
      ) : (
        <div style={{ padding: "20px 0", textAlign: "center" }}>
          <p style={{ fontSize: "12px", color: "var(--c-muted)" }}>
            {isAr
              ? "بيانات غير كافية لتقدير القيمة العادلة"
              : "Insufficient data for fair value estimate"}
          </p>
        </div>
      )}

      {/* Disclaimer */}
      <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--c-border)" }}>
        <p style={{ fontSize: "9px", color: "var(--c-dim)", lineHeight: "1.4", fontStyle: "italic" }}>
          {isAr
            ? "تقدير قائم على نموذج بسيط. لا يشكل نصيحة استثمارية."
            : "Model-based estimate. Not investment advice."}
        </p>
      </div>
    </div>
  );
}
