import { createServiceClient } from "@/lib/supabase/server";
import ScreenerPageClient from "@/components/ScreenerPage";
import { SlidersHorizontal } from "lucide-react";
import { t } from "@/lib/i18n";

export default async function ScreenerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = createServiceClient();

  const [companiesResult, pricesResult, metricsResult] = await Promise.allSettled([
    supabase
      .from("companies")
      .select("id, ticker, name_en, name_ar, sector, market, is_shariah_compliant")
      .order("name_en"),
    supabase
      .from("stock_prices")
      .select("company_id, close, volume, date")
      .order("date", { ascending: false })
      .limit(1200),
    // Fetch latest metrics for all companies
    supabase
      .from("company_metrics_daily")
      .select("company_id, suqai_score, score_tier, pe_ratio, pb_ratio, dividend_yield, roe, revenue_growth_yoy, debt_to_equity, current_ratio, return_1y, volatility_30d, market_cap, net_margin")
      .order("as_of_date", { ascending: false })
      .limit(500),
  ]);

  const companies = companiesResult.status === "fulfilled" ? companiesResult.value.data ?? [] : [];
  const allPrices = pricesResult.status === "fulfilled" ? pricesResult.value.data ?? [] : [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allMetrics: any[] = metricsResult.status === "fulfilled" ? (metricsResult.value as any).data ?? [] : [];

  // Build price map (latest + prev close for change%)
  const priceMap = new Map<string, { close: number; prevClose: number | null; volume: number }>();
  const seenDates = new Map<string, number>();

  for (const p of allPrices) {
    const count = seenDates.get(p.company_id) || 0;
    if (count === 0) {
      priceMap.set(p.company_id, { close: Number(p.close), prevClose: null, volume: Number(p.volume) });
    } else if (count === 1) {
      const existing = priceMap.get(p.company_id)!;
      existing.prevClose = Number(p.close);
    }
    seenDates.set(p.company_id, count + 1);
  }

  // Build metrics map (latest per company — deduplicate by taking first occurrence)
  const metricsMap = new Map<string, typeof allMetrics[0]>();
  for (const m of allMetrics) {
    if (!metricsMap.has(m.company_id)) {
      metricsMap.set(m.company_id, m);
    }
  }

  const enriched = companies.map((c) => {
    const price = priceMap.get(c.id);
    const latestClose = price?.close ?? null;
    const prevClose = price?.prevClose ?? null;
    const change_pct =
      latestClose !== null && prevClose !== null && prevClose > 0
        ? ((latestClose - prevClose) / prevClose) * 100
        : null;

    const m = metricsMap.get(c.id);

    return {
      id: c.id,
      ticker: c.ticker,
      name_en: c.name_en,
      name_ar: c.name_ar || c.name_en,
      sector: c.sector || "Other",
      market: c.market || "Main",
      is_shariah_compliant: c.is_shariah_compliant || false,
      price: latestClose,
      open: null,
      volume: price?.volume ?? null,
      change_pct,
      // SŪQAI metrics
      suqai_score: m?.suqai_score != null ? Number(m.suqai_score) : null,
      score_tier: m?.score_tier ?? null,
      pe_ratio: m?.pe_ratio != null ? Number(m.pe_ratio) : null,
      pb_ratio: m?.pb_ratio != null ? Number(m.pb_ratio) : null,
      dividend_yield: m?.dividend_yield != null ? Number(m.dividend_yield) : null,
      roe: m?.roe != null ? Number(m.roe) : null,
      revenue_growth_yoy: m?.revenue_growth_yoy != null ? Number(m.revenue_growth_yoy) : null,
      debt_to_equity: m?.debt_to_equity != null ? Number(m.debt_to_equity) : null,
      market_cap: m?.market_cap != null ? Number(m.market_cap) : null,
      net_margin: m?.net_margin != null ? Number(m.net_margin) : null,
    };
  });

  const sectors = [...new Set(companies.map((c) => c.sector).filter(Boolean))].sort();

  const totalCompanies = enriched.length;
  const withScore = enriched.filter((c) => c.suqai_score !== null).length;
  const avgScore = withScore > 0 ? enriched.filter((c) => c.suqai_score !== null).reduce((s, c) => s + (c.suqai_score ?? 0), 0) / withScore : 0;
  const isAr = locale === "ar";

  return (
    <div className="page-wrap">
      {/* Premium Header */}
      <div style={{ padding: "24px 26px 20px", borderRadius: 14, background: "linear-gradient(160deg, rgba(200,169,81,0.06) 0%, rgba(6,13,24,0.95) 50%)", border: "1px solid var(--c-gold-ring)", marginBottom: 18, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -30, right: -30, width: 140, height: 140, borderRadius: "50%", background: "radial-gradient(circle, rgba(200,169,81,0.08), transparent 70%)", pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10, position: "relative", zIndex: 1 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--c-gold-dim)", border: "1px solid var(--c-gold-ring)" }}>
            <SlidersHorizontal size={16} style={{ color: "var(--c-gold)" }} />
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: "var(--c-text)", fontFamily: "var(--font-grotesk)", margin: 0 }}>
              {t(locale, "screener.title")}
            </h1>
            <p style={{ fontSize: 11, color: "var(--c-muted)", margin: 0 }}>
              {t(locale, "screener.subtitle")}
            </p>
          </div>
        </div>
        {/* Quick stats */}
        <div style={{ display: "flex", gap: 16, position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: "var(--c-text)", fontFamily: "var(--font-grotesk)" }}>{totalCompanies}</span>
            <span style={{ fontSize: 10, color: "var(--c-dim)" }}>{isAr ? "شركة" : "stocks"}</span>
          </div>
          <div style={{ width: 1, height: 20, background: "var(--c-border)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: "var(--c-gold)", fontFamily: "var(--font-grotesk)" }}>{sectors.length}</span>
            <span style={{ fontSize: 10, color: "var(--c-dim)" }}>{isAr ? "قطاع" : "sectors"}</span>
          </div>
          <div style={{ width: 1, height: 20, background: "var(--c-border)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: avgScore >= 60 ? "var(--c-green)" : avgScore >= 40 ? "var(--c-gold)" : "var(--c-muted)", fontFamily: "var(--font-grotesk)" }}>{Math.round(avgScore)}</span>
            <span style={{ fontSize: 10, color: "var(--c-dim)" }}>{isAr ? "متوسط التقييم" : "avg score"}</span>
          </div>
        </div>
      </div>

      <ScreenerPageClient companies={enriched} sectors={sectors as string[]} locale={locale} />

      <hr className="gold-line my-10" />
      <p style={{ fontSize: 11, color: "var(--c-dim)", textAlign: "center", letterSpacing: "0.02em" }}>
        {t(locale, "common.disclaimer")}
      </p>
    </div>
  );
}
