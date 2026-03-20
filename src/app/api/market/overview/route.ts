import { NextResponse } from "next/server";
import { getMarketSummary, getTopGainers, getTopLosers } from "@/lib/data-sources";

export async function GET() {
  try {
    const [summary, gainers, losers] = await Promise.all([
      getMarketSummary(),
      getTopGainers(),
      getTopLosers(),
    ]);

    return NextResponse.json({
      summary,
      gainers,
      losers,
    });
  } catch (error) {
    console.error("Error fetching market overview:", error);
    return NextResponse.json(
      { error: "Failed to fetch market overview" },
      { status: 500 }
    );
  }
}
