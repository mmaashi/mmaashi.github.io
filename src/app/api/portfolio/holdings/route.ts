import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { portfolio_id, ticker, company_id, quantity, average_cost, purchase_date } = body;

    if (!portfolio_id || !ticker || quantity === undefined) {
      return NextResponse.json({ error: "portfolio_id, ticker, and quantity are required" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: holding, error } = (await (supabase as any)
      .from("portfolio_holdings")
      .insert({
        portfolio_id,
        ticker,
        company_id: company_id || null,
        quantity,
        average_cost: average_cost || null,
        purchase_date: purchase_date || null,
      })
      .select()
      .single()) as { data: any; error: any };

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(holding, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/portfolio/holdings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, quantity, average_cost, purchase_date } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatePayload: any = {};
    if (quantity !== undefined) updatePayload.quantity = quantity;
    if (average_cost !== undefined) updatePayload.average_cost = average_cost;
    if (purchase_date !== undefined) updatePayload.purchase_date = purchase_date;

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: "At least one field to update is required" }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: holding, error } = (await (supabase as any)
      .from("portfolio_holdings")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single()) as { data: any; error: any };

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(holding);
  } catch (error) {
    console.error("Error in PUT /api/portfolio/holdings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = (await (supabase as any)
      .from("portfolio_holdings")
      .delete()
      .eq("id", id)) as { error: any };

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Holding deleted successfully" });
  } catch (error) {
    console.error("Error in DELETE /api/portfolio/holdings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
