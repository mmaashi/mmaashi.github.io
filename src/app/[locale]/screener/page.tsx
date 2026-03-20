import { createServiceClient } from "@/lib/supabase/server";
import ScreenerTable from "@/components/ScreenerTable";
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

  return (
    <div className="page-wrap">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "var(--c-gold-dim)", border: "1px solid var(--c-gold-ring)" }}
        >
          <SlidersHorizontal size={16} style={{ color: "var(--c-gold)" }} />
        </div>
        <div>
          <h1 className="font-bold text-xl" style={{ color: "var(--c-text)", fontFamily: "var(--font-grotesk)" }}>
            {t(locale, "screener.title")}
          </h1>
          <p style={{ fontSize: 12, color: "var(--c-muted)" }}>
            {t(locale, "screener.subtitle")}
          </p>
        </div>
      </div>

      <ScreenerTable companies={enriched} sectors={sectors as string[]} locale={locale} />

      <hr className="gold-line my-10" />
      <p style={{ fontSize: 11, color: "var(--c-dim)", textAlign: "center", letterSpacing: "0.02em" }}>
        {t(locale, "common.disclaimer")}
      </p>
    </div>
  );
}
