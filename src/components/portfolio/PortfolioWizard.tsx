"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  ChevronRight, ChevronLeft, Check, Plus, Search,
  Pencil, Trash2, Upload, Eye, Bookmark,
  Sparkles, ArrowRight, X, AlertCircle,
} from "lucide-react";

// ════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════

interface StockResult {
  id: string;
  ticker: string;
  name_en: string;
  name_ar: string;
  sector: string;
  latest_price: number | null;
}

interface HoldingEntry {
  id?: string;
  ticker: string;
  company_id: string;
  name_en: string;
  name_ar: string;
  sector: string;
  quantity: number;
  average_cost: number | null;
  purchase_date: string | null;
  latest_price: number | null;
}

interface PortfolioWizardProps {
  locale: string;
}

type SetupMethod = "manual" | "import" | "watchlist";

// ════════════════════════════════════════════════════════════════
// Helpers
// ════════════════════════════════════════════════════════════════

function dn(locale: string, en: string, ar: string) {
  return locale === "ar" && ar ? ar : en;
}

function fmtSAR(val: number): string {
  return val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div className="flex items-center justify-between mb-2">
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--c-muted)" }}>
          Step {step} of {total}
        </span>
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--c-gold)" }}>
          {Math.round((step / total) * 100)}%
        </span>
      </div>
      <div style={{ height: 4, borderRadius: 4, background: "var(--c-border)", overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${(step / total) * 100}%`,
            borderRadius: 4,
            background: "var(--c-gold)",
            transition: "width 0.4s ease",
          }}
        />
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// Main Wizard
// ════════════════════════════════════════════════════════════════

export default function PortfolioWizard({ locale }: PortfolioWizardProps) {
  const isAr = locale === "ar";
  const [step, setStep] = useState(1);
  const [method, setMethod] = useState<SetupMethod>("manual");
  const [holdings, setHoldings] = useState<HoldingEntry[]>([]);
  const [portfolioId, setPortfolioId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showExit, setShowExit] = useState(false);

  // Step 3 form state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<StockResult[]>([]);
  const [selectedStock, setSelectedStock] = useState<StockResult | null>(null);
  const [quantity, setQuantity] = useState("");
  const [avgCost, setAvgCost] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [skipCost, setSkipCost] = useState(false);
  const [formError, setFormError] = useState("");
  const [searching, setSearching] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  // Import state
  const [importText, setImportText] = useState("");

  // Create portfolio on mount
  useEffect(() => {
    async function init() {
      try {
        const res = await fetch("/api/portfolio");
        if (res.ok) {
          const data = await res.json();
          setPortfolioId(data.id);
          if (data.holdings && data.holdings.length > 0) {
            // Existing portfolio — skip to dashboard
            window.location.href = `/${locale}/portfolio`;
          }
        }
      } catch { /* ignore */ }
    }
    init();
  }, [locale]);

  // Stock search with debounce
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q);
    setSelectedStock(null);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (q.length < 1) { setSearchResults([]); return; }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/companies/search?q=${encodeURIComponent(q)}`);
        if (res.ok) setSearchResults(await res.json());
      } catch { /* ignore */ }
      setSearching(false);
    }, 250);
  }, []);

  function selectStock(s: StockResult) {
    setSelectedStock(s);
    setSearchQuery(dn(locale, s.name_en, s.name_ar) + " (" + s.ticker + ")");
    setSearchResults([]);
  }

  function resetForm() {
    setSearchQuery("");
    setSelectedStock(null);
    setQuantity("");
    setAvgCost("");
    setPurchaseDate("");
    setSkipCost(false);
    setFormError("");
    setEditingIdx(null);
  }

  async function addHolding() {
    if (!selectedStock) { setFormError(isAr ? "يرجى اختيار سهم." : "Please choose a stock."); return; }
    const qty = parseFloat(quantity);
    if (!qty || qty <= 0) { setFormError(isAr ? "أدخل كمية صحيحة." : "Enter a valid quantity."); return; }
    const cost = skipCost ? null : parseFloat(avgCost);
    if (!skipCost && (!cost || cost <= 0)) { setFormError(isAr ? "أدخل سعر شراء صحيح، أو تخطَّه." : "Enter a valid average price, or skip it for now."); return; }

    // Check duplicate
    const existingIdx = holdings.findIndex((h) => h.ticker === selectedStock.ticker);
    if (existingIdx >= 0 && editingIdx === null) {
      setFormError(isAr ? "هذا السهم موجود بالفعل." : "This stock is already in your portfolio.");
      return;
    }

    const entry: HoldingEntry = {
      ticker: selectedStock.ticker,
      company_id: selectedStock.id,
      name_en: selectedStock.name_en,
      name_ar: selectedStock.name_ar,
      sector: selectedStock.sector,
      quantity: qty,
      average_cost: cost,
      purchase_date: purchaseDate || null,
      latest_price: selectedStock.latest_price,
    };

    if (editingIdx !== null) {
      const updated = [...holdings];
      updated[editingIdx] = { ...updated[editingIdx], ...entry };
      setHoldings(updated);
    } else {
      setHoldings([...holdings, entry]);
    }

    resetForm();
    if (step === 3) setStep(4);
  }

  function editHolding(idx: number) {
    const h = holdings[idx];
    setEditingIdx(idx);
    setSearchQuery(dn(locale, h.name_en, h.name_ar) + " (" + h.ticker + ")");
    setSelectedStock({ id: h.company_id, ticker: h.ticker, name_en: h.name_en, name_ar: h.name_ar, sector: h.sector, latest_price: h.latest_price });
    setQuantity(String(h.quantity));
    setAvgCost(h.average_cost != null ? String(h.average_cost) : "");
    setSkipCost(h.average_cost === null);
    setPurchaseDate(h.purchase_date || "");
    setStep(3);
  }

  function removeHolding(idx: number) {
    setHoldings(holdings.filter((_, i) => i !== idx));
  }

  function parseImport() {
    const lines = importText.trim().split("\n").filter(Boolean);
    const parsed: HoldingEntry[] = [];
    for (const line of lines) {
      const parts = line.split(/[,\t]+/).map((s) => s.trim());
      if (parts.length >= 2) {
        const ticker = parts[0];
        const qty = parseFloat(parts[1]);
        const cost = parts[2] ? parseFloat(parts[2]) : null;
        if (ticker && qty > 0) {
          parsed.push({
            ticker,
            company_id: "",
            name_en: ticker,
            name_ar: ticker,
            sector: "",
            quantity: qty,
            average_cost: cost && cost > 0 ? cost : null,
            purchase_date: null,
            latest_price: null,
          });
        }
      }
    }
    if (parsed.length > 0) {
      setHoldings(parsed);
      setStep(5);
    } else {
      setFormError(isAr ? "تنسيق غير صحيح. يرجى إدخال: رمز السهم، الكمية، سعر الشراء" : "Invalid format. Please use: ticker, quantity, average cost (one per line).");
    }
  }

  async function confirmPortfolio() {
    if (!portfolioId || holdings.length === 0) return;
    setSaving(true);
    try {
      for (const h of holdings) {
        await fetch("/api/portfolio/holdings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            portfolio_id: portfolioId,
            ticker: h.ticker,
            company_id: h.company_id || undefined,
            quantity: h.quantity,
            average_cost: h.average_cost,
            purchase_date: h.purchase_date,
          }),
        });
      }
      setStep(6);
    } catch {
      setFormError(isAr ? "حدث خطأ. يرجى المحاولة مرة أخرى." : "Something went wrong. Please try again.");
    }
    setSaving(false);
  }

  // Computed values
  const totalValue = holdings.reduce((sum, h) => sum + (h.latest_price || 0) * h.quantity, 0);
  const totalCost = holdings.reduce((sum, h) => sum + (h.average_cost || 0) * h.quantity, 0);
  const largestHolding = holdings.length > 0 ? holdings.reduce((a, b) => ((a.latest_price || 0) * a.quantity > (b.latest_price || 0) * b.quantity ? a : b)) : null;
  const sectors = [...new Set(holdings.map((h) => h.sector).filter(Boolean))];

  // ════════════════════════════════════════════════════════════════
  // Render
  // ════════════════════════════════════════════════════════════════

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "24px 16px", minHeight: "80vh" }}>

      {/* Exit confirmation modal */}
      {showExit && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)" }}>
          <div className="card" style={{ padding: "28px 24px", maxWidth: 360, width: "90%" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--c-text)", marginBottom: 8, fontFamily: "var(--font-grotesk)" }}>
              {isAr ? "مغادرة الإعداد؟" : "Leave portfolio setup?"}
            </h3>
            <p style={{ fontSize: 12, color: "var(--c-muted)", lineHeight: 1.6, marginBottom: 20 }}>
              {isAr ? "تقدمك محفوظ. يمكنك العودة والإكمال في أي وقت." : "Your progress is saved. You can come back and finish anytime."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { window.location.href = `/${locale}/portfolio`; }}
                style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "1px solid var(--c-border)", background: "transparent", color: "var(--c-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
              >
                {isAr ? "غادر الآن" : "Leave for now"}
              </button>
              <button
                onClick={() => setShowExit(false)}
                style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "none", background: "var(--c-gold)", color: "var(--c-base)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-grotesk)" }}
              >
                {isAr ? "تابع" : "Keep going"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════ */}
      {/* STEP 1 — WELCOME */}
      {/* ══════════════════════════════════════ */}
      {step === 1 && (
        <div style={{ paddingTop: 32 }}>
          <ProgressBar step={1} total={6} />

          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div
              style={{
                width: 56, height: 56, borderRadius: 16, margin: "0 auto 16px",
                background: "var(--c-gold-dim)", border: "1px solid var(--c-gold-ring)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Sparkles size={24} style={{ color: "var(--c-gold)" }} />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--c-text)", fontFamily: "var(--font-grotesk)", marginBottom: 10 }}>
              {isAr ? "أنشئ محفظتك" : "Create your portfolio"}
            </h1>
            <p style={{ fontSize: 13, color: "var(--c-muted)", lineHeight: 1.7, maxWidth: 400, margin: "0 auto" }}>
              {isAr
                ? "تتبّع مقتنياتك، راقب أداءك، واحصل على رؤى مخصصة في مكان واحد."
                : "Track your holdings, follow your performance, and get personalized insights in one place."}
            </p>
          </div>

          {/* Steps preview */}
          <div className="card" style={{ padding: "20px 20px", marginBottom: 24 }}>
            {[
              { icon: "1", en: "Add the stocks you own", ar: "أضِف الأسهم التي تملكها" },
              { icon: "2", en: "Enter how many shares you bought", ar: "أدخل عدد الأسهم التي اشتريتها" },
              { icon: "3", en: "Add your average purchase price", ar: "أضف متوسط سعر الشراء" },
              { icon: "4", en: "We'll build your live dashboard instantly", ar: "سنبني لوحة تحكمك فورًا" },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3" style={{ padding: "10px 0", borderBottom: i < 3 ? "1px solid var(--c-border)" : "none" }}>
                <div
                  style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                    background: "var(--c-gold-dim)", border: "1px solid var(--c-gold-ring)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700, color: "var(--c-gold)",
                  }}
                >
                  {s.icon}
                </div>
                <span style={{ fontSize: 12, color: "var(--c-text-sm)" }}>
                  {isAr ? s.ar : s.en}
                </span>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 11, color: "var(--c-dim)", textAlign: "center", marginBottom: 20 }}>
            {isAr ? "ابدأ بسهم واحد. يمكنك الإضافة في أي وقت." : "Start with just one stock. You can add more anytime."}
          </p>

          <button
            onClick={() => setStep(2)}
            style={{
              width: "100%", padding: "14px 0", borderRadius: 10, border: "none",
              background: "var(--c-gold)", color: "var(--c-base)", fontSize: 14,
              fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-grotesk)",
              marginBottom: 10,
            }}
          >
            {isAr ? "ابدأ الآن" : "Start now"}
          </button>

          <div className="flex items-center justify-center gap-4">
            <Link href={`/${locale}/portfolio`} style={{ fontSize: 12, color: "var(--c-muted)", textDecoration: "none" }}>
              {isAr ? "أنا أتصفح فقط" : "I'm just exploring"}
            </Link>
            <span style={{ color: "var(--c-border)" }}>·</span>
            <Link href={`/${locale}/portfolio`} style={{ fontSize: 12, color: "var(--c-gold)", textDecoration: "none" }}>
              {isAr ? "عرض محفظة نموذجية" : "View sample portfolio"}
            </Link>
          </div>

          <p style={{ fontSize: 10, color: "var(--c-dim)", textAlign: "center", marginTop: 16 }}>
            {isAr ? "يمكنك تعديل كل شيء لاحقًا." : "You can edit everything later."}
          </p>
        </div>
      )}

      {/* ══════════════════════════════════════ */}
      {/* STEP 2 — CHOOSE METHOD */}
      {/* ══════════════════════════════════════ */}
      {step === 2 && (
        <div>
          <ProgressBar step={2} total={6} />

          <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--c-text)", fontFamily: "var(--font-grotesk)", marginBottom: 6 }}>
            {isAr ? "كيف تريد البدء؟" : "How would you like to start?"}
          </h2>
          <p style={{ fontSize: 12, color: "var(--c-muted)", marginBottom: 20 }}>
            {isAr ? "اختر الطريقة الأسهل لبناء محفظتك." : "Choose the easiest way to build your portfolio."}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
            {([
              { key: "manual" as SetupMethod, icon: <Plus size={16} />, en: "Add manually", enDesc: "Search for a stock, enter how many shares you own, and add your average buy price.", ar: "إضافة يدوية", arDesc: "ابحث عن سهم، أدخل عدد الأسهم التي تملكها، وأضف متوسط سعر الشراء." },
              { key: "import" as SetupMethod, icon: <Upload size={16} />, en: "Import a simple list", enDesc: "Paste your holdings in a clean format and we'll help organize them.", ar: "استيراد من قائمة", arDesc: "الصق مقتنياتك بتنسيق بسيط وسنساعدك في تنظيمها." },
              { key: "watchlist" as SetupMethod, icon: <Bookmark size={16} />, en: "Start with a watchlist", enDesc: "Not ready to add real holdings yet? Begin by tracking stocks you care about.", ar: "ابدأ بقائمة متابعة", arDesc: "لست مستعدًا لإضافة مقتنيات حقيقية؟ ابدأ بتتبع الأسهم التي تهمك." },
            ]).map((opt) => (
              <button
                key={opt.key}
                onClick={() => setMethod(opt.key)}
                className="card"
                style={{
                  padding: "16px 18px", textAlign: isAr ? "right" : "left", cursor: "pointer",
                  border: method === opt.key ? "2px solid var(--c-gold)" : "1px solid var(--c-border)",
                  background: method === opt.key ? "var(--c-gold-dim)" : "var(--c-surface)",
                  transition: "all 0.15s",
                }}
              >
                <div className="flex items-center gap-3 mb-1">
                  <div style={{ color: method === opt.key ? "var(--c-gold)" : "var(--c-muted)" }}>{opt.icon}</div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--c-text)", fontFamily: "var(--font-grotesk)" }}>
                    {isAr ? opt.ar : opt.en}
                  </span>
                </div>
                <p style={{ fontSize: 11, color: "var(--c-muted)", lineHeight: 1.5, marginLeft: isAr ? 0 : 28, marginRight: isAr ? 28 : 0 }}>
                  {isAr ? opt.arDesc : opt.enDesc}
                </p>
              </button>
            ))}
          </div>

          <p style={{ fontSize: 10, color: "var(--c-dim)", marginBottom: 16 }}>
            {isAr ? "معظم المستخدمين يبدؤون بالإضافة اليدوية." : "Most users start by adding holdings manually."}
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              style={{ flex: 0, padding: "12px 20px", borderRadius: 8, border: "1px solid var(--c-border)", background: "transparent", color: "var(--c-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => {
                if (method === "watchlist") {
                  window.location.href = `/${locale}/portfolio`;
                } else if (method === "import") {
                  setStep(3);
                } else {
                  setStep(3);
                }
              }}
              style={{ flex: 1, padding: "12px 0", borderRadius: 8, border: "none", background: "var(--c-gold)", color: "var(--c-base)", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-grotesk)" }}
            >
              {isAr ? "متابعة" : "Continue"} <ChevronRight size={14} style={{ display: "inline", verticalAlign: "middle" }} />
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════ */}
      {/* STEP 3 — ADD HOLDING (or IMPORT) */}
      {/* ══════════════════════════════════════ */}
      {step === 3 && (
        <div>
          <ProgressBar step={3} total={6} />

          {method === "import" ? (
            <>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--c-text)", fontFamily: "var(--font-grotesk)", marginBottom: 6 }}>
                {isAr ? "استيراد المقتنيات" : "Import your holdings"}
              </h2>
              <p style={{ fontSize: 12, color: "var(--c-muted)", marginBottom: 16 }}>
                {isAr ? "الصق مقتنياتك بتنسيق: رمز السهم، الكمية، متوسط السعر (سطر لكل سهم)" : "Paste your holdings: ticker, quantity, average cost (one per line)"}
              </p>
              <textarea
                value={importText}
                onChange={(e) => { setImportText(e.target.value); setFormError(""); }}
                placeholder={isAr ? "2222, 50, 28.50\n1120, 200, 82.00" : "2222, 50, 28.50\n1120, 200, 82.00"}
                style={{
                  width: "100%", minHeight: 140, padding: 14, borderRadius: 10,
                  border: "1px solid var(--c-border)", background: "var(--c-surface)",
                  color: "var(--c-text)", fontSize: 13, fontFamily: "monospace",
                  resize: "vertical",
                }}
              />
              {formError && <p style={{ fontSize: 11, color: "var(--c-red)", marginTop: 8 }}>{formError}</p>}
              <div className="flex gap-3 mt-4">
                <button onClick={() => setStep(2)} style={{ padding: "12px 20px", borderRadius: 8, border: "1px solid var(--c-border)", background: "transparent", color: "var(--c-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  <ChevronLeft size={14} />
                </button>
                <button onClick={parseImport} style={{ flex: 1, padding: "12px 0", borderRadius: 8, border: "none", background: "var(--c-gold)", color: "var(--c-base)", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-grotesk)" }}>
                  {isAr ? "استيراد" : "Import holdings"}
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--c-text)", fontFamily: "var(--font-grotesk)", marginBottom: 6 }}>
                {editingIdx !== null
                  ? (isAr ? "تعديل المقتنى" : "Edit holding")
                  : holdings.length === 0
                    ? (isAr ? "أضف أول مقتنى" : "Add your first holding")
                    : (isAr ? "أضف مقتنى آخر" : "Add another holding")
                }
              </h2>
              <p style={{ fontSize: 12, color: "var(--c-muted)", marginBottom: 20 }}>
                {isAr ? "لنبدأ بسهم تملكه بالفعل." : "Let's start with one stock you already own."}
              </p>

              {/* Stock search */}
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--c-dim)", display: "block", marginBottom: 6 }}>
                {isAr ? "السهم" : "Stock"}
              </label>
              <div style={{ position: "relative", marginBottom: 14 }}>
                <div style={{ position: "relative" }}>
                  <Search size={14} style={{ position: "absolute", left: 12, top: 13, color: "var(--c-dim)" }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder={isAr ? "ابحث باسم الشركة أو رمز السهم" : "Search by company name or ticker"}
                    style={{
                      width: "100%", padding: "10px 12px 10px 34px", borderRadius: 8,
                      border: "1px solid var(--c-border)", background: "var(--c-surface)",
                      color: "var(--c-text)", fontSize: 13, outline: "none",
                    }}
                  />
                  {selectedStock && (
                    <button onClick={() => { setSelectedStock(null); setSearchQuery(""); }} style={{ position: "absolute", right: 10, top: 10, background: "none", border: "none", cursor: "pointer", color: "var(--c-dim)" }}>
                      <X size={14} />
                    </button>
                  )}
                </div>
                {searchResults.length > 0 && !selectedStock && (
                  <div
                    className="card"
                    style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 20, marginTop: 4, maxHeight: 240, overflowY: "auto", padding: 4 }}
                  >
                    {searchResults.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => selectStock(s)}
                        style={{
                          width: "100%", padding: "10px 12px", textAlign: isAr ? "right" : "left",
                          background: "transparent", border: "none", cursor: "pointer",
                          borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "space-between",
                        }}
                        className="hover:bg-[var(--c-hover)]"
                      >
                        <div>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--c-text)" }}>
                            {dn(locale, s.name_en, s.name_ar)}
                          </span>
                          <span className="font-num" style={{ fontSize: 10, color: "var(--c-dim)", marginLeft: 8 }}>
                            {s.ticker}
                          </span>
                        </div>
                        {s.latest_price != null && (
                          <span className="font-num" style={{ fontSize: 11, color: "var(--c-muted)" }}>
                            {fmtSAR(s.latest_price)} SAR
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quantity */}
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--c-dim)", display: "block", marginBottom: 6 }}>
                {isAr ? "كم سهم تملك؟" : "How many shares do you own?"}
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => { setQuantity(e.target.value); setFormError(""); }}
                placeholder={isAr ? "أدخل الكمية" : "Enter quantity"}
                min="1"
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 8, marginBottom: 14,
                  border: "1px solid var(--c-border)", background: "var(--c-surface)",
                  color: "var(--c-text)", fontSize: 13, outline: "none",
                }}
              />

              {/* Average cost */}
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--c-dim)", display: "block", marginBottom: 6 }}>
                {isAr ? "ما متوسط سعر الشراء؟" : "What is your average buy price?"}
              </label>
              <input
                type="number"
                value={avgCost}
                onChange={(e) => { setAvgCost(e.target.value); setFormError(""); }}
                placeholder={isAr ? "أدخل متوسط السعر" : "Enter average price"}
                disabled={skipCost}
                min="0"
                step="0.01"
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 8, marginBottom: 8,
                  border: "1px solid var(--c-border)", background: skipCost ? "var(--c-elevated)" : "var(--c-surface)",
                  color: skipCost ? "var(--c-dim)" : "var(--c-text)", fontSize: 13, outline: "none",
                }}
              />
              <label className="flex items-center gap-2" style={{ marginBottom: 14, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={skipCost}
                  onChange={(e) => { setSkipCost(e.target.checked); if (e.target.checked) setAvgCost(""); setFormError(""); }}
                  style={{ accentColor: "var(--c-gold)" }}
                />
                <span style={{ fontSize: 11, color: "var(--c-muted)" }}>
                  {isAr ? "لا أعرف متوسط سعر الشراء" : "I don't know my average buy price"}
                </span>
              </label>
              {skipCost && (
                <p style={{ fontSize: 10, color: "var(--c-dim)", marginBottom: 14, paddingLeft: 20 }}>
                  {isAr ? "لا بأس — يمكنك متابعة السهم وتحديث السعر لاحقًا." : "That's okay — you can still track the holding and update the price later."}
                </p>
              )}

              {/* Optional purchase date */}
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--c-dim)", display: "block", marginBottom: 6 }}>
                {isAr ? "تاريخ الشراء" : "Purchase date"} <span style={{ color: "var(--c-dim)", fontWeight: 400 }}>({isAr ? "اختياري" : "Optional"})</span>
              </label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 8, marginBottom: 16,
                  border: "1px solid var(--c-border)", background: "var(--c-surface)",
                  color: "var(--c-text)", fontSize: 13, outline: "none",
                }}
              />

              {/* Live preview */}
              {selectedStock && quantity && (
                <div className="card" style={{ padding: "14px 16px", marginBottom: 16, background: "var(--c-gold-dim)", border: "1px solid var(--c-gold-ring)" }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "var(--c-gold)", marginBottom: 8, letterSpacing: "0.05em" }}>
                    {isAr ? "معاينة المقتنى" : "HOLDING PREVIEW"}
                  </p>
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--c-text)" }}>
                      {dn(locale, selectedStock.name_en, selectedStock.name_ar)}
                    </span>
                    <span className="font-num" style={{ fontSize: 10, color: "var(--c-dim)" }}>{selectedStock.ticker}</span>
                  </div>
                  {selectedStock.latest_price != null && (
                    <div className="flex items-center justify-between mt-2">
                      <span style={{ fontSize: 10, color: "var(--c-muted)" }}>{isAr ? "القيمة السوقية المقدرة" : "Estimated market value"}</span>
                      <span className="font-num font-bold" style={{ fontSize: 13, color: "var(--c-text)" }}>
                        SAR {fmtSAR(selectedStock.latest_price * parseFloat(quantity || "0"))}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {formError && (
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle size={12} style={{ color: "var(--c-red)", flexShrink: 0 }} />
                  <p style={{ fontSize: 11, color: "var(--c-red)" }}>{formError}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => { resetForm(); setStep(holdings.length > 0 ? 4 : 2); }} style={{ padding: "12px 20px", borderRadius: 8, border: "1px solid var(--c-border)", background: "transparent", color: "var(--c-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  <ChevronLeft size={14} />
                </button>
                <button onClick={addHolding} style={{ flex: 1, padding: "12px 0", borderRadius: 8, border: "none", background: "var(--c-gold)", color: "var(--c-base)", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-grotesk)" }}>
                  {editingIdx !== null ? (isAr ? "حفظ التعديل" : "Save changes") : (isAr ? "إضافة المقتنى" : "Add holding")}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════ */}
      {/* STEP 4 — ADD MORE */}
      {/* ══════════════════════════════════════ */}
      {step === 4 && (
        <div>
          <ProgressBar step={4} total={6} />

          {/* Success toast */}
          <div className="flex items-center gap-2 mb-4" style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
            <Check size={14} style={{ color: "var(--c-green)" }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--c-green)" }}>
              {holdings.length === 1
                ? (isAr ? "بداية رائعة — أول مقتنى تمت إضافته." : "Nice start — your first holding is added.")
                : (isAr ? `تمت الإضافة. لديك الآن ${holdings.length} مقتنيات.` : `Added. You now have ${holdings.length} holdings.`)
              }
            </span>
          </div>

          <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--c-text)", fontFamily: "var(--font-grotesk)", marginBottom: 6 }}>
            {isAr ? "أضف المزيد من المقتنيات" : "Add more holdings"}
          </h2>
          <p style={{ fontSize: 12, color: "var(--c-muted)", marginBottom: 20 }}>
            {isAr ? "محفظتك بدأت تتشكّل." : "Your portfolio is starting to take shape."}
          </p>

          {/* Summary */}
          <div className="card" style={{ padding: "16px 18px", marginBottom: 16 }}>
            <div className="flex items-center justify-between mb-2">
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--c-dim)" }}>{isAr ? "المقتنيات المضافة" : "Holdings added"}</span>
              <span className="font-num font-bold" style={{ fontSize: 14, color: "var(--c-text)" }}>{holdings.length}</span>
            </div>
            {largestHolding && (
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--c-dim)" }}>{isAr ? "أكبر مقتنى" : "Largest holding"}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--c-text)" }}>
                  {dn(locale, largestHolding.name_en, largestHolding.name_ar)}
                </span>
              </div>
            )}
            {totalValue > 0 && (
              <div className="flex items-center justify-between">
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--c-dim)" }}>{isAr ? "القيمة المقدرة" : "Estimated value"}</span>
                <span className="font-num font-bold" style={{ fontSize: 14, color: "var(--c-gold)" }}>
                  SAR {fmtSAR(totalValue)}
                </span>
              </div>
            )}
          </div>

          {/* Holdings list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
            {holdings.map((h, i) => (
              <div key={`${h.ticker}-${i}`} className="flex items-center gap-3" style={{ padding: "10px 12px", borderRadius: 8, background: "var(--c-elevated)", border: "1px solid var(--c-border)" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--c-text)" }}>
                    {dn(locale, h.name_en, h.name_ar)}
                  </span>
                  <span className="font-num" style={{ fontSize: 10, color: "var(--c-dim)", marginLeft: 6 }}>{h.ticker}</span>
                  <span className="font-num" style={{ fontSize: 10, color: "var(--c-muted)", marginLeft: 6 }}>×{h.quantity}</span>
                </div>
                <button onClick={() => editHolding(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--c-dim)", padding: 4 }}>
                  <Pencil size={12} />
                </button>
                <button onClick={() => removeHolding(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--c-red)", padding: 4 }}>
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>

          {holdings.length === 1 && (
            <p style={{ fontSize: 10, color: "var(--c-dim)", marginBottom: 12, textAlign: "center" }}>
              {isAr ? "حاليًا، هذا السهم يشكل 100% من محفظتك." : "Right now, this stock makes up 100% of your portfolio."}
            </p>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button
              onClick={() => { resetForm(); setStep(3); }}
              style={{ width: "100%", padding: "12px 0", borderRadius: 8, border: "1px solid var(--c-gold-ring)", background: "var(--c-gold-dim)", color: "var(--c-gold)", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-grotesk)" }}
            >
              <Plus size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
              {isAr ? "أضف مقتنى آخر" : "Add another holding"}
            </button>
            <button
              onClick={() => setStep(5)}
              style={{ width: "100%", padding: "12px 0", borderRadius: 8, border: "none", background: "var(--c-gold)", color: "var(--c-base)", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-grotesk)" }}
            >
              {isAr ? "إنهاء المحفظة" : "Finish portfolio"} <ArrowRight size={14} style={{ display: "inline", verticalAlign: "middle" }} />
            </button>
          </div>

          <p style={{ fontSize: 10, color: "var(--c-dim)", textAlign: "center", marginTop: 12 }}>
            {isAr ? "يمكنك مواصلة بناء محفظتك في أي وقت." : "You can keep building your portfolio anytime."}
          </p>
        </div>
      )}

      {/* ══════════════════════════════════════ */}
      {/* STEP 5 — REVIEW */}
      {/* ══════════════════════════════════════ */}
      {step === 5 && (
        <div>
          <ProgressBar step={5} total={6} />

          <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--c-text)", fontFamily: "var(--font-grotesk)", marginBottom: 6 }}>
            {isAr ? "راجع محفظتك" : "Review your portfolio"}
          </h2>
          <p style={{ fontSize: 12, color: "var(--c-muted)", marginBottom: 20 }}>
            {isAr ? "إليك نظرة سريعة قبل بناء لوحة التحكم." : "Here's a quick look before we build your dashboard."}
          </p>

          {/* Holdings table */}
          <div className="card" style={{ padding: "16px 18px", marginBottom: 16 }}>
            <h3 style={{ fontSize: 11, fontWeight: 700, color: "var(--c-dim)", letterSpacing: "0.05em", marginBottom: 10 }}>
              {isAr ? "مقتنياتك" : "YOUR HOLDINGS"}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {holdings.map((h, i) => {
                const mktVal = (h.latest_price || 0) * h.quantity;
                const costVal = (h.average_cost || 0) * h.quantity;
                const gain = h.average_cost && h.latest_price ? mktVal - costVal : null;
                const gainPct = gain !== null && costVal > 0 ? (gain / costVal) * 100 : null;

                return (
                  <div key={`${h.ticker}-${i}`} style={{ padding: "10px 12px", borderRadius: 8, background: "var(--c-elevated)", border: "1px solid var(--c-border)" }}>
                    <div className="flex items-center justify-between mb-1">
                      <div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--c-text)" }}>
                          {dn(locale, h.name_en, h.name_ar)}
                        </span>
                        <span className="font-num" style={{ fontSize: 10, color: "var(--c-dim)", marginLeft: 6 }}>{h.ticker}</span>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => editHolding(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--c-dim)", padding: 4 }}>
                          <Pencil size={11} />
                        </button>
                        <button onClick={() => removeHolding(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--c-red)", padding: 4 }}>
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-4" style={{ fontSize: 10, color: "var(--c-muted)" }}>
                      <span>{isAr ? "الكمية" : "Qty"}: <strong className="font-num">{h.quantity}</strong></span>
                      {h.average_cost != null && (
                        <span>{isAr ? "المتوسط" : "Avg"}: <strong className="font-num">{fmtSAR(h.average_cost)}</strong></span>
                      )}
                      {mktVal > 0 && (
                        <span>{isAr ? "القيمة" : "Value"}: <strong className="font-num">SAR {fmtSAR(mktVal)}</strong></span>
                      )}
                      {gainPct !== null && (
                        <span style={{ color: gain! >= 0 ? "var(--c-green)" : "var(--c-red)", fontWeight: 600 }}>
                          {gain! >= 0 ? "+" : ""}{gainPct.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Preview insights */}
          <div className="card" style={{ padding: "16px 18px", marginBottom: 16 }}>
            <h3 style={{ fontSize: 11, fontWeight: 700, color: "var(--c-dim)", letterSpacing: "0.05em", marginBottom: 10 }}>
              {isAr ? "ما يمكننا إظهاره" : "WHAT WE CAN SHOW YOU"}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {totalValue > 0 && (
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: 11, color: "var(--c-muted)" }}>{isAr ? "القيمة المقدرة" : "Estimated value"}</span>
                  <span className="font-num font-bold" style={{ fontSize: 13, color: "var(--c-gold)" }}>SAR {fmtSAR(totalValue)}</span>
                </div>
              )}
              {largestHolding && (
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: 11, color: "var(--c-muted)" }}>{isAr ? "أكبر مقتنى" : "Top holding"}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "var(--c-text)" }}>{dn(locale, largestHolding.name_en, largestHolding.name_ar)}</span>
                </div>
              )}
              {sectors.length > 0 && (
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: 11, color: "var(--c-muted)" }}>{isAr ? "القطاعات" : "Sector mix"}</span>
                  <span style={{ fontSize: 11, color: "var(--c-text)" }}>{sectors.length} {isAr ? "قطاعات" : "sectors"}</span>
                </div>
              )}
            </div>
          </div>

          {/* Early insights */}
          <div className="card" style={{ padding: "16px 18px", marginBottom: 20, background: "var(--c-gold-dim)", border: "1px solid var(--c-gold-ring)" }}>
            <h3 style={{ fontSize: 11, fontWeight: 700, color: "var(--c-gold)", letterSpacing: "0.05em", marginBottom: 10 }}>
              {isAr ? "رؤى أولية" : "EARLY INSIGHTS"}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {holdings.length === 1 && (
                <p style={{ fontSize: 11, color: "var(--c-text-sm)", lineHeight: 1.5 }}>
                  {isAr ? "محفظتك مركزة في سهم واحد." : "Your portfolio is concentrated in one stock."}
                </p>
              )}
              {holdings.length > 1 && largestHolding && totalValue > 0 && (
                <p style={{ fontSize: 11, color: "var(--c-text-sm)", lineHeight: 1.5 }}>
                  {isAr
                    ? `${dn(locale, largestHolding.name_en, largestHolding.name_ar)} يشكّل ${(((largestHolding.latest_price || 0) * largestHolding.quantity / totalValue) * 100).toFixed(0)}% من محفظتك.`
                    : `${dn(locale, largestHolding.name_en, largestHolding.name_ar)} makes up ${(((largestHolding.latest_price || 0) * largestHolding.quantity / totalValue) * 100).toFixed(0)}% of your portfolio.`
                  }
                </p>
              )}
              {sectors.length === 1 && (
                <p style={{ fontSize: 11, color: "var(--c-text-sm)", lineHeight: 1.5 }}>
                  {isAr ? `جميع مقتنياتك في قطاع واحد.` : `All your holdings are in one sector.`}
                </p>
              )}
              {sectors.length >= 3 && (
                <p style={{ fontSize: 11, color: "var(--c-text-sm)", lineHeight: 1.5 }}>
                  {isAr ? "محفظتك متنوعة عبر عدة قطاعات." : "Your portfolio looks diversified across sectors."}
                </p>
              )}
            </div>
          </div>

          <p style={{ fontSize: 10, color: "var(--c-dim)", textAlign: "center", marginBottom: 16 }}>
            {isAr ? "لا شيء نهائي — يمكنك تعديل مقتنياتك في أي وقت." : "Nothing is final — you can edit your holdings anytime."}
          </p>

          {formError && <p style={{ fontSize: 11, color: "var(--c-red)", marginBottom: 8, textAlign: "center" }}>{formError}</p>}

          <div className="flex gap-3">
            <button onClick={() => setStep(4)} style={{ padding: "12px 20px", borderRadius: 8, border: "1px solid var(--c-border)", background: "transparent", color: "var(--c-muted)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={confirmPortfolio}
              disabled={saving || holdings.length === 0}
              style={{
                flex: 1, padding: "12px 0", borderRadius: 8, border: "none",
                background: saving ? "var(--c-dim)" : "var(--c-gold)",
                color: "var(--c-base)", fontSize: 13, fontWeight: 700,
                cursor: saving ? "wait" : "pointer", fontFamily: "var(--font-grotesk)",
              }}
            >
              {saving ? (isAr ? "جارٍ الحفظ..." : "Saving...") : (isAr ? "تأكيد المحفظة" : "Confirm portfolio")}
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════ */}
      {/* STEP 6 — SUCCESS */}
      {/* ══════════════════════════════════════ */}
      {step === 6 && (
        <div style={{ paddingTop: 32, textAlign: "center" }}>
          <div
            style={{
              width: 64, height: 64, borderRadius: 20, margin: "0 auto 20px",
              background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Check size={28} style={{ color: "var(--c-green)" }} />
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--c-text)", fontFamily: "var(--font-grotesk)", marginBottom: 8 }}>
            {isAr ? "محفظتك جاهزة" : "Your portfolio is ready"}
          </h2>
          <p style={{ fontSize: 13, color: "var(--c-muted)", lineHeight: 1.6, maxWidth: 380, margin: "0 auto 24px" }}>
            {isAr
              ? "بنينا لوحة التحكم الخاصة بك وأبرزنا ما يهمك الآن."
              : "We built your dashboard and highlighted what matters most right now."}
          </p>

          {/* Instant insights */}
          <div className="card" style={{ padding: "20px 20px", marginBottom: 24, textAlign: isAr ? "right" : "left" }}>
            <h3 style={{ fontSize: 11, fontWeight: 700, color: "var(--c-gold)", letterSpacing: "0.05em", marginBottom: 12 }}>
              {isAr ? "ما يبرز اليوم" : "WHAT STANDS OUT TODAY"}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {largestHolding && totalValue > 0 && (
                <div className="flex items-start gap-2">
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--c-gold)", marginTop: 5, flexShrink: 0 }} />
                  <p style={{ fontSize: 12, color: "var(--c-text-sm)", lineHeight: 1.5 }}>
                    {isAr
                      ? `أكبر مركز لك: ${dn(locale, largestHolding.name_en, largestHolding.name_ar)} (${(((largestHolding.latest_price || 0) * largestHolding.quantity / totalValue) * 100).toFixed(0)}%).`
                      : `Your biggest position: ${dn(locale, largestHolding.name_en, largestHolding.name_ar)} (${(((largestHolding.latest_price || 0) * largestHolding.quantity / totalValue) * 100).toFixed(0)}%).`
                    }
                  </p>
                </div>
              )}
              <div className="flex items-start gap-2">
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--c-green)", marginTop: 5, flexShrink: 0 }} />
                <p style={{ fontSize: 12, color: "var(--c-text-sm)", lineHeight: 1.5 }}>
                  {holdings.length >= 3
                    ? (isAr ? "محفظتك متنوعة عبر عدة أسهم." : "Your portfolio spans multiple holdings.")
                    : (isAr ? "أضف المزيد من الأسهم للحصول على رؤى تنويع أفضل." : "Add more holdings for better diversification insights.")}
                </p>
              </div>
              {sectors.length <= 1 && holdings.length > 1 && (
                <div className="flex items-start gap-2">
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--c-red)", marginTop: 5, flexShrink: 0 }} />
                  <p style={{ fontSize: 12, color: "var(--c-text-sm)", lineHeight: 1.5 }}>
                    {isAr ? "مقتنياتك مركزة في قطاع واحد." : "Your holdings are concentrated in one sector."}
                  </p>
                </div>
              )}
            </div>
          </div>

          <p style={{ fontSize: 10, color: "var(--c-dim)", marginBottom: 20 }}>
            {isAr ? "محفظتك خاصة ومرئية لك فقط." : "Your portfolio is private and only visible to you."}
          </p>

          <Link
            href={`/${locale}/portfolio`}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "14px 32px", borderRadius: 10, textDecoration: "none",
              background: "var(--c-gold)", color: "var(--c-base)", fontSize: 14,
              fontWeight: 700, fontFamily: "var(--font-grotesk)",
            }}
          >
            {isAr ? "افتح محفظتي" : "Open my portfolio"} <ArrowRight size={16} />
          </Link>

          <div className="flex items-center justify-center gap-4 mt-4">
            <Link href={`/${locale}/portfolio`} style={{ fontSize: 12, color: "var(--c-muted)", textDecoration: "none" }}>
              {isAr ? "إضافة قائمة متابعة" : "Add a watchlist"}
            </Link>
            <span style={{ color: "var(--c-border)" }}>·</span>
            <Link href={`/${locale}/screener`} style={{ fontSize: 12, color: "var(--c-gold)", textDecoration: "none" }}>
              {isAr ? "استكشف أفكار مطابقة" : "Explore matching ideas"}
            </Link>
          </div>

          <p style={{ fontSize: 11, color: "var(--c-muted)", marginTop: 24, lineHeight: 1.6 }}>
            {isAr
              ? "بداية رائعة — ستستمر محفظتك في التحديث مع تغير بيانات السوق."
              : "Great start — your portfolio will keep updating as market data changes."}
          </p>
        </div>
      )}
    </div>
  );
}
