import { createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Newspaper, ExternalLink, TrendingUp, TrendingDown, Building2, Tag } from "lucide-react";
import { t } from "@/lib/i18n";
import { decodeHtml } from "@/lib/decode-html";

export const revalidate = 900;

/* ── helper: group articles by date ── */
function groupByDate(articles: any[], locale: string) {
  const groups: Record<string, any[]> = {};
  for (const a of articles) {
    const d = new Date(a.published_at);
    const key = d.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    (groups[key] ??= []).push(a);
  }
  return Object.entries(groups);
}

export default async function NewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; source?: string }>;
}) {
  const { locale } = await params;
  const { page, source } = await searchParams;
  const isAr = locale === "ar";
  const currentPage = parseInt(page || "1");
  const limit = 30;
  const offset = (currentPage - 1) * limit;

  const supabase = createServiceClient();

  // Build query with optional source filter
  let query = supabase
    .from("news")
    .select(
      "id, title_en, title_ar, body_en, body_ar, source, source_url, published_at, sentiment_score, company_id, companies(ticker, name_en, name_ar)",
      { count: "exact" }
    )
    .order("published_at", { ascending: false });

  if (source) {
    query = query.eq("source", source);
  }

  const { data: articles, count } = await query.range(offset, offset + limit - 1);

  const totalPages = Math.ceil((count || 0) / limit);

  // Get unique sources for filter pills
  const { data: sourcesData } = await supabase
    .from("news")
    .select("source")
    .not("source", "is", null);
  const allSources = [...new Set((sourcesData || []).map((s: any) => s.source).filter(Boolean))].sort();

  const dateGroups = groupByDate(articles || [], locale);

  const sourceLabels: Record<string, string> = {
    mubasher: "Mubasher",
    argaam: "Argaam",
    cma: isAr ? "هيئة السوق" : "CMA",
  };

  function timeAgo(d: string) {
    const h = Math.floor((Date.now() - new Date(d).getTime()) / 3600000);
    if (h < 1) return isAr ? "الآن" : "Just now";
    if (h < 24) return isAr ? `منذ ${h} ساعة` : `${h}h ago`;
    const days = Math.floor(h / 24);
    if (days === 1) return isAr ? "أمس" : "Yesterday";
    if (days < 7) return isAr ? `منذ ${days} أيام` : `${days}d ago`;
    return new Date(d).toLocaleDateString(isAr ? "ar-SA" : "en-US", {
      month: "short",
      day: "numeric",
    });
  }

  return (
    <div className="page-wrap" style={{ maxWidth: 900 }}>
      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            background: "var(--c-gold-dim)",
            border: "1px solid var(--c-gold-ring)",
          }}
        >
          <Newspaper size={18} style={{ color: "var(--c-gold)" }} />
        </div>
        <div>
          <h1
            className="font-bold text-xl"
            style={{
              color: "var(--c-text)",
              fontFamily: isAr ? "var(--font-arabic)" : "var(--font-grotesk)",
            }}
          >
            {isAr ? "آخر أخبار السوق" : "Market News"}
          </h1>
          <p style={{ fontSize: 12, color: "var(--c-muted)" }}>
            {isAr
              ? `${count || 0} خبر من مصادر السوق السعودي`
              : `${count || 0} articles from Saudi market sources`}
          </p>
        </div>
      </div>

      {/* ── Source filter pills ── */}
      {allSources.length > 1 && (
        <div className="flex items-center gap-2 mt-4 mb-5 flex-wrap">
          <Link
            href={`/${locale}/news`}
            style={{
              fontSize: 12,
              fontWeight: 600,
              padding: "5px 14px",
              borderRadius: 20,
              textDecoration: "none",
              transition: "all 0.15s",
              background: !source ? "var(--c-gold)" : "var(--c-elevated)",
              color: !source ? "#000" : "var(--c-muted)",
              border: `1px solid ${!source ? "var(--c-gold)" : "var(--c-border)"}`,
            }}
          >
            {isAr ? "الكل" : "All"}
          </Link>
          {allSources.map((s: string) => (
            <Link
              key={s}
              href={`/${locale}/news?source=${s}`}
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: "5px 14px",
                borderRadius: 20,
                textDecoration: "none",
                transition: "all 0.15s",
                background: source === s ? "var(--c-gold)" : "var(--c-elevated)",
                color: source === s ? "#000" : "var(--c-muted)",
                border: `1px solid ${source === s ? "var(--c-gold)" : "var(--c-border)"}`,
              }}
            >
              {sourceLabels[s] || s}
            </Link>
          ))}
        </div>
      )}

      {/* ── Articles grouped by date ── */}
      {!articles?.length ? (
        <div
          className="card"
          style={{ padding: "64px 0", textAlign: "center" }}
        >
          <Newspaper
            size={28}
            style={{ color: "var(--c-dim)", margin: "0 auto 12px" }}
          />
          <p style={{ color: "var(--c-muted)", fontSize: 14 }}>
            {isAr ? "لا توجد أخبار متاحة" : "No news available"}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {dateGroups.map(([dateLabel, items]) => (
            <div key={dateLabel}>
              {/* Date header */}
              <div
                className="flex items-center gap-3 mb-3"
                style={{ paddingInlineStart: 2 }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "var(--c-gold)",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--c-text)",
                    fontFamily: isAr
                      ? "var(--font-arabic)"
                      : "var(--font-grotesk)",
                  }}
                >
                  {dateLabel}
                </span>
                <span
                  className="font-num"
                  style={{ fontSize: 11, color: "var(--c-dim)" }}
                >
                  ({items.length})
                </span>
              </div>

              {/* Articles for this date */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                {items.map((a: any) => {
                  const rawTitle =
                    isAr && a.title_ar ? a.title_ar : a.title_en;
                  const title = decodeHtml(rawTitle);
                  const rawBody =
                    isAr && a.body_ar ? a.body_ar : a.body_en;
                  const body = decodeHtml(rawBody);
                  const score = a.sentiment_score;
                  const sentiment =
                    score === null
                      ? null
                      : score > 0.2
                        ? "up"
                        : score < -0.2
                          ? "down"
                          : "neutral";
                  const company = a.companies;
                  const companyName = company
                    ? isAr && company.name_ar
                      ? company.name_ar
                      : company.name_en
                    : null;

                  return (
                    <a
                      key={a.id}
                      href={a.source_url || `/${locale}/news/${a.id}`}
                      target={a.source_url ? "_blank" : undefined}
                      rel={
                        a.source_url
                          ? "noopener noreferrer"
                          : undefined
                      }
                      style={{
                        textDecoration: "none",
                        display: "block",
                        padding: "14px 18px",
                        borderRadius: 12,
                        background: "var(--c-surface)",
                        border: "1px solid var(--c-border)",
                        transition:
                          "border-color 0.15s, background 0.15s",
                      }}
                    >
                      <div className="flex items-start gap-3">
                        {/* Sentiment bar */}
                        <div
                          style={{
                            width: 3,
                            borderRadius: 2,
                            flexShrink: 0,
                            alignSelf: "stretch",
                            minHeight: 36,
                            background:
                              sentiment === "up"
                                ? "var(--c-green)"
                                : sentiment === "down"
                                  ? "var(--c-red)"
                                  : "var(--c-border)",
                          }}
                        />

                        <div style={{ flex: 1, minWidth: 0 }}>
                          {/* Title */}
                          <p
                            style={{
                              fontSize: 14,
                              color: "var(--c-text)",
                              fontWeight: 600,
                              lineHeight: 1.6,
                              marginBottom: body ? 4 : 8,
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              fontFamily: isAr
                                ? "var(--font-arabic)"
                                : undefined,
                            }}
                          >
                            {title || (isAr ? "بدون عنوان" : "Untitled")}
                          </p>

                          {/* Body snippet */}
                          {body && (
                            <p
                              style={{
                                fontSize: 12,
                                color: "var(--c-muted)",
                                lineHeight: 1.7,
                                marginBottom: 8,
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              {body}
                            </p>
                          )}

                          {/* Meta row */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Source badge */}
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                padding: "2px 8px",
                                borderRadius: 4,
                                background: "var(--c-gold-dim)",
                                color: "var(--c-gold)",
                                border: "1px solid var(--c-gold-ring)",
                                textTransform: "capitalize",
                              }}
                            >
                              {sourceLabels[a.source] || a.source}
                            </span>

                            {/* Company tag */}
                            {company && (
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 600,
                                  padding: "2px 8px",
                                  borderRadius: 4,
                                  background: "rgba(14,203,129,0.08)",
                                  color: "var(--c-green)",
                                  border:
                                    "1px solid rgba(14,203,129,0.2)",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 3,
                                }}
                              >
                                <span className="font-num">
                                  {company.ticker}
                                </span>
                                {companyName && (
                                  <span
                                    style={{
                                      opacity: 0.8,
                                      maxWidth: 100,
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {companyName}
                                  </span>
                                )}
                              </span>
                            )}

                            {/* Sentiment */}
                            {sentiment &&
                              sentiment !== "neutral" && (
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    padding: "2px 6px",
                                    borderRadius: 4,
                                    background:
                                      sentiment === "up"
                                        ? "rgba(14,203,129,0.1)"
                                        : "rgba(234,57,67,0.1)",
                                    color:
                                      sentiment === "up"
                                        ? "var(--c-green)"
                                        : "var(--c-red)",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 2,
                                  }}
                                >
                                  {sentiment === "up" ? (
                                    <TrendingUp size={9} />
                                  ) : (
                                    <TrendingDown size={9} />
                                  )}
                                  {sentiment === "up"
                                    ? t(locale, "news.positive")
                                    : t(locale, "news.negative")}
                                </span>
                              )}

                            {/* Time */}
                            <span
                              className="font-num"
                              style={{
                                fontSize: 11,
                                color: "var(--c-dim)",
                                marginInlineStart: "auto",
                              }}
                            >
                              {timeAgo(a.published_at)}
                            </span>

                            {a.source_url && (
                              <ExternalLink
                                size={11}
                                style={{ color: "var(--c-dim)" }}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-8">
          {currentPage > 1 && (
            <Link
              href={`/${locale}/news?page=${currentPage - 1}${source ? `&source=${source}` : ""}`}
              className="badge badge-neutral"
              style={{ padding: "6px 14px", fontSize: 12 }}
            >
              {isAr ? "→ السابق" : "← Previous"}
            </Link>
          )}
          <span
            className="font-num"
            style={{ fontSize: 12, color: "var(--c-muted)" }}
          >
            {currentPage} / {totalPages}
          </span>
          {currentPage < totalPages && (
            <Link
              href={`/${locale}/news?page=${currentPage + 1}${source ? `&source=${source}` : ""}`}
              className="badge badge-neutral"
              style={{ padding: "6px 14px", fontSize: 12 }}
            >
              {isAr ? "← التالي" : "Next →"}
            </Link>
          )}
        </div>
      )}

      {/* ── Source attribution ── */}
      <div
        style={{
          marginTop: 32,
          padding: "12px 16px",
          borderRadius: 10,
          background: "var(--c-surface)",
          border: "1px solid var(--c-border)",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: 11, color: "var(--c-dim)" }}>
          {isAr
            ? "الأخبار من مصادر خارجية: مباشر، أرقام، هيئة السوق المالية. التحليل والملخصات من فريق تحرير SŪQAI."
            : "News sourced from: Mubasher, Argaam, CMA. Analysis & summaries by SŪQAI editorial team."}
        </p>
      </div>

      <hr className="gradient-line my-6" />
      <p style={{ fontSize: 11, color: "var(--c-dim)", textAlign: "center" }}>
        {t(locale, "common.disclaimer")}
      </p>
    </div>
  );
}
