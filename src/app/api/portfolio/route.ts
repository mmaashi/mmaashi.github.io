import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id") || DEMO_USER_ID;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: portfolio, error: fetchError } = (await (supabase as any)
      .from("portfolios")
      .select("id, user_id, name, name_ar, base_currency, is_default, created_at, updated_at, portfolio_holdings (id, portfolio_id, company_id, ticker, quantity, average_cost, purchase_date, notes, created_at, updated_at)")
      .eq("user_id", userId)
      .eq("is_default", true)
      .single()) as { data: any; error: any };

    if (fetchError || !portfolio) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: newPortfolio, error: createError } = (await (supabase as any)
        .from("portfolios")
        .insert({
          user_id: userId,
          name: "My Portfolio",
          name_ar: "محفظتي",
          base_currency: "SAR",
          is_default: true,
        })
        .select("id, user_id, name, name_ar, base_currency, is_default, created_at, updated_at")
        .single()) as { data: any; error: any };

      if (createError) {
        return NextResponse.json({ error: createError.message }, { status: 400 });
      }

      return NextResponse.json({ ...newPortfolio, holdings: [] });
    }

    return NextResponse.json({
      ...portfolio,
      holdings: portfolio.portfolio_holdings || [],
    });
  } catch (error) {
    console.error("Error in GET /api/portfolio:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, name, base_currency } = body;

    const supabase = createServiceClient();
    const userId = user_id || DEMO_USER_ID;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newPortfolio, error } = (await (supabase as any)
      .from("portfolios")
      .insert({
        user_id: userId,
        name: name || "My Portfolio",
        name_ar: "محفظتي",
        base_currency: base_currency || "SAR",
        is_default: false,
      })
      .select("id, user_id, name, name_ar, base_currency, is_default, created_at, updated_at")
      .single()) as { data: any; error: any };

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(newPortfolio, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/portfolio:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
