// Empty State
function EmptyState() {
  return (
    <div className="text-center py-12">
      <p className="text-gray-400">No upcoming IPOs</p>
    </div>
  );
}

export default async function IPOpage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const title = locale === "ar" ? "الاكتتابات" : "IPO Tracker";

  // This would fetch from ipos table - placeholder
  const ipos: any[] = [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="text-gray-400 text-sm mt-1">
          {locale === "ar" ? "اكتتابات شركة السوق المالية" : "Tadawul IPO offerings"}
        </p>
      </div>

      {/* IPOs Table */}
      {ipos.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="bg-[#111827] rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="text-left text-xs text-gray-400 font-medium p-3">Company</th>
                <th className="text-left text-xs text-gray-400 font-medium p-3">Sector</th>
                <th className="text-right text-xs text-gray-400 font-medium p-3">Expected Date</th>
                <th className="text-center text-xs text-gray-400 font-medium p-3">Status</th>
                <th className="text-right text-xs text-gray-400 font-medium p-3">Price Range</th>
              </tr>
            </thead>
            <tbody>
              {ipos.map((ipo) => (
                <tr key={ipo.id} className="border-t border-gray-800 hover:bg-gray-800/30">
                  <td className="p-3">
                    <span className="text-white font-medium">{ipo.name_en}</span>
                    <p className="text-xs text-gray-400">{ipo.name_ar}</p>
                  </td>
                  <td className="p-3 text-gray-400">{ipo.sector}</td>
                  <td className="p-3 text-right text-white">
                    {ipo.expected_date ? new Date(ipo.expected_date).toLocaleDateString() : '--'}
                  </td>
                  <td className="p-3 text-center">
                    <span className={`text-xs px-2 py-1 rounded ${
                      ipo.status === 'upcoming' ? 'bg-blue-900 text-blue-300' :
                      ipo.status === 'open' ? 'bg-green-900 text-green-300' :
                      ipo.status === 'closed' ? 'bg-gray-700 text-gray-300' :
                      'bg-yellow-900 text-yellow-300'
                    }`}>
                      {ipo.status}
                    </span>
                  </td>
                  <td className="p-3 text-right text-gray-400">
                    {ipo.price_min && ipo.price_max 
                      ? `${ipo.price_min} - ${ipo.price_max}` 
                      : '--'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
