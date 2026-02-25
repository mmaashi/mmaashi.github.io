import { createServiceClient } from "@/lib/supabase/server";
import ScreenerTable from "@/components/ScreenerTable";

export default async function ScreenerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = createServiceClient();

  // Fetch all companies
  const { data: companies } = await supabase
    .from("companies")
    .select("id, ticker, name_en, name_ar, sector, market, is_shariah_compliant")
    .order("name_en");

  // Fetch latest 2 prices per company to compute change %
  const { data: allPrices } = await supabase
    .from("stock_prices")
    .select("company_id, close, volume, date")
    .order("date", { ascending: false })
    .limit(200);

  // Build price map: latest + previous close per company
  const priceMap = new Map<string, { close: number; prevClose: number | null; volume: number }>();
  const seenDates = new Map<string, number>(); // company_id -> count of entries seen

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

  // Build enriched company list for ScreenerTable
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

  // Get distinct sectors for the filter dropdown
  const sectors = [...new Set((companies || []).map((c) => c.sector).filter(Boolean))].sort();

  const title = locale === "ar" ? "مصفاة الأسهم" : "Stock Screener";
  const subtitle =
    locale === "ar"
      ? "تصفية وفرز جميع الأسهم المدرجة في تداول"
      : "Filter and sort all Tadawul-listed companies";

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="text-gray-400 text-sm mt-1">{subtitle}</p>
      </div>

      {/* ScreenerTable — client component with filtering/sorting */}
      <ScreenerTable companies={enriched} sectors={sectors as string[]} locale={locale} />

      {/* Disclaimer */}
      <div className="mt-8 p-4 bg-gray-800/50 rounded-lg">
        <p className="text-xs text-gray-500 text-center">
          SŪQAI provides translated market data for informational purposes only. This is not
          investment advice.
        </p>
      </div>
    </div>
  );
}
