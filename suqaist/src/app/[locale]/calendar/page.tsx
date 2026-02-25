import { createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function CalendarPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = createServiceClient();

  // Fetch dividends with company info and latest price
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

  // Get all company IDs to fetch their latest prices
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

  // Enrich dividends with yield calculation
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

  // Separate upcoming vs past (relative to today)
  const today = new Date().toISOString().split("T")[0];
  const upcoming = enriched.filter((d) => d.ex_date >= today).sort((a, b) => a.ex_date.localeCompare(b.ex_date));
  const past = enriched.filter((d) => d.ex_date < today).sort((a, b) => b.ex_date.localeCompare(a.ex_date));

  // Top yield — latest dividend per company, sorted by yield desc
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

  const title = locale === "ar" ? "تقويم الأرباح الموزعة" : "Dividend Calendar";

  function DividendRow({ d }: { d: typeof enriched[0] }) {
    const name = locale === "ar" && d.name_ar ? d.name_ar : d.name_en;
    return (
      <tr className="border-t border-gray-800/60 hover:bg-gray-800/30 transition">
        <td className="p-3">
          <Link href={`/${locale}/stock/${d.ticker}`} className="group">
            <span className="text-[#C8A951] font-bold text-sm group-hover:underline">
              {d.ticker}
            </span>
            <p className="text-xs text-gray-400 mt-0.5 leading-tight truncate max-w-[160px]">
              {name}
            </p>
          </Link>
        </td>
        <td className="p-3 text-right text-white text-sm">
          {new Date(d.ex_date + "T00:00:00").toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </td>
        <td className="p-3 text-right">
          {d.payment_date ? (
            <span className="text-gray-400 text-sm">
              {new Date(d.payment_date + "T00:00:00").toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          ) : (
            <span className="text-gray-600 text-sm">—</span>
          )}
        </td>
        <td className="p-3 text-right text-white font-semibold text-sm">
          {d.amount.toFixed(2)} {d.currency}
        </td>
        <td className="p-3 text-right">
          {d.yieldPct !== null ? (
            <span className="text-[#10B981] font-medium text-sm">
              {d.yieldPct.toFixed(2)}%
            </span>
          ) : (
            <span className="text-gray-600 text-sm">—</span>
          )}
        </td>
      </tr>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="text-gray-400 text-sm mt-1">
          {enriched.length} dividend records · {upcoming.length} upcoming
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#111827] rounded-xl p-4 border border-gray-800">
          <p className="text-gray-400 text-xs mb-1">Total Records</p>
          <p className="text-white font-bold text-xl">{enriched.length}</p>
        </div>
        <div className="bg-[#111827] rounded-xl p-4 border border-gray-800">
          <p className="text-gray-400 text-xs mb-1">Upcoming</p>
          <p className="text-[#10B981] font-bold text-xl">{upcoming.length}</p>
        </div>
        <div className="bg-[#111827] rounded-xl p-4 border border-gray-800">
          <p className="text-gray-400 text-xs mb-1">Paying Companies</p>
          <p className="text-white font-bold text-xl">{latestByCompany.size}</p>
        </div>
        <div className="bg-[#111827] rounded-xl p-4 border border-gray-800">
          <p className="text-gray-400 text-xs mb-1">Avg Yield</p>
          <p className="text-[#C8A951] font-bold text-xl">
            {topYield.length
              ? (topYield.reduce((s, d) => s + (d.yieldPct ?? 0), 0) / topYield.length).toFixed(1) + "%"
              : "—"}
          </p>
        </div>
      </div>

      {/* Upcoming Dividends */}
      {upcoming.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-3">Upcoming Ex-Dates</h2>
          <div className="bg-[#111827] rounded-xl overflow-hidden border border-gray-800">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#0D1626] border-b border-gray-800">
                  <tr>
                    <th className="text-left text-xs font-medium p-3 text-gray-400">Company</th>
                    <th className="text-right text-xs font-medium p-3 text-gray-400">Ex-Date</th>
                    <th className="text-right text-xs font-medium p-3 text-gray-400">Pay Date</th>
                    <th className="text-right text-xs font-medium p-3 text-gray-400">Amount</th>
                    <th className="text-right text-xs font-medium p-3 text-gray-400">Yield</th>
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

      {/* Past Dividends */}
      {past.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-3">Recent Dividends</h2>
          <div className="bg-[#111827] rounded-xl overflow-hidden border border-gray-800">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#0D1626] border-b border-gray-800">
                  <tr>
                    <th className="text-left text-xs font-medium p-3 text-gray-400">Company</th>
                    <th className="text-right text-xs font-medium p-3 text-gray-400">Ex-Date</th>
                    <th className="text-right text-xs font-medium p-3 text-gray-400">Pay Date</th>
                    <th className="text-right text-xs font-medium p-3 text-gray-400">Amount</th>
                    <th className="text-right text-xs font-medium p-3 text-gray-400">Yield</th>
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
        <div className="text-center py-16 bg-[#111827] rounded-xl border border-gray-800">
          <p className="text-gray-500">No dividend records found</p>
        </div>
      )}

      {/* Top Yield Ranking */}
      {topYield.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-3">Top Dividend Yield</h2>
          <div className="bg-[#111827] rounded-xl overflow-hidden border border-gray-800">
            <table className="w-full">
              <thead className="bg-[#0D1626] border-b border-gray-800">
                <tr>
                  <th className="text-left text-xs font-medium p-3 text-gray-400">#</th>
                  <th className="text-left text-xs font-medium p-3 text-gray-400">Company</th>
                  <th className="text-right text-xs font-medium p-3 text-gray-400">Yield</th>
                  <th className="text-right text-xs font-medium p-3 text-gray-400">Last Dividend</th>
                  <th className="text-right text-xs font-medium p-3 text-gray-400">Price</th>
                </tr>
              </thead>
              <tbody>
                {topYield.map((d, i) => {
                  const name = locale === "ar" && d.name_ar ? d.name_ar : d.name_en;
                  return (
                    <tr key={d.ticker} className="border-t border-gray-800/60 hover:bg-gray-800/30 transition">
                      <td className="p-3 text-gray-500 text-sm">{i + 1}</td>
                      <td className="p-3">
                        <Link href={`/${locale}/stock/${d.ticker}`} className="group">
                          <span className="text-[#C8A951] font-bold text-sm group-hover:underline">
                            {d.ticker}
                          </span>
                          <p className="text-xs text-gray-400 mt-0.5">{name}</p>
                        </Link>
                      </td>
                      <td className="p-3 text-right text-[#10B981] font-semibold text-sm">
                        {d.yieldPct!.toFixed(2)}%
                      </td>
                      <td className="p-3 text-right text-white text-sm">
                        SAR {d.amount.toFixed(2)}
                      </td>
                      <td className="p-3 text-right text-gray-400 text-sm">
                        {d.price ? `SAR ${d.price.toFixed(2)}` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Disclaimer */}
      <div className="mt-4 p-4 bg-gray-800/50 rounded-lg">
        <p className="text-xs text-gray-500 text-center">
          SŪQAI provides translated market data for informational purposes only. This is not
          investment advice. Dividend yields are calculated using the latest available price.
        </p>
      </div>
    </div>
  );
}
