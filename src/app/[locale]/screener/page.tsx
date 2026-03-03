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

  const { data: companies } = await supabase
    .from("companies")
    .select("id, ticker, name_en, name_ar, sector, market, is_shariah_compliant")
    .order("name_en");

  const { data: allPrices } = await supabase
    .from("stock_prices")
    .select("company_id, close, volume, date")
    .order("date", { ascending: false })
    .limit(1200);

  const priceMap = new Map<string, { close: number; prevClose: number | null; volume: number }>();
  const seenDates = new Map<string, number>();

  for (const p of allPrices || []) {
    const count = seenDates.get(p.company_id) || 0;
    if (count === 0) {
      priceMap.set(p.company_id, { close: Number(p.close), prevClose: null, volume: Number(p.volume) });
    } else if (count === 1) {
      const existing = priceMap.get(p.company_id)!;
      existing.prevClose = Number(p.close);
    }
    seenDates.set(p.company_id, count + 1);
  }

  const enriched = (companies || []).map((c) => {
    const price = priceMap.get(c.id);
    const latestClose = price?.close ?? null;
    const prevClose = price?.prevClose ?? null;
    const change_pct =
      latestClose !== null && prevClose !== null && prevClose > 0
        ? ((latestClose - prevClose) / prevClose) * 100
        : null;

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
    };
  });

  const sectors = [...new Set((companies || []).map((c) => c.sector).filter(Boolean))].sort();

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
