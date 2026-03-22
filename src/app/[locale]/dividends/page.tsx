import { createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";
import { CalendarDays, TrendingUp } from "lucide-react";
import { t } from "@/lib/i18n";

export default async function DividendsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isAr = locale === "ar";
  const supabase = createServiceClient();

  const today = new Date().toISOString().split("T")[0];

  const [upcomingResult, recentResult, companiesResult] = await Promise.allSettled([
    supabase
      .from("dividends")
      .select(
        "id, ticker, ex_date, payment_date, amount, currency, yield_percent, company_id"
      )
      .gte("ex_date", today)
      .order("ex_date", { ascending: true })
      .limit(50),
    supabase
      .from("dividends")
      .select(
        "id, ticker, ex_date, payment_date, amount, currency, yield_percent, company_id"
      )
      .lt("ex_date", today)
      .order("ex_date", { ascending: false })
      .limit(20),
    supabase
      .from("companies")
      .select("id, ticker, name_en, name_ar, sector"),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const upcoming: any[] =
    upcomingResult.status === "fulfilled" ? upcomingResult.value.data ?? [] : [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recent: any[] =
    recentResult.status === "fulfilled" ? recentResult.value.data ?? [] : [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const companies: any[] =
    companiesResult.status === "fulfilled"
      ? companiesResult.value.data ?? []
      : [];

  // Create company lookup map
  const companyMap = new Map<string, { name_en: string; name_ar: string }>();
  for (const company of companies) {
    companyMap.set(company.id, {
      name_en: company.name_en || "",
      name_ar: company.name_ar || company.name_en || "",
    });
  }

  // Enrich dividend data with company names
  const enrichUpcoming = upcoming.map((div) => {
    const company = companyMap.get(div.company_id);
    return {
      ...div,
      name_en: company?.name_en || "",
      name_ar: company?.name_ar || "",
    };
  });

  const enrichRecent = recent.map((div) => {
    const company = companyMap.get(div.company_id);
    return {
      ...div,
      name_en: company?.name_en || "",
      name_ar: company?.name_ar || "",
    };
  });

  // Group by month for timeline view
  interface MonthGroup {
    month: string;
    year: number;
    dividends: (typeof enrichUpcoming)[0][];
  }

  function groupByMonth(divs: typeof enrichUpcoming): MonthGroup[] {
    const groups = new Map<string, MonthGroup>();

    for (const div of divs) {
      const date = new Date(div.ex_date + "T00:00:00");
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const monthName = date.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
        month: "long",
        year: "numeric",
      });

      if (!groups.has(monthKey)) {
        groups.set(monthKey, {
          month: monthName,
          year: date.getFullYear(),
          dividends: [],
        });
      }
      groups.get(monthKey)!.dividends.push(div);
    }

    return Array.from(groups.values());
  }

  const upcomingMonths = groupByMonth(enrichUpcoming);

  // Format date helper
  function formatDate(dateStr: string): {
    month: string;
    day: string;
    monthShort: string;
  } {
    const date = new Date(dateStr + "T00:00:00");
    return {
      month: date.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
        month: "long",
      }),
      day: String(date.getDate()),
      monthShort: date.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
        month: "short",
      }),
    };
  }

  return (
    <div className="page-wrap">
      <style>{`
        .div-card:hover { border-color: var(--c-gold) !important; box-shadow: 0 0 0 1px var(--c-gold-dim); background: rgba(200,169,81,0.02) !important; }
        .div-tab:hover { border-color: var(--c-gold) !important; color: var(--c-gold) !important; }
      `}</style>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            background: "var(--c-gold-dim)",
            border: "1px solid var(--c-gold-ring)",
          }}
        >
          <CalendarDays size={18} style={{ color: "var(--c-gold)" }} />
        </div>
        <div>
          <h1
            className="font-bold text-2xl"
            style={{
              color: "var(--c-text)",
              fontFamily: "var(--font-grotesk)",
            }}
          >
            {t(locale, "dividends.title")}
          </h1>
          <p style={{ fontSize: 13, color: "var(--c-muted)", marginTop: 4 }}>
            {t(locale, "dividends.subtitle")}
          </p>
        </div>
      </div>

      {/* Upcoming Dividends Section */}
      <div style={{ marginBottom: 40 }}>
        <h2
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "var(--c-text)",
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <TrendingUp
            size={18}
            style={{ color: "var(--c-green)" }}
          />
          {t(locale, "dividends.upcoming")}
        </h2>

        {enrichUpcoming.length === 0 ? (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              background: "var(--c-surface)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--c-border)",
            }}
          >
            <p style={{ color: "var(--c-muted)", fontSize: 14 }}>
              {t(locale, "dividends.no_upcoming")}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {upcomingMonths.map((monthGroup, monthIdx) => (
              <div key={monthGroup.month}>
                {/* Month header */}
                {monthIdx > 0 && (
                  <div
                    style={{
                      height: 1,
                      background: "var(--c-border)",
                      margin: "16px 0",
                    }}
                  />
                )}
                <h3
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--c-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: 12,
                    marginTop: monthIdx > 0 ? 16 : 0,
                  }}
                >
                  {monthGroup.month}
                </h3>

                {/* Dividend cards for this month */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                    gap: 12,
                    marginBottom: 12,
                  }}
                >
                  {monthGroup.dividends.map((div) => {
                    const date = formatDate(div.ex_date);
                    const payDate = div.payment_date
                      ? formatDate(div.payment_date)
                      : null;
                    const name =
                      isAr && div.name_ar ? div.name_ar : div.name_en;

                    return (
                      <div
                        key={div.id}
                        className="div-card"
                        style={{
                          background: "var(--c-surface)",
                          border: "1px solid var(--c-border)",
                          borderRadius: "var(--radius-md)",
                          padding: 16,
                          display: "flex",
                          gap: 12,
                          alignItems: "flex-start",
                          transition: "all 0.2s ease-out",
                          cursor: "pointer",
                        }}
                      >
                        {/* Left: Date badge */}
                        <div
                          style={{
                            width: 60,
                            height: 60,
                            borderRadius: 12,
                            background: "linear-gradient(135deg, var(--c-gold-dim) 0%, rgba(200, 169, 81, 0.05) 100%)",
                            border: "1px solid var(--c-gold-ring)",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 600,
                              color: "var(--c-muted)",
                              textTransform: "uppercase",
                            }}
                          >
                            {date.monthShort}
                          </span>
                          <span
                            style={{
                              fontSize: 20,
                              fontWeight: 700,
                              color: "var(--c-gold)",
                            }}
                          >
                            {date.day}
                          </span>
                        </div>

                        {/* Center: Company and amount */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Link href={`/${locale}/stock/${div.ticker}`}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                marginBottom: 8,
                              }}
                            >
                              <div
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: 6,
                                  background: "var(--c-gold-dim)",
                                  border: "1px solid var(--c-gold-ring)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 8,
                                    fontWeight: 800,
                                    color: "var(--c-gold)",
                                  }}
                                >
                                  {div.ticker.slice(0, 3)}
                                </span>
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: "var(--c-text)",
                                  }}
                                  className="ticker-tag truncate"
                                >
                                  {div.ticker}
                                </div>
                                <p
                                  style={{
                                    fontSize: 11,
                                    color: "var(--c-muted)",
                                    marginTop: 2,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  {name}
                                </p>
                              </div>
                            </div>
                          </Link>

                          {/* Amount and payment date */}
                          <div style={{ fontSize: 11, color: "var(--c-muted)" }}>
                            <div style={{ marginTop: 6 }}>
                              <span style={{ fontWeight: 600 }}>
                                {Number(div.amount).toFixed(2)}
                              </span>{" "}
                              {div.currency}{" "}
                              {t(locale, "dividends.per_share")}
                            </div>
                            {payDate && (
                              <div style={{ marginTop: 4 }}>
                                {t(locale, "dividends.payment_date")}:{" "}
                                <span style={{ color: "var(--c-text)" }}>
                                  {payDate.monthShort} {payDate.day}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right: Yield */}
                        {div.yield_percent !== null && (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "flex-end",
                              gap: 4,
                              flexShrink: 0,
                            }}
                          >
                            <div
                              style={{
                                padding: "4px 10px",
                                borderRadius: 6,
                                background: "rgba(14, 203, 129, 0.1)",
                                border: "1px solid rgba(14, 203, 129, 0.3)",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 12,
                                  fontWeight: 700,
                                  color: "var(--c-green)",
                                  fontFamily: "var(--font-grotesk)",
                                }}
                              >
                                {Number(div.yield_percent).toFixed(2)}%
                              </span>
                            </div>
                            <span
                              style={{
                                fontSize: 9,
                                color: "var(--c-muted)",
                                fontWeight: 500,
                              }}
                            >
                              {isAr ? "العائد" : "Yield"}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Dividends Section */}
      {enrichRecent.length > 0 && (
        <div>
          <h2
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "var(--c-text)",
              marginBottom: 20,
            }}
          >
            {t(locale, "dividends.recent")}
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 12,
            }}
          >
            {enrichRecent.map((div) => {
              const date = formatDate(div.ex_date);
              const payDate = div.payment_date
                ? formatDate(div.payment_date)
                : null;
              const name = isAr && div.name_ar ? div.name_ar : div.name_en;

              return (
                <div
                  key={div.id}
                  style={{
                    background: "var(--c-surface)",
                    border: "1px solid var(--c-border)",
                    borderRadius: "var(--radius-md)",
                    padding: 16,
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                    opacity: 0.75,
                    transition: "all 0.2s ease-out",
                    cursor: "pointer",
                  }}
                  className="div-tab"
                >
                  {/* Left: Date badge (dimmed) */}
                  <div
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 12,
                      background:
                        "rgba(123, 148, 184, 0.08)",
                      border: "1px solid rgba(21, 34, 54, 0.5)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: "var(--c-muted)",
                        textTransform: "uppercase",
                      }}
                    >
                      {date.monthShort}
                    </span>
                    <span
                      style={{
                        fontSize: 20,
                        fontWeight: 700,
                        color: "var(--c-muted)",
                      }}
                    >
                      {date.day}
                    </span>
                  </div>

                  {/* Center: Company and amount */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link href={`/${locale}/stock/${div.ticker}`}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 8,
                        }}
                      >
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 6,
                            background: "var(--c-gold-dim)",
                            border: "1px solid var(--c-gold-ring)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 8,
                              fontWeight: 800,
                              color: "var(--c-gold)",
                            }}
                          >
                            {div.ticker.slice(0, 3)}
                          </span>
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: "var(--c-text)",
                            }}
                            className="ticker-tag truncate"
                          >
                            {div.ticker}
                          </div>
                          <p
                            style={{
                              fontSize: 11,
                              color: "var(--c-muted)",
                              marginTop: 2,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {name}
                          </p>
                        </div>
                      </div>
                    </Link>

                    {/* Amount and payment date */}
                    <div style={{ fontSize: 11, color: "var(--c-muted)" }}>
                      <div style={{ marginTop: 6 }}>
                        <span style={{ fontWeight: 600 }}>
                          {Number(div.amount).toFixed(2)}
                        </span>{" "}
                        {div.currency}{" "}
                        {t(locale, "dividends.per_share")}
                      </div>
                      {payDate && (
                        <div style={{ marginTop: 4 }}>
                          {t(locale, "dividends.payment_date")}:{" "}
                          <span style={{ color: "var(--c-text)" }}>
                            {payDate.monthShort} {payDate.day}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Yield */}
                  {div.yield_percent !== null && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: 4,
                        flexShrink: 0,
                      }}
                    >
                      <div
                        style={{
                          padding: "4px 10px",
                          borderRadius: 6,
                          background: "rgba(14, 203, 129, 0.05)",
                          border: "1px solid rgba(14, 203, 129, 0.2)",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: "var(--c-muted)",
                            fontFamily: "var(--font-grotesk)",
                          }}
                        >
                          {Number(div.yield_percent).toFixed(2)}%
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: 9,
                          color: "var(--c-muted)",
                          fontWeight: 500,
                        }}
                      >
                        Yield
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
