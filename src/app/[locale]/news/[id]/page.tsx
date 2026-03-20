import { createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft, Newspaper, Clock, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { notFound } from "next/navigation";
import { t } from "@/lib/i18n";

export default async function NewsArticlePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const supabase = createServiceClient();

  const { data: article } = await supabase
    .from("news")
    .select("id, title_en, title_ar, body_en, body_ar, source, source_url, published_at, sentiment_score")
    .eq("id", id)
    .single();

  if (!article) return notFound();

  const title = locale === "ar" && article.title_ar ? article.title_ar : article.title_en;
  const body = locale === "ar" && article.body_ar ? article.body_ar : article.body_en;
  const score = article.sentiment_score;
  const sentiment = score === null ? null : score > 0.2 ? "up" : score < -0.2 ? "down" : "neutral";

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
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
            <span className="badge badge-neutral" style={{ fontSize: 11 }}>{article.source}</span>
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
            fontFamily: locale === "ar" ? "var(--font-arabic)" : "var(--font-grotesk)",
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
            }}
          >
            {body}
          </div>
        ) : (
          <p style={{ color: "var(--c-muted)", fontSize: 14 }}>
            {t(locale, "news.no_content")}
          </p>
        )}

        {/* Source attribution */}
        {article.source && (
          <div className="mt-8 pt-4" style={{ borderTop: "1px solid var(--c-border)" }}>
            <p style={{ fontSize: 12, color: "var(--c-dim)" }}>
              {t(locale, "news.source")}: <span style={{ color: "var(--c-muted)" }}>{article.source}</span>
              {" · "}
              {t(locale, "news.translated")}
            </p>
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
