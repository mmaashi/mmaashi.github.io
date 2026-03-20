import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get("q");

  // Return empty array if search query is empty or missing
  if (!q || q.trim() === "") {
    return NextResponse.json([]);
  }

  const supabase = createServiceClient();
  // Sanitize: remove characters that could interfere with PostgREST filter syntax
  const searchTerm = q.trim().replace(/[,().*\\]/g, "");

  if (!searchTerm) {
    return NextResponse.json([]);
  }

  try {
    // Get companies matching the search criteria
    const { data: companies, error: companiesError } = await supabase
      .from("companies")
      .select("id, ticker, name_en, name_ar, sector")
      .or(
        `ticker.ilike.${searchTerm}%,name_en.ilike.%${searchTerm}%,name_ar.ilike.%${searchTerm}%`
      )
      .limit(10);

    if (companiesError) {
      console.error("Companies query error:", companiesError);
      return NextResponse.json(
        { error: "Failed to search companies" },
        { status: 500 }
      );
    }

    if (!companies || companies.length === 0) {
      return NextResponse.json([]);
    }

    // Get the latest stock prices for these companies
    const companyIds = companies.map((c) => c.id);
    const { data: stockPrices, error: pricesError } = await supabase
      .from("stock_prices")
      .select("company_id, close, date")
      .in("company_id", companyIds)
      .order("date", { ascending: false });

    if (pricesError) {
      console.error("Stock prices query error:", pricesError);
      return NextResponse.json(
        { error: "Failed to fetch stock prices" },
        { status: 500 }
      );
    }

    // Map latest prices by company_id (first occurrence after sorting by date desc)
    const latestPricesByCompany = new Map<string, number>();
    if (stockPrices) {
      for (const price of stockPrices) {
        if (!latestPricesByCompany.has(price.company_id)) {
          latestPricesByCompany.set(price.company_id, price.close);
        }
      }
    }

    // Build response with latest prices
    const results = companies.map((company) => ({
      id: company.id,
      ticker: company.ticker,
      name_en: company.name_en,
      name_ar: company.name_ar,
      sector: company.sector,
      latest_price: latestPricesByCompany.get(company.id) || null,
    }));

    return NextResponse.json(results);
  } catch (error) {
    console.error("Search endpoint error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
