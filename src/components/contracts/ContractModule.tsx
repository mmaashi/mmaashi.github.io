"use client";

import Link from "next/link";
import {
  FileText, TrendingUp, TrendingDown, Clock, ArrowRight,
  ShieldCheck, AlertTriangle, Zap, Calendar, Award,
} from "lucide-react";
import type {
  CompanyContract,
  ContractMomentum,
  ContractInterpretation,
  DisclosureType,
  MaterialityLabel,
  ReactionLabel,
  MomentumSignal,
} from "@/lib/contracts/types";

// ── Sub-components ──

// Latest contract card
function LatestContractCard({
  contract,
  interpretation,
  daysAgo,
  locale,
}: {
  contract: CompanyContract;
  interpretation: ContractInterpretation;
  daysAgo: number;
  locale: string;
}) {
  const isAr = locale === "ar";
  const c = contract;

  return (
    <div
      style={{
        padding: "18px 20px",
        borderRadius: 12,
        background: "linear-gradient(135deg, rgba(200,169,81,0.04), rgba(6,13,24,0.6))",
        border: "1px solid var(--c-gold-ring)",
        marginBottom: 16,
      }}
    >
      {/* Badge row */}
      <div className="flex items-center gap-2 mb-3" style={{ flexWrap: "wrap" }}>
        <span style={{
          fontSize: 9, fontWeight: 700, color: disclosureColor(c.disclosure_type),
          padding: "2px 8px", borderRadius: 4,
          background: `${disclosureColor(c.disclosure_type)}12`,
          border: `1px solid ${disclosureColor(c.disclosure_type)}20`,
          textTransform: "uppercase", letterSpacing: "0.05em",
        }}>
          {isAr ? disclosureLabelAr(c.disclosure_type) : disclosureLabelEn(c.disclosure_type)}
        </span>

        {c.materiality_label !== "unknown" && (
          <span style={{
            fontSize: 9, fontWeight: 700, color: materialityColorFn(c.materiality_label),
            padding: "2px 8px", borderRadius: 4,
            background: `${materialityColorFn(c.materiality_label)}12`,
            border: `1px solid ${materialityColorFn(c.materiality_label)}20`,
            textTransform: "uppercase", letterSpacing: "0.05em",
          }}>
            {isAr ? materialityLabelArFn(c.materiality_label) : c.materiality_label}
          </span>
        )}

        {c.reaction_label && (
          <span style={{
            fontSize: 9, fontWeight: 700, color: reactionColorFn(c.reaction_label),
            padding: "2px 8px", borderRadius: 4,
            background: `${reactionColorFn(c.reaction_label)}12`,
            border: `1px solid ${reactionColorFn(c.reaction_label)}20`,
            textTransform: "uppercase", letterSpacing: "0.05em",
          }}>
            {isAr ? reactionLabelArFn(c.reaction_label) : c.reaction_label} reaction
          </span>
        )}

        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 9, color: "var(--c-dim)" }}>
          {daysAgo === 0
            ? (isAr ? "اليوم" : "Today")
            : daysAgo === 1
              ? (isAr ? "أمس" : "Yesterday")
              : (isAr ? `منذ ${daysAgo} يومًا` : `${daysAgo} days ago`)}
        </span>
      </div>

      {/* Value + Counterparty */}
      <div className="flex items-baseline gap-3 mb-2">
        <span className="font-num font-bold" style={{ fontSize: 20, color: "var(--c-text)" }}>
          {c.value_disclosed && c.contract_value
            ? `${c.currency} ${fmtVal(c.contract_value)}`
            : (isAr ? "القيمة غير معلنة" : "Value undisclosed")}
        </span>
        {c.counterparty && (
          <span style={{ fontSize: 10, color: "var(--c-muted)" }}>
            {isAr ? "من" : "from"} {c.counterparty}
          </span>
        )}
      </div>

      {/* Interpretation sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
        <InterpBlock
          icon={<FileText size={10} />}
          label={isAr ? "ماذا حدث" : "What happened"}
          text={isAr ? interpretation.what_happened.ar : interpretation.what_happened.en}
        />
        <InterpBlock
          icon={<Zap size={10} />}
          label={isAr ? "لماذا قد يهم" : "Why it may matter"}
          text={isAr ? interpretation.why_it_matters.ar : interpretation.why_it_matters.en}
        />
        <InterpBlock
          icon={<ShieldCheck size={10} />}
          label={isAr ? "ما لا يزال غير واضح" : "What is still uncertain"}
          text={isAr ? interpretation.uncertainty.ar : interpretation.uncertainty.en}
        />
        {c.reaction_label && (
          <InterpBlock
            icon={c.reaction_day3 && c.reaction_day3 >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            label={isAr ? "ردة فعل السوق" : "Market reaction"}
            text={isAr ? interpretation.reaction_summary.ar : interpretation.reaction_summary.en}
          />
        )}
      </div>
    </div>
  );
}

function InterpBlock({ icon, label, text }: { icon: React.ReactNode; label: string; text: string }) {
  return (
    <div className="flex items-start gap-2">
      <div style={{ marginTop: 2, color: "var(--c-gold)", flexShrink: 0 }}>{icon}</div>
      <div>
        <span style={{ fontSize: 8, fontWeight: 700, color: "var(--c-dim)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          {label}
        </span>
        <p style={{ fontSize: 10, color: "var(--c-text-sm)", margin: 0, marginTop: 1, lineHeight: 1.5 }}>
          {text}
        </p>
      </div>
    </div>
  );
}

// Contract timeline
function ContractTimeline({
  contracts,
  locale,
}: {
  contracts: CompanyContract[];
  locale: string;
}) {
  const isAr = locale === "ar";
  const recent = contracts.slice(0, 8);

  if (recent.length === 0) return null;

  return (
    <div style={{ marginBottom: 16 }}>
      <span style={{ fontSize: 9, fontWeight: 700, color: "var(--c-dim)", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 10 }}>
        {isAr ? "الجدول الزمني" : "Contract timeline"}
      </span>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {recent.map((c, i) => (
          <div key={c.id || i} className="flex items-center gap-3" style={{ padding: "8px 12px", borderRadius: 8, background: "var(--c-elevated)", border: "1px solid var(--c-border)" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: disclosureColor(c.disclosure_type), flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: "var(--c-text)" }}>
                {isAr ? disclosureLabelAr(c.disclosure_type) : disclosureLabelEn(c.disclosure_type)}
              </span>
              {c.value_disclosed && c.contract_value && (
                <span className="font-num" style={{ fontSize: 10, color: "var(--c-gold)", marginLeft: 8 }}>
                  {c.currency} {fmtVal(c.contract_value)}
                </span>
              )}
            </div>
            <span style={{ fontSize: 9, color: "var(--c-dim)", flexShrink: 0 }}>
              {c.announcement_date}
            </span>
            <span style={{
              fontSize: 8, fontWeight: 700, color: materialityColorFn(c.materiality_label),
              padding: "1px 5px", borderRadius: 3,
              background: `${materialityColorFn(c.materiality_label)}12`,
            }}>
              {isAr ? materialityLabelArFn(c.materiality_label) : c.materiality_label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Stats bar
function ContractStats({
  momentum,
  locale,
  sar,
}: {
  momentum: ContractMomentum;
  locale: string;
  sar: string;
}) {
  const isAr = locale === "ar";
  const m = momentum;

  const stats = [
    { label: isAr ? "عقود ١٢ شهرًا" : "Contracts (12m)", value: String(m.contracts_12m), color: "var(--c-text)" },
    { label: isAr ? "القيمة المعلنة" : "Disclosed value", value: m.disclosed_value_12m > 0 ? `${sar} ${fmtVal(m.disclosed_value_12m)}` : "—", color: "var(--c-gold)" },
    { label: isAr ? "عقود جوهرية" : "Material", value: String(m.material_contracts_12m), color: "var(--c-green)" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${stats.length}, 1fr)`, gap: 8, marginBottom: 16 }}>
      {stats.map((s, i) => (
        <div key={i} style={{ padding: "10px 12px", borderRadius: 8, background: "var(--c-elevated)", border: "1px solid var(--c-border)", textAlign: "center" }}>
          <span style={{ fontSize: 9, color: "var(--c-dim)", fontWeight: 600 }}>{s.label}</span>
          <p className="font-num font-bold" style={{ fontSize: 14, color: s.color, margin: 0, marginTop: 3 }}>{s.value}</p>
        </div>
      ))}
    </div>
  );
}

// ── Main module ──

interface ContractModuleProps {
  contracts: CompanyContract[];
  momentum: ContractMomentum | null;
  latestInterpretation: ContractInterpretation | null;
  locale: string;
  sar: string;
}

export default function ContractModule({
  contracts,
  momentum,
  latestInterpretation,
  locale,
  sar,
}: ContractModuleProps) {
  const isAr = locale === "ar";
  const latest = contracts[0] ?? null;
  const daysAgo = latest
    ? Math.floor((Date.now() - new Date(latest.announcement_date).getTime()) / 86400000)
    : 0;

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <Award size={14} style={{ color: "var(--c-gold)" }} />
        <h3 className="font-bold" style={{ fontSize: 14, color: "var(--c-text)", fontFamily: "var(--font-grotesk)", flex: 1 }}>
          {isAr ? "العقود والأعمال الجديدة" : "Contracts & business wins"}
        </h3>
        {momentum && (
          <span style={{
            fontSize: 9, fontWeight: 700, color: momentumColorFn(momentum.momentum_signal),
            padding: "3px 10px", borderRadius: 6,
            background: `${momentumColorFn(momentum.momentum_signal)}15`,
            border: `1px solid ${momentumColorFn(momentum.momentum_signal)}25`,
          }}>
            {isAr ? momentumSignalAr(momentum.momentum_signal) : momentum.momentum_signal}
          </span>
        )}
      </div>

      {/* Momentum signal line */}
      {momentum && (
        <p style={{ fontSize: 10, color: "var(--c-muted)", marginBottom: 14, lineHeight: 1.5 }}>
          {isAr ? (momentum.signal_line_ar ?? "") : (momentum.signal_line_en ?? "")}
        </p>
      )}

      {contracts.length === 0 ? (
        <div className="card" style={{ padding: "24px", textAlign: "center" }}>
          <p style={{ fontSize: 11, color: "var(--c-dim)" }}>
            {isAr ? "لا إعلانات عقود مسجلة لهذه الشركة" : "No contract announcements recorded for this company"}
          </p>
        </div>
      ) : (
        <>
          {/* Stats */}
          {momentum && <ContractStats momentum={momentum} locale={locale} sar={sar} />}

          {/* Latest contract card */}
          {latest && latestInterpretation && (
            <LatestContractCard
              contract={latest}
              interpretation={latestInterpretation}
              daysAgo={daysAgo}
              locale={locale}
            />
          )}

          {/* Timeline */}
          <ContractTimeline contracts={contracts} locale={locale} />
        </>
      )}
    </div>
  );
}

