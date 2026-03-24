import { createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft, Newspaper, Clock, TrendingUp, TrendingDown, Minus, ExternalLink, Building2 } from "lucide-react";
import { notFound } from "next/navigation";
import { t } from "@/lib/i18n";
import { decodeHtml } from "@/lib/decode-html";

export default async function NewsArticlePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const isAr = locale === "ar";
  const supabase = createServiceClient();

  const { data: article } = await supabase
    .from("news")
    .select("id, title_en, title_ar, body_en, body_ar, source, source_url, published_at, sentiment_score, company_id, companies(ticker, name_en, name_ar)")
    .eq("id", id)
    .single();

  if (!article) return notFound();

  const rawTitle = isAr && article.title_ar ? article.title_ar : article.title_en;
  const title = decodeHtml(rawTitle);
  const rawBody = isAr && article.body_ar ? article.body_ar : article.body_en;
  const body = decodeHtml(rawBody);
  const score = article.sentiment_score;
  const sentiment = score === null ? null : score > 0.2 ? "up" : score < -0.2 ? "down" : "neutral";
  const company = (article as any).companies;

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString(isAr ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="page-wrap" style={{ maxWidth: 760 }}>
      {/* Back link */}
      <Link
        href={`/${locale}/news`}
        className="inline-flex items-center gap-2 mb-6 text-sm font-semibold transition-colors hover:text-white"
        style={{ color: "var(--c-gold)", textDecoration: "none" }}
      >
        <ArrowLeft size={14} />
        {t(locale, "news.back")}
      </Link>

      {/* Article card */}
      <article className="card" style={{ padding: "28px 32px" }}>
        {/* Meta row */}
        <div className="flex items-center gap-3 flex-wrap mb-4">
          {article.source && (
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 4,
              background: "var(--c-gold-dim)", color: "var(--c-gold)", border: "1px solid var(--c-gold-ring)",
              textTransform: "capitalize",
            }}>
              {article.source}
            </span>
          )}
          {company && (
            <Link
              href={`/${locale}/stock/${company.ticker}`}
              style={{
                fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 4,
                background: "rgba(14,203,129,0.08)", color: "var(--c-green)",
                border: "1px solid rgba(14,203,129,0.2)",
                textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4,
              }}
            >
              <Building2 size={10} />
              <span className="font-num">{company.ticker}</span>
              {isAr && company.name_ar ? company.name_ar : company.name_en}
            </Link>
          )}
          {sentiment && (
            <span
              className={`badge ${sentiment === "up" ? "badge-up" : sentiment === "down" ? "badge-down" : "badge-neutral"}`}
              style={{ fontSize: 11 }}
            >
              {sentiment === "up" ? (
                <><TrendingUp size={11} /> {t(locale, "news.positive")}</>
              ) : sentiment === "down" ? (
                <><TrendingDown size={11} /> {t(locale, "news.negative")}</>
              ) : (
                <><Minus size={11} /> {t(locale, "news.neutral")}</>
              )}
            </span>
          )}
          {article.published_at && (
            <span className="flex items-center gap-1" style={{ fontSize: 12, color: "var(--c-muted)" }}>
              <Clock size={11} />
              {formatDate(article.published_at)}
            </span>
          )}
        </div>

        {/* Title */}
        <h1
          className="font-bold leading-snug mb-6"
          style={{
            fontSize: 24,
            color: "var(--c-text)",
            fontFamily: isAr ? "var(--font-arabic)" : "var(--font-grotesk)",
          }}
        >
          {title || "Untitled"}
        </h1>

        <hr className="gradient-line mb-6" />

        {/* Body */}
        {body ? (
          <div
            style={{
              color: "var(--c-text-sm)",
              fontSize: 15,
              lineHeight: 1.85,
              whiteSpace: "pre-wrap",
              fontFamily: isAr ? "var(--font-arabic)" : undefined,
            }}
          >
            {body}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <p style={{ color: "var(--c-muted)", fontSize: 14, marginBottom: 16 }}>
              {isAr
                ? "محتوى المقال غير متاح حالياً. يمكنك قراءة الخبر الكامل من المصدر."
                : "Article content is not available. You can read the full article from the source."}
            </p>
            {article.source_url && (
              <a
                href={article.source_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "10px 20px",
                  borderRadius: 8,
                  background: "var(--c-gold)",
                  color: "#000",
                  fontWeight: 700,
                  fontSize: 13,
                  textDecoration: "none",
                  transition: "opacity 0.15s",
                }}
              >
                <ExternalLink size={13} />
                {isAr ? "اقرأ من المصدر" : "Read from source"}
              </a>
            )}
          </div>
        )}

        {/* Source attribution */}
        {article.source && (
          <div className="mt-8 pt-4" style={{ borderTop: "1px solid var(--c-border)" }}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <p style={{ fontSize: 12, color: "var(--c-dim)" }}>
                {t(locale, "news.source")}: <span style={{ color: "var(--c-muted)", textTransform: "capitalize" }}>{article.source}</span>
              </p>
              {article.source_url && (
                <a
                  href={article.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1"
                  style={{ fontSize: 12, color: "var(--c-gold)", textDecoration: "none" }}
                >
                  <ExternalLink size={11} />
                  {isAr ? "المصدر الأصلي" : "Original source"}
                </a>
              )}
            </div>
          </div>
        )}
      </article>

      {/* Disclaimer */}
      <hr className="gradient-line my-8" />
      <p style={{ fontSize: 11, color: "var(--c-dim)", textAlign: "center" }}>
        {t(locale, "common.disclaimer")}
      </p>
    </div>
  );
}
