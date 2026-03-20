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

  const { data: latestRows } = await supabase
    .from("stock_prices")
    .select("date")
    .order("date", { ascending: false })
    .limit(1);

  if (!latestRows || latestRows.length === 0) return [];
  const latestDate = latestRows[0].date as string;

  const { data: prevRows } = await supabase
    .from("stock_prices")
    .select("date")
    .lt("date", latestDate)
    .order("date", { ascending: false })
    .limit(1);

  if (!prevRows || prevRows.length === 0) return [];
  const prevDate = prevRows[0].date as string;

  const [{ data: latestPrices }, { data: prevPrices }] = await Promise.all([
    supabase.from("stock_prices").select("company_id, close").eq("date", latestDate),
    supabase.from("stock_prices").select("company_id, close").eq("date", prevDate),
  ]);

  if (!latestPrices || !prevPrices) return [];

  const { data: companies } = await supabase.from("companies").select("id, sector");
  if (!companies) return [];

  const latestMap = new Map<string, number>();
  const prevMap   = new Map<string, number>();
  for (const p of latestPrices) latestMap.set(p.company_id, Number(p.close));
  for (const p of prevPrices)   prevMap.set(p.company_id, Number(p.close));
  const sectorMap = new Map<string, string>();
  for (const c of companies) if (c.sector) sectorMap.set(c.id, c.sector);

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

/** Compact horizontal-scroll sector strip — replaces the old full-grid layout */
export default async function SectorHeatMap({ locale }: Props) {
  const sectors = await getSectorPerformance();
  if (sectors.length === 0) return null;

  const isAr = locale === "ar";

  return (
    <div className="card mb-4" style={{ padding: "12px 14px" }}>
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-bold" style={{ fontSize: 13, color: "var(--c-text)", fontFamily: "var(--font-grotesk)" }}>
          {isAr ? "أداء القطاعات" : "Sector Performance"}
        </h2>
        <Link
          href={`/${locale}/screener`}
          style={{ fontSize: 10, color: "var(--c-gold)", textDecoration: "none", fontWeight: 600 }}
        >
          {isAr ? "المصفاة ←" : "Screener →"}
        </Link>
      </div>

      {/* Horizontal scrolling strip */}
      <div
        style={{
          display: "flex",
          gap: 6,
          overflowX: "auto",
          paddingBottom: 4,
          scrollbarWidth: "none",       /* Firefox */
          msOverflowStyle: "none",      /* IE/Edge */
        }}
      >
        {sectors.map(({ sector, avgChange, gainers, losers }) => {
          const colors = getHeatColor(avgChange);
          const sign   = avgChange >= 0 ? "+" : "";
          const label  = tSector(locale, sector);

          return (
            <Link
              key={sector}
              href={`/${locale}/screener?sector=${encodeURIComponent(sector)}`}
              style={{
                textDecoration: "none",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 10px",
                borderRadius: 8,
                background: colors.bg,
                border: `1px solid ${colors.border}`,
                transition: "opacity 0.15s",
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: "var(--c-text)",
                  whiteSpace: "nowrap",
                  maxWidth: 100,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {label}
              </span>
              <span
                className="font-num"
                style={{ fontSize: 12, fontWeight: 700, color: colors.text, whiteSpace: "nowrap" }}
              >
                {sign}{avgChange.toFixed(1)}%
              </span>
              <span className="font-num" style={{ fontSize: 8, color: "var(--c-dim)", whiteSpace: "nowrap" }}>
                <span style={{ color: "var(--c-green)" }}>▲{gainers}</span>
                {" "}
                <span style={{ color: "var(--c-red)" }}>▼{losers}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