// ── Helpers ──

function fmtVal(val: number): string {
  if (val >= 1e9) return `${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e6) return `${(val / 1e6).toFixed(0)}M`;
  if (val >= 1e3) return `${(val / 1e3).toFixed(0)}K`;
  return val.toLocaleString();
}

function disclosureColor(type: DisclosureType): string {
  switch (type) {
    case "contract_award": case "signed_contract": case "project_execution": return "var(--c-green)";
    case "extension": case "renewal": return "var(--c-gold)";
    case "mou": case "framework_agreement": return "var(--c-muted)";
    default: return "#60a5fa";
  }
}

function disclosureLabelEn(type: DisclosureType): string {
  const map: Record<DisclosureType, string> = {
    contract_award: "New award", signed_contract: "Signed", extension: "Extension",
    renewal: "Renewal", framework_agreement: "Framework", mou: "MOU",
    supply_agreement: "Supply", service_agreement: "Service", project_execution: "Project",
  };
  return map[type] ?? "Contract";
}

function disclosureLabelAr(type: DisclosureType): string {
  const map: Record<DisclosureType, string> = {
    contract_award: "عقد جديد", signed_contract: "توقيع", extension: "تمديد",
    renewal: "تجديد", framework_agreement: "إطاري", mou: "مذكرة تفاهم",
    supply_agreement: "توريد", service_agreement: "خدمات", project_execution: "تنفيذ مشروع",
  };
  return map[type] ?? "عقد";
}

function materialityColorFn(label: MaterialityLabel): string {
  switch (label) {
    case "major": return "var(--c-green)";
    case "meaningful": return "var(--c-gold)";
    case "moderate": return "var(--c-muted)";
    default: return "var(--c-dim)";
  }
}

function materialityLabelArFn(label: MaterialityLabel): string {
  const map: Record<MaterialityLabel, string> = { major: "كبير", meaningful: "مهم", moderate: "متوسط", minor: "بسيط", unknown: "غير محدد" };
  return map[label];
}

function reactionColorFn(label: ReactionLabel): string {
  switch (label) {
    case "positive": return "var(--c-green)";
    case "mixed": return "var(--c-gold)";
    case "muted": return "var(--c-dim)";
    case "negative": return "var(--c-red)";
  }
}

function reactionLabelArFn(label: ReactionLabel): string {
  const map: Record<ReactionLabel, string> = { positive: "إيجابي", mixed: "متباين", muted: "محدود", negative: "سلبي" };
  return map[label];
}

function momentumColorFn(signal: MomentumSignal): string {
  switch (signal) {
    case "active": return "var(--c-green)";
    case "improving": return "#4ade80";
    case "steady": return "var(--c-gold)";
    case "slowing": return "var(--c-red)";
    default: return "var(--c-dim)";
  }
}

function momentumSignalAr(signal: MomentumSignal): string {
  const map: Record<MomentumSignal, string> = { active: "نشط", improving: "متحسن", steady: "مستقر", slowing: "متراجع", limited: "محدود", dormant: "خامل" };
  return map[signal];
}
