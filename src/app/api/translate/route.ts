import { NextResponse } from "next/server";
import { translate } from "@/lib/translate";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function hashText(text: string): string {
  return Buffer.from(text).toString("base64").slice(0, 64);
}

export async function POST(request: Request) {
  try {
    const { text, targetLanguage, sourceLanguage = "ar" } = await request.json();

    if (!text || !targetLanguage) {
      return NextResponse.json(
        { error: "Missing text or targetLanguage" },
        { status: 400 }
      );
    }

    const textHash = hashText(text);

    // Check cache first
    const { data: cached } = await supabase
      .from("translations_cache")
      .select("translated_text")
      .eq("source_text_hash", textHash)
      .eq("target_language", targetLanguage)
      .single();

    if (cached) {
      return NextResponse.json({ translation: cached.translated_text, cached: true });
    }

    // Translate using AI
    const translation = await translate(text, sourceLanguage, targetLanguage);

    // Cache the result
    await supabase.from("translations_cache").insert({
      source_text_hash: textHash,
      source_language: sourceLanguage,
      target_language: targetLanguage,
      translated_text: translation,
    });

    return NextResponse.json({ translation, cached: false });
  } catch (error) {
    console.error("Error translating:", error);
    return NextResponse.json(
      { error: "Failed to translate" },
      { status: 500 }
    );
  }
}
