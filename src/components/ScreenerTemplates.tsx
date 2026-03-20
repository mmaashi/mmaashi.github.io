"use client";

import React from "react";
import {
  Crown,
  TrendingUp,
  DollarSign,
  Target,
  Shield,
  Zap,
  Star,
  Sparkles,
} from "lucide-react";

interface ScreenerTemplate {
  key: string;
  labelEn: string;
  labelAr: string;
  descEn: string;
  descAr: string;
  icon: React.ReactNode;
  filters: Record<string, any>;
}

const TEMPLATES: ScreenerTemplate[] = [
  {
    key: "bank_quality",
    labelEn: "Bank Quality",
    labelAr: "جودة البنوك",
    descEn: "ROE > 15%, Div > 3%, Ratio > 1",
    descAr: "عائد الملكية > 15%، توزيعات > 3%",
    icon: <Crown size={18} />,
    filters: {
      minROE: "15",
      minDivYield: "3",
      minCurrentRatio: "1",
    },
  },
  {
    key: "growth_stars",
    labelEn: "Growth Stars",
    labelAr: "نجوم النمو",
    descEn: "Revenue > 20%, EPS > 15%, P/E < 25",
    descAr: "إيرادات > 20%، أرباح > 15%، مكرر < 25",
    icon: <TrendingUp size={18} />,
    filters: {
      minRevenueGrowth: "20",
      minEPSGrowth: "15",
      maxPE: "25",
    },
  },
  {
    key: "dividend_champions",
    labelEn: "Dividend Champions",
    labelAr: "أبطال التوزيعات",
    descEn: "Div > 4%, Payout < 80%, 5+ yrs",
    descAr: "توزيعات > 4%، نسبة < 80%",
    icon: <DollarSign size={18} />,
    filters: {
      minDivYield: "4",
      maxPayoutRatio: "80",
      minDividendYears: "5",
    },
  },
  {
    key: "value_hunters",
    labelEn: "Value Hunters",
    labelAr: "صائدو القيمة",
    descEn: "P/E < 12, P/B < 1.5, EPS > 0",
    descAr: "مكرر < 12، القيمة الدفترية < 1.5",
    icon: <Target size={18} />,
    filters: {
      maxPE: "12",
      maxPB: "1.5",
      minEPS: "0",
    },
  },
  {
    key: "low_debt_fortress",
    labelEn: "Low Debt Fortress",
    labelAr: "حصون الديون المنخفضة",
    descEn: "D/E < 0.5, Ratio > 2, Cash Flow > 0",
    descAr: "دين/ملكية < 0.5، نسبة > 2",
    icon: <Shield size={18} />,
    filters: {
      maxDE: "0.5",
      minCurrentRatio: "2",
      minCashFlow: "0",
    },
  },
  {
    key: "momentum_riders",
    labelEn: "Momentum Riders",
    labelAr: "راكبو الزخم",
    descEn: "1Y Ret > 20%, 3M > 10%, Above 52W mid",
    descAr: "عائد سنوي > 20%، ثلاثي > 10%",
    icon: <Zap size={18} />,
    filters: {
      min1YReturn: "20",
      min3MReturn: "10",
      above52WMidpoint: "true",
    },
  },
  {
    key: "shariah_value",
    labelEn: "Shariah Compliant Value",
    labelAr: "قيمة شرعية",
    descEn: "Shariah ✓, P/E < 15, Div > 2%",
    descAr: "شرعية ✓، مكرر < 15، توزيعات > 2%",
    icon: <Star size={18} />,
    filters: {
      shariah: "true",
      maxPE: "15",
      minDivYield: "2",
    },
  },
  {
    key: "small_cap_gems",
    labelEn: "Small Cap Gems",
    labelAr: "أحجار كريمة صغيرة",
    descEn: "Market Cap < 5B SAR, ROE > 12%, Rev > 10%",
    descAr: "قيمة < 5 مليار، عائد > 12%، إيرادات > 10%",
    icon: <Sparkles size={18} />,
    filters: {
      maxMarketCap: "5000000000",
      minROE: "12",
      minRevenueGrowth: "10",
    },
  },
];

interface Props {
  locale: string;
  onApplyTemplate: (filters: Record<string, any>) => void;
}

export default function ScreenerTemplates({ locale, onApplyTemplate }: Props) {
  const isAr = locale === "ar";

  return (
    <div
      className="mb-6"
      style={{
        overflowX: "auto",
        WebkitOverflowScrolling: "touch",
        background: "var(--c-base)",
        paddingTop: 4,
        paddingBottom: 4,
      }}
    >
      <div
        className="flex gap-3"
        style={{
          minWidth: "max-content",
          paddingBottom: 4,
        }}
      >
        {TEMPLATES.map((template) => (
          <button
            key={template.key}
            onClick={() => onApplyTemplate(template.filters)}
            className="template-card"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              width: "180px",
              height: "120px",
              padding: "12px",
              borderRadius: "12px",
              border: "1px solid var(--c-border-md)",
              background: "var(--c-surface)",
              cursor: "pointer",
              transition: "all 0.2s ease",
              textAlign: "center",
              position: "relative",
              overflow: "hidden",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.borderColor = "var(--c-gold)";
              el.style.boxShadow = "0 0 20px rgba(200,169,81,0.3)";
              el.style.background = "var(--c-elevated)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.borderColor = "var(--c-border-md)";
              el.style.boxShadow = "none";
              el.style.background = "var(--c-surface)";
            }}
          >
            {/* Icon */}
            <div
              style={{
                color: "var(--c-gold)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {template.icon}
            </div>

            {/* Template Name */}
            <div
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "var(--c-text)",
                lineHeight: "1.2",
              }}
            >
              {isAr ? template.labelAr : template.labelEn}
            </div>

            {/* Description */}
            <div
              style={{
                fontSize: "10px",
                color: "var(--c-muted)",
                lineHeight: "1.3",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {isAr ? template.descAr : template.descEn}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
