import { TrendingUp, TrendingDown, Zap } from "lucide-react";
import { getTopGainers, getTopLosers } from "@/lib/sahm";
import { createServiceClient } from "@/lib/supabase/server";
import { t } from "@/lib/i18n";
import Link from "next/link";
import MoversClient from "@/components/MoversClient";

export default async function MoversPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isAr = locale === "ar";

  const [gainers, losers, mostActiveResult] = await Promise.allSettled([
    getTopGainers(),
    getTopLosers(),
    (async () => {
      const supabase = createServiceClient();
      const { data: mostActive } = await supabase
        .from("stock_prices")
        .select("company_id, close, volume")
        .order("volume", { ascending: false })
        .limit(10);
      
      if (!mostActive || mostActive.length === 0) return [];
      
      const companyIds = [...new Set(mostActive.map((p) => p.company_id))];
      const { data: companies } = await supabase
        .from("companies")
        .select("id, ticker, name_en, name_ar")
        .in("id", companyIds);
      
      const companyMap = new Map(companies?.map((c) => [c.id, c]) || []);
      const priceMap = new Map(mostActive.map((p) => [p.company_id, p]));
      
      return Array.from(companyMap.entries())
        .map(([companyId, company]) => {
          const price = priceMap.get(companyId);
          return {
            symbol: company.ticker,
            name: company.name_en,
            name_en: company.name_en,
            name_ar: company.name_ar || company.name_en,
            price: price?.close || 0,
            volume: price?.volume || 0,
            change: 0,
            change_percent: 0,
          };
        })
        .sort((a, b) => b.volume - a.volume);
    })(),
  ]);

  const gainersList = gainers.status === "fulfilled" ? gainers.value : [];
  const losersList = losers.status === "fulfilled" ? losers.value : [];
  const mostActiveList = mostActiveResult.status === "fulfilled" ? await mostActiveResult.value : [];

  return (
    <div className="page-wrap">
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "var(--c-gold-dim)", border: "1px solid var(--c-gold-ring)" }}
        >
          <Zap size={16} style={{ color: "var(--c-gold)" }} />
        </div>
        <div>
          <h1 className="font-bold text-xl" style={{ color: "var(--c-text)", fontFamily: "var(--font-grotesk)" }}>
            {t(locale, "movers.title")}
          </h1>
          <p style={{ fontSize: 12, color: "var(--c-muted)" }}>
            {t(locale, "movers.subtitle")}
          </p>
        </div>
      </div>

      <MoversClient
        locale={locale}
        gainers={gainersList}
        losers={losersList}
        mostActive={mostActiveList}
      />

      <hr className="gold-line my-10" />
      <p style={{ fontSize: 11, color: "var(--c-dim)", textAlign: "center", letterSpacing: "0.02em" }}>
        {t(locale, "common.disclaimer")}
      </p>
    </div>
  );
}
