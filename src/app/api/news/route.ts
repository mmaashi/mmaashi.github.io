import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get("locale") || "en";
    const limit = parseInt(searchParams.get("limit") || "20");

    const { data, error } = await supabase
      .from("news")
      .select("*")
      .order("published_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Translate on-the-fly if needed (or return cached translations)
    const translated = data?.map((item) => ({
      ...item,
      title: locale === "ar" ? item.title_ar : locale === "zh" ? item.title_zh : item.title_en,
      body: locale === "ar" ? item.body_ar : locale === "zh" ? item.body_zh : item.body_en,
    }));

    return NextResponse.json(translated || []);
  } catch (error) {
    console.error("Error fetching news:", error);
    return NextResponse.json(
      { error: "Failed to fetch news" },
      { status: 500 }
    );
  }
}
