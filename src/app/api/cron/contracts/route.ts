import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Verify cron secret (optional but recommended)
  const authHeader = request.headers.get("authorization");

  const supabase = createServiceClient();
  const startTime = Date.now();
  let recordsFound = 0;
  let recordsNew = 0;
  let errors = 0;
  const errorDetails: string[] = [];

  try {
    // 1. Fetch unprocessed contract announcements
    const { data: announcements, error: fetchError } = await (supabase as any)
      .from("company_announcements")
      .select("*")
      .eq("is_contract_related", true)
      .eq("is_processed", false)
      .order("announcement_date", { ascending: false })
      .limit(100);

    if (fetchError) throw new Error(`Fetch error: ${fetchError.message}`);
    if (!announcements || announcements.length === 0) {
      return NextResponse.json({ message: "No unprocessed announcements", recordsFound: 0 });
    }

    recordsFound = announcements.length;

    // 2. Process each announcement into a contract
    for (const ann of announcements) {
      try {
        // Check if contract already exists for this announcement date + ticker
        const { data: existing } = await (supabase as any)
          .from("company_contracts")
          .select("id")
          .eq("ticker", ann.ticker)
          .eq("announcement_date", ann.announcement_date)
          .limit(1);

        if (existing && existing.length > 0) {
          // Already exists, just mark as processed
          await (supabase as any)
            .from("company_announcements")
            .update({ is_processed: true })
            .eq("id", ann.id);
          continue;
        }

        // Parse contract type from title
        const titleLower = (ann.title_en || ann.title_ar || "").toLowerCase();
        let disclosureType = "contract_award";
        if (titleLower.includes("sign") || titleLower.includes("توقيع")) disclosureType = "signed_contract";
        else if (titleLower.includes("extend") || titleLower.includes("تمديد")) disclosureType = "extension";
        else if (titleLower.includes("renew") || titleLower.includes("تجديد")) disclosureType = "renewal";
        else if (titleLower.includes("framework") || titleLower.includes("إطاري")) disclosureType = "framework_agreement";
        else if (titleLower.includes("supply") || titleLower.includes("توريد")) disclosureType = "supply_agreement";
        else if (titleLower.includes("mou") || titleLower.includes("مذكرة")) disclosureType = "mou";

        // Extract value from body
        let contractValue: number | null = null;
        let currency = "SAR";
        let valueDisclosed = false;
        const body = ann.body_en || ann.body_ar || "";
        const valuePatterns = [
          /SAR\s*([\d,\.]+)\s*(billion|million|B|M)/i,
          /([\d,\.]+)\s*(billion|million|B|M)\s*(?:SAR|riyal)/i,
          /(?:بقيمة|بمبلغ)\s*([\d,\.]+)\s*(مليون|مليار)/,
        ];
        for (const pattern of valuePatterns) {
          const match = body.match(pattern);
          if (match) {
            let num = parseFloat(match[1].replace(/,/g, ""));
            const unit = match[2]?.toLowerCase();
            if (unit === "billion" || unit === "b" || unit === "مليار") num *= 1e9;
            else if (unit === "million" || unit === "m" || unit === "مليون") num *= 1e6;
            if (num > 0 && num < 1e12) {
              contractValue = num;
              valueDisclosed = true;
              break;
            }
          }
        }

        // Extract counterparty
        let counterparty: string | null = null;
        const cpPatterns = [
          /(?:with|from|awarded by|signed with)\s+([A-Z][A-Za-z\s&]{3,50}?)(?:\.|,|for|to|valued)/i,
          /(?:مع|من|من قبل)\s+([^\.\,]{3,50})(?:\.|،)/,
        ];
        for (const pattern of cpPatterns) {
          const match = body.match(pattern);
          if (match) { counterparty = match[1].trim(); break; }
        }

        // Determine materiality
        let materialityLabel = "unknown";
        let isMaterial = false;
        if (contractValue) {
          if (contractValue >= 5e9) { materialityLabel = "major"; isMaterial = true; }
          else if (contractValue >= 1e9) { materialityLabel = "meaningful"; isMaterial = true; }
          else if (contractValue >= 200e6) { materialityLabel = "moderate"; isMaterial = false; }
          else { materialityLabel = "minor"; }
        }

        // Insert contract
        const { error: insertError } = await (supabase as any)
          .from("company_contracts")
          .insert({
            company_id: ann.company_id,
            ticker: ann.ticker,
            contract_title_en: ann.title_en || "Untitled Contract",
            contract_title_ar: ann.title_ar,
            disclosure_type: disclosureType,
            counterparty,
            contract_value: contractValue,
            currency,
            value_disclosed: valueDisclosed,
            announcement_date: ann.announcement_date,
            materiality_label: materialityLabel,
            is_material: isMaterial,
            what_happened_en: ann.body_en?.slice(0, 500),
            what_happened_ar: ann.body_ar?.slice(0, 500),
            extraction_confidence: 0.7,
            contract_status: "Active",
          });

        if (insertError) {
          errors++;
          errorDetails.push(`Insert ${ann.ticker}: ${insertError.message}`);
        } else {
          recordsNew++;
        }

        // Mark as processed
        await (supabase as any)
          .from("company_announcements")
          .update({ is_processed: true })
          .eq("id", ann.id);

      } catch (e: any) {
        errors++;
        errorDetails.push(`Process ${ann.ticker}: ${e.message}`);
      }
    }

    // 3. Log the run
    const duration = Date.now() - startTime;
    await (supabase as any)
      .from("contract_ingestion_log")
      .insert({
        source: "cron",
        records_found: recordsFound,
        records_new: recordsNew,
        errors,
        error_details: errorDetails.length > 0 ? errorDetails : null,
        duration_ms: duration,
        status: errors === 0 ? "success" : errors < recordsFound ? "partial" : "failed",
      });

    return NextResponse.json({
      success: true,
      recordsFound,
      recordsNew,
      errors,
      duration: `${duration}ms`,
      errorDetails: errorDetails.length > 0 ? errorDetails : undefined,
    });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
