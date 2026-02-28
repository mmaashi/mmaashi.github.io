import { createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";
import { tSector } from "@/lib/i18n";

interface SectorData {
  sector: string;
  avgChange: number;
  count: number;
  gainers: number;
  losers: number;
}

interface Props {
  locale: string;
}

async function getSectorPerformance(): Promise<SectorData[]> {
  const supabase = createServiceClient();

  // Get the two most recent distinct trading dates
  const { data: dates } = await supabase
    .from("stock_prices")
    .select("date")
    .order("date", { ascending: false })
    .limit(2);

  if (!dates || dates.length < 2) return [];

  const latestDate = dates[0].date as string;
  const prevDate   = dates[1].date as string;

  // Fetch latest prices for all companies
  const [{ data: latestPrices }, { data: prevPrices }] = await Promise.all([
    supabase
      .from("stock_prices")
      .select("company_id, close")
      .eq("date", latestDate),
    supabase
      .from("stock_prices")
      .select("company_id, close")
      .eq("date", prevDate),
  ]);

  if (!latestPrices || !prevPrices) return [];

  // Get sectors for all companies
  const { data: companies } = await supabase
    .from("companies")
    .select("id, sector");

  if (!companies) return [];

  // Build maps
  const latestMap = new Map<string, number>();
  const prevMap   = new Map<string, number>();
  for (const p of latestPrices) latestMap.set(p.company_id, Number(p.close));
  for (const p of prevPrices)   prevMap.set(p.company_id, Number(p.close));
  const sectorMap = new Map<string, string>();
  for (const c of companies) if (c.sector) sectorMap.set(c.id, c.sector);

  // Aggregate by sector
  const sectorAgg = new Map<string, { totalChange: number; count: number; gainers: number; losers: number }>();

  for (const [companyId, latestClose] of latestMap) {
    const prevClose = prevMap.get(companyId);
    const sector    = sectorMap.get(companyId);
    if (!prevClose || !sector || prevClose === 0) continue;

    const pctChange = ((latestClose - prevClose) / prevClose) * 100;
    if (!sectorAgg.has(sector)) {
      sectorAgg.set(sector, { totalChange: 0, count: 0, gainers: 0, losers: 0 });
    }
    const agg = sectorAgg.get(sector)!;
    agg.totalChange += pctChange;
    agg.count       += 1;
    if (pctChange > 0) agg.gainers++;
    else if (pctChange < 0) agg.losers++;
  }

  // Convert to array sorted by avgChange
  return Array.from(sectorAgg.entries())
    .map(([sector, agg]) => ({
      sector,
      avgChange: agg.count > 0 ? agg.totalChange / agg.count : 0,
      count:     agg.count,
      gainers:   agg.gainers,
      losers:    agg.losers,
    }))
    .sort((a, b) => b.avgChange - a.avgChange);
}

function getHeatColor(change: number): { bg: string; border: string; text: string } {
  if (change >= 2)   return { bg: "rgba(14,203,129,0.22)", border: "rgba(14,203,129,0.45)", text: "var(--c-green)" };
  if (change >= 0.5) return { bg: "rgba(14,203,129,0.10)", border: "rgba(14,203,129,0.25)", text: "var(--c-green)" };
  if (change >= -0.5) return { bg: "rgba(200,200,200,0.05)", border: "var(--c-border)", text: "var(--c-muted)" };
  if (change >= -2)  return { bg: "rgba(246,70,93,0.10)", border: "rgba(246,70,93,0.25)", text: "var(--c-red)" };
  return             { bg: "rgba(246,70,93,0.22)", border: "rgba(246,70,93,0.45)", text: "var(--c-red)" };
}

export default async function SectorHeatMap({ locale }: Props) {
  const sectors = await getSectorPerformance();
  if (sectors.length === 0) return null;

  const isAr = locale === "ar";

  return (
    <div className="card mb-5" style={{ padding: "16px 18px" }}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-bold" style={{ fontSize: 14, color: "var(--c-text)", fontFamily: "var(--font-grotesk)" }}>
            {isAr ? "أداء القطاعات" : "Sector Performance"}
          </h2>
          <p style={{ fontSize: 10, color: "var(--c-muted)", marginTop: 1 }}>
            {isAr ? "تغيّر اليوم" : "Today's change"}
          </p>
        </div>
        <Link href={`/${locale}/screener`}
              style={{ fontSize: 11, color: "var(--c-gold)", textDecoration: "none", fontWeight: 600 }}>
          {isAr ? "المصفاة ←" : "Screener →"}
        </Link>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {sectors.map(({ sector, avgChange, count, gainers, losers }) => {
          const colors = getHeatColor(avgChange);
          const sign   = avgChange >= 0 ? "+" : "";
          const label  = tSector(locale, sector);

          return (
            <Link
              key={sector}
              href={`/${locale}/screener?sector=${encodeURIComponent(sector)}`}
              style={{
                textDecoration: "none",
                display: "block",
                padding: "8px 10px",
                borderRadius: "var(--radius-sm, 8px)",
                background: colors.bg,
                border: `1px solid ${colors.border}`,
                transition: "opacity 0.15s",
              }}
            >
              <p style={{ fontSize: 10, fontWeight: 600, color: "var(--c-text)", marginBottom: 3, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {label}
              </p>
              <span className="font-num font-bold" style={{ fontSize: 14, color: colors.text }}>
                {sign}{avgChange.toFixed(1)}%
              </span>
              <p className="font-num" style={{ fontSize: 9, color: "var(--c-dim)", marginTop: 2 }}>
                <span style={{ color: "var(--c-green)" }}>▲{gainers}</span>
                {" "}
                <span style={{ color: "var(--c-red)" }}>▼{losers}</span>
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
