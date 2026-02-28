import { createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";
import { CalendarDays, TrendingUp, Building2, BarChart3 } from "lucide-react";
import { t } from "@/lib/i18n";

export default async function CalendarPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = createServiceClient();

  const { data: dividends } = await supabase
    .from("dividends")
    .select(`
      id,
      ex_date,
      payment_date,
      amount_per_share,
      currency,
      companies (
        id,
        ticker,
        name_en,
        name_ar
      )
    `)
    .order("ex_date", { ascending: false });

  const companyIds = [...new Set((dividends || []).map((d) => (d.companies as any)?.id).filter(Boolean))];

  let priceMap = new Map<string, number>();
  if (companyIds.length > 0) {
    const { data: prices } = await supabase
      .from("stock_prices")
      .select("company_id, close, date")
      .in("company_id", companyIds)
      .order("date", { ascending: false })
      .limit(companyIds.length * 2);

    for (const p of prices || []) {
      if (!priceMap.has(p.company_id)) {
        priceMap.set(p.company_id, Number(p.close));
      }
    }
  }

  const enriched = (dividends || []).map((d) => {
    const company = d.companies as any;
    const price = company?.id ? priceMap.get(company.id) : null;
    const amount = Number(d.amount_per_share);
    const yieldPct = price && price > 0 ? (amount / price) * 100 : null;
    return {
      id: d.id,
      ticker: company?.ticker || "?",
      name_en: company?.name_en || "",
      name_ar: company?.name_ar || company?.name_en || "",
      ex_date: d.ex_date,
      payment_date: d.payment_date,
      amount,
      currency: d.currency,
      price,
      yieldPct,
    };
  });

  const today = new Date().toISOString().split("T")[0];
  const upcoming = enriched.filter((d) => d.ex_date >= today).sort((a, b) => a.ex_date.localeCompare(b.ex_date));
  const past = enriched.filter((d) => d.ex_date < today).sort((a, b) => b.ex_date.localeCompare(a.ex_date));

  const latestByCompany = new Map<string, typeof enriched[0]>();
  for (const d of enriched) {
    if (!latestByCompany.has(d.ticker)) latestByCompany.set(d.ticker, d);
    else if (d.ex_date > latestByCompany.get(d.ticker)!.ex_date)
      latestByCompany.set(d.ticker, d);
  }
  const topYield = [...latestByCompany.values()]
    .filter((d) => d.yieldPct !== null)
    .sort((a, b) => (b.yieldPct ?? 0) - (a.yieldPct ?? 0))
    .slice(0, 8);

  function DividendRow({ d }: { d: typeof enriched[0] }) {
    const name = locale === "ar" && d.name_ar ? d.name_ar : d.name_en;
    return (
      <tr>
        <td>
          <Link href={`/${locale}/stock/${d.ticker}`} className="flex items-center gap-2 group">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "var(--c-gold-dim)", border: "1px solid var(--c-gold-ring)" }}
            >
              <span style={{ fontSize: 8, fontWeight: 800, color: "var(--c-gold)" }}>
                {d.ticker.slice(0, 4)}
              </span>
            </div>
            <div>
              <span className="ticker-tag group-hover:underline">{d.ticker}</span>
              <p style={{ fontSize: 11, color: "var(--c-muted)", marginTop: 1 }}>{name}</p>
            </div>
          </Link>
        </td>
        <td style={{ textAlign: "right" }}>
          <span className="font-num" style={{ color: "var(--c-text)", fontSize: 13 }}>
            {new Date(d.ex_date + "T00:00:00").toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </td>
        <td style={{ textAlign: "right" }}>
          {d.payment_date ? (
            <span className="font-num" style={{ color: "var(--c-muted)", fontSize: 13 }}>
              {new Date(d.payment_date + "T00:00:00").toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          ) : (
            <span style={{ color: "var(--c-dim)", fontSize: 13 }}>{t(locale, "common.na")}</span>
          )}
        </td>
        <td style={{ textAlign: "right" }}>
          <span className="font-num font-semibold" style={{ color: "var(--c-text)" }}>
            {d.amount.toFixed(2)} {d.currency}
          </span>
        </td>
        <td style={{ textAlign: "right" }}>
          {d.yieldPct !== null ? (
            <span className="badge badge-up font-num">{d.yieldPct.toFixed(2)}%</span>
          ) : (
            <span style={{ color: "var(--c-dim)", fontSize: 13 }}>{t(locale, "common.na")}</span>
          )}
        </td>
      </tr>
    );
  }

  return (
    <div className="page-wrap">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "var(--c-gold-dim)", border: "1px solid var(--c-gold-ring)" }}
        >
          <CalendarDays size={16} style={{ color: "var(--c-gold)" }} />
        </div>
        <div>
          <h1 className="font-bold text-xl" style={{ color: "var(--c-text)", fontFamily: "var(--font-grotesk)" }}>
            {t(locale, "calendar.title")}
          </h1>
          <p style={{ fontSize: 12, color: "var(--c-muted)" }}>
            {enriched.length} {t(locale, "calendar.subtitle_records")} · {latestByCompany.size}{" "}
            {t(locale, "calendar.subtitle_companies")}
          </p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 stagger">
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <CalendarDays size={13} style={{ color: "var(--c-muted)" }} />
            <span style={{ fontSize: 11, color: "var(--c-muted)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {t(locale, "calendar.total")}
            </span>
          </div>
          <span className="font-num font-bold text-xl" style={{ color: "var(--c-text)" }}>
            {enriched.length}
          </span>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={13} style={{ color: upcoming.length > 0 ? "var(--c-green)" : "var(--c-muted)" }} />
            <span style={{ fontSize: 11, color: "var(--c-muted)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {upcoming.length > 0 ? t(locale, "calendar.upcoming") : t(locale, "calendar.recent")}
            </span>
          </div>
          <span className="font-num font-bold text-xl" style={{ color: upcoming.length > 0 ? "var(--c-green)" : "var(--c-text)" }}>
            {upcoming.length > 0 ? upcoming.length : past.length > 0 ? past.length : "—"}
          </span>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <Building2 size={13} style={{ color: "var(--c-muted)" }} />
            <span style={{ fontSize: 11, color: "var(--c-muted)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {t(locale, "calendar.companies")}
            </span>
          </div>
          <span className="font-num font-bold text-xl" style={{ color: "var(--c-text)" }}>
            {latestByCompany.size}
          </span>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 size={13} style={{ color: "var(--c-gold)" }} />
            <span style={{ fontSize: 11, color: "var(--c-muted)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {t(locale, "calendar.avg_yield")}
            </span>
          </div>
          <span className="font-num font-bold text-xl" style={{ color: "var(--c-gold)" }}>
            {topYield.length
              ? (topYield.reduce((s, d) => s + (d.yieldPct ?? 0), 0) / topYield.length).toFixed(1) + "%"
              : t(locale, "common.na")}
          </span>
        </div>
      </div>

      {/* Upcoming Dividends */}
      {upcoming.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={14} style={{ color: "var(--c-green)" }} />
            <h2 className="font-bold" style={{ fontSize: 15, color: "var(--c-text)" }}>
              {t(locale, "calendar.upcoming_dates")}
            </h2>
          </div>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: "left" }}>{t(locale, "calendar.col.company")}</th>
                    <th style={{ textAlign: "right" }}>{t(locale, "calendar.col.ex_date")}</th>
                    <th style={{ textAlign: "right" }}>{t(locale, "calendar.col.pay_date")}</th>
                    <th style={{ textAlign: "right" }}>{t(locale, "calendar.col.amount")}</th>
                    <th style={{ textAlign: "right" }}>{t(locale, "calendar.col.yield")}</th>
                  </tr>
                </thead>
                <tbody>
                  {upcoming.map((d) => (
                    <DividendRow key={d.id} d={d} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Recent Dividends */}
      {past.length > 0 && (
        <section className="mb-6">
          <h2 className="font-bold mb-3" style={{ fontSize: 15, color: "var(--c-text)" }}>
            {t(locale, "calendar.recent_divs")}
          </h2>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: "left" }}>{t(locale, "calendar.col.company")}</th>
                    <th style={{ textAlign: "right" }}>{t(locale, "calendar.col.ex_date")}</th>
                    <th style={{ textAlign: "right" }}>{t(locale, "calendar.col.pay_date")}</th>
                    <th style={{ textAlign: "right" }}>{t(locale, "calendar.col.amount")}</th>
                    <th style={{ textAlign: "right" }}>{t(locale, "calendar.col.yield")}</th>
                  </tr>
                </thead>
                <tbody>
                  {past.map((d) => (
                    <DividendRow key={d.id} d={d} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {enriched.length === 0 && (
        <div className="card" style={{ padding: "64px 0", textAlign: "center" }}>
          <p style={{ color: "var(--c-muted)" }}>{t(locale, "calendar.no_records")}</p>
        </div>
      )}

      {/* Top Yield Ranking */}
      {topYield.length > 0 && (
        <section className="mb-6">
          <h2 className="font-bold mb-3" style={{ fontSize: 15, color: "var(--c-text)" }}>
            {t(locale, "calendar.top_yield")}
          </h2>
          <div className="card overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ textAlign: "left", width: 40 }}>{t(locale, "calendar.col.rank")}</th>
                  <th style={{ textAlign: "left" }}>{t(locale, "calendar.col.company")}</th>
                  <th style={{ textAlign: "right" }}>{t(locale, "calendar.col.yield")}</th>
                  <th style={{ textAlign: "right" }}>{t(locale, "calendar.col.last_div")}</th>
                  <th style={{ textAlign: "right" }}>{t(locale, "calendar.col.price")}</th>
                </tr>
              </thead>
              <tbody>
                {topYield.map((d, i) => {
                  const name = locale === "ar" && d.name_ar ? d.name_ar : d.name_en;
                  return (
                    <tr key={d.ticker}>
                      <td>
                        <span className="font-num" style={{ color: "var(--c-dim)", fontSize: 12 }}>
                          {i + 1}
                        </span>
                      </td>
                      <td>
                        <Link href={`/${locale}/stock/${d.ticker}`} className="flex items-center gap-2 group">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                            style={{
                              background: "var(--c-gold-dim)",
                              border: "1px solid var(--c-gold-ring)",
                            }}
                          >
                            <span style={{ fontSize: 7, fontWeight: 800, color: "var(--c-gold)" }}>
                              {d.ticker.slice(0, 4)}
                            </span>
                          </div>
                          <div>
                            <span className="ticker-tag group-hover:underline">{d.ticker}</span>
                            <p style={{ fontSize: 11, color: "var(--c-muted)", marginTop: 1 }}>{name}</p>
                          </div>
                        </Link>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <span className="badge badge-up font-num font-semibold">
                          {d.yieldPct!.toFixed(2)}%
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <span className="font-num" style={{ color: "var(--c-text)", fontSize: 13 }}>
                          {t(locale, "common.sar")} {d.amount.toFixed(2)}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <span className="font-num" style={{ color: "var(--c-muted)", fontSize: 13 }}>
                          {d.price ? `${t(locale, "common.sar")} ${d.price.toFixed(2)}` : t(locale, "common.na")}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <hr className="gold-line my-10" />
      <p style={{ fontSize: 11, color: "var(--c-dim)", textAlign: "center", letterSpacing: "0.02em" }}>
        {t(locale, "common.disclaimer")}
      </p>
    </div>
  );
}
