import { createServiceClient } from "@/lib/supabase/server";
import { getCompanyQuote } from "@/lib/data-sources";
import PriceChart from "@/components/PriceChart";
import Link from "next/link";

function Disclaimer() {
  return (
    <div className="mt-8 p-4 bg-gray-800/50 rounded-lg">
      <p className="text-xs text-gray-500 text-center">
        SŪQAI provides translated market data for informational purposes only. This is not
        investment advice.
      </p>
    </div>
  );
}

function MetricCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string | number;
  sub?: string;
  highlight?: "green" | "red" | "gold";
}) {
  const valueColor =
    highlight === "green"
      ? "text-[#10B981]"
      : highlight === "red"
      ? "text-[#EF4444]"
      : highlight === "gold"
      ? "text-[#C8A951]"
      : "text-white";

  return (
    <div className="bg-[#111827] rounded-xl p-4 border border-gray-800">
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <p className={`font-semibold text-lg ${valueColor}`}>{value || "—"}</p>
      {sub && <p className="text-gray-500 text-xs mt-0.5">{sub}</p>}
    </div>
  );
}

export default async function StockPage({
  params,
}: {
  params: Promise<{ locale: string; ticker: string }>;
}) {
  const { locale, ticker } = await params;
  const upperTicker = ticker.toUpperCase();
  const supabase = createServiceClient();

  // ── 1. Get company from DB ──────────────────────────────────
  const { data: company } = await supabase
    .from("companies")
    .select("id, ticker, name_en, name_ar, sector, market, is_shariah_compliant")
    .eq("ticker", upperTicker)
    .single();

  if (!company) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-[#111827] rounded-xl p-8 text-center border border-gray-800">
          <p className="text-4xl mb-4">📊</p>
          <h1 className="text-xl font-semibold text-white mb-2">Stock Not Found</h1>
          <p className="text-gray-400 mb-4">
            No data for ticker <span className="text-[#C8A951] font-bold">{upperTicker}</span>
          </p>
          <Link href={`/${locale}/screener`} className="text-[#C8A951] hover:underline text-sm">
            ← Browse all stocks
          </Link>
        </div>
        <Disclaimer />
      </div>
    );
  }

  // ── 2. Parallel data fetch ──────────────────────────────────
  const yearAgo = new Date();
  yearAgo.setFullYear(yearAgo.getFullYear() - 1);
  const yearAgoStr = yearAgo.toISOString().split("T")[0];

  const [liveQuoteResult, latestPriceResult, priceHistoryResult, financialResult, recentDivResult, allDivResult] =
    await Promise.allSettled([
      getCompanyQuote(upperTicker),
      supabase
        .from("stock_prices")
        .select("close, open, high, low, volume, date")
        .eq("company_id", company.id)
        .order("date", { ascending: false })
        .limit(1)
        .single(),
      supabase
        .from("stock_prices")
        .select("date, close, open, high, low")
        .eq("company_id", company.id)
        .order("date", { ascending: true })
        .limit(90),
      supabase
        .from("financials")
        .select("earnings_per_share, year, period, net_income, revenue")
        .eq("company_id", company.id)
        .order("year", { ascending: false })
        .order("period", { ascending: false })
        .limit(1)
        .single(),
      // Recent dividends (last 12 months) for yield
      supabase
        .from("dividends")
        .select("amount_per_share, ex_date, payment_date")
        .eq("company_id", company.id)
        .gte("ex_date", yearAgoStr)
        .order("ex_date", { ascending: false }),
      // All dividends for history display
      supabase
        .from("dividends")
        .select("amount_per_share, ex_date, payment_date, currency")
        .eq("company_id", company.id)
        .order("ex_date", { ascending: false })
        .limit(8),
    ]);

  // ── 3. Extract results ──────────────────────────────────────
  const liveQuote = liveQuoteResult.status === "fulfilled" ? liveQuoteResult.value : null;
  const latestDbPrice =
    latestPriceResult.status === "fulfilled" ? latestPriceResult.value.data : null;
  const priceHistory =
    priceHistoryResult.status === "fulfilled" ? priceHistoryResult.value.data ?? [] : [];
  const financial =
    financialResult.status === "fulfilled" ? financialResult.value.data : null;
  const recentDivs =
    recentDivResult.status === "fulfilled" ? recentDivResult.value.data ?? [] : [];
  const allDivs =
    allDivResult.status === "fulfilled" ? allDivResult.value.data ?? [] : [];

  // ── 4. Compute display values ───────────────────────────────
  const currentPrice = liveQuote?.price ?? (latestDbPrice ? Number(latestDbPrice.close) : null);
  const changeAmt = liveQuote?.change ?? null;
  const changePct = liveQuote?.change_percent ?? null;
  const isPositive = changePct !== null ? changePct >= 0 : changeAmt !== null ? changeAmt >= 0 : true;
  const volume = liveQuote?.volume ?? (latestDbPrice ? Number(latestDbPrice.volume) : null);
  const high = liveQuote?.high ?? (latestDbPrice ? Number(latestDbPrice.high) : null);
  const low = liveQuote?.low ?? (latestDbPrice ? Number(latestDbPrice.low) : null);
  const open = liveQuote?.open ?? (latestDbPrice ? Number(latestDbPrice.open) : null);

  const eps = financial?.earnings_per_share ? Number(financial.earnings_per_share) : null;
  const pe = currentPrice && eps && eps > 0 ? (currentPrice / eps).toFixed(1) : null;

  const annualDiv = recentDivs.reduce((s, d) => s + Number(d.amount_per_share), 0);
  const divYield =
    currentPrice && annualDiv > 0
      ? ((annualDiv / currentPrice) * 100).toFixed(2) + "%"
      : null;

  // 52W high/low from price history
  const allHighs = priceHistory.map((p) => Number(p.high ?? p.close));
  const allLows = priceHistory.map((p) => Number(p.low ?? p.close));
  const fiftyTwoHigh = allHighs.length > 0 ? Math.max(...allHighs).toFixed(2) : null;
  const fiftyTwoLow = allLows.length > 0 ? Math.min(...allLows).toFixed(2) : null;

  const displayName = locale === "ar" && company.name_ar ? company.name_ar : company.name_en;
  const isLive = !!liveQuote;

  // Chart data
  const chartData = priceHistory.map((p) => ({
    date: p.date as string,
    close: Number(p.close),
    open: p.open ? Number(p.open) : undefined,
    high: p.high ? Number(p.high) : undefined,
    low: p.low ? Number(p.low) : undefined,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Back */}
      <Link
        href={`/${locale}/screener`}
        className="text-[#C8A951] hover:underline text-sm mb-4 inline-flex items-center gap-1"
      >
        ← Stock Screener
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-[#C8A951] font-bold text-2xl">{company.ticker}</span>
            {company.is_shariah_compliant && (
              <span className="text-xs bg-emerald-900/40 text-emerald-400 border border-emerald-800/50 px-2 py-0.5 rounded-full">
                ✓ Shariah Compliant
              </span>
            )}
            {isLive && (
              <span className="text-xs bg-blue-900/30 text-blue-400 border border-blue-800/40 px-2 py-0.5 rounded-full">
                ● Live
              </span>
            )}
          </div>
          <h1 className="text-xl font-semibold text-white">{displayName}</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {company.sector && (
              <span className="bg-gray-800 text-gray-400 text-xs px-2 py-0.5 rounded mr-2">
                {company.sector}
              </span>
            )}
            {company.market && (
              <span className="text-gray-500 text-xs">{company.market} Market</span>
            )}
          </p>
        </div>
      </div>

      {/* Price card */}
      <div className="bg-[#111827] rounded-xl p-6 mb-6 border border-gray-800">
        {currentPrice !== null ? (
          <>
            <div className="flex items-end justify-between mb-5 flex-wrap gap-3">
              <div>
                <p className="text-4xl font-bold text-white">
                  SAR {currentPrice.toFixed(2)}
                </p>
              </div>
              {changePct !== null && (
                <div className={`text-right ${isPositive ? "text-[#10B981]" : "text-[#EF4444]"}`}>
                  <p className="text-xl font-semibold">
                    {isPositive ? "+" : ""}
                    {changeAmt?.toFixed(2)}
                  </p>
                  <p className="text-lg">
                    ({isPositive ? "+" : ""}
                    {changePct?.toFixed(2)}%)
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-800">
              <div>
                <p className="text-gray-400 text-xs mb-1">Open</p>
                <p className="text-white font-medium text-sm">
                  {open ? `SAR ${open.toFixed(2)}` : "—"}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">High</p>
                <p className="text-[#10B981] font-medium text-sm">
                  {high ? `SAR ${high.toFixed(2)}` : "—"}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">Low</p>
                <p className="text-[#EF4444] font-medium text-sm">
                  {low ? `SAR ${low.toFixed(2)}` : "—"}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">Volume</p>
                <p className="text-white font-medium text-sm">
                  {volume
                    ? volume >= 1e6
                      ? `${(volume / 1e6).toFixed(1)}M`
                      : `${(volume / 1e3).toFixed(0)}K`
                    : "—"}
                </p>
              </div>
            </div>
          </>
        ) : (
          <p className="text-gray-400 text-sm">Price data unavailable</p>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard
          label="P/E Ratio"
          value={pe ?? "—"}
          sub={eps ? `EPS: SAR ${eps.toFixed(2)}` : undefined}
        />
        <MetricCard
          label="EPS (SAR)"
          value={eps ? eps.toFixed(2) : "—"}
          sub={financial ? `${financial.period} ${financial.year}` : undefined}
        />
        <MetricCard
          label="Dividend Yield"
          value={divYield ?? "—"}
          sub={annualDiv > 0 ? `SAR ${annualDiv.toFixed(2)}/yr` : undefined}
          highlight={divYield ? "green" : undefined}
        />
        <MetricCard
          label="52W Range"
          value={fiftyTwoHigh ? `${fiftyTwoLow} – ${fiftyTwoHigh}` : "—"}
          sub="SAR"
        />
      </div>

      {/* Price Chart */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">Price History</h2>
          {chartData.length > 0 && (
            <span className="text-xs text-gray-500">{chartData.length} days</span>
          )}
        </div>
        <div className="bg-[#111827] rounded-xl p-4 border border-gray-800">
          <PriceChart data={chartData} ticker={company.ticker} />
        </div>
      </section>

      {/* Dividend History */}
      {allDivs.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-3">Dividend History</h2>
          <div className="bg-[#111827] rounded-xl overflow-hidden border border-gray-800">
            <table className="w-full">
              <thead className="bg-[#0D1626] border-b border-gray-800">
                <tr>
                  <th className="text-left text-xs font-medium p-3 text-gray-400">Ex-Date</th>
                  <th className="text-right text-xs font-medium p-3 text-gray-400">Amount</th>
                  <th className="text-right text-xs font-medium p-3 text-gray-400">Pay Date</th>
                </tr>
              </thead>
              <tbody>
                {allDivs.map((d, i) => (
                  <tr key={i} className="border-t border-gray-800/60 hover:bg-gray-800/30 transition">
                    <td className="p-3 text-white text-sm">
                      {new Date(d.ex_date + "T00:00:00").toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="p-3 text-right text-[#10B981] font-medium text-sm">
                      SAR {Number(d.amount_per_share).toFixed(2)}
                    </td>
                    <td className="p-3 text-right text-gray-400 text-sm">
                      {d.payment_date
                        ? new Date(d.payment_date + "T00:00:00").toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Financials (if available) */}
      {financial && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-3">
            Financials — {financial.period} {financial.year}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {financial.revenue && (
              <div className="bg-[#111827] rounded-xl p-4 border border-gray-800">
                <p className="text-gray-400 text-xs mb-1">Revenue</p>
                <p className="text-white font-semibold">
                  SAR {(Number(financial.revenue) / 1e9).toFixed(2)}B
                </p>
              </div>
            )}
            {financial.net_income && (
              <div className="bg-[#111827] rounded-xl p-4 border border-gray-800">
                <p className="text-gray-400 text-xs mb-1">Net Income</p>
                <p className="text-white font-semibold">
                  SAR {(Number(financial.net_income) / 1e9).toFixed(2)}B
                </p>
              </div>
            )}
            {financial.earnings_per_share && (
              <div className="bg-[#111827] rounded-xl p-4 border border-gray-800">
                <p className="text-gray-400 text-xs mb-1">EPS</p>
                <p className="text-white font-semibold">
                  SAR {Number(financial.earnings_per_share).toFixed(2)}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Back to Screener */}
      <div className="mb-6">
        <Link
          href={`/${locale}/screener`}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C8A951] text-[#0A0F1C] font-semibold rounded-lg hover:bg-[#B8993F] transition text-sm"
        >
          ← Back to Screener
        </Link>
      </div>

      <Disclaimer />
    </div>
  );
}
