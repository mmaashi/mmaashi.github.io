import { createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";
import { PieChart, TrendingUp, TrendingDown, Star, DollarSign, BarChart3, Shield } from "lucide-react";
import { t, tSector } from "@/lib/i18n";

export default async function SectorsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isAr = locale === "ar";
  const supabase = createServiceClient();

  // Fetch all companies with their metrics
  const [companiesResult, metricsResult, sectorAvgResult] = await Promise.allSettled([
    supabase
      .from("companies")
      .select("id, ticker, name_en, name_ar, sector, is_shariah_compliant")
      .order("name_en"),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("company_metrics_daily")
      .select("company_id, suqai_score, score_tier, pe_ratio, pb_ratio, dividend_yield, roe, net_margin, revenue_growth_yoy, debt_to_equity, return_1y, market_cap")
      .order("metric_date", { ascending: false })
      .limit(500),
    supabase
      .from("sector_averages")
      .select("*")
      .limit(50),
  ]);

  const companies = companiesResult.status === "fulfilled" ? companiesResult.value.data ?? [] : [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const metricsRaw: any[] = metricsResult.status === "fulfilled" ? (metricsResult.value as any).data ?? [] : [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sectorAvgs: any[] = sectorAvgResult.status === "fulfilled" ? (sectorAvgResult.value as any).data ?? [] : [];

  // Deduplicate metrics by company_id
  const metricsMap = new Map<string, typeof metricsRaw[0]>();
  for (const m of metricsRaw) {
    if (!metricsMap.has(m.company_id)) metricsMap.set(m.company_id, m);
  }

  // Group companies by sector
  const sectorGroups = new Map<string, typeof companies>();
  for (const c of companies) {
    const s = c.sector || "Other";
    if (!sectorGroups.has(s)) sectorGroups.set(s, []);
    sectorGroups.get(s)!.push(c);
  }

  // Build sector summaries
  interface SectorSummary {
    sector: string;
    count: number;
    avgScore: number | null;
    avgPE: number | null;
    avgDivYield: number | null;
    avgROE: number | null;
    topScored: { ticker: string; nameEn: string; nameAr: string; score: number; tier: string }[];
    cheapest: { ticker: string; nameEn: string; nameAr: string; pe: number }[];
    highestDividend: { ticker: string; nameEn: string; nameAr: string; yield: number }[];
    totalMarketCap: number;
  }

  const summaries: SectorSummary[] = [];

  for (const [sector, sectorCompanies] of sectorGroups) {
    const enriched = sectorCompanies.map(c => ({
      ...c,
      metrics: metricsMap.get(c.id) ?? null,
    }));

    const withScore = enriched.filter(c => c.metrics?.suqai_score != null);
    const withPE = enriched.filter(c => c.metrics?.pe_ratio != null && Number(c.metrics.pe_ratio) > 0);
    const withDiv = enriched.filter(c => c.metrics?.dividend_yield != null && Number(c.metrics.dividend_yield) > 0);
    const withROE = enriched.filter(c => c.metrics?.roe != null);

    const avgScore = withScore.length > 0 ? withScore.reduce((s, c) => s + Number(c.metrics!.suqai_score), 0) / withScore.length : null;
    const avgPE = withPE.length > 0 ? withPE.reduce((s, c) => s + Number(c.metrics!.pe_ratio), 0) / withPE.length : null;
    const avgDivYield = withDiv.length > 0 ? withDiv.reduce((s, c) => s + Number(c.metrics!.dividend_yield), 0) / withDiv.length : null;
    const avgROE = withROE.length > 0 ? withROE.reduce((s, c) => s + Number(c.metrics!.roe), 0) / withROE.length : null;

    const topScored = withScore
      .sort((a, b) => Number(b.metrics!.suqai_score) - Number(a.metrics!.suqai_score))
      .slice(0, 3)
      .map(c => ({ ticker: c.ticker, nameEn: c.name_en, nameAr: c.name_ar || c.name_en, score: Number(c.metrics!.suqai_score), tier: c.metrics!.score_tier || "" }));

    const cheapest = withPE
      .sort((a, b) => Number(a.metrics!.pe_ratio) - Number(b.metrics!.pe_ratio))
      .slice(0, 3)
      .map(c => ({ ticker: c.ticker, nameEn: c.name_en, nameAr: c.name_ar || c.name_en, pe: Number(c.metrics!.pe_ratio) }));

    const highestDividend = withDiv
      .sort((a, b) => Number(b.metrics!.dividend_yield) - Number(a.metrics!.dividend_yield))
      .slice(0, 3)
      .map(c => ({ ticker: c.ticker, nameEn: c.name_en, nameAr: c.name_ar || c.name_en, yield: Number(c.metrics!.dividend_yield) }));

    const totalMarketCap = enriched.reduce((s, c) => s + (c.metrics?.market_cap ? Number(c.metrics.market_cap) : 0), 0);

    summaries.push({ sector, count: sectorCompanies.length, avgScore, avgPE, avgDivYield, avgROE, topScored, cheapest, highestDividend, totalMarketCap });
  }

  // Sort by total market cap descending
  summaries.sort((a, b) => b.totalMarketCap - a.totalMarketCap);

  function tierColor(tier: string): string {
    switch (tier) {
      case "Strong Buy": return "#22c55e";
      case "Buy": return "#4ade80";
      case "Hold": return "#d4a574";
      case "Underperform": return "#f97316";
      case "Sell": return "#ef4444";
      default: return "#6b7280";
    }
  }

  return (
    <div className="page-wrap">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
             style={{ background: "var(--c-gold-dim)", border: "1px solid var(--c-gold-ring)" }}>
          <PieChart size={16} style={{ color: "var(--c-gold)" }} />
        </div>
        <div>
          <h1 className="font-bold text-xl" style={{ color: "var(--c-text)", fontFamily: "var(--font-grotesk)" }}>
            {isAr ? "مستكشف القطاعات" : "Sector Explorer"}
          </h1>
          <p style={{ fontSize: 12, color: "var(--c-muted)" }}>
            {isAr ? "قارن القطاعات وابحث عن أفضل الفرص" : "Compare sectors and find the best opportunities"}
          </p>
        </div>
      </div>

      {/* Sector Grid */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {summaries.map((s) => (
          <div key={s.sector} className="card" style={{ padding: "22px 24px" }}>
            {/* Sector Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold" style={{ fontSize: 16, color: "var(--c-text)", fontFamily: "var(--font-grotesk)" }}>
                  {tSector(locale, s.sector)}
                </h2>
                <span style={{ fontSize: 12, color: "var(--c-muted)" }}>
                  {s.count} {isAr ? "شركة" : "companies"} · {isAr ? "القيمة السوقية:" : "Market Cap:"} {s.totalMarketCap >= 1e12 ? `${(s.totalMarketCap / 1e12).toFixed(1)}T` : s.totalMarketCap >= 1e9 ? `${(s.totalMarketCap / 1e9).toFixed(0)}B` : "—"}
                </span>
              </div>
              <Link
                href={`/${locale}/screener?sector=${encodeURIComponent(s.sector)}`}
                style={{ fontSize: 12, color: "var(--c-gold)", textDecoration: "none", fontWeight: 600 }}
              >
                {isAr ? "عرض الكل" : "View all"} →
              </Link>
            </div>

            {/* Sector Averages */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div style={{ padding: "10px 12px", background: "var(--c-elevated)", borderRadius: 8 }}>
                <p style={{ fontSize: 10, color: "var(--c-dim)", fontWeight: 600, marginBottom: 2 }}>{isAr ? "متوسط النتيجة" : "AVG SCORE"}</p>
                <span className="font-num font-bold" style={{ fontSize: 18, color: s.avgScore !== null ? (s.avgScore >= 60 ? "var(--c-green)" : s.avgScore >= 40 ? "var(--c-gold)" : "var(--c-red)") : "var(--c-dim)" }}>
                  {s.avgScore !== null ? s.avgScore.toFixed(0) : "—"}
                </span>
              </div>
              <div style={{ padding: "10px 12px", background: "var(--c-elevated)", borderRadius: 8 }}>
                <p style={{ fontSize: 10, color: "var(--c-dim)", fontWeight: 600, marginBottom: 2 }}>{isAr ? "متوسط المكرر" : "AVG P/E"}</p>
                <span className="font-num font-bold" style={{ fontSize: 18, color: s.avgPE !== null ? "var(--c-text)" : "var(--c-dim)" }}>
                  {s.avgPE !== null ? `${s.avgPE.toFixed(1)}x` : "—"}
                </span>
              </div>
              <div style={{ padding: "10px 12px", background: "var(--c-elevated)", borderRadius: 8 }}>
                <p style={{ fontSize: 10, color: "var(--c-dim)", fontWeight: 600, marginBottom: 2 }}>{isAr ? "متوسط العائد" : "AVG DIV YIELD"}</p>
                <span className="font-num font-bold" style={{ fontSize: 18, color: s.avgDivYield !== null && s.avgDivYield > 0 ? "var(--c-green)" : "var(--c-dim)" }}>
                  {s.avgDivYield !== null ? `${(s.avgDivYield * 100).toFixed(1)}%` : "—"}
                </span>
              </div>
              <div style={{ padding: "10px 12px", background: "var(--c-elevated)", borderRadius: 8 }}>
                <p style={{ fontSize: 10, color: "var(--c-dim)", fontWeight: 600, marginBottom: 2 }}>{isAr ? "متوسط العائد على حقوق الملكية" : "AVG ROE"}</p>
                <span className="font-num font-bold" style={{ fontSize: 18, color: s.avgROE !== null ? (s.avgROE > 0.15 ? "var(--c-green)" : "var(--c-text)") : "var(--c-dim)" }}>
                  {s.avgROE !== null ? `${(s.avgROE * 100).toFixed(1)}%` : "—"}
                </span>
              </div>
            </div>

            {/* Top 3 Cards: Top Scored | Cheapest | Highest Dividend */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Top Scored */}
              <div style={{ padding: "12px 14px", background: "var(--c-elevated)", borderRadius: 8, border: "1px solid var(--c-border)" }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <Star size={11} style={{ color: "#C8A951" }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: "var(--c-muted)", letterSpacing: "0.04em" }}>{isAr ? "الأعلى تقييماً" : "TOP SCORED"}</span>
                </div>
                {s.topScored.length > 0 ? s.topScored.map((c, i) => (
                  <Link key={c.ticker} href={`/${locale}/stock/${c.ticker}`} style={{ textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0" }}>
                    <span style={{ fontSize: 12, color: "var(--c-text)", fontWeight: i === 0 ? 600 : 400 }}>
                      {isAr && c.nameAr ? c.nameAr : c.nameEn}
                    </span>
                    <span className="font-num font-bold" style={{ fontSize: 12, color: tierColor(c.tier) }}>{c.score.toFixed(0)}</span>
                  </Link>
                )) : <p style={{ fontSize: 11, color: "var(--c-dim)" }}>—</p>}
              </div>

              {/* Cheapest */}
              <div style={{ padding: "12px 14px", background: "var(--c-elevated)", borderRadius: 8, border: "1px solid var(--c-border)" }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <BarChart3 size={11} style={{ color: "#60A5FA" }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: "var(--c-muted)", letterSpacing: "0.04em" }}>{isAr ? "الأرخص" : "CHEAPEST"}</span>
                </div>
                {s.cheapest.length > 0 ? s.cheapest.map((c, i) => (
                  <Link key={c.ticker} href={`/${locale}/stock/${c.ticker}`} style={{ textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0" }}>
                    <span style={{ fontSize: 12, color: "var(--c-text)", fontWeight: i === 0 ? 600 : 400 }}>
                      {isAr && c.nameAr ? c.nameAr : c.nameEn}
                    </span>
                    <span className="font-num" style={{ fontSize: 12, color: "#60A5FA" }}>{c.pe.toFixed(1)}x</span>
                  </Link>
                )) : <p style={{ fontSize: 11, color: "var(--c-dim)" }}>—</p>}
              </div>

              {/* Highest Dividend */}
              <div style={{ padding: "12px 14px", background: "var(--c-elevated)", borderRadius: 8, border: "1px solid var(--c-border)" }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <DollarSign size={11} style={{ color: "#22c55e" }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: "var(--c-muted)", letterSpacing: "0.04em" }}>{isAr ? "أعلى توزيعات" : "HIGHEST DIVIDEND"}</span>
                </div>
                {s.highestDividend.length > 0 ? s.highestDividend.map((c, i) => (
                  <Link key={c.ticker} href={`/${locale}/stock/${c.ticker}`} style={{ textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0" }}>
                    <span style={{ fontSize: 12, color: "var(--c-text)", fontWeight: i === 0 ? 600 : 400 }}>
                      {isAr && c.nameAr ? c.nameAr : c.nameEn}
                    </span>
                    <span className="font-num" style={{ fontSize: 12, color: "#22c55e" }}>{(c.yield * 100).toFixed(1)}%</span>
                  </Link>
                )) : <p style={{ fontSize: 11, color: "var(--c-dim)" }}>—</p>}
              </div>
            </div>
          </div>
        ))}
      </div>

      <hr className="gold-line my-10" />
      <p style={{ fontSize: 11, color: "var(--c-dim)", textAlign: "center", letterSpacing: "0.02em" }}>
        {t(locale, "common.disclaimer")}
      </p>
    </div>
  );
}
