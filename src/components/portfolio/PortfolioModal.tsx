"use client";

import { useState, useEffect } from "react";
import { X, Check, Trash2 } from "lucide-react";
import type { PortfolioHolding } from "@/hooks/usePortfolio";
import { t } from "@/lib/i18n";

interface Props {
  ticker: string;
  companyName: string;
  companyId?: string;
  currentPrice?: number;
  locale: string;
  existing?: PortfolioHolding;
  onSave: (holding: PortfolioHolding) => void;
  onRemove?: (ticker: string) => void;
  onClose: () => void;
}

export default function PortfolioModal({
  ticker,
  companyName,
  companyId,
  currentPrice,
  locale,
  existing,
  onSave,
  onRemove,
  onClose,
}: Props) {
  const isAr = locale === "ar";
  const isEdit = !!existing;

  const [quantity, setQuantity] = useState(existing?.quantity?.toString() || "");
  const [avgCost, setAvgCost] = useState(existing?.averageCost?.toString() || "");
  const [skipCost, setSkipCost] = useState(existing ? existing.averageCost === null : false);
  const [purchaseDate, setPurchaseDate] = useState(existing?.purchaseDate || "");
  const [saved, setSaved] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  // Estimate value
  const qty = parseFloat(quantity) || 0;
  const cost = skipCost ? null : parseFloat(avgCost) || null;
  const estimatedValue = currentPrice && qty > 0 ? qty * currentPrice : null;
  const gainLoss = estimatedValue && cost && qty > 0 ? estimatedValue - qty * cost : null;

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  function handleSave() {
    if (qty <= 0) return;
    onSave({
      ticker,
      companyId,
      companyName,
      quantity: qty,
      averageCost: skipCost ? null : cost,
      purchaseDate: purchaseDate || undefined,
    });
    setSaved(true);
    setTimeout(() => onClose(), 1200);
  }

  function handleRemove() {
    if (!confirmRemove) {
      setConfirmRemove(true);
      return;
    }
    onRemove?.(ticker);
    onClose();
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          margin: "0 16px",
          background: "var(--c-surface)",
          border: "1px solid var(--c-border)",
          borderRadius: 16,
          padding: "24px 20px",
          boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
          direction: isAr ? "rtl" : "ltr",
        }}
      >
        {/* ── Success state ── */}
        {saved ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(14,203,129,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <Check size={24} style={{ color: "var(--c-green)" }} />
            </div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "var(--c-text)", margin: 0, marginBottom: 4 }}>
              {isAr ? "تم الحفظ" : "Saved"}
            </p>
            <p style={{ fontSize: 11, color: "var(--c-muted)", margin: 0 }}>
              {isAr
                ? `${companyName} الآن في محفظتك`
                : `${companyName} is now in your portfolio`}
            </p>
          </div>
        ) : (
          <>
            {/* ── Header ── */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: "var(--c-text)", margin: 0, marginBottom: 2 }}>
                  {isEdit
                    ? (isAr ? "تعديل المركز" : "Edit holding")
                    : (isAr ? "إضافة إلى المحفظة" : "Add to portfolio")}
                </p>
                <p style={{ fontSize: 11, color: "var(--c-muted)", margin: 0 }}>
                  {companyName} ({ticker})
                </p>
              </div>
              <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--c-dim)", padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            {/* ── Quantity ── */}
            <label style={{ display: "block", marginBottom: 14 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--c-muted)", display: "block", marginBottom: 5 }}>
                {isAr ? "عدد الأسهم" : "Number of shares"} *
              </span>
              <input
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder={isAr ? "مثال: 100" : "e.g. 100"}
                autoFocus
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--c-border)",
                  background: "var(--c-base)",
                  color: "var(--c-text)",
                  fontSize: 14,
                  fontFamily: "var(--font-num)",
                  outline: "none",
                  direction: "ltr",
                  textAlign: isAr ? "right" : "left",
                }}
              />
            </label>

            {/* ── Average Cost ── */}
            <label style={{ display: "block", marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--c-muted)", display: "block", marginBottom: 5 }}>
                {isAr ? "متوسط سعر الشراء" : "Average buy price"} (SAR)
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={avgCost}
                onChange={(e) => setAvgCost(e.target.value)}
                disabled={skipCost}
                placeholder={isAr ? "مثال: 45.50" : "e.g. 45.50"}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--c-border)",
                  background: skipCost ? "var(--c-border)" : "var(--c-base)",
                  color: skipCost ? "var(--c-dim)" : "var(--c-text)",
                  fontSize: 14,
                  fontFamily: "var(--font-num)",
                  outline: "none",
                  direction: "ltr",
                  textAlign: isAr ? "right" : "left",
                  opacity: skipCost ? 0.5 : 1,
                }}
              />
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={skipCost}
                onChange={(e) => { setSkipCost(e.target.checked); if (e.target.checked) setAvgCost(""); }}
                style={{ width: 14, height: 14, accentColor: "var(--c-gold)" }}
              />
              <span style={{ fontSize: 10, color: "var(--c-dim)" }}>
                {isAr ? "لا أعرف متوسط سعر الشراء" : "I don't know my average cost"}
              </span>
            </label>

            {/* ── Optional date ── */}
            <label style={{ display: "block", marginBottom: 16 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--c-muted)", display: "block", marginBottom: 5 }}>
                {isAr ? "تاريخ الشراء" : "Purchase date"}{" "}
                <span style={{ color: "var(--c-dim)", fontWeight: 400 }}>({isAr ? "اختياري" : "optional"})</span>
              </span>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid var(--c-border)",
                  background: "var(--c-base)",
                  color: "var(--c-text)",
                  fontSize: 13,
                  outline: "none",
                }}
              />
            </label>

            {/* ── Live preview ── */}
            {qty > 0 && (
              <div style={{
                padding: "10px 12px",
                borderRadius: 8,
                background: "rgba(200,169,81,0.04)",
                border: "1px solid var(--c-border)",
                marginBottom: 16,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: "var(--c-muted)" }}>{isAr ? "القيمة التقديرية" : "Estimated value"}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--c-text)", fontFamily: "var(--font-num)" }}>
                    {estimatedValue ? `SAR ${estimatedValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "—"}
                  </span>
                </div>
                {gainLoss !== null && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 10, color: "var(--c-muted)" }}>{isAr ? "الربح/الخسارة" : "Gain/Loss"}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: gainLoss >= 0 ? "var(--c-green)" : "var(--c-red)", fontFamily: "var(--font-num)" }}>
                      {gainLoss >= 0 ? "+" : ""}{gainLoss.toLocaleString(undefined, { maximumFractionDigits: 0 })} SAR
                    </span>
                  </div>
                )}
                {skipCost && (
                  <p style={{ fontSize: 9, color: "var(--c-dim)", margin: "6px 0 0", lineHeight: 1.4 }}>
                    {isAr
                      ? "يمكنك إضافة متوسط التكلفة لاحقًا لحساب العوائد."
                      : "You can add your average cost later to calculate returns."}
                  </p>
                )}
              </div>
            )}

            {/* ── Actions ── */}
            <div style={{ display: "flex", gap: 10 }}>
              {isEdit && onRemove && (
                <button
                  onClick={handleRemove}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "1px solid var(--c-red)",
                    background: confirmRemove ? "var(--c-red)" : "transparent",
                    color: confirmRemove ? "#fff" : "var(--c-red)",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Trash2 size={12} />
                  {confirmRemove ? (isAr ? "تأكيد الحذف" : "Confirm") : (isAr ? "حذف" : "Remove")}
                </button>
              )}
              <div style={{ flex: 1 }} />
              <button
                onClick={onClose}
                style={{
                  padding: "10px 18px",
                  borderRadius: 8,
                  border: "1px solid var(--c-border)",
                  background: "transparent",
                  color: "var(--c-muted)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {isAr ? "إلغاء" : "Cancel"}
              </button>
              <button
                onClick={handleSave}
                disabled={qty <= 0}
                style={{
                  padding: "10px 22px",
                  borderRadius: 8,
                  border: "none",
                  background: qty > 0 ? "var(--c-gold)" : "var(--c-border)",
                  color: qty > 0 ? "var(--c-base)" : "var(--c-dim)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: qty > 0 ? "pointer" : "not-allowed",
                  fontFamily: "var(--font-grotesk)",
                }}
              >
                {isAr ? "حفظ" : "Save holding"}
              </button>
            </div>

            {/* Helper text */}
            <p style={{ fontSize: 9, color: "var(--c-dim)", margin: "10px 0 0", textAlign: "center" }}>
              {isAr ? "يمكنك التعديل في أي وقت." : "You can edit this anytime."}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
