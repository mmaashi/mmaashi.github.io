import { createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Newspaper } from "lucide-react";
import { t } from "@/lib/i18n";

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

  function timeAgo(d: string) {
    const h = Math.floor((Date.now() - new Date(d).getTime()) / 3600000);
    if (h < 1) return locale === "ar" ? "الآن" : "Just now";
    if (h < 24) return locale === "ar" ? `${h} س` : `${h}h ago`;
    const days = Math.floor(h / 24);
    if (days < 30) return locale === "ar" ? `${days} ي` : new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return new Date(d).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", { month: "short", day: "numeric" });
  }

  return (
    <div className="page-wrap" style={{ maxWidth: 900 }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
             style={{ background: "var(--c-gold-dim)", border: "1px solid var(--c-gold-ring)" }}>
          <Newspaper size={16} style={{ color: "var(--c-gold)" }} />
        </div>
        <div>
          <h1 className="font-bold text-xl" style={{ color: "var(--c-text)", fontFamily: "var(--font-grotesk)" }}>
            {t(locale, "news.title")}
          </h1>
          <p style={{ fontSize: 12, color: "var(--c-muted)" }}>
            {t(locale, "news.subtitle")}
          </p>
        </div>
      </div>

      {!articles?.length ? (
        <div className="card" style={{ padding: "64px 0", textAlign: "center" }}>
          <p style={{ color: "var(--c-muted)" }}>{locale === "ar" ? "لا توجد أخبار متاحة" : "No news available yet"}</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {articles.map((a) => {
            const title = locale === "ar" && a.title_ar ? a.title_ar : a.title_en;
            const body  = locale === "ar" && a.body_ar  ? a.body_ar  : a.body_en;
            const score = a.sentiment_score;
            const sentiment = score === null ? null : score > 0.2 ? "up" : score < -0.2 ? "down" : "neutral";

            return (
              <Link key={a.id} href={`/${locale}/news/${a.id}`}
                 className="card group"
                 style={{ padding: "16px 18px", display: "block", textDecoration: "none" }}>
                <div className="flex items-start justify-between gap-4">
                  <div style={{ flex: 1 }}>
                    <p className="font-semibold leading-snug group-hover:text-white transition-colors"
                       style={{ color: "var(--c-text)", fontSize: 14, lineHeight: 1.5,
                                display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {title || (locale === "ar" ? "غير معنون" : "Untitled")}
                    </p>
                    {body && (
                      <p style={{ color: "var(--c-muted)", fontSize: 12, marginTop: 4, lineHeight: 1.6,
                                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {body}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      {a.source && (
                        <span className="badge badge-neutral" style={{ fontSize: 10 }}>{a.source}</span>
                      )}
                      {sentiment && (
                        <span className={`badge ${sentiment === "up" ? "badge-up" : sentiment === "down" ? "badge-down" : "badge-neutral"}`}
                              style={{ fontSize: 10 }}>
                          {sentiment === "up"
                            ? t(locale, "news.positive")
                            : sentiment === "down"
                            ? t(locale, "news.negative")
                            : t(locale, "news.neutral")}
                        </span>
                      )}
                      {a.published_at && (
                        <span style={{ fontSize: 11, color: "var(--c-dim)" }}>{timeAgo(a.published_at)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-8">
          {currentPage > 1 && (
            <Link href={`?page=${currentPage - 1}`}
                  className="badge badge-neutral" style={{ padding: "6px 14px", fontSize: 12 }}>
              {locale === "ar" ? "→ السابق" : "← Previous"}
            </Link>
          )}
          <span style={{ fontSize: 12, color: "var(--c-muted)" }}>
            {currentPage} / {totalPages}
          </span>
          {currentPage < totalPages && (
            <Link href={`?page=${currentPage + 1}`}
                  className="badge badge-neutral" style={{ padding: "6px 14px", fontSize: 12 }}>
              {locale === "ar" ? "← التالي" : "Next →"}
            </Link>
          )}
        </div>
      )}

      <hr className="gradient-line my-8" />
      <p style={{ fontSize: 11, color: "var(--c-dim)", textAlign: "center" }}>
        {t(locale, "common.disclaimer")}
      </p>
    </div>
  );
}
