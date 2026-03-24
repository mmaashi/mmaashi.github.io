import { createServiceClient } from "@/lib/supabase/server";
import { t } from "@/lib/i18n";
import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  Calendar,
  BarChart3,
  ArrowRight,
  Coins,
  PieChart,
  Sparkles,
} from "lucide-react";
import DividendWhatIf from "@/components/DividendWhatIf";

export const revalidate = 900;

// ── Types ──
interface DivRecord {
  ex_date: string;
  amount_per_share: string;
  year: number;
}

interface HoldingForecast {
  ticker: string;
  name_en: string;
  name_ar: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  annualDPS: number; // trailing 12-month dividend per share
  annualIncome: number; // annualDPS * shares
  yieldOnCost: number; // annualDPS / avgCost
  currentYield: number; // annualDPS / currentPrice
  payFrequency: number; // payments per year
  nextExDate: string | null;
  lastExDate: string | null;
  divHistory: { month: number; amount: number }[];
  streak: number; // consecutive years of payments
}

// Demo portfolio (same as My SŪQAI page)
const DEMO_HOLDINGS = [
  { ticker: "2222", shares: 50, avgCost: 28.5 },
  { ticker: "1120", shares: 200, avgCost: 82.0 },
  { ticker: "2350", shares: 150, avgCost: 35.6 },
  { ticker: "7010", shares: 100, avgCost: 140.0 },
  { ticker: "2380", shares: 300, avgCost: 10.5 },
  { ticker: "1010", shares: 120, avgCost: 40.8 },
];

