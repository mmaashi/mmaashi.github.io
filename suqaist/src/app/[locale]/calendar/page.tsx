// Empty State
function EmptyState() {
  return (
    <div className="text-center py-12">
      <p className="text-gray-400">No upcoming dividends</p>
    </div>
  );
}

export default async function CalendarPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const title = locale === "ar" ? "تقويم الأرباح" : "Dividend Calendar";

  // This would fetch from dividends table - placeholder
  const dividends: any[] = [];
  const topYield: any[] = [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">{title}</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-800 mb-6">
        <button className="pb-2 border-b-2 border-[#C8A951] text-[#C8A951] font-medium">
          Upcoming
        </button>
        <button className="pb-2 text-gray-400 hover:text-white">
          Calendar
        </button>
        <button className="pb-2 text-gray-400 hover:text-white">
          Top Yield
        </button>
      </div>

      {/* Upcoming Dividends */}
      {dividends.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="bg-[#111827] rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="text-left text-xs text-gray-400 font-medium p-3">Company</th>
                <th className="text-right text-xs text-gray-400 font-medium p-3">Ex-Date</th>
                <th className="text-right text-xs text-gray-400 font-medium p-3">Amount</th>
                <th className="text-right text-xs text-gray-400 font-medium p-3">Yield</th>
              </tr>
            </thead>
            <tbody>
              {dividends.map((d) => (
                <tr key={d.id} className="border-t border-gray-800 hover:bg-gray-800/30">
                  <td className="p-3">
                    <span className="text-[#C8A951] font-medium">{d.ticker}</span>
                    <p className="text-xs text-gray-400">{d.name}</p>
                  </td>
                  <td className="p-3 text-right text-white">
                    {new Date(d.ex_date).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-right text-white">{d.amount} {d.currency}</td>
                  <td className="p-3 text-right text-[#10B981]">{d.yield?.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Top Yield Ranking */}
      {topYield.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-white mb-4">Top Dividend Yield</h2>
          <div className="bg-[#111827] rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="text-left text-xs text-gray-400 font-medium p-3">#</th>
                  <th className="text-left text-xs text-gray-400 font-medium p-3">Company</th>
                  <th className="text-right text-xs text-gray-400 font-medium p-3">Yield</th>
                  <th className="text-right text-xs text-gray-400 font-medium p-3">Amount</th>
                </tr>
              </thead>
              <tbody>
                {topYield.map((d, i) => (
                  <tr key={d.ticker} className="border-t border-gray-800">
                    <td className="p-3 text-gray-400">{i + 1}</td>
                    <td className="p-3">
                      <span className="text-[#C8A951] font-medium">{d.ticker}</span>
                      <p className="text-xs text-gray-400">{d.name}</p>
                    </td>
                    <td className="p-3 text-right text-[#10B981] font-medium">{d.yield?.toFixed(2)}%</td>
                    <td className="p-3 text-right text-white">{d.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-8 p-4 bg-gray-800/50 rounded-lg">
        <p className="text-xs text-gray-500 text-center">
          SŪQAI provides translated market data for informational purposes only. This is not investment advice.
        </p>
      </div>
    </div>
  );
}
