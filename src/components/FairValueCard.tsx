"use client";

import { DollarSign, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface FairValueCardProps {
  currentPrice: number | null;
  fairValue: number | null;
  model: string;
  adjustedPE: number | null;
  analystTarget: number | null;
  locale: string;
}

export default function FairValueCard({
  currentPrice,
  fairValue,
  model,
  adjustedPE,
  analystTarget,
  locale,
}: FairValueCardProps) {
  const isAr = locale === "ar";
  const sar = isAr ? "ر.س" : "SAR";

  if (!currentPrice || !fairValue) {
    return (
      <div className="card" style={{ padding: "32px 24px", textAlign: "center" }}>
        <DollarSign size={28} style={{ color: "var(--c-dim)", margin: "0 auto 12px" }} />
        <p style={{ fontSize: 14, color: "var(--c-muted)" }}>
          {isAr ? "لا تتوفر بيانات كافية لتقدير القيمة العادلة" : "Not enough data for fair value estimate"}
        </p>
      </div>
    );
  }

  const diff = ((fairValue - currentPrice) / currentPrice) * 100;
  const isUnder = diff > 10;
  const isOver = diff < -10;
  const statusColor = isUnder ? "var(--c-green)" : isOver ? "var(--c-red)" : "var(--c-gold)";
  const statusBg = isUnder ? "var(--c-green-bg)" : isOver ? "var(--c-red-bg)" : "var(--c-gold-dim)";
  const statusRing = isUnder ? "var(--c-green-ring)" : isOver ? "var(--c-red-ring)" : "var(--c-gold-ring)";

  // Price bar visualization
  const minVal = Math.min(currentPrice, fairValue, analystTarget ?? Infinity) * 0.85;
  const maxVal = Math.max(currentPrice, fairValue, analystTarget ?? 0) * 1.15;
  const range = maxVal - minVal;
  const currentPos = ((currentPrice - minVal) / range) * 100;
  const fairPos = ((fairValue - minVal) / range) * 100;
  const analystPos = analystTarget ? ((analystTarget - minVal) / range) * 100 : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Main verdict card */}
      <div className="card" style={{ padding: "24px 28px" }}>
        <div className="flex items-center gap-2 mb-5">
          <DollarSign size={16} style={{ color: "var(--c-gold)" }} />
          <h2 className="font-bold" style={{ fontSize: 16, color: "var(--c-text)" }}>
            {isAr ? "التقييم العادل" : "Fair Value Analysis"}
          </h2>
        </div>

        {/* Price comparison */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <div>
            <p className="metric-label">{isAr ? "السعر الحالي" : "Current Price"}</p>
            <span className="font-num font-bold" style={{ fontSize: 24, color: "var(--c-text)" }}>
              {sar} {currentPrice.toFixed(2)}
            </span>
          </div>
          <div>
            <p className="metric-label">{isAr ? "القيمة العادلة" : "Fair Value"}</p>
            <span className="font-num font-bold" style={{ fontSize: 24, color: statusColor }}>
              {sar} {fairValue.toFixed(2)}
            </span>
          </div>
          <div>
            <p className="metric-label">{isAr ? "الفرق" : "Difference"}</p>
            <div>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "5px 12px",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 700,
                  background: statusBg,
                  color: statusColor,
                  border: `1px solid ${statusRing}`,
                }}
              >
                {isUnder ? <TrendingUp size={14} /> : isOver ? <TrendingDown size={14} /> : <Minus size={14} />}
                {diff > 0 ? "+" : ""}{diff.toFixed(1)}%
              </span>
              <p style={{ fontSize: 11, color: statusColor, marginTop: 4, fontWeight: 600 }}>
                {isUnder
                  ? (isAr ? "مخفّض — فرصة شراء محتملة" : "Undervalued — Potential buy opportunity")
                  : isOver
                  ? (isAr ? "مرتفع — قد يكون مبالغاً فيه" : "Overvalued — May be overpriced")
                  : (isAr ? "سعر عادل" : "Fairly priced")}
              </p>
            </div>
          </div>
        </div>

        {/* Visual price bar */}
        <div style={{ position: "relative", height: 48, marginBottom: 20 }}>
          <div
            style={{
              position: "absolute",
              top: 20,
              left: 0,
              right: 0,
              height: 8,
              background: "var(--c-border)",
              borderRadius: 4,
            }}
          />
          {/* Current price marker */}
          <div
            style={{
              position: "absolute",
              left: `${currentPos}%`,
              top: 10,
              transform: "translateX(-50%)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 12,
                height: 28,
                background: "var(--c-text)",
                borderRadius: 3,
                margin: "0 auto",
                border: "2px solid var(--c-surface)",
              }}
            />
            <span className="font-num" style={{ fontSize: 9, color: "var(--c-muted)", marginTop: 2, display: "block" }}>
              {isAr ? "الحالي" : "Now"}
            </span>
          </div>
          {/* Fair value marker */}
          <div
            style={{
              position: "absolute",
              left: `${fairPos}%`,
              top: 10,
              transform: "translateX(-50%)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 12,
                height: 28,
                background: statusColor,
                borderRadius: 3,
                margin: "0 auto",
                border: "2px solid var(--c-surface)",
                boxShadow: `0 0 8px ${statusColor}40`,
              }}
            />
            <span className="font-num" style={{ fontSize: 9, color: statusColor, marginTop: 2, display: "block", fontWeight: 600 }}>
              FV
            </span>
          </div>
          {/* Analyst target marker */}
          {analystPos !== null && analystTarget && (
            <div
              style={{
                position: "absolute",
                left: `${analystPos}%`,
                top: 10,
                transform: "translateX(-50%)",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 12,
                  height: 28,
                  background: "var(--c-gold)",
                  borderRadius: 3,
                  margin: "0 auto",
                  border: "2px solid var(--c-surface)",
                }}
              />
              <span className="font-num" style={{ fontSize: 9, color: "var(--c-gold)", marginTop: 2, display: "block" }}>
                {isAr ? "محلل" : "Analyst"}
              </span>
            </div>
          )}
        </div>

        {/* Model details */}
        <div
          style={{
            padding: "12px 16px",
            background: "var(--c-base)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--c-border)",
          }}
        >
          <p style={{ fontSize: 11, color: "var(--c-muted)", marginBottom: 4 }}>
            {isAr ? "النموذج المستخدم" : "Model Used"}
          </p>
          <p style={{ fontSize: 12, color: "var(--c-text-sm)" }}>
            {model === "pe_based"
              ? (isAr
                  ? `تقييم بمضاعف الأرباح: EPS × ${adjustedPE}x`
                  : `P/E Multiple Model: EPS × ${adjustedPE}x adjusted multiple`)
              : model}
          </p>
          <p style={{ fontSize: 10, color: "var(--c-dim)", marginTop: 6 }}>
            {isAr
              ? "⚠️ تقدير مبسط — لا يُعدّ توصية استثمارية"
              : "⚠️ Simplified estimate — not investment advice"}
          </p>
        </div>
      </div>

      {/* Analyst target card */}
      {analystTarget && (
        <div className="card" style={{ padding: "18px 22px" }}>
          <p className="metric-label" style={{ marginBottom: 6 }}>
            {isAr ? "هدف المحللين" : "Analyst Consensus Target"}
          </p>
          <div className="flex items-center gap-3">
            <span className="font-num font-bold" style={{ fontSize: 20, color: "var(--c-gold)" }}>
              {sar} {analystTarget.toFixed(2)}
            </span>
            <span
              className="font-num"
              style={{
                fontSize: 12,
                color: analystTarget > (currentPrice ?? 0)
                  ? "var(--c-green)"
                  : "var(--c-red)",
              }}
            >
              ({analystTarget > (currentPrice ?? 0) ? "+" : ""}
              {(((analystTarget - (currentPrice ?? 0)) / (currentPrice ?? 1)) * 100).toFixed(1)}%)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
