import Link from "next/link";

// Empty State Component
function EmptyState() {
  return (
    <div className="text-center py-12">
      <p className="text-gray-400">No news available</p>
    </div>
  );
}

export default async function NewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale } = await params;
  const { page } = await searchParams;
  const currentPage = parseInt(page || "1");
  const limit = 20;

  // This would fetch from news API - placeholder for now
  const news: any[] = [];
  const totalPages = 0;

  const title = locale === "ar" ? "الأخبار" : "News";

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">{title}</h1>
      </div>

      {/* News List */}
      {news.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          {news.map((article) => (
            <Link
              key={article.id}
              href={article.source_url || "#"}
              target="_blank"
              className="block bg-[#111827] rounded-lg p-4 hover:bg-gray-800/50 transition"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-white font-medium line-clamp-2">
                  {article.title_ar || article.title_en || "Untitled"}
                </h3>
                {article.sentiment && (
                  <span className={`text-xs px-2 py-1 rounded ${
                    article.sentiment === 'positive' ? 'bg-green-900 text-green-300' :
                    article.sentiment === 'negative' ? 'bg-red-900 text-red-300' :
                    'bg-gray-700 text-gray-300'
                  }`}>
                    {article.sentiment}
                  </span>
                )}
              </div>
              <div className="flex gap-4 text-xs text-gray-500">
                {article.source && <span>{article.source}</span>}
                {article.published_at && (
                  <span>{new Date(article.published_at).toLocaleDateString()}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {currentPage > 1 && (
            <Link
              href={`?page=${currentPage - 1}`}
              className="px-4 py-2 bg-[#111827] rounded hover:bg-gray-800"
            >
              Previous
            </Link>
          )}
          <span className="px-4 py-2 text-gray-400">
            Page {currentPage} of {totalPages}
          </span>
          {currentPage < totalPages && (
            <Link
              href={`?page=${currentPage + 1}`}
              className="px-4 py-2 bg-[#111827] rounded hover:bg-gray-800"
            >
              Next
            </Link>
          )}
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