export default async function DividendForecastPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isAr = locale === "ar";
  const supabase = createServiceClient();

  // ── Fetch data ──
  const tickers = DEMO_HOLDINGS.map((h) => h.ticker);

  const [companiesResult, dividendsResult, pricesResult] = await Promise.allSettled([
    supabase
      .from("companies")
      .select("id, ticker, name_en, name_ar")
      .in("ticker", tickers),
    supabase
      .from("dividends")
      .select("company_id, ex_date, amount_per_share, year")
      .order("ex_date", { ascending: false }),
    supabase
      .from("stock_prices")
      .select("company_id, close, date")
      .order("date", { ascending: false }),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const companies: any[] = companiesResult.status === "fulfilled" ? companiesResult.value.data ?? [] : [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allDividends: any[] = dividendsResult.status === "fulfilled" ? dividendsResult.value.data ?? [] : [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allPrices: any[] = pricesResult.status === "fulfilled" ? pricesResult.value.data ?? [] : [];

  // Build lookups
  const companyByTicker = new Map<string, { id: string; name_en: string; name_ar: string }>();
  for (const c of companies) {
    companyByTicker.set(c.ticker, { id: c.id, name_en: c.name_en, name_ar: c.name_ar });
  }

  // Latest price per company
  const latestPrice = new Map<string, number>();
  for (const p of allPrices) {
    if (!latestPrice.has(p.company_id)) {
      latestPrice.set(p.company_id, Number(p.close));
    }
  }

  // Group dividends by company_id
  const divsByCompany = new Map<string, DivRecord[]>();
  for (const d of allDividends) {
    if (!divsByCompany.has(d.company_id)) divsByCompany.set(d.company_id, []);
    divsByCompany.get(d.company_id)!.push({
      ex_date: d.ex_date,
      amount_per_share: d.amount_per_share,
      year: d.year,
    });
  }

  // ── Build forecasts ──
  const today = new Date();
  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const holdings: HoldingForecast[] = [];

  for (const h of DEMO_HOLDINGS) {
    const company = companyByTicker.get(h.ticker);
    if (!company) continue;

    const divs = divsByCompany.get(company.id) ?? [];
    const price = latestPrice.get(company.id) ?? h.avgCost;

    // Trailing 12-month dividends
    const trailing12m = divs.filter((d) => new Date(d.ex_date) >= oneYearAgo);
    const annualDPS = trailing12m.reduce((sum, d) => sum + Number(d.amount_per_share), 0);

    // Payment frequency (based on recent 3 years)
    const recent3y = divs.filter((d) => d.year >= today.getFullYear() - 2);
    const yearsWithDivs = new Set(recent3y.map((d) => d.year));
    const payFrequency = yearsWithDivs.size > 0
      ? Math.round(recent3y.length / yearsWithDivs.size)
      : 0;

    // Monthly distribution (for calendar)
    const divHistory: { month: number; amount: number }[] = [];
    for (let m = 0; m < 12; m++) {
      const monthDivs = trailing12m.filter((d) => {
        const date = new Date(d.ex_date);
        return date.getMonth() === m;
      });
      const amt = monthDivs.reduce((s, d) => s + Number(d.amount_per_share), 0);
      divHistory.push({ month: m, amount: amt });
    }

    // Consecutive years of payment (streak)
    const payYears = [...new Set(divs.map((d) => d.year))].sort((a, b) => b - a);
    let streak = 0;
    for (let i = 0; i < payYears.length; i++) {
      if (payYears[i] === today.getFullYear() - i || payYears[i] === today.getFullYear() - i + 1) {
        streak++;
      } else break;
    }

    // Next and last ex-dates
    const futureDivs = divs.filter((d) => new Date(d.ex_date) >= today);
    const pastDivs = divs.filter((d) => new Date(d.ex_date) < today);
    const nextExDate = futureDivs.length > 0
      ? futureDivs[futureDivs.length - 1].ex_date
      : null;
    const lastExDate = pastDivs.length > 0 ? pastDivs[0].ex_date : null;

    holdings.push({
      ticker: h.ticker,
      name_en: company.name_en,
      name_ar: company.name_ar,
      shares: h.shares,
      avgCost: h.avgCost,
      currentPrice: price,
      annualDPS,
      annualIncome: annualDPS * h.shares,
      yieldOnCost: h.avgCost > 0 ? (annualDPS / h.avgCost) * 100 : 0,
      currentYield: price > 0 ? (annualDPS / price) * 100 : 0,
      payFrequency,
      nextExDate,
      lastExDate,
      divHistory,
      streak,
    });
  }

  // ── Totals ──
  const totalAnnualIncome = holdings.reduce((s, h) => s + h.annualIncome, 0);
  const totalPortfolioValue = holdings.reduce((s, h) => s + h.currentPrice * h.shares, 0);
  const totalCostBasis = holdings.reduce((s, h) => s + h.avgCost * h.shares, 0);
  const portfolioYield = totalPortfolioValue > 0 ? (totalAnnualIncome / totalPortfolioValue) * 100 : 0;
  const yieldOnCost = totalCostBasis > 0 ? (totalAnnualIncome / totalCostBasis) * 100 : 0;
  const monthlyAvg = totalAnnualIncome / 12;

  // Monthly income calendar (aggregate all holdings)
  const monthlyIncome: number[] = Array(12).fill(0);
  for (const h of holdings) {
    for (const m of h.divHistory) {
      monthlyIncome[m.month] += m.amount * h.shares;
    }
  }
  const maxMonthly = Math.max(...monthlyIncome, 1);

  const monthNames = isAr
    ? ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"]
    : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Sort holdings by annual income desc
  const sortedHoldings = [...holdings].sort((a, b) => b.annualIncome - a.annualIncome);

  // What-if data for client component
  const whatIfData = holdings.map((h) => ({
    ticker: h.ticker,
    name: isAr ? h.name_ar : h.name_en,
    shares: h.shares,
    annualDPS: h.annualDPS,
    currentPrice: h.currentPrice,
  }));

  return (
    <div className="page-wrap">
      <style>{`
        .forecast-card { transition: all 0.2s ease-out; }
        .forecast-card:hover { border-color: var(--c-gold) !important; box-shadow: 0 0 0 1px var(--c-gold-dim); }
        .bar-col { transition: height 0.5s ease-out, background 0.2s; }
        .bar-col:hover { filter: brightness(1.3); }
        .premium-badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; }
      `}</style>

      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, rgba(14,203,129,0.15), rgba(14,203,129,0.05))",
            border: "1px solid rgba(14,203,129,0.3)",
          }}
        >
          <DollarSign size={18} style={{ color: "var(--c-green)" }} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1
              className="font-bold text-2xl"
              style={{ color: "var(--c-text)", fontFamily: "var(--font-grotesk)" }}
            >
              {isAr ? "توقّعات الأرباح الموزّعة" : "Dividend Forecast"}
            </h1>
            <span
              className="premium-badge"
              style={{
                background: "var(--c-gold-dim)",
                border: "1px solid var(--c-gold-ring)",
                color: "var(--c-gold)",
              }}
            >
              <Sparkles size={10} />
              {isAr ? "حصري" : "Premium"}
            </span>
          </div>
          <p style={{ fontSize: 13, color: "var(--c-muted)", marginTop: 4 }}>
            {isAr
              ? "اعرف كم ستجني من توزيعات الأرباح سنويًا بناءً على محفظتك"
              : "See how much dividend income your portfolio will generate"}
          </p>
        </div>
      </div>

      {/* Demo notice */}
      <div
        style={{
          margin: "16px 0 28px",
          padding: "10px 16px",
          borderRadius: 10,
          background: "rgba(200,169,81,0.06)",
          border: "1px solid var(--c-gold-ring)",
          fontSize: 12,
          color: "var(--c-muted)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Sparkles size={14} style={{ color: "var(--c-gold)", flexShrink: 0 }} />
        {isAr
          ? "هذا عرض تجريبي بمحفظة نموذجية. سجّل دخولك لربط محفظتك الحقيقية."
          : "Demo preview with a sample portfolio. Sign in to connect your real holdings."}
      </div>

      {/* ══════════════════════════════════════════════ */}
      {/* HERO STATS ROW */}
      {/* ══════════════════════════════════════════════ */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 12,
          marginBottom: 32,
        }}
      >
        {/* Annual Income */}
        <div
          className="forecast-card"
          style={{
            background: "var(--c-surface)",
            border: "1px solid var(--c-border)",
            borderRadius: 14,
            padding: "20px 18px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <DollarSign size={14} style={{ color: "var(--c-green)" }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--c-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {isAr ? "الدخل السنوي المتوقع" : "Projected Annual Income"}
            </span>
          </div>
          <div className="font-num" style={{ fontSize: 28, fontWeight: 800, color: "var(--c-green)" }}>
            {totalAnnualIncome.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--c-muted)", marginInlineStart: 4 }}>SAR</span>
          </div>
          <div style={{ fontSize: 11, color: "var(--c-muted)", marginTop: 6 }}>
            ≈ {monthlyAvg.toLocaleString("en-US", { maximumFractionDigits: 0 })} SAR / {isAr ? "شهر" : "month"}
          </div>
        </div>

        {/* Portfolio Yield */}
        <div
          className="forecast-card"
          style={{
            background: "var(--c-surface)",
            border: "1px solid var(--c-border)",
            borderRadius: 14,
            padding: "20px 18px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <PieChart size={14} style={{ color: "var(--c-gold)" }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--c-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {isAr ? "عائد المحفظة" : "Portfolio Yield"}
            </span>
          </div>
          <div className="font-num" style={{ fontSize: 28, fontWeight: 800, color: "var(--c-gold)" }}>
            {portfolioYield.toFixed(2)}%
          </div>
          <div style={{ fontSize: 11, color: "var(--c-muted)", marginTop: 6 }}>
            {isAr ? "عائد على التكلفة" : "Yield on cost"}: <span className="font-num" style={{ color: "var(--c-text)", fontWeight: 600 }}>{yieldOnCost.toFixed(2)}%</span>
          </div>
        </div>

        {/* Next Payment */}
        <div
          className="forecast-card"
          style={{
            background: "var(--c-surface)",
            border: "1px solid var(--c-border)",
            borderRadius: 14,
            padding: "20px 18px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <Calendar size={14} style={{ color: "var(--c-text)" }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--c-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {isAr ? "الدفعة القادمة" : "Next Payment"}
            </span>
          </div>
          {(() => {
            const nextHolding = holdings
              .filter((h) => h.nextExDate)
              .sort((a, b) => a.nextExDate!.localeCompare(b.nextExDate!))[0];
            if (!nextHolding) {
              return <div style={{ fontSize: 14, color: "var(--c-muted)" }}>{isAr ? "لا توجد بيانات" : "No data"}</div>;
            }
            const d = new Date(nextHolding.nextExDate! + "T00:00:00");
            return (
              <>
                <div className="font-num" style={{ fontSize: 20, fontWeight: 800, color: "var(--c-text)" }}>
                  {d.toLocaleDateString(isAr ? "ar-SA" : "en-US", { month: "short", day: "numeric" })}
                </div>
                <div style={{ fontSize: 12, color: "var(--c-muted)", marginTop: 4 }}>
                  {isAr ? nextHolding.name_ar : nextHolding.name_en} — <span className="font-num" style={{ color: "var(--c-green)" }}>
                    {(nextHolding.annualDPS / Math.max(nextHolding.payFrequency, 1) * nextHolding.shares).toFixed(0)} SAR
                  </span>
                </div>
              </>
            );
          })()}
        </div>

        {/* Paying Stocks */}
        <div
          className="forecast-card"
          style={{
            background: "var(--c-surface)",
            border: "1px solid var(--c-border)",
            borderRadius: 14,
            padding: "20px 18px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <Coins size={14} style={{ color: "var(--c-gold)" }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--c-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {isAr ? "أسهم موزّعة" : "Dividend Payers"}
            </span>
          </div>
          <div className="font-num" style={{ fontSize: 28, fontWeight: 800, color: "var(--c-text)" }}>
            {holdings.filter((h) => h.annualDPS > 0).length}<span style={{ fontSize: 16, color: "var(--c-muted)" }}>/{holdings.length}</span>
          </div>
          <div style={{ fontSize: 11, color: "var(--c-muted)", marginTop: 6 }}>
            {isAr ? "من أسهم محفظتك تدفع أرباحًا" : "of your holdings pay dividends"}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════ */}
      {/* MONTHLY INCOME CALENDAR */}
      {/* ══════════════════════════════════════════════ */}
      <div
        style={{
          background: "var(--c-surface)",
          border: "1px solid var(--c-border)",
          borderRadius: 14,
          padding: "24px 20px",
          marginBottom: 32,
        }}
      >
        <div className="flex items-center gap-2 mb-5">
          <BarChart3 size={16} style={{ color: "var(--c-gold)" }} />
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--c-text)" }}>
            {isAr ? "تقويم الدخل الشهري" : "Monthly Income Calendar"}
          </h2>
        </div>

        {/* Bar chart */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 6,
            height: 160,
            padding: "0 4px",
          }}
        >
          {monthlyIncome.map((income, i) => {
            const height = maxMonthly > 0 ? (income / maxMonthly) * 130 : 0;
            const isCurrent = i === today.getMonth();
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                {income > 0 && (
                  <span className="font-num" style={{ fontSize: 9, color: "var(--c-muted)", fontWeight: 600 }}>
                    {income.toFixed(0)}
                  </span>
                )}
                <div
                  className="bar-col"
                  style={{
                    width: "100%",
                    maxWidth: 48,
                    height: Math.max(height, 3),
                    borderRadius: "6px 6px 2px 2px",
                    background: isCurrent
                      ? "linear-gradient(to top, var(--c-gold), rgba(200,169,81,0.6))"
                      : income > 0
                        ? "linear-gradient(to top, rgba(14,203,129,0.7), rgba(14,203,129,0.3))"
                        : "rgba(123,148,184,0.1)",
                    border: isCurrent ? "1px solid var(--c-gold)" : "1px solid transparent",
                  }}
                />
                <span style={{
                  fontSize: 10,
                  fontWeight: isCurrent ? 700 : 500,
                  color: isCurrent ? "var(--c-gold)" : "var(--c-muted)",
                }}>
                  {monthNames[i]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════════ */}
      {/* PER-STOCK BREAKDOWN */}
      {/* ══════════════════════════════════════════════ */}
      <div style={{ marginBottom: 32 }}>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} style={{ color: "var(--c-green)" }} />
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--c-text)" }}>
            {isAr ? "تفاصيل كل سهم" : "Per-Stock Breakdown"}
          </h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sortedHoldings.map((h) => {
            const name = isAr ? h.name_ar : h.name_en;
            const incomeShare = totalAnnualIncome > 0 ? (h.annualIncome / totalAnnualIncome) * 100 : 0;

            return (
              <div
                key={h.ticker}
                className="forecast-card"
                style={{
                  background: "var(--c-surface)",
                  border: "1px solid var(--c-border)",
                  borderRadius: 12,
                  padding: "16px 18px",
                }}
              >
                <div className="flex items-center justify-between mb-3" style={{ flexWrap: "wrap", gap: 8 }}>
                  <div className="flex items-center gap-3">
                    {/* Ticker badge */}
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: h.annualDPS > 0 ? "rgba(14,203,129,0.08)" : "rgba(123,148,184,0.08)",
                        border: `1px solid ${h.annualDPS > 0 ? "rgba(14,203,129,0.25)" : "rgba(123,148,184,0.15)"}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <span className="font-num" style={{ fontSize: 11, fontWeight: 800, color: h.annualDPS > 0 ? "var(--c-green)" : "var(--c-muted)" }}>
                        {h.ticker}
                      </span>
                    </div>
                    <div>
                      <Link href={`/${locale}/stock/${h.ticker}`} style={{ textDecoration: "none" }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--c-text)" }}>{name}</div>
                      </Link>
                      <div style={{ fontSize: 11, color: "var(--c-muted)" }}>
                        {h.shares} {isAr ? "سهم" : "shares"} × {h.annualDPS.toFixed(2)} SAR
                      </div>
                    </div>
                  </div>

                  {/* Annual income */}
                  <div style={{ textAlign: isAr ? "left" : "right" }}>
                    <div className="font-num" style={{ fontSize: 18, fontWeight: 800, color: h.annualDPS > 0 ? "var(--c-green)" : "var(--c-muted)" }}>
                      {h.annualIncome.toLocaleString("en-US", { maximumFractionDigits: 0 })} <span style={{ fontSize: 11, fontWeight: 600, color: "var(--c-muted)" }}>SAR</span>
                    </div>
                    <div className="font-num" style={{ fontSize: 11, color: "var(--c-muted)" }}>
                      {incomeShare.toFixed(1)}% {isAr ? "من الإجمالي" : "of total"}
                    </div>
                  </div>
                </div>

                {/* Metrics row */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
                    gap: 8,
                  }}
                >
                  <MetricCell label={isAr ? "عائد التكلفة" : "Yield on Cost"} value={`${h.yieldOnCost.toFixed(2)}%`} color={h.yieldOnCost >= 3 ? "var(--c-green)" : "var(--c-text)"} />
                  <MetricCell label={isAr ? "العائد الحالي" : "Current Yield"} value={`${h.currentYield.toFixed(2)}%`} color={h.currentYield >= 3 ? "var(--c-green)" : "var(--c-text)"} />
                  <MetricCell label={isAr ? "تكرار الدفع" : "Frequency"} value={h.payFrequency > 0 ? `${h.payFrequency}x/${isAr ? "سنة" : "yr"}` : "--"} color="var(--c-text)" />
                  <MetricCell label={isAr ? "سنوات متتالية" : "Streak"} value={h.streak > 0 ? `${h.streak} ${isAr ? "سنة" : "yr"}` : "--"} color={h.streak >= 5 ? "var(--c-green)" : "var(--c-text)"} />

                  {/* Income share bar */}
                  <div style={{ gridColumn: "1 / -1", marginTop: 4 }}>
                    <div style={{ height: 4, borderRadius: 2, background: "rgba(123,148,184,0.1)", overflow: "hidden" }}>
                      <div style={{
                        height: "100%",
                        width: `${incomeShare}%`,
                        borderRadius: 2,
                        background: h.annualDPS > 0 ? "var(--c-green)" : "transparent",
                        transition: "width 0.5s ease-out",
                      }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════════ */}
      {/* WHAT-IF CALCULATOR */}
      {/* ══════════════════════════════════════════════ */}
      <DividendWhatIf
        holdings={whatIfData}
        locale={locale}
        currentAnnualIncome={totalAnnualIncome}
      />

      {/* ── CTA to Dividends Calendar ── */}
      <div style={{ marginTop: 32, textAlign: "center" }}>
        <Link
          href={`/${locale}/dividends`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 24px",
            borderRadius: 12,
            background: "var(--c-gold-dim)",
            border: "1px solid var(--c-gold-ring)",
            color: "var(--c-gold)",
            fontSize: 13,
            fontWeight: 700,
            textDecoration: "none",
            transition: "all 0.2s",
          }}
        >
          <Calendar size={14} />
          {isAr ? "عرض تقويم التوزيعات الكامل" : "View Full Dividend Calendar"}
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* ── Disclaimer ── */}
      <div style={{ marginTop: 24, padding: 16, borderRadius: 10, background: "rgba(123,148,184,0.04)" }}>
        <p style={{ fontSize: 11, color: "var(--c-dim)", textAlign: "center", lineHeight: 1.6 }}>
          {isAr
            ? "التوقعات مبنية على بيانات التوزيعات التاريخية ولا تضمن أرباحًا مستقبلية. هذا ليس نصيحة استثمارية."
            : "Forecasts are based on historical dividend data and do not guarantee future payouts. This is not investment advice."}
        </p>
      </div>
    </div>
  );
}

// ── Helper Components ──

function MetricCell({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ textAlign: "center", padding: "8px 4px", borderRadius: 8, background: "var(--c-elevated)" }}>
      <div style={{ fontSize: 9, color: "var(--c-dim)", fontWeight: 600, textTransform: "uppercase", marginBottom: 3, letterSpacing: "0.04em" }}>
        {label}
      </div>
      <div className="font-num" style={{ fontSize: 13, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}
