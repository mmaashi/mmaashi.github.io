import Link from "next/link";

// Empty State
function EmptyState() {
  return (
    <div className="text-center py-12">
      <p className="text-gray-400">No companies found</p>
    </div>
  );
}

// Loading Skeleton
function TableSkeleton() {
  return (
    <div className="animate-pulse">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="h-12 border-b border-gray-800 bg-gray-800/30"></div>
      ))}
    </div>
  );
}

export default async function ScreenerPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ sector?: string; sort?: string }>;
}) {
  const { locale } = await params;
  const { sector, sort } = await searchParams;

  const title = locale === "ar" ? "مصفاة الأسهم" : "Stock Screener";

  // This would fetch from API - placeholder
  const companies: any[] = [];
  const sectors = ["Energy", "Materials", "Industials", "Consumer", "Healthcare", "Financials", "IT", "Telecom", "Utilities"];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">{title}</h1>
      </div>

      {/* Filters */}
      <div className="bg-[#111827] rounded-lg p-4 mb-6">
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Sector</label>
            <select className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white">
              <option value="">All Sectors</option>
              {sectors.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Market Cap (SAR)</label>
            <select className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white">
              <option value="">Any</option>
              <option value="small">&lt; 1B</option>
              <option value="medium">1B - 10B</option>
              <option value="large">10B - 50B</option>
              <option value="mega">&gt; 50B</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">P/E Ratio</label>
            <select className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white">
              <option value="">Any</option>
              <option value="low">&lt; 15</option>
              <option value="mid">15 - 25</option>
              <option value="high">&gt; 25</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Dividend Yield</label>
            <select className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white">
              <option value="">Any</option>
              <option value="high">&gt; 3%</option>
              <option value="mid">1% - 3%</option>
              <option value="low">&lt; 1%</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-[#111827] rounded-lg overflow-hidden">
        {companies.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="text-left text-xs text-gray-400 font-medium p-3">Ticker</th>
                  <th className="text-left text-xs text-gray-400 font-medium p-3">Company</th>
                  <th className="text-right text-xs text-gray-400 font-medium p-3">Price</th>
                  <th className="text-right text-xs text-gray-400 font-medium p-3">Change%</th>
                  <th className="text-right text-xs text-gray-400 font-medium p-3">Market Cap</th>
                  <th className="text-right text-xs text-gray-400 font-medium p-3">P/E</th>
                  <th className="text-right text-xs text-gray-400 font-medium p-3">Div Yield</th>
                  <th className="text-left text-xs text-gray-400 font-medium p-3">Sector</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr key={company.ticker} className="border-t border-gray-800 hover:bg-gray-800/30 cursor-pointer">
                    <td className="p-3 font-medium text-[#C8A951]">
                      <Link href={`/stock/${company.ticker}`}>{company.ticker}</Link>
                    </td>
                    <td className="p-3 text-white">{company.name_en}</td>
                    <td className="p-3 text-right text-white">{company.price?.toFixed(2)}</td>
                    <td className={`p-3 text-right ${company.change >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                      {company.change >= 0 ? '+' : ''}{company.change?.toFixed(2)}%
                    </td>
                    <td className="p-3 text-right text-gray-400">{(company.market_cap / 1e9).toFixed(1)}B</td>
                    <td className="p-3 text-right text-gray-400">{company.pe_ratio || '--'}</td>
                    <td className="p-3 text-right text-gray-400">{company.dividend_yield || '--'}</td>
                    <td className="p-3 text-gray-400">{company.sector}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="mt-8 p-4 bg-gray-800/50 rounded-lg">
        <p className="text-xs text-gray-500 text-center">
          SŪQAI provides translated market data for informational purposes only. This is not investment advice.
        </p>
      </div>
    </div>
  );
}
