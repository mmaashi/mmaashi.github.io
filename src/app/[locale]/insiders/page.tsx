import { createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Users } from "lucide-react";
import { t } from "@/lib/i18n";


interface OwnershipRecord {
  id: string;
  ticker: string;
  owner_name_en: string;
  owner_name_ar: string;
  ownership_percent: number;
  previous_percent: number;
  change_percent: number;
  report_date: string;
  owner_type: string;
  company_id?: string;
}

interface OwnershipCard extends OwnershipRecord {
  company_name_en: string;
  company_name_ar: string;
}

export default async function InsidersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isAr = locale === "ar";
  const supabase = createServiceClient();

  // Fetch recent ownership changes
  const { data: ownership } = await supabase
    .from("ownership")
    .select("*")
    .order("report_date", { ascending: false })
    .limit(200);

  // Fetch company names for enrichment
  const { data: companies } = await supabase
    .from("companies")
    .select("id, ticker, name_en, name_ar");

  // Create company lookup map
  const companyMap = new Map<string, { name_en: string; name_ar: string }>();
  if (companies) {
    for (const company of companies) {
      companyMap.set(company.ticker, {
        name_en: company.name_en || "",
        name_ar: company.name_ar || company.name_en || "",
      });
    }
  }

  // Enrich ownership data with company names
  const enrichedOwnership: OwnershipCard[] = [];
  if (ownership) {
    for (const item of ownership) {
      const company = companyMap.get(item.ticker) || {
        name_en: "",
        name_ar: "",
      };
      enrichedOwnership.push({
        ...item,
        company_name_en: company.name_en,
        company_name_ar: company.name_ar,
      });
    }
  }

  // Group by owner type
  const groupedByType = new Map<string, OwnershipCard[]>();
  const ownerTypes = ["board", "major", "government"];

  for (const record of enrichedOwnership) {
    const type = record.owner_type?.toLowerCase() || "major";
    const normalizedType = ownerTypes.find(
      (t) => type.includes(t) || type.startsWith(t[0])
    ) || "major";

    if (!groupedByType.has(normalizedType)) {
      groupedByType.set(normalizedType, []);
    }
    groupedByType.get(normalizedType)!.push(record);
  }

  // Format date helper
  function formatDate(dateStr: string): string {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  // Get display name for owner type
  function getOwnerTypeLabel(type: string): string {
    switch (type.toLowerCase()) {
      case "board":
        return t(locale, "insiders.board");
      case "government":
        return t(locale, "insiders.government");
      case "major":
      default:
        return t(locale, "insiders.major");
    }
  }

  // Get color for direction
  function getDirectionColor(changePercent: number): string {
    return changePercent > 0 ? "var(--c-green)" : "var(--c-red)";
  }

  // Get direction label
  function getDirectionLabel(changePercent: number): string {
    return changePercent > 0
      ? t(locale, "insiders.increased")
      : t(locale, "insiders.decreased");
  }

  return (
    <div className="page-wrap">
      <style>{`
        .insider-filter:hover { border-color: var(--c-gold) !important; color: var(--c-gold) !important; }
        .insider-card:hover { border-color: var(--c-gold) !important; box-shadow: 0 0 0 1px var(--c-gold-dim); background: rgba(200,169,81,0.02) !important; }
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
          <Users size={18} style={{ color: "var(--c-gold)" }} />
        </div>
        <div>
          <h1
            className="font-bold text-2xl"
            style={{
              color: "var(--c-text)",
              fontFamily: "var(--font-grotesk)",
            }}
          >
            {t(locale, "insiders.title")}
          </h1>
          <p style={{ fontSize: 13, color: "var(--c-muted)", marginTop: 4 }}>
            {t(locale, "insiders.subtitle")}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 32,
          flexWrap: "wrap",
        }}
      >
        {["all", "board", "major", "government"].map((filter) => {
          const label =
            filter === "all"
              ? t(locale, "insiders.all")
              : getOwnerTypeLabel(filter);

          return (
            <div
              key={filter}
              className="insider-filter"
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                background: "var(--c-surface)",
                border: "1px solid var(--c-border)",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--c-muted)",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {label}
            </div>
          );
        })}
      </div>

      {/* Ownership Cards */}
      {enrichedOwnership.length === 0 ? (
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
            {t(locale, "insiders.no_data")}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 16,
          }}
        >
          {enrichedOwnership.map((record) => {
            const companyName = isAr
              ? record.company_name_ar || record.company_name_en
              : record.company_name_en;
            const ownerName = isAr
              ? record.owner_name_ar || record.owner_name_en
              : record.owner_name_en;
            const directionColor = getDirectionColor(record.change_percent);
            const isIncrease = record.change_percent > 0;
            const arrow = isIncrease ? "↑" : "↓";

            return (
              <div
                key={record.id}
                className="insider-card"
                style={{
                  background: "var(--c-surface)",
                  border: "1px solid var(--c-border)",
                  borderRadius: "var(--radius-md)",
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  transition: "all 0.2s ease-out",
                  cursor: "pointer",
                }}
              >
                {/* Top: Ticker + Company Name */}
                <Link href={`/${locale}/stock/${record.ticker}`}>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "var(--c-text)",
                        fontFamily: "var(--font-grotesk)",
                      }}
                      className="ticker-tag"
                    >
                      {record.ticker}
                    </div>
                    <p
                      style={{
                        fontSize: 12,
                        color: "var(--c-muted)",
                        marginTop: 2,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {companyName}
                    </p>
                  </div>
                </Link>

                {/* Owner Type Badge */}
                <div
                  style={{
                    display: "inline-flex",
                    padding: "4px 10px",
                    borderRadius: 6,
                    background: "var(--c-gold-dim)",
                    border: "1px solid var(--c-gold-ring)",
                    width: "fit-content",
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--c-gold)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {getOwnerTypeLabel(record.owner_type)}
                  </span>
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: "var(--c-border)" }} />

                {/* Owner Info */}
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--c-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: 6,
                    }}
                  >
                    Owner
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--c-text)",
                      wordBreak: "break-word",
                    }}
                  >
                    {ownerName}
                  </div>
                </div>

                {/* Change Display */}
                <div
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    background: isIncrease
                      ? "rgba(14, 203, 129, 0.08)"
                      : "rgba(255, 67, 54, 0.08)",
                    border: isIncrease
                      ? "1px solid rgba(14, 203, 129, 0.2)"
                      : "1px solid rgba(255, 67, 54, 0.2)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 20,
                        fontWeight: 700,
                        color: directionColor,
                      }}
                    >
                      {arrow}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: directionColor,
                        textTransform: "uppercase",
                      }}
                    >
                      {getDirectionLabel(record.change_percent)}
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: directionColor,
                      fontFamily: "var(--font-grotesk)",
                    }}
                  >
                    {Math.abs(record.change_percent).toFixed(2)}%
                  </div>

                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--c-muted)",
                      marginTop: 6,
                    }}
                  >
                    <div>
                      {t(locale, "insiders.board")}: {record.ownership_percent.toFixed(2)}%
                    </div>
                    <div style={{ marginTop: 3 }}>
                      {t(locale, "common.na")}: {record.previous_percent.toFixed(2)}%
                    </div>
                  </div>
                </div>

                {/* Report Date */}
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--c-muted)",
                    borderTop: "1px solid var(--c-border)",
                    paddingTop: 12,
                  }}
                >
                  {formatDate(record.report_date)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
