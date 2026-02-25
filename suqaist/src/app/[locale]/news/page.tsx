import { createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";

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
  const offset = (currentPage - 1) * limit;

  const supabase = createServiceClient();

  const { data: articles, count } = await supabase
    .from("news")
    .select("id, title_en, title_ar, body_en, body_ar, source, source_url, published_at, sentiment_score", { count: "exact" })
    .order("published_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const totalPages = Math.ceil((count || 0) / limit);
  const title = locale === "ar" ? "الأخبار المالية" : "Financial News";
  const subtitle =
    locale === "ar"
      ? "آخر أخبار السوق السعودي"
      : "Latest Saudi market news";

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 1) return "Just now";
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 30) return `${d}d ago`;
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  function sentimentBadge(score: number | null) {
    if (score === null) return null;
    if (score > 0.2) return { label: "Positive", cls: "bg-emerald-900/40 text-emerald-400 border border-emerald-800/50" };
    if (score < -0.2) return { label: "Negative", cls: "bg-red-900/40 text-red-400 border border-red-800/50" };
    return { label: "Neutral", cls: "bg-gray-800 text-gray-400 border border-gray-700" };
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="text-gray-400 text-sm mt-1">{subtitle}</p>
      </div>

      {/* News List */}
      {!articles?.length ? (
        <div className="text-center py-16 bg-[#111827] rounded-xl border border-gray-800">
          <p className="text-gray-500">No news available yet</p>
          <p className="text-gray-600 text-sm mt-1">Check back soon — news updates hourly</p>
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map((article) => {
            const title = locale === "ar" && article.title_ar ? article.title_ar : article.title_en;
            const body = locale === "ar" && article.body_ar ? article.body_ar : article.body_en;
            const badge = sentimentBadge(article.sentiment_score);

            return (
              <a
                key={article.id}
                href={article.source_url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-[#111827] rounded-xl p-4 border border-gray-800 hover:border-gray-700 hover:bg-[#141f33] transition group"
              >
                <div className="flex justify-between items-start gap-3 mb-2">
                  <h3 className="text-white font-medium text-sm leading-snug group-hover:text-[#C8A951] transition line-clamp-2">
                    {title || "Untitled"}
                  </h3>
                  {badge && (
                    <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${badge.cls}`}>
                      {badge.label}
                    </span>
                  )}
                </div>
                {body && (
                  <p className="text-gray-400 text-xs leading-relaxed line-clamp-2 mb-2">
                    {body}
                  </p>
                )}
                <div className="flex gap-3 text-xs text-gray-500">
                  {article.source && (
                    <span className="capitalize bg-gray-800 px-2 py-0.5 rounded">
                      {article.source}
                    </span>
                  )}
                  {article.published_at && <span>{timeAgo(article.published_at)}</span>}
                  <span className="ml-auto text-gray-600 group-hover:text-gray-400 transition">
                    Read →
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-8">
          {currentPage > 1 && (
            <Link
              href={`?page=${currentPage - 1}`}
              className="px-4 py-2 bg-[#111827] border border-gray-800 rounded-lg text-sm text-white hover:border-gray-600 transition"
            >
              ← Previous
            </Link>
          )}
          <span className="px-4 py-2 text-gray-400 text-sm">
            Page {currentPage} of {totalPages}
          </span>
          {currentPage < totalPages && (
            <Link
              href={`?page=${currentPage + 1}`}
              className="px-4 py-2 bg-[#111827] border border-gray-800 rounded-lg text-sm text-white hover:border-gray-600 transition"
            >
              Next →
            </Link>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-8 p-4 bg-gray-800/50 rounded-lg">
        <p className="text-xs text-gray-500 text-center">
          SŪQAI provides translated market data for informational purposes only. This is not
          investment advice.
        </p>
      </div>
    </div>
  );
}
