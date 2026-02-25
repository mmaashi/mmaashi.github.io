import { getCompanyQuote } from "@/lib/data-sources";
import Link from "next/link";

// Disclaimer Component
function Disclaimer() {
  return (
    <div className="mt-8 p-4 bg-gray-800/50 rounded-lg">
      <p className="text-xs text-gray-500 text-center">
        SŪQAI provides translated market data for informational purposes only. This is not investment advice.
      </p>
    </div>
  );
}

// Price Chart Component (placeholder - Phase 2)
function PriceChart({ ticker }: { ticker: string }) {
  return (
    <div className="bg-[#111827] rounded-lg p-4 h-64 flex items-center justify-center">
      <p className="text-gray-500 text-sm">Price chart coming in Phase 2</p>
    </div>
  );
}

// Key Metrics Card
function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-[#111827] rounded-lg p-4">
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <p className="text-white font-semibold">{value || '--'}</p>
    </div>
  );
}

// News Section
function CompanyNews({ ticker }: { ticker: string }) {
  return (
    <div className="bg-[#111827] rounded-lg p-4">
      <h3 className="font-semibold text-white mb-4">Latest News</h3>
      <p className="text-gray-400 text-sm">No news available for {ticker}</p>
    </div>
  );
}

export default async function StockPage({
  params,
}: {
  params: Promise<{ locale: string; ticker: string }>;
}) {
  const { locale, ticker } = await params;

  let quote;
  try {
    quote = await getCompanyQuote(ticker);
  } catch (error) {
    console.error("Failed to fetch quote:", error);
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-[#111827] rounded-lg p-8 text-center">
          <h1 className="text-xl font-semibold text-white mb-2">Stock Not Found</h1>
          <p className="text-gray-400 mb-4">Unable to load data for {ticker}</p>
          <Link href="/" className="text-[#C8A951] hover:underline">← Back to Dashboard</Link>
        </div>
        <Disclaimer />
      </div>
    );
  }

  const isPositive = quote.change >= 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Back Link */}
      <Link href="/" className="text-[#C8A951] hover:underline text-sm mb-4 inline-block">
        ← Back to Dashboard
      </Link>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">{quote.name}</h1>
        <p className="text-gray-400">{ticker}</p>
      </div>

      {/* Price Info */}
      <div className="bg-[#111827] rounded-lg p-6 mb-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-4xl font-bold text-white">{quote.price.toFixed(2)}</p>
            <p className="text-lg">SAR</p>
          </div>
          <div className={`text-right ${isPositive ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
            <p className="text-lg font-semibold">
              {isPositive ? '+' : ''}{quote.change.toFixed(2)}
            </p>
            <p className="text-lg">
              ({isPositive ? '+' : ''}{quote.change_percent.toFixed(2)}%)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div>
            <p className="text-gray-400 text-xs">Volume</p>
            <p className="text-white font-medium">{(quote.volume / 1e6).toFixed(2)}M</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">Value</p>
            <p className="text-white font-medium">{(quote.value / 1e9).toFixed(2)}B</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">High</p>
            <p className="text-white font-medium">{quote.high.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">Low</p>
            <p className="text-white font-medium">{quote.low.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard label="P/E Ratio" value="--" />
        <MetricCard label="EPS" value="--" />
        <MetricCard label="Dividend Yield" value="--" />
        <MetricCard label="52W High" value="--" />
      </div>

      {/* Price Chart */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold text-white mb-3">Price History</h2>
        <PriceChart ticker={ticker} />
      </section>

      {/* Company News */}
      <section className="mb-6">
        <CompanyNews ticker={ticker} />
      </section>

      {/* Watchlist Button */}
      <div className="mb-6">
        <button className="w-full md:w-auto px-6 py-3 bg-[#C8A951] text-[#0A0F1C] font-semibold rounded-lg hover:bg-[#B8993F] transition">
          Add to Watchlist
        </button>
      </div>

      {/* Disclaimer */}
      <Disclaimer />
    </div>
  );
}
