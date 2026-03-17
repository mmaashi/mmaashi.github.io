"use client";

import { useState } from "react";
import { Briefcase, Plus, Check, Pencil } from "lucide-react";
import { usePortfolio } from "@/hooks/usePortfolio";
import PortfolioModal from "./PortfolioModal";

interface Props {
  ticker: string;
  companyName: string;
  companyId?: string;
  currentPrice?: number;
  locale: string;
}

export default function PortfolioButton({
  ticker,
  companyName,
  companyId,
  currentPrice,
  locale,
}: Props) {
  const { hasHolding, getHolding, addHolding, updateHolding, removeHolding, isLoaded } = usePortfolio();
  const [showModal, setShowModal] = useState(false);
  const isAr = locale === "ar";

  if (!isLoaded) return null;

  const inPortfolio = hasHolding(ticker);
  const existing = getHolding(ticker);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 16px",
          borderRadius: 8,
          border: inPortfolio ? "1px solid var(--c-green)" : "1px solid var(--c-gold)",
          background: inPortfolio ? "rgba(14,203,129,0.08)" : "rgba(200,169,81,0.08)",
          color: inPortfolio ? "var(--c-green)" : "var(--c-gold)",
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "var(--font-grotesk), system-ui",
          transition: "all 0.2s ease",
          whiteSpace: "nowrap",
        }}
      >
        {inPortfolio ? (
          <>
            <Check size={13} />
            {isAr ? "في المحفظة" : "In portfolio"}
            <Pencil size={10} style={{ opacity: 0.6 }} />
          </>
        ) : (
          <>
            <Plus size={13} />
            {isAr ? "أضف للمحفظة" : "Add to portfolio"}
          </>
        )}
      </button>

      {showModal && (
        <PortfolioModal
          ticker={ticker}
          companyName={companyName}
          companyId={companyId}
          currentPrice={currentPrice}
          locale={locale}
          existing={existing}
          onSave={(holding) => {
            if (inPortfolio) {
              updateHolding(ticker, holding);
            } else {
              addHolding(holding);
            }
          }}
          onRemove={inPortfolio ? removeHolding : undefined}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
